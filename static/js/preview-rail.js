/* Minimizable animated product preview rail — companion to inline mocks */

const DS_PREVIEW_RAIL_MIN_KEY = 'ds-preview-rail-minimized';
const DS_PREVIEW_RAIL_PLAY_MS = 4800;

const DS_PREVIEW_RAIL_META = {
  send: { title: 'Send Envelope', sub: 'AI-assisted review before send', sticker: '📤', chrome: 'send' },
  embedded: { title: 'Embedded Signing', sub: 'Sign inside your portal or app', sticker: '✍️', chrome: 'sign' },
  webforms: { title: 'Web Forms', sub: 'Self-service intake & routing', sticker: '📝', chrome: 'listener' },
  maestro: { title: 'Workflow Builder', sub: 'Automate agreement steps', sticker: '⚡', chrome: 'post' },
  agreementDesk: { title: 'Agreement Desk', sub: 'Intake & triage requests', sticker: '📥', chrome: 'listener' },
  navigator: { title: 'Agreement Manager', sub: 'Portfolio insights & search', sticker: '📊', chrome: 'erp' },
  workspaces: { title: 'Workspaces', sub: 'Collaborate with vendors & agencies', sticker: '🤝', chrome: 'listener' },
  govWorkflows: { title: 'Gov Workflows', sub: 'Contract lifecycle walkthrough', sticker: '🏛️', chrome: 'erp' },
  explorer: { title: 'API Explorer', sub: 'Try REST endpoints live', sticker: '🔌', chrome: 'post' },
  agent: { title: 'Agent API', sub: 'AI agents on agreement data', sticker: '🤖', chrome: 'post' },
};

const dsPreviewRailState = {
  sectionId: null,
  mockIndex: 0,
  playing: false,
  timer: null,
  ctx: {},
};

function dsPreviewRailEl(id) {
  return document.getElementById(id);
}

function dsGetPreviewRailSectionId() {
  return dsPreviewRailEl('ds-preview-rail')?.dataset.dsPreviewRail || null;
}

function dsTogglePreviewRail(forceMinimized) {
  const root = dsPreviewRailEl('ds-preview-page-root');
  const rail = dsPreviewRailEl('ds-preview-rail');
  const btn = dsPreviewRailEl('ds-preview-rail-minimize');
  if (!rail) return;

  const minimized = typeof forceMinimized === 'boolean'
    ? forceMinimized
    : !rail.classList.contains('ds-preview-rail--minimized');

  root?.classList.toggle('ds-preview-page-root--rail-minimized', minimized);
  rail.classList.toggle('ds-preview-rail--minimized', minimized);

  if (btn) {
    btn.setAttribute('aria-expanded', minimized ? 'false' : 'true');
    btn.setAttribute('aria-label', minimized ? 'Expand product preview' : 'Minimize product preview');
    btn.title = minimized ? 'Expand panel' : 'Minimize panel';
    const icon = btn.querySelector('.ds-preview-rail-minimize-icon');
    if (icon) icon.textContent = minimized ? '‹' : '›';
  }

  if (minimized) dsPreviewRailStopPlay();

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

function dsUpdatePreviewRailHeader(sectionId, mockKey, extra = {}) {
  const meta = DS_PREVIEW_RAIL_META[sectionId] || {};
  const mockLabel = typeof DS_MOCK_LABELS !== 'undefined' && mockKey
    ? DS_MOCK_LABELS[mockKey]
    : null;

  const titleEl = dsPreviewRailEl('ds-preview-rail-title');
  const subEl = dsPreviewRailEl('ds-preview-rail-sub');
  if (titleEl) titleEl.textContent = extra.title || mockLabel || meta.title || 'Product preview';
  if (subEl) subEl.textContent = extra.sub || meta.sub || '';

  dsPreviewRailEl('ds-preview-rail-labels')?.classList.add('ds-preview-rail-labels--pulse');
  setTimeout(() => {
    dsPreviewRailEl('ds-preview-rail-labels')?.classList.remove('ds-preview-rail-labels--pulse');
  }, 650);
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
      <div class="ds-preview-rail-body">${html}</div>
    </div>`;
}

function dsPreviewRailMocks(sectionId) {
  return DS_PRODUCT_CONFIG?.[sectionId]?.mocks || DS_PREVIEW_RAIL_META[sectionId]?.mocks || [];
}

function dsMountPreviewRailHtml(html) {
  const host = dsPreviewRailEl('ds-preview-rail-host');
  if (!host) return;
  host.innerHTML = html;
  host.removeAttribute('aria-busy');
}

function dsRenderPreviewRail(sectionId, mockKey, ctx = {}, opts = {}) {
  const host = dsPreviewRailEl('ds-preview-rail-host');
  if (!host || typeof DS_RENDER_MOCK !== 'object') return;

  const fn = DS_RENDER_MOCK[mockKey];
  if (!fn) {
    host.innerHTML = '<p class="ds-preview-rail-empty">Preview unavailable.</p>';
    return;
  }

  const animate = opts.animate !== false;
  const railCtx = { ...ctx, animate };
  const raw = fn(railCtx);
  const wrapped = dsRailCartoonWrap(raw, sectionId, mockKey);

  const hasFrame = host.querySelector('.ds-preview-rail-frame');
  const doSwap = animate && hasFrame && opts.transition !== false;

  if (doSwap) {
    host.classList.add('ds-preview-rail-host--swap-out');
    setTimeout(() => {
      host.classList.remove('ds-preview-rail-host--swap-out');
      dsMountPreviewRailHtml(wrapped);
      host.classList.add('ds-preview-rail-host--swap-in');
      setTimeout(() => host.classList.remove('ds-preview-rail-host--swap-in'), 750);
    }, 450);
  } else {
    dsMountPreviewRailHtml(wrapped);
  }

  dsPreviewRailState.sectionId = sectionId;
  dsPreviewRailState.ctx = { ...ctx };

  const mocks = dsPreviewRailMocks(sectionId);
  dsPreviewRailState.mockIndex = Math.max(0, mocks.indexOf(mockKey));

  dsUpdatePreviewRailHeader(sectionId, mockKey, opts.header || {});
}

function dsInitPreviewRailTabs(sectionId, activeMock) {
  const tabsEl = dsPreviewRailEl('ds-preview-rail-tabs');
  const mocks = dsPreviewRailMocks(sectionId);
  if (!tabsEl || mocks.length <= 1) {
    if (tabsEl) tabsEl.hidden = true;
    return;
  }
  tabsEl.hidden = false;
  tabsEl.innerHTML = mocks.map(k => `
    <button type="button" class="ds-preview-rail-tab ${k === activeMock ? 'active' : ''}"
      data-mock="${k}" onclick="dsPreviewRailSwitchMock('${sectionId}','${k}')">${DS_MOCK_LABELS[k] || k}</button>
  `).join('');
}

function dsSyncPreviewRailTabs(sectionId, mockKey) {
  dsPreviewRailEl('ds-preview-rail-tabs')?.querySelectorAll('[data-mock]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mock === mockKey);
  });
  const mocks = dsPreviewRailMocks(sectionId);
  dsPreviewRailState.mockIndex = Math.max(0, mocks.indexOf(mockKey));
}

function dsPreviewRailSwitchMock(sectionId, mockKey) {
  dsPreviewRailStopPlay();
  const wrap = document.querySelector(`[data-ds-product="${sectionId}"]`);
  const ctx = wrap?.dsMockCtx || dsPreviewRailState.ctx || {};
  if (wrap?.dsRenderMock) {
    wrap.dsRenderMock(mockKey);
    return;
  }
  dsRenderPreviewRail(sectionId, mockKey, ctx, { animate: true });
  dsSyncPreviewRailTabs(sectionId, mockKey);
}

function dsPreviewRailStopPlay() {
  dsPreviewRailState.playing = false;
  clearInterval(dsPreviewRailState.timer);
  dsPreviewRailState.timer = null;
  dsPreviewRailEl('ds-preview-rail')?.classList.remove('ds-preview-rail--playing');
  const btn = dsPreviewRailEl('ds-preview-rail-play');
  if (btn) btn.textContent = '▶';
}

function dsPreviewRailStartPlay() {
  const sectionId = dsGetPreviewRailSectionId();
  if (!sectionId) return;

  dsPreviewRailState.playing = true;
  dsPreviewRailEl('ds-preview-rail')?.classList.add('ds-preview-rail--playing');
  const btn = dsPreviewRailEl('ds-preview-rail-play');
  if (btn) btn.textContent = '⏸';

  dsPreviewRailState.timer = setInterval(() => {
    dsPreviewRailStepNext(true);
  }, DS_PREVIEW_RAIL_PLAY_MS);
}

function dsPreviewRailTogglePlay() {
  const sectionId = dsGetPreviewRailSectionId();
  if (sectionId === 'govWorkflows' && typeof gwTogglePlay === 'function') {
    gwTogglePlay();
    return;
  }
  if (dsPreviewRailState.playing) dsPreviewRailStopPlay();
  else dsPreviewRailStartPlay();
}

function dsPreviewRailStepPrev() {
  const sectionId = dsGetPreviewRailSectionId();
  if (!sectionId) return;
  dsPreviewRailStopPlay();

  if (sectionId === 'govWorkflows' && typeof gwStepPrev === 'function') {
    gwStepPrev();
    return;
  }

  const mocks = dsPreviewRailMocks(sectionId);
  if (mocks.length <= 1) {
    const key = mocks[0] || DS_PRODUCT_CONFIG?.[sectionId]?.defaultMock;
    const wrap = document.querySelector(`[data-ds-product="${sectionId}"]`);
    const ctx = wrap?.dsMockCtx || dsPreviewRailState.ctx || {};
    dsRenderPreviewRail(sectionId, key, ctx, { animate: true });
    return;
  }

  const nextIdx = dsPreviewRailState.mockIndex <= 0 ? mocks.length - 1 : dsPreviewRailState.mockIndex - 1;
  dsPreviewRailSwitchMock(sectionId, mocks[nextIdx]);
}

function dsPreviewRailStepNext(fromPlay) {
  const sectionId = dsGetPreviewRailSectionId();
  if (!sectionId) return;

  if (sectionId === 'govWorkflows' && typeof gwStepNext === 'function') {
    if (!fromPlay) dsPreviewRailStopPlay();
    gwStepNext(fromPlay);
    return;
  }

  const mocks = dsPreviewRailMocks(sectionId);
  if (mocks.length <= 1) {
    if (!fromPlay) dsPreviewRailStopPlay();
    const key = mocks[0] || DS_PRODUCT_CONFIG?.[sectionId]?.defaultMock;
    const wrap = document.querySelector(`[data-ds-product="${sectionId}"]`);
    const ctx = wrap?.dsMockCtx || dsPreviewRailState.ctx || {};
    dsRenderPreviewRail(sectionId, key, ctx, { animate: true });
    return;
  }

  if (!fromPlay) dsPreviewRailStopPlay();
  const nextIdx = (dsPreviewRailState.mockIndex + 1) % mocks.length;
  dsPreviewRailSwitchMock(sectionId, mocks[nextIdx]);
}

function dsPreviewRailRestart() {
  const sectionId = dsGetPreviewRailSectionId();
  if (!sectionId) return;
  dsPreviewRailStopPlay();

  if (sectionId === 'govWorkflows' && typeof gwRestartWalkthrough === 'function') {
    gwRestartWalkthrough();
    return;
  }

  const mocks = dsPreviewRailMocks(sectionId);
  const first = mocks[0] || DS_PRODUCT_CONFIG?.[sectionId]?.defaultMock;
  dsPreviewRailSwitchMock(sectionId, first);
}

function dsSyncGovPreviewRail(payload = {}) {
  const sectionId = 'govWorkflows';
  if (dsGetPreviewRailSectionId() !== sectionId) return;

  const ctx = {
    stepTitle: payload.step?.title,
    stepProduct: payload.step?.product,
    stepIndex: payload.stepIndex,
    totalSteps: payload.total,
    personaName: payload.persona?.name,
    stateName: payload.sc?.state,
    animate: true,
  };

  dsPreviewRailState.ctx = ctx;
  dsRenderPreviewRail(sectionId, 'govWorkflowPreview', ctx, {
    animate: true,
    header: { title: payload.step?.title, sub: payload.step?.product },
  });
}

function dsInitStandalonePreviewRail(sectionId, opts = {}) {
  const cfg = DS_PRODUCT_CONFIG?.[sectionId];
  const meta = DS_PREVIEW_RAIL_META[sectionId];
  if (!cfg && !meta) return;

  const mockKey = opts.defaultMock || cfg?.defaultMock || meta?.defaultMock;
  if (!mockKey) return;

  dsRenderPreviewRail(sectionId, mockKey, opts.context || {}, { animate: true, transition: false });
  dsInitPreviewRailTabs(sectionId, mockKey);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!dsPreviewRailEl('ds-preview-rail')) return;
  dsInitPreviewRailState();

  dsPreviewRailEl('ds-preview-rail-head')?.addEventListener('click', ev => {
    const rail = dsPreviewRailEl('ds-preview-rail');
    if (!rail?.classList.contains('ds-preview-rail--minimized')) return;
    if (ev.target.closest('.ds-preview-rail-minimize')) return;
    dsTogglePreviewRail(false);
  });
});

window.dsTogglePreviewRail = dsTogglePreviewRail;
window.dsRenderPreviewRail = dsRenderPreviewRail;
window.dsRailCartoonWrap = dsRailCartoonWrap;
window.dsUpdatePreviewRailHeader = dsUpdatePreviewRailHeader;
window.dsPreviewRailSwitchMock = dsPreviewRailSwitchMock;
window.dsSyncPreviewRailTabs = dsSyncPreviewRailTabs;
window.dsPreviewRailStepPrev = dsPreviewRailStepPrev;
window.dsPreviewRailStepNext = dsPreviewRailStepNext;
window.dsPreviewRailTogglePlay = dsPreviewRailTogglePlay;
window.dsPreviewRailRestart = dsPreviewRailRestart;
window.dsSyncGovPreviewRail = dsSyncGovPreviewRail;
window.dsInitStandalonePreviewRail = dsInitStandalonePreviewRail;
window.dsInitPreviewRailTabs = dsInitPreviewRailTabs;
window.dsPreviewRailStopPlay = dsPreviewRailStopPlay;
