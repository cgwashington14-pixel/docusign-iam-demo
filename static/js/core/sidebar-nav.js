// Collapsible sidebar groups. State persists per browser; the group holding the
// current page is always open so you never lose your place.

(function () {
  const KEY = 'ds-nav-collapsed';
  const read = () => {
    try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); }
  };
  const write = (set) => {
    try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* storage unavailable */ }
  };

  function setOpen(section, open) {
    section.classList.toggle('is-collapsed', !open);
    section.querySelector('.nav-label--toggle')?.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function init() {
    const sections = document.querySelectorAll('.sidebar .nav-section[data-section]');
    const collapsed = read();
    // First visit: show only the current group (or the first one on Home) to keep the nav short.
    let stored = false;
    try { stored = localStorage.getItem(KEY) !== null; } catch { /* storage unavailable */ }
    const anyActive = !!document.querySelector('.sidebar .nav-item.active');
    let seen = 0;
    sections.forEach((section) => {
      const toggle = section.querySelector('.nav-label--toggle');
      if (!toggle) return;
      const i = seen++;
      const hasActive = !!section.querySelector('.nav-item.active');
      const byDefault = stored ? !collapsed.has(section.dataset.section) : !anyActive && i === 0;
      setOpen(section, hasActive || byDefault);
      toggle.addEventListener('click', () => {
        const open = section.classList.contains('is-collapsed');
        setOpen(section, open);
        const state = new Set();
        sections.forEach((sec) => {
          if (sec.classList.contains('is-collapsed')) state.add(sec.dataset.section);
        });
        write(state);
      });
    });
    // Keep the active page in view when the nav list overflows.
    document.querySelector('.sidebar .nav-item.active')?.scrollIntoView({ block: 'nearest' });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
