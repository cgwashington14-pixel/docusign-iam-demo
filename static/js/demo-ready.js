/* Pre-flight demo readiness indicator */

let demoReadyLastCheck = null;

async function demoReadyCheck() {
  const bar = document.getElementById('demo-ready-bar');
  const dot = document.getElementById('demo-ready-dot');
  const label = document.getElementById('demo-ready-label');
  if (!bar) return;

  bar.classList.add('demo-ready-bar--checking');
  if (label) label.textContent = 'Checking API…';

  try {
    const res = await fetch('/api/demo/health');
    const data = await res.json();
    demoReadyLastCheck = data;
    bar.classList.remove('demo-ready-bar--checking', 'demo-ready-bar--warn', 'demo-ready-bar--ok', 'demo-ready-bar--off');
    if (data.ok && data.api_ok) {
      bar.classList.add('demo-ready-bar--ok');
      if (dot) dot.title = 'Demo ready';
      if (label) {
        label.textContent = data.auth_method === 'oauth' ? 'Demo ready · OAuth live' : 'Demo ready · JWT live';
      }
    } else if (data.ok && !data.api_ok) {
      bar.classList.add('demo-ready-bar--warn');
      if (label) label.textContent = 'Token issue — refresh login';
    } else {
      bar.classList.add('demo-ready-bar--off');
      if (label) label.textContent = 'Guest mode — login for live API';
    }
    bar.dataset.status = data.ok && data.api_ok ? 'ready' : (data.ok ? 'warn' : 'off');
  } catch (_) {
    bar.classList.remove('demo-ready-bar--checking');
    bar.classList.add('demo-ready-bar--warn');
    if (label) label.textContent = 'Health check unavailable';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  demoReadyCheck();
  setInterval(demoReadyCheck, 120000);
});

window.demoReadyCheck = demoReadyCheck;
