/* Compact view-modes dropdown for narrow screens */

const MODES_MENU_ITEMS = [
  { id: 'scv-toggle', label: 'SCView', onLabel: 'SCView On', fn: 'toggleScvMode' },
  { id: 'hl-toggle', label: 'High-level', onLabel: 'High-level On', fn: 'toggleHighLevelMode' },
  { id: 'executive-toggle', label: 'Executive View', onLabel: 'Executive On', fn: 'toggleExecutiveMode', hideClass: 'hl-hide' },
  { id: 'present-toggle', label: 'Present', onLabel: 'Presenting', fn: 'togglePresentMode', hideClass: 'exec-hide hl-hide' },
  { id: 'business-toggle', label: 'Business View', onLabel: 'Business On', fn: 'toggleBusinessMode', hideClass: 'exec-hide hl-hide' },
  { id: 'tech-toggle', label: 'API Details', onLabel: 'API Details On', fn: 'toggleTechMode' },
];

function modesMenuClose() {
  const panel = document.getElementById('modes-menu-panel');
  const trigger = document.getElementById('modes-menu-trigger');
  if (panel) panel.hidden = true;
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function modesMenuOpen() {
  modesMenuSyncLabels();
  const panel = document.getElementById('modes-menu-panel');
  const trigger = document.getElementById('modes-menu-trigger');
  if (panel) panel.hidden = false;
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
}

function modesMenuToggle() {
  const panel = document.getElementById('modes-menu-panel');
  if (panel?.hidden) modesMenuOpen();
  else modesMenuClose();
}

function modesMenuSyncLabels() {
  MODES_MENU_ITEMS.forEach(item => {
    const src = document.getElementById(item.id);
    const menuBtn = document.querySelector(`.modes-menu-item[data-mode-id="${item.id}"]`);
    if (!src || !menuBtn) return;
    const on = src.classList.contains('active') || src.getAttribute('aria-pressed') === 'true';
    menuBtn.classList.toggle('active', on);
    menuBtn.textContent = on ? (item.onLabel || item.label) : item.label;
    menuBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    menuBtn.hidden = !src || window.getComputedStyle(src).display === 'none';
  });
  const active = MODES_MENU_ITEMS.find(item => {
    const src = document.getElementById(item.id);
    return src && (src.classList.contains('active') || src.getAttribute('aria-pressed') === 'true');
  });
  const summary = document.getElementById('modes-menu-summary');
  if (summary) summary.textContent = active ? active.onLabel || active.label : 'View modes';
}

function modesMenuBuild() {
  const panel = document.getElementById('modes-menu-panel');
  if (!panel || panel.childElementCount) return;
  MODES_MENU_ITEMS.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'modes-menu-item';
    btn.dataset.modeId = item.id;
    btn.setAttribute('role', 'menuitem');
    btn.textContent = item.label;
    btn.addEventListener('click', () => {
      const fn = window[item.fn];
      if (typeof fn === 'function') fn();
      modesMenuSyncLabels();
      modesMenuClose();
    });
    panel.appendChild(btn);
  });
}

function modesMenuInit() {
  modesMenuBuild();
  const trigger = document.getElementById('modes-menu-trigger');
  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    modesMenuToggle();
  });
  document.addEventListener('click', (e) => {
    const wrap = document.querySelector('.topbar-modes-wrap');
    if (wrap && !wrap.contains(e.target)) modesMenuClose();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modesMenuClose();
  });
  modesMenuSyncLabels();
  ['toggleScvMode', 'toggleHighLevelMode', 'toggleExecutiveMode', 'togglePresentMode', 'toggleBusinessMode', 'toggleTechMode'].forEach(fn => {
    const orig = window[fn];
    if (typeof orig !== 'function') return;
    window[fn] = function (...args) {
      const result = orig.apply(this, args);
      modesMenuSyncLabels();
      return result;
    };
  });
}

document.addEventListener('DOMContentLoaded', modesMenuInit);
window.modesMenuSyncLabels = modesMenuSyncLabels;
