/* Lightweight demo analytics — localStorage only, for presenter refinement */

const DEMO_ANALYTICS_KEY = 'ds-demo-analytics';

function demoAnalyticsTrack(event, detail = {}) {
  try {
    const raw = localStorage.getItem(DEMO_ANALYTICS_KEY);
    const log = raw ? JSON.parse(raw) : [];
    log.push({
      t: new Date().toISOString(),
      event,
      path: location.pathname,
      ...detail,
    });
    if (log.length > 200) log.splice(0, log.length - 200);
    localStorage.setItem(DEMO_ANALYTICS_KEY, JSON.stringify(log));
  } catch (_) { /* ignore quota */ }
}

document.addEventListener('DOMContentLoaded', () => {
  demoAnalyticsTrack('page_view', { search: location.search || '' });
  document.querySelectorAll('.consultant-steps a[href]').forEach(a => {
    a.addEventListener('click', () => {
      demoAnalyticsTrack('demo_path_click', { href: a.getAttribute('href') });
    });
  });
});

window.demoAnalyticsTrack = demoAnalyticsTrack;
