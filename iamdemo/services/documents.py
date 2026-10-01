import base64
from datetime import UTC, datetime

from iamdemo import config


def doc_templates():
    return {
        "msa": {
            "title": "Master Service Agreement",
            "short": "MSA",
            "sections": [
                (
                    "Parties",
                    'This Master Service Agreement ("Agreement") is entered into as of {date} between the California Department of Technology, a California state agency ("Agency"), and the Vendor identified in the signature block below ("Vendor").',
                ),
                (
                    "Scope of Services",
                    'Vendor agrees to provide the services described in any Statement of Work ("SOW") executed under this Agreement. Each SOW is incorporated herein by reference and shall be governed by the terms of this Agreement.',
                ),
                (
                    "Term",
                    "This Agreement commences on the Effective Date and continues for a period of three (3) years, unless earlier terminated in accordance with Section 8. SOWs may extend beyond the Agreement term only if expressly stated therein.",
                ),
                (
                    "Compensation",
                    "Agency shall pay Vendor the fees set forth in each SOW within thirty (30) days of receipt of a correct invoice. All invoices must reference the applicable SOW number and purchase order.",
                ),
                (
                    "Confidentiality",
                    "Each party agrees to hold the other party's Confidential Information in strict confidence and not to disclose it to third parties without prior written consent, except as required by applicable law or court order.",
                ),
                (
                    "Intellectual Property",
                    "All work product, deliverables, and materials created by Vendor specifically for Agency under any SOW shall be considered work made for hire and shall be the sole property of Agency upon full payment.",
                ),
                (
                    "Warranties",
                    "Vendor warrants that (a) all services will be performed in a professional and workmanlike manner; (b) Vendor has the right to enter into this Agreement; and (c) the services will not infringe any third-party intellectual property rights.",
                ),
                (
                    "Termination",
                    "Either party may terminate this Agreement or any SOW for convenience upon thirty (30) days written notice. Agency may terminate immediately for cause if Vendor materially breaches any term and fails to cure such breach within ten (10) days of notice.",
                ),
                (
                    "Governing Law",
                    "This Agreement shall be governed by the laws of the State of California without regard to its conflict of law provisions. Disputes shall be resolved in Sacramento County, California.",
                ),
                (
                    "Signatures",
                    "The parties have executed this Agreement as of the date first written above.\n\nAGENCY: California Department of Technology\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Authorized Representative\n\nVENDOR:\n\nBy: ___________________________     Date: ___________\nName:\nTitle:",
                ),
            ],
        },
        "nda": {
            "title": "Non-Disclosure Agreement",
            "short": "NDA",
            "sections": [
                (
                    "Parties",
                    'This Non-Disclosure Agreement ("Agreement") is entered into as of {date} between the California Department of Technology ("Disclosing Party") and the recipient identified in the signature block below ("Receiving Party").',
                ),
                (
                    "Purpose",
                    'The parties wish to explore a potential business relationship ("Purpose"). In connection with the Purpose, the Disclosing Party may disclose certain confidential and proprietary information to the Receiving Party.',
                ),
                (
                    "Definition of Confidential Information",
                    '"Confidential Information" means any non-public information disclosed by the Disclosing Party, whether orally, in writing, or by any other means, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure.',
                ),
                (
                    "Obligations",
                    "The Receiving Party shall (a) hold all Confidential Information in strict confidence; (b) not disclose Confidential Information to any third party without prior written consent; (c) use Confidential Information solely for the Purpose; and (d) protect Confidential Information using at least the same degree of care used to protect its own confidential information.",
                ),
                (
                    "Exclusions",
                    "Confidential Information does not include information that (a) is or becomes publicly known through no breach by the Receiving Party; (b) was rightfully known before disclosure; (c) is independently developed without use of Confidential Information; or (d) is required to be disclosed by law.",
                ),
                (
                    "Term",
                    "This Agreement shall remain in effect for two (2) years from the Effective Date. The confidentiality obligations shall survive termination for an additional three (3) years.",
                ),
                (
                    "Return of Information",
                    "Upon request, the Receiving Party shall promptly return or destroy all Confidential Information and certify in writing that it has done so.",
                ),
                (
                    "Signatures",
                    "The parties have executed this Agreement as of the date first written above.\n\nVendor Effective Date: ____\n\nDISCLOSING PARTY — CALIFORNIA EDD:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Authorized Representative\n\nRECEIVING PARTY (VENDOR):\n\nBy: ___     Date: ___________\nName:\nTitle:",
                ),
            ],
        },
        "mou": {
            "title": "Memorandum of Understanding",
            "short": "MOU",
            "sections": [
                (
                    "Purpose",
                    'This Memorandum of Understanding ("MOU") is entered into as of {date} between the California Department of Technology ("Agency") and the Partner Agency identified below, to set forth the terms of collaboration on a joint initiative of mutual benefit.',
                ),
                (
                    "Background",
                    "The parties have identified a shared interest in improving public services through coordinated action. This MOU formalizes the intent to collaborate and establishes a framework for the partnership.",
                ),
                (
                    "Scope of Collaboration",
                    "The parties agree to collaborate on the following activities: (a) sharing of relevant data and resources; (b) coordinating program delivery where appropriate; (c) conducting joint outreach and communications; and (d) reporting jointly on outcomes as agreed.",
                ),
                (
                    "Roles and Responsibilities",
                    "Each party shall designate a primary point of contact. The parties shall meet at least quarterly to review progress. Decisions requiring commitment of resources beyond those described herein require written amendment to this MOU.",
                ),
                (
                    "Funding",
                    "This MOU does not obligate either party to expend funds beyond those separately authorized. Any cost-sharing arrangement shall be set forth in a separate written agreement.",
                ),
                (
                    "Term and Termination",
                    "This MOU is effective upon signature of both parties and remains in effect for one (1) year, with the option to renew by mutual written agreement. Either party may withdraw upon thirty (30) days written notice.",
                ),
                (
                    "No Legal Partnership",
                    "This MOU does not create a legal partnership, joint venture, or agency relationship between the parties. Neither party may bind the other to any obligation without express written authority.",
                ),
                (
                    "Signatures",
                    "The parties have signed this MOU as of the date first written above.\n\nSTATE OF CALIFORNIA:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Authorized Representative\n\nPARTNER AGENCY:\n\nBy: ___________________________     Date: ___________\nName:\nTitle:",
                ),
            ],
        },
        "grant": {
            "title": "Grant Agreement",
            "short": "Grant",
            "sections": [
                (
                    "Award",
                    'This Grant Agreement ("Agreement") is entered into as of {date} between the California Department of General Services Office of Grants Management ("Grantor") and the Recipient identified in the signature block below ("Recipient"). Grantor hereby awards a grant in the amount specified in Exhibit A.',
                ),
                (
                    "Purpose of Grant",
                    "The grant funds shall be used solely for the purposes described in Recipient's approved application, which is incorporated herein by reference. Any change in scope requires prior written approval from Grantor.",
                ),
                (
                    "Performance Period",
                    "The performance period commences on the Effective Date and ends as specified in Exhibit A. No funds may be expended after the end date without written approval.",
                ),
                (
                    "Reporting Requirements",
                    "Recipient shall submit quarterly progress reports no later than fifteen (15) days after the close of each quarter. A final performance report is due within sixty (60) days of the end of the performance period.",
                ),
                (
                    "Financial Management",
                    "Recipient shall maintain complete and accurate financial records for all grant expenditures for a period of five (5) years following the end of the performance period. Grantor may audit Recipient's books and records upon reasonable notice.",
                ),
                (
                    "Allowable Costs",
                    "Only costs that are reasonable, necessary, allocable, and allowable under applicable federal and state guidelines may be charged to this grant. Recipient shall obtain prior written approval for any budget modification exceeding 10% of any line item.",
                ),
                (
                    "Non-Discrimination",
                    "Recipient shall comply with all applicable federal, state, and local non-discrimination laws and shall not discriminate in the delivery of services funded under this Agreement.",
                ),
                (
                    "Signatures",
                    "The parties have executed this Agreement as of the date first written above.\n\nGRANTOR: State of California\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Grants Manager\n\nRECIPIENT:\n\nBy: ___________________________     Date: ___________\nName:\nTitle:",
                ),
            ],
        },
        "vendor": {
            "title": "Vendor Agreement",
            "short": "Vendor",
            "sections": [
                (
                    "Agreement",
                    'This Vendor Agreement ("Agreement") is entered into as of {date} between the California Employment Development Department ("EDD" or "State") and the Vendor identified in the signature block below ("Vendor").',
                ),
                (
                    "Products and Services",
                    "Vendor agrees to provide staffing and related services described in the attached Statement of Work, which is incorporated by reference. Vendor shall deliver all services in accordance with the specifications and timeline set forth therein.",
                ),
                (
                    "Pricing and Payment",
                    "State shall pay Vendor the rates listed in the Statement of Work within forty-five (45) days of receipt and acceptance of services and a correct invoice. All prices are firm and include applicable taxes.",
                ),
                (
                    "Delivery and Acceptance",
                    "Services are subject to EDD acceptance. State reserves the right to reject any services that do not conform to specifications. Non-conforming work must be corrected at Vendor's expense within five (5) business days.",
                ),
                (
                    "Insurance",
                    "Vendor shall maintain commercial general liability insurance with limits of at least $1,000,000 per occurrence and $2,000,000 aggregate, Workers' Compensation as required by law, and shall provide EDD with certificates of insurance upon request.",
                ),
                (
                    "Indemnification",
                    "Vendor shall defend, indemnify, and hold harmless State and its officers, employees, and agents from any claims, damages, or expenses arising from Vendor's performance under this Agreement.",
                ),
                (
                    "Compliance",
                    "Vendor shall comply with all applicable federal, state, and local laws, including but not limited to the California Government Code, EDD contracting rules, and all applicable labor and employment laws.",
                ),
                (
                    "Signatures",
                    "The parties have executed this Agreement as of the date first written above.\n\nVendor Effective Date: ____\n\nSTATE OF CALIFORNIA — EMPLOYMENT DEVELOPMENT DEPARTMENT:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Contracts Officer\n\nVENDOR:\n\nBy: ___     Date: ___________\nName:\nTitle:",
                ),
            ],
        },
        "employment": {
            "title": "Employment Offer Letter",
            "short": "Offer",
            "sections": [
                (
                    "Offer of Employment",
                    'This Employment Offer Letter ("Offer") is issued as of {date} by the California Department of Human Resources (CalHR). On behalf of the State, we are pleased to offer you a position as described herein, subject to the conditions set forth below.',
                ),
                (
                    "Position and Start Date",
                    "Position: As specified during your interview process. Department: As assigned. Start Date: As agreed with your hiring manager. This is a full-time, regular position subject to California civil service rules.",
                ),
                (
                    "Compensation",
                    "Your starting base salary will be as communicated by HR and is subject to standard State of California pay practices. Compensation is reviewed annually as part of the State's performance appraisal process.",
                ),
                (
                    "Benefits",
                    "You will be eligible for the State of California benefits package, including health, dental, and vision insurance, participation in the California Public Employees' Retirement System (CalPERS), paid vacation, sick leave, and all State-observed holidays.",
                ),
                (
                    "Conditions of Employment",
                    "This offer is contingent upon (a) successful completion of a background check; (b) verification of your eligibility to work in the United States; and (c) any other conditions communicated by Human Resources.",
                ),
                (
                    "At-Will Employment",
                    "Except as otherwise provided by State policy or civil service rules, your employment is at-will and may be terminated by either party at any time, with or without cause.",
                ),
                (
                    "Acceptance",
                    "Please sign and return this letter by the date specified by HR to confirm your acceptance of this offer. By signing below, you acknowledge that you have read and understood the terms set forth herein.",
                ),
                (
                    "Signatures",
                    "Accepted and agreed:\n\nSTATE OF CALIFORNIA:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: HR Director\n\nEMPLOYEE:\n\nBy: ___________________________     Date: ___________\nName:\nPrinted Name:",
                ),
            ],
        },
        "oath": {
            "title": "California Attorney's Oath Card — Acknowledgment",
            "short": "Oath Card",
            "sections": [
                (
                    "Purpose",
                    'This Attorney\'s Oath Card Acknowledgment ("Acknowledgment") is issued as of {date} by the State Bar of California ("State Bar") for applicants and attorneys completing oath card submission.',
                ),
                (
                    "Oath of Attorney",
                    "I solemnly swear (or affirm) that I will support the Constitution of the United States and the Constitution of the State of California, and that I will faithfully discharge the duties of an attorney and counselor at law to the best of my knowledge and ability.",
                ),
                (
                    "Electronic Acknowledgment",
                    "By signing below, the attorney acknowledges the California Attorney's Oath, agrees to complete any required wet-ink oath card if instructed by the State Bar, and certifies that the information provided for this submission is true and correct.",
                ),
                (
                    "Submission Instructions",
                    "After e-signing this Acknowledgment, upload a clear scan or photograph of the printed, wet-signed Attorney's Oath Card (and any required application materials) to this State Bar workspace. Incomplete uploads may delay admission processing.",
                ),
                (
                    "Contact",
                    "Questions about oath card submission may be directed to the State Bar of California Admissions Office through the channels published on calbar.ca.gov.",
                ),
                (
                    "Signatures",
                    "Acknowledged and agreed:\n\nOath Effective Date: ____\n\nSTATE BAR OF CALIFORNIA — ADMISSIONS:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Admissions Officer\n\nATTORNEY / APPLICANT:\n\nBy: ___     Date: ___________\nName:\nBar Number (if assigned):\nTitle: Attorney / Applicant",
                ),
            ],
        },
        "bar_app": {
            "title": "Application for Admission — Cover Sheet",
            "short": "Bar Application",
            "sections": [
                (
                    "Application Cover",
                    'This Application for Admission Cover Sheet ("Cover Sheet") accompanies materials submitted to the State Bar of California as of {date}.',
                ),
                (
                    "Applicant Information",
                    "Applicant should ensure name, contact information, and law school / exam status match records already on file with the State Bar Admissions Office.",
                ),
                (
                    "Required Attachments",
                    "Depending on status, applicants may need to submit supporting documents such as a printed Attorney's Oath Card, moral character updates, or other Admissions-requested forms. Upload those files in this workspace when requested.",
                ),
                (
                    "Certification",
                    "I certify that the application materials I submit are complete and accurate to the best of my knowledge, and that I will promptly update the State Bar if any information changes.",
                ),
                (
                    "Signatures",
                    "Certified:\n\nApplication Date: ____\n\nSTATE BAR OF CALIFORNIA:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Admissions Officer\n\nAPPLICANT:\n\nBy: ___     Date: ___________\nName:\nTitle: Applicant",
                ),
            ],
        },
        "bar_moral": {
            "title": "Moral Character Certification Affirmation",
            "short": "Moral Character",
            "sections": [
                (
                    "Purpose",
                    'This Moral Character Certification Affirmation ("Affirmation") is issued as of {date} by the State Bar of California for attorneys and applicants completing oath card and admission submission.',
                ),
                (
                    "Certification",
                    "I affirm that the information I have provided to the State Bar concerning my moral character, including any disclosures required by Admissions rules, remains true and complete. I understand that I must promptly report material changes.",
                ),
                (
                    "Continuing Duty",
                    "I acknowledge my continuing duty to cooperate with the State Bar Admissions Office and to respond to requests for additional information related to moral character review.",
                ),
                (
                    "Signatures",
                    "Affirmed:\n\nCertification Date: ____\n\nSTATE BAR OF CALIFORNIA — ADMISSIONS:\n\nBy: ___________________________     Date: ___________\nName: {name}\nTitle: Admissions Officer\n\nATTORNEY / APPLICANT:\n\nBy: ___     Date: ___________\nName:\nTitle: Attorney / Applicant",
                ),
            ],
        },
        "hap_hr": {
            "title": "HAP Case Worker Onboarding Packet",
            "short": "HAP HR",
            "sections": [
                (
                    "Program",
                    "This onboarding packet is issued as of {date} by the California Department of Human Resources (CalHR) for the Housing Assistance Program (HAP-2026-014) administered by the Department of Housing and Community Development.",
                ),
                (
                    "Position",
                    "You are offered a Case Worker II assignment in Public Works / HAP surge operations. Start date: June 16, 2026. This is a full-time position subject to California civil service rules and SEIU 1000 acknowledgments.",
                ),
                (
                    "Packet contents",
                    "This envelope includes the offer letter, oath of office, I-9 verification instructions, ethics training acknowledgment, and IT acceptable-use policy. All items must be signed before your first day.",
                ),
                (
                    "Conditions",
                    "Employment is contingent on a background check, work-authorization verification, and completion of ethics training within 30 days of start.",
                ),
                (
                    "Signatures",
                    "Accepted and agreed:\n\nSTATE OF CALIFORNIA — CalHR / HCD:\n\nBy: ___________________________     Date: ___________\nName: Maya Chen\nTitle: CalHR Specialist\n\nEMPLOYEE:\n\nBy: ___\nName: {name}\nTitle: Case Worker II",
                ),
            ],
        },
        "hap_vendor": {
            "title": "HAP Emergency Lodging Agreement",
            "short": "HAP Vendor",
            "sections": [
                (
                    "Agreement",
                    'This Emergency Lodging Agreement is entered into as of {date} between the California Department of General Services, on behalf of HCD Housing Assistance Program HAP-2026-014 ("State"), and Pacific Stay Hotels ("Vendor").',
                ),
                (
                    "Scope",
                    "Vendor shall provide a 90-day hotel block of 180 rooms in the Sacramento region for temporary housing placements under HAP. Weekly occupancy reports are due each Monday.",
                ),
                (
                    "Value and payment",
                    "Not-to-exceed amount: $1,200,000. State shall pay within 45 days of a correct invoice that references REQ-HAP-220. Funds are encumbered in FI$Cal upon execution.",
                ),
                (
                    "Mandatory terms",
                    "Mutual indemnification, audit access, and nondiscrimination clauses from the State Standard Terms library v7 apply and are non-negotiable. Emergency purchase authority PA-44 is on file.",
                ),
                (
                    "Signatures",
                    "The parties have executed this Agreement as of the date first written above.\n\nSTATE OF CALIFORNIA — DGS / HCD:\n\nBy: ___________________________     Date: ___________\nName: James Chen\nTitle: Procurement Analyst\n\nVENDOR — PACIFIC STAY HOTELS:\n\nBy: ___\nName: {name}\nTitle: Authorized Representative",
                ),
            ],
        },
        "hap_mou": {
            "title": "HAP Inter-Agency Memorandum of Understanding",
            "short": "HAP MOU",
            "sections": [
                (
                    "Purpose",
                    "This Memorandum of Understanding is entered into as of {date} among the California Department of Housing and Community Development (HCD), the California Governor's Office of Emergency Services (CalOES), and the County of Sacramento to coordinate Housing Assistance Program HAP-2026-014 case referral.",
                ),
                (
                    "Data sharing",
                    "The parties shall exchange encrypted referral files for HAP applicants. Personal data is retained no longer than 24 months. The County privacy addendum is attached as Exhibit B.",
                ),
                (
                    "Reporting",
                    "The parties shall publish a quarterly joint dashboard to the HCD program director. The first report is due April 15, 2026.",
                ),
                (
                    "No funding obligation",
                    "This MOU does not encumber funds. Hotel capacity is contracted separately under REQ-HAP-220.",
                ),
                (
                    "Signatures",
                    "The parties have signed this MOU as of the date first written above.\n\nHCD:\n\nBy: ___________________________     Date: ___________\nName: Elena Ruiz\nTitle: Program Director\n\nCOUNTY OF SACRAMENTO:\n\nBy: ___\nName: {name}\nTitle: County Executive / Counsel",
                ),
            ],
        },
        "hap_resident": {
            "title": "HAP Housing Assistance Agreement",
            "short": "HAP Resident",
            "sections": [
                (
                    "Case",
                    "This Housing Assistance Agreement is issued as of {date} for CASE-2026-00981 under the California HCD Housing Assistance Program HAP-2026-014.",
                ),
                (
                    "Applicant",
                    "Applicant: {name}. Household size: 3. ZIP: 95814 (inside the declared emergency area). Income attestation is complete and no fraud flags were raised.",
                ),
                (
                    "Benefit",
                    "Upon signature, Applicant is eligible for temporary lodging placement through HAP-contracted housing (Pacific Stay Hotels) for up to 90 days, subject to recertification.",
                ),
                (
                    "Recertification",
                    "A recertification Web Form will be issued on day 83. Failure to recertify may end the placement on day 90.",
                ),
                (
                    "Signatures",
                    "Agreed:\n\nSTATE OF CALIFORNIA — HCD:\n\nBy: ___________________________     Date: ___________\nName: HAP Constituent Agent\nTitle: Program Officer\n\nRESIDENT:\n\nBy: ___\nName: {name}\nTitle: Applicant",
                ),
            ],
        },
    }


def build_doc_extractions(doc_key, signer_name, signer_email, subject=""):
    """Structured key fields extracted from generated document metadata."""
    templates = doc_templates()
    tmpl = templates.get(doc_key, templates["msa"])
    today = datetime.now(UTC).strftime("%B %d, %Y")
    counterparty = {
        "msa": "Vendor",
        "nda": "Receiving Party",
        "mou": "Partner Agency",
        "grant": "Grant Recipient",
        "vendor": "Vendor",
        "employment": "Employee",
        "hap_hr": "Employee",
        "hap_vendor": "Vendor",
        "hap_mou": "Partner Agency",
        "hap_resident": "Resident",
    }
    term = {
        "msa": "3 years",
        "nda": "2 years (+ 3 year confidentiality)",
        "mou": "1 year",
        "grant": "Per Exhibit A",
        "vendor": "Per Purchase Order",
        "employment": "At-will",
        "hap_hr": "Civil service / at-will",
        "hap_vendor": "90 days",
        "hap_mou": "1 year",
        "hap_resident": "90 days + recertification",
    }
    return {
        "document_type": tmpl["title"],
        "document_short": tmpl["short"],
        "effective_date": today,
        "agency_party": "California Department of Technology",
        "counterparty_role": counterparty.get(doc_key, "Counterparty"),
        "signer_name": signer_name,
        "signer_email": signer_email,
        "email_subject": subject or f"{tmpl['title']} — Signature Required",
        "contract_term": term.get(doc_key, "As specified"),
        "governing_law": "State of California",
        "jurisdiction": "Sacramento County, California",
    }


def match_doc_type(user_input):
    """Map free-text input to a known doc type key."""
    s = user_input.lower().strip()
    mapping = {
        "msa": "msa",
        "master service": "msa",
        "master service agreement": "msa",
        "nda": "nda",
        "non-disclosure": "nda",
        "non disclosure": "nda",
        "confidentiality": "nda",
        "mou": "mou",
        "memorandum": "mou",
        "memorandum of understanding": "mou",
        "grant": "grant",
        "grant agreement": "grant",
        "grant award": "grant",
        "vendor": "vendor",
        "vendor agreement": "vendor",
        "purchase": "vendor",
        "employment": "employment",
        "offer": "employment",
        "offer letter": "employment",
        "hr": "employment",
        "onboarding": "employment",
        "hap hr": "hap_hr",
        "case worker": "hap_hr",
        "hap vendor": "hap_vendor",
        "lodging": "hap_vendor",
        "hotel": "hap_vendor",
        "hap mou": "hap_mou",
        "inter-agency": "hap_mou",
        "hap resident": "hap_resident",
        "housing assistance": "hap_resident",
        "oath": "oath",
        "oath card": "oath",
        "attorney oath": "oath",
        "state bar": "oath",
        "bar app": "bar_app",
        "bar application": "bar_app",
        "admission": "bar_app",
        "moral": "bar_moral",
        "moral character": "bar_moral",
        "bar moral": "bar_moral",
    }
    for key, val in mapping.items():
        if key in s:
            return val
    return "msa"  # default


def pdf_safe(text):
    """Replace characters outside Helvetica's Latin-1 range with ASCII equivalents."""
    return (
        text.replace("—", "--")  # em dash
        .replace("–", "-")  # en dash
        .replace("‘", "'")  # left single quote
        .replace("’", "'")  # right single quote
        .replace("“", '"')  # left double quote
        .replace("”", '"')  # right double quote
        .replace("…", "...")  # ellipsis
        .replace(" ", " ")  # non-breaking space
        .replace("®", "(R)")  # registered trademark
        .replace("©", "(c)")  # copyright
    )


def generate_pdf(doc_type_key, signer_name="Corey Washington"):
    """Generate a formatted PDF and return base64 string."""
    from fpdf import FPDF
    from fpdf.enums import XPos, YPos

    templates = doc_templates()
    tmpl = templates.get(doc_type_key, templates["msa"])
    today = datetime.now().strftime("%B %d, %Y")

    pdf = FPDF()
    pdf.set_margins(22, 22, 22)
    pdf.add_page()

    # Header bar
    pdf.set_fill_color(13, 13, 13)
    pdf.rect(0, 0, 210, 14, "F")
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(22, 4)
    pdf.cell(0, 6, "STATE OF CALIFORNIA  |  Docusign IAM Demo", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.ln(10)

    # Title
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(13, 13, 13)
    pdf.cell(0, 10, pdf_safe(tmpl["title"].upper()), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Meta line
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(113, 113, 122)
    pdf.cell(
        0,
        6,
        f"Effective Date: {today}    |    Account {config.ACCOUNT_ID or 'demo'}    |    Demo Environment",
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
    )

    # Divider
    pdf.set_draw_color(232, 231, 226)
    pdf.set_line_width(0.5)
    pdf.line(22, pdf.get_y() + 2, 188, pdf.get_y() + 2)
    pdf.ln(6)

    # Sections
    for i, (heading, body) in enumerate(tmpl["sections"]):
        body = pdf_safe(body.replace("{date}", today).replace("{name}", signer_name))

        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(13, 13, 13)
        pdf.cell(0, 7, pdf_safe(f"{i + 1}.  {heading.upper()}"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(60, 60, 60)
        pdf.multi_cell(0, 5.5, body)
        pdf.ln(4)

    if pdf.get_y() > 230:
        pdf.add_page()
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(13, 13, 13)
    pdf.cell(0, 7, "COUNTERSIGNATURE", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(
        0,
        5.5,
        pdf_safe(
            "Second signature required from the reviewing officer after the primary signer.\n\n"
            "COUNTERSIGNER:\n\n"
            "Countersign: ___\n"
            f"Name: {config.DEMO_COUNTERSIGNER_NAME}\n"
            "Title: Reviewing Officer"
        ),
    )
    pdf.ln(4)

    # Footer
    pdf.set_y(-20)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(161, 161, 170)
    pdf.cell(0, 5, f"Generated via Docusign IAM Gov Demo  |  {today}  |  DRAFT -- NOT FOR EXECUTION", align="C")

    raw = pdf.output()
    return base64.b64encode(bytes(raw)).decode("ascii")
