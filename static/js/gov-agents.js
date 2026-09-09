/* Public-sector Iris agents — Housing Assistance program walkthrough */

const GA_LOOP = ['Intake', 'Ground', 'Prepare', 'Route', 'Act', 'Monitor'];
const GA_PLAY_MS = 4200;

const GA_AGENTS = {
  program: {
    id: 'program',
    lane: 'Program',
    name: 'Housing Assistance orchestrator',
    persona: { role: 'HCD program director', name: 'Elena Ruiz' },
    product: 'Iris · Agent Studio',
    liveHref: '/gov-workflows?state=CA',
    liveLabel: 'Open the CA lifecycle walkthrough →',
    chrome: 'Iris · Housing Assistance',
    steps: [
      {
        title: 'The program opens',
        loop: 'Intake',
        product: 'Agent Studio',
        say: 'One announcement creates four agreement lanes — hire, buy, partner, and serve. That is the public-sector story.',
        decision: 'Orchestrator reads the HCD program order and spins up the four specialist agents with a shared case ID HAP-2026-014.',
        evidence: [
          'Program order filed in Agreement Desk',
          'Shared case ID issued to CalHR, FI$Cal, CalOES, and the resident portal',
          'Each agent grounded in its own playbook, not a generic prompt',
        ],
        visual: 'hub',
        api: 'POST /agreement-desk/requests',
        payload: { lit: [] },
      },
      {
        title: 'HR agent starts hiring',
        loop: 'Ground',
        product: 'IAM for HR',
        say: 'Same motion as corporate onboarding — a requisition becomes an offer packet without HR re-typing.',
        decision: 'HR agent pulls 48 case-worker requisitions from CalHR and matches classification, oath, and bargaining-unit rules.',
        evidence: ['CalHR requisition sync', 'Oath of office required for state hires', 'Offer + policy packet templates selected'],
        visual: 'hub',
        api: 'GET /navigator/agreements?type=employment',
        payload: { lit: ['hr'] },
      },
      {
        title: 'Procurement agent buys capacity',
        loop: 'Prepare',
        product: 'CLM + playbooks',
        say: 'This is the vendor MSA. Emergency hotel rooms still have thresholds, standard terms, and a FI$Cal encumbrance.',
        decision: 'Procurement agent drafts a $1.2M hotel-block contract from first-party paper and flags the $1M legal/finance split.',
        evidence: ['Emergency purchase authority confirmed', 'Standard Terms library applied', 'Value $1.2M → parallel legal + finance'],
        visual: 'hub',
        api: 'POST /templates/{id}/documents',
        payload: { lit: ['hr', 'procurement'] },
      },
      {
        title: 'Operations agent partners agencies',
        loop: 'Route',
        product: 'CLM + Workspaces',
        say: 'Operations is the internal deal — an MOU between HCD, CalOES, and the county so cases can move.',
        decision: 'Operations agent assembles the inter-agency MOU and opens a three-party approval path from prior MOU language.',
        evidence: ['Prior HCD–CalOES MOU reused', 'Data-sharing exhibit attached', 'Parallel counsel review queued'],
        visual: 'hub',
        api: 'POST /workspaces',
        payload: { lit: ['hr', 'procurement', 'operations'] },
      },
      {
        title: 'Constituent agent opens the door',
        loop: 'Act',
        product: 'Web Forms + eSignature',
        say: 'This is customer onboarding. Residents apply on a phone, prove identity, and sign without leaving the portal.',
        decision: 'Constituent agent publishes the assistance Web Form and binds completions to HAP-2026-014.',
        evidence: ['AI-assisted Web Form live', 'Eligibility rules attached', 'Embedded signing + IDV ready'],
        visual: 'hub',
        api: 'POST /web_forms/instances',
        payload: { lit: ['hr', 'procurement', 'operations', 'constituent'] },
      },
      {
        title: 'One audit trail, four write-backs',
        loop: 'Monitor',
        product: 'Agreement Manager + Connect',
        say: 'When the signatures land, CalHR, FI$Cal, the case system, and Agreement Manager all update. Nothing lives in a shared drive.',
        decision: 'Orchestrator watches envelope-completed events and writes each lane back to its system of record.',
        evidence: ['HRIS updated for new hires', 'FI$Cal encumbrance posted', 'Resident case recertification dated'],
        visual: 'portfolio',
        api: 'POST /connect · envelope-completed',
        payload: {},
      },
    ],
  },

  hr: {
    id: 'hr',
    lane: 'HR',
    name: 'Onboarding agent',
    persona: { role: 'CalHR specialist', name: 'Maya Chen' },
    product: 'IAM for HR',
    liveHref: '/envelopes/send?prefill=hr',
    liveLabel: 'Send the HR onboarding packet →',
    chrome: 'Iris · HR Onboarding Agent',
    steps: [
      {
        title: 'Requisition arrives from CalHR',
        loop: 'Intake',
        product: 'IAM for HR',
        say: 'HR does not start from a blank packet. The agent reads the hire the same way a corporate HCM would.',
        decision: 'Agent accepts requisition REQ-8841: Marcus Williams, Case Worker, Public Works, start June 16, 2026.',
        evidence: ['Source: CalHR / HRIS event', 'Position, grade, and manager already populated', 'Shared program ID HAP-2026-014'],
        visual: 'chat',
        api: 'POST /agreement-desk/requests',
        payload: {
          user: 'New case worker: Marcus Williams, Public Works, start June 16. Build the onboarding packet.',
          iris: 'Requisition REQ-8841 matched. I will assemble offer, oath of office, and policy acknowledgments from the CalHR library.',
        },
      },
      {
        title: 'Policy and classification check',
        loop: 'Ground',
        product: 'Agreement Manager',
        say: 'Grounding is the difference. The agent checks classification, oath, I-9, and ethics — it does not invent a template name.',
        decision: 'Classification CW-II requires oath of office, I-9, ethics training, and SEIU bargaining acknowledgments.',
        evidence: ['Prior CW-II packets used as the pattern', 'Oath required for state employees', 'No conflict-of-interest waiver needed'],
        visual: 'policy',
        api: 'GET /navigator/agreements?employeeClass=CW-II',
        payload: {
          flags: [
            { text: 'Oath of office required', kind: 'ok' },
            { text: 'I-9 + mobile Verify', kind: 'ok' },
            { text: 'Ethics training in 30 days', kind: 'warn' },
            { text: 'SEIU acknowledgment', kind: 'ok' },
          ],
        },
      },
      {
        title: 'Packet assembled from IAM for HR',
        loop: 'Prepare',
        product: 'Agreement Prep',
        say: 'Offer letter, oath, and policies merge in seconds — the same hire packet every manager expects.',
        decision: 'Agent generates the onboarding bundle from approved HR templates and pre-fills salary and start date from CalHR.',
        evidence: ['Offer letter + oath + policy set', 'Fields mapped from HRIS', 'No copy-paste from last year’s Word file'],
        visual: 'document',
        api: 'POST /templates/{id}/documents',
        payload: {
          title: 'HR Onboarding Packet — Marcus Williams',
          lines: [
            'Position: Case Worker II · Public Works',
            'Start date: June 16, 2026 · Bargaining unit: SEIU 1000',
            'Included: Offer letter, oath of office, I-9, ethics, IT acceptable use.',
          ],
        },
      },
      {
        title: 'Manager and HR approve',
        loop: 'Route',
        product: 'Workflow Builder',
        say: 'Approvals are requested automatically. Hiring manager and HR — not a forwarded email chain.',
        decision: 'Route is sequential: hiring manager James Chen, then HR director. Ethics is notified, not blocking.',
        evidence: ['Manager approval SLA: 1 day', 'HR countersign on offer', 'Ethics training scheduled, not gated'],
        visual: 'route',
        api: 'POST /maestro/workflows/{id}/trigger',
        payload: {
          nodes: [
            { title: 'Manager', sub: 'James Chen' },
            { title: 'HR', sub: 'CalHR packet' },
            { title: 'Employee', sub: 'Marcus Williams' },
          ],
        },
      },
      {
        title: 'Employee signs the packet',
        loop: 'Act',
        product: 'eSignature',
        say: 'The new hire signs on a phone. IAM for HR keeps I-9 and the offer in one envelope.',
        decision: 'Agent sends envelope ENV-HR-4418 to Marcus Williams. Same OAuth session — no extra keys.',
        evidence: ['Mobile-friendly packet', 'I-9 verification attached', 'Envelope ID written to the requisition'],
        visual: 'envelope',
        api: 'POST /envelopes',
        payload: { title: 'HR Onboarding — Marcus Williams', status: 'Sent' },
      },
      {
        title: 'HRIS write-back and dates to watch',
        loop: 'Monitor',
        product: 'Connect + Agreement Manager',
        say: 'Day-one is not the end. Probation and policy re-ack become obligations the agent keeps watching.',
        decision: 'Connect posts envelope-completed to CalHR. Agent schedules probation review and ethics due date.',
        evidence: ['CalHR status: Hired — pending start', 'Ethics due July 16, 2026', 'FOIA-ready audit trail stored'],
        visual: 'portfolio',
        api: 'POST /connect · envelope-completed',
        payload: {},
      },
    ],
  },

  procurement: {
    id: 'procurement',
    lane: 'Procurement',
    name: 'Vendor contract agent',
    persona: { role: 'DGS procurement analyst', name: 'James Chen' },
    product: 'CLM + playbooks',
    liveHref: '/procurement-intake',
    liveLabel: 'Open Procurement & Intake →',
    chrome: 'Iris · Procurement Agent',
    steps: [
      {
        title: 'FI$Cal requisition lands',
        loop: 'Intake',
        product: 'Agreement Desk',
        say: 'Procurement starts as a buy request — hotel rooms for the program — not as a blank MSA.',
        decision: 'Agent reads FI$Cal REQ-HAP-220: $1.2M, 90-day hotel block, Sacramento region, vendor Pacific Stay Hotels.',
        evidence: ['ERP requisition pre-fills vendor and amount', 'Program ID HAP-2026-014 attached', 'Emergency housing commodity code matched'],
        visual: 'chat',
        api: 'POST /agreement-desk/requests',
        payload: {
          user: 'Emergency hotel block, $1.2M, 90 days, Sacramento. Use first-party paper.',
          iris: 'REQ-HAP-220 received. I will draft from the emergency lodging template and apply the $1M approval split.',
        },
      },
      {
        title: 'Thresholds and playbook',
        loop: 'Ground',
        product: 'Iris playbooks',
        say: 'Over a million dollars is not a vibe check. The agent knows the rule before legal is bothered.',
        decision: 'Value $1.2M exceeds the $1M threshold. Emergency purchase authority is valid. Indemnity must stay mutual.',
        evidence: ['Emergency PA-44 on file', 'Standard Terms v7 selected', 'Mutual indemnity is mandatory'],
        visual: 'policy',
        api: 'GET /iris/playbooks/procurement',
        payload: {
          flags: [
            { text: 'Emergency authority valid', kind: 'ok' },
            { text: '$1.2M → legal + finance', kind: 'warn' },
            { text: 'Mutual indemnity required', kind: 'ok' },
            { text: 'No most-favored-nation', kind: 'ok' },
          ],
        },
      },
      {
        title: 'First-party contract assembled',
        loop: 'Prepare',
        product: 'CLM',
        say: 'Agency paper, not hotel paper. Mandatory state clauses merge before anyone redlines.',
        decision: 'Agent generates the lodging services agreement from the first-party library and locks non-negotiable clauses.',
        evidence: ['First-party template, not vendor paper', 'Nondiscrimination and audit clauses inserted', 'SOW exhibit: 180 rooms, 90 days'],
        visual: 'document',
        api: 'POST /templates/{id}/documents',
        payload: {
          title: 'Emergency Lodging Agreement — Pacific Stay Hotels',
          lines: [
            'Value: $1,200,000 · Term: 90 days · Region: Sacramento',
            'Mandatory: audit access, nondiscrimination, mutual indemnity',
            'SOW: 180 rooms, weekly occupancy report to HCD',
          ],
        },
      },
      {
        title: 'Legal and finance in parallel',
        loop: 'Route',
        product: 'Workflow Builder',
        say: 'Simple POs auto-approve. This one does not — and the agent already knows the branch.',
        decision: 'Because value ≥ $1M, legal and finance run in parallel. Contracts officer remains the owner.',
        evidence: ['Branch rule: amount ≥ 1000000', 'Parallel path saves serial days', 'Owner: DGS contracts desk'],
        visual: 'route',
        api: 'POST /maestro/workflows/{id}/trigger',
        payload: {
          nodes: [
            { title: 'Legal', sub: 'Playbook compare' },
            { title: 'Finance', sub: 'Encumbrance check' },
            { title: 'Vendor', sub: 'Pacific Stay' },
          ],
        },
      },
      {
        title: 'Vendor signs the hotel block',
        loop: 'Act',
        product: 'eSignature',
        say: 'The envelope is the buy. Same send you already demo on the vendor MOU card.',
        decision: 'Agent sends ENV-PR-1092 to Pacific Stay. Countersign is the HCD contracting officer.',
        evidence: ['Secure delivery + reminders', 'No email attachment sprawl', 'Envelope linked to FI$Cal REQ-HAP-220'],
        visual: 'envelope',
        api: 'POST /envelopes',
        payload: { title: 'Emergency Lodging — Pacific Stay Hotels', status: 'Sent' },
      },
      {
        title: 'Encumbrance and occupancy obligation',
        loop: 'Monitor',
        product: 'Connect + FI$Cal',
        say: 'After signature the money moves and the report is due. That is post-execution IAM.',
        decision: 'Connect writes the executed amount to FI$Cal. Agent tracks weekly occupancy reports as an obligation.',
        evidence: ['FI$Cal encumbrance posted', 'Occupancy report due every Monday', 'Renewal window at day 75'],
        visual: 'portfolio',
        api: 'POST /connect · envelope-completed',
        payload: {},
      },
    ],
  },

  operations: {
    id: 'operations',
    lane: 'Operations',
    name: 'MOU + obligations agent',
    persona: { role: 'HCD operations lead', name: 'Priya Nair' },
    product: 'CLM + Agreement Manager',
    liveHref: '/gov-workflows?state=CA',
    liveLabel: 'Open the CA contract walkthrough →',
    chrome: 'Iris · Operations Agent',
    steps: [
      {
        title: 'Program needs partners',
        loop: 'Intake',
        product: 'Agreement Desk',
        say: 'Operations is the work companies call legal ops or facilities — here it is an inter-agency MOU so cases can move.',
        decision: 'Agent opens request MOU-HAP-07: HCD, CalOES, and Sacramento County for case referral and data sharing.',
        evidence: ['Request from program director Elena Ruiz', 'Purpose: surge case referral', 'County counsel must countersign'],
        visual: 'chat',
        api: 'POST /agreement-desk/requests',
        payload: {
          user: 'We need an MOU with CalOES and Sacramento County so HAP cases can transfer. Use last year’s template.',
          iris: 'I found MOU-2024-HCD-OES. I will reuse the operating clauses and attach a HAP data-sharing exhibit.',
        },
      },
      {
        title: 'Prior MOU and data rules',
        loop: 'Ground',
        product: 'Agreement Manager',
        say: 'The agent searches what the agencies already signed instead of starting from a blank Word file.',
        decision: 'Prior MOU is still in term. Data-sharing rules require encryption in transit and a 24-month retention cap.',
        evidence: ['MOU-2024-HCD-OES located', 'No material indemnity change allowed', 'County privacy addendum required'],
        visual: 'policy',
        api: 'GET /navigator/agreements?parties=CalOES,Sacramento',
        payload: {
          flags: [
            { text: 'Prior MOU reusable', kind: 'ok' },
            { text: '24-month data retention', kind: 'ok' },
            { text: 'County privacy addendum', kind: 'warn' },
            { text: 'Quarterly joint report', kind: 'ok' },
          ],
        },
      },
      {
        title: 'MOU plus data exhibit',
        loop: 'Prepare',
        product: 'CLM',
        say: 'Prepare is clause assembly — operating terms from the library, HAP-specific exhibit for this program.',
        decision: 'Agent drafts the 2026 MOU and attaches Exhibit B: HAP referral fields, encryption, and reporting calendar.',
        evidence: ['Operating terms from playbook', 'Exhibit B generated for HAP-2026-014', 'Fallback clauses staged if county redlines'],
        visual: 'document',
        api: 'POST /templates/{id}/documents',
        payload: {
          title: 'Inter-agency MOU — HCD · CalOES · Sacramento County',
          lines: [
            'Purpose: HAP case referral and temporary housing coordination',
            'Exhibit B: encrypted referral file, 24-month retention',
            'Reporting: quarterly joint dashboard to the program director',
          ],
        },
      },
      {
        title: 'Three counsel paths in parallel',
        loop: 'Route',
        product: 'Workspaces',
        say: 'Three agencies do not wait in a line. Parallel review is the operations win.',
        decision: 'Agent opens a workspace and assigns HCD legal, CalOES counsel, and County counsel as concurrent reviewers.',
        evidence: ['Workspace replaces email attachments', 'Each agency sees the same version', 'Fallback clauses ready if County objects'],
        visual: 'route',
        api: 'POST /workspaces',
        payload: {
          nodes: [
            { title: 'HCD Legal', sub: 'Owner' },
            { title: 'CalOES', sub: 'Counsel' },
            { title: 'County', sub: 'Counsel' },
          ],
        },
      },
      {
        title: 'Multi-party execution',
        loop: 'Act',
        product: 'eSignature',
        say: 'One envelope, three signers. That is how inter-agency work becomes real.',
        decision: 'Agent sends ENV-OPS-77 with routing order: HCD director, CalOES deputy, County executive.',
        evidence: ['Signing order respects agency protocol', 'Each signature is audit-ready', 'Fully executed copy to all three clerks'],
        visual: 'envelope',
        api: 'POST /envelopes',
        payload: { title: 'HAP Inter-agency MOU — 2026', status: 'Sent' },
      },
      {
        title: 'Reporting dates stay alive',
        loop: 'Monitor',
        product: 'Agreement Manager',
        say: 'The MOU is not a PDF in a drawer. Quarterly reports and the 24-month retention cap are obligations.',
        decision: 'Agent extracts reporting dates and retention into Agreement Manager and notifies Priya 14 days before each quarter.',
        evidence: ['Q1 report due April 15', 'Retention obligation visible to audit', 'Renewal flagged 90 days out'],
        visual: 'portfolio',
        api: 'GET /navigator/obligations?agreement=MOU-HAP-07',
        payload: {},
      },
    ],
  },

  constituent: {
    id: 'constituent',
    lane: 'Constituent',
    name: 'Resident intake agent',
    persona: { role: 'Resident', name: 'Robert Johnson' },
    product: 'Web Forms + eSignature',
    liveHref: '/webforms?sample=1',
    liveLabel: 'Launch the benefits Web Form →',
    chrome: 'Iris · Constituent Agent',
    steps: [
      {
        title: 'Resident starts on a phone',
        loop: 'Intake',
        product: 'Web Forms',
        say: 'Constituent-facing is customer onboarding. A resident applies for help — they never see Docusign as a separate product.',
        decision: 'Agent creates Web Form instance CASE-2026-00981 for Robert Johnson, Housing Assistance, ZIP 95814.',
        evidence: ['Public URL on hcd.ca.gov', 'AI-assisted form from the PDF packet', 'Mobile-first, no account required'],
        visual: 'form',
        api: 'POST /web_forms/instances',
        payload: {
          user: 'Apply for temporary housing assistance — Robert Johnson, household of 3, ZIP 95814.',
          iris: 'Form instance CASE-2026-00981 created. I will check eligibility against HAP rules before I generate the agreement.',
        },
      },
      {
        title: 'Eligibility against program rules',
        loop: 'Ground',
        product: 'Iris',
        say: 'The agent checks income, household, and disaster ZIP before a human touches the file.',
        decision: 'ZIP 95814 is inside the declared area. Household of 3 is eligible. Income attestation is complete — no manual review.',
        evidence: ['Declared-emergency ZIP match', 'Income under HAP ceiling', 'Identity name matches case file'],
        visual: 'policy',
        api: 'GET /iris/rules/hap-eligibility',
        payload: {
          flags: [
            { text: 'ZIP 95814 in declaration', kind: 'ok' },
            { text: 'Household size eligible', kind: 'ok' },
            { text: 'Income attestation complete', kind: 'ok' },
            { text: 'No fraud flags', kind: 'ok' },
          ],
        },
      },
      {
        title: 'Assistance agreement generated',
        loop: 'Prepare',
        product: 'Agreement Prep',
        say: 'A completed form becomes an agreement — terms, payment authorization, and recertification date.',
        decision: 'Agent generates the HAP assistance agreement and payment authorization from the approved resident template.',
        evidence: ['Terms written at 8th-grade reading level', 'Benefit start = signature date', 'Recertification in 90 days'],
        visual: 'document',
        api: 'POST /templates/{id}/documents',
        payload: {
          title: 'Housing Assistance Agreement — CASE-2026-00981',
          lines: [
            'Applicant: Robert Johnson · Household: 3 · ZIP 95814',
            'Benefit: temporary lodging placement through HAP',
            'Recertification: 90 days from signature',
          ],
        },
      },
      {
        title: 'Clean files auto-approve',
        loop: 'Route',
        product: 'Workflow Builder',
        say: 'Staff only see exceptions. Clean applications go straight to signature — that is the call-center win.',
        decision: 'No fraud or income flags. Agent auto-approves and skips the case-worker queue.',
        evidence: ['Exception queue is for flags only', 'SLA for flagged files: 2 business days', 'Robert never waits on a callback'],
        visual: 'route',
        payload: {
          nodes: [
            { title: 'Rules', sub: 'Auto-approve' },
            { title: 'IDV', sub: 'Gov ID' },
            { title: 'Resident', sub: 'Sign in portal' },
          ],
        },
        api: 'POST /maestro/workflows/{id}/trigger',
      },
      {
        title: 'Sign inside the resident portal',
        loop: 'Act',
        product: 'Embedded signing',
        say: 'Embedded signing plus ID verification. The resident never leaves the agency site.',
        decision: 'Agent opens an embedded signing session and requires government ID. Return URL writes back to the case.',
        evidence: ['No Docusign account needed', 'IDV on the same session', 'returnUrl updates CASE-2026-00981'],
        visual: 'envelope',
        api: 'POST /views/recipient',
        payload: { title: 'HAP Agreement — Robert Johnson', status: 'In session' },
      },
      {
        title: 'Case system and recertification',
        loop: 'Monitor',
        product: 'Connect + case system',
        say: 'Benefits start when the signature lands. The agent already calendared the 90-day recertification.',
        decision: 'Connect marks the case Approved and places Robert with Pacific Stay. Recertification task is created for day 83.',
        evidence: ['Case status: Approved', 'Hotel placement linked to the vendor contract', 'Recertification Web Form pre-scheduled'],
        visual: 'portfolio',
        api: 'POST /connect · envelope-completed',
        payload: {},
      },
    ],
  },
};

const GA_STATE = {
  agentId: 'program',
  step: 0,
  playing: false,
  timer: null,
};

function gaEl(id) {
  return document.getElementById(id);
}

function gaAgent() {
  return GA_AGENTS[GA_STATE.agentId] || GA_AGENTS.program;
}

function gaStep() {
  return gaAgent().steps[GA_STATE.step];
}

function gaEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function gaSelectAgent(id, opts = {}) {
  if (!GA_AGENTS[id]) id = 'program';
  gaStop();
  GA_STATE.agentId = id;
  GA_STATE.step = 0;
  document.querySelectorAll('.ga-agent-card').forEach((btn) => {
    const on = btn.dataset.agent === id;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('.ga-spoke').forEach((btn) => {
    btn.classList.toggle('is-on', btn.dataset.agent === id);
  });
  gaRender();
  if (opts.play) gaStart();
  if (!opts.silent) gaWriteUrl();
  if (!opts.skipScroll && id !== 'program') {
    gaEl('ga-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function gaGoToStep(index) {
  const steps = gaAgent().steps;
  GA_STATE.step = Math.max(0, Math.min(steps.length - 1, index));
  gaRender();
  gaWriteUrl();
}

function gaStepNext() {
  const last = gaAgent().steps.length - 1;
  if (GA_STATE.step >= last) {
    gaStop();
    return;
  }
  gaGoToStep(GA_STATE.step + 1);
}

function gaStepPrev() {
  if (GA_STATE.step <= 0) return;
  gaGoToStep(GA_STATE.step - 1);
}

function gaRestart() {
  gaStop();
  gaGoToStep(0);
}

function gaStart() {
  if (GA_STATE.playing) return;
  GA_STATE.playing = true;
  gaSyncPlayButton();
  GA_STATE.timer = setInterval(() => {
    const last = gaAgent().steps.length - 1;
    if (GA_STATE.step >= last) {
      gaStop();
      return;
    }
    gaGoToStep(GA_STATE.step + 1);
  }, GA_PLAY_MS);
}

function gaStop() {
  GA_STATE.playing = false;
  if (GA_STATE.timer) {
    clearInterval(GA_STATE.timer);
    GA_STATE.timer = null;
  }
  gaSyncPlayButton();
}

function gaTogglePlay() {
  if (GA_STATE.playing) gaStop();
  else gaStart();
}

function gaSyncPlayButton() {
  const btn = gaEl('ga-btn-play');
  if (!btn) return;
  btn.textContent = GA_STATE.playing ? '❚❚ Pause' : '▶ Play';
}

function gaWriteUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('agent', GA_STATE.agentId);
  if (GA_STATE.step > 0) url.searchParams.set('step', String(GA_STATE.step + 1));
  else url.searchParams.delete('step');
  history.replaceState({}, '', url);
}

function gaRenderLoopRail() {
  const host = gaEl('ga-loop-rail');
  if (!host) return;
  const current = gaStep()?.loop;
  const currentIdx = GA_LOOP.indexOf(current);
  host.innerHTML = GA_LOOP.map((label, i) => {
    const cls = i === currentIdx ? 'is-on' : i < currentIdx ? 'is-done' : '';
    return `<li class="${cls}">${label}</li>`;
  }).join('');
}

function gaRenderTrace() {
  const host = gaEl('ga-trace');
  if (!host) return;
  const steps = gaAgent().steps;
  host.innerHTML = steps.map((step, i) => {
    const cls = i === GA_STATE.step ? 'is-on' : i < GA_STATE.step ? 'is-done' : '';
    return `<li class="${cls}">
      <span class="ga-trace-num">${i + 1}</span>
      <span>${gaEscape(step.title)}</span>
      <span class="ga-trace-api">${gaEscape(step.api)}</span>
    </li>`;
  }).join('');
}

function gaRenderVisual(step) {
  const host = gaEl('ga-visual-canvas');
  if (!host) return;
  const p = step.payload || {};
  if (step.visual === 'hub') {
    const items = [
      { id: 'hr', title: 'HR agent', sub: '48 case-worker packets' },
      { id: 'procurement', title: 'Procurement agent', sub: '$1.2M hotel block' },
      { id: 'operations', title: 'Operations agent', sub: 'HCD · CalOES · County' },
      { id: 'constituent', title: 'Constituent agent', sub: 'Resident Web Form' },
    ];
    host.innerHTML = `<div class="ga-mock"><div class="ga-mock-hub">${items.map((item) => `
      <div class="ga-mock-hub-item${(p.lit || []).includes(item.id) ? ' is-lit' : ''}">
        <strong>${item.title}</strong>
        <span>${item.sub}</span>
      </div>`).join('')}</div></div>`;
    return;
  }
  if (step.visual === 'chat' || step.visual === 'form') {
    host.innerHTML = `<div class="ga-mock">
      <div class="ga-mock-row"><div class="ga-mock-bubble ga-mock-bubble--user"><span class="ga-mock-who">Request</span>${gaEscape(p.user)}</div></div>
      <div class="ga-mock-row"><div class="ga-mock-bubble ga-mock-bubble--iris"><span class="ga-mock-who">Iris agent</span>${gaEscape(p.iris)}</div></div>
    </div>`;
    return;
  }
  if (step.visual === 'policy') {
    host.innerHTML = `<div class="ga-mock">
      <div class="ga-mock-doc"><h3>Playbook check</h3><p>Grounded in agency rules and prior agreements — not a guessed template.</p></div>
      <div class="ga-mock-flags">${(p.flags || []).map((f) => `<span class="ga-mock-flag${f.kind ? ` ga-mock-flag--${f.kind}` : ''}">${gaEscape(f.text)}</span>`).join('')}</div>
    </div>`;
    return;
  }
  if (step.visual === 'document') {
    host.innerHTML = `<div class="ga-mock"><div class="ga-mock-doc">
      <h3>${gaEscape(p.title)}</h3>
      ${(p.lines || []).map((line) => `<p>${gaEscape(line)}</p>`).join('')}
    </div></div>`;
    return;
  }
  if (step.visual === 'route') {
    host.innerHTML = `<div class="ga-mock"><div class="ga-mock-route">${(p.nodes || []).map((n) => `
      <div class="ga-mock-node"><strong>${gaEscape(n.title)}</strong><span>${gaEscape(n.sub)}</span></div>`).join('')}</div></div>`;
    return;
  }
  if (step.visual === 'envelope') {
    host.innerHTML = `<div class="ga-mock"><div class="ga-mock-env">
      <div class="ga-mock-env-icon">✉</div>
      <div><strong>${gaEscape(p.title)}</strong><div class="ga-mock-flags" style="margin-top:8px"><span class="ga-mock-flag">${gaEscape(p.status)}</span></div></div>
    </div></div>`;
    return;
  }
  host.innerHTML = `<div class="ga-mock">
    <table class="ga-mock-table">
      <thead><tr><th>Obligation</th><th>Owner</th><th>Due</th></tr></thead>
      <tbody>
        <tr><td>Ethics training</td><td>HR · CalHR</td><td>Jul 16</td></tr>
        <tr><td>Occupancy report</td><td>Procurement</td><td>Every Monday</td></tr>
        <tr><td>Quarterly MOU report</td><td>Operations</td><td>Apr 15</td></tr>
        <tr><td>Resident recertification</td><td>Case system</td><td>Day 90</td></tr>
      </tbody>
    </table>
  </div>`;
}

function gaRender() {
  const agent = gaAgent();
  const step = gaStep();
  if (!step) return;
  const total = agent.steps.length;
  const idx = GA_STATE.step;
  gaEl('ga-step-counter').textContent = `Step ${idx + 1} of ${total}`;
  gaEl('ga-step-title').textContent = step.title;
  gaEl('ga-step-meta').textContent = `${agent.lane} · ${agent.name}`;
  gaEl('ga-persona').innerHTML = `<strong>${gaEscape(agent.persona.name)}</strong><span>${gaEscape(agent.persona.role)}</span>`;
  gaEl('ga-product-badge').textContent = step.product;
  gaEl('ga-say').textContent = step.say;
  gaEl('ga-decision').textContent = step.decision;
  gaEl('ga-evidence').innerHTML = step.evidence.map((item) => `<li>${gaEscape(item)}</li>`).join('');
  const live = gaEl('ga-live-link');
  live.href = agent.liveHref;
  live.textContent = agent.liveLabel;
  gaEl('ga-visual-title').textContent = agent.chrome;
  gaEl('ga-visual-state').textContent = step.loop;
  gaEl('ga-progress-bar').style.width = `${((idx + 1) / total) * 100}%`;
  gaEl('ga-btn-prev').disabled = idx <= 0;
  gaEl('ga-btn-next').disabled = idx >= total - 1;
  gaRenderLoopRail();
  gaRenderTrace();
  gaRenderVisual(step);
}

function gaReadUrl() {
  const params = new URLSearchParams(window.location.search);
  const agent = (params.get('agent') || '').toLowerCase();
  const step = parseInt(params.get('step') || '1', 10);
  const play = params.get('play') === '1' || sessionStorage.getItem('gw-user-start-play') === '1';
  if (play) sessionStorage.removeItem('gw-user-start-play');
  gaSelectAgent(GA_AGENTS[agent] ? agent : 'program', { silent: true, skipScroll: true });
  if (step > 1) gaGoToStep(step - 1);
  if (play) gaStart();
}

document.addEventListener('DOMContentLoaded', () => {
  gaReadUrl();
  document.addEventListener('keydown', (event) => {
    if (event.target.closest('input, textarea, select')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); gaStepNext(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); gaStepPrev(); }
    if (event.key === ' ' || event.key === 'p' || event.key === 'P') { event.preventDefault(); gaTogglePlay(); }
    if (event.key === 'r' || event.key === 'R') { event.preventDefault(); gaRestart(); }
  });
});

window.gaSelectAgent = gaSelectAgent;
window.gaTogglePlay = gaTogglePlay;
window.gaStepNext = gaStepNext;
window.gaStepPrev = gaStepPrev;
window.gaRestart = gaRestart;
window.gaGoToStep = gaGoToStep;
