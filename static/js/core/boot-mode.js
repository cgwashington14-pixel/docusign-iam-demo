/*
 * Runs at the top of <body>, before layout: applies ?view= presets, restores the saved
 * presentation mode, and applies the sidebar state so content never jumps.
 */
(function () {
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  var params = new URLSearchParams(location.search);
  var view = (params.get('view') || '').toLowerCase();

  /* ?view=<name> flips the stored mode flags (s = SCView, h = high-level, e = executive). */
  var PRESETS = {
    scv: { s: '1', h: '0', e: '0' },
    hl: { s: '0', h: '1', e: '0' },
    highlevel: { s: '0', h: '1', e: '0' },
    executive: { s: '0', h: '0', e: '1' },
    consultant: { s: '0', h: '0', e: '0', b: '1', pr: '1', t: '0' },
    technical: { s: '0', h: '0', e: '0', b: '0', pr: '0', t: '1' }
  };
  var preset = PRESETS[view];
  if (preset) {
    store.set('ds-scv', preset.s);
    store.set('ds-high-level', preset.h);
    store.set('ds-executive', preset.e);
    if (preset.b !== undefined) {
      store.set('ds-business', preset.b);
      store.set('ds-present', preset.pr);
      store.set('ds-tech', preset.t);
    }
  }
  if (params.get('play') === '1') {
    try { sessionStorage.setItem('gw-user-start-play', '1'); } catch (e) { /* storage blocked */ }
  }

  var classes = document.body.classList;
  if (store.get('ds-scv') === '1') classes.add('scv-mode', 'business-mode', 'present-mode');
  else if (store.get('ds-high-level') === '1') classes.add('high-level-mode', 'business-mode', 'present-mode');
  else if (store.get('ds-executive') === '1') classes.add('executive-mode', 'business-mode', 'present-mode');

  /*
   * Desktop navigation: docked on wide screens, tucked (hover-reveal) on narrower ones.
   * The user's explicit choice (toggle button) is persisted and always wins afterwards.
   */
  if (window.matchMedia('(min-width: 961px)').matches) {
    if (store.get('ds-nav-v3') !== '1') {
      store.set('ds-nav-v3', '1');
      store.set('ds-sidebar-collapsed', window.innerWidth >= 1180 ? '0' : '1');
    }
    if (store.get('ds-sidebar-collapsed') === '1') classes.add('sidebar-collapsed');
  }
})();
