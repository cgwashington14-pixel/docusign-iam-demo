/* Executive View — one toggle for leadership demos (visuals on, API noise off) */

const EXEC_STORAGE_KEY = 'ds-executive';
const EXEC_SAVED_KEY = 'ds-executive-saved-modes';

function executiveModeActive() {
  return document.body.classList.contains('executive-mode');
}

function executiveSaveSubModes() {
  if (sessionStorage.getItem(EXEC_SAVED_KEY)) return;
  sessionStorage.setItem(EXEC_SAVED_KEY, JSON.stringify({
    business: localStorage.getItem('ds-business'),
    present: localStorage.getItem('ds-present'),
    tech: localStorage.getItem('ds-tech'),
  }));
}

function executiveRestoreSubModes() {
  const raw = sessionStorage.getItem(EXEC_SAVED_KEY);
  sessionStorage.removeItem(EXEC_SAVED_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (typeof toggleBusinessMode === 'function') toggleBusinessMode(saved.business === '1');
    if (typeof togglePresentMode === 'function') togglePresentMode(saved.present === '1');
    if (typeof toggleTechMode === 'function') toggleTechMode(saved.tech === '1');
  } catch (_) { /* ignore */ }
}

function executiveApplySubModes(on) {
  if (on) {
    executiveSaveSubModes();
    if (typeof toggleScvMode === 'function' && scvModeActive()) toggleScvMode(false);
    if (typeof toggleBusinessMode === 'function') toggleBusinessMode(true);
    if (typeof togglePresentMode === 'function') togglePresentMode(true);
    if (typeof toggleTechMode === 'function') toggleTechMode(false);
  } else {
    executiveRestoreSubModes();
  }
}

function executiveUpdateBanner(on) {
  const banner = document.getElementById('executive-banner');
  if (banner) banner.style.display = on ? '' : 'none';
}

function executiveUpdateHome(on) {
  const execHome = document.getElementById('executive-home');
  if (execHome) execHome.style.display = on ? '' : 'none';
}

function executiveUpdateGovSub(on) {
  const sub = document.getElementById('gw-page-sub');
  if (!sub) return;
  if (on) {
    if (!sub.dataset.defaultSub) sub.dataset.defaultSub = sub.innerHTML;
    sub.innerHTML = 'Picture-first walkthrough for directors and program leaders — one contract from intake to ERP sync. Use <strong>▶ Play</strong> or arrow keys to advance.';
  } else if (sub.dataset.defaultSub) {
    const bizOn = document.body.classList.contains('business-mode');
    if (!bizOn) sub.innerHTML = sub.dataset.defaultSub;
  }
}

function executiveRerenderGov() {
  if (typeof gwRenderStep === 'function' && document.getElementById('gw-visual-hero')) {
    gwRenderStep();
  }
  if (typeof wfLoadGovEmbedForms === 'function' && document.getElementById('wf-gov-embed-grid')) {
    wfLoadGovEmbedForms();
  }
}

function toggleExecutiveMode(force) {
  const on = force !== undefined ? force : !executiveModeActive();
  if (on && typeof scvModeActive === 'function' && scvModeActive()) {
    toggleScvMode(false);
  }
  if (on && typeof hlModeActive === 'function' && hlModeActive()) {
    toggleHighLevelMode(false);
  }
  document.body.classList.toggle('executive-mode', on);

  const btn = document.getElementById('executive-toggle');
  if (btn) {
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? 'Executive On' : 'Executive View';
  }

  localStorage.setItem(EXEC_STORAGE_KEY, on ? '1' : '0');
  executiveApplySubModes(on);
  executiveUpdateBanner(on);
  executiveUpdateHome(on);
  executiveUpdateGovSub(on);
  executiveRerenderGov();

  if (on && typeof showToast === 'function') {
    showToast('Executive View on — big visuals, no API clutter');
  }
}

window.toggleExecutiveMode = toggleExecutiveMode;
window.executiveModeActive = executiveModeActive;
