/* Workflow Discovery — animated Visio-style process maps for consultant discovery */

/** Symmetric layout grid — all diagrams anchor to these coordinates */
const WF_DISC_X = { L: 16, C: 50, R: 84 };
const WF_DISC_Y = {
  chain: (i, total) => 10 + (i / Math.max(total - 1, 1)) * 78,
  fork: { s: 8, b: 22, row: 40, merge: 56, sign: 70, end: 84 },
  tall: { s: 6, b: 18, row: 34, merge: 50, mid: 62, sign: 74, end: 88 },
};

const WF_DISC_SCENARIOS = {
  linear: {
    title: 'Linear HR onboarding',
    tag: 'Sequential',
    icon: '📋',
    blurb: 'Classic chain — each approver waits for the prior step. Common for HR packets and policy acknowledgments.',
    playOrder: ['start', 'mgr', 'hr', 'docs', 'sign', 'end'],
    steps: [
      { node: 'start', headline: 'Employee submits packet', body: 'New hire uploads I-9, benefits elections, and policy acknowledgments through the agency portal.', say: '“Most agencies still run HR onboarding as a straight line — manager, then HR, then signature.”' },
      { node: 'mgr', headline: 'Manager certifies role', body: 'Department manager confirms job code, start date, and budget line before HR sees the file.', say: '“No one downstream works until the manager release — that’s the bottleneck we hear about.”' },
      { node: 'hr', headline: 'HR compliance review', body: 'HR validates eligibility, benefits tier, and background check status against state personnel rules.', say: '“HR is the system-of-record gate — they attach supporting docs before anything goes to sign.”' },
      { node: 'docs', headline: 'Supporting documentation', body: 'Personnel action form, job classification, and union notification stored with the request.', say: '“Audit trail matters — every attachment rides with the workflow, not email threads.”' },
      { node: 'sign', headline: 'Employee & HR sign', body: 'eSignature captures employee acknowledgment and HR countersignature on the personnel action.', say: '“Signature closes the loop — status syncs back to your HRIS via Connect.”' },
      { node: 'end', headline: 'Onboarding complete', body: 'Workflow Builder marks complete and triggers provisioning tasks.', say: '“This is the before picture — Workflow Builder automates the handoffs you’re doing manually today.”' },
    ],
    nodes: [
      { id: 'start', type: 'start', label: 'Submit packet', sub: 'Employee portal', icon: '📋', x: WF_DISC_X.C, y: WF_DISC_Y.chain(0, 6) },
      { id: 'mgr', type: 'approval', label: 'Manager approval', sub: 'Dept supervisor', icon: '👤', x: WF_DISC_X.C, y: WF_DISC_Y.chain(1, 6) },
      { id: 'hr', type: 'approval', label: 'HR review', sub: 'Compliance', icon: '🏛', x: WF_DISC_X.C, y: WF_DISC_Y.chain(2, 6) },
      { id: 'docs', type: 'task', label: 'Attach documents', sub: 'PA · union notice', icon: '📎', x: WF_DISC_X.C, y: WF_DISC_Y.chain(3, 6) },
      { id: 'sign', type: 'sign', label: 'Sign & acknowledge', sub: 'Employee + HR', icon: '✍', x: WF_DISC_X.C, y: WF_DISC_Y.chain(4, 6) },
      { id: 'end', type: 'end', label: 'Complete', sub: 'Sync to HRIS', icon: '🏁', x: WF_DISC_X.C, y: WF_DISC_Y.chain(5, 6) },
    ],
    edges: [
      ['start', 'mgr'], ['mgr', 'hr'], ['hr', 'docs'], ['docs', 'sign'], ['sign', 'end'],
    ],
  },

  threshold: {
    title: 'Procurement · dollar threshold',
    tag: 'Business rule',
    icon: '💰',
    blurb: 'Route changes when contract value exceeds a policy limit — executive and DGS review only on high-value MSAs.',
    playOrder: ['start', 'branch', 'dept', 'exec', 'legal', 'sign', 'end'],
    steps: [
      { node: 'start', headline: 'Requisition submitted', body: 'Program office submits REQ with FI$Cal encumbrance and vendor quote attached.', say: '“Procurement is where dollar thresholds create different paths — same form, different approvers.”' },
      { node: 'branch', headline: 'Business rule evaluates', body: 'Workflow checks total contract value against Cal eProcurement thresholds ($250K / $1M tiers).', say: '“This diamond is a branching rule — no human has to remember the policy table.”' },
      { node: 'dept', headline: 'Under threshold path', body: 'Department head approval only — faster path for renewals and task orders under limit.', say: '“Under $250K? Stay in the department — legal still sees it on DGS STD 213.”' },
      { node: 'exec', headline: 'Over threshold path', body: 'Executive sponsor + DGS policy review required before legal redline.', say: '“Over the limit — executive and DGS get inserted automatically.”' },
      { node: 'legal', headline: 'Legal & risk review', body: 'DGS legal validates STD 213 language, insurance, and liability caps.', say: '“Both paths merge here — legal is the common gate before signature.”' },
      { node: 'sign', headline: 'Authorized signers', body: 'Agency program manager and vendor counter-sign on DGS paper.', say: '“Signature order is pre-set in the template — no routing mistakes.”' },
      { node: 'end', headline: 'Contract registered', body: 'Executed agreement lands in Agreement Manager; Connect updates FI$Cal.', say: '“Threshold logic is exactly what Workflow Builder encodes once — runs every time.”' },
    ],
    nodes: [
      { id: 'start', type: 'start', label: 'Submit REQ', sub: 'FI$Cal prefill', icon: '📝', x: WF_DISC_X.C, y: WF_DISC_Y.fork.s },
      { id: 'branch', type: 'branch', label: 'Value > $250K?', sub: 'Business rule', icon: '⑂', x: WF_DISC_X.C, y: WF_DISC_Y.fork.b },
      { id: 'dept', type: 'approval', label: 'Dept head', sub: 'Under limit', icon: '👤', x: WF_DISC_X.L, y: WF_DISC_Y.fork.row, compact: true },
      { id: 'exec', type: 'approval', label: 'Exec + DGS', sub: 'Over limit', icon: '⭐', x: WF_DISC_X.R, y: WF_DISC_Y.fork.row, compact: true },
      { id: 'legal', type: 'approval', label: 'Legal review', sub: 'DGS policy', icon: '⚖', x: WF_DISC_X.C, y: WF_DISC_Y.fork.merge },
      { id: 'sign', type: 'sign', label: 'Sign MSA', sub: 'Agency + vendor', icon: '✍', x: WF_DISC_X.C, y: WF_DISC_Y.fork.sign },
      { id: 'end', type: 'end', label: 'Registered', sub: 'Agreement Mgr', icon: '🏁', x: WF_DISC_X.C, y: WF_DISC_Y.fork.end },
    ],
    edges: [
      ['start', 'branch'],
      ['branch', 'dept', '≤ $250K'],
      ['branch', 'exec', '> $250K'],
      ['dept', 'legal'],
      ['exec', 'legal'],
      ['legal', 'sign'],
      ['sign', 'end'],
    ],
  },

  department: {
    title: 'Route by department',
    tag: 'Department rule',
    icon: '🏢',
    blurb: 'Same intake form — path follows submitting organization: IT, Finance, or HR each has a different review chain.',
    playOrder: ['start', 'branch', 'it', 'fin', 'hr', 'merge', 'sign', 'end'],
    steps: [
      { node: 'start', headline: 'Unified intake', body: 'All departments use one Agreement Desk request type — metadata captures org code.', say: '“One front door — but IT, Finance, and HR don’t share the same approvers.”' },
      { node: 'branch', headline: 'Department detected', body: 'Workflow reads cost center / dept ID from HR feed or form field.', say: '“The branch key is department — we see this in every large agency.”' },
      { node: 'it', headline: 'IT path', body: 'Security architecture review → CIO delegate → vendor risk assessment.', say: '“IT purchases hit security first — different from a facilities contract.”' },
      { node: 'fin', headline: 'Finance path', body: 'Budget analyst → controller delegate → FI$Cal encumbrance check.', say: '“Finance path validates appropriation before legal ever opens the file.”' },
      { node: 'hr', headline: 'HR path', body: 'Workforce planning → labor relations if applicable → personnel policy.', say: '“HR path adds union and classification steps others skip.”' },
      { node: 'merge', headline: 'Paths merge', body: 'All routes converge at legal review with department-specific attachments preserved.', say: '“Merge point is where Docusign shines — one audit trail, many entry paths.”' },
      { node: 'sign', headline: 'Sign & execute', body: 'Authorized delegate signs per delegation of authority matrix.', say: '“Signer group comes from the DOA table — not a static name in email.”' },
      { node: 'end', headline: 'Closed loop', body: 'Status returned to source system and Agreement Manager.', say: '“Department routing is discovery gold — ask which org codes change the path.”' },
    ],
    nodes: [
      { id: 'start', type: 'start', label: 'Desk intake', sub: 'All departments', icon: '📥', x: WF_DISC_X.C, y: WF_DISC_Y.fork.s },
      { id: 'branch', type: 'branch', label: 'Which dept?', sub: 'Org code rule', icon: '⑂', x: WF_DISC_X.C, y: WF_DISC_Y.fork.b },
      { id: 'it', type: 'approval', label: 'IT Security', sub: 'CIO path', icon: '💻', x: WF_DISC_X.L, y: WF_DISC_Y.fork.row, compact: true },
      { id: 'fin', type: 'approval', label: 'Finance', sub: 'Budget ctrl', icon: '💵', x: WF_DISC_X.C, y: WF_DISC_Y.fork.row, compact: true },
      { id: 'hr', type: 'approval', label: 'HR Policy', sub: 'Workforce', icon: '👥', x: WF_DISC_X.R, y: WF_DISC_Y.fork.row, compact: true },
      { id: 'merge', type: 'task', label: 'Legal merge', sub: 'Common review', icon: '⚖', x: WF_DISC_X.C, y: WF_DISC_Y.fork.merge },
      { id: 'sign', type: 'sign', label: 'Execute', sub: 'DOA signer', icon: '✍', x: WF_DISC_X.C, y: WF_DISC_Y.fork.sign },
      { id: 'end', type: 'end', label: 'Complete', sub: 'ERP sync', icon: '🏁', x: WF_DISC_X.C, y: WF_DISC_Y.fork.end },
    ],
    edges: [
      ['start', 'branch'],
      ['branch', 'it', 'IT'],
      ['branch', 'fin', 'Finance'],
      ['branch', 'hr', 'HR'],
      ['it', 'merge'],
      ['fin', 'merge'],
      ['hr', 'merge'],
      ['merge', 'sign'],
      ['sign', 'end'],
    ],
  },

  quorum: {
    title: 'Authorized approver group',
    tag: 'Parallel quorum',
    icon: '👥',
    blurb: 'Board or commission actions — any 3 of 5 authorized signers must approve before execution.',
    playOrder: ['start', 'legal', 'a1', 'a2', 'a3', 'merge', 'sign', 'end'],
    steps: [
      { node: 'start', headline: 'Resolution submitted', body: 'Clerk uploads board resolution and supporting fiscal impact analysis.', say: '“Commissions don’t have one boss — they have a roster of authorized voters.”' },
      { node: 'legal', headline: 'County counsel review', body: 'Legal validates open meeting act compliance and resolution language.', say: '“Counsel clears the packet before commissioners see it.”' },
      { node: 'a1', headline: 'Parallel approvals', body: 'Five commissioners receive tasks simultaneously — need 3 approvals to proceed.', say: '“Parallel path — no sequential waiting; quorum rule decides when you’re done.”' },
      { node: 'merge', headline: 'Quorum met', body: 'Workflow Builder counts approvals — at 3 of 5, route advances automatically.', say: '“This is process engineering — encode quorum once, never chase email again.”' },
      { node: 'sign', headline: 'Chair signature', body: 'Chair signs execution copy; clerk certifies and publishes to board portal.', say: '“Final signature may be one role even though many approved.”' },
      { node: 'end', headline: 'Resolution filed', body: 'Recorded in minutes system with immutable audit trail.', say: '“Ask about quorum rules — they map cleanly to Workflow Builder branching.”' },
    ],
    nodes: [
      { id: 'start', type: 'start', label: 'Submit resolution', sub: 'Clerk intake', icon: '📋', x: WF_DISC_X.C, y: WF_DISC_Y.fork.s },
      { id: 'legal', type: 'approval', label: 'Counsel review', sub: 'Legal clearance', icon: '⚖', x: WF_DISC_X.C, y: WF_DISC_Y.fork.b },
      { id: 'a1', type: 'parallel', label: 'Comm. A', sub: 'Vote', icon: '①', x: WF_DISC_X.L, y: WF_DISC_Y.fork.row, compact: true },
      { id: 'a2', type: 'parallel', label: 'Comm. B', sub: 'Vote', icon: '②', x: WF_DISC_X.C, y: WF_DISC_Y.fork.row, compact: true },
      { id: 'a3', type: 'parallel', label: 'Comm. C–E', sub: '3 of 5', icon: '③', x: WF_DISC_X.R, y: WF_DISC_Y.fork.row, compact: true },
      { id: 'merge', type: 'task', label: 'Quorum check', sub: '≥ 3 approvals', icon: '✓', x: WF_DISC_X.C, y: WF_DISC_Y.fork.merge },
      { id: 'sign', type: 'sign', label: 'Chair signs', sub: 'Execution copy', icon: '✍', x: WF_DISC_X.C, y: WF_DISC_Y.fork.sign },
      { id: 'end', type: 'end', label: 'Filed', sub: 'Minutes system', icon: '🏁', x: WF_DISC_X.C, y: WF_DISC_Y.fork.end },
    ],
    edges: [
      ['start', 'legal'],
      ['legal', 'a1'],
      ['legal', 'a2'],
      ['legal', 'a3'],
      ['a1', 'merge'],
      ['a2', 'merge'],
      ['a3', 'merge'],
      ['merge', 'sign'],
      ['sign', 'end'],
    ],
  },

  constituent: {
    title: 'Self-service constituent',
    tag: 'Web Form',
    icon: '🌐',
    blurb: 'Public-facing Web Form intake — citizen or vendor submits online, agency reviews, auto-routes with supporting uploads.',
    playOrder: ['webform', 'auto', 'review', 'docs', 'notify', 'end'],
    steps: [
      { node: 'webform', headline: 'Public Web Form', body: 'Constituent completes permit application or vendor registration — no account required.', say: '“Self-service starts with Web Forms — the public never sees your internal workflow.”' },
      { node: 'auto', headline: 'Auto-route', body: 'Submission triggers Workflow Builder with prefill from form answers and geolocation/jurisdiction.', say: '“Routing is automatic — jurisdiction field picks the right department queue.”' },
      { node: 'review', headline: 'Agency review', body: 'Planner or analyst validates completeness — request changes via Agreement Desk message.', say: '“Staff review is the first human touch — everything before was self-service.”' },
      { node: 'docs', headline: 'Supporting docs', body: 'Applicant uploads plans, insurance, or ID — stored with the request record.', say: '“Supporting documentation rides with the submission — not lost in email.”' },
      { node: 'notify', headline: 'Status notification', body: 'Email/SMS confirmation with tracking number; Connect updates CRM or case system.', say: '“Constituents get transparency — agencies get audit trail.”' },
      { node: 'end', headline: 'Approved or denied', body: 'Decision letter generated; optional eSignature for applicant acknowledgment.', say: '“This pattern works for permits, grants, and vendor onboarding.”' },
    ],
    nodes: [
      { id: 'webform', type: 'webform', label: 'Web Form submit', sub: 'Public · mobile', icon: '📝', x: WF_DISC_X.C, y: WF_DISC_Y.chain(0, 6) },
      { id: 'auto', type: 'task', label: 'Auto-route', sub: 'Jurisdiction rule', icon: '⚡', x: WF_DISC_X.C, y: WF_DISC_Y.chain(1, 6) },
      { id: 'review', type: 'approval', label: 'Agency review', sub: 'Planner / analyst', icon: '👤', x: WF_DISC_X.C, y: WF_DISC_Y.chain(2, 6) },
      { id: 'docs', type: 'task', label: 'Supporting docs', sub: 'Uploads attached', icon: '📎', x: WF_DISC_X.C, y: WF_DISC_Y.chain(3, 6) },
      { id: 'notify', type: 'task', label: 'Notify applicant', sub: 'Email · SMS', icon: '✉', x: WF_DISC_X.C, y: WF_DISC_Y.chain(4, 6) },
      { id: 'end', type: 'end', label: 'Decision', sub: 'Optional sign', icon: '🏁', x: WF_DISC_X.C, y: WF_DISC_Y.chain(5, 6) },
    ],
    edges: [
      ['webform', 'auto'], ['auto', 'review'], ['review', 'docs'], ['docs', 'notify'], ['notify', 'end'],
    ],
  },

  hub_legal: {
    title: 'Hub & spoke · Legal',
    tag: 'Legal spoke',
    icon: '⚖',
    blurb: 'Agreement Desk hub routes contract requests into the Legal spoke — playbook match, redline, and risk review before release back to the hub.',
    playOrder: ['start', 'hub', 'assign', 'playbook', 'redline', 'release', 'sign', 'end'],
    steps: [
      { node: 'start', headline: 'Request arrives', body: 'Email, desk form, or ERP event creates one record in Agreement Desk.', say: '“Every contract starts at the hub — Legal only sees what gets triaged to them.”' },
      { node: 'hub', headline: 'Agreement Desk hub', body: 'Intake coordinator classifies request type — MSA, interagency, grant, or amendment.', say: '“The hub is the front door — Legal is one spoke, not the default path for everything.”' },
      { node: 'assign', headline: 'Route to Legal queue', body: 'Workflow Builder assigns to DGS legal queue based on contract type and agency org code.', say: '“When it’s a legal matter, the hub hands off — status stays visible to everyone.”' },
      { node: 'playbook', headline: 'Playbook match', body: 'Analyst matches STD 213, MSA playbook, or interagency template — Iris AI scorecard optional.', say: '“Playbook first — how much of this is template vs custom redline?”' },
      { node: 'redline', headline: 'Redline & negotiate', body: 'Legal analyst reviews vendor markup, liability caps, and insurance requirements.', say: '“This is usually the longest pole — ask who redlines today and where versions live.”' },
      { node: 'release', headline: 'Return to hub', body: 'Legal spoke complete — hub confirms attachments and routes to signature packet.', say: '“Spoke done — hub reconvenes before anyone signs.”' },
      { node: 'sign', headline: 'Execute envelope', body: 'Template-based envelope with legal-approved language and exhibits attached.', say: '“Signature packet builds from the spoke output — no re-keying.”' },
      { node: 'end', headline: 'Enterprise record', body: 'Executed agreement in Agreement Manager; Connect syncs to ERP.', say: '“This is the Legal spoke in isolation — same hub, focused conversation.”' },
    ],
    nodes: [
      { id: 'start', type: 'start', label: 'Intake event', sub: 'Desk · ERP · email', icon: '📥', x: WF_DISC_X.C, y: WF_DISC_Y.chain(0, 8) },
      { id: 'hub', type: 'hub', label: 'Agreement Desk', sub: 'Central hub', icon: '🎯', x: WF_DISC_X.C, y: WF_DISC_Y.chain(1, 8) },
      { id: 'assign', type: 'spoke', label: 'Legal queue', sub: 'Auto-assigned', icon: '⚖', x: WF_DISC_X.C, y: WF_DISC_Y.chain(2, 8) },
      { id: 'playbook', type: 'task', label: 'Playbook match', sub: 'STD 213 · MSA', icon: '📘', x: WF_DISC_X.C, y: WF_DISC_Y.chain(3, 8) },
      { id: 'redline', type: 'approval', label: 'Redline review', sub: 'Legal analyst', icon: '✎', x: WF_DISC_X.C, y: WF_DISC_Y.chain(4, 8) },
      { id: 'release', type: 'hub', label: 'Hub release', sub: 'Spoke complete', icon: '🔗', x: WF_DISC_X.C, y: WF_DISC_Y.chain(5, 8) },
      { id: 'sign', type: 'sign', label: 'Sign packet', sub: 'Template envelope', icon: '✍', x: WF_DISC_X.C, y: WF_DISC_Y.chain(6, 8) },
      { id: 'end', type: 'end', label: 'Archive', sub: 'IAM + ERP', icon: '🏁', x: WF_DISC_X.C, y: WF_DISC_Y.chain(7, 8) },
    ],
    edges: [
      ['start', 'hub'], ['hub', 'assign'], ['assign', 'playbook'], ['playbook', 'redline'],
      ['redline', 'release'], ['release', 'sign'], ['sign', 'end'],
    ],
  },

  hub_proc: {
    title: 'Hub & spoke · Procurement',
    tag: 'Procurement spoke',
    icon: '💰',
    blurb: 'Agreement Desk hub routes purchase and contract requests into Procurement — FI$Cal, competition rules, and DGS thresholds before hub release.',
    playOrder: ['start', 'hub', 'assign', 'fiscal', 'compete', 'release', 'sign', 'end'],
    steps: [
      { node: 'start', headline: 'Request arrives', body: 'Requisition, REQ, or contract request lands in Agreement Desk from program office or ERP.', say: '“Procurement spoke activates when the hub tags it as a buy — not every intake.”' },
      { node: 'hub', headline: 'Agreement Desk hub', body: 'Intake coordinator validates commodity code, estimated value, and submitting department.', say: '“Hub triage decides if Procurement needs to run — dollar amount and type drive the rule.”' },
      { node: 'assign', headline: 'Route to Procurement', body: 'Workflow assigns to procurement analyst queue with FI$Cal prefill attached.', say: '“Handoff from hub to Procurement — one record, no duplicate REQ in email.”' },
      { node: 'fiscal', headline: 'FI$Cal encumbrance', body: 'Analyst confirms appropriation, fund source, and encumbrance before competition review.', say: '“Dollar validation happens here — ask where encumbrance is checked today.”' },
      { node: 'compete', headline: 'Competition & DGS', body: 'Competition requirements, DGS thresholds, and STD 213 routing per Cal eProcurement policy.', say: '“Threshold rules live here — encode once in Workflow Builder.”' },
      { node: 'release', headline: 'Return to hub', body: 'Procurement spoke complete — hub assembles signature packet with fiscal attachments.', say: '“Spoke returns to hub — Legal may still run on a parallel track if needed.”' },
      { node: 'sign', headline: 'Execute contract', body: 'Agency program manager and vendor sign on DGS paper or eSignature envelope.', say: '“Signature order is pre-set — procurement artifacts ride with the packet.”' },
      { node: 'end', headline: 'Contract registered', body: 'Executed agreement in Agreement Manager; FI$Cal updated via Connect.', say: '“Closed loop — procurement spoke only, same hub pattern.”' },
    ],
    nodes: [
      { id: 'start', type: 'start', label: 'Intake event', sub: 'REQ · desk · ERP', icon: '📥', x: WF_DISC_X.C, y: WF_DISC_Y.chain(0, 8) },
      { id: 'hub', type: 'hub', label: 'Agreement Desk', sub: 'Central hub', icon: '🎯', x: WF_DISC_X.C, y: WF_DISC_Y.chain(1, 8) },
      { id: 'assign', type: 'spoke', label: 'Procurement queue', sub: 'Auto-assigned', icon: '💰', x: WF_DISC_X.C, y: WF_DISC_Y.chain(2, 8) },
      { id: 'fiscal', type: 'task', label: 'FI$Cal check', sub: 'Encumbrance', icon: '📊', x: WF_DISC_X.C, y: WF_DISC_Y.chain(3, 8) },
      { id: 'compete', type: 'approval', label: 'Competition review', sub: 'DGS threshold', icon: '✓', x: WF_DISC_X.C, y: WF_DISC_Y.chain(4, 8) },
      { id: 'release', type: 'hub', label: 'Hub release', sub: 'Spoke complete', icon: '🔗', x: WF_DISC_X.C, y: WF_DISC_Y.chain(5, 8) },
      { id: 'sign', type: 'sign', label: 'Sign contract', sub: 'Agency + vendor', icon: '✍', x: WF_DISC_X.C, y: WF_DISC_Y.chain(6, 8) },
      { id: 'end', type: 'end', label: 'Registered', sub: 'FI$Cal sync', icon: '🏁', x: WF_DISC_X.C, y: WF_DISC_Y.chain(7, 8) },
    ],
    edges: [
      ['start', 'hub'], ['hub', 'assign'], ['assign', 'fiscal'], ['fiscal', 'compete'],
      ['compete', 'release'], ['release', 'sign'], ['sign', 'end'],
    ],
  },

  hub_hr: {
    title: 'Hub & spoke · HR',
    tag: 'HR spoke',
    icon: '👥',
    blurb: 'Agreement Desk hub routes personnel-related requests into HR — workforce impact, classification, and union notification before hub release.',
    playOrder: ['start', 'hub', 'assign', 'workforce', 'union', 'release', 'sign', 'end'],
    steps: [
      { node: 'start', headline: 'Request arrives', body: 'Personnel action, MOU, or benefits change request enters Agreement Desk.', say: '“HR spoke triggers when the hub detects workforce implications — not every contract.”' },
      { node: 'hub', headline: 'Agreement Desk hub', body: 'Intake coordinator flags personnel impact, job classification, and union applicability.', say: '“Hub decides if HR must weigh in — org code and request type drive the rule.”' },
      { node: 'assign', headline: 'Route to HR queue', body: 'Workflow assigns to workforce planning or labor relations analyst queue.', say: '“Clean handoff — HR sees the same record the hub created.”' },
      { node: 'workforce', headline: 'Workforce impact', body: 'HR validates classification, FTE impact, and personnel action requirements.', say: '“Ask who checks classification today — often buried in email to HR generalists.”' },
      { node: 'union', headline: 'Union / LR review', body: 'Labor relations notified if MOU, side letter, or bargaining unit impact applies.', say: '“Union path is conditional — encode the rule so it never gets skipped.”' },
      { node: 'release', headline: 'Return to hub', body: 'HR spoke complete — hub confirms personnel attachments and routes to signature.', say: '“Spoke returns to hub — program office sees status without chasing HR.”' },
      { node: 'sign', headline: 'Execute packet', body: 'Authorized delegate signs personnel action or agreement with HR countersignature if required.', say: '“Signature roles come from policy — not a static name in email.”' },
      { node: 'end', headline: 'HRIS sync', body: 'Personnel record updated; Connect posts status back to Workday or HRIS.', say: '“HR spoke in isolation — same hub pattern, different specialist path.”' },
    ],
    nodes: [
      { id: 'start', type: 'start', label: 'Intake event', sub: 'Desk · HRIS · email', icon: '📥', x: WF_DISC_X.C, y: WF_DISC_Y.chain(0, 8) },
      { id: 'hub', type: 'hub', label: 'Agreement Desk', sub: 'Central hub', icon: '🎯', x: WF_DISC_X.C, y: WF_DISC_Y.chain(1, 8) },
      { id: 'assign', type: 'spoke', label: 'HR queue', sub: 'Auto-assigned', icon: '👥', x: WF_DISC_X.C, y: WF_DISC_Y.chain(2, 8) },
      { id: 'workforce', type: 'approval', label: 'Workforce review', sub: 'Classification', icon: '🏛', x: WF_DISC_X.C, y: WF_DISC_Y.chain(3, 8) },
      { id: 'union', type: 'task', label: 'Union / LR notify', sub: 'If applicable', icon: '📋', x: WF_DISC_X.C, y: WF_DISC_Y.chain(4, 8) },
      { id: 'release', type: 'hub', label: 'Hub release', sub: 'Spoke complete', icon: '🔗', x: WF_DISC_X.C, y: WF_DISC_Y.chain(5, 8) },
      { id: 'sign', type: 'sign', label: 'Sign packet', sub: 'Delegate + HR', icon: '✍', x: WF_DISC_X.C, y: WF_DISC_Y.chain(6, 8) },
      { id: 'end', type: 'end', label: 'HRIS sync', sub: 'Workday · ERP', icon: '🏁', x: WF_DISC_X.C, y: WF_DISC_Y.chain(7, 8) },
    ],
    edges: [
      ['start', 'hub'], ['hub', 'assign'], ['assign', 'workforce'], ['workforce', 'union'],
      ['union', 'release'], ['release', 'sign'], ['sign', 'end'],
    ],
  },

  autoroute: {
    title: 'Automated rule routing',
    tag: 'Auto routing',
    icon: '⚡',
    blurb: 'ERP or Connect event hits a rules engine — contract type, amount, and department assign queues with zero manual triage.',
    playOrder: ['trigger', 'rules', 'legal', 'proc', 'hr', 'merge', 'pool', 'sign', 'end'],
    steps: [
      { node: 'trigger', headline: 'System event fires', body: 'FI$Cal encumbrance, Workday requisition, or Agreement Desk API posts trigger_inputs — no human opens the file first.', say: '“This is automated rule routing — the workflow decides where it goes before anyone checks email.”' },
      { node: 'rules', headline: 'Rules engine evaluates', body: 'Workflow Builder checks contract type (MSA vs grant), amount tiers, and submitting org code in one pass.', say: '“Multiple rules can fire at once — amount AND department AND document type.”' },
      { node: 'legal', headline: 'Legal queue (auto)', body: 'MSA or interagency agreement → auto-assigned to DGS legal queue with playbook template.', say: '“Legal queue only when the rule matches — not every request.”' },
      { node: 'proc', headline: 'Procurement queue (auto)', body: 'Purchase over competition threshold → procurement analyst queue with FI$Cal attachment.', say: '“Procurement spoke activates on dollar and commodity rules.”' },
      { node: 'hr', headline: 'HR queue (auto)', body: 'Personnel action or benefits change → HR workforce queue with union flag if applicable.', say: '“HR path triggers on job classification fields from ERP.”' },
      { node: 'merge', headline: 'Rules complete', body: 'All required queues satisfied — workflow waits for parallel spoke completion before release.', say: '“The engine tracks which queues were required vs skipped.”' },
      { node: 'pool', headline: 'Authorized approver pool', body: 'Delegation-of-authority matrix picks signer from authorized group — not a named individual in email.', say: '“Approver pools are discovery gold — ask who can sign at each dollar tier.”' },
      { node: 'sign', headline: 'Execute envelope', body: 'Template and attachments assembled automatically from spoke outputs.', say: '“Signature packet builds itself from rule outcomes.”' },
      { node: 'end', headline: 'ERP sync', body: 'Connect posts status back to FI$Cal and Agreement Manager — closed loop.', say: '“This is the ‘after’ picture — rules replace manual routing tables.”' },
    ],
    nodes: [
      { id: 'trigger', type: 'start', label: 'ERP trigger', sub: 'FI$Cal · Workday', icon: '⚡', x: WF_DISC_X.C, y: WF_DISC_Y.tall.s },
      { id: 'rules', type: 'branch', label: 'Rules engine', sub: 'Type · $ · dept', icon: '⚙', x: WF_DISC_X.C, y: WF_DISC_Y.tall.b },
      { id: 'legal', type: 'spoke', label: 'Legal', sub: 'MSA rule', icon: '⚖', x: WF_DISC_X.L, y: WF_DISC_Y.tall.row, compact: true },
      { id: 'proc', type: 'spoke', label: 'Procurement', sub: '$ threshold', icon: '💰', x: WF_DISC_X.C, y: WF_DISC_Y.tall.row, compact: true },
      { id: 'hr', type: 'spoke', label: 'HR', sub: 'Personnel', icon: '👥', x: WF_DISC_X.R, y: WF_DISC_Y.tall.row, compact: true },
      { id: 'merge', type: 'task', label: 'Queues done', sub: 'Parallel join', icon: '🔗', x: WF_DISC_X.C, y: WF_DISC_Y.tall.merge },
      { id: 'pool', type: 'parallel', label: 'Approver pool', sub: 'DOA matrix', icon: '👥', x: WF_DISC_X.C, y: WF_DISC_Y.tall.mid },
      { id: 'sign', type: 'sign', label: 'Auto sign', sub: 'Template envelope', icon: '✍', x: WF_DISC_X.C, y: WF_DISC_Y.tall.sign },
      { id: 'end', type: 'end', label: 'ERP sync', sub: 'Connect webhook', icon: '🏁', x: WF_DISC_X.C, y: WF_DISC_Y.tall.end },
    ],
    edges: [
      ['trigger', 'rules'],
      ['rules', 'legal', 'MSA'],
      ['rules', 'proc', '$ tier'],
      ['rules', 'hr', 'HR action'],
      ['legal', 'merge'],
      ['proc', 'merge'],
      ['hr', 'merge'],
      ['merge', 'pool'],
      ['pool', 'sign'],
      ['sign', 'end'],
    ],
  },
};

const WF_DISC_PALETTE = [
  { type: 'start', label: 'Start / Intake', icon: '📥' },
  { type: 'webform', label: 'Web Form', icon: '📝' },
  { type: 'approval', label: 'Approval', icon: '✓' },
  { type: 'branch', label: 'Business rule', icon: '⑂' },
  { type: 'parallel', label: 'Parallel group', icon: '⑇' },
  { type: 'task', label: 'Task / docs', icon: '📎' },
  { type: 'hub', label: 'Hub', icon: '🎯' },
  { type: 'spoke', label: 'Spoke team', icon: '🔗' },
  { type: 'sign', label: 'Signature', icon: '✍' },
  { type: 'end', label: 'End', icon: '🏁' },
];

const WF_DISC_HUB_SCENARIOS = ['hub_legal', 'hub_proc', 'hub_hr'];

const WF_DISC_ASK_PROMPTS = {
  hub_legal: ['Who redlines contracts today — Legal, outside counsel, or program staff?', 'Which playbooks or templates are authoritative?', 'Where do versioned markups live before signature?'],
  hub_proc: ['Where is encumbrance checked — FI$Cal, spreadsheet, or analyst?', 'What dollar tiers trigger competition review?', 'Who owns the REQ before it reaches Procurement?'],
  hub_hr: ['Which requests trigger HR review vs skip straight to sign?', 'When does labor relations get involved?', 'Where does personnel data get re-keyed today?'],
  autoroute: ['What system events should start a workflow automatically?', 'Which rules live in people’s heads today?', 'Who maintains the routing table when policy changes?'],
  threshold: ['What dollar tiers change approvers in your policy?', 'Who gets skipped on renewals vs new contracts?', 'Where is the authoritative threshold table?'],
  department: ['Which org codes map to different paths?', 'Does IT always need security review?', 'Where do paths merge before signature?'],
  linear: ['How many handoffs happen before signature?', 'Where do requests stall longest?', 'What gets re-keyed between systems?'],
  quorum: ['How many approvers must say yes?', 'Parallel or sequential votes today?', 'Who certifies the final record?'],
  constituent: ['What can the public self-serve online?', 'What docs must staff still review?', 'How do applicants track status?'],
  build: ['Walk me through who acts at each step.', 'What triggers the next step?', 'What supporting docs are required?'],
};

const WF_DISC_SPEEDS = { slow: 5200, normal: 4000, fast: 2600 };

const wfDiscState = {
  scenarioId: 'hub_legal',
  stepIndex: 0,
  playing: false,
  playTimer: null,
  mode: 'examples',
  buildNodes: [],
  buildEdges: [],
  buildCounter: 0,
  playSpeed: 'normal',
  workshop: false,
  customSteps: {},
  storyCollapsed: false,
};

function wfDiscPlayMs() {
  return WF_DISC_SPEEDS[wfDiscState.playSpeed] || WF_DISC_SPEEDS.normal;
}

/** Keep builder nodes centered on the trunk with even vertical spacing */
function wfDiscLayoutBuildNodes(nodes) {
  if (nodes.length <= 1) {
    return nodes.map(n => ({ ...n, x: WF_DISC_X.C, _slot: 'trunk' }));
  }
  return nodes.map((n, i) => ({
    ...n,
    x: WF_DISC_X.C,
    y: Math.round(10 + (i / (nodes.length - 1)) * 78),
    _slot: 'trunk',
  }));
}

function wfDiscRowBucket(y) {
  return Math.round(y / 4) * 4;
}

/**
 * Resolve node positions so rows never collide:
 * - single-node rows snap to center trunk
 * - multi-node rows get evenly spaced slots (25 / 50 / 75 for 3-way forks)
 * - rows enforce minimum vertical gap, then fit into 10–88
 */
function wfDiscResolveLayout(nodes) {
  if (!nodes.length) return [];
  let layout = nodes.map(n => ({ ...n }));

  const rowMap = new Map();
  layout.forEach(n => {
    const k = wfDiscRowBucket(n.y);
    if (!rowMap.has(k)) rowMap.set(k, []);
    rowMap.get(k).push(n);
  });

  rowMap.forEach((row) => {
    row.sort((a, b) => a.x - b.x);
    const count = row.length;
    if (count === 1) {
      row[0].x = WF_DISC_X.C;
      row[0]._slot = 'trunk';
    } else {
      row.forEach((node, i) => {
        node.x = Math.round((100 / (count + 1)) * (i + 1));
        node._slot = count === 2
          ? (i === 0 ? 'left' : 'right')
          : (i === 0 ? 'left' : i === count - 1 ? 'right' : 'center');
      });
    }
  });

  const buckets = [...rowMap.keys()].sort((a, b) => a - b);
  const yMap = new Map();
  const minRowGap = 14;
  buckets.forEach((b, i) => {
    if (i === 0) {
      yMap.set(b, b);
    } else {
      const prevY = yMap.get(buckets[i - 1]);
      yMap.set(b, Math.max(b, prevY + minRowGap));
    }
  });

  layout = layout.map(n => {
    const k = wfDiscRowBucket(n.y);
    return { ...n, y: yMap.get(k) ?? n.y };
  });

  const ys = layout.map(n => n.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const span = maxY - minY || 1;
  if (maxY > 90 || minY < 10) {
    layout = layout.map(n => ({
      ...n,
      y: Math.round(10 + ((n.y - minY) / span) * 78),
    }));
  }

  return layout;
}

/** After DOM paint, nudge any nodes that still overlap */
function wfDiscFixCollisions(canvas, nodes) {
  const els = [...canvas.querySelectorAll('.wf-disc-node')];
  const pad = 8;
  let anyMoved = false;

  for (let pass = 0; pass < 10; pass++) {
    let moved = false;
    for (let i = 0; i < els.length; i++) {
      for (let j = i + 1; j < els.length; j++) {
        const ra = els[i].getBoundingClientRect();
        const rb = els[j].getBoundingClientRect();
        const overlapX = ra.left < rb.right - pad && rb.left < ra.right - pad;
        const overlapY = ra.top < rb.bottom - pad && rb.top < ra.bottom - pad;
        if (!overlapX || !overlapY) continue;

        const nA = nodes.find(n => n.id === els[i].dataset.wfNode);
        const nB = nodes.find(n => n.id === els[j].dataset.wfNode);
        if (!nA || !nB) continue;

        if (Math.abs(nA.y - nB.y) < 8) {
          nA.x = Math.max(14, nA.x - 2.5);
          nB.x = Math.min(86, nB.x + 2.5);
          els[i].style.left = `${nA.x}%`;
          els[j].style.left = `${nB.x}%`;
        } else if (nB.y > nA.y) {
          nB.y = Math.min(90, nB.y + 2);
          els[j].style.top = `${nB.y}%`;
        } else {
          nA.y = Math.min(90, nA.y + 2);
          els[i].style.top = `${nA.y}%`;
        }
        moved = true;
        anyMoved = true;
      }
    }
    if (!moved) break;
  }
  return anyMoved;
}

function wfDiscIsSideNode(n) {
  return n._slot === 'left' || n._slot === 'right' || n._slot === 'center'
    || n.compact || n.x <= 28 || n.x >= 72;
}

function wfDiscNodeEl(n, active, visited, stepNum) {
  const branch = n.type === 'branch' ? ' wf-disc-node--branch' : '';
  const hub = n.type === 'hub' ? ' wf-disc-node--hub' : '';
  const spoke = n.type === 'spoke' ? ' wf-disc-node--spoke' : '';
  const compact = (n._slot === 'left' || n._slot === 'right' || n._slot === 'center') ? ' wf-disc-node--compact-col' : '';
  const auto = n.type === 'start' && n.icon === '⚡' ? ' wf-disc-node--trigger' : '';
  return `
    <button type="button" class="wf-disc-node wf-disc-node--${n.type}${branch}${hub}${spoke}${compact}${auto}${active ? ' wf-disc-node--active' : ''}${visited ? ' wf-disc-node--visited' : ''}"
      data-wf-node="${n.id}" style="left:${n.x}%;top:${n.y}%;">
      ${active ? `<span class="wf-disc-step-badge">${stepNum}</span>` : ''}
      ${visited && !active ? '<span class="wf-disc-visited-mark" aria-hidden="true">✓</span>' : ''}
      <span class="wf-disc-node-icon" aria-hidden="true">${n.icon || '●'}</span>
      <span class="wf-disc-node-text">
        <strong>${n.label}</strong>
        ${n.sub ? `<small>${n.sub}</small>` : ''}
      </span>
      ${active ? '<span class="wf-disc-node-ring" aria-hidden="true"></span>' : ''}
    </button>`;
}

function wfDiscIsCenter(x) { return x >= 34 && x <= 66; }
function wfDiscIsLeft(x) { return x < 28; }
function wfDiscIsRight(x) { return x > 72; }

function wfDiscEdgePath(from, to, label) {
  const pad = 4.2;
  const fy = from.y + pad;
  const ty = to.y - pad;
  const dx = to.x - from.x;
  const dy = ty - fy;
  let d;
  let lx = (from.x + to.x) / 2;
  let ly = (fy + ty) / 2;

  if (Math.abs(dx) < 5 && dy > 0) {
    d = `M ${from.x} ${fy} L ${to.x} ${ty}`;
    lx = from.x + 8;
    ly = fy + dy * 0.38;
  } else if (wfDiscIsCenter(from.x) && wfDiscIsLeft(to.x) && to.y > from.y) {
    const busY = from.y + (to.y - from.y) * 0.48;
    d = `M ${from.x} ${fy} L ${from.x} ${busY} L ${to.x} ${busY} L ${to.x} ${ty}`;
    lx = (from.x + to.x) / 2;
    ly = busY - 3;
  } else if (wfDiscIsCenter(from.x) && wfDiscIsRight(to.x) && to.y > from.y) {
    const busY = from.y + (to.y - from.y) * 0.48;
    d = `M ${from.x} ${fy} L ${from.x} ${busY} L ${to.x} ${busY} L ${to.x} ${ty}`;
    lx = (from.x + to.x) / 2;
    ly = busY - 3;
  } else if (wfDiscIsLeft(from.x) && wfDiscIsCenter(to.x) && to.y > from.y) {
    const busY = from.y + (to.y - from.y) * 0.54;
    d = `M ${from.x} ${fy} L ${from.x} ${busY} L ${to.x} ${busY} L ${to.x} ${ty}`;
    lx = (from.x + to.x) / 2;
    ly = busY + 2.5;
  } else if (wfDiscIsRight(from.x) && wfDiscIsCenter(to.x) && to.y > from.y) {
    const busY = from.y + (to.y - from.y) * 0.54;
    d = `M ${from.x} ${fy} L ${from.x} ${busY} L ${to.x} ${busY} L ${to.x} ${ty}`;
    lx = (from.x + to.x) / 2;
    ly = busY + 2.5;
  } else if (Math.abs(dx) > 10 && Math.abs(dy) > 5) {
    const my = (fy + ty) / 2;
    d = `M ${from.x} ${fy} C ${from.x} ${my}, ${to.x} ${my}, ${to.x} ${ty}`;
    lx = (from.x + to.x) / 2;
    ly = my - 2;
  } else {
    d = `M ${from.x} ${fy} L ${to.x} ${ty}`;
    ly = (fy + ty) / 2 - 2;
  }

  return { d, mx: lx, my: ly, label };
}

function wfDiscEdgeLabelHtml(lbl, x, y) {
  if (!lbl) return '';
  const w = Math.min(lbl.length * 2.15 + 5, 28);
  return `
    <g class="wf-disc-edge-label-group">
      <rect x="${x - w / 2}" y="${y - 3.4}" width="${w}" height="4.6" rx="1.2" class="wf-disc-edge-label-bg"/>
      <text x="${x}" y="${y}" class="wf-disc-edge-label">${lbl}</text>
    </g>`;
}

function wfDiscRenderEdges(svg, nodes, edges, activeEdgeIdx) {
  const map = Object.fromEntries(nodes.map(n => [n.id, n]));
  let edgeIdx = 0;
  const parts = edges.map(([a, b, label]) => {
    const from = map[a];
    const to = map[b];
    if (!from || !to) return '';
    const { d, mx, my, label: lbl } = wfDiscEdgePath(from, to, label);
    const curIdx = edgeIdx;
    edgeIdx += 1;
    const on = activeEdgeIdx === curIdx;
    const done = curIdx < activeEdgeIdx;
    const lblHtml = lbl ? wfDiscEdgeLabelHtml(lbl, mx, my) : '';
    return `
      <path class="wf-disc-edge${on ? ' wf-disc-edge--active' : ''}${done ? ' wf-disc-edge--done' : ''}" d="${d}" marker-end="url(#wfDiscArrow${on ? 'Active' : done ? 'Done' : ''})"/>
      ${lblHtml}
      ${on ? `<circle class="wf-disc-edge-dot" r="1.4"><animateMotion dur="2.4s" repeatCount="indefinite" path="${d}"/></circle>` : ''}`;
  });
  svg.innerHTML = `
    <defs>
      <marker id="wfDiscArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <polygon points="0 0, 7 3.5, 0 7" fill="#a78bfa"/>
      </marker>
      <marker id="wfDiscArrowActive" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <polygon points="0 0, 7 3.5, 0 7" fill="#7c3aed"/>
      </marker>
      <marker id="wfDiscArrowDone" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <polygon points="0 0, 7 3.5, 0 7" fill="#6d28d9"/>
      </marker>
    </defs>
    ${parts.join('')}`;
}

function wfDiscGetScenario() {
  if (wfDiscState.mode === 'build') {
    const nodes = wfDiscLayoutBuildNodes(wfDiscState.buildNodes);
    return {
      title: 'Your discovery map',
      tag: 'Builder',
      icon: '🛠',
      blurb: 'Click palette items to add steps — sketch the customer\'s process live.',
      playOrder: nodes.map(n => n.id),
      steps: nodes.map(n => ({
        node: n.id,
        headline: n.label,
        body: n.sub || 'Custom step — discuss routing and owners with the customer.',
        say: n.customSay || '“Walk me through who acts here and what triggers the next step.”',
      })),
      nodes,
      edges: wfDiscState.buildEdges,
    };
  }
  return WF_DISC_SCENARIOS[wfDiscState.scenarioId] || WF_DISC_SCENARIOS.hub_legal;
}

function wfDiscAskPrompt() {
  const key = wfDiscState.mode === 'build' ? 'build' : wfDiscState.scenarioId;
  const prompts = WF_DISC_ASK_PROMPTS[key]
    || (WF_DISC_HUB_SCENARIOS.includes(key) ? WF_DISC_ASK_PROMPTS.hub_legal : null)
    || WF_DISC_ASK_PROMPTS.hub_legal;
  return prompts[wfDiscState.stepIndex % prompts.length];
}

function wfDiscRenderStepStrip(s) {
  const strip = document.getElementById('wf-disc-step-strip');
  if (!strip) return;
  strip.innerHTML = s.playOrder.map((nodeId, i) => {
    const n = s.nodes.find(nd => nd.id === nodeId);
    const label = n?.label || nodeId;
    const cls = i === wfDiscState.stepIndex ? 'active' : i < wfDiscState.stepIndex ? 'done' : '';
    return `<button type="button" class="wf-disc-step-pill ${cls}" data-wf-step="${i}" title="${label}"><span class="wf-disc-pill-num">${i + 1}</span><span class="wf-disc-pill-label">${label}</span></button>`;
  }).join('');
  strip.querySelectorAll('[data-wf-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      wfDiscStopPlay();
      wfDiscState.stepIndex = parseInt(btn.dataset.wfStep, 10);
      wfDiscRenderCanvas();
    });
  });
  const activePill = strip.querySelector('.wf-disc-step-pill.active');
  if (activePill) activePill.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}

function wfDiscPositionSpotlight(activeNodeId, nodes) {
  const spotlight = document.getElementById('wf-disc-spotlight');
  if (!spotlight) return;
  spotlight.hidden = true;
}

function wfDiscRenderCanvas() {
  const s = wfDiscGetScenario();
  const canvas = document.getElementById('wf-disc-diagram');
  const svg = document.getElementById('wf-disc-edges');
  if (!canvas || !svg || !s) return;

  const activeNodeId = s.playOrder[wfDiscState.stepIndex];
  const activeIdx = wfDiscState.stepIndex;
  const stepNum = activeIdx + 1;
  const layoutNodes = wfDiscResolveLayout(s.nodes);

  wfDiscRenderEdges(svg, layoutNodes, s.edges, Math.max(0, activeIdx - 1));

  canvas.querySelectorAll('.wf-disc-node').forEach(el => el.remove());
  layoutNodes.forEach(n => {
    const orderIdx = s.playOrder.indexOf(n.id);
    const isActive = n.id === activeNodeId;
    const isVisited = orderIdx >= 0 && orderIdx < activeIdx;
    const isUpcoming = orderIdx > activeIdx;
    const wrap = document.createElement('div');
    wrap.innerHTML = wfDiscNodeEl(n, isActive, isVisited, stepNum);
    const el = wrap.firstElementChild;
    if (isUpcoming) el.classList.add('wf-disc-node--upcoming');
    canvas.appendChild(el);
  });

  requestAnimationFrame(() => {
    const moved = wfDiscFixCollisions(canvas, layoutNodes);
    if (moved) {
      wfDiscRenderEdges(svg, layoutNodes, s.edges, Math.max(0, activeIdx - 1));
    }
  });

  wfDiscPositionSpotlight(activeNodeId, layoutNodes);

  document.getElementById('wf-disc-scenario-title').textContent = s.title;
  document.getElementById('wf-disc-scenario-tag').textContent = s.tag;
  document.getElementById('wf-disc-scenario-blurb').textContent = s.blurb;

  const step = s.steps.find(st => st.node === activeNodeId) || s.steps[0];
  if (step) {
    document.getElementById('wf-disc-story-headline').textContent = step.headline;
    document.getElementById('wf-disc-story-text').textContent = step.body;
    document.getElementById('wf-disc-story-say').textContent = step.say;
    const eyebrow = document.getElementById('wf-disc-story-eyebrow');
    if (eyebrow) eyebrow.textContent = `Step ${stepNum} · ${wfDiscState.playing ? 'Playing' : 'Current'}`;
    const askEl = document.getElementById('wf-disc-ask-prompt');
    if (askEl) askEl.textContent = wfDiscAskPrompt();
  }

  const total = s.playOrder.length;
  document.getElementById('wf-disc-step-counter').textContent = `Step ${stepNum} of ${total}`;
  document.getElementById('wf-disc-progress-fill').style.width = `${(stepNum / total) * 100}%`;
  const railStep = document.getElementById('wf-disc-rail-step');
  if (railStep) railStep.textContent = `${stepNum} / ${total}`;

  document.querySelectorAll('[data-wf-scenario]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.wfScenario === wfDiscState.scenarioId && wfDiscState.mode === 'examples');
  });
  document.getElementById('wf-disc-mode-examples')?.classList.toggle('active', wfDiscState.mode === 'examples');
  document.getElementById('wf-disc-mode-build')?.classList.toggle('active', wfDiscState.mode === 'build');

  const examplesList = document.getElementById('wf-disc-examples-list');
  const palette = document.getElementById('wf-disc-palette');
  if (examplesList) examplesList.hidden = wfDiscState.mode === 'build';
  if (palette) palette.hidden = wfDiscState.mode === 'examples';

  wfDiscRenderStepStrip(s);
  wfDiscSyncHubFlavors();
  wfDiscSyncStoryPanel();
}

function wfDiscToggleStoryPanel(force) {
  const on = typeof force === 'boolean' ? force : !wfDiscState.storyCollapsed;
  wfDiscState.storyCollapsed = on;
  try { sessionStorage.setItem('wfDiscStoryCollapsed', on ? '1' : '0'); } catch (_) { /* ignore */ }
  wfDiscSyncStoryPanel();
}

function wfDiscSyncStoryPanel() {
  const layout = document.getElementById('wf-disc-layout');
  const panel = document.getElementById('wf-disc-story-panel');
  const btn = document.getElementById('wf-disc-story-toggle');
  const body = document.getElementById('wf-disc-story-body-wrap');
  const controls = panel?.querySelector('.wf-disc-controls');
  const rail = document.getElementById('wf-disc-story-rail');
  const head = panel?.querySelector('.wf-disc-story-head h2');
  const collapsed = wfDiscState.storyCollapsed;

  if (layout) layout.classList.toggle('wf-disc-layout--story-collapsed', collapsed);
  if (panel) panel.classList.toggle('wf-disc-story-panel--collapsed', collapsed);
  if (body) body.hidden = collapsed;
  if (controls) controls.hidden = collapsed;
  if (rail) rail.hidden = !collapsed;
  if (head) head.hidden = collapsed;
  if (btn) {
    btn.hidden = collapsed;
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.title = collapsed ? 'Expand narration panel' : 'Minimize narration panel';
  }
}

function wfDiscIsHubScenario(id) {
  return WF_DISC_HUB_SCENARIOS.includes(id || wfDiscState.scenarioId);
}

function wfDiscSyncHubFlavors() {
  document.querySelectorAll('[data-wf-hub-flavor]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.wfHubFlavor === wfDiscState.scenarioId);
    btn.setAttribute('aria-selected', String(btn.dataset.wfHubFlavor === wfDiscState.scenarioId));
  });
  document.querySelectorAll('[data-wf-scenario]').forEach(btn => {
    if (!btn.dataset.wfScenario.startsWith('hub_')) return;
    btn.classList.toggle('active', btn.dataset.wfScenario === wfDiscState.scenarioId && wfDiscState.mode === 'examples');
  });
  const bar = document.getElementById('wf-disc-hub-flavor-bar');
  if (bar) bar.hidden = !wfDiscIsHubScenario() || wfDiscState.mode !== 'examples';
}

function wfDiscSelectScenario(id) {
  wfDiscStopPlay();
  wfDiscState.mode = 'examples';
  wfDiscState.scenarioId = id === 'hub' ? 'hub_legal' : id;
  wfDiscState.stepIndex = 0;
  wfDiscRenderCanvas();
}

function wfDiscStep(delta) {
  const s = wfDiscGetScenario();
  wfDiscState.stepIndex = Math.max(0, Math.min(s.playOrder.length - 1, wfDiscState.stepIndex + delta));
  wfDiscRenderCanvas();
}

function wfDiscStopPlay() {
  wfDiscState.playing = false;
  if (wfDiscState.playTimer) {
    clearInterval(wfDiscState.playTimer);
    wfDiscState.playTimer = null;
  }
  document.getElementById('wf-disc-play-btn')?.classList.remove('wf-disc-play--on');
  document.getElementById('wf-disc-rail-play')?.classList.remove('wf-disc-play--on');
}

function wfDiscTogglePlay() {
  if (wfDiscState.playing) {
    wfDiscStopPlay();
    wfDiscRenderCanvas();
    return;
  }
  wfDiscState.playing = true;
  document.getElementById('wf-disc-play-btn')?.classList.add('wf-disc-play--on');
  document.getElementById('wf-disc-rail-play')?.classList.add('wf-disc-play--on');
  wfDiscState.playTimer = setInterval(() => {
    const sc = wfDiscGetScenario();
    if (wfDiscState.stepIndex >= sc.playOrder.length - 1) {
      wfDiscStopPlay();
      wfDiscRenderCanvas();
      return;
    }
    wfDiscState.stepIndex += 1;
    wfDiscRenderCanvas();
  }, wfDiscPlayMs());
}

function wfDiscRestart() {
  wfDiscStopPlay();
  wfDiscState.stepIndex = 0;
  wfDiscRenderCanvas();
}

function wfDiscSetMode(mode) {
  wfDiscStopPlay();
  wfDiscState.mode = mode;
  if (mode === 'build' && !wfDiscState.buildNodes.length) {
    wfDiscState.buildNodes = [
      { id: 'b1', type: 'start', label: 'Intake', sub: 'Click palette to extend', icon: '📥', x: WF_DISC_X.C, y: 10 },
    ];
    wfDiscState.buildEdges = [];
    wfDiscState.buildCounter = 2;
  }
  wfDiscState.stepIndex = 0;
  wfDiscRenderCanvas();
}

function wfDiscAddPalette(type) {
  wfDiscSetMode('build');
  const item = WF_DISC_PALETTE.find(p => p.type === type);
  if (!item) return;
  const id = `b${wfDiscState.buildCounter++}`;
  const prev = wfDiscState.buildNodes[wfDiscState.buildNodes.length - 1];
  const node = {
    id,
    type,
    label: item.label,
    sub: 'New step',
    icon: item.icon,
    x: WF_DISC_X.C,
    y: 10,
  };
  wfDiscState.buildNodes.push(node);
  if (prev) wfDiscState.buildEdges.push([prev.id, id]);
  wfDiscState.stepIndex = wfDiscState.buildNodes.length - 1;
  wfDiscRenderCanvas();
  if (typeof showToast === 'function') showToast(`Added ${item.label}`, 'default');
}

function wfDiscAddCustomStep() {
  wfDiscSetMode('build');
  const labelEl = document.getElementById('wf-disc-custom-label');
  const subEl = document.getElementById('wf-disc-custom-sub');
  const sayEl = document.getElementById('wf-disc-custom-say');
  const label = (labelEl?.value || '').trim();
  if (!label) {
    labelEl?.focus();
    if (typeof showToast === 'function') showToast('Enter a step name first', 'default');
    return;
  }
  const sub = (subEl?.value || '').trim() || 'Custom step';
  const customSay = (sayEl?.value || '').trim();
  const id = `b${wfDiscState.buildCounter++}`;
  const prev = wfDiscState.buildNodes[wfDiscState.buildNodes.length - 1];
  const node = {
    id,
    type: 'task',
    label,
    sub,
    icon: '✦',
    x: WF_DISC_X.C,
    y: 10,
    customSay: customSay ? `“${customSay.replace(/^["“]|["”]$/g, '')}”` : undefined,
  };
  wfDiscState.buildNodes.push(node);
  if (prev) wfDiscState.buildEdges.push([prev.id, id]);
  wfDiscState.stepIndex = wfDiscState.buildNodes.length - 1;
  if (labelEl) labelEl.value = '';
  if (subEl) subEl.value = '';
  if (sayEl) sayEl.value = '';
  wfDiscRenderCanvas();
  if (typeof showToast === 'function') showToast(`Added “${label}”`, 'default');
}

function wfDiscToggleWorkshop(force) {
  const on = typeof force === 'boolean' ? force : !document.body.classList.contains('wf-disc-workshop');
  document.body.classList.toggle('wf-disc-workshop', on);
  wfDiscState.workshop = on;
  const exitBar = document.getElementById('wf-disc-workshop-exit');
  const btn = document.getElementById('wf-disc-workshop-btn');
  if (exitBar) exitBar.hidden = !on;
  if (btn) btn.textContent = on ? '✕ Exit workshop' : '⛶ Workshop mode';
  if (on) wfDiscSetMode('build');
}

function wfDiscCopySay() {
  const text = document.getElementById('wf-disc-story-say')?.textContent || '';
  if (!text) return;
  navigator.clipboard?.writeText(text).then(() => {
    if (typeof showToast === 'function') showToast('Copied to clipboard', 'default');
  }).catch(() => {});
}

function wfDiscClearBuild() {
  wfDiscStopPlay();
  wfDiscState.buildNodes = [
    { id: 'b1', type: 'start', label: 'Intake', sub: 'Click palette to extend', icon: '📥', x: WF_DISC_X.C, y: 10 },
  ];
  wfDiscState.buildEdges = [];
  wfDiscState.buildCounter = 2;
  wfDiscState.stepIndex = 0;
  wfDiscState.mode = 'build';
  wfDiscRenderCanvas();
  if (typeof showToast === 'function') showToast('Canvas cleared — add steps from palette', 'default');
}

function wfDiscInit() {
  document.querySelectorAll('[data-wf-scenario]').forEach(btn => {
    btn.addEventListener('click', () => wfDiscSelectScenario(btn.dataset.wfScenario));
  });

  document.querySelectorAll('[data-wf-hub-flavor]').forEach(btn => {
    btn.addEventListener('click', () => wfDiscSelectScenario(btn.dataset.wfHubFlavor));
  });

  document.getElementById('wf-disc-prev')?.addEventListener('click', () => wfDiscStep(-1));
  document.getElementById('wf-disc-next')?.addEventListener('click', () => wfDiscStep(1));
  document.getElementById('wf-disc-play-btn')?.addEventListener('click', wfDiscTogglePlay);
  document.getElementById('wf-disc-restart')?.addEventListener('click', wfDiscRestart);
  document.getElementById('wf-disc-mode-examples')?.addEventListener('click', () => wfDiscSetMode('examples'));
  document.getElementById('wf-disc-mode-build')?.addEventListener('click', () => wfDiscSetMode('build'));
  document.getElementById('wf-disc-clear-build')?.addEventListener('click', wfDiscClearBuild);
  document.getElementById('wf-disc-add-custom')?.addEventListener('click', wfDiscAddCustomStep);
  document.getElementById('wf-disc-workshop-btn')?.addEventListener('click', () => wfDiscToggleWorkshop());
  document.getElementById('wf-disc-exit-workshop')?.addEventListener('click', () => wfDiscToggleWorkshop(false));
  document.getElementById('wf-disc-story-toggle')?.addEventListener('click', () => wfDiscToggleStoryPanel(true));
  document.getElementById('wf-disc-story-expand')?.addEventListener('click', () => wfDiscToggleStoryPanel(false));
  document.getElementById('wf-disc-rail-prev')?.addEventListener('click', () => wfDiscStep(-1));
  document.getElementById('wf-disc-rail-next')?.addEventListener('click', () => wfDiscStep(1));
  document.getElementById('wf-disc-rail-play')?.addEventListener('click', wfDiscTogglePlay);
  document.getElementById('wf-disc-play-speed')?.addEventListener('change', (e) => {
    wfDiscState.playSpeed = e.target.value;
  });

  document.getElementById('wf-disc-copy-say')?.addEventListener('click', wfDiscCopySay);

  document.querySelectorAll('[data-wf-palette]').forEach(btn => {
    btn.addEventListener('click', () => wfDiscAddPalette(btn.dataset.wfPalette));
  });

  document.getElementById('wf-disc-diagram')?.addEventListener('click', (e) => {
    const node = e.target.closest('[data-wf-node]');
    if (!node) return;
    const s = wfDiscGetScenario();
    const idx = s.playOrder.indexOf(node.dataset.wfNode);
    if (idx >= 0) {
      wfDiscStopPlay();
      wfDiscState.stepIndex = idx;
      wfDiscRenderCanvas();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('wf-disc-page')) return;
    if (e.key === 'Escape' && wfDiscState.workshop) { e.preventDefault(); wfDiscToggleWorkshop(false); return; }
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); wfDiscStep(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); wfDiscStep(-1); }
    if (e.key === 'p' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      wfDiscTogglePlay();
    }
  });

  try {
    const saved = sessionStorage.getItem('wfDiscStoryCollapsed');
    if (saved === '1') wfDiscState.storyCollapsed = true;
  } catch (_) { /* ignore */ }
  wfDiscSyncStoryPanel();

  const wrap = document.getElementById('wf-disc-diagram-wrap');
  if (wrap && typeof ResizeObserver !== 'undefined') {
    let t;
    new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => wfDiscRenderCanvas(), 120);
    }).observe(wrap);
  }

  wfDiscRenderCanvas();
}

document.addEventListener('DOMContentLoaded', wfDiscInit);

window.wfDiscSelectScenario = wfDiscSelectScenario;
window.wfDiscTogglePlay = wfDiscTogglePlay;
