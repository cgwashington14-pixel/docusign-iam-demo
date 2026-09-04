/* CLM Workflow Troubleshoot — diagnostic wizard, search, TOC */

const CLM_TS_DIAGNOSES = {
  failed: {
    title: "The workflow instance failed",
    pills: [
      { cls: "clm-ts-pill--fail", text: "Failed" },
      { cls: "clm-ts-pill--config", text: "Activity panel" },
    ],
    summary: "A step threw an exception or hit a Failure output. The instance stopped. Do not assume the last human task is the cause — the failing step is usually the next automated step.",
    steps: [
      "Open Admin → Automation Tools → Workflows → Activity. Filter by Workflow Status = Failed (and the workflow name).",
      "Click the instance name to open Execution View. Find the step with a Failure / error state.",
      "Read the Activity Panel error text (connector, missing field, invalid type, XPath, permissions).",
      "Open the same step in Configuration. Check rogue spaces, unpublished changes, and every connector output path.",
      "Fix on a clone if this is production, publish fully (Save → Publish icon → Publish link), then start a new instance. Aborting a failed instance does not resume it mid-stream.",
    ],
    jump: "#errors",
    jumpLabel: "Open the error catalog",
  },
  stuck: {
    title: "The workflow looks stuck",
    pills: [
      { cls: "clm-ts-pill--stuck", text: "Executing" },
      { cls: "clm-ts-pill--config", text: "Human vs engine" },
    ],
    summary: "Stuck almost always means either a human task is waiting, or an automated step is blocked. Pause suspends automation without canceling; abort cancels everything and you restart from the beginning.",
    steps: [
      "On Activity, confirm status is Executing (not Failed). Open Execution View and note the current step type.",
      "If it is a human step (Approval, Choice, Routing, Review Data): check Tasks, assignee/task group, and whether the notification email went to a real CLM user.",
      "If it is automated (connector, XPath, metadata, Find Document): inspect the Activity Panel. Common blockers are missing required fields, bad credentials, or an XPath that returns nothing and has no Failure path.",
      "Pause if you need to inspect without the engine racing ahead. Resume from the current step after the fix, or abort, republish, and restart from the start.",
      "If users need the task removed from their queue, abort is required — pause will not clear the task.",
    ],
    jump: "#diagnose",
    jumpLabel: "Activity panel walkthrough",
  },
  complete: {
    title: "It shows Complete but work did not finish",
    pills: [
      { cls: "clm-ts-pill--stuck", text: "False complete" },
      { cls: "clm-ts-pill--config", text: "Finish step" },
    ],
    summary: "Without a Finish step on the canvas, a workflow that dies mid-path can still report Complete in the activity monitor. Finish is how the engine knows a successful conclusion — and how parent workflows resume.",
    steps: [
      "Open the workflow configuration (not only the instance). Confirm at least one Finish step exists on every successful path.",
      "If Finish is missing, add it, publish fully, and re-test. Failed runs should then show Failure instead of Complete.",
      "Check Workflow Step reports (more granular than Workflow Overview) for the last stage that actually executed.",
      "Enable “Send a notification when workflow encounters an error” on the Start step so the next miss is emailed, not silent.",
    ],
    jump: "#practices",
    jumpLabel: "Best practices",
  },
  routing: {
    title: "Routed to the wrong person or path",
    pills: [
      { cls: "clm-ts-pill--config", text: "Routing" },
      { cls: "clm-ts-pill--xml", text: "Decision / Rule" },
    ],
    summary: "Wrong path is almost always a Decision/Rule condition, a missing connector output (for example no Rejected line), a Routing option list, or stale attribute values used in the condition.",
    steps: [
      "In Execution View, inspect the Decision or Rule step output (Standard vs Non-Standard, True vs False). Compare that to the variable/attribute value at that moment.",
      "If a human Routing or Choice step ran, confirm Options (including dynamic pipe- or comma-delimited lists) and that a Decision follows when the path should change.",
      "Click every connector line. Each prior-step output (Approved, Rejected, Success, Failure, Timed Out, Step Cancelled) needs a destination. A missing Rejected path is a classic silent stall.",
      "If routing uses document attributes, run Find Document immediately before the Decision so you are not evaluating a stale variable.",
      "Confirm assignees are CLM users (or a populated task group). Empty groups and emails that are not in CLM cause tasks to sit unclaimed.",
    ],
    jump: "#routing",
    jumpLabel: "Routing and configuration",
  },
  attribute: {
    title: "Attribute, company, or Params value is wrong",
    pills: [
      { cls: "clm-ts-pill--xml", text: "Attributes" },
      { cls: "clm-ts-pill--config", text: "Params" },
    ],
    summary: "An attribute and a workflow variable are not the same data. They can start equal and then diverge after a human Review Data step. Params is incoming trigger XML — do not overwrite it.",
    steps: [
      "In Execution View, open the document XML and the Params XML. Confirm the node path (attribute group + field) rather than guessing the UI label.",
      "If a user updated metadata during the workflow, insert Find Document to refresh, then Evaluate XPath or the <%#Doc.Group.Field%> notation.",
      "Check Admin attribute field names for trailing spaces — extra spaces on attribute group fields cause mapping steps to fail.",
      "Doc Gen form fields are not attributes until you map them with Update Document Metadata Value. Company/party data lives on party XML or a Company attribute group — not automatically on the document.",
      "Never edit Params in place. Copy to a working XML variable, then Evaluate XPath against Params or the copy.",
    ],
    jump: "#attributes",
    jumpLabel: "Attributes, Params, XML",
  },
  xml: {
    title: "XML, XPath, or schema problem",
    pills: [
      { cls: "clm-ts-pill--xml", text: "XML" },
      { cls: "clm-ts-pill--fail", text: "XPath" },
    ],
    summary: "CLM navigates data as XML nodes. Doc Gen values sit under Params → TemplateFieldData. Schema for that payload only appears after an associated Doc Gen configuration has triggered the workflow once.",
    steps: [
      "Trigger (or use) an empty/test workflow once so TemplateFieldData schema is populated, then copy that schema into the real workflow.",
      "In Evaluate XPath, select the correct source variable (Params, Document, Folder, custom XML). A valid XPath against the wrong variable returns empty.",
      "Use Execution View to copy the live XML and test the path (for example /Params/TemplateFieldData/Department).",
      "For bulk metadata, the Update Document Metadata Value XML method must follow the documented UpdateMetadata schema (PATCH vs PUT). Find Document output is the usual baseline.",
      "If JSON from a connector must become XML (or the reverse), use Convert JSON to XML and watch array nodes that need json:Array='true'.",
    ],
    jump: "#xml",
    jumpLabel: "XML and XPath",
  },
  connector: {
    title: "Connector or provider step failed",
    pills: [
      { cls: "clm-ts-pill--fail", text: "Connector" },
      { cls: "clm-ts-pill--config", text: "Credentials" },
    ],
    summary: "System and provider errors are recorded in the Workflow Activity Panel. Typical causes: connector user permissions, stale credentials, missing required fields (including custom-required fields on the record), and invalid data-type formats.",
    steps: [
      "Read the Activity Panel error exactly — map it to permissions, credentials, missing fields, or data type.",
      "Connections → Connection → Manage Connection: re-enter credentials if needed. Credential changes do not rewrite existing workflow designs.",
      "Confirm the connector user can access every object the step uses.",
      "Add every required field on the connection step, including custom-required fields on the target record.",
      "Match value format to the field type (dates, numbers, picklists). Then republish and run a new instance.",
    ],
    jump: "#errors",
    jumpLabel: "Error catalog",
  },
  escalate: {
    title: "Decide who should own the next step",
    pills: [
      { cls: "clm-ts-pill--ok", text: "Admin" },
      { cls: "clm-ts-pill--config", text: "Developer" },
      { cls: "clm-ts-pill--fail", text: "Support" },
    ],
    summary: "Most customer issues are configuration: publish, spaces, routing lines, assignees, stale attributes. Escalate when the engine misbehaves with a correct design, or when the fix needs custom code / ETL.",
    steps: [
      "Admin / power user: publish, rogue spaces, task assignment, pause/abort, Finish step, connector field mapping, Decision conditions.",
      "Workflow developer: XPath, custom XML payloads, C# expressions, bulk metadata XML, JSON conversion, dynamic routing lists.",
      "Docusign Support (CLM typically requires Premier / Enterprise Premier): platform/engine defects, account-level failures, errors you cannot reproduce after a clean republish. Phone callback is not offered for the CLM category — use the Support Center case.",
      "Professional Services: ETL configuration documents, net-new complex automation, work that needs a statement of work.",
      "Attach workflow name, instance ID, UTC time, step name, Activity Panel text, UAT vs prod, and last publish time.",
    ],
    jump: "#escalate",
    jumpLabel: "Escalation matrix",
  },
};

function clmTsEl(id) {
  return document.getElementById(id);
}

function clmTsSetDiagnosis(key) {
  const data = CLM_TS_DIAGNOSES[key];
  const box = clmTsEl("clm-ts-result");
  if (!data || !box) return;

  document.querySelectorAll(".clm-ts-symptom").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.ts === key);
  });

  const pills = data.pills
    .map((p) => `<span class="clm-ts-pill ${p.cls}">${p.text}</span>`)
    .join("");
  const steps = data.steps.map((s) => `<li>${s}</li>`).join("");

  box.innerHTML = `
    <div class="clm-ts-result-meta">${pills}</div>
    <h3>${data.title}</h3>
    <p>${data.summary}</p>
    <ol class="clm-ts-steps">${steps}</ol>
    <p style="margin:12px 0 0"><a class="btn btn-secondary btn-sm" href="${data.jump}">${data.jumpLabel} →</a></p>
  `;
  box.classList.add("is-open");
  box.hidden = false;
}

function clmTsNorm(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function clmTsSearch(q) {
  const query = clmTsNorm(q);
  const cards = document.querySelectorAll("[data-ts-search]");
  let visible = 0;
  cards.forEach((el) => {
    const hay = clmTsNorm(el.getAttribute("data-ts-search") + " " + el.textContent);
    const show = !query || hay.includes(query);
    el.classList.toggle("clm-ts-hidden", !show);
    if (show) visible += 1;
  });
  const empty = clmTsEl("clm-ts-empty");
  if (empty) empty.classList.toggle("is-visible", Boolean(query) && visible === 0);

  if (query) {
    document.querySelectorAll(".clm-ts-error").forEach((d) => {
      if (!d.classList.contains("clm-ts-hidden")) d.open = true;
    });
  }
}

function clmTsCopy(btn) {
  const target = document.getElementById(btn.getAttribute("data-copy"));
  if (!target) return;
  const text = target.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const prev = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => { btn.textContent = prev; }, 1400);
  }).catch(() => {
    btn.textContent = "Select to copy";
  });
}

function clmTsToc() {
  const links = [...document.querySelectorAll(".clm-ts-toc a")];
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const onScroll = () => {
    const y = window.scrollY + 120;
    let current = sections[0];
    sections.forEach((sec) => {
      if (sec.offsetTop <= y) current = sec;
    });
    links.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + current.id);
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function clmTsInit() {
  document.querySelectorAll(".clm-ts-symptom").forEach((btn) => {
    btn.addEventListener("click", () => clmTsSetDiagnosis(btn.dataset.ts));
  });

  const search = clmTsEl("clm-ts-search");
  if (search) {
    search.addEventListener("input", () => clmTsSearch(search.value));
  }

  document.querySelectorAll(".clm-ts-copy").forEach((btn) => {
    btn.addEventListener("click", () => clmTsCopy(btn));
  });

  const params = new URLSearchParams(location.search);
  const symptom = params.get("symptom");
  if (symptom && CLM_TS_DIAGNOSES[symptom]) clmTsSetDiagnosis(symptom);

  clmTsToc();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", clmTsInit);
} else {
  clmTsInit();
}
