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
  legal_review: 'clm', external_review: 'clm', negotiation: 'document',
  negotiation_out: 'document', negotiation_return: 'email',
  contracts_final: 'tasks', contracts_approval: 'tasks',
  executive_approval: 'clm', signature: 'sign', post_execution: 'navigator',
  sol_publish: 'clm', sol_register: 'clm', sol_intake: 'clm',
  sol_evaluation: 'clm', sol_award: 'clm',
};

function gwSetVisualView(view) {
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
      : (v === 'document' && step.id === 'legal_review') ? 'Word document'
      : (v === 'document' && gwCurrentScenario === 'solicitation' && step.id.startsWith('sol_')) ? 'RFO document'
      : GW_VIEW_META[v].label;
    const icon = (v === 'clm' && step.id === 'legal_review') ? '⚖' : GW_VIEW_META[v].icon;
    return `
    <button type="button" class="gw-visual-tab ${v === gwActiveVisualView ? 'active' : ''}"
      data-view="${v}" onclick="gwSetVisualView('${v}')">
      <span>${icon}</span> ${label}
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
          <h3>Good morning, ${persona.name || 'User'}</h3>
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

function gwVisualEmail(step, persona, doc, ctx) {
  const reqId = 'REQ-2026-' + (4200 + (step.order || 1));
  const subjects = {
    initiate: `New contract request submitted — ${reqId}`,
    intake: `Vendor paper received — ${doc.vendor}`,
    contracts_review: `Action required: Contracts review — ${reqId}`,
    legal_review: gwCurrentScenario === 'solicitation'
      ? `Award review assigned — ${doc.solicitation || reqId} · protest window`
      : `Legal review assigned — ${reqId} · ${(ctx.state || 'State')} playbook`,
    negotiation: `Negotiation round — counter-redlines on Article 6`,
    signature: `Please sign: ${doc.type.split('(')[0].trim()}`,
    post_execution: `Contract executed — ${doc.vendor}`,
    sol_publish: `RFO published — ${doc.solicitation || reqId}`,
    sol_register: `Vendor registration update — ${doc.solicitation || reqId}`,
    sol_intake: `Proposals received — ${doc.solicitation || reqId}`,
    sol_evaluation: `Evaluation scoring complete — ${doc.solicitation || reqId}`,
    sol_award: `Intent-to-award ready — ${doc.vendor.split(',')[0].trim()}`,
  };
  const subject = subjects[step.id] || `Task assigned: ${step.title} — ${reqId}`;
  const bodies = {
    signature: `You have been requested to sign <strong>${doc.type.split('(')[0].trim()}</strong> between ${doc.agency.split('(')[0].trim()} and ${doc.vendor}. Contract value: ${doc.value}.`,
    negotiation: `The vendor has submitted counter-redlines on <strong>Article 6 Liability</strong>. Please review in CLM Workspace or open the task below.`,
    default: `A contract workflow requires your attention. <strong>${doc.vendor}</strong> · ${doc.value} · ${doc.agency.split('(')[0].trim()}.`,
  };
  const body = bodies[step.id] || bodies.default;

  return `
    <div class="mock-email-wrap">
      <div class="mock-email-client">
        <div class="mock-email-toolbar">
          <span>📧 Outlook</span>
          <span class="mock-email-user">${persona.name || 'User'}@agency.ca.gov</span>
        </div>
        <div class="mock-email-message">
          <div class="mock-email-from">
            <div class="mock-email-avatar">DS</div>
            <div>
              <strong>DocuSign Agreement Desk</strong>
              <span>notifications@docusign.com</span>
            </div>
            <span class="mock-email-time">Just now</span>
          </div>
          <h4 class="mock-email-subject">${subject}</h4>
          <div class="mock-email-body">
            <p>Hi ${persona.name || 'there'},</p>
            <p>${body}</p>
            <button type="button" class="mock-email-cta" onclick="gwSetVisualView('tasks')">Open task in Agreement Desk →</button>
            <p class="mock-email-foot">Or sign in to DocuSign IAM → Agreement Desk → My queue.</p>
          </div>
        </div>
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

  return `
    <div class="gw-doc-panel gw-doc-panel--hero ${useWord ? 'gw-doc-panel--word' : ''} ${wordSplit ? 'gw-doc-panel--word-split' : ''} ${isSolPreAward ? 'gw-doc-panel--solicitation' : ''} ${step.id === 'signature' || step.id === 'post_execution' ? 'gw-doc-panel--sign' : ''}">
      <div class="gw-doc-chrome">
        <div class="gw-doc-chrome-left">
          <span class="gw-doc-label">${isSolPreAward ? 'RFO document' : useWord ? 'Microsoft Word · Review tab' : 'Contract document'}</span>
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
