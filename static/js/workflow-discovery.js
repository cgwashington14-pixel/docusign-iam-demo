/* Workflow Discovery — animated Visio-style process maps for consultant discovery */

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
      { id: 'start', type: 'start', label: 'Submit packet', sub: 'Employee portal', icon: '📋', x: 50, y: 8 },
      { id: 'mgr', type: 'approval', label: 'Manager approval', sub: 'Dept supervisor', icon: '👤', x: 50, y: 22 },
      { id: 'hr', type: 'approval', label: 'HR review', sub: 'Compliance & benefits', icon: '🏛', x: 50, y: 36 },
      { id: 'docs', type: 'task', label: 'Attach documents', sub: 'PA form · union notice', icon: '📎', x: 50, y: 50 },
      { id: 'sign', type: 'sign', label: 'Sign & acknowledge', sub: 'Employee + HR', icon: '✍', x: 50, y: 64 },
      { id: 'end', type: 'end', label: 'Complete', sub: 'Sync to HRIS', icon: '🏁', x: 50, y: 78 },
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
      { id: 'start', type: 'start', label: 'Submit REQ', sub: 'FI$Cal prefill', icon: '📝', x: 50, y: 6 },
      { id: 'branch', type: 'branch', label: 'Value > $250K?', sub: 'Business rule', icon: '⑂', x: 50, y: 20 },
      { id: 'dept', type: 'approval', label: 'Dept head', sub: 'Under threshold', icon: '👤', x: 22, y: 38 },
      { id: 'exec', type: 'approval', label: 'Executive + DGS', sub: 'Over threshold', icon: '⭐', x: 78, y: 38 },
      { id: 'legal', type: 'approval', label: 'Legal review', sub: 'DGS policy', icon: '⚖', x: 50, y: 54 },
      { id: 'sign', type: 'sign', label: 'Sign MSA', sub: 'Agency + vendor', icon: '✍', x: 50, y: 68 },
      { id: 'end', type: 'end', label: 'Registered', sub: 'Agreement Manager', icon: '🏁', x: 50, y: 82 },
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
      { id: 'start', type: 'start', label: 'Agreement Desk intake', sub: 'All departments', icon: '📥', x: 50, y: 5 },
      { id: 'branch', type: 'branch', label: 'Which department?', sub: 'Org code rule', icon: '⑂', x: 50, y: 18 },
      { id: 'it', type: 'approval', label: 'IT · Security', sub: 'CIO path', icon: '💻', x: 18, y: 36 },
      { id: 'fin', type: 'approval', label: 'Finance · Budget', sub: 'Controller path', icon: '💵', x: 50, y: 36 },
      { id: 'hr', type: 'approval', label: 'HR · Policy', sub: 'Workforce path', icon: '👥', x: 82, y: 36 },
      { id: 'merge', type: 'task', label: 'Legal merge', sub: 'Common review', icon: '⚖', x: 50, y: 52 },
      { id: 'sign', type: 'sign', label: 'Execute', sub: 'DOA signer', icon: '✍', x: 50, y: 66 },
      { id: 'end', type: 'end', label: 'Complete', sub: 'ERP sync', icon: '🏁', x: 50, y: 80 },
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
      { id: 'start', type: 'start', label: 'Submit resolution', sub: 'Clerk intake', icon: '📋', x: 50, y: 6 },
      { id: 'legal', type: 'approval', label: 'Counsel review', sub: 'Legal clearance', icon: '⚖', x: 50, y: 20 },
      { id: 'a1', type: 'parallel', label: 'Commissioner A', sub: 'Vote', icon: '①', x: 20, y: 38 },
      { id: 'a2', type: 'parallel', label: 'Commissioner B', sub: 'Vote', icon: '②', x: 50, y: 38 },
      { id: 'a3', type: 'parallel', label: 'Commissioner C–E', sub: '3 of 5 quorum', icon: '③', x: 80, y: 38 },
      { id: 'merge', type: 'task', label: 'Quorum check', sub: '≥ 3 approvals', icon: '✓', x: 50, y: 54 },
      { id: 'sign', type: 'sign', label: 'Chair signs', sub: 'Execution copy', icon: '✍', x: 50, y: 68 },
      { id: 'end', type: 'end', label: 'Filed', sub: 'Minutes system', icon: '🏁', x: 50, y: 82 },
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
      { id: 'webform', type: 'webform', label: 'Web Form submit', sub: 'Public · mobile OK', icon: '📝', x: 50, y: 8 },
      { id: 'auto', type: 'task', label: 'Auto-route', sub: 'Jurisdiction rule', icon: '⚡', x: 50, y: 24 },
      { id: 'review', type: 'approval', label: 'Agency review', sub: 'Planner / analyst', icon: '👤', x: 50, y: 40 },
      { id: 'docs', type: 'task', label: 'Supporting docs', sub: 'Uploads attached', icon: '📎', x: 50, y: 56 },
      { id: 'notify', type: 'task', label: 'Notify applicant', sub: 'Email · SMS', icon: '✉', x: 50, y: 72 },
      { id: 'end', type: 'end', label: 'Decision', sub: 'Optional sign', icon: '🏁', x: 50, y: 88 },
    ],
    edges: [
      ['webform', 'auto'], ['auto', 'review'], ['review', 'docs'], ['docs', 'notify'], ['notify', 'end'],
    ],
  },

  hub: {
    title: 'Hub-and-spoke intake',
    tag: 'Central intake',
    icon: '🎯',
    blurb: 'Agreement Desk as central hub — triage to HR, Legal, and Procurement specialists with shared audit trail.',
    playOrder: ['start', 'hub', 'hr', 'legal', 'proc', 'merge', 'sign', 'end'],
    steps: [
      { node: 'start', headline: 'Request arrives', body: 'Email, desk form, or ERP event creates one record in Agreement Desk.', say: '“Hub-and-spoke is what we see at mature agencies — one intake, many specialist teams.”' },
      { node: 'hub', headline: 'Central triage', body: 'Intake coordinator assigns type, priority, and which spokes participate.', say: '“The hub owns the timeline — spokes don’t lose each other’s context.”' },
      { node: 'hr', headline: 'HR spoke', body: 'Workforce impact, classification, union notification if applicable.', say: '“HR spoke runs in parallel when personnel implications exist.”' },
      { node: 'legal', headline: 'Legal spoke', body: 'Redline, playbook match, risk tier — Iris AI scorecard optional.', say: '“Legal spoke is often the longest pole — everyone sees status on the hub.”' },
      { node: 'proc', headline: 'Procurement spoke', body: 'Competition requirements, FI$Cal encumbrance, DGS thresholds.', say: '“Procurement spoke validates dollars and competition before sign.”' },
      { node: 'merge', headline: 'Hub reconvenes', body: 'All spokes complete → hub confirms attachments and routes to signature.', say: '“Merge back to the hub — one approval to release signature packet.”' },
      { node: 'sign', headline: 'Execute', body: 'Template-based envelope with all spoke artifacts attached.', say: '“Signature is the payoff — every spoke’s work is already in the packet.”' },
      { node: 'end', headline: 'Enterprise record', body: 'Agreement Manager + ERP sync via Connect.', say: '“Draw this on a whiteboard in discovery — prospects recognize their org instantly.”' },
    ],
    nodes: [
      { id: 'start', type: 'start', label: 'Intake event', sub: 'Desk · ERP · email', icon: '📥', x: 50, y: 4 },
      { id: 'hub', type: 'hub', label: 'Agreement Desk hub', sub: 'Triage & assign', icon: '🎯', x: 50, y: 22 },
      { id: 'hr', type: 'spoke', label: 'HR spoke', sub: 'Workforce', icon: '👥', x: 15, y: 44 },
      { id: 'legal', type: 'spoke', label: 'Legal spoke', sub: 'Redline & risk', icon: '⚖', x: 50, y: 44 },
      { id: 'proc', type: 'spoke', label: 'Procurement spoke', sub: 'FI$Cal · DGS', icon: '💰', x: 85, y: 44 },
      { id: 'merge', type: 'task', label: 'Hub release', sub: 'All spokes done', icon: '🔗', x: 50, y: 62 },
      { id: 'sign', type: 'sign', label: 'Sign packet', sub: 'Template envelope', icon: '✍', x: 50, y: 76 },
      { id: 'end', type: 'end', label: 'Archive', sub: 'IAM + ERP', icon: '🏁', x: 50, y: 90 },
    ],
    edges: [
      ['start', 'hub'],
      ['hub', 'hr'],
      ['hub', 'legal'],
      ['hub', 'proc'],
      ['hr', 'merge'],
      ['legal', 'merge'],
      ['proc', 'merge'],
      ['merge', 'sign'],
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

const wfDiscState = {
  scenarioId: 'hub',
  stepIndex: 0,
  playing: false,
  playTimer: null,
  mode: 'examples',
  buildNodes: [],
  buildEdges: [],
  buildCounter: 0,
};

function wfDiscNodeEl(n, active, dimmed) {
  const branch = n.type === 'branch' ? ' wf-disc-node--branch' : '';
  const hub = n.type === 'hub' ? ' wf-disc-node--hub' : '';
  const spoke = n.type === 'spoke' ? ' wf-disc-node--spoke' : '';
  return `
    <button type="button" class="wf-disc-node wf-disc-node--${n.type}${branch}${hub}${spoke}${active ? ' wf-disc-node--active' : ''}${dimmed ? ' wf-disc-node--dim' : ''}"
      data-wf-node="${n.id}" style="left:${n.x}%;top:${n.y}%;">
      <span class="wf-disc-node-icon" aria-hidden="true">${n.icon || '●'}</span>
      <span class="wf-disc-node-text">
        <strong>${n.label}</strong>
        ${n.sub ? `<small>${n.sub}</small>` : ''}
      </span>
      ${active ? '<span class="wf-disc-node-pulse" aria-hidden="true"></span>' : ''}
    </button>`;
}

function wfDiscEdgePath(from, to, label) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  let d;
  if (Math.abs(dx) > 15 && Math.abs(dy) > 8) {
    d = `M ${from.x} ${from.y} C ${from.x} ${my}, ${to.x} ${my}, ${to.x} ${to.y}`;
  } else {
    d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  return { d, mx, my, label };
}

function wfDiscRenderEdges(svg, nodes, edges, activeEdgeIdx) {
  const map = Object.fromEntries(nodes.map(n => [n.id, n]));
  let edgeIdx = 0;
  const parts = edges.map(([a, b, label]) => {
    const from = map[a];
    const to = map[b];
    if (!from || !to) return '';
    const { d, mx, my, label: lbl } = wfDiscEdgePath(from, to, label);
    const on = activeEdgeIdx === edgeIdx;
    edgeIdx += 1;
    const lblHtml = lbl
      ? `<text x="${mx}" y="${my - 2}" class="wf-disc-edge-label">${lbl}</text>` : '';
    return `
      <path class="wf-disc-edge${on ? ' wf-disc-edge--active' : ''}" d="${d}" marker-end="url(#wfDiscArrow)"/>
      ${lblHtml}
      ${on ? `<circle class="wf-disc-edge-dot" r="4"><animateMotion dur="1.2s" repeatCount="indefinite" path="${d}"/></circle>` : ''}`;
  });
  svg.innerHTML = `
    <defs>
      <marker id="wfDiscArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="#7c3aed"/>
      </marker>
    </defs>
    ${parts.join('')}`;
}

function wfDiscGetScenario() {
  if (wfDiscState.mode === 'build') {
    return {
      title: 'Your discovery map',
      tag: 'Builder',
      icon: '🛠',
      blurb: 'Click palette items to add steps — sketch the customer\'s process live.',
      playOrder: wfDiscState.buildNodes.map(n => n.id),
      steps: wfDiscState.buildNodes.map(n => ({
        node: n.id,
        headline: n.label,
        body: n.sub || 'Custom step — discuss routing and owners with the customer.',
        say: '“Walk me through who acts here and what triggers the next step.”',
      })),
      nodes: wfDiscState.buildNodes,
      edges: wfDiscState.buildEdges,
    };
  }
  return WF_DISC_SCENARIOS[wfDiscState.scenarioId];
}

function wfDiscRenderCanvas() {
  const s = wfDiscGetScenario();
  const canvas = document.getElementById('wf-disc-diagram');
  const svg = document.getElementById('wf-disc-edges');
  if (!canvas || !svg) return;

  const activeNodeId = s.playOrder[wfDiscState.stepIndex];
  const activeIdx = wfDiscState.stepIndex;

  wfDiscRenderEdges(svg, s.nodes, s.edges, Math.max(0, activeIdx - 1));

  canvas.querySelectorAll('.wf-disc-node').forEach(el => el.remove());
  s.nodes.forEach(n => {
    const wrap = document.createElement('div');
    wrap.innerHTML = wfDiscNodeEl(n, n.id === activeNodeId, wfDiscState.playing && n.id !== activeNodeId && s.playOrder.indexOf(n.id) > activeIdx);
    canvas.appendChild(wrap.firstElementChild);
  });

  document.getElementById('wf-disc-scenario-title').textContent = s.title;
  document.getElementById('wf-disc-scenario-tag').textContent = s.tag;
  document.getElementById('wf-disc-scenario-blurb').textContent = s.blurb;

  const step = s.steps.find(st => st.node === activeNodeId) || s.steps[0];
  if (step) {
    document.getElementById('wf-disc-story-headline').textContent = step.headline;
    document.getElementById('wf-disc-story-body').textContent = step.body;
    document.getElementById('wf-disc-story-say').textContent = step.say;
  }

  const total = s.playOrder.length;
  document.getElementById('wf-disc-step-counter').textContent = `Step ${wfDiscState.stepIndex + 1} of ${total}`;
  document.getElementById('wf-disc-progress-fill').style.width = `${((wfDiscState.stepIndex + 1) / total) * 100}%`;

  document.querySelectorAll('[data-wf-scenario]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.wfScenario === wfDiscState.scenarioId && wfDiscState.mode === 'examples');
  });
  document.getElementById('wf-disc-mode-examples')?.classList.toggle('active', wfDiscState.mode === 'examples');
  document.getElementById('wf-disc-mode-build')?.classList.toggle('active', wfDiscState.mode === 'build');
}

function wfDiscSelectScenario(id) {
  wfDiscStopPlay();
  wfDiscState.mode = 'examples';
  wfDiscState.scenarioId = id;
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
}

function wfDiscTogglePlay() {
  if (wfDiscState.playing) {
    wfDiscStopPlay();
    wfDiscRenderCanvas();
    return;
  }
  wfDiscState.playing = true;
  document.getElementById('wf-disc-play-btn')?.classList.add('wf-disc-play--on');
  wfDiscState.playTimer = setInterval(() => {
    const s = wfDiscGetScenario();
    if (wfDiscState.stepIndex >= s.playOrder.length - 1) {
      wfDiscStopPlay();
      wfDiscRenderCanvas();
      return;
    }
    wfDiscState.stepIndex += 1;
    wfDiscRenderCanvas();
  }, 2800);
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
      { id: 'b1', type: 'start', label: 'Intake', sub: 'Click palette to extend', icon: '📥', x: 50, y: 15 },
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
  const y = 15 + wfDiscState.buildNodes.length * 14;
  const prev = wfDiscState.buildNodes[wfDiscState.buildNodes.length - 1];
  const node = {
    id,
    type,
    label: item.label,
    sub: 'New step',
    icon: item.icon,
    x: 50,
    y: Math.min(y, 85),
  };
  wfDiscState.buildNodes.push(node);
  if (prev) wfDiscState.buildEdges.push([prev.id, id]);
  wfDiscState.stepIndex = wfDiscState.buildNodes.length - 1;
  wfDiscRenderCanvas();
  if (typeof showToast === 'function') showToast(`Added ${item.label}`, 'default');
}

function wfDiscClearBuild() {
  wfDiscStopPlay();
  wfDiscState.buildNodes = [
    { id: 'b1', type: 'start', label: 'Intake', sub: 'Click palette to extend', icon: '📥', x: 50, y: 15 },
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

  document.getElementById('wf-disc-prev')?.addEventListener('click', () => wfDiscStep(-1));
  document.getElementById('wf-disc-next')?.addEventListener('click', () => wfDiscStep(1));
  document.getElementById('wf-disc-play-btn')?.addEventListener('click', wfDiscTogglePlay);
  document.getElementById('wf-disc-restart')?.addEventListener('click', wfDiscRestart);
  document.getElementById('wf-disc-mode-examples')?.addEventListener('click', () => wfDiscSetMode('examples'));
  document.getElementById('wf-disc-mode-build')?.addEventListener('click', () => wfDiscSetMode('build'));
  document.getElementById('wf-disc-clear-build')?.addEventListener('click', wfDiscClearBuild);

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
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); wfDiscStep(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); wfDiscStep(-1); }
  });

  wfDiscRenderCanvas();
}

document.addEventListener('DOMContentLoaded', wfDiscInit);

window.wfDiscSelectScenario = wfDiscSelectScenario;
window.wfDiscTogglePlay = wfDiscTogglePlay;
