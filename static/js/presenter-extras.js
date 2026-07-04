/* Copy demo links, presenter timer, analytics export */

const DEMO_PATH_URLS = {
  scv: '/gov-workflows?state=CA&view=scv&play=1',
  hl: '/gov-workflows?state=CA&view=hl&play=1',
  executive: '/gov-workflows?state=CA&view=executive',
  clm: '/gov-workflows?state=CA&view=consultant',
  technical: '/envelopes/send?prefill=vendor&view=technical',
};

let demoTimerInterval = null;
let demoTimerEndsAt = null;

function copyDemoUrl(url, btn) {
  const full = url.startsWith('http') ? url : `${location.origin}${url}`;
  navigator.clipboard.writeText(full).then(() => {
    if (typeof showToast === 'function') showToast('Demo link copied');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    }
  }).catch(() => {
    if (typeof showToast === 'function') showToast('Copy failed', 'error');
  });
}

function demoTimerStart(minutes) {
  demoTimerEndsAt = Date.now() + minutes * 60 * 1000;
  clearInterval(demoTimerInterval);
  const el = document.getElementById('demo-timer-display');
  if (!el) return;
  el.hidden = false;
  const tick = () => {
    const left = Math.max(0, demoTimerEndsAt - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    el.textContent = `${m}:${String(s).padStart(2, '0')} left`;
    el.classList.toggle('demo-timer-display--warn', left <= 120000 && left > 0);
    el.classList.toggle('demo-timer-display--done', left === 0);
    if (left === 0) {
      clearInterval(demoTimerInterval);
      if (typeof showToast === 'function') showToast('Demo time — good stopping point');
    }
  };
  tick();
  demoTimerInterval = setInterval(tick, 1000);
}

function demoTimerStop() {
  clearInterval(demoTimerInterval);
  demoTimerEndsAt = null;
  const el = document.getElementById('demo-timer-display');
  if (el) { el.hidden = true; el.textContent = ''; }
}

function demoAnalyticsExport() {
  try {
    const raw = localStorage.getItem('ds-demo-analytics');
    const log = raw ? JSON.parse(raw) : [];
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `docusign-iam-demo-analytics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    if (typeof showToast === 'function') showToast('Analytics exported');
  } catch (_) {
    if (typeof showToast === 'function') showToast('Export failed', 'error');
  }
}

function presenterExtrasEnhanceGuide() {
  const panel = document.querySelector('.consultant-guide-panel');
  if (!panel || panel.dataset.extrasReady) return;
  panel.dataset.extrasReady = '1';

  const head = panel.querySelector('.consultant-guide-head');
  if (head && !document.getElementById('presenter-tools-row')) {
    const row = document.createElement('div');
    row.className = 'presenter-tools-row';
    row.innerHTML = `
      <div class="presenter-tools-timers">
        <span class="presenter-tools-label">Timer</span>
        <button type="button" class="presenter-timer-btn" data-min="10">10m</button>
        <button type="button" class="presenter-timer-btn" data-min="15">15m</button>
        <button type="button" class="presenter-timer-btn" data-min="20">20m</button>
        <button type="button" class="presenter-timer-btn presenter-timer-btn--ghost" id="demo-timer-stop">Stop</button>
        <span id="demo-timer-display" class="demo-timer-display" hidden></span>
      </div>
      <button type="button" class="presenter-export-btn" id="demo-analytics-export">Export session log</button>`;
    head.appendChild(row);
    row.querySelectorAll('.presenter-timer-btn[data-min]').forEach(btn => {
      btn.addEventListener('click', () => demoTimerStart(Number(btn.dataset.min)));
    });
    document.getElementById('demo-timer-stop')?.addEventListener('click', demoTimerStop);
    document.getElementById('demo-analytics-export')?.addEventListener('click', demoAnalyticsExport);
  }

  const pathUrls = [
    '/?view=scv',
    '/gov-workflows?state=CA&view=scv&play=1',
    '/?view=hl',
    '/gov-workflows?state=CA&view=hl&play=1',
    '/?view=executive',
    '/gov-workflows?state=CA&view=executive',
    '/gov-workflows?state=CA&view=consultant',
    '/envelopes/send?prefill=vendor&view=technical',
  ];
  panel.querySelectorAll('details.consultant-path').forEach((details, i) => {
    const summary = details.querySelector('summary');
    if (!summary || summary.querySelector('.copy-path-btn')) return;
    const firstLink = details.querySelector('.consultant-steps a[href]');
    const url = firstLink?.getAttribute('href') || pathUrls[i] || '/';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-path-btn';
    btn.textContent = 'Copy link';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyDemoUrl(url, btn);
    });
    summary.appendChild(btn);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  presenterExtrasEnhanceGuide();
  const origToggle = window.toggleConsultantGuide;
  if (typeof origToggle === 'function') {
    window.toggleConsultantGuide = function (force) {
      origToggle(force);
      if (document.getElementById('consultant-guide')?.classList.contains('open')) {
        presenterExtrasEnhanceGuide();
      }
    };
  }
});

window.copyDemoUrl = copyDemoUrl;
window.demoAnalyticsExport = demoAnalyticsExport;
