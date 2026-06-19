#!/usr/bin/env python3
"""Generate state_profiles.json with contract demo metadata for all 50 US states."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "state_profiles.json"

STATE_ORDER = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]

STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming",
}

# erp, erp_short, procurement, it_authority, legal
CORE = {
    "AL": (
        "SAP S/4HANA (State of Alabama)",
        "AL ERP",
        "Alabama Department of Finance — Division of Purchasing",
        "Alabama Office of Information Technology (OIT)",
        "Alabama Attorney General — State Agency Counsel",
    ),
    "AK": (
        "Alaska Administrative System (AASIS)",
        "AASIS",
        "Department of Administration — Division of General Services",
        "Alaska Office of Information Technology",
        "Alaska Department of Law — Agency Counsel",
    ),
    "AZ": (
        "Arizona Financial Information System (AFIS)",
        "AFIS",
        "General Accounting Office — Procurement Office",
        "Arizona Strategic Enterprise Technology (ASET)",
        "Arizona Attorney General — Agency Legal",
    ),
    "AR": (
        "Arkansas Financial Management System (ARBuy)",
        "ARBuy",
        "Department of Finance and Administration — Office of State Procurement",
        "Department of Shared Services — Information Technology",
        "Arkansas Attorney General — State Agency Counsel",
    ),
    "CA": (
        "FI$Cal (Financial Information System for California)",
        "FI$Cal",
        "Department of General Services (DGS)",
        "California Department of Technology (CDT)",
        "California Department of Justice — delegated agency counsel",
    ),
    "CO": (
        "Colorado Operations Resource Engine (CORE)",
        "CORE",
        "Colorado Office of State Purchasing",
        "Colorado Governor's Office of Information Technology (OIT)",
        "Colorado Attorney General — State Agency Counsel",
    ),
    "CT": (
        "CORE-CT (Connecticut State ERP)",
        "CORE-CT",
        "Department of Administrative Services — Procurement",
        "Connecticut Department of Administrative Services — Digital Services",
        "Connecticut Attorney General — Agency Counsel",
    ),
    "DE": (
        "Delaware Financial Management System (FSF)",
        "FSF",
        "Government Support Services — Procurement",
        "Delaware Department of Technology and Information (DTI)",
        "Delaware Department of Justice — Agency Counsel",
    ),
    "FL": (
        "Florida Accounting Information Resource (FLAIR)",
        "FLAIR",
        "Department of Management Services — Division of Purchasing",
        "Florida Department of Management Services — State Technology Office",
        "Florida Attorney General — Agency Legal",
    ),
    "GA": (
        "Georgia Enterprise Access Management (TEAM)",
        "TEAM",
        "Department of Administrative Services — State Purchasing",
        "Georgia Technology Authority (GTA)",
        "Georgia Attorney General — State Agency Counsel",
    ),
    "HI": (
        "SAP S/4HANA (State of Hawaii)",
        "HI ERP",
        "State Procurement Office",
        "Office of Enterprise Technology Services",
        "Hawaii Attorney General — Agency Counsel",
    ),
    "ID": (
        "State Accounting and Reporting System (STARS)",
        "STARS",
        "Department of Administration — Division of Purchasing",
        "Office of Information Technology Services (ITS)",
        "Idaho Attorney General — Agency Legal",
    ),
    "IL": (
        "Budgetary Accounting Reporting System (BARS)",
        "BARS",
        "Central Management Services — Procurement",
        "Department of Innovation & Technology (DoIT)",
        "Illinois Attorney General — State Agency Counsel",
    ),
    "IN": (
        "Indiana Statewide ERP (INBiz Financials)",
        "IN ERP",
        "Indiana Department of Administration — Procurement",
        "Indiana Management Performance Hub — State IT",
        "Indiana Attorney General — Agency Counsel",
    ),
    "IA": (
        "Statewide Integrated Revenue Information System (SIRIS)",
        "SIRIS",
        "Department of Administrative Services — Central Procurement",
        "Office of the Chief Information Officer (OCIO)",
        "Iowa Attorney General — State Agency Legal",
    ),
    "KS": (
        "Statewide Human Resource, Payroll, Accounting and Reporting System (SHARP)",
        "SHARP",
        "Department of Administration — Division of Purchases",
        "Office of Information Technology Services (OITS)",
        "Kansas Attorney General — Agency Counsel",
    ),
    "KY": (
        "Kentucky Financial System (KFS)",
        "KFS",
        "Finance and Administration Cabinet — Finance Procurement",
        "Commonwealth Office of Technology (COT)",
        "Kentucky Attorney General — State Agency Counsel",
    ),
    "LA": (
        "LaGov ERP",
        "LaGov",
        "Office of State Procurement",
        "Louisiana Office of Technology Services",
        "Louisiana Attorney General — Agency Counsel",
    ),
    "ME": (
        "MaineStreet / MSES",
        "MSES",
        "Department of Administrative and Financial Services — Bureau of General Services",
        "Office of Information Technology (OIT)",
        "Maine Attorney General — Agency Counsel",
    ),
    "MD": (
        "Maryland Buys / SAP S/4HANA",
        "MD Buys",
        "Department of General Services — Procurement",
        "Maryland Department of Information Technology (DoIT)",
        "Maryland Attorney General — State Agency Counsel",
    ),
    "MA": (
        "Massachusetts Management Accounting and Reporting System (MMARS)",
        "MMARS",
        "Operational Services Division (OSD)",
        "Executive Office of Technology Services and Security (EOTSS)",
        "Massachusetts Attorney General — Agency Counsel",
    ),
    "MI": (
        "State Integrated Government Management Application (SIGMA)",
        "SIGMA",
        "Department of Technology, Management & Budget — Procurement",
        "DTMB — Bureau of Services",
        "Michigan Attorney General — State Agency Counsel",
    ),
    "MN": (
        "Statewide Integrated Financial Tools (SWIFT)",
        "SWIFT",
        "Minnesota Management and Budget — Procurement",
        "MN IT Services (MNIT)",
        "Minnesota Attorney General — Agency Counsel",
    ),
    "MS": (
        "Mississippi Accounting and Reporting System (MAGIC)",
        "MAGIC",
        "Department of Finance and Administration — Office of Purchasing",
        "Mississippi Department of Information Technology Services",
        "Mississippi Attorney General — Agency Legal",
    ),
    "MO": (
        "State Accounting System (SAM II)",
        "SAM II",
        "Office of Administration — ITSD Procurement",
        "Office of Administration — Information Technology Services Division",
        "Missouri Attorney General — State Agency Counsel",
    ),
    "MT": (
        "Montana Unified School Accounting System / MUS Financials",
        "MUS",
        "State Administration & HR — SABHRS Procurement",
        "State Information Technology Services Division (SITSD)",
        "Montana Attorney General — Agency Counsel",
    ),
    "NE": (
        "Nebraska State Accounting System (SAP)",
        "NE ERP",
        "Department of Administrative Services — Materiel Division",
        "Office of the CIO — Nebraska Information Technology Commission",
        "Nebraska Attorney General — Agency Counsel",
    ),
    "NV": (
        "Nevada Purchasing and Accounting Management System (NVPAMS)",
        "NVPAMS",
        "Department of Administration — Purchasing Division",
        "Nevada Enterprise IT Services (NSIT)",
        "Nevada Attorney General — Agency Counsel",
    ),
    "NH": (
        "NH Element ERP",
        "NH Element",
        "Department of Administrative Services — Bureau of General Services",
        "Department of Information Technology (DoIT)",
        "New Hampshire Attorney General — Agency Counsel",
    ),
    "NJ": (
        "NJSTART / NJMIS",
        "NJSTART",
        "Department of the Treasury — Division of Purchase and Property",
        "New Jersey Office of Information Technology (NJOIT)",
        "New Jersey Attorney General — Division of Law",
    ),
    "NM": (
        "SHARE New Mexico",
        "SHARE",
        "General Services Department — State Purchasing Division",
        "Department of Information Technology (DoIT)",
        "New Mexico Attorney General — Agency Counsel",
    ),
    "NY": (
        "Statewide Financial System (SFS)",
        "SFS",
        "Office of General Services — Procurement Services",
        "New York State Office of Information Technology Services (ITS)",
        "New York Attorney General — State Agency Counsel",
    ),
    "NC": (
        "North Carolina Accounting System (NCAS)",
        "NCAS",
        "Department of Administration — Division of Purchase & Contract",
        "North Carolina Department of Information Technology (NCDIT)",
        "North Carolina Attorney General — State Agency Counsel",
    ),
    "ND": (
        "PeopleSoft Financials (State of North Dakota)",
        "ND ERP",
        "Office of Management and Budget — Procurement",
        "North Dakota Information Technology Department (ITD)",
        "North Dakota Attorney General — Agency Counsel",
    ),
    "OH": (
        "Ohio Administrative Knowledge System (OAKS)",
        "OAKS",
        "Department of Administrative Services — Procurement Services",
        "Ohio Department of Administrative Services — InnovateOhio Platform",
        "Ohio Attorney General — State Agency Counsel",
    ),
    "OK": (
        "OK SMART (State Management and Accounting Reporting Tool)",
        "SMART",
        "Office of Management and Enterprise Services — Central Purchasing",
        "OMES Information Services Division",
        "Oklahoma Attorney General — Agency Counsel",
    ),
    "OR": (
        "Oregon State Accounting and Reporting System (OSTAR)",
        "OSTAR",
        "Department of Administrative Services — Procurement",
        "Enterprise Information Services (EIS)",
        "Oregon Department of Justice — Agency Counsel",
    ),
    "PA": (
        "SAP S/4HANA (Commonwealth of Pennsylvania)",
        "SAP PA",
        "Department of General Services — Bureau of Procurement",
        "Office of Administration — Office for Information Technology",
        "Pennsylvania Attorney General — Agency Counsel",
    ),
    "RI": (
        "Rhode Island Uniform Accounting System (UAS)",
        "RI ERP",
        "Department of Administration — Division of Purchases",
        "Rhode Island Department of Information Technology (DoIT)",
        "Rhode Island Attorney General — Agency Counsel",
    ),
    "SC": (
        "South Carolina Enterprise Information System (SCEIS)",
        "SCEIS",
        "Division of Procurement Services",
        "South Carolina Division of Information Technology",
        "South Carolina Attorney General — Agency Counsel",
    ),
    "SD": (
        "Bureau of Administration System (BAS)",
        "BAS",
        "Bureau of Finance and Management — Central Services",
        "Bureau of Information and Telecommunications (BIT)",
        "South Dakota Attorney General — Agency Counsel",
    ),
    "TN": (
        "Edison Financial System",
        "Edison",
        "Central Procurement Office",
        "Enterprise Solutions — State IT",
        "Tennessee Attorney General — State Agency Counsel",
    ),
    "TX": (
        "Centralized Accounting and Payroll/Personnel System (CAPPS)",
        "CAPPS",
        "Texas Procurement and Support Services (TPASS)",
        "Texas Department of Information Resources (DIR)",
        "Texas Attorney General — State Agency Counsel",
    ),
    "UT": (
        "FINET (Financial Information Network)",
        "FINET",
        "Division of Purchasing and General Services",
        "Department of Technology Services (DTS)",
        "Utah Attorney General — Agency Counsel",
    ),
    "VT": (
        "Vantage ERP",
        "Vantage",
        "Department of Buildings and General Services — Purchasing",
        "Agency of Digital Services",
        "Vermont Attorney General — Agency Counsel",
    ),
    "VA": (
        "Cardinal Accounting and Reporting System (CARS)",
        "CARS",
        "Department of General Services — Division of Purchases and Supply",
        "Virginia Information Technologies Agency (VITA)",
        "Virginia Attorney General — Agency Counsel",
    ),
    "WA": (
        "Agency Financial Reporting System (AFRS)",
        "AFRS",
        "Department of Enterprise Services — Procurement",
        "Washington Office of the Chief Information Officer (WaTech)",
        "Washington Attorney General — Agency Counsel",
    ),
    "WV": (
        "wvOASIS",
        "wvOASIS",
        "Department of Administration — Purchasing Division",
        "West Virginia Office of Technology (WVOT)",
        "West Virginia Attorney General — Agency Counsel",
    ),
    "WI": (
        "State Accounting and Reporting System (STAR)",
        "STAR",
        "Department of Administration — State Bureau of Procurement",
        "Division of Enterprise Technology (DOA-DET)",
        "Wisconsin Department of Justice — Agency Counsel",
    ),
    "WY": (
        "Wyoming Online Financial System (WOLFS)",
        "WOLFS",
        "Department of Administration & Information — Procurement",
        "Enterprise Technology Services (ETS)",
        "Wyoming Attorney General — Agency Counsel",
    ),
}

STANDARDS = {
    "AL": (
        "Alabama IT Procurement Policy",
        "Ala. Code Title 41 — Public Contracts",
        "State data security and breach notification standards",
    ),
    "AK": (
        "AS 36.30 — State Procurement Code",
        "Alaska IT Security Standards",
        "State of Alaska Master Price Agreement terms",
    ),
    "AZ": (
        "Arizona Procurement Code (AAC R2-7)",
        "ASET Security Policy Framework",
        "IT goods and services contract boilerplate",
    ),
    "AR": (
        "Ark. Code Ann. § 19-11 — Procurement",
        "State IT security policy",
        "Personal services contract requirements",
    ),
    "CA": (
        "DGS STD 213 — IT Goods & Services Master Agreement",
        "CalGov Code §§ 19130–19134 — personal services",
        "Gov Code § 927.8 — insurance requirements",
    ),
    "CO": (
        "Colorado Procurement Code",
        "OIT Security Policy",
        "IT professional services contract standards",
    ),
    "CT": (
        "Conn. Gen. Stat. § 4a-59 — IT procurement",
        "CORE-CT contract compliance requirements",
        "State data privacy and security standards",
    ),
    "DE": (
        "29 Del. C. — State Procurement",
        "DTI Information Security Policy",
        "IT services master agreement terms",
    ),
    "FL": (
        "Fla. Stat. § 287 — Procurement",
        "Florida IT security standards",
        "MyFloridaMarketPlace contract terms",
    ),
    "GA": (
        "O.C.G.A. Title 50 — State Government",
        "GTA IT procurement standards",
        "Georgia technology contract clauses",
    ),
    "HI": (
        "HRS Chapter 103D — Procurement",
        "Hawaii enterprise IT standards",
        "State cloud services security requirements",
    ),
    "ID": (
        "Idaho Code Title 67 — State Procurement",
        "ITS security and privacy policy",
        "IT professional services agreement template",
    ),
    "IL": (
        "30 ILCS 500 — Illinois Procurement Code",
        "DoIT security control standards",
        "IT master services agreement boilerplate",
    ),
    "IN": (
        "IC 5-22 — Indiana Public Procurement",
        "State IT security policy",
        "Professional services contract standards",
    ),
    "IA": (
        "Iowa Code Chapter 73 — Purchasing",
        "OCIO security standards",
        "IT goods and services contract terms",
    ),
    "KS": (
        "K.S.A. 75-3701 — Kansas Procurement Act",
        "OITS information security policy",
        "IT services contract template",
    ),
    "KY": (
        "KRS 45A — Kentucky Model Procurement Code",
        "COT security standards",
        "IT master agreement clauses",
    ),
    "LA": (
        "La. R.S. Title 39 — Public Contracts",
        "Louisiana IT security policy",
        "Office of Technology Services standards",
    ),
    "ME": (
        "5 M.R.S. § 1811 — Procurement",
        "Maine IT security standards",
        "Professional/technical services contract terms",
    ),
    "MD": (
        "Maryland Procurement Regulations",
        "DoIT security policy framework",
        "IT services contract boilerplate",
    ),
    "MA": (
        "M.G.L. c. 7, § 22 — IT procurement",
        "EOTSS security standards",
        "ITS77 IT contract terms",
    ),
    "MI": (
        "MCL 18.1261 — DTMB procurement",
        "DTMB IT security standards",
        "SIGMA-compliant contract requirements",
    ),
    "MN": (
        "Minn. Stat. Chapter 16C — Procurement",
        "MNIT security standards",
        "IT master contract template",
    ),
    "MS": (
        "Miss. Code Title 25 — Public Procurement",
        "MS ITS security policy",
        "IT professional services agreement",
    ),
    "MO": (
        "RSMo Chapter 34 — Purchasing",
        "OA IT security standards",
        "IT services contract clauses",
    ),
    "MT": (
        "Montana Procurement Act",
        "SITSD security policy",
        "IT goods and services standards",
    ),
    "NE": (
        "Nebraska Administrative Code Title 127",
        "State IT security requirements",
        "Professional services contract template",
    ),
    "NV": (
        "NRS Chapter 333 — Public Purchasing",
        "NSIT security standards",
        "IT services master agreement",
    ),
    "NH": (
        "RSA 21-I — Department of Information Technology",
        "State security policy framework",
        "IT procurement contract terms",
    ),
    "NJ": (
        "N.J.S.A. 52:34-6 — IT procurement",
        "NJOIT security standards",
        "State IT contract boilerplate",
    ),
    "NM": (
        "NMSA 13-1 — Procurement Code",
        "DoIT security policy",
        "IT professional services standards",
    ),
    "NY": (
        "NY State Finance Law Article 11 — IT procurement",
        "ITS NYSDS security policy",
        "OGS centralized contract terms",
    ),
    "NC": (
        "N.C.G.S. Chapter 143 — State Contracting",
        "NCDIT security standards",
        "IT master services agreement",
    ),
    "ND": (
        "NDCC Chapter 54-44 — Public Procurement",
        "ITD security standards",
        "IT services contract template",
    ),
    "OH": (
        "ORC Chapter 125 — Department of Administrative Services",
        "Ohio IT security standards",
        "IT services master agreement",
    ),
    "OK": (
        "74 O.S. § 85.5 — Central purchasing",
        "OMES information security policy",
        "IT contract standard terms",
    ),
    "OR": (
        "ORS 279A — Public Contracting",
        "EIS security standards",
        "IT professional services agreement",
    ),
    "PA": (
        "62 Pa.C.S. — Procurement",
        "OA-IT security policy",
        "Commonwealth IT contract boilerplate",
    ),
    "RI": (
        "R.I. Gen. Laws § 37-2 — Purchasing",
        "DoIT security standards",
        "IT services contract terms",
    ),
    "SC": (
        "S.C. Code Title 11 — Procurement",
        "SC ITS security policy",
        "IT master agreement template",
    ),
    "SD": (
        "SDCL Chapter 5-18 — Procurement",
        "BIT security standards",
        "IT services contract clauses",
    ),
    "TN": (
        "T.C.A. Title 12 — Public Contracts",
        "Enterprise Solutions security standards",
        "IT professional services contract",
    ),
    "TX": (
        "Texas Gov Code Ch. 2155 — Procurement",
        "DIR ITSAC / TX-RAMP contract standards",
        "DIR cloud services security requirements",
    ),
    "UT": (
        "Utah Code Title 63G — Procurement",
        "DTS security policy",
        "IT services master agreement",
    ),
    "VT": (
        "3 V.S.A. § 2222 — IT procurement",
        "Agency of Digital Services security standards",
        "IT contract boilerplate",
    ),
    "VA": (
        "Va. Code Title 2.2 — Public Procurement",
        "VITA security standards",
        "IT master contract terms",
    ),
    "WA": (
        "RCW 39.26 — Master contracts",
        "WaTech security policy",
        "DES IT contract standards",
    ),
    "WV": (
        "W. Va. Code § 5A-3 — Purchasing",
        "WVOT security standards",
        "IT services agreement template",
    ),
    "WI": (
        "Wis. Stat. Chapter 16 — Procurement",
        "DOA-DET security standards",
        "IT master contract boilerplate",
    ),
    "WY": (
        "Wyo. Stat. § 9-2-1016 — Procurement",
        "ETS information security policy",
        "IT professional services contract",
    ),
}

MEDICAID_AGENCY = {
    "AL": "Alabama Medicaid Agency",
    "AK": "Alaska Department of Health — Division of Public Assistance",
    "AZ": "Arizona Health Care Cost Containment System (AHCCCS)",
    "AR": "Arkansas Department of Human Services — Division of County Operations",
    "CA": "California Department of Health Care Services (DHCS)",
    "CO": "Colorado Department of Health Care Policy & Financing (HCPF)",
    "CT": "Connecticut Department of Social Services — DSS",
    "DE": "Delaware Division of Medicaid & Medical Assistance",
    "FL": "Florida Agency for Health Care Administration (AHCA)",
    "GA": "Georgia Department of Community Health (DCH)",
    "HI": "Hawaii Med-QUEST Division / DHS",
    "ID": "Idaho Department of Health and Welfare — Division of Welfare",
    "IL": "Illinois Department of Healthcare and Family Services (HFS)",
    "IN": "Indiana Family and Social Services Administration (FSSA)",
    "IA": "Iowa Department of Health and Human Services",
    "KS": "Kansas Department of Health and Environment — KanCare",
    "KY": "Kentucky Cabinet for Health and Family Services — DMS",
    "LA": "Louisiana Department of Health — Medicaid",
    "ME": "Maine Department of Health and Human Services — Office for Family Independence",
    "MD": "Maryland Department of Health — Medicaid Program",
    "MA": "Massachusetts Executive Office of Health and Human Services — MassHealth",
    "MI": "Michigan Department of Health and Human Services — MDHHS",
    "MN": "Minnesota Department of Human Services (DHS)",
    "MS": "Mississippi Division of Medicaid",
    "MO": "Missouri Department of Social Services — MO HealthNet",
    "MT": "Montana Department of Public Health and Human Services",
    "NE": "Nebraska Department of Health and Human Services — Medicaid & Long-Term Care",
    "NV": "Nevada Department of Health and Human Services — Division of Welfare",
    "NH": "New Hampshire Department of Health and Human Services",
    "NJ": "New Jersey Department of Human Services — Division of Medical Assistance",
    "NM": "New Mexico Human Services Department — Medicaid",
    "NY": "New York State Department of Health — Medicaid",
    "NC": "North Carolina Department of Health and Human Services — NC Medicaid",
    "ND": "North Dakota Department of Health and Human Services — Medical Services",
    "OH": "Ohio Department of Medicaid",
    "OK": "Oklahoma Health Care Authority (OHCA)",
    "OR": "Oregon Health Authority (OHA)",
    "PA": "Pennsylvania Department of Human Services — Office of Medical Assistance",
    "RI": "Rhode Island Executive Office of Health and Human Services — Medicaid",
    "SC": "South Carolina Department of Health and Human Services",
    "SD": "South Dakota Department of Social Services — Division of Economic Assistance",
    "TN": "Tennessee Division of TennCare",
    "TX": "Texas Health and Human Services Commission (HHSC)",
    "UT": "Utah Department of Health and Human Services — Medicaid",
    "VT": "Vermont Agency of Human Services — DVHA",
    "VA": "Virginia Department of Medical Assistance Services (DMAS)",
    "WA": "Washington Health Care Authority (HCA)",
    "WV": "West Virginia Bureau for Medical Services",
    "WI": "Wisconsin Department of Health Services — ForwardHealth",
    "WY": "Wyoming Department of Health — Wyoming Medicaid",
}

DOT_AGENCY = {
    "AL": "Alabama Department of Transportation (ALDOT)",
    "AK": "Alaska Department of Transportation & Public Facilities",
    "AZ": "Arizona Department of Transportation (ADOT)",
    "AR": "Arkansas Department of Transportation (ARDOT)",
    "CA": "California Department of Transportation (Caltrans)",
    "CO": "Colorado Department of Transportation (CDOT)",
    "CT": "Connecticut Department of Transportation (CTDOT)",
    "DE": "Delaware Department of Transportation (DelDOT)",
    "FL": "Florida Department of Transportation (FDOT)",
    "GA": "Georgia Department of Transportation (GDOT)",
    "HI": "Hawaii Department of Transportation (HDOT)",
    "ID": "Idaho Transportation Department (ITD)",
    "IL": "Illinois Department of Transportation (IDOT)",
    "IN": "Indiana Department of Transportation (INDOT)",
    "IA": "Iowa Department of Transportation (Iowa DOT)",
    "KS": "Kansas Department of Transportation (KDOT)",
    "KY": "Kentucky Transportation Cabinet (KYTC)",
    "LA": "Louisiana Department of Transportation and Development (LaDOTD)",
    "ME": "Maine Department of Transportation (MaineDOT)",
    "MD": "Maryland Department of Transportation (MDOT)",
    "MA": "Massachusetts Department of Transportation (MassDOT)",
    "MI": "Michigan Department of Transportation (MDOT)",
    "MN": "Minnesota Department of Transportation (MnDOT)",
    "MS": "Mississippi Department of Transportation (MDOT)",
    "MO": "Missouri Department of Transportation (MoDOT)",
    "MT": "Montana Department of Transportation (MDT)",
    "NE": "Nebraska Department of Transportation (NDOT)",
    "NV": "Nevada Department of Transportation (NDOT)",
    "NH": "New Hampshire Department of Transportation (NHDOT)",
    "NJ": "New Jersey Department of Transportation (NJDOT)",
    "NM": "New Mexico Department of Transportation (NMDOT)",
    "NY": "New York State Department of Transportation (NYSDOT)",
    "NC": "North Carolina Department of Transportation (NCDOT)",
    "ND": "North Dakota Department of Transportation (NDDOT)",
    "OH": "Ohio Department of Transportation (ODOT)",
    "OK": "Oklahoma Department of Transportation (ODOT)",
    "OR": "Oregon Department of Transportation (ODOT)",
    "PA": "Pennsylvania Department of Transportation (PennDOT)",
    "RI": "Rhode Island Department of Transportation (RIDOT)",
    "SC": "South Carolina Department of Transportation (SCDOT)",
    "SD": "South Dakota Department of Transportation (SDDOT)",
    "TN": "Tennessee Department of Transportation (TDOT)",
    "TX": "Texas Department of Transportation (TxDOT)",
    "UT": "Utah Department of Transportation (UDOT)",
    "VT": "Vermont Agency of Transportation (VTrans)",
    "VA": "Virginia Department of Transportation (VDOT)",
    "WA": "Washington State Department of Transportation (WSDOT)",
    "WV": "West Virginia Department of Transportation (WVDOT)",
    "WI": "Wisconsin Department of Transportation (WisDOT)",
    "WY": "Wyoming Department of Transportation (WYDOT)",
}

FP_TEMPLATE = {
    "CA": "DGS STD 213 — IT Goods & Services MSA",
    "TX": "DIR ITSAC Master Contract — SOW",
    "NY": "OGS Centralized IT Contract — Exhibit A",
    "FL": "MyFloridaMarketPlace IT Services MSA",
    "IL": "DoIT Master IT Professional Services Agreement",
    "PA": "Commonwealth IT Professional Services Contract",
    "OH": "DAS IT Services Master Agreement",
    "WA": "DES Master IT Services Agreement",
    "VA": "VITA IT Master Services Agreement",
    "NJ": "NJSTART IT Professional Services Agreement",
    "MA": "EOTSS ITS77 Master Services Agreement",
    "MI": "DTMB IT Services Master Agreement",
    "GA": "GTA Statewide IT Contract Vehicle",
    "NC": "NCDIT IT Master Services Agreement",
    "AZ": "ASET IT Services Master Agreement",
    "CO": "OIT Statewide IT Master Agreement",
    "MN": "MNIT Master IT Services Agreement",
    "WI": "DOA Master IT Services Contract",
    "MD": "DoIT Master IT Services Agreement",
    "MO": "OA ITSD Professional Services MSA",
    "TN": "Enterprise Solutions IT Master Agreement",
    "IN": "State IT Master Services Agreement",
    "SC": "SCEIS IT Professional Services MSA",
    "LA": "Office of Technology Services IT MSA",
    "KY": "COT IT Master Services Agreement",
    "OR": "EIS IT Master Services Agreement",
    "OK": "OMES IT Services Master Agreement",
    "CT": "DAS IT Professional Services Agreement",
    "UT": "DTS IT Master Services Agreement",
    "NV": "NSIT IT Services Master Agreement",
    "NM": "DoIT IT Professional Services Agreement",
    "NE": "State IT Master Services Agreement",
    "KS": "OITS IT Master Services Agreement",
    "IA": "OCIO IT Professional Services Agreement",
    "AR": "DIS IT Services Master Agreement",
    "MS": "MS ITS IT Master Agreement",
    "AL": "OIT IT Professional Services MSA",
    "AK": "OIT IT Master Services Agreement",
    "HI": "ETS IT Professional Services Agreement",
    "ID": "ITS IT Master Services Agreement",
    "ME": "OIT IT Professional Services Agreement",
    "NH": "DoIT IT Master Services Agreement",
    "RI": "DoIT IT Services Master Agreement",
    "SD": "BIT IT Master Services Agreement",
    "ND": "ITD IT Professional Services Agreement",
    "MT": "SITSD IT Master Services Agreement",
    "WY": "ETS IT Professional Services Agreement",
    "WV": "WVOT IT Master Services Agreement",
    "VT": "Agency of Digital Services IT MSA",
    "DE": "DTI IT Master Services Agreement",
}

FP_VENDORS = [
    "Gainwell Technologies, Inc.",
    "Optum Public Sector Solutions, Inc.",
    "Deloitte Consulting LLP",
    "Accenture Federal Services, LLC",
    "Conduent State & Local Solutions, Inc.",
    "IBM Public Sector, Inc.",
    "CGI Technologies and Solutions, Inc.",
    "Maximus, Inc.",
]

TP_VENDORS = [
    "Trimble Inc.",
    "Tyler Technologies, Inc.",
    "Esri Inc.",
    "AECOM Technical Services, Inc.",
    "Iteris, Inc.",
    "Bentley Systems, Incorporated",
    "Samsara, Inc.",
    "Municipal Software Corp.",
]

CA_OVERRIDES = {
    "first_party": {
        "agency": "California Department of Technology (CDT)",
        "template": "DGS STD 213 — IT Goods & Services MSA",
        "use_case": "Medicaid eligibility hub integration and enterprise IT shared services (CDT/DHCS)",
        "vendor": "Acme Cloud Solutions, Inc.",
        "value": "$2,400,000",
        "solicitation": "RFO-CDT-2026-0142",
        "doc_type": "Master Services Agreement + Statement of Work",
        "term": "3 years + two 1-year options",
    },
    "third_party": {
        "agency": "California Department of Transportation (Caltrans)",
        "use_case": "DOT pavement management and field inspection SaaS",
        "vendor": "Trimble Inc.",
        "value": "$890,000",
        "doc_type": "Vendor Master Subscription Agreement",
        "template": "Caltrans reviewed against DGS STD 213 baseline",
        "term": "2 years + one 1-year option",
        "solicitation": "CPO-26-IT-0088",
    },
}


def _money(abbr: str, base_m: float) -> str:
    return f"${base_m:,.0f}"


def build_profiles() -> dict[str, dict]:
    profiles: dict[str, dict] = {}
    for i, abbr in enumerate(STATE_ORDER):
        name = STATE_NAMES[abbr]
        erp, erp_short, procurement, it_authority, legal = CORE[abbr]
        standards = list(STANDARDS[abbr])
        fp_vendor = FP_VENDORS[i % len(FP_VENDORS)]
        tp_vendor = TP_VENDORS[i % len(TP_VENDORS)]
        fp_value = _money(abbr, 8.5 + (i % 12) * 1.25)
        tp_value = _money(abbr, 0.65 + (i % 10) * 0.08)
        fp_template = FP_TEMPLATE[abbr]
        fp_agency = MEDICAID_AGENCY[abbr]
        fp_use = (
            "Medicaid eligibility, enrollment, and integrated human services IT modernization"
        )
        tp_agency = DOT_AGENCY[abbr]
        tp_use = "Department of Transportation cloud SaaS for asset and work-order management"

        profile = {
            "abbr": abbr,
            "state": name,
            "erp": erp,
            "erp_short": erp_short,
            "procurement": procurement,
            "it_authority": it_authority,
            "legal": legal,
            "badge": abbr,
            "standards": standards,
            "governing_law": f"State of {name}",
            "jurisdiction": f"Courts of {name}",
            "first_party": {
                "agency": fp_agency,
                "template": fp_template,
                "use_case": fp_use,
                "vendor": fp_vendor,
                "value": fp_value,
                "solicitation": f"RFO-{abbr}-2026-{1000 + i:04d}",
                "doc_type": "Master Services Agreement + Statement of Work",
                "term": "3 years + two 1-year options",
            },
            "third_party": {
                "agency": tp_agency,
                "use_case": tp_use,
                "vendor": tp_vendor,
                "value": tp_value,
                "doc_type": "Vendor Master Subscription Agreement",
                "template": f"{name} pre-approved IT standard terms baseline",
                "term": "2 years + one 1-year option",
                "solicitation": f"CPO-{abbr}-26-IT-{100 + i:04d}",
            },
        }
        if abbr == "CA":
            profile["first_party"] = dict(CA_OVERRIDES["first_party"])
            profile["third_party"] = dict(CA_OVERRIDES["third_party"])
        profiles[abbr] = profile
    return profiles


def main() -> None:
    profiles = build_profiles()
    if len(profiles) != 50:
        raise SystemExit(f"Expected 50 profiles, got {len(profiles)}")
    missing = [a for a in STATE_ORDER if a not in profiles]
    if missing:
        raise SystemExit(f"Missing state keys: {missing}")
    OUTPUT.write_text(json.dumps(profiles, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} with {len(profiles)} state profiles.")


if __name__ == "__main__":
    main()
