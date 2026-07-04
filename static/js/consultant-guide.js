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

function toggleConsultantGuide(force) {
  const root = document.getElementById('consultant-guide');
  if (!root) return;
  const open = force !== undefined ? force : !root.classList.contains('open');
  root.classList.toggle('open', open);
}

document.addEventListener('DOMContentLoaded', () => {
  consultantGuideUpdateMode();
  document.getElementById('consultant-guide-toggle')?.addEventListener('click', () => {
    toggleConsultantGuide();
  });
  document.addEventListener('click', (e) => {
    const root = document.getElementById('consultant-guide');
    if (!root?.classList.contains('open')) return;
    if (!root.contains(e.target)) root.classList.remove('open');
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
