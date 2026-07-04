/* Product preview shell — show faithful Docusign UI mockups before live demo */

const DS_PRODUCT_CONFIG = {
  home:       { mocks: ['home'], defaultMock: 'home', label: 'Docusign Home' },
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
  explorer:   { mocks: ['explorerConsole'], defaultMock: 'explorerConsole', label: 'API Explorer' },
  agent:      { mocks: ['agentFlow'], defaultMock: 'agentFlow', label: 'Agent API' },
  govWorkflows: { mocks: ['govWorkflowPreview'], defaultMock: 'govWorkflowPreview', label: 'Gov Workflows' },
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
  explorerConsole: 'API console',
  agentFlow: 'Agent flow',
  govWorkflowPreview: 'Lifecycle step',
};

function dsHasPreviewRail() {
  return !!document.getElementById('ds-preview-rail-host');
}

function dsLoadMockScripts() {
  if (typeof DS_RENDER_MOCK === 'object') {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const mocks = document.createElement('script');
    mocks.src = '/static/js/product-mocks.js';
    mocks.async = true;
    mocks.onload = () => {
      const actions = document.createElement('script');
      actions.src = '/static/js/product-mock-actions.js';
      actions.async = true;
      actions.onload = () => resolve();
      actions.onerror = reject;
      document.body.appendChild(actions);
    };
    mocks.onerror = reject;
    document.body.appendChild(mocks);
  });
}

function dsInitProductSection(sectionId, opts = {}) {
  const cfg = DS_PRODUCT_CONFIG[sectionId];
  if (!cfg || typeof DS_RENDER_MOCK !== 'object') return;

  const wrap = document.querySelector(`[data-ds-product="${sectionId}"]`);
  if (!wrap) return;

  const mockHost = wrap.querySelector('.ds-product-mock-host');
  const tabsEl = wrap.querySelector('.ds-product-view-tabs');

  let activeMock = opts.defaultMock || cfg.defaultMock;

  function renderMock(key, extraCtx = {}, railOpts = {}) {
    activeMock = key;
    const fn = DS_RENDER_MOCK[key];
    const ctx = { ...(opts.context || {}), ...(wrap.dsMockCtx || {}), ...extraCtx };

    if (mockHost && fn) {
      mockHost.innerHTML = fn(ctx);
      mockHost.removeAttribute('hidden');
    } else if (mockHost) {
      mockHost.innerHTML = '<div style="padding:32px;text-align:center;color:#666;font-size:15px">Product mock unavailable.</div>';
    }

    if (dsHasPreviewRail() && fn && typeof dsRenderPreviewRail === 'function') {
      dsRenderPreviewRail(sectionId, key, ctx, {
        animate: true,
        transition: railOpts.transition !== false,
      });
      if (typeof dsSyncPreviewRailTabs === 'function') dsSyncPreviewRailTabs(sectionId, key);
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

  if (typeof dsInitPreviewRailTabs === 'function') {
    dsInitPreviewRailTabs(sectionId, activeMock);
  }

  renderMock(activeMock, {}, { transition: false });

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
  if (dsHasPreviewRail() && typeof dsTogglePreviewRail === 'function') {
    dsTogglePreviewRail(false);
  }
}

function dsOpenLive(sectionId) {
  const wrap = document.querySelector(`[data-ds-product="${sectionId}"]`);
  if (!wrap) return;
  wrap.querySelector('.ds-product-mock-host')?.setAttribute('hidden', '');
  wrap.querySelector('.ds-product-live')?.removeAttribute('hidden');
  if (dsHasPreviewRail() && typeof dsTogglePreviewRail === 'function') {
    dsTogglePreviewRail(true);
  }
  const badge = wrap.querySelector('.ds-product-phase-badge');
  if (badge) badge.textContent = 'Live demo';
  wrap.querySelector('.ds-btn-show-preview')?.removeAttribute('hidden');
  wrap.querySelector('.ds-btn-show-live')?.setAttribute('hidden', '');
  wrap.querySelector('.ds-product-live')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (typeof showToast === 'function') showToast('Live demo — connected to your Docusign account', 'default');
}

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('[data-ds-product]');
  const standaloneRail = document.getElementById('ds-preview-rail');
  const standaloneId = standaloneRail?.dataset.dsPreviewRail;
  const hasStandaloneOnly = standaloneRail && standaloneId
    && !document.querySelector(`[data-ds-product="${standaloneId}"]`);

  if (!sections.length && !hasStandaloneOnly) return;

  dsLoadMockScripts()
    .then(() => {
      sections.forEach(el => {
        const id = el.dataset.dsProduct;
        const ctx = {};
        try {
          if (el.dataset.dsContext) Object.assign(ctx, JSON.parse(el.dataset.dsContext));
        } catch (_) { /* ignore */ }
        dsInitProductSection(id, { context: ctx });
      });

      if (hasStandaloneOnly && typeof dsInitStandalonePreviewRail === 'function') {
        dsInitStandalonePreviewRail(standaloneId, {});
      }
    })
    .catch(() => {
      sections.forEach(el => {
        const host = el.querySelector('.ds-product-mock-host');
        if (host) {
          host.innerHTML = '<div style="padding:32px;text-align:center;color:var(--muted)">Product preview could not load.</div>';
        }
      });
    });
});
