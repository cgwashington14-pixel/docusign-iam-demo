/* Minimizable animated story rail — independent from inline product mocks */

const DS_PREVIEW_RAIL_MIN_KEY = 'ds-preview-rail-minimized';
const DS_PREVIEW_RAIL_PLAY_MS = 4800;

const DS_PREVIEW_RAIL_META = {
  home: { title: 'Day in the life', sub: 'Inbox → action → sync', chrome: 'erp', sticker: '🏠' },
  templates: { title: 'Template story', sub: 'Library → edit → send', chrome: 'send', sticker: '📋' },
  send: { title: 'Send story', sub: 'ERP → send → sync', chrome: 'send', sticker: '📤' },
  embedded: { title: 'Signing journey', sub: 'Portal → embed → return', chrome: 'sign', sticker: '✍️' },
  webforms: { title: 'Intake story', sub: 'Public form → desk → send', chrome: 'listener', sticker: '📝' },
  maestro: { title: 'Automation story', sub: 'Trigger → branch → ERP', chrome: 'post', sticker: '⚡' },
  agreementDesk: { title: 'Desk story', sub: 'Intake → triage → workspace', chrome: 'listener', sticker: '📥' },
  navigator: { title: 'Portfolio story', sub: 'Alerts → risk → audit', chrome: 'erp', sticker: '📊' },
  workspaces: { title: 'Collaboration story', sub: 'Invite → redline → file', chrome: 'listener', sticker: '🤝' },
  govWorkflows: { title: 'Value lens', sub: 'Business outcome per step', chrome: 'erp', sticker: '🏛️' },
  explorer: { title: 'Developer story', sub: 'Browse → auth → automate', chrome: 'post', sticker: '🔌' },
  agent: { title: 'Agent story', sub: 'Ask → act → reply', chrome: 'post', sticker: '🤖' },
};

const DS_RAIL_LIVE_ENTRY_STEP = {
  home: 'sign',
  send: 'deliver',
  embedded: 'embed',
  webforms: 'intake',
  maestro: 'action',
  agreementDesk: 'review',
  navigator: 'find',
  workspaces: 'redline',
  explorer: 'execute',
  agent: 'act',
};

const DS_RAIL_LIVE_SUCCESS_STEP = {
  send: 'sync',
  embedded: 'return',
  webforms: 'trigger',
  maestro: 'complete',
  explorer: 'execute',
  agent: 'reply',
};

function dsPreviewRailStoryFromUrl(sectionId) {
  const param = new URLSearchParams(window.location.search).get('story');
  if (!param) return null;
  const steps = dsPreviewRailSteps(sectionId);
  if (steps.includes(param)) return param;
  return null;
}

function dsPreviewRailUpdateUrl(sectionId, stepId) {
  if (sectionId === 'govWorkflows') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('story', stepId);
    history.replaceState(null, '', url);
  } catch (_) { /* ignore */ }
}

function dsPreviewRailAnnounce(sectionId, stepId) {
  const ann = dsPreviewRailEl('ds-preview-rail-announcer');
  if (!ann) return;
  const meta = window.DS_RAIL_STORY_META?.[`${sectionId}:${stepId}`];
  ann.textContent = meta?.title ? `Story step: ${meta.title}` : `Story step updated`;
}

function dsAdvanceStoryRail(sectionId, stepId) {
  if (dsGetPreviewRailSectionId() !== sectionId) return;
  const steps = dsPreviewRailSteps(sectionId);
  if (!steps.includes(stepId)) return;
  dsTogglePreviewRail(false);
  dsPreviewRailGoToStep(sectionId, stepId);
}

function dsSyncStoryRailOnLiveOpen(sectionId) {
  const stepId = DS_RAIL_LIVE_ENTRY_STEP[sectionId];
  if (stepId && dsGetPreviewRailSectionId() === sectionId) {
    dsPreviewRailGoToStep(sectionId, stepId);
  }
}

function dsSyncStoryRailOnLiveSuccess(sectionId) {
  const stepId = DS_RAIL_LIVE_SUCCESS_STEP[sectionId];
  if (stepId) dsAdvanceStoryRail(sectionId, stepId);
}

const dsPreviewRailState = {
  sectionId: null,
  stepIndex: 0,
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
    btn.setAttribute('aria-label', minimized ? 'Expand story preview' : 'Minimize story preview');
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

function dsPreviewRailSteps(sectionId) {
  if (sectionId === 'govWorkflows') return ['value'];
  return window.DS_RAIL_STORY_ORDER?.[sectionId] || [];
}

function dsUpdatePreviewRailHeader(sectionId, stepId, extra = {}) {
  const meta = DS_PREVIEW_RAIL_META[sectionId] || {};
  const storyMeta = window.DS_RAIL_STORY_META?.[`${sectionId}:${stepId}`];

  const titleEl = dsPreviewRailEl('ds-preview-rail-title');
  const subEl = dsPreviewRailEl('ds-preview-rail-sub');
  const counterEl = dsPreviewRailEl('ds-preview-rail-counter');

  if (titleEl) titleEl.textContent = extra.title || storyMeta?.title || meta.title || 'Story preview';
  if (subEl) subEl.textContent = extra.sub || storyMeta?.sub || meta.sub || '';

  const steps = dsPreviewRailSteps(sectionId);
  const idx = sectionId === 'govWorkflows'
    ? (extra.stepIndex ?? dsPreviewRailState.stepIndex)
    : Math.max(0, steps.indexOf(stepId));
  const total = sectionId === 'govWorkflows' ? (extra.totalSteps || steps.length) : steps.length;
  if (counterEl && total > 0) {
    counterEl.textContent = `${idx + 1} / ${total}`;
    counterEl.hidden = false;
  }

  dsPreviewRailEl('ds-preview-rail-labels')?.classList.add('ds-preview-rail-labels--pulse');
  setTimeout(() => {
    dsPreviewRailEl('ds-preview-rail-labels')?.classList.remove('ds-preview-rail-labels--pulse');
  }, 650);
}

function dsRailCartoonWrap(html, sectionId, stepId, chromeLabel) {
  const meta = DS_PREVIEW_RAIL_META[sectionId] || {};
  const storyMeta = window.DS_RAIL_STORY_META?.[`${sectionId}:${stepId}`];
  const label = chromeLabel || storyMeta?.title || meta.title || 'Story';
  const chrome = meta.chrome || 'send';

  return `
    <div class="ds-prod-frame ds-prod-frame--connect-preview ds-prod-cpv-cartoon ds-preview-rail-frame">
      <div class="ds-prod-cpv-chrome ds-prod-cpv-chrome--${chrome}">
        <span class="ds-prod-cpv-flow-step ds-preview-rail-chrome-title">${label}</span>
      </div>
      <div class="ds-preview-rail-body">${html}</div>
    </div>`;
}

function dsMountPreviewRailHtml(html) {
  const host = dsPreviewRailEl('ds-preview-rail-host');
  if (!host) return;
  host.innerHTML = html;
  host.removeAttribute('aria-busy');
}

function dsRenderPreviewRailStory(sectionId, stepId, ctx = {}, opts = {}) {
  const host = dsPreviewRailEl('ds-preview-rail-host');
  if (!host || typeof window.DS_RENDER_RAIL !== 'object') return;

  const animate = opts.animate !== false;
  const railCtx = { ...ctx, sectionId, stepId, animate };

  let raw;
  if (sectionId === 'govWorkflows') {
    raw = window.DS_RENDER_RAIL.govWorkflowValue(railCtx);
  } else {
    raw = window.DS_RENDER_RAIL.railStory(railCtx);
  }

  const chromeLabel = opts.header?.title || ctx.valueHeadline || ctx.stepTitle;
  const wrapped = dsRailCartoonWrap(raw, sectionId, stepId, chromeLabel);
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

  const steps = dsPreviewRailSteps(sectionId);
  dsPreviewRailState.stepIndex = sectionId === 'govWorkflows'
    ? (ctx.stepIndex ?? 0)
    : Math.max(0, steps.indexOf(stepId));

  dsUpdatePreviewRailHeader(sectionId, stepId, {
    ...opts.header,
    stepIndex: ctx.stepIndex,
    totalSteps: ctx.totalSteps,
  });

  dsUpdatePreviewRailDots(sectionId, stepId, ctx);
}

function dsUpdatePreviewRailDots(sectionId, stepId, ctx = {}) {
  const dotsEl = dsPreviewRailEl('ds-preview-rail-dots');
  if (!dotsEl) return;

  if (sectionId === 'govWorkflows') {
    dotsEl.hidden = true;
    return;
  }

  const steps = dsPreviewRailSteps(sectionId);
  if (steps.length <= 1) {
    dotsEl.hidden = true;
    return;
  }

  dotsEl.hidden = false;
  const current = steps.indexOf(stepId);
  dotsEl.innerHTML = steps.map((id, i) =>
    `<button type="button" class="ds-preview-rail-dot${i === current ? ' ds-preview-rail-dot--on' : ''}"
      onclick="dsPreviewRailGoToStep('${sectionId}','${id}')" aria-label="Story step ${i + 1}"></button>`
  ).join('');
}

function dsPreviewRailGoToStep(sectionId, stepId) {
  dsPreviewRailStopPlay();
  const wrap = document.querySelector(`[data-ds-product="${sectionId}"]`);
  const ctx = wrap?.dsMockCtx || dsPreviewRailState.ctx || {};
  dsRenderPreviewRailStory(sectionId, stepId, ctx, { animate: true });
  dsPreviewRailUpdateUrl(sectionId, stepId);
  dsPreviewRailAnnounce(sectionId, stepId);
}

function dsInitPreviewRailStory(sectionId, opts = {}) {
  const steps = dsPreviewRailSteps(sectionId);
  const fromUrl = dsPreviewRailStoryFromUrl(sectionId);
  const stepId = fromUrl
    || (sectionId === 'govWorkflows' ? 'value' : (steps[0] || 'prefill'));
  dsRenderPreviewRailStory(sectionId, stepId, opts.context || {}, {
    animate: true,
    transition: false,
  });
  if (fromUrl) dsPreviewRailUpdateUrl(sectionId, stepId);
}

function dsPreviewRailStopPlay() {
  dsPreviewRailState.playing = false;
  clearInterval(dsPreviewRailState.timer);
  dsPreviewRailState.timer = null;
  dsPreviewRailEl('ds-preview-rail')?.classList.remove('ds-preview-rail--playing');
  const btn = dsPreviewRailEl('ds-preview-rail-play');
  if (btn) {
    btn.textContent = '▶';
    btn.setAttribute('aria-label', 'Play story walkthrough');
  }
}

function dsPreviewRailStartPlay() {
  const sectionId = dsGetPreviewRailSectionId();
  if (!sectionId) return;

  dsPreviewRailState.playing = true;
  dsPreviewRailEl('ds-preview-rail')?.classList.add('ds-preview-rail--playing');
  const btn = dsPreviewRailEl('ds-preview-rail-play');
  if (btn) {
    btn.textContent = '⏸';
    btn.setAttribute('aria-label', 'Pause story walkthrough');
  }

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

  const steps = dsPreviewRailSteps(sectionId);
  if (!steps.length) return;

  const prevIdx = dsPreviewRailState.stepIndex <= 0 ? steps.length - 1 : dsPreviewRailState.stepIndex - 1;
  dsPreviewRailGoToStep(sectionId, steps[prevIdx]);
}

function dsPreviewRailStepNext(fromPlay) {
  const sectionId = dsGetPreviewRailSectionId();
  if (!sectionId) return;

  if (sectionId === 'govWorkflows' && typeof gwStepNext === 'function') {
    if (!fromPlay) dsPreviewRailStopPlay();
    gwStepNext(fromPlay);
    return;
  }

  const steps = dsPreviewRailSteps(sectionId);
  if (!steps.length) return;

  if (!fromPlay) dsPreviewRailStopPlay();
  const nextIdx = (dsPreviewRailState.stepIndex + 1) % steps.length;
  dsPreviewRailGoToStep(sectionId, steps[nextIdx]);
}

function dsPreviewRailRestart() {
  const sectionId = dsGetPreviewRailSectionId();
  if (!sectionId) return;
  dsPreviewRailStopPlay();

  if (sectionId === 'govWorkflows' && typeof gwRestartWalkthrough === 'function') {
    gwRestartWalkthrough();
    return;
  }

  const steps = dsPreviewRailSteps(sectionId);
  if (steps.length) dsPreviewRailGoToStep(sectionId, steps[0]);
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
    valueHeadline: payload.valueHeadline,
    valueText: payload.valueText,
    valueAudience: payload.valueAudience,
    animate: true,
  };

  dsPreviewRailState.ctx = ctx;
  dsRenderPreviewRailStory(sectionId, 'value', ctx, {
    animate: true,
    header: {
      title: payload.valueHeadline || payload.step?.title,
      sub: `${payload.step?.product || 'IAM'} · Value lens`,
      stepIndex: payload.stepIndex,
      totalSteps: payload.total,
    },
  });
}

function dsInitStandalonePreviewRail(sectionId, opts = {}) {
  if (!DS_PREVIEW_RAIL_META[sectionId] && !window.DS_RAIL_STORY_ORDER?.[sectionId]) return;
  dsInitPreviewRailStory(sectionId, opts);
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
window.dsRenderPreviewRailStory = dsRenderPreviewRailStory;
window.dsInitPreviewRailStory = dsInitPreviewRailStory;
window.dsPreviewRailGoToStep = dsPreviewRailGoToStep;
window.dsPreviewRailStepPrev = dsPreviewRailStepPrev;
window.dsPreviewRailStepNext = dsPreviewRailStepNext;
window.dsPreviewRailTogglePlay = dsPreviewRailTogglePlay;
window.dsPreviewRailRestart = dsPreviewRailRestart;
window.dsSyncGovPreviewRail = dsSyncGovPreviewRail;
window.dsInitStandalonePreviewRail = dsInitStandalonePreviewRail;
window.dsPreviewRailStopPlay = dsPreviewRailStopPlay;
window.dsAdvanceStoryRail = dsAdvanceStoryRail;
window.dsSyncStoryRailOnLiveOpen = dsSyncStoryRailOnLiveOpen;
window.dsSyncStoryRailOnLiveSuccess = dsSyncStoryRailOnLiveSuccess;
