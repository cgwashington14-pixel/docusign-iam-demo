// Command palette: jump to any page or run a demo action from the keyboard.
// Opens with Ctrl/Cmd+K or "/", closes with Esc.

(function () {
  const root = document.getElementById('palette');
  const input = document.getElementById('palette-input');
  const list = document.getElementById('palette-list');
  const dataEl = document.getElementById('palette-data');
  if (!root || !input || !list || !dataEl) return;

  const data = JSON.parse(dataEl.textContent);
  const RECENT_KEY = 'ds-palette-recent';
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const kbd = document.getElementById('palette-kbd');
  if (kbd) kbd.textContent = isMac ? '⌘K' : 'Ctrl K';

  const iconFor = (name) => document.querySelector(`#palette-icons [data-icon="${name}"]`)?.innerHTML || '';
  const call = (fn) => () => { if (typeof window[fn] === 'function') window[fn](); };
  const here = location.pathname;

  const actions = [
    { label: 'Toggle light / dark theme', hint: 'Appearance', keywords: 'theme dark light mode appearance', run: call('toggleTheme') },
    { label: 'Show or hide navigation', hint: 'Layout', keywords: 'sidebar menu collapse', run: () => window.toggleSidebar && window.toggleSidebar() },
    { label: 'Open demo tools', hint: 'Account, view modes, presenter paths', keywords: 'menu settings', run: () => document.getElementById('topbar-menu-trigger')?.click() },
    { label: 'SCView', hint: 'View mode · simple component guide', keywords: 'mode scv view', run: call('toggleScvMode') },
    { label: 'High-level view', hint: 'View mode · one moment at a time', keywords: 'mode high level view', run: call('toggleHighLevelMode') },
    { label: 'Executive view', hint: 'View mode · leadership demos', keywords: 'mode executive view', run: call('toggleExecutiveMode') },
    { label: 'Presenter mode', hint: 'View mode · cleaner layout', keywords: 'mode present presenter', run: call('togglePresentMode') },
    { label: 'Business view', hint: 'View mode · visual storyboards', keywords: 'mode business view', run: call('toggleBusinessMode') },
    { label: 'API details', hint: 'View mode · endpoints and payloads', keywords: 'mode api technical tech', run: call('toggleTechMode') },
    data.signed_in
      ? { label: 'Sign out of Docusign', hint: 'Account', keywords: 'logout account', href: data.urls.logout }
      : { label: 'Sign in with Docusign', hint: 'Account', keywords: 'login oauth account', href: data.urls.login },
    { label: 'Admin', hint: 'Connection status and setup', keywords: 'status settings', href: data.urls.admin },
    { label: 'Lock demo', hint: 'Account', keywords: 'password lock', href: data.urls.lock },
  ].map((a) => ({ ...a, group: 'Actions', kind: 'action' }));

  const pages = data.pages.map((p) => ({
    label: p.label, hint: p.hint, group: p.group, href: p.url, icon: p.icon, kind: 'page',
    keywords: `${p.group} ${p.hint}`,
  }));

  function readRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  }
  function pushRecent(href) {
    try {
      const next = [href, ...readRecent().filter((h) => h !== href)].slice(0, 4);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch { /* storage unavailable */ }
  }

  // Lower is better; Infinity filters the entry out.
  function score(item, q) {
    const label = item.label.toLowerCase();
    if (label === q) return 0;
    if (label.startsWith(q)) return 1;
    if (label.split(/[\s/&·-]+/).some((w) => w.startsWith(q))) return 2;
    if (label.includes(q)) return 3;
    const hay = `${label} ${item.keywords || ''} ${item.hint || ''}`.toLowerCase();
    if (hay.includes(q)) return 4;
    let i = 0;
    for (const ch of label) if (ch === q[i]) i += 1;
    return i === q.length ? 5 : Infinity;
  }

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function mark(label, q) {
    const i = q ? label.toLowerCase().indexOf(q) : -1;
    if (i < 0) return esc(label);
    return `${esc(label.slice(0, i))}<mark>${esc(label.slice(i, i + q.length))}</mark>${esc(label.slice(i + q.length))}`;
  }

  let rows = [];
  let active = 0;

  function sections(q) {
    if (q) {
      return [{
        title: '',
        items: [...pages, ...actions]
          .map((it) => ({ it, s: score(it, q) }))
          .filter((x) => x.s !== Infinity)
          .sort((a, b) => a.s - b.s)
          .map((x) => x.it),
      }];
    }
    const recent = readRecent().map((h) => pages.find((p) => p.href === h)).filter(Boolean);
    const out = [];
    if (recent.length) out.push({ title: 'Recent', items: recent });
    const groups = [];
    pages.forEach((p) => {
      let g = groups.find((x) => x.title === p.group);
      if (!g) { g = { title: p.group, items: [] }; groups.push(g); }
      g.items.push(p);
    });
    return [...out, ...groups, { title: 'Actions', items: actions }];
  }

  function render() {
    const q = input.value.trim().toLowerCase();
    const secs = sections(q).filter((s) => s.items.length);
    rows = [];
    let html = '';
    secs.forEach((sec) => {
      if (sec.title) html += `<li class="palette-group" role="presentation">${esc(sec.title)}</li>`;
      sec.items.forEach((it) => {
        const idx = rows.push(it) - 1;
        const current = it.kind === 'page' && it.href === here;
        html += `<li id="palette-opt-${idx}" class="palette-item" role="option" data-idx="${idx}" aria-selected="false">
          <span class="palette-item-icon">${it.icon ? iconFor(it.icon) : '<span class="palette-item-dot"></span>'}</span>
          <span class="palette-item-text"><span class="palette-item-label">${mark(it.label, q)}</span><span class="palette-item-hint">${esc(it.hint || '')}</span></span>
          ${current ? '<span class="palette-item-tag">Current</span>' : `<span class="palette-item-kind">${it.kind === 'action' ? 'Action' : ''}</span>`}
        </li>`;
      });
    });
    list.innerHTML = html || '<li class="palette-empty" role="presentation">No matches. Try a page name like “webhooks” or an action like “dark”.</li>';
    active = 0;
    highlight(0, false);
  }

  function highlight(i, scroll = true) {
    if (!rows.length) { input.removeAttribute('aria-activedescendant'); return; }
    active = (i + rows.length) % rows.length;
    list.querySelectorAll('.palette-item').forEach((el) => {
      const on = Number(el.dataset.idx) === active;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) {
        input.setAttribute('aria-activedescendant', el.id);
        if (scroll) el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  let lastFocus = null;
  function open() {
    if (!root.hidden) return;
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add('palette-open');
    input.value = '';
    render();
    input.focus();
  }
  function close(restore = true) {
    if (root.hidden) return;
    root.hidden = true;
    document.body.classList.remove('palette-open');
    if (restore && lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function run(item) {
    if (!item) return;
    close(false);
    if (item.href) {
      if (item.kind === 'page') pushRecent(item.href);
      if (item.href !== here || item.kind !== 'page') location.href = item.href;
      return;
    }
    item.run && item.run();
  }

  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    // Keep page-level shortcuts (arrows, space, p, r…) from firing while typing here.
    if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); highlight(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active - 1); }
    else if (e.key === 'Home') { e.preventDefault(); highlight(0); }
    else if (e.key === 'End') { e.preventDefault(); highlight(rows.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); run(rows[active]); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  });
  list.addEventListener('mousemove', (e) => {
    const el = e.target.closest('.palette-item');
    if (el && Number(el.dataset.idx) !== active) highlight(Number(el.dataset.idx), false);
  });
  list.addEventListener('click', (e) => {
    const el = e.target.closest('.palette-item');
    if (el) run(rows[Number(el.dataset.idx)]);
  });
  root.addEventListener('click', (e) => { if (e.target.closest('[data-palette-close]')) close(); });
  document.getElementById('palette-trigger')?.addEventListener('click', open);

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (root.hidden) open(); else close();
      return;
    }
    if (e.key === 'Escape' && !root.hidden) { e.preventDefault(); close(); return; }
    const t = e.target;
    const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (e.key === '/' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && !typing && root.hidden) {
      e.preventDefault();
      open();
    }
  });

  window.openCommandPalette = open;
})();
