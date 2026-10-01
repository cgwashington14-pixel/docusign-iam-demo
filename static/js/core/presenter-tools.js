/* Presenter keyboard shortcuts + cheat sheet overlay */

const PRESENTER_SHORTCUTS = [
  { keys: '?', desc: 'Show / hide this cheat sheet' },
  { keys: '← →', desc: 'Previous / next Gov Workflows step' },
  { keys: 'Space', desc: 'Play or pause walkthrough (Gov Workflows)' },
  { keys: 'R', desc: 'Restart walkthrough from step 1' },
  { keys: 'Esc', desc: 'Pause walkthrough or close panels' },
  { keys: 'P', desc: 'Toggle Presenter mode' },
  { keys: 'B', desc: 'Toggle Business View' },
  { keys: 'T', desc: 'Toggle API Details' },
];

function presenterIsTyping() {
  const el = document.activeElement;
  if (!el) return false;
  return el.matches('input, textarea, select, [contenteditable="true"]');
}

function presenterToggleCheatSheet(force) {
  const sheet = document.getElementById('presenter-cheat-sheet');
  if (!sheet) return;
  const open = force !== undefined ? force : sheet.hidden;
  sheet.hidden = !open;
  if (open) sheet.querySelector('.presenter-cheat-close')?.focus();
}

function gwRestartWalkthrough() {
  if (typeof gwGoToStep !== 'function') return;
  gwGoToStep(0);
  if (typeof showToast === 'function') {
    showToast('Walkthrough restarted at step 1');
  }
  document.getElementById('gw-visual-hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function presenterHandleKeydown(e) {
  if (presenterIsTyping()) {
    if (e.key === 'Escape') presenterToggleCheatSheet(false);
    return;
  }

  const sheet = document.getElementById('presenter-cheat-sheet');
  if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
    e.preventDefault();
    presenterToggleCheatSheet(sheet?.hidden !== false);
    return;
  }
  if (e.key === 'Escape') {
    presenterToggleCheatSheet(false);
    if (typeof toggleConsultantGuide === 'function') toggleConsultantGuide(false);
    if (typeof modesMenuClose === 'function') modesMenuClose();
    return;
  }

  const onGw = !!document.getElementById('gw-visual-hero');
  if (onGw && e.key === ' ' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    if (typeof gwTogglePlay === 'function') gwTogglePlay();
    return;
  }
  if (onGw && (e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    gwRestartWalkthrough();
    return;
  }

  if (e.key === 'p' || e.key === 'P') {
    if (typeof togglePresentMode === 'function') togglePresentMode();
    return;
  }
  if (e.key === 'b' || e.key === 'B') {
    if (typeof toggleBusinessMode === 'function') toggleBusinessMode();
    return;
  }
  if (e.key === 't' || e.key === 'T') {
    if (typeof toggleTechMode === 'function') toggleTechMode();
  }
}

function presenterInitCheatSheet() {
  if (document.getElementById('presenter-cheat-sheet')) return;
  const el = document.createElement('div');
  el.id = 'presenter-cheat-sheet';
  el.className = 'presenter-cheat-sheet';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Presenter keyboard shortcuts');
  el.innerHTML = `
    <div class="presenter-cheat-inner">
      <div class="presenter-cheat-head">
        <h2>Presenter shortcuts</h2>
        <button type="button" class="presenter-cheat-close" aria-label="Close">✕</button>
      </div>
      <ul class="presenter-cheat-list">
        ${PRESENTER_SHORTCUTS.map(s => `
          <li><kbd>${s.keys}</kbd><span>${s.desc}</span></li>`).join('')}
      </ul>
      <p class="presenter-cheat-tip">Press <kbd>?</kbd> anytime to toggle this panel.</p>
    </div>`;
  document.body.appendChild(el);
  el.querySelector('.presenter-cheat-close')?.addEventListener('click', () => presenterToggleCheatSheet(false));
  el.addEventListener('click', (e) => {
    if (e.target === el) presenterToggleCheatSheet(false);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  presenterInitCheatSheet();
  document.addEventListener('keydown', presenterHandleKeydown);
});

window.gwRestartWalkthrough = gwRestartWalkthrough;
window.presenterToggleCheatSheet = presenterToggleCheatSheet;
