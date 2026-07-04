/* URL view presets — ?view=scv|hl|executive&play=1&tab=integrations */

const DEMO_VIEW_PRESETS = {
  scv: { scv: '1', hl: '0', executive: '0' },
  hl: { scv: '0', hl: '1', executive: '0' },
  highlevel: { scv: '0', hl: '1', executive: '0' },
  executive: { scv: '0', hl: '0', executive: '1' },
  consultant: { scv: '0', hl: '0', executive: '0', business: '1', present: '1', tech: '0' },
  technical: { scv: '0', hl: '0', executive: '0', business: '0', present: '0', tech: '1' },
};

function demoPresetApplyStorage(preset) {
  const p = DEMO_VIEW_PRESETS[preset];
  if (!p) return false;
  if (p.scv !== undefined) localStorage.setItem('ds-scv', p.scv);
  if (p.hl !== undefined) localStorage.setItem('ds-high-level', p.hl);
  if (p.executive !== undefined) localStorage.setItem('ds-executive', p.executive);
  if (p.business !== undefined) localStorage.setItem('ds-business', p.business);
  if (p.present !== undefined) localStorage.setItem('ds-present', p.present);
  if (p.tech !== undefined) localStorage.setItem('ds-tech', p.tech);
  return true;
}

function applyDemoViewFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const view = (params.get('view') || '').toLowerCase();
  if (view && demoPresetApplyStorage(view)) {
    if (typeof demoAnalyticsTrack === 'function') {
      demoAnalyticsTrack('view_preset', { view });
    }
  }

  if (params.get('play') === '1') {
    sessionStorage.setItem('gw-user-start-play', '1');
  }

  const scvOn = localStorage.getItem('ds-scv') === '1';
  const hlOn = localStorage.getItem('ds-high-level') === '1';
  const execOn = localStorage.getItem('ds-executive') === '1';

  if (scvOn && typeof toggleScvMode === 'function') {
    toggleScvMode(true);
  } else if (hlOn && typeof toggleHighLevelMode === 'function') {
    toggleHighLevelMode(true);
  } else if (execOn && typeof toggleExecutiveMode === 'function') {
    toggleExecutiveMode(true);
  } else {
    if (localStorage.getItem('ds-present') === '1' && typeof togglePresentMode === 'function') {
      togglePresentMode(true);
    }
    if (localStorage.getItem('ds-business') === '1' && typeof toggleBusinessMode === 'function') {
      toggleBusinessMode(true);
    }
    if (localStorage.getItem('ds-tech') === '1' && typeof toggleTechMode === 'function') {
      toggleTechMode(true);
    }
  }
}

window.applyDemoViewFromUrl = applyDemoViewFromUrl;
window.demoPresetApplyStorage = demoPresetApplyStorage;
