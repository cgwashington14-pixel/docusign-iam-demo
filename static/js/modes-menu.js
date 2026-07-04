/* View mode toggles — buttons live in the topbar hamburger menu */

document.addEventListener('DOMContentLoaded', () => {
  ['toggleScvMode', 'toggleHighLevelMode', 'toggleExecutiveMode', 'togglePresentMode', 'toggleBusinessMode', 'toggleTechMode'].forEach(fn => {
    const orig = window[fn];
    if (typeof orig !== 'function') return;
    window[fn] = function (...args) {
      const result = orig.apply(this, args);
      if (typeof topbarMenuClose === 'function') topbarMenuClose();
      return result;
    };
  });
});
