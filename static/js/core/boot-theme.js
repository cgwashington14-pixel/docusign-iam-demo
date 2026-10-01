/* Runs in <head> before first paint so the saved theme never flashes. */
(function () {
  var saved = null;
  try { saved = localStorage.getItem('ds-theme'); } catch (e) { /* storage blocked */ }
  var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
