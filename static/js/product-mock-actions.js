/* Wire product preview mock buttons, links, and sidebar items to demo actions */

function dsMockSectionFrom(el) {
  return el?.closest('[data-ds-product]')?.dataset?.dsProduct || null;
}

function dsMockToast(msg, type = 'default') {
  if (typeof showToast === 'function') showToast(msg, type);
}

function dsMockNavigate(path) {
  window.location.href = path;
}

function dsMockGoSection(sectionId, mockKey, openLive = false) {
  const onPage = document.querySelector(`[data-ds-product="${sectionId}"]`);
  if (onPage) {
    if (mockKey && typeof dsSwitchMock === 'function') dsSwitchMock(sectionId, mockKey);
    if (openLive && typeof dsOpenLive === 'function') dsOpenLive(sectionId);
    else if (typeof dsShowPreview === 'function') dsShowPreview(sectionId);
    onPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  const routes = {
    home: '/',
    maestro: '/maestro',
    webforms: '/webforms',
    navigator: '/navigator',
    embedded: '/embedded',
    send: '/envelopes/send',
    request: '/gov-workflows',
    workspaces: '/workspaces',
  };
  if (routes[sectionId]) dsMockNavigate(routes[sectionId]);
  return false;
}

function navViewAgreement(title) {
  const label = title || 'Agreement';
  dsMockToast(`Opening «${label}» in Agreement Manager`, 'success');
  dsMockGoSection('navigator', 'agreements');
}

const DS_MOCK_ROUTES = {
  'send an envelope': '/envelopes/send',
  'create a request': '/gov-workflows',
  'create a web form': '/webforms',
  'edit in word': '/envelopes/send',
  'ai-assisted review': '/envelopes/send',
  'send with docusign': '/embedded',
  'deploy web form instance': '/webforms',
  'customize text with markdown syntax': null,
};

const DS_TOPNAV_TARGETS = {
  home: { route: '/', section: 'home', mock: 'home' },
  agreements: { route: '/navigator', section: 'navigator', mock: 'agreements' },
  templates: { route: '/envelopes', section: null, mock: null },
  insights: { route: '/navigator', section: 'navigator', mock: 'insights' },
  admin: { route: '/explorer', section: null, mock: null },
};

const DS_SIDEBAR_MOCKS = {
  overview: 'insights',
  'my dashboard': 'insights',
  'administrator dashboard': 'insights',
  agreements: 'agreements',
  obligations: 'insights',
  renewals: 'insights',
  requests: 'request',
  'agency agreements': 'agreements',
};

const DS_SECTION_LIVE = {
  home: 'home',
  maestro: 'maestro',
  webforms: 'webforms',
  navigator: 'navigator',
  embedded: 'embedded',
  send: 'send',
  workspaces: 'workspaces',
};

function dsMockNorm(text) {
  return (text || '').replace(/\s+/g, ' ').trim().toLowerCase().replace(/[▾↗→×]/g, '').trim();
}

function dsHandleProductMockClick(e) {
  const host = e.target.closest('.ds-product-mock-host');
  if (!host) return;

  const sectionId = dsMockSectionFrom(host);
  const link = e.target.closest('a.ds-prod-link');
  if (link && !link.getAttribute('href')) {
    e.preventDefault();
    const label = dsMockNorm(link.textContent);
    if (label.includes('see how it works')) {
      dsMockGoSection('maestro', 'workflowSteps');
      dsMockToast('Opening Workflow Builder step library', 'success');
    } else if (label.includes('markdown')) {
      dsMockToast('Markdown syntax help — demo preview', 'default');
    } else {
      dsMockToast(link.textContent.trim(), 'default');
    }
    return;
  }

  const topLink = e.target.closest('.ds-prod-topnav-link');
  if (topLink) {
    e.preventDefault();
    const key = dsMockNorm(topLink.textContent);
    const target = DS_TOPNAV_TARGETS[key];
    if (!target) return;
    if (sectionId === target.section && target.mock) {
      dsSwitchMock(sectionId, target.mock);
      dsMockToast(`${topLink.textContent.trim()} dashboard`, 'success');
    } else {
      dsMockNavigate(target.route);
    }
    return;
  }

  const sidebar = e.target.closest('.ds-prod-sidebar-item');
  if (sidebar) {
    e.preventDefault();
    const key = dsMockNorm(sidebar.textContent);
    const mock = DS_SIDEBAR_MOCKS[key] || 'insights';
    if (sectionId === 'navigator') {
      dsSwitchMock('navigator', mock);
      dsMockToast(`Insights · ${sidebar.textContent.trim()}`, 'success');
    } else {
      dsMockGoSection('navigator', mock);
    }
    return;
  }

  const taskRow = e.target.closest('.ds-prod-task-row');
  if (taskRow && !e.target.closest('.ds-prod-kebab')) {
    dsMockGoSection('embedded', 'signing', true);
    dsMockToast('Opening signing task', 'success');
    return;
  }

  const activityRow = e.target.closest('.ds-prod-activity-row');
  if (activityRow) {
    dsMockGoSection('navigator', 'agreements');
    dsMockToast('Opening agreement activity', 'success');
    return;
  }

  const tableRow = e.target.closest('.ds-prod-table tbody tr');
  if (tableRow && sectionId === 'navigator') {
    dsMockGoSection('navigator', 'request');
    dsMockToast('Opening agreement request', 'success');
    return;
  }

  const drawerItem = e.target.closest('.ds-prod-drawer-item');
  if (drawerItem) {
    const title = drawerItem.querySelector('strong')?.textContent?.trim() || 'Workflow step';
    dsMockToast(`Added step: ${title}`, 'success');
    if (sectionId === 'maestro') dsSwitchMock('maestro', 'workflowDiagram');
    return;
  }

  const drawerClose = e.target.closest('.ds-prod-drawer-head span');
  if (drawerClose && drawerClose.textContent.trim() === '×') {
    dsSwitchMock('maestro', 'workflowDiagram');
    return;
  }

  const drawerTab = e.target.closest('.ds-prod-drawer-tabs span');
  if (drawerTab) {
    drawerTab.parentElement.querySelectorAll('span').forEach(t => t.classList.remove('active'));
    drawerTab.classList.add('active');
    dsMockToast(`${drawerTab.textContent.trim()} steps`, 'default');
    return;
  }

  const outlineItem = e.target.closest('.ds-prod-outline-tree li');
  if (outlineItem) {
    outlineItem.parentElement.querySelectorAll('li').forEach(li => li.classList.remove('active'));
    outlineItem.classList.add('active');
    return;
  }

  const cardHead = e.target.closest('.ds-prod-card-head');
  if (cardHead && cardHead.textContent.includes('TASKS')) {
    dsMockGoSection('embedded', 'signing');
    dsMockToast('Opening Tasks queue', 'success');
    return;
  }

  const btn = e.target.closest('button');
  if (!btn) return;

  const label = dsMockNorm(btn.textContent);
  const route = DS_MOCK_ROUTES[label];
  if (route) {
    dsMockNavigate(route);
    return;
  }

  if (label.startsWith('start') || label === 'other actions') {
    const liveSection = DS_SECTION_LIVE[sectionId];
    if (liveSection && document.querySelector(`[data-ds-product="${liveSection}"]`)) {
      dsOpenLive(liveSection);
    } else if (sectionId === 'embedded') {
      dsMockGoSection('embedded', 'signing', true);
    } else {
      dsMockNavigate('/embedded');
    }
    return;
  }

  if (label === 'publish' || label === 'activate') {
    dsMockToast(label === 'publish' ? 'Workflow published (demo)' : 'Web Form activated (demo)', 'success');
    if (sectionId) dsOpenLive(sectionId);
    return;
  }

  if (label === 'preview') {
    dsMockToast('Preview mode — layout looks good', 'success');
    return;
  }

  if (label.includes('sign') && btn.classList.contains('ds-prod-ws-action-btn')) {
    dsMockGoSection('workspaces', null, true);
    dsMockToast('Opening participant signing flow', 'success');
    return;
  }

  if (label === 'upload' && btn.classList.contains('ds-prod-ws-action-btn')) {
    dsMockGoSection('workspaces', null, true);
    dsMockToast('Upload request opened', 'success');
    return;
  }

  if (btn.classList.contains('ds-prod-ws-back')) {
    dsMockGoSection('workspaces', 'workspaceAdmin');
    return;
  }

  if (label.includes('ask iris') || label.includes('chat with request')) {
    dsMockToast('Iris AI assistant — demo response ready', 'success');
    return;
  }

  if (label.includes('send message')) {
    dsMockToast('Message sent to request participants', 'success');
    return;
  }

  if (label.includes('delete request') || label.includes('delete section')) {
    dsMockToast('Delete cancelled — demo data preserved', 'default');
    return;
  }

  if (label.includes('following') || label.includes('share') || label.includes('filters')
      || label.includes('clean up parties') || label.includes('do this later')
      || label.includes('hide insights') || label.includes('new playbook')
      || label.includes('generate playbook') || label.includes('edit')) {
    dsMockToast(btn.textContent.replace(/[▾↗→×]/g, '').trim(), 'default');
    return;
  }

  if (btn.closest('.ds-prod-sign-panel') || btn.closest('.ds-prod-hero-actions')) {
    dsMockToast(btn.textContent.replace(/[▾↗→×]/g, '').trim(), 'default');
    return;
  }

  if (btn.closest('.ds-prod-iris-panel') || btn.closest('.ds-prod-wf-canvas') || btn.closest('.ds-prod-forms-canvas')) {
    dsMockToast(btn.textContent.trim(), 'success');
  }
}

document.addEventListener('click', dsHandleProductMockClick);
