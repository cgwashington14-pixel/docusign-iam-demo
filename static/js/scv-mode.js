/* SCV View — Simple Component View for non-technical audiences */

const SCV_STORAGE_KEY = 'ds-scv';
const SCV_SAVED_KEY = 'ds-scv-saved-modes';

const SCV_ICONS = {
  home: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="8" y="20" width="32" height="22" rx="3" stroke="currentColor" stroke-width="2"/><path d="M16 20V14l8-6 8 6v6" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  envelope: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="6" y="12" width="36" height="26" rx="3" stroke="currentColor" stroke-width="2"/><path d="M6 16l18 12L42 16" stroke="currentColor" stroke-width="2"/></svg>',
  send: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M8 24l32-14-6 28-10-10-10 10 2-14-18-10z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  sign: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M10 34c8-2 14-8 22-18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M28 12l8 8" stroke="currentColor" stroke-width="2"/></svg>',
  form: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="10" y="8" width="28" height="32" rx="3" stroke="currentColor" stroke-width="2"/><path d="M16 18h16M16 24h16M16 30h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  workflow: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="6" y="10" width="12" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="30" y="10" width="12" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="18" y="28" width="12" height="10" rx="2" stroke="currentColor" stroke-width="2"/><path d="M12 20v4h12v4M36 20v4H24" stroke="currentColor" stroke-width="2"/></svg>',
  desk: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="8" y="10" width="32" height="28" rx="3" stroke="currentColor" stroke-width="2"/><path d="M16 20h16M16 26h12M16 32h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  portfolio: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M10 12h28v28H10z" stroke="currentColor" stroke-width="2"/><path d="M16 20h16M16 26h12M16 32h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  gov: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 6l16 8v20H8V14l16-8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="18" y="26" width="12" height="12" stroke="currentColor" stroke-width="2"/></svg>',
  workspace: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="6" y="14" width="16" height="22" rx="2" stroke="currentColor" stroke-width="2"/><rect x="26" y="14" width="16" height="22" rx="2" stroke="currentColor" stroke-width="2"/><path d="M14 22h4M30 22h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  connect: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M12 24h24M24 12v24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="24" r="4" stroke="currentColor" stroke-width="2"/><circle cx="36" cy="24" r="4" stroke="currentColor" stroke-width="2"/></svg>',
  api: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M14 16l-4 8 4 8M34 16l4 8-4 8M28 14l-8 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  ai: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="14" stroke="currentColor" stroke-width="2"/><path d="M18 28c2-4 10-4 12 0M20 20h.01M28 20h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

const SCV_COMPONENTS = {
  '/': {
    icon: 'home',
    title: 'Demo home',
    tagline: 'Your starting point',
    what: 'This portal lets you show how government agencies manage contracts — from request to signature to ERP sync — without writing code.',
    why: 'Pick one path and stay focused. Each section below is a real product capability your agency would use.',
    demo: ['Start with Gov Workflows for the full contract story.', 'Use Agreement Desk to show intake and approvals.', 'Finish with Connect to show automatic ERP updates.'],
    link: { action: 'startWalkthrough', label: '▶ Start recommended walkthrough' },
  },
  '/envelopes': {
    icon: 'envelope',
    title: 'Envelopes',
    tagline: 'Documents out for signature',
    what: 'An envelope is a package sent for eSignature — like a contract folder with signers, status, and a complete audit trail.',
    why: 'Agencies need proof of who signed what and when. Envelopes give legal teams that record automatically.',
    demo: ['Open any envelope to see signer status.', 'Point out completed vs. waiting signatures.', 'Show the tamper-evident audit trail on completed items.'],
  },
  '/envelopes/send': {
    icon: 'send',
    title: 'Send Envelope',
    tagline: 'Create and send for signature',
    what: 'Staff pick a template, add recipients, and send — signers get email or SMS with a secure link.',
    why: 'Replaces printing, scanning, and chasing signatures. Works on mobile for field staff and executives.',
    demo: ['Show the pre-filled vendor contract example.', 'Walk through recipients and signing order.', 'Send or preview — signers get notified instantly.'],
  },
  '/embedded': {
    icon: 'sign',
    title: 'Embedded Signing',
    tagline: 'Sign inside your portal',
    what: 'Citizens and vendors sign without leaving your website — the Docusign experience appears inside your page.',
    why: 'Higher completion rates. No confusing redirects to unfamiliar sites.',
    demo: ['Show the permit signing example.', 'Highlight that the citizen never leaves the agency portal.', 'Complete signing to show the success screen.'],
  },
  '/webforms': {
    icon: 'form',
    title: 'Web Forms',
    tagline: 'Digital intake forms',
    what: 'Replace PDF attachments with smart forms — data flows straight into Docusign and your systems.',
    why: 'Fewer errors, faster intake, and staff get notified the moment a form is submitted.',
    demo: ['Open the benefits enrollment example.', 'Show pre-filled fields from CRM or ERP.', 'Submit to trigger the next workflow step.'],
  },
  '/maestro': {
    icon: 'workflow',
    title: 'Workflow Builder',
    tagline: 'Automate multi-step processes',
    what: 'Visual workflows connect forms, approvals, signatures, and system updates — no custom code required.',
    why: 'Procurement and HR processes that took weeks can run on autopilot with the right routing rules.',
    demo: ['Show the workflow canvas and trigger step.', 'Explain how ERP data pre-fills the first step.', 'Point out where human approval gates sit.'],
  },
  '/agreement-desk': {
    icon: 'desk',
    title: 'Agreement Desk',
    tagline: 'Intake queue & approvals',
    what: 'One place for contract requests — who submitted, what stage it is, and every action logged.',
    why: 'Stops contracts from getting lost in email. Managers see backlog and bottlenecks at a glance.',
    demo: ['Open the request queue.', 'Click a request to show status and audit trail.', 'Show Iris AI suggestions on flagged clauses.'],
  },
  '/navigator': {
    icon: 'portfolio',
    title: 'Agreement Manager',
    tagline: 'Search your contract portfolio',
    what: 'After execution, agreements live here — searchable by vendor, value, renewal date, and obligations.',
    why: 'Finance and legal teams answer “when does this renew?” in seconds instead of digging through folders.',
    demo: ['Search the portfolio table.', 'Open a contract to show obligations and metadata.', 'Highlight the synced row after ERP update.'],
  },
  '/gov-workflows': {
    icon: 'gov',
    title: 'Gov Workflows',
    tagline: '50-state contract lifecycle',
    what: 'End-to-end walkthrough: request → review → negotiate → sign → sync to FI$Cal or your ERP.',
    why: 'This is the flagship demo — one story that connects every product on the left menu.',
    demo: ['Select your state (California is pre-loaded).', 'Click **▶ Play walkthrough** when you are ready — nothing auto-starts.', 'Use arrow keys or Pause anytime to control the pace.'],
    link: { action: 'startWalkthrough', label: '▶ Start California walkthrough' },
  },
  '/workspaces': {
    icon: 'workspace',
    title: 'Workspaces',
    tagline: 'Collaborate with vendors',
    what: 'A secure shared room where agency and vendor review terms, upload files, and track comments.',
    why: 'Keeps negotiation out of email threads. Everyone sees the same version.',
    demo: ['Show the vendor workspace hub.', 'Walk through shared documents and activity feed.', 'Explain external parties get controlled access only.'],
  },
  '/webhooks': {
    icon: 'connect',
    title: 'Connect / Webhooks',
    tagline: 'Automatic system updates',
    what: 'When a contract is signed, Docusign notifies your systems — FI$Cal, case management, or a contract register updates automatically.',
    why: 'Eliminates re-keying executed contracts. Finance sees encumbrances without manual data entry.',
    demo: ['Press Play on the animated walkthrough.', 'Watch the envelope-completed event fire.', 'Scroll to the ERP sync finale — the payoff moment.'],
  },
  '/explorer': {
    icon: 'api',
    title: 'API Explorer',
    tagline: 'For integration teams',
    what: 'Technical tool to test Docusign APIs live. Best saved for CIO staff or SI partners after the business story lands.',
    why: 'Proves the platform is real — not slides. Use only when the audience asks “how does it connect?”',
    demo: ['Briefly show live API responses.', 'Return to Gov Workflows or Connect for business audiences.', 'Enable API Details toggle only for architects.'],
    technical: true,
  },
  '/agent': {
    icon: 'ai',
    title: 'Agent API',
    tagline: 'AI document analysis',
    what: 'AI reads contracts and answers questions — clause summaries, risk flags, obligation extraction.',
    why: 'Speeds legal review. Iris in Agreement Desk uses similar intelligence for scorecards.',
    demo: ['Show a sample analysis result.', 'Connect it to the AI scorecard step in Gov Workflows.', 'Keep this short unless the audience is legal or IT.'],
    technical: true,
  },
  '/workflow-discovery': {
    icon: 'flow',
    title: 'Workflow Discovery',
    tagline: 'Process engineering maps',
    what: 'Animated Visio-style diagrams — linear, threshold, department, quorum, and hub-and-spoke patterns.',
    why: 'Use in discovery to mirror how agencies route HR, procurement, and legal approvals today.',
    demo: ['Play hub-and-spoke first.', 'Ask which pattern matches their org.', 'Switch to Build and sketch their process live.'],
    technical: false,
  },
};

const SCV_GW_STEPS = {
  initiate: { label: 'Contract request', say: 'Someone starts a new contract — vendor and budget info come from your ERP automatically.' },
  generate: { label: 'Draft generated', say: 'Approved templates and mandatory state clauses merge into one draft.' },
  ai_scorecard: { label: 'AI review', say: 'Iris flags risky language before Legal spends hours reading every page.' },
  legal_review: { label: 'Legal review', say: 'Counsel opens the document in Word with AI flags beside each clause.' },
  signature: { label: 'eSignature', say: 'Authorized signers execute on any device — legally binding and auditable.' },
  post_execution: { label: 'System of record', say: 'Executed contract syncs to Agreement Manager and updates FI$Cal — no re-keying.' },
};

function scvModeActive() {
  return document.body.classList.contains('scv-mode');
}

function scvMatchPath(pathname) {
  if (SCV_COMPONENTS[pathname]) return pathname;
  if (pathname.startsWith('/envelopes/') && pathname !== '/envelopes/send') return '/envelopes';
  if (pathname.startsWith('/embedded')) return '/embedded';
  if (pathname.startsWith('/maestro')) return '/maestro';
  if (pathname.startsWith('/workspaces')) return '/workspaces';
  if (pathname.startsWith('/agent')) return '/agent';
  if (pathname.startsWith('/workflow-discovery')) return '/workflow-discovery';
  return '/';
}

function scvGetComponent(pathname) {
  return SCV_COMPONENTS[scvMatchPath(pathname || window.location.pathname)] || SCV_COMPONENTS['/'];
}

function scvSaveSubModes() {
  if (sessionStorage.getItem(SCV_SAVED_KEY)) return;
  sessionStorage.setItem(SCV_SAVED_KEY, JSON.stringify({
    highLevel: localStorage.getItem('ds-high-level'),
    executive: localStorage.getItem('ds-executive'),
    business: localStorage.getItem('ds-business'),
    present: localStorage.getItem('ds-present'),
    tech: localStorage.getItem('ds-tech'),
  }));
}

function scvRestoreSubModes() {
  const raw = sessionStorage.getItem(SCV_SAVED_KEY);
  sessionStorage.removeItem(SCV_SAVED_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (typeof toggleHighLevelMode === 'function') toggleHighLevelMode(saved.highLevel === '1');
    if (typeof toggleExecutiveMode === 'function') toggleExecutiveMode(saved.executive === '1');
    if (typeof toggleBusinessMode === 'function') toggleBusinessMode(saved.business === '1');
    if (typeof togglePresentMode === 'function') togglePresentMode(saved.present === '1');
    if (typeof toggleTechMode === 'function') toggleTechMode(saved.tech === '1');
  } catch (_) { /* ignore */ }
}

function scvApplySubModes(on) {
  if (on) {
    scvSaveSubModes();
    if (typeof toggleHighLevelMode === 'function' && hlModeActive()) toggleHighLevelMode(false);
    if (typeof toggleExecutiveMode === 'function' && executiveModeActive()) toggleExecutiveMode(false);
    if (typeof toggleBusinessMode === 'function') toggleBusinessMode(true);
    if (typeof togglePresentMode === 'function') togglePresentMode(true);
    if (typeof toggleTechMode === 'function') toggleTechMode(false);
  } else {
    scvRestoreSubModes();
  }
}

function scvStepHintHtml() {
  if (!document.getElementById('gw-visual-hero') || typeof gwGetScenario !== 'function') return '';
  const scenario = gwGetScenario();
  const counter = document.getElementById('gw-step-counter')?.textContent || '';
  const match = counter.match(/Step (\d+)/);
  const idx = match ? parseInt(match[1], 10) - 1 : 0;
  const step = scenario?.steps?.[idx];
  if (!step) return '';
  const hint = SCV_GW_STEPS[step.id];
  if (!hint) return '';
  return `
    <section class="scv-rail-step scv-animate-in" aria-live="polite">
      <div class="scv-rail-step-label">Current step</div>
      <div class="scv-rail-step-title">${hint.label}</div>
      <p class="scv-rail-step-say">${hint.say}</p>
    </section>`;
}

function scvRelatedHtml() {
  const related = [
    { href: '/gov-workflows?state=CA', label: 'Gov Workflows', sub: 'Full lifecycle' },
    { href: '/agreement-desk', label: 'Agreement Desk', sub: 'Intake & approvals' },
    { href: '/webhooks', label: 'Connect', sub: 'ERP sync' },
    { href: '/navigator', label: 'Agreement Manager', sub: 'Portfolio search' },
  ];
  return `
    <section class="scv-rail-related">
      <div class="scv-rail-section-label">Related demos</div>
      <div class="scv-related-links">
        ${related.map(r => `<a href="${r.href}" class="scv-related-link"><strong>${r.label}</strong><span>${r.sub}</span></a>`).join('')}
      </div>
    </section>`;
}

function scvRenderGuide() {
  if (!scvModeActive()) return;
  const rail = document.getElementById('scv-guide-rail-inner');
  if (!rail) return;

  const comp = scvGetComponent(window.location.pathname);
  const icon = SCV_ICONS[comp.icon] || SCV_ICONS.home;
  const demoSteps = (comp.demo || []).map((s, i) => `<li><span class="scv-step-num">${i + 1}</span>${s}</li>`).join('');
  const techNote = comp.technical
    ? '<p class="scv-rail-tech-note">Best for IT or legal deep-dives — skip for executive briefings.</p>'
    : '';

  rail.innerHTML = `
    <div class="scv-rail-head">
      <div class="scv-rail-brand">SCView · Simple Component View</div>
      <div class="scv-rail-visual scv-animate-in">${icon}</div>
      <h2 class="scv-rail-title">${comp.title}</h2>
      <p class="scv-rail-tagline">${comp.tagline}</p>
    </div>
    <div class="scv-rail-body">
      <section class="scv-rail-block scv-animate-in scv-animate-in--1">
        <div class="scv-rail-section-label">What is this?</div>
        <p class="scv-rail-text">${comp.what}</p>
      </section>
      <section class="scv-rail-block scv-animate-in scv-animate-in--2">
        <div class="scv-rail-section-label">Why it matters</div>
        <p class="scv-rail-text">${comp.why}</p>
      </section>
      <section class="scv-rail-block scv-animate-in scv-animate-in--3">
        <div class="scv-rail-section-label">How to demo it</div>
        <ol class="scv-rail-steps">${demoSteps}</ol>
        ${techNote}
      </section>
      ${scvStepHintHtml()}
      ${comp.link ? (comp.link.action === 'startWalkthrough'
    ? `<button type="button" class="scv-rail-cta scv-animate-in scv-animate-in--4" onclick="scvStartWalkthrough()">${comp.link.label}</button>`
    : `<a href="${comp.link.href}" class="scv-rail-cta scv-animate-in scv-animate-in--4">${comp.link.label}</a>`) : ''}
      ${scvRelatedHtml()}
    </div>`;
}

function scvStartWalkthrough() {
  const onGov = window.location.pathname === '/gov-workflows';
  if (onGov) {
    if (typeof gwStartPlay === 'function') gwStartPlay();
    else document.getElementById('gw-btn-play')?.click();
    document.getElementById('gw-visual-hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  sessionStorage.setItem('gw-user-start-play', '1');
  window.location.href = '/gov-workflows?state=CA';
}

function scvUpdateChrome(on) {
  const banner = document.getElementById('scv-banner');
  if (banner) banner.style.display = on ? '' : 'none';
  const rail = document.getElementById('scv-guide-rail');
  if (rail) rail.style.display = on ? '' : 'none';
  if (on && typeof guideRailRestore === 'function') guideRailRestore('scv');

  const sub = document.getElementById('gw-page-sub');
  if (sub && on) {
    if (!sub.dataset.defaultSub) sub.dataset.defaultSub = sub.innerHTML;
    sub.innerHTML = 'Plain-language walkthrough for business audiences — use the <strong>SCView panel on the right</strong> for what to say at each step. Press <strong>▶ Play</strong> to advance.';
  } else if (sub && sub.dataset.defaultSub && !document.body.classList.contains('executive-mode') && !hlModeActive()) {
    const bizOn = document.body.classList.contains('business-mode');
    if (!bizOn) sub.innerHTML = sub.dataset.defaultSub;
  }
}

function scvRerender() {
  scvRenderGuide();
  if (typeof gwRenderStep === 'function' && document.getElementById('gw-visual-hero')) {
    gwRenderStep();
  }
}

function toggleScvMode(force) {
  const on = force !== undefined ? force : !scvModeActive();
  document.body.classList.toggle('scv-mode', on);

  const btn = document.getElementById('scv-toggle');
  if (btn) {
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? 'SCView On' : 'SCView';
  }

  localStorage.setItem(SCV_STORAGE_KEY, on ? '1' : '0');
  scvApplySubModes(on);
  scvUpdateChrome(on);
  scvRerender();

  if (on && typeof showToast === 'function') {
    showToast('SCView — simple component guide for business audiences', 'success');
  }
  if (typeof consultantGuideUpdateMode === 'function') consultantGuideUpdateMode();
}

function scvOnStepRender() {
  if (!scvModeActive()) return;
  scvRenderGuide();
}

window.scvStartWalkthrough = scvStartWalkthrough;
window.scvModeActive = scvModeActive;
window.toggleScvMode = toggleScvMode;
window.scvOnStepRender = scvOnStepRender;
window.scvRenderGuide = scvRenderGuide;

document.addEventListener('DOMContentLoaded', () => {
  if (!scvModeActive()) scvRenderGuide();
});
