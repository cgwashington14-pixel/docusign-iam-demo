/* Visual product UI for Gov Workflow walkthrough — dashboard, email, CLM, document, signing, Navigator */

let gwActiveVisualView = 'dashboard';
let gwSigningLaunched = false;

const GW_VIEW_META = {
  dashboard: { label: 'Dashboard', icon: '▦' },
  email:     { label: 'Email alert', icon: '✉' },
  tasks:     { label: 'Task inbox', icon: '☐' },
  clm:       { label: 'IAM Platform', icon: '◫' },
  document:  { label: 'Contract', icon: '📄' },
  sign:      { label: 'eSignature', icon: '✍' },
  navigator: { label: 'Agreement Manager', icon: '🗂' },
};

const GW_STEP_VIEWS = {
  initiate:           ['dashboard', 'tasks', 'email'],
  intake:             ['email', 'tasks', 'dashboard'],
  generate:           ['clm', 'document', 'dashboard'],
  ai_scorecard:       ['document', 'clm'],
  contracts_review:   ['email', 'tasks', 'clm'],
  contracts_triage:   ['email', 'tasks', 'clm'],
  legal_review:       ['clm', 'document', 'tasks'],
  external_review:    ['clm', 'document'],
  negotiation:        ['document', 'clm'],
  negotiation_out:    ['document', 'clm'],
  negotiation_return: ['email', 'document', 'clm'],
  contracts_final:    ['tasks', 'clm', 'document'],
  contracts_approval: ['tasks', 'clm'],
  executive_approval: ['clm', 'tasks'],
  signature:          ['sign', 'document'],
  post_execution:     ['navigator', 'document', 'dashboard'],
  sol_publish:        ['clm', 'document', 'dashboard'],
  sol_register:       ['clm', 'email', 'document'],
  sol_intake:         ['clm', 'tasks', 'email'],
  sol_evaluation:     ['clm', 'document', 'tasks'],
  sol_award:          ['clm', 'tasks', 'document'],
};

const GW_STEP_DEFAULT_VIEW = {
  initiate: 'dashboard', intake: 'email', generate: 'document',
  ai_scorecard: 'document', contracts_review: 'email', contracts_triage: 'email',
  legal_review: 'document', external_review: 'clm', negotiation: 'document',
  negotiation_out: 'document', negotiation_return: 'email',
  contracts_final: 'tasks', contracts_approval: 'tasks',
  executive_approval: 'clm', signature: 'sign', post_execution: 'navigator',
  sol_publish: 'clm', sol_register: 'clm', sol_intake: 'clm',
  sol_evaluation: 'clm', sol_award: 'clm',
};

function gwSetVisualView(view) {
  if (typeof gwPlaying !== 'undefined' && gwPlaying && typeof gwStopPlay === 'function') gwStopPlay();
  gwActiveVisualView = view;
  const step = gwGetScenario().steps[gwCurrentStep];
  const persona = GW_DATA.personas[step.persona] || {};
  gwRenderVisualCanvas(step, persona);
  document.querySelectorAll('#gw-visual-tabs .gw-visual-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

function gwRenderVisualHero(step, persona) {
  const views = GW_STEP_VIEWS[step.id] || ['clm', 'document'];
  if (!views.includes(gwActiveVisualView)) {
    gwActiveVisualView = GW_STEP_DEFAULT_VIEW[step.id] || views[0];
  }

  document.getElementById('gw-visual-tabs').innerHTML = views.map(v => {
    const label = (v === 'clm' && step.id === 'legal_review') ? (gwCurrentScenario === 'solicitation' ? 'Award review' : 'Legal Review')
      : (v === 'document' && step.id === 'legal_review') ? 'Word · Playbook'
      : (v === 'document' && step.id === 'ai_scorecard') ? 'Word · Iris review'
      : (v === 'document' && gwCurrentScenario === 'solicitation' && step.id.startsWith('sol_')) ? 'RFO document'
      : GW_VIEW_META[v].label;
    const icon = (v === 'clm' && step.id === 'legal_review') ? '⚖' : GW_VIEW_META[v].icon;
    const featured = (step.id === 'legal_review' || step.id === 'ai_scorecard') && v === 'document';
    return `
    <button type="button" class="gw-visual-tab ${v === gwActiveVisualView ? 'active' : ''} ${featured ? 'gw-visual-tab--featured' : ''}"
      data-view="${v}" onclick="gwSetVisualView('${v}')">
      <span>${icon}</span> ${label}${featured ? ' <span class="gw-visual-tab-hint">●</span>' : ''}
    </button>`;
  }).join('');

  document.getElementById('gw-visual-viewing').textContent =
    `Viewing as ${persona.name || step.persona} · ${persona.title || ''}`;

  gwRenderVisualCanvas(step, persona);
}

function gwRenderVisualCanvas(step, persona) {
  const canvas = document.getElementById('gw-visual-canvas');
  const doc = gwGetScenario().document;
  const ctx = GW_DATA.context || {};
  const view = gwActiveVisualView;

  canvas.className = 'gw-visual-canvas gw-visual-canvas--' + view;

  if (view === 'dashboard') canvas.innerHTML = gwVisualDashboard(step, persona, doc, ctx);
  else if (view === 'email') canvas.innerHTML = gwVisualEmail(step, persona, doc, ctx);
  else if (view === 'tasks') canvas.innerHTML = gwVisualTasks(step, persona, doc);
  else if (view === 'clm') canvas.innerHTML = gwVisualClmShell(step, persona);
  else if (view === 'document') canvas.innerHTML = gwVisualDocument(step, doc, ctx);
  else if (view === 'sign') canvas.innerHTML = gwVisualSigning(step, persona, doc);
  else if (view === 'navigator') canvas.innerHTML = gwVisualNavigator(doc);

  if (view === 'clm') {
    const root = canvas.querySelector('.clm-mock--embedded');
    if (root && typeof gwRenderClmMock === 'function') gwRenderClmMock(step, persona, root);
  }
  if (typeof gwInitWordShell === 'function') gwInitWordShell(canvas);
  if (view === 'sign' && step.id === 'signature') gwMaybeAnimateSignature();
}

function gwVisualDashboard(step, persona, doc, ctx) {
  const erp = (ctx.erp || 'ERP').split('(')[0].trim();
  const reqId = 'REQ-2026-' + (4200 + (step.order || 1));
  return `
    <div class="iam-app iam-app--dashboard">
      <aside class="iam-sidebar">
        <div class="iam-sidebar-brand">DocuSign IAM</div>
        <nav class="iam-nav">
          <div class="iam-nav-item active">▦ Dashboard</div>
          <div class="iam-nav-item">📥 Agreement Desk <span class="iam-nav-badge">3</span></div>
          <div class="iam-nav-item">📄 Documents</div>
          <div class="iam-nav-item">📊 Reports &amp; Insights</div>
          <div class="iam-nav-item">🗂 Agreement Manager</div>
        </nav>
      </aside>
      <main class="iam-main">
        <header class="iam-main-header">
          <h3>Good morning, ${persona.name || 'Maria Santos'}</h3>
          <span class="iam-notif-bell">🔔 <span class="iam-notif-count">4</span></span>
        </header>
        <div class="iam-kpi-row">
          <div class="iam-kpi"><span class="iam-kpi-val">12</span><span class="iam-kpi-label">Open requests</span></div>
          <div class="iam-kpi iam-kpi--warn"><span class="iam-kpi-val">5</span><span class="iam-kpi-label">Due this week</span></div>
          <div class="iam-kpi"><span class="iam-kpi-val">2</span><span class="iam-kpi-label">Awaiting signature</span></div>
          <div class="iam-kpi iam-kpi--alert"><span class="iam-kpi-val">3</span><span class="iam-kpi-label">Renewals (90d)</span></div>
        </div>
        <div class="iam-dash-grid">
          <div class="iam-dash-card iam-dash-card--highlight">
            <div class="iam-dash-card-head">Your active contract</div>
            <div class="iam-dash-contract">
              <strong>${reqId}</strong> · ${doc.type.split('(')[0].trim()}
              <div class="iam-dash-contract-meta">${doc.vendor} · ${doc.value}</div>
              <div class="iam-dash-step-pill">Current step: ${step.title}</div>
            </div>
          </div>
          <div class="iam-dash-card">
            <div class="iam-dash-card-head">Recent activity</div>
            <div class="iam-activity-row"><span>ERP pre-fill from ${erp}</span><span>2m ago</span></div>
            <div class="iam-activity-row"><span>Iris review completed</span><span>1h ago</span></div>
            <div class="iam-activity-row"><span>Legal routed to ${persona.name}</span><span>Now</span></div>
          </div>
        </div>
      </main>
    </div>`;
}

function gwFormatReqId(step) {
  const flag = (GW_DATA.context?.flag || 'CA').toUpperCase();
  return `REQ-${flag}-2026-${String(4200 + (step.order || 1))}`;
}

function gwAgencyLabel(doc) {
  return (doc.agency || 'California Department of Technology').split('(')[0].trim();
}

function gwDocType(doc) {
  return (doc.type || 'Master Services Agreement + Statement of Work').split('(')[0].trim();
}

function gwVendorLabel(doc) {
  return (doc.vendor || 'Acme Cloud Solutions, Inc.').split(',')[0].trim();
}

function gwSolRef(doc) {
  return doc.solicitation || 'RFO-CDT-2026-0142';
}

function gwPersonaFirstName(persona) {
  return (persona.name || 'Maria Santos').split(' ')[0];
}

function gwPersonaEmailAddr(persona) {
  const name = persona.name || 'Maria Santos';
  const parts = name.toLowerCase().split(/\s+/);
  const local = parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];
  const dept = (persona.dept || '').toLowerCase();
  let domain = 'state.ca.gov';
  if (dept.includes('dgs') || dept.includes('general services')) domain = 'dgs.ca.gov';
  else if (dept.includes('technology') || dept.includes('cdt')) domain = 'cdt.ca.gov';
  else if (dept.includes('justice') || dept.includes('legal') || dept.includes('attorney')) domain = 'doj.ca.gov';
  else if (dept.includes('acme') || dept.includes('vendor')) domain = 'acmecloud.com';
  return `${local}@${domain}`;
}

function gwBuildEmailContent(step, persona, doc, ctx) {
  const reqId = gwFormatReqId(step);
  const agency = gwAgencyLabel(doc);
  const vendor = gwVendorLabel(doc);
  const docType = gwDocType(doc);
  const sol = gwSolRef(doc);
  const erp = (ctx.erp || 'FI$Cal').split('(')[0].trim();
  const proc = (ctx.procurement || 'Department of General Services (DGS)').split('(')[0].trim();
  const state = ctx.state || 'California';
  const firstName = gwPersonaFirstName(persona);
  const value = doc.value || '$2,400,000';
  const term = doc.term || '3 years + two 1-year options';
  const template = (doc.template || 'DGS STD 213 — IT Goods & Services MSA').split('—')[0].trim();
  const isSol = typeof gwCurrentScenario !== 'undefined' && gwCurrentScenario === 'solicitation';
  const narrative = typeof GW_PLAIN !== 'undefined' ? GW_PLAIN[step.id] : '';
  const valueCallout = typeof GW_VALUE !== 'undefined' ? GW_VALUE[step.id] : null;
  const stepDesc = step.description || narrative || step.title;
  const scenarioLine = valueCallout
    ? `<br><em>${valueCallout.headline}:</em> ${valueCallout.text}`
    : '';

  const configs = {
    initiate: {
      headline: 'Request submitted',
      subject: `${reqId}: ${docType} logged in Agreement Desk`,
      greeting: `${firstName},`,
      lead: `Your contract request for <strong>${vendor}</strong> has been submitted to Agreement Desk for ${agency}.`,
      detail: `<strong>Reference:</strong> ${reqId}<br><strong>Contract value:</strong> ${value} · ${term}<br><strong>Template:</strong> ${template}<br><strong>ERP source:</strong> ${erp} budget line 3100-IT-042`,
      cta: 'View request status',
      ctaView: 'dashboard',
      foot: `DocuSign IAM → Agreement Desk → My requests → ${reqId}`,
    },
    intake: {
      headline: 'Review workflow',
      subject: `Vendor paper received · ${vendor} · ${reqId}`,
      greeting: `${firstName},`,
      lead: 'You have a workflow to review and complete:',
      detail: `<strong>${docType}</strong> from ${vendor} (${value}) arrived through the ${agency} vendor portal. CLM classified the document as vendor paper and placed it in the ${proc} intake queue for triage.`,
      cta: 'Review intake queue',
      ctaView: 'tasks',
      foot: 'Do not forward this email — open the task in Agreement Desk to access the controlled document.',
    },
    contracts_review: {
      headline: 'Review workflow',
      subject: `Action required: Contracts review · ${reqId}`,
      greeting: `${firstName},`,
      lead: 'You have a workflow to review and complete:',
      detail: `<strong>${docType}</strong> · ${vendor} · ${value}<br>${agency} draft generated from ${template}. Confirm playbook compliance and advance to Legal per ${state} Standard Terms.`,
      cta: 'Review contract draft',
      ctaView: 'clm',
      foot: `${proc} · Agreement Desk task due in 2 business days · ${reqId}`,
    },
    contracts_triage: {
      headline: 'Review workflow',
      subject: `Triage required: vendor paper · ${reqId}`,
      greeting: `${firstName},`,
      lead: 'You have a workflow to review and complete:',
      detail: `Incoming vendor agreement from <strong>${vendor}</strong> (${value}) requires triage against ${template}. Determine whether Legal review is required before routing to ${agency} program staff.`,
      cta: 'Open triage queue',
      ctaView: 'tasks',
      foot: `${proc} · Vendor ID SRM-0048217 · ${reqId}`,
    },
    negotiation_return: {
      headline: 'Review workflow',
      subject: `Vendor counter-redlines returned · ${reqId}`,
      greeting: `${firstName},`,
      lead: 'You have a workflow to review and complete:',
      detail: `${vendor} submitted counter-redlines on <strong>Article 6 — Limitation of Liability</strong> for ${docType} (${value}). Review in CLM Workspace and assign the next approver per ${state} delegated counsel guidance.`,
      cta: 'Review vendor response',
      ctaView: 'document',
      foot: `Workspace link expires in 14 days · ${agency} · ${reqId}`,
    },
    sol_register: {
      headline: 'Registration update',
      subject: `${sol}: vendor registration activity · ${proc}`,
      greeting: `${firstName},`,
      lead: `Updates are available for solicitation <strong>${sol}</strong> — Cloud Infrastructure Modernization (${state}).`,
      detail: `3 new vendor registrations received via DocuSign Web Forms. Addendum No. 1 (prevailing wage attestation) was distributed to all 12 registered offerors. Q&amp;A deadline: March 28, 2026.`,
      cta: 'Open vendor portal',
      ctaView: 'clm',
      foot: `${proc} · Cal eProcure posting · FOIA-ready audit trail enabled`,
    },
    sol_intake: {
      headline: 'Review workflow',
      subject: `${sol}: proposals received · evaluation queue open`,
      greeting: `${firstName},`,
      lead: 'You have a workflow to review and complete:',
      detail: `Three responsive proposals for <strong>${sol}</strong> were submitted before the deadline and are queued in Agreement Desk for evaluation. Contract ceiling: ${value}. Mandatory ${template} terms attached to each submission.`,
      cta: 'Open evaluation queue',
      ctaView: 'tasks',
      foot: `${agency} · Evaluation committee briefing scheduled · ${sol}`,
    },
  };

  const cfg = configs[step.id];
  if (cfg) return { ...cfg, detail: cfg.detail + scenarioLine };

  const fallbackHeadline = step.id === 'signature' ? 'Review and sign' : 'Review workflow';
  return {
    headline: fallbackHeadline,
    subject: `${step.title} · ${isSol ? sol : reqId}`,
    greeting: `${firstName},`,
    lead: step.id === 'signature'
      ? `Please review and complete signing for <strong>${docType}</strong>.`
      : 'You have a workflow to review and complete:',
    detail: stepDesc + (isSol
      ? `<br><strong>Solicitation:</strong> ${sol} · ${agency}`
      : `<br><strong>${vendor}</strong> · ${value} · ${reqId}`) + scenarioLine,
    cta: step.id === 'signature' ? 'Review and sign' : 'Open in Agreement Desk',
    ctaView: step.id === 'signature' ? 'sign' : 'tasks',
    foot: `DocuSign IAM · ${agency} · ${isSol ? sol : reqId}`,
  };
}

function gwVisualEmail(step, persona, doc, ctx) {
  const mail = gwBuildEmailContent(step, persona, doc, ctx);
  const recipient = gwPersonaEmailAddr(persona);
  const ctaView = mail.ctaView || 'tasks';

  return `
    <div class="ds-notify-email">
      <p class="ds-notify-demo">This email is for demonstration purposes only.</p>
      <div class="ds-notify-envelope">
        <div class="ds-notify-envelope-row"><span>To</span><strong>${recipient}</strong></div>
        <div class="ds-notify-envelope-row"><span>Subject</span><strong>${mail.subject}</strong></div>
        <div class="ds-notify-envelope-row"><span>From</span><strong>DocuSign Agreement Desk &lt;notifications@docusign.com&gt;</strong></div>
      </div>
      <div class="ds-notify-card">
        <div class="ds-notify-logo" aria-hidden="true">
          <svg viewBox="0 0 120 28" width="120" height="28" role="img"><text x="0" y="22" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#130032">DocuSign</text></svg>
        </div>
        <h1 class="ds-notify-headline">${mail.headline}</h1>
        <p class="ds-notify-greeting">${mail.greeting}</p>
        <p class="ds-notify-lead">${mail.lead}</p>
        <div class="ds-notify-detail">${mail.detail}</div>
        <button type="button" class="ds-notify-cta" onclick="gwSetVisualView('${ctaView}')">${mail.cta}</button>
        <p class="ds-notify-thanks">Thanks!</p>
        <p class="ds-notify-foot">${mail.foot}</p>
        <p class="ds-notify-legal">DocuSign, Inc. · 221 Main St, Suite 1550, San Francisco, CA 94105<br>
          This message was sent by DocuSign Intelligent Agreement Management on behalf of ${gwAgencyLabel(doc)}.</p>
      </div>
    </div>`;
}

function gwVisualTasks(step, persona, doc) {
  const tasks = typeof gwGetTasksData === 'function'
    ? gwGetTasksData(step, persona, doc, 'REQ-2026-' + (4200 + (step.order || 1)))
    : [];
  const outstanding = tasks.filter(t => !t.notif && !t.done);

  return `
    <div class="iam-app iam-app--tasks">
      <aside class="iam-sidebar iam-sidebar--compact">
        <div class="iam-sidebar-brand">Agreement Desk</div>
        <nav class="iam-nav">
          <div class="iam-nav-item active">My queue <span class="iam-nav-badge">${outstanding.length}</span></div>
          <div class="iam-nav-item">Team</div>
          <div class="iam-nav-item">Completed</div>
        </nav>
      </aside>
      <main class="iam-main">
        <header class="iam-main-header"><h3>My tasks</h3></header>
        <table class="iam-task-table">
          <thead><tr><th></th><th>Task</th><th>Contract</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            ${outstanding.map((t, i) => `
              <tr class="${t.active ? 'active' : ''}">
                <td><span class="gw-task-check ${t.active ? 'checked' : ''}"></span></td>
                <td><strong>${t.title}</strong><br><small>${t.assignee}</small></td>
                <td>${doc.vendor}<br><small>${doc.value}</small></td>
                <td><span class="gw-task-due gw-task-due--${t.dueClass || 'default'}">${t.due}</span></td>
                <td><span class="clm-pill ${t.active ? 'clm-pill--new' : ''}">${t.active ? 'Active' : 'Open'}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </main>
    </div>`;
}

function gwVisualClmShell(step, persona) {
  return document.getElementById('gw-clm-template').innerHTML;
}

function gwVisualDocument(step, doc, ctx) {
  const isSolPreAward = gwCurrentScenario === 'solicitation' && gwDocPhase(step.id) < 6;
  const versions = {
    initiate: 'Intake form', generate: 'Draft v0.1', post_execution: 'Executed v1.0',
    negotiation: 'Draft v0.6 — redlined', signature: 'Final v1.0',
    legal_review: gwCurrentScenario === 'solicitation' ? 'RFO + evaluation record' : 'Draft v0.4 — Legal Review',
    sol_publish: 'RFO — published', sol_register: 'RFO + Addendum No. 1',
    sol_intake: 'Proposal packages (3)', sol_evaluation: 'Evaluation record',
    sol_award: 'Intent to award',
  };
  const inner = typeof gwBuildContractHtml === 'function'
    ? gwBuildContractHtml(doc, step, ctx) : '<p>Document preview</p>';
  const useWord = typeof gwWordUsesShell === 'function' && gwWordUsesShell(step);
  const wordMode = typeof gwWordToolMode !== 'undefined' ? gwWordToolMode : (typeof gwWordDefaultMode === 'function' ? gwWordDefaultMode(step) : 'reviewing');
  const docBody = useWord && typeof gwWrapWordShell === 'function'
    ? gwWrapWordShell(doc, step, ctx, inner, {
        mode: wordMode,
        version: versions[step.id] || versions.legal_review || 'Draft',
        pageHint: step.id === 'ai_scorecard' ? 'Iris playbook review · flagged clauses'
          : step.id === 'negotiation' ? 'Track changes · Article 6 liability'
          : 'Full agreement · legal comments on Articles 5–9',
      })
    : inner;

  const wordSplit = useWord && (wordMode === 'playbook' || wordMode === 'iris');

  if (useWord) {
    return `
    <div class="gw-doc-panel gw-doc-panel--hero gw-doc-panel--word ${wordSplit ? 'gw-doc-panel--word-split' : ''}">
      <div class="gw-doc-viewport gw-doc-viewport--hero gw-doc-viewport--word">${docBody}</div>
    </div>`;
  }

  return `
    <div class="gw-doc-panel gw-doc-panel--hero ${isSolPreAward ? 'gw-doc-panel--solicitation' : ''} ${step.id === 'signature' || step.id === 'post_execution' ? 'gw-doc-panel--sign' : ''}">
      <div class="gw-doc-chrome">
        <div class="gw-doc-chrome-left">
          <span class="gw-doc-label">${isSolPreAward ? 'RFO document' : 'Contract document'}</span>
          <span class="gw-doc-version">${versions[step.id] || (isSolPreAward ? 'RFO' : 'Draft')}</span>
        </div>
        <div class="gw-doc-chrome-right">
          <span class="gw-doc-status gw-doc-status--${step.id}">${step.title}</span>
        </div>
      </div>
      <div class="gw-doc-viewport gw-doc-viewport--hero">
        <div class="gw-doc-page">${docBody}</div>
      </div>
    </div>`;
}

function gwVisualSigning(step, persona, doc) {
  const auth = GW_DATA.is_authenticated;
  return `
    <div class="gw-sign-stage">
      <div class="gw-sign-split">
        <div class="gw-sign-doc-preview">
          <div class="gw-doc-paper gw-doc-paper--sign ${step.id === 'post_execution' ? 'gw-doc-paper--executed' : ''}">
            ${step.id === 'post_execution' ? '<div class="gw-doc-stamp">Fully Executed</div>' : ''}
            <h4>${doc.type.split('(')[0].trim()}</h4>
            <p><strong>${doc.agency.split('(')[0].trim()}</strong> ↔ <strong>${doc.vendor}</strong></p>
            <p class="gw-doc-p">Contract value: ${doc.value}</p>
            <div class="gw-sign-field" id="gw-sign-field">
              <div class="gw-sign-tab">Sign</div>
              <div class="gw-sign-line" id="gw-sign-line">
                <span class="gw-sign-animation" id="gw-sign-animation" style="display:none">/s/ ${persona.name || GW_DATA.demo_signer_name}</span>
              </div>
              <span>Authorized signer</span>
            </div>
          </div>
        </div>
        <div class="gw-sign-panel">
          <div class="clm-mock-chrome" style="border-radius:8px 8px 0 0">
            <span class="clm-mock-logo">DocuSign</span>
            <span class="clm-mock-product">eSignature</span>
          </div>
          <div class="gw-sign-panel-body">
            <p><strong>Envelope ready</strong></p>
            <p class="gw-sign-panel-sub">${doc.vendor} · ${doc.value}</p>
            <button type="button" class="clm-btn-primary" onclick="gwPlaySignAnimation()">▶ Preview signature</button>
            ${auth ? `<button type="button" class="clm-btn-sm" style="width:100%;margin-top:8px" onclick="gwLaunchLiveSigning()">Open live embedded signing</button>` : `<p class="gw-sign-auth-hint">Login to DocuSign to launch a real embedded envelope.</p>`}
            <div id="gw-signing-frame-wrap" style="display:none;margin-top:12px">
              <iframe id="gw-signing-frame" class="signing-frame-compact" title="DocuSign signing"></iframe>
            </div>
            <div id="gw-signing-status" class="gw-signing-status"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function gwVisualNavigator(doc) {
  return `
    <div class="gw-nav-embed-wrap">
      <div class="gw-nav-embed-chrome">
        <span class="clm-mock-logo">DocuSign</span>
        <span>Agreement Manager</span>
        <span class="gw-nav-embed-meta">${doc.vendor} · Executed repository</span>
      </div>
      <iframe class="gw-nav-embed-frame" src="/navigator?embed=1" title="Agreement Manager"></iframe>
    </div>`;
}

function gwMaybeAnimateSignature() {
  if (stepIsSignature() && !gwSigningLaunched) {
    setTimeout(gwPlaySignAnimation, 800);
  }
}

function stepIsSignature() {
  const step = gwGetScenario().steps[gwCurrentStep];
  return step && step.id === 'signature';
}

function gwPlaySignAnimation() {
  const anim = document.getElementById('gw-sign-animation');
  const field = document.getElementById('gw-sign-field');
  if (!anim) return;
  anim.style.display = 'inline';
  field?.classList.add('gw-sign-field--signed');
  anim.style.animation = 'gwSignWrite 1.2s ease forwards';
}

async function gwLaunchLiveSigning() {
  const doc = gwGetScenario().document;
  const wrap = document.getElementById('gw-signing-frame-wrap');
  const frame = document.getElementById('gw-signing-frame');
  const status = document.getElementById('gw-signing-status');
  if (!wrap || !frame) return;

  status.textContent = 'Creating envelope…';
  wrap.style.display = 'block';
  gwSigningLaunched = true;

  try {
    const res = await fetch('/generate-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doc_type: 'MSA',
        signer_name: GW_DATA.demo_signer_name || 'Agency Signer',
        signer_email: GW_DATA.demo_signer_email || 'demo@agency.ca.gov',
        subject: `${doc.type.split('(')[0].trim()} — ${doc.vendor}`,
        embedded: true,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Could not create envelope');

    if (data.signingUrl) {
      frame.src = data.signingUrl;
      status.textContent = 'Sign in the frame below — completes the live demo path.';
    } else {
      status.textContent = 'Envelope created: ' + data.envelopeId + (data.viewError ? ' (view: ' + data.viewError + ')' : '');
    }
  } catch (e) {
    status.textContent = e.message;
  }
}

window.addEventListener('message', (ev) => {
  if (!ev.data || ev.data.type !== 'ds-signing-complete') return;
  const status = document.getElementById('gw-signing-status');
  if (status) status.textContent = '✓ Signing complete — envelope ' + (ev.data.envelopeId || '').slice(0, 8) + '…';
  gwPlaySignAnimation();
  if (typeof showToast === 'function') showToast('Contract signed via DocuSign eSignature', 'success');
});
