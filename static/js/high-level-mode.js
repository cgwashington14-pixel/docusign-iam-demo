/* High-level View — one moment at a time, guided focus for short attention spans */

const HL_STORAGE_KEY = 'ds-high-level';
const HL_SAVED_KEY = 'ds-high-level-saved-modes';

const HL_MOMENT_META = {
  task:         { verb: 'Task',   short: 'Task',   label: 'Action assigned',        say: 'Someone on your team needs to act on this step.' },
  edit:         { verb: 'Edit',   short: 'Edit',   label: 'Review this change',     say: 'A clause or field was changed — review before approving.' },
  word:         { verb: 'Word',   short: 'Word',   label: 'Open in Microsoft Word', say: 'Legal or contracts opens the document in Word with Iris flags.' },
  notification: { verb: 'Notify', short: 'Alert',  label: 'DocuSign notification',  say: 'DocuSign alerts the next person — email, task, or mobile push.' },
  sign:         { verb: 'Sign',   short: 'Sign',   label: 'Sign here',              say: 'Authorized signer completes eSignature — legally binding, auditable.' },
  api:          { verb: 'API',    short: 'API',    label: 'System delivers data',  say: 'API or Connect syncs data to FI$Cal, ERP, or your case system.' },
};

const HL_STEP_MOMENTS = {
  initiate:           [{ type: 'task', label: 'Start contract request', say: 'Program manager creates a request — FI$Cal data pre-fills the form.' }, { type: 'api', label: 'ERP pre-fill', say: 'API pulls vendor and budget from your system of record.' }],
  generate:           [{ type: 'edit', label: 'Assemble clauses', say: 'Mandatory state clauses merge into the draft automatically.' }],
  intake:             [{ type: 'task', label: 'Vendor paper arrives', say: 'Third-party document enters the intake queue.' }, { type: 'notification', label: 'Contracts notified', say: 'DocuSign routes the intake to the contracts team.' }],
  ai_scorecard:       [{ type: 'edit', label: 'AI flags deviations', say: 'Iris compares vendor paper to your Standard Terms library.' }, { type: 'notification', label: 'Scorecard ready', say: 'Contracts receives the AI scorecard for triage.' }],
  contracts_review:   [{ type: 'task', label: 'Contracts review', say: 'Analyst validates budget, RFO compliance, and clause checklist.' }],
  contracts_triage:   [{ type: 'task', label: 'Triage vendor paper', say: 'Contracts assigns priority based on the AI scorecard.' }],
  contracts_final:    [{ type: 'task', label: 'Final approval', say: 'Contracts locks the approved version before signature.' }],
  contracts_approval: [{ type: 'task', label: 'Approve for signature', say: 'Final sign-off before the envelope is sent.' }],
  legal_review:       [{ type: 'word', label: 'Review in Word', say: 'Counsel redlines in Microsoft Word — Iris flags sit beside each clause.' }, { type: 'edit', label: 'Playbook compare', say: 'Draft is compared to pre-approved state standard terms.' }],
  external_review:    [{ type: 'task', label: 'Vendor invited', say: 'Vendor opens a shared workspace to review terms.' }, { type: 'notification', label: 'Workspace invite sent', say: 'DocuSign notifies the vendor with a secure link.' }],
  negotiation:        [{ type: 'edit', label: 'Merge redlines', say: 'Contracts compares vendor changes against agency baseline.' }, { type: 'word', label: 'Track in Word', say: 'Redlines stay in Word and CLM — one version of truth.' }],
  negotiation_out:    [{ type: 'notification', label: 'Redlines sent', say: 'Agency redlines delivered to vendor via CLM.' }, { type: 'edit', label: 'Awaiting response', say: 'Track vendor counter-proposal deadline.' }],
  negotiation_return: [{ type: 'edit', label: 'Counter-proposal', say: 'Vendor returns edits — legal reviews mandatory changes.' }],
  executive_approval: [{ type: 'task', label: 'Director approval', say: 'High-value deal routed to executive with one-page summary.' }, { type: 'notification', label: 'Approval request', say: 'DocuSign notifies the director to approve or ask questions.' }],
  signature:          [{ type: 'sign', label: 'Sign the agreement', say: 'Agency signer and vendor counter-sign on the same envelope.' }, { type: 'notification', label: 'Signature request', say: 'DocuSign emails or texts signers with a secure link.' }],
  post_execution:     [{ type: 'api', label: 'Sync to FI$Cal', say: 'Connect webhook pushes executed metadata to ERP.' }, { type: 'notification', label: 'Execution confirmed', say: 'Finance and contracts receive completion notification.' }],
  erp_sync:           [{ type: 'api', label: 'ERP update', say: 'Encumbrance and vendor status update in FI$Cal.' }],
  execute:            [{ type: 'sign', label: 'Execute contract', say: 'Final signature on the awarded agreement.' }],
  sol_register:       [{ type: 'task', label: 'Vendor registers', say: 'Vendor completes Web Form — data pre-filled from CRM.' }, { type: 'notification', label: 'Registration received', say: 'DocuSign confirms submission to procurement.' }],
  sol_publish:        [{ type: 'notification', label: 'RFO published', say: 'Solicitation goes live on Cal eProcure.' }, { type: 'api', label: 'Portal sync', say: 'API publishes RFO metadata to the state portal.' }],
  sol_intake:         [{ type: 'task', label: 'Proposal intake', say: 'Vendor proposals enter the evaluation queue.' }],
  sol_evaluation:     [{ type: 'task', label: 'Evaluation panel', say: 'Scoring committee reviews packages in CLM.' }, { type: 'edit', label: 'Ranking memo', say: 'Contracts generates evaluation summary.' }],
  sol_award:          [{ type: 'notification', label: 'Intent to award', say: 'Winning vendor notified — protest window starts.' }, { type: 'sign', label: 'Award execution', say: 'Contract sent for signature after protest period.' }],
};

const HL_PAGE_MOMENTS = {
  '/':                  [{ type: 'task', label: 'Choose your demo path', say: 'Start the guided walkthrough — one moment at a time.' }],
  '/gov-workflows':     [{ type: 'task', label: 'Press Play', say: 'Auto-advance through the contract lifecycle.' }],
  '/agreement-desk':    [{ type: 'task', label: 'Request queue', say: 'Track intake, audit trail, and approvals in Agreement Desk.' }, { type: 'notification', label: 'Status updates', say: 'Every action logs a notification in the activity feed.' }],
  '/envelopes/send':    [{ type: 'sign', label: 'Send for signature', say: 'Create and send an envelope from a template.' }, { type: 'api', label: 'API send', say: 'Same action available via POST /envelopes.' }],
  '/embedded':          [{ type: 'sign', label: 'Embedded signing', say: 'Citizen signs inside your portal — no redirect.' }],
  '/navigator':         [{ type: 'edit', label: 'Portfolio insights', say: 'Search obligations, renewals, and risk across agreements.' }],
  '/workspaces':        [{ type: 'task', label: 'Collaboration hub', say: 'Agency and vendor work in one shared workspace.' }],
  '/webforms':          [{ type: 'api', label: 'Pre-filled intake', say: 'API creates a form instance with CRM data.' }, { type: 'notification', label: 'Submission alert', say: 'DocuSign notifies staff when the form is completed.' }],
  '/webhooks':        [{ type: 'api', label: 'Connect listener', say: 'DocuSign POSTs JSON to your URL when envelope status changes — no polling.' }, { type: 'notification', label: 'ERP sync', say: 'On envelope-completed, middleware updates FI$Cal and your contract register.' }],
  '/maestro':           [{ type: 'api', label: 'Workflow trigger', say: 'API starts Maestro with ERP pre-fill in trigger_inputs.' }],
};

function hlModeActive() {
  return document.body.classList.contains('high-level-mode');
}

function hlGetMomentsForStep(step) {
  if (!step) return [HL_STEP_MOMENTS.initiate[0]];
  const mapped = HL_STEP_MOMENTS[step.id];
  if (mapped) return mapped;
  if (step.ai_review) return HL_STEP_MOMENTS.ai_scorecard;
  if (step.product === 'IAM') return [{ type: 'sign', ...HL_MOMENT_META.sign, label: 'eSignature step', say: step.description }];
  return [{ type: 'task', label: step.title, say: step.description || 'Follow this step in the walkthrough.' }];
}

function hlMomentCardHtml(m, i) {
  const meta = HL_MOMENT_META[m.type] || HL_MOMENT_META.task;
  const label = m.label || meta.label;
  const say = m.say || meta.say;
  return `
    <article class="hl-moment-card hl-moment-card--${m.type}" aria-label="${meta.verb}: ${label}">
      <div class="hl-moment-icon" aria-hidden="true">${meta.short}</div>
      <div class="hl-moment-body">
        <div class="hl-moment-verb">${meta.verb}</div>
        <div class="hl-moment-label">${label}</div>
        <p class="hl-moment-say">${say}</p>
      </div>
    </article>`;
}

function hlRemoveDemoChrome() {
  document.querySelectorAll('.hl-spotlight-wrap, .hl-demo-strip').forEach(el => el.remove());
}

function hlUpdateDemoStrip(moments, anchorEl) {
  if (!hlModeActive()) return;
  hlRemoveDemoChrome();
  if (!moments?.length) return;

  const primary = moments[0];
  const meta = HL_MOMENT_META[primary.type] || HL_MOMENT_META.task;
  const strip = document.createElement('div');
  strip.className = 'hl-demo-strip';
  strip.setAttribute('role', 'status');
  strip.setAttribute('aria-live', 'polite');
  strip.innerHTML = `
    <span class="hl-demo-strip-tag hl-demo-strip-tag--${primary.type}">${meta.verb}</span>
    <span class="hl-demo-strip-text"><strong>${primary.label || meta.label}</strong> — ${primary.say || meta.say}</span>`;

  if (anchorEl) {
    anchorEl.after(strip);
    return;
  }

  const hero = document.getElementById('gw-visual-hero');
  const toolbar = hero?.querySelector('.gw-visual-toolbar');
  if (toolbar) {
    toolbar.after(strip);
    return;
  }

  const productToolbar = document.querySelector('.ds-product-toolbar');
  if (productToolbar) {
    productToolbar.after(strip);
  }
}

function hlUpdateFocusRail(step, stepIndex, total) {
  const rail = document.getElementById('hl-focus-rail');
  if (!rail || !hlModeActive()) return;

  const stepEl = document.getElementById('hl-rail-step');
  const titleEl = document.getElementById('hl-rail-title');
  const stackEl = document.getElementById('hl-moment-stack');
  const valueEl = document.getElementById('hl-rail-value');

  if (stepEl) stepEl.textContent = step ? `Step ${stepIndex + 1} of ${total}` : 'DocuSign IAM';
  if (titleEl) titleEl.textContent = step?.title || 'Intelligent Agreement Management';

  const toolbarTitle = document.getElementById('hl-rail-toolbar-title');
  if (toolbarTitle) {
    toolbarTitle.textContent = step?.title || 'High-level guide';
  }

  const moments = step ? hlGetMomentsForStep(step) : [];
  if (stackEl) {
    stackEl.innerHTML = moments.length
      ? moments.map(hlMomentCardHtml).join('')
      : `<article class="hl-moment-card hl-moment-card--task"><div class="hl-moment-icon" aria-hidden="true">Go</div><div class="hl-moment-body"><div class="hl-moment-label">Start the walkthrough</div><p class="hl-moment-say">Open Gov Workflows and press Play — moments appear here, not on the demo.</p></div></article>`;
  }

  if (valueEl && step) {
    let proofText = '';
    if (typeof gwBizStepProof === 'function') {
      const p = gwBizStepProof(step);
      if (p) proofText = `<strong>${p.customer}</strong>${p.value} ${p.label} — ${p.detail || ''}`;
    }
    valueEl.innerHTML = proofText
      || `<strong>Why IAM</strong> One platform for intake, review, signature, and ERP sync — built for ${typeof gwStateCtx === 'function' ? gwStateCtx().state : 'state'} agencies.`;
    valueEl.style.display = '';
  } else if (valueEl) {
    valueEl.style.display = 'none';
  }
}

function hlOnStepRender(step, persona) {
  if (!hlModeActive()) return;
  const steps = typeof gwGetScenario === 'function' ? gwGetScenario().steps : [];
  const moments = hlGetMomentsForStep(step);
  hlUpdateFocusRail(step, gwCurrentStep, steps.length);
  hlUpdateDemoStrip(moments);
}

function hlRenderPageBar() {
  if (!hlModeActive()) return;
  const path = window.location.pathname;
  const moments = HL_PAGE_MOMENTS[path];
  if (!moments || document.getElementById('gw-visual-hero')) return;

  document.getElementById('hl-page-bar')?.remove();

  const m = moments[0];
  const meta = HL_MOMENT_META[m.type] || HL_MOMENT_META.task;
  const main = document.querySelector('.main');
  if (!main) return;

  const bar = document.createElement('div');
  bar.id = 'hl-page-bar';
  bar.className = 'hl-page-bar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'What to watch on this page');
  const iconBg = m.type === 'sign' ? '#059669' : m.type === 'api' ? '#0891B2' : 'var(--indigo)';
  bar.innerHTML = `
    <div class="hl-page-bar-icon" style="background:${iconBg}">${meta.short}</div>
    <div>
      <div class="hl-page-bar-title">${m.label}</div>
      <div class="hl-page-bar-say">${m.say}</div>
    </div>`;

  const header = main.querySelector('.page-header');
  if (header) header.after(bar);
  else main.prepend(bar);
}

function hlSaveSubModes() {
  if (sessionStorage.getItem(HL_SAVED_KEY)) return;
  sessionStorage.setItem(HL_SAVED_KEY, JSON.stringify({
    business: localStorage.getItem('ds-business'),
    present: localStorage.getItem('ds-present'),
    tech: localStorage.getItem('ds-tech'),
    executive: localStorage.getItem('ds-executive'),
  }));
}

function hlRestoreSubModes() {
  const raw = sessionStorage.getItem(HL_SAVED_KEY);
  sessionStorage.removeItem(HL_SAVED_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (typeof toggleExecutiveMode === 'function') toggleExecutiveMode(saved.executive === '1');
    if (typeof toggleBusinessMode === 'function') toggleBusinessMode(saved.business === '1');
    if (typeof togglePresentMode === 'function') togglePresentMode(saved.present === '1');
    if (typeof toggleTechMode === 'function') toggleTechMode(saved.tech === '1');
  } catch (_) { /* ignore */ }
}

function hlApplySubModes(on) {
  if (on) {
    hlSaveSubModes();
    if (typeof toggleScvMode === 'function' && scvModeActive()) toggleScvMode(false);
    if (typeof toggleExecutiveMode === 'function' && executiveModeActive()) toggleExecutiveMode(false);
    if (typeof toggleBusinessMode === 'function') toggleBusinessMode(true);
    if (typeof togglePresentMode === 'function') togglePresentMode(true);
    if (typeof toggleTechMode === 'function') toggleTechMode(false);
  } else {
    hlRestoreSubModes();
  }
}

function hlUpdateChrome(on) {
  const banner = document.getElementById('hl-banner');
  const home = document.getElementById('hl-home');
  if (banner) banner.style.display = on ? '' : 'none';
  if (home) home.style.display = on ? '' : 'none';
  const execHome = document.getElementById('executive-home');
  if (execHome && on) execHome.style.display = 'none';
  const rail = document.getElementById('hl-focus-rail');
  if (rail) rail.style.display = on ? '' : 'none';
  if (on && typeof guideRailRestore === 'function') guideRailRestore('hl');

  const sub = document.getElementById('gw-page-sub');
  if (sub && on) {
    if (!sub.dataset.defaultSub) sub.dataset.defaultSub = sub.innerHTML;
    sub.innerHTML = 'Press <strong>▶ Play</strong> — each step highlights exactly what happens: tasks, edits, Word, notifications, signing, and API sync.';
  } else if (sub && sub.dataset.defaultSub && !document.body.classList.contains('executive-mode')) {
    sub.innerHTML = sub.dataset.defaultSub;
  }
}

function hlRerender() {
  if (typeof gwRenderStep === 'function' && document.getElementById('gw-visual-hero')) {
    gwRenderStep();
  } else {
    hlUpdateFocusRail(null, 0, 0);
    hlRenderPageBar();
  }
}

function toggleHighLevelMode(force) {
  const on = force !== undefined ? force : !hlModeActive();
  if (on && typeof scvModeActive === 'function' && scvModeActive()) {
    toggleScvMode(false);
  }
  document.body.classList.toggle('high-level-mode', on);

  const btn = document.getElementById('hl-toggle');
  if (btn) {
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? 'High-level On' : 'High-level';
  }

  localStorage.setItem(HL_STORAGE_KEY, on ? '1' : '0');
  hlApplySubModes(on);
  hlUpdateChrome(on);
  hlRerender();

  if (on && typeof showToast === 'function') {
    showToast('High-level view — one moment at a time', 'success');
  }
  if (!on) {
    document.getElementById('hl-page-bar')?.remove();
    hlRemoveDemoChrome();
  }
  if (typeof consultantGuideUpdateMode === 'function') consultantGuideUpdateMode();
}

window.hlModeActive = hlModeActive;
window.hlOnStepRender = hlOnStepRender;
window.toggleHighLevelMode = toggleHighLevelMode;
window.hlRenderPageBar = hlRenderPageBar;

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem(HL_STORAGE_KEY) !== '1') {
    hlRenderPageBar();
  }
});
