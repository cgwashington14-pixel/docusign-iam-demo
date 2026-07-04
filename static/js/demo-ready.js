/* Compact API status pill in topbar + offline demo hint */

let demoReadyLastCheck = null;
let offlineHintShown = false;

async function demoReadyCheck() {
  const pill = document.getElementById('demo-status-pill');
  const dot = document.getElementById('demo-status-dot');
  const label = document.getElementById('demo-status-label');
  if (!pill) return;

  pill.classList.add('demo-status-pill--checking');
  if (label) label.textContent = 'Checking…';

  try {
    const res = await fetch('/api/demo/health');
    const data = await res.json();
    demoReadyLastCheck = data;
    pill.classList.remove('demo-status-pill--checking', 'demo-status-pill--warn', 'demo-status-pill--ok', 'demo-status-pill--off');
    pill.title = '';

    if (data.ok && data.api_ok) {
      pill.classList.add('demo-status-pill--ok');
      if (label) label.textContent = data.auth_method === 'oauth' ? 'API live' : 'JWT live';
      pill.title = 'Demo ready — live API connected. Click to refresh.';
      pill.dataset.status = 'ready';
    } else if (data.ok && !data.api_ok) {
      pill.classList.add('demo-status-pill--warn');
      if (label) label.textContent = 'Token refresh';
      pill.title = 'Token may be expired — refresh login. Offline: try SCView + Connect walkthrough.';
      pill.dataset.status = 'warn';
      demoReadyShowOfflineHint();
    } else {
      pill.classList.add('demo-status-pill--off');
      if (label) label.textContent = 'Guest';
      pill.title = 'Guest mode — no live API. Try /gov-workflows?view=scv or /webhooks sample walkthrough.';
      pill.dataset.status = 'off';
      demoReadyShowOfflineHint();
    }
  } catch (_) {
    pill.classList.remove('demo-status-pill--checking');
    pill.classList.add('demo-status-pill--warn');
    if (label) label.textContent = 'Offline?';
    pill.title = 'Health check failed';
  }
}

function demoReadyShowOfflineHint() {
  if (offlineHintShown || sessionStorage.getItem('ds-offline-hint') === '1') return;
  offlineHintShown = true;
  sessionStorage.setItem('ds-offline-hint', '1');
  setTimeout(() => {
    if (typeof showToast === 'function') {
      showToast('No live API? SCView + Gov Workflows or Connect sample walkthrough work offline.', 'default', 5000);
    }
  }, 1200);
}

document.addEventListener('DOMContentLoaded', () => {
  demoReadyCheck();
  setInterval(demoReadyCheck, 120000);
  document.getElementById('demo-status-pill')?.addEventListener('click', demoReadyCheck);
});

window.demoReadyCheck = demoReadyCheck;
window.demoReadyLastCheck = () => demoReadyLastCheck;
