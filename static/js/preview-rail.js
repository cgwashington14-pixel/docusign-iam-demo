/* Shared minimizable cartoon preview rail — all demo workflows */

const DS_PREVIEW_RAIL_MIN_KEY = 'ds-preview-rail-minimized';

const DS_PREVIEW_RAIL_META = {
  home: {
    title: 'Docusign Home',
    sub: 'Tasks & agreement activity at a glance',
    sticker: '🏠',
    chrome: 'send',
  },
  send: {
    title: 'Send Envelope',
    sub: 'AI-assisted review before send',
    sticker: '📤',
    chrome: 'send',
  },
  embedded: {
    title: 'Embedded Signing',
    sub: 'Sign inside your portal or app',
    sticker: '✍️',
    chrome: 'sign',
  },
  webforms: {
    title: 'Web Forms',
    sub: 'Self-service intake & routing',
    sticker: '📝',
    chrome: 'listener',
  },
  maestro: {
    title: 'Workflow Builder',
    sub: 'Automate agreement steps',
    sticker: '⚡',
    chrome: 'post',
  },
  agreementDesk: {
    title: 'Agreement Desk',
    sub: 'Intake & triage requests',
    sticker: '📥',
    chrome: 'listener',
  },
  navigator: {
    title: 'Agreement Manager',
    sub: 'Portfolio insights & search',
    sticker: '📊',
    chrome: 'erp',
  },
  workspaces: {
    title: 'Workspaces',
    sub: 'Collaborate with vendors & agencies',
    sticker: '🤝',
    chrome: 'listener',
  },
  envelopes: {
    title: 'Envelopes',
    sub: 'Track status across agreements',
    sticker: '📄',
    chrome: 'send',
    mocks: ['envelopesList'],
    defaultMock: 'envelopesList',
  },
  explorer: {
    title: 'API Explorer',
    sub: 'Try REST endpoints live',
    sticker: '🔌',
    chrome: 'post',
    mocks: ['explorerConsole'],
    defaultMock: 'explorerConsole',
  },
  agent: {
    title: 'Agent API',
    sub: 'AI agents on agreement data',
    sticker: '🤖',
    chrome: 'post',
    mocks: ['agentFlow'],
    defaultMock: 'agentFlow',
  },
};

function dsPreviewRailEl(id) {
  return document.getElementById(id);
}

function dsGetPreviewRailSectionId() {
  const rail = dsPreviewRailEl('ds-preview-rail');
  return rail?.dataset.dsPreviewRail || null;
}

function dsTogglePreviewRail(forceMinimized) {
  const root = dsPreviewRailEl('ds-preview-page-root');
  const rail = dsPreviewRailEl('ds-preview-rail');
  const btn = dsPreviewRailEl('ds-preview-rail-minimize');
  if (!root || !rail) return;

  const minimized = typeof forceMinimized === 'boolean'
    ? forceMinimized
    : !root.classList.contains('ds-preview-page-root--rail-minimized');

  root.classList.toggle('ds-preview-page-root--rail-minimized', minimized);
  rail.classList.toggle('ds-preview-rail--minimized', minimized);

  if (btn) {
    btn.setAttribute('aria-expanded', minimized ? 'false' : 'true');
    btn.setAttribute('aria-label', minimized ? 'Expand product preview' : 'Minimize product preview');
    btn.title = minimized ? 'Expand panel' : 'Minimize panel';
    const icon = btn.querySelector('.ds-preview-rail-minimize-icon');
    if (icon) icon.textContent = minimized ? '‹' : '›';
  }

  try {
    localStorage.setItem(DS_PREVIEW_RAIL_MIN_KEY, minimized ? '1' : '0');
  } catch (_) { /* ignore */ }
}

function dsInitPreviewRailState() {
  try {
    if (localStorage.getItem(DS_PREVIEW_RAIL_MIN_KEY) === '1') {
      dsTogglePreviewRail(true);
    }
  } catch (_) { /* ignore */ }
}

function dsUpdatePreviewRailHeader(sectionId, mockKey) {
  const meta = DS_PREVIEW_RAIL_META[sectionId] || {};
  const mockLabel = typeof DS_MOCK_LABELS !== 'undefined' && mockKey
    ? DS_MOCK_LABELS[mockKey]
    : null;

  const titleEl = dsPreviewRailEl('ds-preview-rail-title');
  const subEl = dsPreviewRailEl('ds-preview-rail-sub');
  if (titleEl) titleEl.textContent = mockLabel || meta.title || 'Product preview';
  if (subEl) subEl.textContent = meta.sub || '';
}

function dsRailCartoonWrap(html, sectionId, mockKey) {
  const meta = DS_PREVIEW_RAIL_META[sectionId] || {};
  const mockLabel = typeof DS_MOCK_LABELS !== 'undefined' && mockKey
    ? DS_MOCK_LABELS[mockKey]
    : (meta.title || 'Preview');
  const sticker = meta.sticker || '✨';
  const chrome = meta.chrome || 'send';

  return `
    <div class="ds-prod-frame ds-prod-frame--connect-preview ds-prod-cpv-cartoon ds-preview-rail-frame">
      <div class="ds-prod-cpv-chrome ds-prod-cpv-chrome--${chrome}">
        <span class="ds-prod-cpv-sticker" aria-hidden="true">${sticker}</span>
        <span class="ds-prod-cpv-flow-step">${mockLabel}</span>
      </div>
      <div class="ds-preview-rail-scaled">${html}</div>
    </div>`;
}

function dsRenderPreviewRail(sectionId, mockKey, ctx = {}) {
  const host = dsPreviewRailEl('ds-preview-rail-host');
  if (!host || typeof DS_RENDER_MOCK !== 'object') return;

  const fn = DS_RENDER_MOCK[mockKey];
  if (!fn) {
    host.innerHTML = '<p class="ds-preview-rail-empty">Preview unavailable.</p>';
    return;
  }

  const raw = fn(ctx);
  host.innerHTML = dsRailCartoonWrap(raw, sectionId, mockKey);
  host.removeAttribute('aria-busy');
  dsUpdatePreviewRailHeader(sectionId, mockKey);
}

function dsInitStandalonePreviewRail(sectionId, opts = {}) {
  const meta = DS_PREVIEW_RAIL_META[sectionId];
  if (!meta) return;

  const mockKey = opts.defaultMock || meta.defaultMock || (meta.mocks && meta.mocks[0]);
  if (!mockKey) return;

  dsRenderPreviewRail(sectionId, mockKey, opts.context || {});
  dsUpdatePreviewRailHeader(sectionId, mockKey);

  const tabsEl = dsPreviewRailEl('ds-preview-rail-tabs');
  const mocks = meta.mocks || DS_PRODUCT_CONFIG?.[sectionId]?.mocks;
  if (tabsEl && mocks?.length > 1) {
    tabsEl.hidden = false;
    tabsEl.innerHTML = mocks.map(k => `
      <button type="button" class="ds-preview-rail-tab ${k === mockKey ? 'active' : ''}"
        data-mock="${k}" onclick="dsPreviewRailSwitchMock('${sectionId}','${k}')">${DS_MOCK_LABELS[k] || k}</button>
    `).join('');
  }
}

function dsPreviewRailSwitchMock(sectionId, mockKey) {
  const wrap = document.querySelector(`[data-ds-product="${sectionId}"]`);
  const ctx = wrap?.dsMockCtx || {};
  if (wrap?.dsRenderMock) {
    wrap.dsRenderMock(mockKey);
    return;
  }
  dsRenderPreviewRail(sectionId, mockKey, ctx);
  dsPreviewRailEl('ds-preview-rail-tabs')?.querySelectorAll('[data-mock]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mock === mockKey);
  });
}

function dsSyncPreviewRailTabs(sectionId, mockKey) {
  dsPreviewRailEl('ds-preview-rail-tabs')?.querySelectorAll('[data-mock]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mock === mockKey);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!dsPreviewRailEl('ds-preview-rail')) return;
  dsInitPreviewRailState();

  dsPreviewRailEl('ds-preview-rail-head')?.addEventListener('click', ev => {
    const root = dsPreviewRailEl('ds-preview-page-root');
    if (!root?.classList.contains('ds-preview-page-root--rail-minimized')) return;
    if (ev.target.closest('.ds-preview-rail-minimize')) return;
    dsTogglePreviewRail(false);
  });
});

window.dsTogglePreviewRail = dsTogglePreviewRail;
window.dsRenderPreviewRail = dsRenderPreviewRail;
window.dsPreviewRailSwitchMock = dsPreviewRailSwitchMock;
