from iamdemo import config

GOV_WORKSPACE_DEMO = {
    "admin_title": "CA EDD Vendor Onboarding — Acme Staffing",
    "participant_name": "Priya Nair",
    "participant_title": "Contracts Officer · California Employment Development Department",
    "manager_email": "priya.nair@edd.ca.gov",
    "agency_name": "California Employment Development Department",
    "agency_short": "EDD",
    "vendor_name": "Acme Staffing Solutions, Inc.",
    "vendor_contact": "Corey Washington",
    "vendor_email": "cwdocusign1@gmail.com",
    "vendor_first": "Corey",
    "vendor_last": "Washington",
    "signer_email": "cwdocusign1@gmail.com",
    "signer_name": "Corey Washington",
    "upload_requests": [
        {
            "name": "Certificate of Insurance (GL + Workers’ Comp)",
            "description": "Upload current GL ($1M/$2M) and Workers’ Compensation certificates naming California EDD as certificate holder.",
            "recipient": "Corey Washington",
            "status": "Draft",
        },
        {
            "name": "Payee Data Record (STD 204) + W-9",
            "description": "Upload completed DGS STD 204 Payee Data Record and IRS Form W-9 for EDD vendor setup.",
            "recipient": "Corey Washington",
            "status": "Draft",
        },
        {
            "name": "Business license / FTB Form 590",
            "description": "Upload California business license (or equivalent) and FTB Form 590 Withholding Exemption Certificate if applicable.",
            "recipient": "Corey Washington",
            "status": "Draft",
        },
    ],
    "countersigner_email": config.DEMO_COUNTERSIGNER_EMAIL,
    "countersigner_name": config.DEMO_COUNTERSIGNER_NAME,
    "participant_tasks": [
        {
            "type": "sign",
            "title": "EDD Vendor Services Agreement — Acme Staffing.pdf",
            "sender": "Priya Nair · EDD Contracts",
            "date": "8/19/2026",
            "status": "Needs Corey Washington, then Cole Mitchell",
            "cta": "Sign",
        },
        {
            "type": "sign",
            "title": "EDD Confidentiality & Data Sharing NDA.pdf",
            "sender": "Priya Nair · EDD Contracts",
            "date": "8/19/2026",
            "status": "Needs Corey Washington, then Cole Mitchell",
            "cta": "Sign",
        },
        {
            "type": "sign",
            "title": "EDD Worker Classification Acknowledgment.pdf",
            "sender": "Priya Nair · EDD Contracts",
            "date": "8/19/2026",
            "status": "Needs Corey Washington, then Cole Mitchell",
            "cta": "Sign",
        },
    ],
    "doc_specs": [
        {
            "key": "vendor",
            "filename": "EDD_Vendor_Services_Agreement.pdf",
            "label": "EDD Vendor Services Agreement",
            "hub": True,
        },
        {
            "key": "nda",
            "filename": "EDD_Confidentiality_Data_Sharing_NDA.pdf",
            "label": "EDD Confidentiality & Data Sharing NDA",
        },
        {
            "key": "employment",
            "filename": "EDD_Worker_Classification_Acknowledgment.pdf",
            "label": "EDD Worker Classification Acknowledgment",
        },
    ],
    "date_anchor": "Vendor Effective Date:",
    "email_subject_prefix": "CA EDD",
    "pack_name": "CA EDD Vendor Onboarding Pack",
    "use_case": "edd",
}


GOV_STATE_BAR_DEMO = {
    "admin_title": "CA State Bar — Attorney Oath Card Submission",
    "participant_name": "Jordan Lee",
    "participant_title": "Admissions Officer · State Bar of California",
    "manager_email": "admissions@calbar.ca.gov",
    "agency_name": "State Bar of California",
    "agency_short": "State Bar",
    "agency_tagline": "Attorney Oath Card Hub",
    "vendor_name": "Attorney Applicant",
    "vendor_contact": "Corey Washington",
    "vendor_email": "cwdocusign1@gmail.com",
    "vendor_first": "Corey",
    "vendor_last": "Washington",
    "signer_email": "cwdocusign1@gmail.com",
    "signer_name": "Corey Washington",
    "countersigner_email": config.DEMO_COUNTERSIGNER_EMAIL,
    "countersigner_name": config.DEMO_COUNTERSIGNER_NAME,
    "upload_requests": [
        {
            "name": "Printed & wet-signed Attorney’s Oath Card (scan/PDF)",
            "description": "Upload a clear scan or photo of the printed Attorney’s Oath Card with wet-ink signature. Ensure the full card is visible and legible.",
            "recipient": "Corey Washington",
            "status": "Draft",
        },
        {
            "name": "Application for Admission (supporting packet)",
            "description": "Upload your completed Application for Admission packet and any supporting Admissions materials requested by the State Bar.",
            "recipient": "Corey Washington",
            "status": "Draft",
        },
        {
            "name": "Government-issued photo ID",
            "description": "Upload a clear scan or photo of a current government-issued photo ID (driver license or passport). Name must match your Admissions record.",
            "recipient": "Corey Washington",
            "status": "Draft",
        },
    ],
    "participant_tasks": [
        {
            "type": "sign",
            "title": "California Attorney’s Oath Card — Acknowledgment.pdf",
            "sender": "Jordan Lee · State Bar Admissions",
            "date": "8/19/2026",
            "status": "Needs Corey Washington, then Cole Mitchell",
            "cta": "Sign",
        },
        {
            "type": "sign",
            "title": "Application for Admission — Cover Sheet.pdf",
            "sender": "Jordan Lee · State Bar Admissions",
            "date": "8/19/2026",
            "status": "Needs Corey Washington, then Cole Mitchell",
            "cta": "Sign",
        },
        {
            "type": "sign",
            "title": "Moral Character Certification Affirmation.pdf",
            "sender": "Jordan Lee · State Bar Admissions",
            "date": "8/19/2026",
            "status": "Needs Corey Washington, then Cole Mitchell",
            "cta": "Sign",
        },
    ],
    "doc_specs": [
        {
            "key": "oath",
            "filename": "CA_Attorney_Oath_Card_Acknowledgment.pdf",
            "label": "California Attorney’s Oath Card — Acknowledgment",
            "hub": True,
            "date_anchor": "Oath Effective Date:",
        },
        {
            "key": "bar_app",
            "filename": "CA_Application_for_Admission_Cover_Sheet.pdf",
            "label": "Application for Admission — Cover Sheet",
            "date_anchor": "Application Date:",
        },
        {
            "key": "bar_moral",
            "filename": "CA_Moral_Character_Certification_Affirmation.pdf",
            "label": "Moral Character Certification Affirmation",
            "date_anchor": "Certification Date:",
        },
    ],
    "date_anchor": "Oath Effective Date:",
    "email_subject_prefix": "CA State Bar",
    "pack_name": "CA State Bar Oath Card Pack",
    "use_case": "state_bar",
}


HAP_CASE_ID = "HAP-2026-014"


HAP_WORKSPACE_NAME = f"{HAP_CASE_ID} · Housing Assistance"


HAP_AUTOMATION_PREFERRED = ("HR Offer Letter", "AV1")


HAP_AGENT_STUDIO_PROMPT = (
    f"You are the California HCD Housing Assistance orchestrator for {HAP_CASE_ID}. "
    "When the program opens, run four specialist lanes: HR case-worker onboarding, "
    "procurement emergency lodging (Pacific Stay, $1.2M), inter-agency MOU "
    "(HCD · CalOES · Sacramento County), and resident assistance (CASE-2026-00981). "
    "Ground every draft in CalHR, DGS, and HCD playbooks. Keep the case ID on every "
    f"envelope. Primary signer: {config.DEMO_SIGNER_EMAIL}. "
    f"Countersigner: {config.DEMO_COUNTERSIGNER_EMAIL}."
)


DOCUSIGN_AUTOMATIONS_URL = "https://apps-d.docusign.com/send"


GOV_HAP_WORKSPACE_DEMO = {
    "admin_title": HAP_WORKSPACE_NAME,
    "participant_name": "Elena Vasquez",
    "participant_title": "Program Officer · California HCD Housing Assistance",
    "manager_email": "elena.vasquez@hcd.ca.gov",
    "agency_name": "California Department of Housing and Community Development",
    "agency_short": "HCD",
    "agency_tagline": "Housing Assistance Program Hub",
    "vendor_name": "Housing Assistance Program",
    "vendor_contact": "Corey Washington",
    "vendor_email": "cwdocusign1@gmail.com",
    "vendor_first": "Corey",
    "vendor_last": "Washington",
    "signer_email": "cwdocusign1@gmail.com",
    "signer_name": "Corey Washington",
    "countersigner_email": config.DEMO_COUNTERSIGNER_EMAIL,
    "countersigner_name": config.DEMO_COUNTERSIGNER_NAME,
    "upload_requests": [
        {
            "name": "Case worker appointment / I-9 packet",
            "description": "Upload the CalHR appointment letter and completed I-9 for the HAP Case Worker II assignment.",
            "recipient": "Corey Washington",
            "status": "Draft",
        },
        {
            "name": "Pacific Stay hotel insurance certificate",
            "description": "Upload current GL and lodging liability certificates naming HCD HAP-2026-014 as certificate holder.",
            "recipient": "Corey Washington",
            "status": "Draft",
        },
        {
            "name": "Resident photo ID + income attestation",
            "description": "Upload government-issued photo ID and income documentation for CASE-2026-00981.",
            "recipient": "Corey Washington",
            "status": "Draft",
        },
    ],
    "participant_tasks": [
        {
            "type": "sign",
            "title": "HAP Case Worker Onboarding Packet.pdf",
            "sender": "Elena Vasquez · HCD HAP",
            "date": "8/19/2026",
            "status": "Needs Corey Washington, then Cole Mitchell",
            "cta": "Sign",
        },
        {
            "type": "sign",
            "title": "HAP Emergency Lodging Agreement.pdf",
            "sender": "Elena Vasquez · HCD HAP",
            "date": "8/19/2026",
            "status": "Needs Corey Washington, then Cole Mitchell",
            "cta": "Sign",
        },
        {
            "type": "sign",
            "title": "HAP Inter-Agency Memorandum of Understanding.pdf",
            "sender": "Elena Vasquez · HCD HAP",
            "date": "8/19/2026",
            "status": "Needs Corey Washington, then Cole Mitchell",
            "cta": "Sign",
        },
    ],
    "doc_specs": [
        {
            "key": "hap_hr",
            "filename": "HAP_Case_Worker_Onboarding.pdf",
            "label": "HAP Case Worker Onboarding Packet",
            "hub": True,
            "date_anchor": "Effective Date:",
        },
        {
            "key": "hap_vendor",
            "filename": "HAP_Emergency_Lodging_Agreement.pdf",
            "label": "HAP Emergency Lodging Agreement",
            "date_anchor": "Effective Date:",
        },
        {
            "key": "hap_mou",
            "filename": "HAP_Interagency_MOU.pdf",
            "label": "HAP Inter-Agency Memorandum of Understanding",
            "date_anchor": "Effective Date:",
        },
        {
            "key": "hap_resident",
            "filename": "HAP_Housing_Assistance_Agreement.pdf",
            "label": "HAP Housing Assistance Agreement",
            "date_anchor": "Effective Date:",
        },
    ],
    "date_anchor": "Effective Date:",
    "email_subject_prefix": HAP_CASE_ID,
    "pack_name": "HAP-2026-014 Housing Assistance Pack",
    "use_case": "hap",
}


WORKSPACE_USE_CASES = {
    "edd": GOV_WORKSPACE_DEMO,
    "state_bar": GOV_STATE_BAR_DEMO,
    "hap": GOV_HAP_WORKSPACE_DEMO,
}
