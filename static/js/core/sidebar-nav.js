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
    sections.forEach((section) => {
      const toggle = section.querySelector('.nav-label--toggle');
      if (!toggle) return;
      const hasActive = !!section.querySelector('.nav-item.active');
      setOpen(section, hasActive || !collapsed.has(section.dataset.section));
      toggle.addEventListener('click', () => {
        const open = section.classList.contains('is-collapsed');
        setOpen(section, open);
        const state = read();
        if (open) state.delete(section.dataset.section); else state.add(section.dataset.section);
        write(state);
      });
    });
    // Keep the active page in view when the nav list overflows.
    document.querySelector('.sidebar .nav-item.active')?.scrollIntoView({ block: 'nearest' });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
