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
    agreementDesk: '/agreement-desk',
    embedded: '/embedded',
    send: '/envelopes/send',
    workspaces: '/workspaces',
    agreementDesk: '/agreement-desk',
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
  'create a request': '/agreement-desk',
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
  requests: 'insights',
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
  agreementDesk: 'agreementDesk',
};

function dsMockNorm(text) {
  return (text || '').replace(/\s+/g, ' ').trim().toLowerCase().replace(/[▾↗→×]/g, '').trim();
}

function dsHandleProductMockClick(e) {
  const host = e.target.closest('.ds-product-mock-host');
  if (!host) return;

  const sectionId = dsMockSectionFrom(host);

  const deskAction = e.target.closest('[data-desk-action]');
  if (deskAction && sectionId === 'agreementDesk') {
    const action = deskAction.dataset.deskAction;
    if (action === 'desk') dsSwitchMock('agreementDesk', 'agreementDesk');
    else if (action === 'new-request') dsSwitchMock('agreementDesk', 'requestIntake');
    return;
  }

  const deskRow = e.target.closest('.ds-prod-desk-row[data-desk-open]');
  if (deskRow && sectionId === 'agreementDesk') {
    dsSwitchMock('agreementDesk', 'requestWorkspace');
    dsMockToast('Opening request — audit trail & Iris AI', 'success');
    return;
  }

  const reqTab = e.target.closest('[data-req-tab]');
  if (reqTab && sectionId === 'agreementDesk') {
    const tab = reqTab.dataset.reqTab;
    if (tab === 'details') {
      dsSwitchMock('agreementDesk', 'requestDetails');
    } else if (tab === 'overview') {
      dsSwitchMock('agreementDesk', 'requestWorkspace');
    } else {
      dsMockToast(`${reqTab.textContent.trim()} tab`, 'default');
    }
    return;
  }

  if (e.target.closest('.ds-prod-desk-icon[title="Redline in Word"]')) {
    dsMockNavigate('/envelopes/send');
    return;
  }
  if (e.target.closest('.ds-prod-desk-icon[title="Route for approval"]')) {
    dsMockToast('Routed to Legal Review · DGS', 'success');
    return;
  }
  if (e.target.closest('.ds-prod-desk-icon[title="Audit trail"]')) {
    dsSwitchMock('agreementDesk', 'requestWorkspace');
    return;
  }

  const labelEarly = dsMockNorm(e.target.closest('button')?.textContent || '');
  if (labelEarly.includes('redline in word')) {
    dsMockNavigate('/envelopes/send');
    return;
  }
  if (labelEarly.includes('route for approval')) {
    dsMockToast('Approval chain updated', 'success');
    return;
  }
  if (e.target.closest('.ds-prod-intake-submit')) {
    dsSwitchMock('agreementDesk', 'requestWorkspace');
    dsMockToast('Request submitted — routed to Agreement Desk queue', 'success');
    return;
  }

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
    if (key === 'requests') {
      dsMockNavigate('/agreement-desk');
      return;
    }
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
    dsMockNavigate('/agreement-desk');
    dsMockToast('Opening Agreement Desk request', 'success');
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

document.addEventListener('click', (e) => {
  const deskAction = e.target.closest('[data-desk-action]');
  if (deskAction) {
    const action = deskAction.dataset.deskAction;
    if (action === 'new-request') {
      dsSwitchMock('agreementDesk', 'requestIntake');
      dsMockToast('New request — DGS STD 213 intake', 'success');
      return;
    }
    if (action === 'desk') {
      dsSwitchMock('agreementDesk', 'agreementDesk');
      return;
    }
  }

  const deskRow = e.target.closest('.ds-prod-desk-row[data-desk-open], tr[data-desk-open]');
  if (deskRow && !e.target.closest('.ds-prod-desk-icon')) {
    dsSwitchMock('agreementDesk', 'requestWorkspace');
    dsMockToast('Opening request — audit trail & Iris', 'success');
    return;
  }

  const deskIcon = e.target.closest('.ds-prod-desk-icon');
  if (deskIcon) {
    const title = deskIcon.title || deskIcon.getAttribute('title') || '';
    if (title.includes('Audit')) {
      dsSwitchMock('agreementDesk', 'requestWorkspace', { activeTab: 'overview' });
    } else if (title.includes('Redline')) {
      dsMockNavigate('/envelopes/send');
    } else if (title.includes('approval')) {
      dsSwitchMock('agreementDesk', 'requestWorkspace', { activeTab: 'approvals' });
      dsMockToast('Routing for approval', 'success');
    }
    return;
  }

  const reqTab = e.target.closest('[data-req-tab]');
  if (reqTab) {
    const panel = reqTab.dataset.reqTab;
    const frame = reqTab.closest('.ds-prod-frame--request-ws');
    if (frame) {
      frame.querySelectorAll('[data-req-tab]').forEach(t => t.classList.toggle('active', t === reqTab));
      frame.querySelectorAll('[data-req-panel]').forEach(p => {
        const on = p.dataset.reqPanel === panel;
        p.hidden = !on;
        p.classList.toggle('active', on);
      });
    }
    return;
  }

  if (e.target.closest('.ds-desk-redline, .ds-prod-btn-dark-sm')) {
    const label = (e.target.closest('button')?.textContent || '').toLowerCase();
    if (label.includes('word') || label.includes('ai-assisted')) {
      dsMockNavigate('/envelopes/send');
      return;
    }
  }

  if (e.target.closest('.ds-desk-send-approval, .ds-prod-intake-submit')) {
    dsSwitchMock('agreementDesk', 'requestWorkspace', { activeTab: 'approvals' });
    dsMockToast('Submitted — routed for agency approval', 'success');
    return;
  }

  if (e.target.closest('.ds-prod-side-action')) {
    const label = e.target.closest('.ds-prod-side-action').textContent || '';
    if (label.includes('documents')) {
      const frame = e.target.closest('.ds-prod-frame--request-ws');
      frame?.querySelector('[data-req-tab="documents"]')?.click();
    } else if (label.includes('Approval')) {
      const frame = e.target.closest('.ds-prod-frame--request-ws');
      frame?.querySelector('[data-req-tab="approvals"]')?.click();
    }
    return;
  }
});

document.addEventListener('click', dsHandleProductMockClick);
