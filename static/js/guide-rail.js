/* Collapsible SCView / High-level guide rails */

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
    btn.setAttribute('aria-label', collapsed ? 'Expand guide panel' : 'Minimize guide panel');
  });
}

function guideRailToggle(type) {
  guideRailSetCollapsed(type, !guideRailCollapsed(type));
  if (typeof syncTopbarOffset === 'function') syncTopbarOffset();
}

function guideRailRestore(type) {
  /* Story pages only tuck the walkthrough when Focus mode is on */
  if (document.documentElement.classList.contains('is-story-focus') || document.body.classList.contains('is-focus-mode')) {
    guideRailSetCollapsed(type, true);
    return;
  }
  if (localStorage.getItem(GUIDE_RAIL_STORAGE[type]) === '1') {
    guideRailSetCollapsed(type, true);
  }
}

function guideRailInit() {
  document.querySelectorAll('.guide-rail-collapse-btn').forEach(btn => {
    const type = btn.dataset.railType;
    if (!type) return;
    btn.addEventListener('click', () => guideRailToggle(type));
  });
  guideRailRestore('scv');
  guideRailRestore('hl');
}

window.guideRailToggle = guideRailToggle;
window.guideRailSetCollapsed = guideRailSetCollapsed;
window.guideRailRestore = guideRailRestore;

document.addEventListener('DOMContentLoaded', guideRailInit);
