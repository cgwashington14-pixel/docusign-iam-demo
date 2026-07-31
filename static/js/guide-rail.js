/* Collapsible SCView / High-level guide rails — click tab to open, click minimize to hide */

const GUIDE_RAIL_STORAGE = {
  scv: 'ds-scv-rail-collapsed',
  hl: 'ds-hl-rail-collapsed',
};

function guideRailCollapsed(type) {
  return document.body.classList.contains(`${type}-rail-collapsed`);
}

function guideRailSetCollapsed(type, collapsed) {
  document.body.classList.toggle(`${type}-rail-collapsed`, collapsed);
  localStorage.setItem(GUIDE_RAIL_STORAGE[type], collapsed ? '1' : '0');
  document.querySelectorAll(`.guide-rail-collapse-btn[data-rail-type="${type}"]`).forEach(btn => {
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    btn.setAttribute('aria-label', collapsed ? 'Open guide panel' : 'Minimize guide panel');
  });
  const rail = type === 'scv'
    ? document.getElementById('scv-guide-rail')
    : document.getElementById('hl-focus-rail');
  if (rail) {
    rail.classList.toggle('is-rail-tab', !!collapsed);
    rail.classList.toggle('is-rail-open', !collapsed);
  }
}

function guideRailToggle(type) {
  guideRailSetCollapsed(type, !guideRailCollapsed(type));
  if (typeof syncTopbarOffset === 'function') syncTopbarOffset();
}

function guideRailRestore(type) {
  /* Default to tab (collapsed). Story / focus pages always start as a tab. */
  const forceTab = document.body.classList.contains('is-page')
    || document.documentElement.classList.contains('is-story-focus')
    || document.body.classList.contains('is-focus-mode')
    || localStorage.getItem(GUIDE_RAIL_STORAGE[type]) !== '0';
  guideRailSetCollapsed(type, forceTab);
}

function guideRailInit() {
  document.querySelectorAll('.guide-rail-collapse-btn').forEach(btn => {
    const type = btn.dataset.railType;
    if (!type) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      guideRailToggle(type);
    });
  });

  /* Click the vertical tab strip to open the walkthrough */
  document.querySelectorAll('.scv-guide-rail .guide-rail-toolbar, .hl-focus-rail .guide-rail-toolbar').forEach(toolbar => {
    toolbar.addEventListener('click', (e) => {
      if (e.target.closest('.guide-rail-collapse-btn')) return;
      const type = toolbar.closest('.scv-guide-rail') ? 'scv' : 'hl';
      if (guideRailCollapsed(type)) {
        guideRailSetCollapsed(type, false);
        if (typeof syncTopbarOffset === 'function') syncTopbarOffset();
      }
    });
  });

  guideRailRestore('scv');
  guideRailRestore('hl');
}

window.guideRailToggle = guideRailToggle;
window.guideRailSetCollapsed = guideRailSetCollapsed;
window.guideRailRestore = guideRailRestore;

document.addEventListener('DOMContentLoaded', guideRailInit);
