/* Topbar hamburger — account, view modes, demo paths */

function topbarMenuClose() {
  const panel = document.getElementById('topbar-menu-panel');
  const trigger = document.getElementById('topbar-menu-trigger');
  const backdrop = document.getElementById('topbar-menu-backdrop');
  if (panel) panel.hidden = true;
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  if (backdrop) backdrop.hidden = true;
  document.body.classList.remove('topbar-menu-open');
}

function topbarMenuOpen() {
  if (typeof toggleConsultantGuide === 'function') toggleConsultantGuide(false);
  const panel = document.getElementById('topbar-menu-panel');
  const trigger = document.getElementById('topbar-menu-trigger');
  let backdrop = document.getElementById('topbar-menu-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.id = 'topbar-menu-backdrop';
    backdrop.className = 'topbar-menu-backdrop';
    backdrop.setAttribute('aria-label', 'Close demo menu');
    backdrop.hidden = true;
    backdrop.addEventListener('click', topbarMenuClose);
    document.body.appendChild(backdrop);
  }
  if (panel) panel.hidden = false;
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  backdrop.hidden = false;
  document.body.classList.add('topbar-menu-open');
}

function topbarMenuToggle() {
  const panel = document.getElementById('topbar-menu-panel');
  if (panel?.hidden) topbarMenuOpen();
  else topbarMenuClose();
}

function topbarMenuInit() {
  document.getElementById('topbar-menu-trigger')?.addEventListener('click', (e) => {
    e.stopPropagation();
    topbarMenuToggle();
  });

  document.addEventListener('click', (e) => {
    const panel = document.getElementById('topbar-menu-panel');
    const trigger = document.getElementById('topbar-menu-trigger');
    if (panel?.hidden) return;
    if (panel?.contains(e.target) || trigger?.contains(e.target)) return;
    if (document.getElementById('consultant-guide')?.contains(e.target)) return;
    topbarMenuClose();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const panel = document.getElementById('topbar-menu-panel');
    const guide = document.getElementById('consultant-guide');
    if (guide?.classList.contains('open')) return;
    if (!panel?.hidden) {
      e.preventDefault();
      topbarMenuClose();
    }
  });

  const origGuideToggle = window.toggleConsultantGuide;
  if (typeof origGuideToggle === 'function') {
    window.toggleConsultantGuide = function (force) {
      const opening = force !== false && !document.getElementById('consultant-guide')?.classList.contains('open');
      if (opening) topbarMenuClose();
      return origGuideToggle(force);
    };
  }
}

document.addEventListener('DOMContentLoaded', topbarMenuInit);
window.topbarMenuClose = topbarMenuClose;
window.topbarMenuOpen = topbarMenuOpen;
window.topbarMenuToggle = topbarMenuToggle;
