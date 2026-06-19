/* California Gov Workflow Walkthrough — cinematic document + CLM stage */

const GW_DATA = JSON.parse(document.getElementById('gw-scenario-data').textContent);
let gwCurrentState = GW_DATA.state || 'CA';
let gwCurrentScenario = 'first_party';
let gwCurrentStep = 0;
let gwPlaying = false;
let gwPlayTimer = null;
const GW_PLAY_INTERVAL = 5000;
let gwLastStep = -1;

/** Business value callouts per workflow step — for executives & agency leaders */
const GW_VALUE = {
  initiate: { headline: 'One front door for every contract request', text: 'Agreement Desk replaces email chains and lost attachments. Procurement and program staff submit once; leadership gets visibility from day one.', audience: 'COO · Procurement · Program directors' },
  intake: { headline: 'Vendor paper enters a controlled intake queue', text: 'Third-party contracts no longer sit in inboxes. CLM classifies the document, assigns an owner, and starts the clock on review SLAs.', audience: 'Procurement · Legal · Vendor managers' },
  generate: { headline: 'Generate contracts in minutes, not weeks', text: 'CLM pulls vendor, amount, and program data from your ERP and merges it into approved templates — with mandatory state clauses already in place.', audience: 'Contracts team · Business owners' },
  ai_scorecard: { headline: 'AI review catches risk before Legal spends time', text: 'Iris compares vendor language to your playbook in seconds — flagging liability, data residency, and insurance gaps so counsel focuses on what matters.', audience: 'Legal · Risk · CISO' },
  contracts_review: { headline: 'Structured approval — no more version confusion', text: 'Contracts team sees one authoritative draft with a clear routing chain. High-value deals auto-queue executive approval per policy.', audience: 'Contracts · Finance · Executives' },
  contracts_triage: { headline: 'Triage vendor paper against agency standards', text: 'Contracts quickly scores incoming vendor agreements and routes only exceptions to Legal — keeping routine deals moving.', audience: 'Contracts · Procurement' },
  legal_review: { headline: 'Legal stays in control of routing', text: 'Hub-and-spoke assignment lets counsel pick the next approver — suggested by playbook or entered manually — without losing audit trail.', audience: 'General Counsel · Legal ops' },
  external_review: { headline: 'Secure collaboration with vendors', text: 'Workspace gives external parties a controlled view to comment and redline — without email attachments or uncontrolled copies.', audience: 'Legal · Vendor relationship owners' },
  negotiation: { headline: 'Negotiation loops stay visible and auditable', text: 'Every redline round is tracked on the document and in CLM. Teams see exactly what changed in §6 Liability before accepting or sending back.', audience: 'Legal · Contracts · Vendor managers' },
  negotiation_out: { headline: 'Send redlines to vendor with one action', text: 'Agency counter-proposals go out through Workspace — vendors respond in context, not via scattered email threads.', audience: 'Legal · Contracts' },
  negotiation_return: { headline: 'Vendor responses route back automatically', text: 'When the vendor counters, CLM notifies the right owner and updates the task queue — nothing falls through the cracks.', audience: 'Legal · Procurement' },
  contracts_final: { headline: 'Final contracts sign-off before execution', text: 'Contracts confirms all playbook deviations are resolved and mandatory approvals are complete before signature.', audience: 'Contracts · Compliance' },
  contracts_approval: { headline: 'Final approval gate before signature', text: 'Contracts verifies all negotiation rounds are closed and policy requirements met — then releases for signature.', audience: 'Contracts · Compliance' },
  executive_approval: { headline: 'Policy-driven executive routing — automatic', text: 'Contracts above your dollar threshold route to the Director without manual escalation. Executives see a summary packet, not a 40-page PDF.', audience: 'CEO · Director · CFO' },
  signature: { headline: 'Sign anywhere — mobile, embedded, or in portal', text: 'DocuSign eSignature closes the loop with tamper-evident execution. Both parties sign the same final version — no re-keying.', audience: 'Authorized signers · All stakeholders' },
  post_execution: { headline: 'Executed contracts feed reporting & ERP automatically', text: 'Navigator captures renewals, obligations, and expiration dates. FI$Cal and your contract register update without manual data entry.', audience: 'CFO · CIO · Contract administrators' },
};

const GW_PLAIN = {
  initiate: 'A program manager submits a new contract request through Agreement Desk. The system captures vendor, value, and business owner — and opens a tracked workflow.',
  intake: 'Vendor paper arrives through the portal. CLM classifies the document and places it in the intake queue for Contracts.',
  generate: 'CLM generates the contract from your approved template, pre-filling vendor and dollar amount from FI$Cal.',
  ai_scorecard: 'Iris scans the draft against California Standard Terms and highlights clauses that need Legal attention.',
  contracts_review: 'The Contracts team reviews the draft, confirms playbook compliance, and advances to Legal.',
  contracts_triage: 'Contracts triages vendor paper and determines whether Legal review is required.',
  legal_review: 'Legal counsel reviews flagged clauses and assigns the next approver using hub-and-spoke routing.',
  external_review: 'The vendor receives a secure Workspace link to review and comment on the draft.',
  negotiation: 'Both sides exchange redlines on §6 Liability. The document shows exactly what was deleted and added.',
  negotiation_out: 'Agency sends counter-redlines to the vendor through Workspace.',
  negotiation_return: 'Vendor response returns to the agency queue for Legal review.',
  contracts_final: 'Contracts gives final approval once all redlines are resolved.',
  contracts_approval: 'Contracts confirms the agreement is ready for signature.',
  executive_approval: 'Because this contract exceeds $1M, CLM automatically routes to the Department Director for approval.',
  signature: 'Authorized signers execute the final version via DocuSign eSignature.',
  post_execution: 'The executed contract syncs to Navigator for reporting and pushes metadata back to FI$Cal.',
};

function gwSwitchTab(id) {
  document.querySelectorAll('.gw-tab-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('#gw-tabs .tab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById('gw-tab-' + id);
  if (panel) panel.style.display = 'block';
  event.currentTarget.classList.add('active');
}

function gwGetScenario() {
  return GW_DATA[gwCurrentScenario];
}

function gwGetScorecard() {
  return GW_DATA.scorecards[gwCurrentScenario];
}

async function gwChangeState(abbr) {
  gwStopPlay();
  abbr = abbr.toUpperCase();
  if (abbr === gwCurrentState && GW_DATA.context) return;

  const bar = document.getElementById('gw-context-bar');
  bar.style.opacity = '0.5';

  try {
    const res = await fetch(`/api/gov-workflows/state/${abbr}`);
    const pkg = await res.json();
    if (!res.ok) throw new Error(pkg.error || 'Failed to load state');

    GW_DATA.state = pkg.abbr;
    GW_DATA.context = pkg.context;
    GW_DATA.first_party = pkg.first_party;
    GW_DATA.third_party = pkg.third_party;
    GW_DATA.personas = pkg.personas;
    GW_DATA.scorecards = pkg.scorecards;
    GW_DATA.use_cases = pkg.use_cases;
    GW_DATA.executive_threshold = pkg.executive_threshold || 1000000;
    gwCurrentState = pkg.abbr;
    gwCurrentStep = 0;

    gwUpdateStateUI(pkg);
    gwSelectScenario(gwCurrentScenario);

    const url = new URL(window.location);
    url.searchParams.set('state', abbr);
    history.replaceState(null, '', url);
  } catch (e) {
    showToast('Could not load state: ' + e.message, 'error');
  } finally {
    bar.style.opacity = '1';
  }
}

function gwUpdateStateUI(pkg) {
  const ctx = pkg.context;
  const uc = pkg.use_cases;

  document.getElementById('gw-state-badge').textContent = ctx.state + ' State Agencies';
  document.getElementById('gw-page-sub').innerHTML =
    `Follow one contract from intake to execution for <strong>${ctx.state}</strong> — document, CLM screens, tasks, and reporting in <strong>DocuSign IAM</strong>.`;
  document.getElementById('gw-state-flag').textContent = ctx.flag;
  document.getElementById('gw-state-badge-text').textContent = ctx.badge;
  document.getElementById('ctx-erp').textContent = ctx.erp;
  document.getElementById('ctx-proc').textContent = ctx.procurement;
  document.getElementById('ctx-it').textContent = ctx.it_authority;
  document.getElementById('ctx-legal').textContent = ctx.legal;

  document.getElementById('uc-fp-title').textContent = uc.first_party.use_case;
  document.getElementById('uc-fp-agency').textContent = uc.first_party.agency;
  document.getElementById('uc-tp-title').textContent = uc.third_party.use_case;
  document.getElementById('uc-tp-agency').textContent = uc.third_party.agency;

  document.getElementById('gw-fp-btn-sub').textContent =
    uc.first_party.agency.split('—')[0].trim().slice(0, 48) + ' — agency template';
  document.getElementById('gw-tp-btn-sub').textContent =
    uc.third_party.vendor + ' vendor paper';

  document.getElementById('gw-standards-title').textContent = ctx.state;
  document.getElementById('gw-standards-list').innerHTML = ctx.standards
    .map(s => `<li class="standards-item">${s}</li>`).join('');

  if (pkg.clauses) {
    const items = document.querySelectorAll('#gw-clause-list .gw-clause-item');
    pkg.clauses.forEach((c, i) => {
      const el = items[i]?.querySelector('.clause-standard-text');
      if (el) el.textContent = c.ca_standard || c.state_standard || '';
    });
  }

  document.title = ctx.state + ' Gov Workflows — DocuSign Gov Portal';
}

function gwSelectScenario(id) {
  gwStopPlay();
  gwCurrentScenario = id;
  gwCurrentStep = 0;
  document.querySelectorAll('.gw-scenario-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.scenario === id);
  });
  gwRenderDocSummary();
  gwRenderPrefill();
  gwRenderReporting();
  gwRenderStep();
  gwRenderDiagram();
}

function gwRenderDocSummary() {
  const doc = gwGetScenario().document;
  const fields = [
    ['Type', doc.type],
    ['Template', doc.template],
    ['Value', doc.value],
    ['Term', doc.term],
    ['Vendor', doc.vendor],
    ['Agency', doc.agency],
    ['Solicitation', doc.solicitation],
  ];
  document.getElementById('gw-doc-fields').innerHTML = fields.map(([l, v]) => `
    <div class="extraction-item">
      <span class="extraction-label">${l}</span>
      <span class="extraction-value">${v}</span>
    </div>
  `).join('');
}

function gwRenderPrefill() {
  const pf = gwGetScenario().prefill_source;
  document.getElementById('gw-prefill-system').textContent = pf.system;
  document.getElementById('gw-prefill-fields').innerHTML = pf.fields.map(f => `
    <div class="gw-prefill-row">
      <div class="gw-prefill-field">
        <span class="gw-prefill-label">${f.field}</span>
        <span class="gw-prefill-value">${f.value}</span>
      </div>
      <span class="gw-prefill-source mono">${f.source}</span>
    </div>
  `).join('');
}

/* ── Live document panel with inline redlines ─────────────────────────────── */

function gwDocPhase(stepId) {
  const order = {
    initiate: 0, generate: 1, ai_scorecard: 2, contracts_review: 3,
    legal_review: 4, external_review: 5, negotiation: 6,
    executive_approval: 7, signature: 8, post_execution: 9,
  };
  return order[stepId] ?? 0;
}

function gwBuildContractHtml(doc, step, ctx) {
  const state = ctx.state || 'California';
  const sid = step.id;
  const phase = gwDocPhase(sid);
  const isThirdParty = gwCurrentScenario === 'third_party';
  const title = isThirdParty ? 'SaaS Subscription Agreement' : 'Master Services Agreement';
  const showBody = phase >= 1;
  const showRedlines = sid === 'negotiation' || sid === 'external_review';
  const showHighlights = sid === 'ai_scorecard' || sid === 'legal_review' || sid === 'contracts_review';
  const showSignatures = sid === 'signature' || sid === 'executive_approval';
  const executed = sid === 'post_execution';

  const liabilityBaseline = 'Total liability shall not exceed the total fees paid under this Agreement in the twelve (12) months preceding the claim.';
  const liabilityVendor = 'Provider shall have unlimited liability for all claims arising under this Agreement.';
  const liabilityCompromise = 'Total liability shall not exceed the total fees paid in the twelve (12) months preceding the claim.';

  const dataResidency = `All ${state} data shall remain within United States data centers operated by Provider.`;
  const insurance = 'Provider shall maintain commercial general liability insurance of not less than $2,000,000 per occurrence.';

  let liabilityHtml;
  if (showRedlines && sid === 'negotiation') {
    liabilityHtml = `
      <p class="gw-doc-p gw-doc-clause" data-clause="liability">
        <span class="gw-doc-clause-num">§6.1</span>
        <span class="gw-doc-redline-del">${liabilityVendor}</span>
        <span class="gw-doc-redline-add">${liabilityCompromise}</span>
        <span class="gw-doc-redline-note">← Vendor counter · Legal reviewing</span>
      </p>`;
  } else if (phase >= 2) {
    liabilityHtml = `
      <p class="gw-doc-p gw-doc-clause ${showHighlights && sid === 'ai_scorecard' ? 'gw-doc-highlight gw-doc-highlight--warn' : ''}" data-clause="liability">
        <span class="gw-doc-clause-num">§6.1</span> ${phase >= 6 && sid !== 'negotiation' ? liabilityCompromise : liabilityBaseline}
        ${showHighlights && sid === 'ai_scorecard' ? '<span class="gw-doc-margin-note">Iris: deviation from playbook</span>' : ''}
      </p>`;
  } else {
    liabilityHtml = '';
  }

  const intakeOverlay = sid === 'initiate' ? `
    <div class="gw-doc-intake-overlay">
      <div class="gw-doc-intake-card">
        <div class="gw-doc-intake-title">Agreement Desk · New request</div>
        <div class="gw-doc-intake-field"><label>Request type</label><span>${doc.type.split('(')[0].trim()}</span></div>
        <div class="gw-doc-intake-field"><label>Vendor</label><span>${doc.vendor}</span></div>
        <div class="gw-doc-intake-field"><label>Contract value</label><span>${doc.value}</span></div>
        <div class="gw-doc-intake-field"><label>Business owner</label><span>${doc.agency.split('(')[0].trim()}</span></div>
        <div class="gw-doc-intake-actions"><span class="gw-doc-intake-btn">Submit to queue</span></div>
      </div>
    </div>` : '';

  const generateOverlay = sid === 'generate' ? `
    <div class="gw-doc-gen-banner">
      <span class="gw-doc-gen-spinner"></span>
      Generating from template — merging ERP fields into ${doc.template.split('—')[0].trim()}…
    </div>` : '';

  return `
    ${intakeOverlay}
    ${generateOverlay}
    <div class="gw-doc-paper ${executed ? 'gw-doc-paper--executed' : ''} ${!showBody ? 'gw-doc-paper--empty' : ''}">
      ${executed ? '<div class="gw-doc-stamp">Fully Executed</div>' : ''}
      <div class="gw-doc-letterhead">
        <div class="gw-doc-letterhead-state">${state}</div>
        <div class="gw-doc-letterhead-agency">${doc.agency}</div>
      </div>
      <h3 class="gw-doc-doc-title">${title}</h3>
      <p class="gw-doc-meta-line"><strong>Between:</strong> ${doc.agency} <em>("Agency")</em></p>
      <p class="gw-doc-meta-line"><strong>And:</strong> ${doc.vendor} <em>("Provider")</em></p>
      ${showBody ? `
        <p class="gw-doc-p"><span class="gw-doc-clause-num">§1</span> <strong>Term.</strong> ${doc.term}. Effective upon full execution.</p>
        <p class="gw-doc-p gw-doc-clause ${showHighlights ? 'gw-doc-highlight' : ''}" data-clause="value">
          <span class="gw-doc-clause-num">§2</span> <strong>Contract value.</strong> ${doc.value} as set forth in the attached Statement of Work.
          ${sid === 'generate' ? '<span class="gw-doc-fill-anim">← pre-filled from ERP</span>' : ''}
        </p>
        <p class="gw-doc-p gw-doc-clause" data-clause="data">
          <span class="gw-doc-clause-num">§5</span> <strong>Data residency.</strong> ${dataResidency}
        </p>
        ${liabilityHtml}
        <p class="gw-doc-p gw-doc-clause ${showHighlights && sid === 'legal_review' ? 'gw-doc-highlight' : ''}" data-clause="insurance">
          <span class="gw-doc-clause-num">§7</span> <strong>Insurance.</strong> ${insurance}
        </p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">§9</span> <strong>Renewal.</strong> ${isThirdParty ? 'Auto-renews annually unless 90-day notice given.' : 'Two optional one-year extensions per DGS policy.'}</p>
      ` : `
        <div class="gw-doc-placeholder">
          <div class="gw-doc-placeholder-icon">📄</div>
          <p>Document will generate after intake is approved</p>
        </div>
      `}
      ${showSignatures ? `
        <div class="gw-doc-signatures">
          <div class="gw-doc-sig-block">
            <div class="gw-doc-sig-line"></div>
            <span>Agency authorized signer</span>
            ${sid === 'signature' ? '<span class="gw-doc-sig-pending">Awaiting DocuSign</span>' : ''}
          </div>
          <div class="gw-doc-sig-block">
            <div class="gw-doc-sig-line"></div>
            <span>${doc.vendor}</span>
          </div>
        </div>
      ` : ''}
    </div>`;
}

function gwRenderDocument(step) {
  const doc = gwGetScenario().document;
  const ctx = GW_DATA.context || {};
  const sid = step.id;

  const versions = {
    initiate: 'Intake form', generate: 'Draft v0.1 — generating',
    ai_scorecard: 'Draft v0.2', contracts_review: 'Draft v0.3',
    legal_review: 'Draft v0.4', external_review: 'Draft v0.5 — vendor review',
    negotiation: 'Draft v0.6 — redlined', executive_approval: 'Draft v0.7 — approved',
    signature: 'Final v1.0', post_execution: 'Executed v1.0',
  };
  const statuses = {
    initiate: 'Intake', generate: 'Generating', ai_scorecard: 'AI Review',
    contracts_review: 'Contracts Review', legal_review: 'Legal Review',
    external_review: 'Vendor Review', negotiation: 'In Negotiation',
    executive_approval: 'Executive Review', signature: 'Ready to Sign',
    post_execution: 'Executed',
  };

  document.getElementById('gw-doc-version').textContent = versions[sid] || 'Draft';
  document.getElementById('gw-doc-status').textContent = statuses[sid] || 'In Progress';
  document.getElementById('gw-doc-status').className = 'gw-doc-status gw-doc-status--' + sid;

  const page = document.getElementById('gw-doc-page');
  page.innerHTML = gwBuildContractHtml(doc, step, ctx);
  page.className = 'gw-doc-page gw-doc-page--' + sid;

  const hint = document.getElementById('gw-doc-flow-hint');
  const flowHint = step.flow_hint || 'forward';
  if (flowHint === 'loop_back') {
    hint.style.display = 'flex';
    hint.className = 'gw-doc-flow-hint gw-doc-flow-hint--back';
    hint.innerHTML = '<span class="gw-doc-flow-arrow">←</span> Sent back to vendor — redlines on §6 Liability';
  } else if (flowHint === 'forward_after_loop') {
    hint.style.display = 'flex';
    hint.className = 'gw-doc-flow-hint gw-doc-flow-hint--forward';
    hint.innerHTML = '<span class="gw-doc-flow-arrow">→</span> Negotiation resolved — document advances';
  } else {
    hint.style.display = 'none';
  }

  const meta = document.getElementById('gw-doc-meta');
  const reqId = 'REQ-2026-' + (4200 + (step.order || 1));
  meta.innerHTML = `
    <span>${reqId}</span>
    <span>${doc.solicitation}</span>
    <span>${doc.template.split('—')[0].trim()}</span>`;
}

/* ── Value callout ─────────────────────────────────────────────────────────── */

function gwRenderValueCallout(step) {
  const v = GW_VALUE[step.id] || {
    headline: step.title,
    text: step.description,
    audience: 'Agency stakeholders',
  };
  document.getElementById('gw-value-headline').textContent = v.headline;
  document.getElementById('gw-value-text').textContent = v.text;
  document.getElementById('gw-value-audience').textContent = v.audience;
}

/* ── Tasks & notifications panel ───────────────────────────────────────────── */

function gwRenderTasksPanel(step, persona) {
  const doc = gwGetScenario().document;
  const reqId = 'REQ-2026-' + (4200 + (step.order || 1));
  const sid = step.id;
  const personaName = persona.name || step.persona;

  const allTasks = gwGetTasksData(step, persona, doc, reqId);
  const activeTasks = allTasks.filter(t => t.active);
  const notifications = allTasks.filter(t => t.notif);
  const outstanding = allTasks.filter(t => !t.notif && !t.done);
  const dueWeek = allTasks.filter(t => t.dueWeek);

  document.getElementById('gw-tasks-count').textContent = String(notifications.length + outstanding.length);

  document.getElementById('gw-tasks-notifications').innerHTML = notifications.length
    ? notifications.map(n => `
      <div class="gw-task-notif gw-task-notif--${n.urgency || 'new'}">
        <span class="gw-task-notif-icon">${n.icon || '•'}</span>
        <div><strong>${n.title}</strong><span>${n.detail}</span></div>
      </div>`).join('')
    : '<div class="gw-task-notif"><span>No new notifications</span></div>';

  document.getElementById('gw-tasks-list').innerHTML = outstanding.map(t => `
    <div class="gw-task-item ${t.active ? 'gw-task-item--active' : ''} ${t.overdue ? 'gw-task-item--overdue' : t.soon ? 'gw-task-item--soon' : ''}">
      <span class="gw-task-check"></span>
      <div class="gw-task-item-body">
        <span class="gw-task-item-title">${t.title}</span>
        <span class="gw-task-item-meta">${t.assignee} · ${reqId}</span>
      </div>
      <span class="gw-task-due gw-task-due--${t.dueClass || 'default'}">${t.due}</span>
    </div>`).join('');

  document.getElementById('gw-tasks-due').innerHTML = dueWeek.length
    ? dueWeek.map(t => `
      <div class="gw-task-item ${t.overdue ? 'gw-task-item--overdue' : 'gw-task-item--soon'}">
        <span class="gw-task-check"></span>
        <div class="gw-task-item-body">
          <span class="gw-task-item-title">${t.title}</span>
          <span class="gw-task-item-meta">${t.assignee}</span>
        </div>
        <span class="gw-task-due gw-task-due--${t.dueClass}">${t.due}</span>
      </div>`).join('')
    : '<div class="gw-task-item"><span class="gw-task-item-body"><span class="gw-task-item-title">No tasks due this week</span></span></div>';
}

function gwGetTasksData(step, persona, doc, reqId) {
  const sid = step.id;
  const pn = persona.name || 'Assignee';
  const base = [
    { notif: true, icon: '📋', title: 'New request in queue', detail: `${doc.type.split('(')[0].trim()} · ${doc.value}`, urgency: sid === 'initiate' || sid === 'intake' ? 'new' : '' },
  ];

  const byStep = {
    initiate: [
      { title: 'Complete intake form', assignee: pn, due: 'Today', dueClass: 'soon', active: true, soon: true, dueWeek: true },
      { title: 'Attach SOW & budget approval', assignee: 'Program manager', due: 'Jun 20', dueClass: 'soon', soon: true, dueWeek: true },
    ],
    intake: [
      { title: 'Validate vendor registration', assignee: 'Procurement', due: 'Today', dueClass: 'soon', active: true, soon: true, dueWeek: true },
      { title: 'Classify document type', assignee: 'CLM (auto)', due: 'Done', dueClass: 'done', done: true },
    ],
    generate: [
      { notif: true, icon: '⚡', title: 'Document generated', detail: 'Template merged with ERP data', urgency: 'new' },
      { title: 'Review generated draft', assignee: pn, due: 'Today', dueClass: 'soon', active: true, soon: true, dueWeek: true },
    ],
    ai_scorecard: [
      { notif: true, icon: '✦', title: 'Iris flagged 2 clauses', detail: '§6 Liability · §7 Insurance', urgency: 'urgent' },
      { title: 'Review AI scorecard', assignee: pn, due: 'Today', dueClass: 'soon', active: true, soon: true, dueWeek: true },
    ],
    contracts_review: [
      { title: 'Contracts playbook review', assignee: pn, due: 'Jun 19', dueClass: 'soon', active: true, soon: true, dueWeek: true },
      { title: 'Confirm executive routing', assignee: 'CLM (auto)', due: 'Queued', dueClass: 'default' },
    ],
    legal_review: [
      { notif: true, icon: '⚖', title: 'Legal review assigned', detail: `${pn} — select next approver`, urgency: 'new' },
      { title: 'Assign next approver', assignee: pn, due: 'Today', dueClass: 'soon', active: true, soon: true, dueWeek: true },
      { title: 'Review §6 Liability deviation', assignee: pn, due: 'Jun 19', dueClass: 'soon', soon: true, dueWeek: true },
    ],
    external_review: [
      { notif: true, icon: '👥', title: 'Vendor invited to Workspace', detail: doc.vendor, urgency: 'new' },
      { title: 'Await vendor comments', assignee: doc.vendor, due: 'Jun 22', dueClass: 'default', dueWeek: true },
    ],
    negotiation: [
      { notif: true, icon: '↩', title: 'Negotiation round 2', detail: 'Vendor counter on §6 Liability', urgency: 'urgent' },
      { title: 'Accept or reject redlines', assignee: pn, due: 'Today', dueClass: 'overdue', active: true, overdue: true, dueWeek: true },
    ],
    executive_approval: [
      { notif: true, icon: '★', title: 'Executive approval required', detail: `${doc.value} exceeds threshold`, urgency: 'urgent' },
      { title: 'Director review & approve', assignee: pn, due: 'Today', dueClass: 'soon', active: true, soon: true, dueWeek: true },
    ],
    signature: [
      { notif: true, icon: '✍', title: 'Ready for signature', detail: 'Envelope prepared in eSignature', urgency: 'new' },
      { title: 'Agency signature', assignee: pn, due: 'Jun 20', dueClass: 'soon', active: true, soon: true, dueWeek: true },
      { title: 'Vendor signature', assignee: doc.vendor, due: 'Jun 21', dueClass: 'default', dueWeek: true },
    ],
    post_execution: [
      { notif: true, icon: '✓', title: 'Contract executed', detail: 'Synced to Navigator & ERP', urgency: 'new' },
      { title: 'Insurance cert renewal', assignee: 'Contract admin', due: 'Jul 2027', dueClass: 'default' },
      { title: 'Quarterly SLA report', assignee: doc.vendor, due: 'Sep 2026', dueClass: 'soon', dueWeek: true },
    ],
  };

  const stepTasks = byStep[sid] || byStep.contracts_review || [];
  return [...base, ...stepTasks];
}


function gwRenderReporting() {
  const doc = gwGetScenario().document;
  const ctx = GW_DATA.context || {};
  const erp = (ctx.erp || 'ERP').split('(')[0].trim();
  const isThirdParty = gwCurrentScenario === 'third_party';
  const step = gwGetScenario().steps[gwCurrentStep];
  const executed = step && step.id === 'post_execution';
  const sid = step ? step.id : '';
  const reqId = 'REQ-2026-' + (4200 + ((step && step.order) || 1));

  document.getElementById('gw-reporting-live').textContent = executed ? 'Synced to Navigator' : 'Live preview';
  document.getElementById('gw-reporting-live').className = 'gw-reporting-live' + (executed ? ' gw-reporting-live--active' : '');
  document.getElementById('gw-reporting-sub').textContent = executed
    ? 'Contract metadata, obligations, and renewal dates synced from CLM to Navigator'
    : 'Obligations and dates populate as the contract moves through CLM — full sync after execution';

  const renewals = isThirdParty ? [
    { label: doc.vendor, date: 'Jun 2029', note: 'Auto-renew · 90-day notice window opens Mar 2029', urgency: 'future' },
    { label: 'Annual subscription tier', date: 'Jun 2027', note: 'Price adjustment review per §9', urgency: 'medium' },
  ] : [
    { label: doc.type.split('+')[0].trim(), date: 'Jun 2029', note: 'Option year 2 · DGS extension review', urgency: 'future' },
    { label: 'SOW performance period', date: 'Jun 2028', note: 'Mid-term SLA assessment', urgency: 'medium' },
  ];

  const expirations = [
    { label: 'Base term ends', date: isThirdParty ? 'Jun 2028' : 'Jun 2027', note: doc.term, urgency: 'medium' },
    { label: 'Maximum term (with options)', date: 'Jun 2029', note: 'Final expiration if all options exercised', urgency: 'low' },
  ];

  const obligations = [
    { label: 'Certificate of insurance', date: 'Jul 2027', note: 'Annual renewal · §7', status: executed ? 'tracked' : 'pending' },
    { label: 'Data security attestation', date: 'Dec 2026', note: 'SOC 2 report due · §5', status: executed ? 'tracked' : 'pending' },
    { label: 'Quarterly SLA report', date: 'Sep 2026', note: 'Provider deliverable · SOW §3', status: 'pending' },
    { label: erp + ' encumbrance sync', date: executed ? 'Today' : 'On execution', note: 'Budget line committed post-signature', status: executed ? 'done' : 'pending' },
  ];

  const outstandingTasks = [
    { label: sid === 'post_execution' ? 'Insurance cert renewal' : 'Review assigned contract', date: sid === 'post_execution' ? 'Jul 2027' : 'Today', note: `${doc.vendor} · ${reqId}`, urgency: sid === 'negotiation' ? 'medium' : 'medium' },
    { label: 'Legal hub routing', date: sid === 'legal_review' ? 'Overdue' : 'Jun 22', note: 'Assign next approver if pending', urgency: sid === 'legal_review' ? 'medium' : 'low' },
    { label: 'Executive approval packet', date: parseInt((doc.value || '').replace(/\D/g, '')) >= (GW_DATA.executive_threshold || 1000000) ? 'Required' : 'N/A', note: 'Auto-queued above threshold', urgency: 'low' },
  ].filter(t => t.date !== 'N/A');

  function renderItems(items, elId) {
    document.getElementById(elId).innerHTML = items.map(it => `
      <div class="gw-report-row gw-report-row--${it.urgency || it.status || 'default'}">
        <div class="gw-report-row-main">
          <span class="gw-report-row-label">${it.label}</span>
          <span class="gw-report-row-note">${it.note}</span>
        </div>
        <span class="gw-report-row-date">${it.date}</span>
      </div>`).join('');
  }

  renderItems(outstandingTasks, 'gw-report-tasks');

  renderItems(renewals, 'gw-report-renewals');
  renderItems(expirations, 'gw-report-expirations');
  renderItems(obligations, 'gw-report-obligations');

  document.getElementById('gw-reporting-section').classList.toggle('gw-reporting-section--executed', executed);
}

/* ── CLM / Agreement Desk mock ─────────────────────────────────────────────── */

function gwRenderClmMock(step, persona) {
  const doc = gwGetScenario().document;
  const ctx = GW_DATA.context || {};
  const erp = (ctx.erp || 'ERP').split('(')[0].trim();
  const screen = step.clm_screen || 'agreement_desk';
  const reqId = 'REQ-2026-' + (4200 + (step.order || 1));
  const sid = step.id;

  const productLabels = {
    initiate: 'Agreement Desk', generate: 'CLM · Document Builder',
    ai_scorecard: 'CLM · Iris Review', contracts_review: 'CLM · Approvals',
    legal_review: 'CLM · Legal Hub', external_review: 'CLM · Workspace',
    negotiation: 'CLM · Redline', executive_approval: 'CLM · Executive',
    signature: 'IAM · eSignature', post_execution: 'Navigator · Reporting',
  };
  document.getElementById('clm-mock-product-label').textContent = productLabels[sid] || 'IAM · CLM';

  document.getElementById('clm-mock-bc').textContent =
    sid === 'post_execution' ? `Navigator › ${doc.vendor}` :
    sid === 'signature' ? `eSignature › ${reqId}` :
    `Agreement Desk › ${reqId} › ${step.title}`;

  document.getElementById('clm-mock-status').textContent =
    sid === 'signature' ? 'Ready to Sign' :
    sid === 'post_execution' ? 'Executed' :
    sid === 'negotiation' ? 'In Negotiation' :
    sid === 'initiate' ? 'New Request' : 'In Review';

  document.getElementById('clm-mock-persona').innerHTML = `
    <span class="clm-mock-avatar">${persona.icon || '?'}</span>
    <div>
      <div class="clm-mock-persona-name">${persona.name || step.persona}</div>
      <div class="clm-mock-persona-role">${persona.title || ''}</div>
    </div>
    <span class="clm-mock-acting">Active now</span>`;

  const banner = document.getElementById('clm-flow-banner');
  const hint = step.flow_hint || 'forward';
  if (hint === 'loop_back') {
    banner.style.display = 'flex';
    banner.className = 'clm-flow-banner clm-flow-banner--back';
    banner.innerHTML = '<span class="clm-flow-arrow-icon">←</span> Returned for counter-redlines on §6';
  } else if (hint === 'forward_after_loop') {
    banner.style.display = 'flex';
    banner.className = 'clm-flow-banner clm-flow-banner--forward';
    banner.innerHTML = '<span class="clm-flow-arrow-icon">→</span> Redlines accepted — advancing workflow';
  } else {
    banner.style.display = 'none';
  }

  const bodies = {
    agreement_desk: `
      <div class="clm-screen-title">Agreement Desk — Intake queue</div>
      <div class="clm-desk-layout">
        <div class="clm-desk-sidebar">
          <div class="clm-desk-nav active">My queue <span>3</span></div>
          <div class="clm-desk-nav">Team requests</div>
          <div class="clm-desk-nav">All open</div>
        </div>
        <div class="clm-desk-main">
          <table class="clm-desk-table">
            <thead><tr><th>Request</th><th>Type</th><th>Agency</th><th>Status</th></tr></thead>
            <tbody>
              <tr class="clm-desk-row active"><td><span class="clm-desk-id">${reqId}</span></td><td>${doc.type.split('(')[0].trim()}</td><td>${doc.agency.split('(')[0].trim()}</td><td><span class="clm-pill clm-pill--new">New</span></td></tr>
              <tr class="clm-desk-row"><td>REQ-2026-4198</td><td>SOW Amendment</td><td>Procurement</td><td><span class="clm-pill">Review</span></td></tr>
              <tr class="clm-desk-row"><td>REQ-2026-4187</td><td>NDA</td><td>Legal</td><td><span class="clm-pill">Sign</span></td></tr>
            </tbody>
          </table>
          <div class="clm-desk-detail">
            <div class="clm-field"><label>Vendor</label><span>${doc.vendor}</span></div>
            <div class="clm-field"><label>Value</label><span>${doc.value}</span></div>
            <div class="clm-field"><label>Source</label><span>${erp} pre-fill</span></div>
          </div>
          <button class="clm-btn-primary clm-btn-compact">Open request →</button>
        </div>
      </div>`,
    document_builder: `
      <div class="clm-screen-title">Generate from template</div>
      <div class="clm-gen-preview">
        <div class="clm-gen-doc-thumb"><div class="clm-gen-doc-lines"></div><span>${doc.template.split('—')[0].trim()}</span></div>
        <div class="clm-gen-fields">
          <div class="clm-panel-label">Fields merging from ${erp}</div>
          <div class="clm-kv clm-kv--anim"><span>Vendor</span><strong>${doc.vendor}</strong></div>
          <div class="clm-kv clm-kv--anim"><span>Amount</span><strong>${doc.value}</strong></div>
          <div class="clm-kv"><span>Term</span><strong>${doc.term.split('+')[0].trim()}</strong></div>
          <div class="clm-checklist"><div class="clm-check done">✓ Mandatory clauses inserted</div><div class="clm-check done">✓ SOW schedule attached</div><div class="clm-check done">✓ Ethics certification block</div></div>
        </div>
      </div>`,
    iris_review: `
      <div class="clm-screen-title">Iris AI-assisted review</div>
      <div class="clm-iris-layout">
        <div class="clm-iris-doc">
          <div class="clm-iris-doc-line">§5 Data residency — <em>matches playbook</em></div>
          <div class="clm-iris-doc-line clm-iris-doc-line--flag">§6 Liability — <strong>deviation detected</strong></div>
          <div class="clm-iris-doc-line">§7 Insurance — <em>matches playbook</em></div>
        </div>
        <div class="clm-iris-panel">
          <div class="clm-iris-score">${(gwGetScorecard() || {}).overall_score || 88}<span>/100</span></div>
          <div class="clm-iris-label">Playbook match</div>
          <div class="clm-flag clm-flag--warn">⚠ §6 Liability cap deviation</div>
          <div class="clm-flag clm-flag--ok">✓ §5 Data residency OK</div>
          <button class="clm-btn-sm">Apply suggested redline to §6</button>
        </div>
      </div>`,
    approval_queue: `
      <div class="clm-screen-title">Approval routing</div>
      <div class="clm-approval-chain">
        <div class="clm-approval-node done"><span>1</span> Contracts</div>
        <div class="clm-approval-arrow">→</div>
        <div class="clm-approval-node active"><span>2</span> Legal</div>
        <div class="clm-approval-arrow">→</div>
        <div class="clm-approval-node"><span>3</span> Vendor</div>
        <div class="clm-approval-arrow">→</div>
        <div class="clm-approval-node exec"><span>★</span> Executive</div>
      </div>
      <div class="clm-rule-alert">Auto: ${doc.value} exceeds $${(GW_DATA.executive_threshold || 1000000).toLocaleString()} — executive step queued after legal</div>`,
    legal_hub: `
      <div class="clm-screen-title">Legal hub — assign next approver</div>
      <div class="clm-hub">
        <div class="clm-hub-center">Legal<br><small>${persona.name || 'Counsel'}</small></div>
        <div class="clm-hub-spoke clm-hub-spoke--suggested">→ Contracts Final <span>Suggested</span></div>
        <div class="clm-hub-spoke">→ Vendor Review</div>
        <div class="clm-hub-spoke">→ Procurement</div>
      </div>
      <div class="clm-assign-row">
        <label>Next approver</label>
        <select class="clm-select"><option>Suggested: Contracts Final</option><option>Vendor Review</option><option>Manual entry…</option></select>
        <button class="clm-btn-sm">Route</button>
      </div>`,
    workspace: `
      <div class="clm-screen-title">Workspace — external review</div>
      <div class="clm-workspace">
        <div class="clm-ws-doc">
          <div class="clm-ws-doc-title">${doc.template || doc.type}</div>
          <div class="clm-ws-highlight">§6 Liability — vendor comment</div>
        </div>
        <div class="clm-ws-comments">
          <div class="clm-comment"><strong>${doc.vendor}</strong> Proposed unlimited liability in §6 <span>2h ago</span></div>
          <div class="clm-comment clm-comment--agency"><strong>${persona.name}</strong> Reviewing counter-proposal <span>Now</span></div>
        </div>
      </div>`,
    redline_compare: `
      <div class="clm-screen-title">Redline compare — linked to document §6</div>
      <div class="clm-redline-inline">
        <div class="clm-redline-clause"><span class="clm-redline-clause-ref">§6.1 Liability</span></div>
        <div class="clm-redline-wrap">
          <div class="clm-redline-col"><div class="clm-redline-h">Agency playbook</div><div class="clm-redline-text">Liability capped at 12 mo fees</div></div>
          <div class="clm-redline-mid"><div class="clm-loop-visual"><span class="clm-loop-arrow">↩</span><span>Loop</span><span class="clm-loop-arrow">→</span></div></div>
          <div class="clm-redline-col"><div class="clm-redline-h">Vendor v0.6</div><div class="clm-redline-text del">Unlimited liability</div><div class="clm-redline-text add">Cap at 12 mo fees</div></div>
        </div>
      </div>
      <div class="clm-redline-actions"><button class="clm-btn-sm">Accept change</button><button class="clm-btn-sm clm-btn-ghost">Reject → loop back</button></div>`,
    executive_approval: `
      <div class="clm-screen-title">Executive approval</div>
      <div class="clm-exec-card">
        <div class="clm-exec-badge">Automatic routing triggered</div>
        <div class="clm-exec-val">${doc.value}</div>
        <div class="clm-exec-threshold">Threshold ≥ $${(GW_DATA.executive_threshold || 1000000).toLocaleString()}</div>
        <div class="clm-exec-signer">${persona.name || 'Director'} · Authorized signer</div>
        <button class="clm-btn-primary">Review summary &amp; approve</button>
      </div>`,
    esign_handoff: `
      <div class="clm-screen-title">Send for signature — eSignature</div>
      <div class="clm-esign">
        <div class="clm-esign-recipient"><span>A</span> ${persona.name || 'Agency Signer'} · Agency</div>
        <div class="clm-esign-recipient"><span>V</span> ${doc.vendor} · Vendor</div>
        <div class="clm-esign-status">Envelope prepared · signature blocks placed on final v1.0</div>
        <button class="clm-btn-primary">Send with DocuSign</button>
      </div>`,
    obligations_erp: `
      <div class="clm-screen-title">Post-execution — Navigator sync</div>
      <div class="clm-navigator-sync">
        <div class="clm-sync-row"><span>Contract recorded in Navigator</span><span class="clm-pill clm-pill--ok">Done</span></div>
        <div class="clm-sync-row"><span>Obligations extracted (4)</span><span class="clm-pill clm-pill--ok">Done</span></div>
        <div class="clm-sync-row"><span>Renewal date: Jun 2029</span><span class="clm-pill">Tracked</span></div>
        <div class="clm-sync-row clm-sync-row--erp"><span>↗ ${erp} encumbrance committed</span><span class="clm-pill clm-pill--ok">Synced</span></div>
      </div>`,
  };

  document.getElementById('clm-mock-body').innerHTML = bodies[screen] || bodies.agreement_desk;

  const rulesEl = document.getElementById('clm-mock-rules');
  const rules = step.business_rules || [];
  rulesEl.innerHTML = rules.length ? rules.map(r => `
    <div class="clm-rule ${r.auto ? 'clm-rule--auto' : 'clm-rule--manual'}">
      <span class="clm-rule-type">${r.auto ? 'Auto' : 'Manual'}</span>
      <div><strong>${r.label}</strong><span>${r.detail}</span></div>
    </div>`).join('') : '';
}

function gwRenderDiagram() {
  const steps = gwGetScenario().steps;
  const wrap = document.getElementById('gw-diagram');
  wrap.innerHTML = steps.map((s, i) => {
    const persona = GW_DATA.personas[s.persona] || {};
    const state = i < gwCurrentStep ? 'done' : i === gwCurrentStep ? 'active' : '';
    const productClass = s.product === 'CLM' ? 'clm' : s.product === 'IAM' ? 'iam' : 'both';
    const loopMark = s.flow_hint === 'loop_back' ? '<span class="gw-rail-loop">↩</span>' : '';
    const icons = {
      initiate: '📥', generate: '📝', ai_scorecard: '✦', contracts_review: '📋',
      legal_review: '⚖', external_review: '👥', negotiation: '↔',
      executive_approval: '★', signature: '✍', post_execution: '✓',
    };
    return `
      <button type="button" class="gw-rail-step ${state}" data-step="${i}" onclick="gwGoToStep(${i})" title="${s.title}">
        ${loopMark}
        <span class="gw-rail-icon">${icons[s.id] || s.order}</span>
        <span class="gw-rail-num">${s.order}</span>
        <span class="gw-rail-title">${s.title}</span>
        <span class="gw-rail-persona">${persona.name || s.persona}</span>
        <span class="gw-flow-product gw-flow-product--${productClass}">${s.product}</span>
      </button>
      ${i < steps.length - 1 ? `<span class="gw-rail-connector ${i < gwCurrentStep ? 'done' : ''}"></span>` : ''}`;
  }).join('');
}

function gwRenderStep() {
  const steps = gwGetScenario().steps;
  const step = steps[gwCurrentStep];
  if (!step) return;

  const persona = GW_DATA.personas[step.persona] || {};
  const total = steps.length;

  document.getElementById('gw-step-title').textContent = step.title;
  document.getElementById('gw-step-product').textContent = step.product;
  document.getElementById('gw-step-product').className = 'gw-product-badge gw-product-badge--' +
    (step.product === 'CLM' ? 'clm' : step.product === 'IAM' ? 'iam' : 'both');

  document.getElementById('gw-persona-row').innerHTML = `
    <div class="gw-persona-chip gw-persona-chip--${persona.color || 'muted'}">
      <span class="gw-persona-avatar">${persona.icon || '?'}</span>
      <div>
        <div class="gw-persona-name">${persona.name || step.persona}</div>
        <div class="gw-persona-title">${persona.title || ''} · ${persona.dept || ''}</div>
      </div>
    </div>`;

  document.getElementById('gw-step-desc').textContent = step.description;
  document.getElementById('gw-narrative-summary').textContent =
    GW_PLAIN[step.id] || step.description;

  document.getElementById('gw-step-actions').innerHTML = (step.actions || [])
    .map(a => `<li>${a}</li>`).join('');

  gwRenderValueCallout(step);
  gwRenderTasksPanel(step, persona);

  const apiEl = document.getElementById('gw-step-api');
  if (step.api) {
    apiEl.style.display = 'block';
    apiEl.innerHTML = `
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:6px">API Call</div>
      <div class="code-block" style="font-size:10px">${step.api.method} ${step.api.path}\n// ${step.api.desc}</div>`;
  } else {
    apiEl.style.display = 'none';
  }

  document.querySelectorAll('.gw-clause-item').forEach(el => {
    el.classList.toggle('highlighted', (step.clauses_highlighted || []).includes(el.dataset.clauseId));
  });

  const scorecardEl = document.getElementById('gw-scorecard-card');
  if (step.ai_review) {
    scorecardEl.open = true;
    gwRenderScorecard();
  } else {
    scorecardEl.open = false;
  }

  gwRenderDocument(step);
  gwRenderClmMock(step, persona);
  gwRenderReporting();
  gwLastStep = gwCurrentStep;

  document.getElementById('gw-step-counter').textContent = `Step ${gwCurrentStep + 1} of ${total}`;
  document.getElementById('gw-progress-bar').style.width = `${((gwCurrentStep + 1) / total) * 100}%`;

  document.getElementById('gw-btn-prev').disabled = gwCurrentStep === 0;
  document.getElementById('gw-btn-next').disabled = gwCurrentStep >= total - 1;

  gwRenderDiagram();

  const stage = document.querySelector('.gw-stage');
  if (stage) {
    stage.classList.remove('gw-stage--pulse');
    void stage.offsetWidth;
    stage.classList.add('gw-stage--pulse');
  }
}

function gwRenderScorecard() {
  const sc = gwGetScorecard();
  if (!sc) return;

  const gradeColor = sc.overall_score >= 90 ? 'var(--green)' : sc.overall_score >= 75 ? 'var(--amber)' : 'var(--red)';

  document.getElementById('gw-scorecard-header').innerHTML = `
    <div class="gw-score-overall">
      <div class="gw-score-circle" style="--score-color:${gradeColor}">
        <span class="gw-score-num">${sc.overall_score}</span>
        <span class="gw-score-grade">${sc.grade}</span>
      </div>
      <div class="gw-score-summary">${sc.summary}</div>
    </div>`;

  document.getElementById('gw-scorecard-clauses').innerHTML = (sc.clauses || []).map(c => {
    if (c.status === 'na') {
      return `<div class="gw-score-clause gw-score-clause--na">
        <span class="gw-score-clause-name">${c.name}</span>
        <span class="gw-score-clause-note">${c.note}</span>
      </div>`;
    }
    const icon = c.status === 'pass' ? '✓' : c.status === 'warn' ? '!' : '✗';
    const cls = c.status === 'pass' ? 'pass' : c.status === 'warn' ? 'warn' : 'fail';
    return `<div class="gw-score-clause gw-score-clause--${cls}">
      <div class="gw-score-clause-left">
        <span class="gw-score-clause-icon">${icon}</span>
        <span class="gw-score-clause-name">${c.name}</span>
      </div>
      <div class="gw-score-clause-right">
        <span class="gw-score-clause-score">${c.score}</span>
        <span class="gw-score-clause-note">${c.note}</span>
      </div>
    </div>`;
  }).join('');
}

function gwGoToStep(i) {
  gwCurrentStep = i;
  gwRenderStep();
}

function gwStepNext() {
  const total = gwGetScenario().steps.length;
  if (gwCurrentStep < total - 1) {
    gwCurrentStep++;
    gwRenderStep();
  } else {
    gwStopPlay();
  }
}

function gwStepPrev() {
  if (gwCurrentStep > 0) {
    gwCurrentStep--;
    gwRenderStep();
  }
}

function gwTogglePlay() {
  if (gwPlaying) gwStopPlay();
  else gwStartPlay();
}

function gwStartPlay() {
  gwPlaying = true;
  document.getElementById('gw-btn-play').textContent = '⏸ Pause';
  gwPlayTimer = setInterval(() => {
    const total = gwGetScenario().steps.length;
    if (gwCurrentStep >= total - 1) {
      gwStopPlay();
      return;
    }
    gwStepNext();
  }, GW_PLAY_INTERVAL);
}

function gwStopPlay() {
  gwPlaying = false;
  clearInterval(gwPlayTimer);
  document.getElementById('gw-btn-play').textContent = '▶ Play walkthrough';
}

function gwAppendHint(text) {
  const ta = document.getElementById('gw-builder-input');
  const cur = ta.value.trim();
  ta.value = cur ? cur + ', ' + text.toLowerCase() : text;
}

async function gwGenerateScenario() {
  const desc = document.getElementById('gw-builder-input').value.trim();
  if (!desc) return;

  const out = document.getElementById('gw-builder-output');
  out.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--muted)">Generating…</div>';

  try {
    const res = await fetch('/api/gov-workflows/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc, state: gwCurrentState }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');

    out.innerHTML = `
      <div class="gw-builder-result">
        <div class="card gw-builder-path gw-builder-path--iam">
          <div class="card-header">
            <span class="card-title">${data.iam_path.title}</span>
            <span class="gw-product-badge gw-product-badge--cloud">IAM</span>
          </div>
          <p style="font-size:12px;color:var(--muted);margin-bottom:14px">${data.iam_path.subtitle}</p>
          <div class="gw-builder-steps">
            ${data.iam_path.steps.map((s, i) => gwBuilderStepHtml(s, i + 1)).join('')}
          </div>
          <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">
            ${data.iam_path.products.map(p => `<span class="gw-builder-product-tag">${p}</span>`).join('')}
          </div>
        </div>
        <div class="card gw-builder-path gw-builder-path--clm">
          <div class="card-header">
            <span class="card-title">${data.clm_path.title}</span>
            <span class="gw-product-badge gw-product-badge--clm">CLM</span>
          </div>
          <p style="font-size:12px;color:var(--muted);margin-bottom:14px">${data.clm_path.subtitle}</p>
          <div class="gw-builder-steps">
            ${data.clm_path.steps.map((s, i) => gwBuilderStepHtml(s, i + 1)).join('')}
          </div>
          <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">
            ${data.clm_path.products.map(p => `<span class="gw-builder-product-tag">${p}</span>`).join('')}
          </div>
        </div>
        <div class="card gw-builder-convergence">
          <div class="card-header"><span class="card-title">Convergence · ${data.state ? data.state.state : gwCurrentState}</span></div>
          <p style="font-size:12px;color:var(--muted);line-height:1.6">${data.convergence_note}</p>
        </div>
      </div>`;
  } catch (e) {
    out.innerHTML = `<div class="alert alert-error"><div class="alert-body"><div class="alert-detail">${e.message}</div></div></div>`;
  }
}

function gwBuilderStepHtml(step, num) {
  const persona = GW_DATA.personas[step.persona] || {};
  const productClass = step.product === 'CLM' ? 'clm' : 'cloud';
  return `
    <div class="gw-builder-step">
      <span class="gw-builder-step-num">${num}</span>
      <div class="gw-builder-step-body">
        <span class="gw-builder-step-name">${step.step}</span>
        <span class="gw-builder-step-persona">${persona.name || step.persona}</span>
      </div>
      <span class="gw-flow-product gw-flow-product--${productClass}">${step.product}</span>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  gwSelectScenario('first_party');
});
