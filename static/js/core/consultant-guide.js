/* Demo paths & presenter guide for solutions consultants */

function consultantGuideModeLabel() {
  if (document.body.classList.contains('scv-mode')) return 'SCView · business audience';
  if (document.body.classList.contains('high-level-mode')) return 'High-level · guided moments';
  if (document.body.classList.contains('executive-mode')) return 'Executive audience';
  if (document.body.classList.contains('tech-mode')) return 'Technical audience';
  if (document.body.classList.contains('business-mode')) return 'Business audience';
  return 'Consultant · full portal';
}

function consultantGuideUpdateMode() {
  const el = document.getElementById('consultant-guide-mode');
  if (el) el.textContent = consultantGuideModeLabel();
}

function consultantGuideFocusables(root) {
  return Array.from(root.querySelectorAll(
    'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null);
}

function toggleConsultantGuide(force) {
  const root = document.getElementById('consultant-guide');
  const toggle = document.getElementById('consultant-guide-toggle');
  if (!root) return;
  const open = force !== undefined ? force : !root.classList.contains('open');
  root.classList.toggle('open', open);
  if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    root.dataset.prevFocus = document.activeElement?.id || '';
    const panel = root.querySelector('.consultant-guide-panel');
    const first = consultantGuideFocusables(panel || root)[0];
    if (first) first.focus();
  } else if (toggle) {
    toggle.focus();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  consultantGuideUpdateMode();
  document.getElementById('consultant-guide-toggle')?.addEventListener('click', () => {
    toggleConsultantGuide();
  });
  document.addEventListener('click', (e) => {
    const root = document.getElementById('consultant-guide');
    if (!root?.classList.contains('open')) return;
    if (!root.contains(e.target)) toggleConsultantGuide(false);
  });
  document.addEventListener('keydown', (e) => {
    const root = document.getElementById('consultant-guide');
    if (!root?.classList.contains('open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      toggleConsultantGuide(false);
      return;
    }
    if (e.key !== 'Tab') return;
    const panel = root.querySelector('.consultant-guide-panel');
    if (!panel) return;
    const focusables = consultantGuideFocusables(panel);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
});

const _origExec = window.toggleExecutiveMode;
if (typeof _origExec === 'function') {
  window.toggleExecutiveMode = function (force) {
    _origExec(force);
    consultantGuideUpdateMode();
  };
}
const _origHl = window.toggleHighLevelMode;
if (typeof _origHl === 'function') {
  window.toggleHighLevelMode = function (force) {
    _origHl(force);
    consultantGuideUpdateMode();
  };
}
['toggleBusinessMode', 'toggleTechMode', 'togglePresentMode'].forEach(fn => {
  const orig = window[fn];
  if (typeof orig !== 'function') return;
  window[fn] = function (force) {
    orig(force);
    consultantGuideUpdateMode();
  };
});

window.toggleConsultantGuide = toggleConsultantGuide;
