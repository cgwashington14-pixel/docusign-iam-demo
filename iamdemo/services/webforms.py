import re
import time
from datetime import date, datetime, timedelta

from iamdemo import config
from iamdemo.services.docusign import ds_get, ds_post, webforms_base


def parse_webforms(data):
    """Normalize Web Forms list responses."""
    if not isinstance(data, dict):
        return []
    for key in ("items", "forms", "data"):
        items = data.get(key)
        if isinstance(items, list):
            return items
    return []


WEBFORM_SKIP_TYPES = {
    "root",
    "view",
    "step",
    "summary",
    "esignaction",
    "thankyou",
    "text_block",
    "image",
    "submit",
    "datesigned",
    "signature",
    "welcome",
    "formsubmitaction",
    "section",
    "textdescription",
}


WEBFORM_FILLABLE_TYPES = {
    "textbox",
    "email",
    "phonenumber",
    "number",
    "date",
    "select",
    "radiobuttongroup",
    "checkboxgroup",
    "dropdown",
    "textarea",
    "checkbox",
    "radio",
}


def extract_webform_fields(data):
    """Extract pre-fillable fields from a Web Forms definition.

    formValues must use componentName (e.g. hrFullName), not componentKey
    (e.g. TextBox_8Y2kIItB).
    """
    fields = []
    seen = set()

    def add_field(name, label, comp_type, required=False):
        if not name or name in seen:
            return
        if comp_type in WEBFORM_SKIP_TYPES:
            return
        seen.add(name)
        fields.append(
            {
                "name": name,
                "label": label or name,
                "type": comp_type or "text",
                "required": required,
            }
        )

    # Legacy array format
    for comp in data.get("components") or data.get("formProperties", {}).get("components") or []:
        if not isinstance(comp, dict):
            continue
        name = comp.get("name") or comp.get("fieldName") or comp.get("label") or ""
        comp_type = (comp.get("type") or "").lower()
        add_field(name, comp.get("label") or name, comp_type, comp.get("required", False))

    # Web Forms v1.1 object map under formContent.components
    components = data.get("formContent", {}).get("components", {})
    if isinstance(components, dict):
        for key, comp in components.items():
            if not isinstance(comp, dict):
                continue
            comp_type = (comp.get("componentType") or comp.get("type") or "").lower()
            simple_type = comp.get("type")
            if comp_type in WEBFORM_FILLABLE_TYPES or simple_type in ("TextBox", "Email", "Number", "Date", "Select"):
                # Prefer componentName — that is what formValues expects
                name = comp.get("componentName") or comp.get("name") or comp.get("componentKey") or key
                label = comp.get("label") or comp.get("text") or name
                field = {
                    "name": name,
                    "label": label,
                    "type": comp_type or (simple_type or "text").lower(),
                    "required": comp.get("required", False),
                }
                options = comp.get("options") or comp.get("items") or []
                if isinstance(options, list) and options:
                    field["options"] = [
                        {
                            "value": (o.get("value") or o.get("label") or ""),
                            "label": (o.get("label") or o.get("value") or ""),
                        }
                        for o in options
                        if isinstance(o, dict)
                    ]
                if not name or name in seen or (comp_type or "").lower() in WEBFORM_SKIP_TYPES:
                    continue
                seen.add(name)
                fields.append(field)

    return fields


def webform_display_name(form):
    """Human-readable Web Form title from list/detail payloads."""
    if not isinstance(form, dict):
        return ""
    props = form.get("formProperties") or {}
    return (props.get("name") or form.get("name") or "").strip()


def find_preferred_webform(forms, preferred=None):
    """Pick the demo Web Form — defaults to Training/Travel Request Form."""
    if not forms:
        return None
    needle = (preferred or config.DEMO_WEBFORM_NAME or "Training/Travel Request Form").lower()
    for f in forms:
        if needle in webform_display_name(f).lower():
            return f
    # Prefer published/enabled forms with a small field set when preferred is missing
    for f in forms:
        if f.get("isPublished", True) and f.get("isEnabled", True):
            return f
    return forms[0]


def _pick_option(options, *candidates):
    """Choose the select/radio option matching the first candidate label (case-insensitive)."""
    if not options:
        return candidates[0] if candidates else "Yes"
    labels = [(o.get("value") or o.get("label") or "") for o in options if isinstance(o, dict)]
    for cand in candidates:
        for opt in labels:
            if opt.lower() == cand.lower():
                return opt
    return labels[0] if labels else (candidates[0] if candidates else "Yes")


def build_webform_sample_prefill(fields, user_name=None, user_email=None):
    """Map form fields to demo values so a sample launch arrives pre-filled."""
    presenter = (user_name or config.DEMO_SIGNER_NAME or "Corey Washington").strip()
    presenter_email = (user_email or config.DEMO_SIGNER_EMAIL or "cwdocusign1@gmail.com").strip()
    hire_name = config.DEMO_WEBFORM_HIRE_NAME
    hire_email = config.DEMO_WEBFORM_HIRE_EMAIL
    manager_name = getattr(config, "DEMO_WEBFORM_MANAGER_NAME", None) or "Maria Santos"
    manager_email = getattr(config, "DEMO_WEBFORM_MANAGER_EMAIL", None) or "maria.santos@cdt.ca.gov"
    first, _, last = presenter.partition(" ")
    last = last or first
    today = date.today()
    end = today + timedelta(days=2)
    begin_str = today.isoformat()
    end_str = end.isoformat()

    values = {}
    for field in fields or []:
        name = (field.get("name") or "").strip()
        if not name:
            continue
        label = (field.get("label") or name).strip()
        key = f"{name} {label}".lower().replace("_", " ").replace("-", " ").replace("/", " ")
        ftype = (field.get("type") or "").lower()
        options = field.get("options") or []

        # Travel / training request form
        if "requestor" in key or "requester" in key:
            values[name] = presenter_email if ("email" in key or ftype == "email") else presenter
        elif "department head" in key or "dept head" in key or "supervisor" in key:
            values[name] = manager_email if ("email" in key or ftype == "email") else manager_name
        elif "remark" in key:
            values[name] = "Demo travel request for agreement-workflow training."
        elif "conference" in key or "seminar" in key or "course" in key or ("training" in key and "title" in key):
            values[name] = "Docusign IAM Public Sector Summit"
        elif "locatio" in key or key.strip() == "location" or "location" in key:
            values[name] = "Sacramento, CA"
        elif "begin date" in key or "start date" in key:
            values[name] = begin_str
        elif "end date" in key:
            values[name] = end_str
        elif "registration" in key and ("expense" in key or "cost" in key or "fee" in key):
            values[name] = "325.00" if ftype in ("textbox", "text", "") else 325
        elif "lodging" in key:
            values[name] = 450 if ftype == "number" else "450.00"
        elif "meal" in key:
            values[name] = 180 if ftype == "number" else "180.00"
        elif "amount requested" in key or ("amount" in key and "request" in key):
            values[name] = "955.00"
        elif (
            "advance" in key
            and ("expense" in key or "money" in key or "required" in key)
            or "council" in key
            and "approval" in key
        ):
            values[name] = _pick_option(options, "No", "Yes")
        elif "payment option" in key:
            values[name] = "Agency P-Card"
        elif "newhire" in key.replace(" ", "") or ("new hire" in key) or ("candidate" in key):
            values[name] = hire_email if ("email" in key or ftype == "email") else hire_name
        elif (
            "hr" in key.split()
            or key.startswith("hr ")
            or "hrfull" in key.replace(" ", "")
            or "hremail" in key.replace(" ", "")
        ) and "department head" not in key:
            values[name] = presenter_email if ("email" in key or ftype == "email") else presenter
        elif ftype == "email" or ("email" in key and "approval" not in key):
            values[name] = presenter_email
        elif any(t in key for t in ("first name", "firstname", "given")):
            values[name] = first
        elif any(t in key for t in ("last name", "lastname", "surname", "family")):
            values[name] = last
        elif (
            any(t in key for t in ("full name", "employee name", "signer name", "affiant", "applicant", "vendor name"))
            or key.strip() in ("name",)
            or name.lower()
            in (
                "name",
                "signer_name",
                "emp_name",
                "employee_name",
                "requestor_name",
            )
        ):
            values[name] = presenter
        elif "case" in key or "badge" in key or "mrn" in key or "applicant id" in key:
            values[name] = "CASE-2026-00981"
        elif "agency" in key:
            values[name] = "California Department of Technology"
        elif "job title" in key or key.strip() == "job title":
            values[name] = "Program Analyst"
        elif "division" in key or ("department" in key and "head" not in key):
            values[name] = "Human Resources"
        elif "program" in key and "type" not in key:
            values[name] = "Housing Assistance"
        elif ftype == "date" or key.strip() == "date" or name.lower() == "date":
            values[name] = begin_str
        elif ftype == "number":
            if "lodging" in key:
                values[name] = 450
            elif "meal" in key:
                values[name] = 180
            elif "registration" in key:
                values[name] = 325
            elif "amount" in key:
                values[name] = 955
        elif ftype == "select" and options:
            values[name] = _pick_option(options, "No", "Yes")
        elif field.get("required") and ftype in ("textbox", "text", ""):
            if "amount" in key or "expense" in key:
                values[name] = "250.00"
            elif len(values) < 10 and "name" in key:
                values[name] = presenter

    return values


def coerce_webform_form_values(fields, values):
    """Coerce prefill values to types Web Forms API expects (numbers, ISO dates)."""
    if not values:
        return {}
    type_by_name = {(f.get("name") or ""): (f.get("type") or "").lower() for f in (fields or []) if f.get("name")}
    out = {}
    for key, raw in values.items():
        if raw is None or raw == "":
            continue
        ftype = type_by_name.get(key, "")
        if ftype == "number":
            try:
                num = float(str(raw).replace(",", "").strip())
                out[key] = int(num) if num.is_integer() else num
            except (TypeError, ValueError):
                continue
        elif ftype == "date":
            text = str(raw).strip()
            # Accept MM/DD/YYYY from the demo UI and convert to yyyy-MM-dd
            if re.match(r"^\d{1,2}/\d{1,2}/\d{4}$", text):
                try:
                    out[key] = datetime.strptime(text, "%m/%d/%Y").date().isoformat()
                    continue
                except ValueError:
                    pass
            out[key] = text
        else:
            out[key] = raw if not isinstance(raw, (int, float)) else raw
            if (
                isinstance(raw, (int, float))
                and ftype in ("textbox", "text", "email", "")
                or not isinstance(raw, (int, float, bool))
            ):
                out[key] = str(raw)
    return out


def webform_instance_url(inst):
    """Build a launchable Web Form URL from createInstance response."""
    url = inst.get("formUrl") or ""
    token = inst.get("instanceToken") or ""
    if url and token and "instanceToken=" not in url:
        sep = "#" if "#" not in url else "&" if "?" in url else "#"
        if sep == "#":
            return f"{url}#instanceToken={token}"
    return url


def create_webform_instance(token, form_id, prefill=None, client_user_id=None, expiration_offset=60, return_url=None):
    """Shared create-instance helper for page + API routes."""
    # Load field metadata first so we can coerce number/date values correctly
    form_name = ""
    fields = []
    code2, detail = ds_get(f"/forms/{form_id}?state=active", token=token, base=webforms_base())
    if code2 == 200:
        form_name = webform_display_name(detail)
        fields = extract_webform_fields(detail)

    coerced = coerce_webform_form_values(fields, prefill or {})
    instance_body = {
        "clientUserId": (client_user_id or f"portal-{int(time.time())}").strip(),
        "formValues": coerced,
        "expirationOffset": expiration_offset,
    }
    if return_url:
        instance_body["returnUrl"] = return_url
    code, inst = ds_post(f"/forms/{form_id}/instances", instance_body, token=token, base=webforms_base())
    form_url = webform_instance_url(inst) if code in (200, 201) else None
    return code, inst, form_url, form_name, fields


def webform_launch_payload(form_id, form_name, form_url, inst, prefill=None, fields=None):
    """Normalize launch fields for the portal embed (Docusign JS + fallback)."""
    base_url = (inst or {}).get("formUrl") or ""
    if not base_url and form_url:
        base_url = form_url.split("#", 1)[0]
    return {
        "formUrl": form_url,
        "formUrlBase": base_url,
        "instanceToken": (inst or {}).get("instanceToken") or "",
        "formId": form_id,
        "formName": form_name,
        "prefill": prefill or {},
        "fields": fields or [],
        "instance": inst,
    }
