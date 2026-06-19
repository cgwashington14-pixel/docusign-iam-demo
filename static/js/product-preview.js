/* Product preview shell — show faithful DocuSign UI mockups before live demo */

const DS_PRODUCT_CONFIG = {
  home:       { mocks: ['home'], defaultMock: 'home', label: 'DocuSign Home' },
  maestro:    { mocks: ['workflowDiagram', 'workflowSteps'], defaultMock: 'workflowDiagram', label: 'Workflow Builder' },
  webforms:   { mocks: ['webformsBuilder'], defaultMock: 'webformsBuilder', label: 'Web Forms' },
  navigator:  { mocks: ['insights', 'agreements'], defaultMock: 'insights', label: 'Agreement Manager' },
  agreementDesk: {
    mocks: ['agreementDesk', 'requestWorkspace', 'requestIntake'],
    defaultMock: 'agreementDesk',
    label: 'Agreement Desk',
  },
  embedded:   { mocks: ['signing'], defaultMock: 'signing', label: 'eSignature' },
  send:       { mocks: ['wordReview', 'wordPlaybooks'], defaultMock: 'wordReview', label: 'AI-Assisted Review' },
  tasks:      { mocks: ['tasks'], defaultMock: 'tasks', label: 'Tasks' },
  workspaces: { mocks: ['workspaceAdmin', 'workspaceParticipant'], defaultMock: 'workspaceAdmin', label: 'Workspaces' },
};

const DS_MOCK_LABELS = {
  home: 'Home',
  workflowDiagram: 'Workflow',
  workflowSteps: 'Add step',
  webformsBuilder: 'Form builder',
  insights: 'Insights',
  agreements: 'Agreements',
  agreementDesk: 'Agreement Desk',
  requestWorkspace: 'Request',
  requestIntake: 'New request',
  signing: 'Signing',
  wordReview: 'AI Review',
  wordPlaybooks: 'Playbooks',
  request: 'Request',
  tasks: 'Tasks',
  workspaceAdmin: 'Manage hub',
  workspaceParticipant: 'Participant inbox',
};

function dsInitProductSection(sectionId, opts = {}) {
  const cfg = DS_PRODUCT_CONFIG[sectionId];
  if (!cfg || typeof DS_RENDER_MOCK !== 'object') return;

  const wrap = document.querySelector(`[data-ds-product="${sectionId}"]`);
  if (!wrap) return;

  const mockHost = wrap.querySelector('.ds-product-mock-host');
  const liveEl = wrap.querySelector('.ds-product-live');
  const tabsEl = wrap.querySelector('.ds-product-view-tabs');
  const badgeEl = wrap.querySelector('.ds-product-phase-badge');

  let activeMock = opts.defaultMock || cfg.defaultMock;

  function renderMock(key, extraCtx = {}) {
    activeMock = key;
    const fn = DS_RENDER_MOCK[key];
    const ctx = { ...(opts.context || {}), ...(wrap.dsMockCtx || {}), ...extraCtx };
    if (mockHost && fn) {
      mockHost.innerHTML = fn(ctx);
      mockHost.removeAttribute('hidden');
    } else if (mockHost) {
      mockHost.innerHTML = '<div style="padding:32px;text-align:center;color:#666;font-size:13px">Product mock unavailable.</div>';
    }
    tabsEl?.querySelectorAll('[data-mock]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mock === key);
    });
  }

  wrap.dsMockCtx = {};
  wrap.dsRenderMock = (key, extraCtx) => {
    if (extraCtx) Object.assign(wrap.dsMockCtx, extraCtx);
    renderMock(key, extraCtx);
  };
  if (tabsEl && cfg.mocks.length > 0) {
    tabsEl.innerHTML = cfg.mocks.map(k => `
      <button type="button" class="ds-product-view-tab ${k === activeMock ? 'active' : ''}"
        data-mock="${k}" onclick="dsSwitchMock('${sectionId}','${k}')">${DS_MOCK_LABELS[k] || k}</button>
    `).join('');
  }

  renderMock(activeMock);

  const skipLive = opts.startLive === true || wrap.dataset.dsStartLive === 'true';
  if (skipLive) dsOpenLive(sectionId);
  else dsShowPreview(sectionId);
}

function dsSwitchMock(sectionId, mockKey, extraCtx) {
  const wrap = document.querySelector(`[data-ds-product="${sectionId}"]`);
  wrap?.dsRenderMock?.(mockKey, extraCtx || {});
}

function dsShowPreview(sectionId) {
  const wrap = document.querySelector(`[data-ds-product="${sectionId}"]`);
  if (!wrap) return;
  wrap.querySelector('.ds-product-mock-host')?.removeAttribute('hidden');
  wrap.querySelector('.ds-product-live')?.setAttribute('hidden', '');
  const badge = wrap.querySelector('.ds-product-phase-badge');
  if (badge) badge.textContent = 'Product preview';
  wrap.querySelector('.ds-btn-show-preview')?.setAttribute('hidden', '');
  wrap.querySelector('.ds-btn-show-live')?.removeAttribute('hidden');
}

function dsOpenLive(sectionId) {
  const wrap = document.querySelector(`[data-ds-product="${sectionId}"]`);
  if (!wrap) return;
  wrap.querySelector('.ds-product-mock-host')?.setAttribute('hidden', '');
  wrap.querySelector('.ds-product-live')?.removeAttribute('hidden');
  const badge = wrap.querySelector('.ds-product-phase-badge');
  if (badge) badge.textContent = 'Live demo';
  wrap.querySelector('.ds-btn-show-preview')?.removeAttribute('hidden');
  wrap.querySelector('.ds-btn-show-live')?.setAttribute('hidden', '');
  wrap.querySelector('.ds-product-live')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (typeof showToast === 'function') showToast('Live demo — connected to your DocuSign account', 'default');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-ds-product]').forEach(el => {
    const id = el.dataset.dsProduct;
    const ctx = {};
    try {
      if (el.dataset.dsContext) Object.assign(ctx, JSON.parse(el.dataset.dsContext));
    } catch (_) { /* ignore */ }
    dsInitProductSection(id, { context: ctx });
  });
});
