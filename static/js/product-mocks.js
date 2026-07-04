/* Faithful Docusign product UI mockups — rendered before live demo sections */

/** Generic demo personas — no real names in product previews */
const DS_DEMO = {
  user: 'Agency User',
  initials: 'AU',
  team: 'Contracts team',
  lead: 'Contracts Lead',
  legal: 'Legal Review',
  owner: 'Agency owner',
  vendor: 'Vendor contact',
};

function dsChrome(topNav, opts = {}) {
  const active = opts.activeNav || 'Home';
  const navItems = ['Home', 'Agreements', 'Templates', 'Insights', 'Admin'];
  return `
    <header class="ds-prod-topnav">
      <div class="ds-prod-logo">
        <span class="ds-prod-logo-mark"></span>
        <span>docusign</span>
      </div>
      <nav class="ds-prod-topnav-links">
        ${navItems.map(n => `<span class="ds-prod-topnav-link ${n === active ? 'active' : ''}">${n}</span>`).join('')}
      </nav>
      <div class="ds-prod-topnav-utils">
        <span class="ds-prod-icon-btn">⌕</span>
        <span class="ds-prod-icon-btn">⚙</span>
        <span class="ds-prod-icon-btn">?</span>
        <span class="ds-prod-avatar">${DS_DEMO.initials}</span>
      </div>
    </header>
    ${topNav || ''}`;
}

function dsInsightsSidebar(active = 'Agreements') {
  const items = [
    ['Overview', false], ['My dashboard', false], ['Administrator dashboard', false],
    ['Agreements', true], ['Obligations', false], ['Renewals', false], ['Requests', false],
  ];
  return `
    <aside class="ds-prod-sidebar">
      <button type="button" class="ds-prod-start-btn">Start ▾</button>
      <div class="ds-prod-sidebar-section">Dashboards</div>
      ${items.map(([label, on]) => `<div class="ds-prod-sidebar-item ${label === active ? 'active' : ''}">${label}</div>`).join('')}
      <div class="ds-prod-sidebar-section">Custom Dashboards</div>
      <div class="ds-prod-sidebar-item">Agency Agreements</div>
      <div class="ds-prod-sidebar-item">CDT Vendor Hub</div>
      <div class="ds-prod-sidebar-section">Reports</div>
    </aside>`;
}

function dsAgreementsSidebar(active = 'requests') {
  const sections = [
    { head: null, items: [
      ['all', 'All Agreements'], ['drafts', 'Drafts'], ['progress', 'In Progress'],
      ['completed', 'Completed'], ['deleted', 'Deleted'],
    ]},
    { head: 'Folders', items: [] },
    { head: 'Manage', items: [
      ['parties', 'All Parties'], ['employees', 'Employees'], ['requests', 'Requests', true],
      ['workflows', 'Workflows'], ['agents', 'Agents', 'new'], ['workspaces', 'Workspaces', 'new'],
      ['powerforms', 'PowerForms'], ['bulk', 'Bulk Send'],
    ]},
  ];
  const rows = sections.map(sec => {
    const head = sec.head ? `<div class="ds-prod-desk-nav-head">${sec.head}</div>` : '';
    const items = sec.items.map(([id, label, badge]) => {
      const isNew = badge === 'new';
      const on = id === active;
      return `<div class="ds-prod-desk-nav-item ${on ? 'active' : ''}" data-desk-nav="${id}">
        ${label}${isNew ? ' <span class="ds-prod-nav-new">New</span>' : ''}
      </div>`;
    }).join('');
    return head + items;
  }).join('');
  return `<aside class="ds-prod-desk-sidebar">${rows}</aside>`;
}

function dsDeskStatusPill(status) {
  const map = {
    'New': 'green',
    'Fully Approved and ready for Signature': 'green',
    'Risk Management Review': 'gray',
    'Leadership Review': 'amber',
    'Contracts Team Review': 'red',
    'With Agency Program Team': 'amber',
    'DGS Policy Review': 'gray',
  };
  const tone = map[status] || 'gray';
  return `<span class="ds-prod-desk-status ds-prod-desk-status--${tone}">${status}</span>`;
}

function dsDeskPerson(initials, role, email) {
  return `<div class="ds-prod-desk-person">
    <span class="ds-prod-avatar-sm">${initials}</span>
    <div><strong>${role}</strong><small>${email}</small></div>
  </div>`;
}

function dsClmAgreementsShell(activeItem, mainHtml) {
  const nav = [
    ['all', 'All Agreements'],
    ['drafts', 'Drafts'],
    ['progress', 'In Progress'],
    ['completed', 'Completed'],
    ['requests', 'Requests', true],
    ['workflows', 'Workflows', true],
    ['workspaces', 'Workspaces', true],
  ];
  return `
    <div class="ds-prod-frame ds-prod-frame--clm">
      ${dsChrome('', { activeNav: 'Agreements' })}
      <div class="ds-prod-clm-split">
        <aside class="ds-prod-clm-sidebar">
          <button type="button" class="ds-prod-start-btn">Start ▾</button>
          <div class="ds-prod-clm-nav-section">Agreement Statuses</div>
          ${nav.slice(0, 4).map(([id, label]) =>
            `<div class="ds-prod-clm-nav-item ${activeItem === id ? 'active' : ''}" data-clm-nav="${id}">${label}</div>`).join('')}
          <div class="ds-prod-clm-nav-section">Folders</div>
          <div class="ds-prod-clm-nav-item">All Parties <span class="ds-prod-nav-badge">New</span></div>
          ${nav.slice(4).map(([id, label, isNew]) =>
            `<div class="ds-prod-clm-nav-item ${activeItem === id ? 'active' : ''}" data-clm-nav="${id}">${label}${isNew ? ' <span class="ds-prod-nav-badge">New</span>' : ''}</div>`).join('')}
        </aside>
        <main class="ds-prod-clm-main">${mainHtml}</main>
      </div>
    </div>`;
}

function dsClmStatusPill(status) {
  const map = {
    green: ['Fully Approved and ready for Signature', 'ds-prod-clm-pill--green'],
    orange: ['Leadership Review', 'ds-prod-clm-pill--orange'],
    amber: ['With Agency Team', 'ds-prod-clm-pill--amber'],
    red: ['Contracts Team Review', 'ds-prod-clm-pill--red'],
    grey: ['Risk Management Review', 'ds-prod-clm-pill--grey'],
  };
  const [label, cls] = map[status] || [status, 'ds-prod-clm-pill--grey'];
  return `<span class="ds-prod-clm-pill ${cls}">${label}</span>`;
}

const DS_RENDER_MOCK = {
  home(ctx = {}) {
    const name = DS_DEMO.user;
    return `
      <div class="ds-prod-frame ds-prod-frame--home">
        ${dsChrome('', { activeNav: 'Home' })}
        <div class="ds-prod-hero">
          <p class="ds-prod-hero-eyebrow">California Department of Technology · Demo account</p>
          <h2>Welcome back, ${name}</h2>
          <p class="ds-prod-hero-lead">Send envelopes, track agreements, and route contracts through your agency workflow.</p>
          <div class="ds-prod-hero-actions">
            <button type="button" class="ds-prod-btn-yellow">Start ▾</button>
            <button type="button" class="ds-prod-btn-outline">Send an Envelope</button>
            <button type="button" class="ds-prod-btn-outline">Create a Request</button>
            <button type="button" class="ds-prod-btn-outline">Create a Web Form</button>
          </div>
          <div class="ds-prod-hero-stats">
            ${[
              ['12', 'Awaiting signature'], ['36', 'Open requests'], ['94', 'Agreements tracked'],
            ].map(([n, l]) => `<div class="ds-prod-hero-stat"><strong>${n}</strong><span>${l}</span></div>`).join('')}
          </div>
        </div>
        <div class="ds-prod-home-grid">
          <div class="ds-prod-home-main">
            <div class="ds-prod-card ds-prod-card--elevated">
              <div class="ds-prod-card-head">TASKS <span class="ds-prod-card-count">(3)</span> <span class="ds-prod-card-link">View all ›</span></div>
              ${[
                ['Needs To Sign', DS_DEMO.team, 'CDT MSA — DGS STD 213 Signature Required', 'Due Oct 15', 'urgent'],
                ['Needs To Sign', DS_DEMO.team, 'Grant Agreement — FY26 Disbursement', 'Due Sep 27', ''],
                ['Needs To Review', DS_DEMO.team, 'Vendor registration — IPP goal plan', 'Due Oct 1', ''],
              ].map(([status, from, taskName, due, tone]) => `
                <div class="ds-prod-task-row">
                  <span class="ds-prod-task-icon">✎</span>
                  <div class="ds-prod-task-body">
                    <span class="ds-prod-task-status ds-prod-task-status--${tone || 'default'}">${status}</span>
                    <strong>${taskName}</strong>
                    <small>From ${from}</small>
                  </div>
                  <span class="ds-prod-task-due">${due}</span>
                  <span class="ds-prod-kebab">⋮</span>
                </div>`).join('')}
            </div>
            <div class="ds-prod-card ds-prod-card--elevated">
              <div class="ds-prod-card-head">AGREEMENT ACTIVITY <span class="ds-prod-card-info" title="Recent agreement events">ⓘ</span></div>
              ${[
                ['SOW OHA-RFP-2026-038_Sample_SOW.docx', 'Expiring in 90 days', 'amber'],
                ['CDT MSA — Acme Cloud (AV1).docx', 'Completed', 'green'],
                ['Vendor Registration — IPP_goal_template.pdf', 'Completed', 'green'],
              ].map(([file, status, color]) => `
                <div class="ds-prod-activity-row">
                  <span class="ds-prod-file-icon">📄</span>
                  <div class="ds-prod-activity-body"><strong>${file}</strong></div>
                  <span class="ds-prod-status-pill ds-prod-status-pill--${color}">${status}</span>
                </div>`).join('')}
            </div>
          </div>
          <div class="ds-prod-home-side">
            <div class="ds-prod-card ds-prod-card--elevated">
              <div class="ds-prod-card-head">OVERVIEW</div>
              ${[
                ['Open requests', '36'], ['Waiting for others', '8'],
                ['Expiring soon', '3'], ['Completed this month', '28'], ['Upcoming renewals', '1'],
              ].map(([k, v]) => `<div class="ds-prod-overview-row"><span>${k}</span><strong>${v}</strong></div>`).join('')}
            </div>
            <div class="ds-prod-card ds-prod-card--tip">
              <span class="ds-prod-tip-icon">💡</span>
              <div>
                <strong>FI$Cal prefill is on</strong>
                <p>Send Envelope can map vendor and encumbrance fields from your ERP — no re-keying.</p>
                <button type="button" class="ds-prod-link-btn">Try Send Envelope →</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  tasks(ctx = {}) {
    return `
      <div class="ds-prod-frame">
        ${dsChrome('', { activeNav: 'Home' })}
        <div class="ds-prod-page ds-prod-page--tasks">
          <div class="ds-prod-page-head">
            <h2 class="ds-prod-page-title">Tasks</h2>
            <span class="ds-prod-page-sub">3 items need your attention</span>
          </div>
          <div class="ds-prod-filter-bar">
            <div class="ds-prod-search">⌕ Search tasks</div>
            <span class="ds-prod-filter-chip active">Assigned to: Me ×</span>
            <span class="ds-prod-filter-chip">Due: Next 30 days ×</span>
            <button type="button" class="ds-prod-filter-btn">Filters ⚙</button>
          </div>
          <table class="ds-prod-table ds-prod-table--tasks">
            <thead><tr>
              <th>Status</th><th>Name ↕</th><th>Due date ↕</th><th>Assigned ↕</th><th>From</th><th></th>
            </tr></thead>
            <tbody>
              ${[
                ['sign', 'CDT MSA — DGS STD 213 Signature Required', '10/15/2026', '5/18/2026', DS_DEMO.team, true],
                ['sign', 'Grant Agreement — FY26 Disbursement', '9/27/2026', '3/30/2026', DS_DEMO.team, false],
                ['review', 'Vendor registration — IPP goal plan', '10/1/2026', '5/18/2026', DS_DEMO.team, false],
              ].map(([type, name, due, assigned, from, urgent]) => `
                <tr class="${urgent ? 'ds-prod-table-row--highlight' : ''}">
                  <td><span class="ds-prod-task-type ds-prod-task-type--${type}">${type === 'sign' ? 'Needs to sign' : 'Needs review'}</span></td>
                  <td><span class="ds-prod-task-icon">✎</span> ${name}</td>
                  <td class="${urgent ? 'ds-prod-due--urgent' : ''}">${due}</td>
                  <td>${assigned}</td>
                  <td class="ds-prod-muted">${from}</td>
                  <td>⋮</td>
                </tr>`).join('')}
            </tbody>
          </table>
          <div class="ds-prod-pagination">1–3 of 3 <span class="ds-prod-page-num">1</span></div>
        </div>
      </div>`;
  },

  insights(ctx = {}) {
    const lineChartSvg = (dashed = false) => `
      <svg class="ds-prod-chart-svg" viewBox="0 0 360 88" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="dsChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4c00ff" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="#4c00ff" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path fill="url(#dsChartFill)" d="M0,88 L0,62 C40,58 80,48 120,52 C160,56 200,38 240,42 C280,46 320,28 360,32 L360,88 Z"/>
        <path fill="none" stroke="#4c00ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="${dashed ? '6 5' : 'none'}"
          d="M0,62 C40,58 80,48 120,52 C160,56 200,38 240,42 C280,46 320,28 360,32"/>
      </svg>`;

    return `
      <div class="ds-prod-frame ds-prod-frame--split">
        ${dsChrome('', { activeNav: 'Insights' })}
        <div class="ds-prod-split">
          ${dsInsightsSidebar('Agreements')}
          <main class="ds-prod-insights-main">
            <div class="ds-prod-insights-head">
              <h2>Agreements Dashboard <span class="ds-prod-ai-badge">✦ AI-Assisted</span></h2>
              <span class="ds-prod-star" title="Favorite">☆</span>
            </div>
            <div class="ds-prod-filter-row">
              ${[
                ['Agreement Type', 'All types'],
                ['Sets', 'State agencies'],
                ['Parties', 'All parties'],
                ['Time Period', 'Last 12 months'],
              ].map(([label, val]) =>
                `<button type="button" class="ds-prod-filter-chip-btn"><span class="ds-prod-filter-chip-label">${label}</span> ${val} ▾</button>`).join('')}
              <button type="button" class="ds-prod-filter-chip-btn ds-prod-filter-chip-btn--ghost">+ Filters</button>
            </div>
            <div class="ds-prod-kpi-cards">
              <div class="ds-prod-kpi-card">
                <div class="ds-prod-kpi-label">All agreements</div>
                <div class="ds-prod-kpi-num">2,064</div>
              </div>
              <div class="ds-prod-kpi-card">
                <div class="ds-prod-kpi-label">Expiring agreements</div>
                <div class="ds-prod-kpi-num">94</div>
                <small>Next 3 months</small>
              </div>
              <div class="ds-prod-kpi-card">
                <div class="ds-prod-kpi-label">Renewing agreements</div>
                <div class="ds-prod-kpi-num">16</div>
                <small>Renewal notice window</small>
              </div>
            </div>
            <div class="ds-prod-chart-grid">
              <div class="ds-prod-chart-card ds-prod-chart-card--wide">
                <div class="ds-prod-chart-title">Active agreements over time</div>
                <div class="ds-prod-chart-viz">${lineChartSvg()}</div>
                <div class="ds-prod-chart-axis"><span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span></div>
              </div>
              <div class="ds-prod-chart-card">
                <div class="ds-prod-chart-title">Agreement types</div>
                <div class="ds-prod-donut-wrap">
                  <div class="ds-prod-donut" aria-hidden="true"></div>
                  <ul class="ds-prod-donut-legend">
                    ${[
                      ['#4c00ff', 'Master Service Agreement', '380'],
                      ['#0ea5e9', 'Services Agreement', '272'],
                      ['#ec4899', 'Non-Disclosure Agreement', '252'],
                      ['#f59e0b', 'Form', '435'],
                    ].map(([color, label, count]) =>
                      `<li><span class="ds-prod-legend-dot" style="background:${color}"></span>${label} <strong>${count}</strong></li>`).join('')}
                  </ul>
                </div>
              </div>
              <div class="ds-prod-chart-card">
                <div class="ds-prod-chart-title">Top parties by contract value</div>
                <div class="ds-prod-bar-chart">
                  ${[
                    ['CA Dept of Technology', 88, false],
                    ['CA Dept of Water Resources', 76, true],
                    ['Acme Cloud Solutions', 52, false],
                  ].map(([label, h, hi]) =>
                    `<div class="ds-prod-bar-wrap"><div class="ds-prod-bar ${hi ? 'ds-prod-bar--highlight' : ''}" style="height:${h}%"></div><span>${label}</span></div>`).join('')}
                </div>
              </div>
              <div class="ds-prod-chart-card">
                <div class="ds-prod-chart-title">Agreements taking effect</div>
                <div class="ds-prod-chart-viz ds-prod-chart-viz--muted">${lineChartSvg(true)}</div>
                <div class="ds-prod-chart-axis"><span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span></div>
              </div>
            </div>
          </main>
        </div>
      </div>`;
  },

  agreements(ctx = {}) {
    return `
      <div class="ds-prod-frame ds-prod-frame--agreements">
        ${dsChrome('', { activeNav: 'Agreements' })}
        <div class="ds-prod-page">
          <div class="ds-prod-agreements-head">
            <div>
              <h2 class="ds-prod-page-title">Agreements</h2>
              <p class="ds-prod-page-sub">2,064 active · 94 expiring in 90 days</p>
            </div>
            <button type="button" class="ds-prod-btn-primary-sm">+ Upload agreement</button>
          </div>
          <div class="ds-prod-insights-banner">
            <div class="ds-prod-insights-banner-head">
              <strong>✦ My Insights</strong>
              <button type="button" class="ds-prod-link-btn">Hide Insights ×</button>
            </div>
            <div class="ds-prod-insights-banner-grid">
              <div class="ds-prod-mini-chart-card"><div class="ds-prod-chart-title">Upcoming renewals</div><div class="ds-prod-mini-bars"></div></div>
              <div class="ds-prod-insight-card">
                <strong>3 MSAs expire in Q3 2026</strong>
                <p>CDT cloud contracts need renewal notice — start Agreement Desk requests now.</p>
                <button type="button" class="ds-prod-btn-primary-sm">View expiring</button>
                <button type="button" class="ds-prod-btn-ghost-sm">Do This Later</button>
              </div>
            </div>
          </div>
          <div class="ds-prod-search-row">
            <div class="ds-prod-search ds-prod-search--wide">Try "MSAs expiring before December 2026"</div>
            <button type="button" class="ds-prod-filter-btn">Filters</button>
            <button type="button" class="ds-prod-btn-primary-sm">✦ Ask Iris</button>
          </div>
          <div class="ds-prod-table-wrap">
          <table class="ds-prod-table ds-prod-table--agreements">
            <thead><tr>
              <th>Original File Name</th><th>Parties</th><th>Status</th><th>Type</th><th>Value</th><th>Effective</th><th>Expires</th>
            </tr></thead>
            <tbody>
              ${[
                ['CDT MSA — Acme Cloud (AV1).docx', 'California Dept of Technology; Acme Cloud Solutions', 'Active', 'Master Service Agreement', '$2,400,000', '1/15/2026', '1/14/2029', ''],
                ['DGS STD 213 — Phase II SOW.docx', 'Dept of General Services; Acme Cloud Solutions', 'Active', 'Services Agreement', '$840,000', '3/1/2026', '2/28/2027', ''],
                ['SOW OHA-RFP-2026-038.docx', 'Office of Health Access; Vertex Systems', 'Active', 'Services Agreement', '$420,000', '1/1/2025', '9/30/2026', 'warn'],
                ['Vendor Registration — IPP_goal_template.pdf', 'CDT; Vertex Systems LLC', 'Active', 'Form', '—', '3/10/2026', '—', ''],
              ].map(([file, parties, status, type, val, eff, exp, flag]) => `
                <tr class="${flag === 'warn' ? 'ds-prod-table-row--highlight' : ''}">
                  <td><a class="ds-prod-link">${file}</a></td>
                  <td>${parties}</td>
                  <td><span class="ds-prod-dot-green"></span> ${status}${flag === 'warn' ? ' <span class="ds-prod-expiry-tag">90 days</span>' : ''}</td>
                  <td>${type}</td>
                  <td>${val}</td>
                  <td>${eff}</td>
                  <td>${exp}</td>
                </tr>`).join('')}
            </tbody>
          </table>
          </div>
        </div>
      </div>`;
  },

  agreementDesk(ctx = {}) {
    const rows = [
      ['CDT Cloud Modernization — MSA Intake', 'REQ-2026-4201', 'green', '6/18/2026 9:42 AM', '6/30/2026', 'Contracts Lead · CDT', 'Legal Review · DGS', false],
      ['FI$Cal integration SOW amendment', 'REQ-2026-4198', 'orange', '6/17/2026 4:15 PM', '6/28/2026', 'Procurement · DGS', 'Unassigned', false],
      ['Vendor registration — Vertex Systems', 'REQ-2026-4192', 'red', '6/16/2026 11:03 AM', '6/25/2026', 'Contracts Lead · CDT', 'Contracts Team', false],
      ['Prevailing wage attestation upload', 'REQ-2026-4187', 'grey', '6/15/2026 2:28 PM', '6/22/2026', 'Program Office · CDT', 'Risk Management', false],
      ['DGS STD 213 — Phase II task order', 'REQ-2026-4181', 'amber', '6/14/2026 8:55 AM', '6/20/2026', 'Procurement · DGS', 'Agency Team', false],
    ];
    const body = `
      <div class="ds-prod-desk">
        <div class="ds-prod-desk-head">
          <h2>Agreement Desk</h2>
          <div class="ds-prod-desk-head-actions">
            <div class="ds-prod-search ds-prod-search--desk">⌕ Search request titles or IDs…</div>
            <button type="button" class="ds-prod-btn-outline-sm">Settings</button>
            <button type="button" class="ds-prod-btn-primary-sm" data-desk-action="new-request">Create Request</button>
          </div>
        </div>
        <div class="ds-prod-desk-filters">
          <span class="ds-prod-filter-chip active">Status: Open ×</span>
          ${['Created At', 'Due Date', 'Owner', 'Request Type', 'Annual Contract Value'].map(f =>
            `<button type="button" class="ds-prod-filter-chip-btn">${f} ▾</button>`).join('')}
          <span class="ds-prod-desk-filter-spacer"></span>
          <button type="button" class="ds-prod-filter-chip-btn">⚙ Filters</button>
        </div>
        <div class="ds-prod-desk-table-wrap">
          <table class="ds-prod-desk-table">
            <thead><tr>
              <th>Title ↕</th><th>Status ↕</th><th>Last Activity ↕</th><th>Due Date ↕</th><th>Submitter ↕</th><th>Owner ↕</th><th></th>
            </tr></thead>
            <tbody>
              ${rows.map(([title, id, status, activity, due, submitter, owner, hi]) => `
                <tr class="ds-prod-desk-row ${hi ? 'highlight' : ''}" data-desk-open="request">
                  <td><strong>${title}</strong><small>${id}</small></td>
                  <td>${dsClmStatusPill(status)}</td>
                  <td class="ds-prod-muted">${activity}</td>
                  <td>${due}</td>
                  <td><span class="ds-prod-avatar-sm">${DS_DEMO.initials}</span> ${submitter}</td>
                  <td>${owner === 'Unassigned' ? '<span class="ds-prod-muted">Unassigned</span>' : `<span class="ds-prod-avatar-sm">LG</span> ${owner}`}</td>
                  <td class="ds-prod-desk-actions">
                    <button type="button" class="ds-prod-desk-icon" title="Audit trail">🕐</button>
                    <button type="button" class="ds-prod-desk-icon" title="Redline in Word">✎</button>
                    <button type="button" class="ds-prod-desk-icon" title="Route for approval">✓</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="ds-prod-desk-foot">
          <span>25 / page ▾</span>
          <span>1 – 5 of 36 <span class="ds-prod-page-arrows">‹ ›</span></span>
        </div>
      </div>`;
    return dsClmAgreementsShell('requests', body);
  },

  requestIntake(ctx = {}) {
    const body = `
      <div class="ds-prod-intake">
        <div class="ds-prod-intake-head">
          <div>
            <span class="ds-prod-intake-eyebrow">New request · Agreement Desk</span>
            <h2>DGS STD 213 Master Services Agreement</h2>
            <div class="ds-prod-intake-progress"><div class="ds-prod-intake-progress-fill" style="width:35%"></div></div>
            <small>35% completed · FI$Cal vendor record pre-filled</small>
          </div>
          <span class="ds-prod-ai-badge">✦ AI-Assisted intake</span>
        </div>
        <form class="ds-prod-intake-form" onsubmit="return false">
          ${[
            ['Vendor', 'Acme Cloud Solutions', 'text'],
            ['Vendor Address', '915 L Street, Sacramento, CA 95814', 'text'],
            ['Annual Contract Value', '$2,400,000.00', 'money'],
            ['Term Length', '3 years + two 1-year options', 'select'],
            ['Effective Date', '07/01/2026', 'date'],
            ['Governing Law', 'State of California', 'text'],
            ['Control Number', 'REQ-CA-2026-4201', 'text'],
            ['Umbrella Insurance *', 'Meets Gov Code §927.8', 'select'],
            ['On agency paper?', 'Yes — DGS STD 213', 'select'],
          ].map(([label, val, type]) => `
            <label class="ds-prod-intake-field">
              <span>${label}</span>
              <div class="ds-prod-intake-input ${type === 'select' ? 'ds-prod-intake-input--select' : ''}">${val}${type === 'select' ? ' ▾' : ''}</div>
            </label>`).join('')}
          <button type="button" class="ds-prod-btn-primary-sm ds-prod-intake-submit">Submit request →</button>
        </form>
      </div>`;
    return dsClmAgreementsShell('requests', body);
  },

  requestWorkspace(ctx = {}) {
    const title = ctx.requestTitle || 'CDT Cloud Modernization — MSA Intake';
    const activeTab = ctx.activeTab || 'overview';
    const tabs = ['Overview', 'Details', 'Documents', 'Approvals', 'Envelopes'];
    const auditEvents = [
      ['6/18/2026', '⚙', 'Workflow Builder changed status to <strong>Fully Approved and ready for Signature</strong>'],
      ['', '✓', 'Legal Review accepted approval — liability cap matches DGS STD 213'],
      ['', '✎', 'Contracts Lead applied <strong>AI-suggested redline</strong> to Article 6 in Word'],
      ['', '📄', `${DS_DEMO.vendor} uploaded <strong>CDT MSA — Cloud Services SOW.docx</strong>`],
      ['', '💬', 'Message sent to Legal Review — "Please confirm insurance certificates before signature."'],
      ['6/17/2026', '⚙', 'Workflow Builder routed request to <strong>Risk Management Review</strong>'],
      ['', '🤖', 'Iris AI scorecard completed — <strong>88/100</strong> playbook match'],
    ];
    return `
      <div class="ds-prod-frame ds-prod-frame--request-ws">
        <div class="ds-prod-request-head">
          <button type="button" class="ds-prod-ws-back" data-desk-action="desk">←</button>
          <div class="ds-prod-request-head-main">
            <h2>${title}</h2>
            ${dsClmStatusPill('green')}
          </div>
          <div class="ds-prod-request-actions">
            <span class="ds-prod-avatar-sm">${DS_DEMO.initials}</span><span class="ds-prod-avatar-sm">LG</span><span class="ds-prod-avatar-sm">RM</span>
            <button type="button" class="ds-prod-btn-outline-sm">Following</button>
            <button type="button" class="ds-prod-btn-outline-sm">Share</button>
          </div>
        </div>
        <div class="ds-prod-request-toolbar">
          ${tabs.map(t => `
            <button type="button" class="ds-prod-request-tab ${t.toLowerCase() === activeTab ? 'active' : ''}" data-req-tab="${t.toLowerCase()}">${t}</button>`).join('')}
          <span class="ds-prod-request-toolbar-spacer"></span>
          <button type="button" class="ds-prod-btn-outline-sm">✎ Redline in Word</button>
          <button type="button" class="ds-prod-btn-outline-sm">Route for approval</button>
          <button type="button" class="ds-prod-btn-primary-sm">Send Message</button>
        </div>
        <div class="ds-prod-request-ws-body">
          <div class="ds-prod-req-panels">
            <main class="ds-prod-req-panel${activeTab === 'overview' ? ' active' : ''}" data-req-panel="overview"${activeTab !== 'overview' ? ' hidden' : ''}>
              <div class="ds-prod-feed ds-prod-feed--audit">
                <div class="ds-prod-feed-head">
                  <strong>Activity feed</strong>
                  <span class="ds-prod-audit-badge">Audit trail</span>
                  <select class="ds-prod-select-sm"><option>All activity</option><option>Messages</option><option>Approvals</option><option>Documents</option></select>
                  <button type="button" class="ds-prod-btn-primary-sm ds-desk-send-message">Send message</button>
                </div>
                <div class="ds-prod-feed-compose ds-prod-feed-compose--open">
                  <div class="ds-prod-msg-header">To: Legal Review · DGS</div>
                  <textarea readonly>Please confirm STD 213 insurance thresholds before we route to signature.</textarea>
                  <div class="ds-prod-msg-actions">
                    <button type="button" class="ds-prod-btn-ghost-sm">Reply</button>
                    <button type="button" class="ds-prod-btn-primary-sm">Send</button>
                  </div>
                </div>
                ${auditEvents.map(([date, icon, html]) => `
                  <div class="ds-prod-feed-block">
                    ${date ? `<span class="ds-prod-feed-date">${date}</span>` : ''}
                    <div class="ds-prod-feed-row"><span class="ds-prod-feed-icon">${icon}</span><span>${html}</span></div>
                  </div>`).join('')}
              </div>
            </main>
            <main class="ds-prod-req-panel${activeTab === 'details' ? ' active' : ''}" data-req-panel="details"${activeTab !== 'details' ? ' hidden' : ''}>
              <div class="ds-prod-details-head"><h3>Intake details</h3><button type="button" class="ds-prod-btn-primary-sm">Change request type</button></div>
              <div class="ds-prod-details-card">
                ${[
                  ['Request type', 'Cloud services MSA'], ['Funding', 'FI$Cal · CDT enterprise fund'],
                  ['Risk tier', 'Tier 2 — DGS review required'],
                  ['Subject', 'Statewide cloud modernization MSA on DGS STD 213 paper with AV1 workflow trigger.'],
                ].map(([k, v]) => `<div class="ds-prod-details-row"><span>${k}</span><p>${v}</p></div>`).join('')}
                <div class="ds-prod-details-block"><strong>Scope of work</strong><p>Managed cloud, state SSO federation, and migration support — 3-year term aligned with CDT strategic plan FY26–28.</p></div>
                <div class="ds-prod-details-block"><strong>Evaluation criteria</strong><p>Technical approach, US data residency, prior state experience, and price per DGS IT procurement manual.</p></div>
              </div>
            </main>
            <main class="ds-prod-req-panel${activeTab === 'documents' ? ' active' : ''}" data-req-panel="documents"${activeTab !== 'documents' ? ' hidden' : ''}>
              <div class="ds-prod-docs-head"><h3>Documents</h3><button type="button" class="ds-prod-btn-primary-sm ds-desk-redline">Edit in Word ↗</button><button type="button" class="ds-prod-btn-dark-sm">✦ AI-assisted review</button></div>
              ${[
                ['CDT MSA — Cloud Services SOW.docx', 'Latest · redlines on Art. 6', true],
                ['DGS Form STD 213 — MSA template.pdf', 'Agency paper', false],
                ['FI$Cal encumbrance confirmation.pdf', 'Finance attachment', false],
              ].map(([name, meta, latest]) => `
                <div class="ds-prod-doc-row ${latest ? 'ds-prod-doc-row--latest' : ''}">
                  <span class="ds-prod-file-icon">📄</span><div><strong>${name}</strong><small>${meta}</small></div>
                  <button type="button" class="ds-prod-btn-ghost-sm">Version history</button>
                </div>`).join('')}
            </main>
            <main class="ds-prod-req-panel${activeTab === 'approvals' ? ' active' : ''}" data-req-panel="approvals"${activeTab !== 'approvals' ? ' hidden' : ''}>
              <div class="ds-prod-approval-head"><h3>Approval routing</h3><button type="button" class="ds-prod-btn-primary-sm ds-desk-send-approval">Route next approver</button></div>
              <div class="ds-prod-approval-chain">
                ${[
                  ['Contracts Lead', 'CDT', 'done', 'Approved intake package'],
                  ['DGS Policy', 'Dept of General Services', 'done', 'Playbook match · data residency OK'],
                  ['Legal Reviewer', 'DGS Legal', 'active', 'Reviewing liability cap redlines'],
                  ['Executive Sponsor', 'CDT', 'pending', 'Awaiting prior steps'],
                ].map(([role, dept, state, note]) => `
                  <div class="ds-prod-approval-step ds-prod-approval-step--${state}">
                    <span class="ds-prod-approval-dot"></span><div><strong>${role}</strong><small>${dept}</small><p>${note}</p></div>
                  </div>`).join('')}
              </div>
            </main>
            <main class="ds-prod-req-panel${activeTab === 'envelopes' ? ' active' : ''}" data-req-panel="envelopes"${activeTab !== 'envelopes' ? ' hidden' : ''}>
              <p class="ds-prod-muted" style="padding:20px 0">No envelopes yet — route for approval to generate the DGS STD 213 signature packet.</p>
            </main>
          </div>
          <aside class="ds-prod-request-side">
            <button type="button" class="ds-prod-btn-primary-sm ds-prod-btn-full">✦ Chat with request</button>
            <div class="ds-prod-side-section">
              <strong>Information</strong>
              ${[
                ['Request ID', 'REQ-2026-4201'], ['Status', 'Ready for signature'],
                ['Request type', 'Cloud services MSA'], ['Submitter', DS_DEMO.lead],
                ['Owner', 'Legal Review · DGS'], ['ERP source', 'FI$Cal pre-fill'],
                ['Due Date', '6/30/2026'], ['Created', '6/14/2026'],
              ].map(([k, v]) => `<div class="ds-prod-side-row"><span>${k}</span><span>${v}</span></div>`).join('')}
            </div>
            <div class="ds-prod-side-actions">
              <button type="button" class="ds-prod-side-action">📄 View documents</button>
              <button type="button" class="ds-prod-side-action">✓ Approval chain</button>
            </div>
          </aside>
          <aside class="ds-prod-iris-panel">
            <div class="ds-prod-iris-head"><strong>✦ Iris</strong><span>AI assistant</span></div>
            <div class="ds-prod-iris-thread">
              <div class="ds-prod-iris-msg ds-prod-iris-msg--user">Summarize this request and list approval blockers.</div>
              <div class="ds-prod-iris-msg ds-prod-iris-msg--ai">
                <strong>Request summary</strong>
                <p>CDT is procuring a 3-year cloud modernization MSA ($2.4M) with Acme Cloud Solutions. FI$Cal vendor data and DGS STD 213 terms are pre-filled.</p>
                <strong>What happened so far</strong>
                <ul>
                  <li>Intake submitted via Agreement Desk</li>
                  <li>Iris scorecard: 88/100 — Article 6 liability flagged, redline applied</li>
                  <li>Legal and risk reviews complete</li>
                  <li>Ready for executive signature routing</li>
                </ul>
              </div>
            </div>
            <div class="ds-prod-iris-input">
              <input type="text" placeholder="Ask Iris about this request…" readonly />
              <span>→</span>
            </div>
          </aside>
        </div>
      </div>`;
  },

  request(ctx = {}) {
    return DS_RENDER_MOCK.requestWorkspace(ctx);
  },

  sendEnvelope(ctx = {}) {
    const reqId = ctx.requestId || 'REQ-CA-2026-4201';
    const steps = [
      ['Upload', true], ['Recipients', true], ['Customize', true], ['Message', false], ['Review', false],
    ];
    return `
      <div class="ds-prod-frame ds-prod-frame--send ds-prod-send-builder">
        <header class="ds-prod-send-builder-top">
          <button type="button" class="ds-prod-send-back" aria-label="Back">←</button>
          <div class="ds-prod-send-builder-title">
            <span class="ds-prod-send-mark" aria-hidden="true">✉</span>
            <div>
              <strong>Send an Envelope</strong>
              <span>DGS STD 213 MSA — Acme Cloud Solutions</span>
            </div>
          </div>
          <span class="ds-prod-send-builder-spacer"></span>
          <span class="ds-prod-draft-tag">Draft</span>
          <button type="button" class="ds-prod-btn-ghost-sm">Save &amp; Close</button>
          <button type="button" class="ds-prod-btn-outline-sm">Actions ▾</button>
        </header>
        <nav class="ds-prod-send-steps" aria-label="Send progress">
          ${steps.map(([label, done], i) => `
            <span class="ds-prod-send-step ${done ? 'ds-prod-send-step--done' : ''} ${i === 2 ? 'ds-prod-send-step--active' : ''}">
              <span class="ds-prod-send-step-num">${done && i !== 2 ? '✓' : i + 1}</span>
              ${label}
            </span>`).join('<span class="ds-prod-send-step-line" aria-hidden="true"></span>')}
        </nav>
        <div class="ds-prod-send-prefill-banner">
          <span class="ds-prod-send-prefill-icon" aria-hidden="true">🏛</span>
          <div>
            <strong>FI$Cal prefill applied</strong>
            <span>6 tab fields mapped from trigger_inputs · ${reqId}</span>
          </div>
          <button type="button" class="ds-prod-link-btn">View mapping</button>
        </div>
        <div class="ds-prod-send-builder-body">
          <aside class="ds-prod-send-docs">
            <p class="ds-prod-send-panel-label">Documents</p>
            ${[
              ['DGS STD 213 — MSA.pdf', '12 pages · template', true],
              ['Exhibit A — Cloud SOW.pdf', '4 pages', false],
            ].map(([name, meta, on]) => `
              <button type="button" class="ds-prod-send-doc-thumb ${on ? 'active' : ''}">
                <span class="ds-prod-send-doc-preview" aria-hidden="true"></span>
                <span class="ds-prod-send-doc-meta"><strong>${name}</strong><small>${meta}</small></span>
              </button>`).join('')}
            <button type="button" class="ds-prod-send-add-doc">+ Add documents</button>
          </aside>
          <main class="ds-prod-send-canvas">
            <div class="ds-prod-send-canvas-toolbar">
              <span>Page 1 of 12</span>
              <span class="ds-prod-send-canvas-spacer"></span>
              <button type="button" class="ds-prod-send-tool active">Sign</button>
              <button type="button" class="ds-prod-send-tool">Initial</button>
              <button type="button" class="ds-prod-send-tool">Date</button>
              <button type="button" class="ds-prod-send-tool">Text</button>
            </div>
            <div class="ds-prod-send-sheet">
              <div class="ds-prod-send-sheet-head">
                <p class="ds-prod-send-sheet-agency">State of California · Department of General Services</p>
                <h3>Master Services Agreement</h3>
                <p class="ds-prod-send-sheet-sub">Standard Form STD 213 · ${reqId}</p>
              </div>
              <table class="ds-prod-send-sheet-table">
                <tr><td>Vendor</td><td>Acme Cloud Solutions</td></tr>
                <tr><td>Contract value</td><td>$2,400,000</td></tr>
                <tr><td>Term</td><td>3 years + two 1-year options</td></tr>
              </table>
              <p class="ds-prod-send-sheet-body">This agreement governs statewide cloud modernization services for the California Department of Technology.</p>
              <div class="ds-prod-send-field ds-prod-send-field--sign ds-prod-send-field--on" style="top:58%;left:12%">
                <span>Sign</span><small>James Chen</small>
              </div>
              <div class="ds-prod-send-field ds-prod-send-field--sign" style="top:58%;left:52%">
                <span>Sign</span><small>Maria Santos</small>
              </div>
              <div class="ds-prod-send-field ds-prod-send-field--date" style="top:68%;left:12%">
                <span>Date</span>
              </div>
            </div>
          </main>
          <aside class="ds-prod-send-recipients">
            <div class="ds-prod-send-recipients-head">
              <p class="ds-prod-send-panel-label">Recipients</p>
              <button type="button" class="ds-prod-link-btn">+ Add</button>
            </div>
            ${[
              [1, 'James Chen', 'Program Manager · CDT', 'Needs to Sign', 'JC'],
              [2, 'Maria Santos', 'Authorized Signatory · Acme Cloud', 'Needs to Sign', 'MS'],
            ].map(([order, name, role, action, ini]) => `
              <div class="ds-prod-send-recipient ${order === 1 ? 'active' : ''}">
                <span class="ds-prod-send-route-num">${order}</span>
                <span class="ds-prod-avatar-sm">${ini}</span>
                <div>
                  <strong>${name}</strong>
                  <small>${role}</small>
                  <span class="ds-prod-send-recipient-action">${action}</span>
                </div>
                <button type="button" class="ds-prod-send-recipient-menu" aria-label="Options">⋯</button>
              </div>`).join('')}
            <div class="ds-prod-send-recipient-note">
              <strong>Signing order</strong>
              <p>Agency signs first, then vendor counter-signs — matches DGS STD 213 routing.</p>
            </div>
          </aside>
        </div>
        <footer class="ds-prod-send-footer">
          <button type="button" class="ds-prod-btn-ghost-sm">Back</button>
          <span class="ds-prod-send-footer-spacer"></span>
          <button type="button" class="ds-prod-btn-outline-sm" data-ds-send-switch="sendEnvelopeReview">Next: Review</button>
        </footer>
      </div>`;
  },

  sendEnvelopeReview(ctx = {}) {
    const reqId = ctx.requestId || 'REQ-CA-2026-4201';
    return `
      <div class="ds-prod-frame ds-prod-frame--send ds-prod-send-review">
        <header class="ds-prod-send-builder-top">
          <button type="button" class="ds-prod-send-back" aria-label="Back">←</button>
          <div class="ds-prod-send-builder-title">
            <span class="ds-prod-send-mark" aria-hidden="true">✉</span>
            <div>
              <strong>Review and send</strong>
              <span>DGS STD 213 MSA — Acme Cloud Solutions</span>
            </div>
          </div>
          <span class="ds-prod-send-builder-spacer"></span>
          <span class="ds-prod-draft-tag">Draft</span>
        </header>
        <div class="ds-prod-send-review-body">
          <div class="ds-prod-send-review-main">
            <div class="ds-prod-send-review-card">
              <h3>Envelope summary</h3>
              <dl class="ds-prod-send-review-dl">
                <div><dt>Subject</dt><dd>DGS STD 213 MSA — Acme Cloud Solutions</dd></div>
                <div><dt>Request ID</dt><dd>${reqId}</dd></div>
                <div><dt>Documents</dt><dd>2 files · 16 pages total</dd></div>
                <div><dt>Reminders</dt><dd>Every 3 days until completed</dd></div>
              </dl>
            </div>
            <div class="ds-prod-send-review-card">
              <h3>Recipients</h3>
              <ul class="ds-prod-send-review-list">
                <li><span class="ds-prod-avatar-sm">JC</span><div><strong>James Chen</strong><small>Signs first · james.chen@cdt.ca.gov</small></div><span class="ds-prod-send-check">✓</span></li>
                <li><span class="ds-prod-avatar-sm">MS</span><div><strong>Maria Santos</strong><small>Signs second · maria.santos@acmecloud.com</small></div><span class="ds-prod-send-check">✓</span></li>
              </ul>
            </div>
            <div class="ds-prod-send-review-card">
              <h3>Message to all recipients</h3>
              <div class="ds-prod-send-review-message">Please review and sign the attached Master Services Agreement on DGS STD 213 paper. Contact the CDT contracts team with questions before signing.</div>
            </div>
          </div>
          <aside class="ds-prod-send-review-aside">
            <div class="ds-prod-send-review-send-card">
              <p class="ds-prod-send-review-ready">Ready to send</p>
              <p class="ds-prod-send-review-meta">Envelope will be delivered over secure email with identity verification for the vendor signer.</p>
              <button type="button" class="ds-prod-btn-yellow ds-prod-btn-full ds-prod-send-submit-btn">Send</button>
              <button type="button" class="ds-prod-btn-ghost-sm ds-prod-btn-full" data-ds-send-switch="sendEnvelope">← Back to prepare</button>
            </div>
            <div class="ds-prod-send-review-prefill">
              <strong>Prefill source</strong>
              <p>FI$Cal · 6 fields applied from trigger_inputs</p>
            </div>
          </aside>
        </div>
      </div>`;
  },

  wordReview(ctx = {}) {
    const docTitle = ctx.docTitle || 'CDT MSA — Cloud Services SOW.docx';
    const legal = DS_DEMO.legal || 'Legal Review';
    return `
      <div class="ds-prod-frame ds-prod-frame--word ds-prod-word-review" data-ds-word-tab="chat">
        <header class="ds-prod-word-top">
          <div class="ds-prod-word-top-left">
            <span class="ds-prod-word-mark" aria-hidden="true">W</span>
            <div class="ds-prod-word-top-meta">
              <span class="ds-prod-word-filename">${docTitle}</span>
              <span class="ds-prod-word-context">Agreement Desk · REQ-CA-2026-4201</span>
            </div>
          </div>
          <span class="ds-prod-draft-tag">Draft</span>
          <span class="ds-prod-word-spacer"></span>
          <div class="ds-prod-word-page-controls">
            <button type="button" class="ds-prod-word-page-btn" aria-label="Previous page">‹</button>
            <span>1 / 4</span>
            <button type="button" class="ds-prod-word-page-btn" aria-label="Next page">›</button>
          </div>
          <span class="ds-prod-word-zoom">100%</span>
          <button type="button" class="ds-prod-btn-primary-sm ds-prod-word-edit-btn">Edit in Word ↗</button>
          <button type="button" class="ds-prod-btn-dark-sm ds-prod-word-ai-btn ds-prod-word-ai-btn--on">✦ AI-Assisted Review</button>
        </header>
        <div class="ds-prod-word-body">
          <aside class="ds-prod-word-rail" aria-label="Document tools">
            <button type="button" class="ds-prod-word-rail-btn ds-prod-word-rail-btn--on" title="Document">📄</button>
            <button type="button" class="ds-prod-word-rail-btn" title="Search">🔍</button>
            <button type="button" class="ds-prod-word-rail-btn" title="Comments">💬</button>
          </aside>
          <div class="ds-prod-word-doc-wrap">
            <article class="ds-prod-word-doc">
              <div class="ds-prod-word-doc-head">
                <span class="ds-prod-doc-type">Statement of Work</span>
                <h3>California Department of Technology<br>Cloud Modernization Services</h3>
              </div>
              <table class="ds-prod-word-table">
                <tr><td>Contract ID</td><td>REQ-CA-2026-4201</td></tr>
                <tr><td>Term</td><td>3 years + two 1-year options</td></tr>
                <tr><td>Total value</td><td class="ds-prod-highlight">$2,400,000</td></tr>
                <tr><td>Data residency</td><td>United States only</td></tr>
              </table>
              <p class="ds-prod-word-lead">Managed cloud infrastructure, security controls, and migration support for agency modernization initiatives.</p>
              <section class="ds-prod-word-clause ds-prod-word-clause--flagged" id="ds-word-clause-liability">
                <h4>Article 6 · Limitation of liability</h4>
                <p>Vendor liability shall not exceed fees paid in the <mark>preceding six (6) months</mark> except for gross negligence or willful misconduct.</p>
                <span class="ds-prod-word-clause-flag">Iris · Deviation from STD 213</span>
              </section>
              <div class="ds-prod-comment-inline">
                <span class="ds-prod-avatar-sm ds-prod-avatar-sm--teal">LR</span>
                <div>
                  <span class="ds-prod-comment-meta">${legal} · 6/5/2026</span>
                  <p>Confirm liability cap matches DGS STD 213 before routing to signature.</p>
                </div>
              </div>
            </article>
          </div>
          <aside class="ds-prod-ai-panel ds-prod-ai-panel--iris">
            <div class="ds-prod-ai-head">
              <div>
                <span class="ds-prod-ai-brand">✦ Iris</span>
                <span class="ds-prod-ai-subbrand">AI-Assisted Review</span>
              </div>
              <button type="button" class="ds-prod-ai-close" aria-label="Close panel">×</button>
            </div>
            <div class="ds-prod-ai-score-row">
              <div class="ds-prod-ai-score-ring" aria-hidden="true"><span>88</span></div>
              <div>
                <p class="ds-prod-ai-score-title">Contract readiness</p>
                <p class="ds-prod-ai-score-sub">2 deviations · 1 legal comment open</p>
              </div>
            </div>
            <div class="ds-prod-ai-clause-list">
              <p class="ds-prod-ai-section-label">Flagged clauses</p>
              <button type="button" class="ds-prod-ai-clause ds-prod-ai-clause--warn ds-prod-ai-clause--on" data-ds-word-clause="liability">
                <span class="ds-prod-ai-clause-icon">⚠</span>
                <span class="ds-prod-ai-clause-text">
                  <strong>Art. 6 Liability cap</strong>
                  <small>6-month lookback · STD 213 expects 12 months</small>
                </span>
              </button>
              <button type="button" class="ds-prod-ai-clause ds-prod-ai-clause--ok" data-ds-word-clause="residency">
                <span class="ds-prod-ai-clause-icon">✓</span>
                <span class="ds-prod-ai-clause-text">
                  <strong>Data residency</strong>
                  <small>US-only · matches agency standard</small>
                </span>
              </button>
              <button type="button" class="ds-prod-ai-clause ds-prod-ai-clause--ok" data-ds-word-clause="insurance">
                <span class="ds-prod-ai-clause-icon">✓</span>
                <span class="ds-prod-ai-clause-text">
                  <strong>Insurance · Gov Code §927.8</strong>
                  <small>Limits and endorsements present</small>
                </span>
              </button>
            </div>
            <div class="ds-prod-ai-body ds-prod-ai-body--clean">
              <div class="ds-prod-ai-summary-card">
                <span class="ds-prod-ai-summary-label">Document summary</span>
                <p>3-year term · $2.4M · US data residency · 90-day renewal notice · Acme Cloud Solutions vendor paper.</p>
              </div>
              <div class="ds-prod-ai-shortcuts ds-prod-ai-shortcuts--compact">
                <button type="button" class="ds-prod-ai-prompt">Does this agreement automatically renew?</button>
                <button type="button" class="ds-prod-ai-prompt">Suggest STD 213 language for Art. 6</button>
                <button type="button" class="ds-prod-ai-prompt">Summarize open legal comments</button>
              </div>
            </div>
            <div class="ds-prod-ai-input">
              <span class="ds-prod-ai-input-plus">+</span>
              <input type="text" placeholder="Ask about this agreement…" readonly />
              <button type="button" class="ds-prod-ai-send" aria-label="Send">→</button>
            </div>
            <small class="ds-prod-ai-disclaimer">AI responses are not legal advice.</small>
          </aside>
        </div>
      </div>`;
  },

  workflowDiagram(ctx = {}) {
    const wfName = ctx.workflowName || 'AV1';
    const reqId = ctx.requestId || 'REQ-CA-2026-4201';
    const steps = [
      { id: 'trigger', num: 1, icon: '⚡', title: 'API Trigger (Prefill)', sub: 'POST trigger_inputs from FI$Cal', badge: 'Start' },
      { id: 'webforms', num: 2, icon: '📋', title: 'Collect Data with Web Forms', sub: 'Vendor · 14 fields pre-populated' },
      { id: 'identify', num: 3, icon: '🪪', title: 'Verify Someone\'s Identity', sub: 'Recipient · Vendor authorized signatory' },
      { id: 'template', num: 4, icon: '📄', title: 'Prepare eSignature Template', sub: 'DGS STD 213 MSA · Acme Cloud Solutions' },
      { id: 'sign', num: 5, icon: '✍', title: 'Send Documents for Signature', sub: 'James Chen · Maria Santos' },
    ];
    const trueSteps = [
      { id: 'confirm-ok', num: '6a', icon: '🖥', title: 'Show a Confirmation Screen', sub: `${reqId} logged to Agreement Manager` },
      { id: 'end-ok', num: '7a', icon: '🏁', title: 'Path End', sub: 'Sync status to FI$Cal · Connect webhook' },
    ];
    const falseSteps = [
      { id: 'confirm-no', num: '6b', icon: '✉', title: 'Send an Email', sub: 'Notify program manager · changes requested' },
      { id: 'end-no', num: '7b', icon: '🏁', title: 'Path End', sub: 'Return task to Agreement Desk queue' },
    ];
    const nodeHtml = (step, selected) => `
      <button type="button" class="ds-prod-wf-node${selected ? ' ds-prod-wf-node--selected' : ''}" data-wf-step="${step.id}">
        <span class="ds-prod-wf-step-num">${step.num}</span>
        <span class="ds-prod-wf-icon" aria-hidden="true">${step.icon}</span>
        <div class="ds-prod-wf-node-body">
          <strong>${step.title}</strong>
          ${step.sub ? `<small>${step.sub}</small>` : ''}
          ${step.badge ? `<span class="ds-prod-wf-node-badge">${step.badge}</span>` : ''}
        </div>
        <span class="ds-prod-wf-node-menu" aria-hidden="true">⋯</span>
      </button>`;
    const connector = '<div class="ds-prod-wf-connector" aria-hidden="true"></div>';
    const addStep = '<button type="button" class="ds-prod-wf-add-step" title="Add step">+</button>';
    return `
      <div class="ds-prod-frame ds-prod-frame--wf ds-prod-wf-builder" data-wf-selected="trigger">
        <header class="ds-prod-wf-top">
          <div class="ds-prod-wf-top-left">
            <span class="ds-prod-wf-mark" aria-hidden="true">WB</span>
            <div class="ds-prod-wf-top-meta">
              <span class="ds-prod-wf-name">${wfName}</span>
              <span class="ds-prod-wf-top-sub">Statewide cloud MSA · FI$Cal prefill</span>
            </div>
          </div>
          <div class="ds-prod-wf-top-status">
            <span class="ds-prod-status-pill ds-prod-status-pill--green">Active</span>
            <span class="ds-prod-draft-tag ds-prod-draft-tag--warn">Unpublished edits</span>
          </div>
          <span class="ds-prod-wf-toolbar-spacer"></span>
          <div class="ds-prod-wf-zoom" aria-label="Canvas zoom">
            <button type="button" class="ds-prod-wf-zoom-btn" disabled aria-label="Zoom out">−</button>
            <span class="ds-prod-wf-zoom-val">100%</span>
            <button type="button" class="ds-prod-wf-zoom-btn" disabled aria-label="Zoom in">+</button>
          </div>
          <button type="button" class="ds-prod-btn-outline-sm ds-prod-wf-btn-ghost">Preview</button>
          <button type="button" class="ds-prod-btn-primary-sm">Publish</button>
        </header>
        <div class="ds-prod-wf-subbar">
          <span>7 steps</span>
          <span class="ds-prod-wf-subbar-dot" aria-hidden="true">·</span>
          <span>1 branching rule</span>
          <span class="ds-prod-wf-subbar-dot" aria-hidden="true">·</span>
          <span class="ds-prod-wf-subbar-live">Last published Jun 12, 2026</span>
        </div>
        <div class="ds-prod-wf-body">
          <div class="ds-prod-wf-canvas-wrap">
            <div class="ds-prod-wf-canvas">
              ${steps.map((step, i) => `
                <div class="ds-prod-wf-lane">
                  ${nodeHtml(step, step.id === 'trigger')}
                  ${i < steps.length - 1 ? `${connector}${addStep}${connector}` : connector}
                </div>`).join('')}
              <div class="ds-prod-wf-fork">
                <div class="ds-prod-wf-branch-rule">
                  <span class="ds-prod-wf-step-num">6</span>
                  <span class="ds-prod-wf-icon" aria-hidden="true">⑂</span>
                  <div class="ds-prod-wf-node-body">
                    <strong>Add a Branching Rule</strong>
                    <small>Envelope status = completed</small>
                  </div>
                </div>
                <div class="ds-prod-wf-fork-rail" aria-hidden="true">
                  <span class="ds-prod-wf-fork-line ds-prod-wf-fork-line--left"></span>
                  <span class="ds-prod-wf-fork-line ds-prod-wf-fork-line--right"></span>
                </div>
                <div class="ds-prod-wf-fork-cols">
                  <div class="ds-prod-wf-fork-col">
                    <span class="ds-prod-wf-branch-label ds-prod-wf-branch-label--true">True</span>
                    ${trueSteps.map((step, i) => `
                      <div class="ds-prod-wf-lane">
                        ${nodeHtml(step, false)}
                        ${i < trueSteps.length - 1 ? connector : ''}
                      </div>`).join('')}
                  </div>
                  <div class="ds-prod-wf-fork-col ds-prod-wf-fork-col--alt">
                    <span class="ds-prod-wf-branch-label ds-prod-wf-branch-label--false">False</span>
                    ${falseSteps.map((step, i) => `
                      <div class="ds-prod-wf-lane">
                        ${nodeHtml(step, false)}
                        ${i < falseSteps.length - 1 ? connector : ''}
                      </div>`).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <aside class="ds-prod-wf-inspector" aria-label="Step configuration">
            <p class="ds-prod-wf-inspector-kicker">Step properties</p>
            <div class="ds-prod-wf-inspector-panel" data-wf-panel="trigger">
              <h3 class="ds-prod-wf-inspector-title">API Trigger (Prefill)</h3>
              <p class="ds-prod-wf-inspector-desc">Starts the workflow when your ERP posts procurement data. Map source fields into <code>trigger_inputs</code>.</p>
              <div class="ds-prod-wf-inspector-chip-row">
                <span class="ds-prod-wf-chip">FI$Cal</span>
                <span class="ds-prod-wf-chip">POST</span>
                <span class="ds-prod-wf-chip">OAuth scoped</span>
              </div>
              <label class="ds-prod-wf-inspector-field">Trigger name
                <input type="text" value="AV1 — vendor onboard" readonly />
              </label>
              <p class="ds-prod-wf-inspector-kicker">Sample trigger_inputs</p>
              <pre class="ds-prod-wf-code">${JSON.stringify({
                request_id: reqId,
                vendor_name: 'Acme Cloud Solutions',
                contract_type: 'MSA',
                estimated_value: 2400000,
                template_id: 'DGS-STD-213',
              }, null, 2)}</pre>
              <button type="button" class="ds-prod-btn-outline-sm ds-prod-btn-full">Copy sample payload</button>
            </div>
            <div class="ds-prod-wf-inspector-panel" data-wf-panel="webforms" hidden>
              <h3 class="ds-prod-wf-inspector-title">Collect Data with Web Forms</h3>
              <p class="ds-prod-wf-inspector-desc">Vendor completes the IPP goal plan; 14 fields pre-filled from trigger_inputs.</p>
              <label class="ds-prod-wf-inspector-field">Form
                <input type="text" value="Transit Operator Benefits — IPP Goal Plan" readonly />
              </label>
              <label class="ds-prod-wf-inspector-field">Recipient role
                <input type="text" value="Vendor authorized signatory" readonly />
              </label>
            </div>
            <div class="ds-prod-wf-inspector-panel" data-wf-panel="identify" hidden>
              <h3 class="ds-prod-wf-inspector-title">Verify Someone's Identity</h3>
              <p class="ds-prod-wf-inspector-desc">ID verification before signature — reduces fraud on high-value MSAs.</p>
              <label class="ds-prod-wf-inspector-field">Method
                <input type="text" value="Government ID + selfie match" readonly />
              </label>
            </div>
            <div class="ds-prod-wf-inspector-panel" data-wf-panel="template" hidden>
              <h3 class="ds-prod-wf-inspector-title">Prepare eSignature Template</h3>
              <p class="ds-prod-wf-inspector-desc">DGS STD 213 populated with vendor and contract metadata from earlier steps.</p>
              <label class="ds-prod-wf-inspector-field">Template
                <input type="text" value="DGS STD 213 MSA — Acme Cloud" readonly />
              </label>
            </div>
            <div class="ds-prod-wf-inspector-panel" data-wf-panel="sign" hidden>
              <h3 class="ds-prod-wf-inspector-title">Send Documents for Signature</h3>
              <p class="ds-prod-wf-inspector-desc">Agency program manager and vendor counter-signer routing.</p>
              <ul class="ds-prod-wf-inspector-list">
                <li><strong>James Chen</strong> · Program Manager · signs first</li>
                <li><strong>Maria Santos</strong> · Vendor · signs second</li>
              </ul>
            </div>
            <div class="ds-prod-wf-inspector-panel" data-wf-panel="default" hidden>
              <h3 class="ds-prod-wf-inspector-title">Branch step</h3>
              <p class="ds-prod-wf-inspector-desc">Select a step on the canvas to edit routing, recipients, or API mappings.</p>
            </div>
          </aside>
        </div>
      </div>`;
  },

  workflowSteps(ctx = {}) {
    const steps = [
      ['Suggested', 'API Trigger (Prefill)', 'Start AV1 from FI$Cal or agency ERP with trigger_inputs', '⚡', true],
      ['Suggested', 'Collect Data with Web Forms', 'Send a form out to capture data', '📋', true],
      ['Suggested', 'Prepare a Signature Template', 'Configure an eSignature template for use in Workflow Builder', '📄', true],
      ['Suggested', 'Send an Email', 'Send a customizable message', '✉', true],
      ['Documents', 'Use eSignature API', 'Add an eSignature workflow from our list of APIs', '</>', false],
      ['Documents', 'Prepare Document Template', 'Create accurate, custom agreements', '📄', false],
      ['Documents', 'Send Documents for Signature', 'Prepare and send documents for signature', '✍', false],
      ['Docusign Identify', 'Verify Someone\'s Identity', 'Verify a participant\'s identity', '🛡', false],
      ['Docusign Identify', 'Risk Assessment', 'Assess the risk of a participant\'s identity', '🔍', false],
      ['Workflow Controls', 'Add a Branching Rule', 'Route files depending on criteria', '⑂', false],
    ];
    let lastSection = '';
    const rows = steps.map(([section, title, desc, icon, suggested]) => {
      const sectionHead = section !== lastSection
        ? `<div class="ds-prod-drawer-section">${section}${section === 'Suggested' ? '' : ' <a class="ds-prod-link">See how it works ▶</a>'}</div>`
        : '';
      lastSection = section;
      return `${sectionHead}
        <div class="ds-prod-drawer-item ${suggested ? 'ds-prod-drawer-item--suggested' : ''}">
          <span class="ds-prod-drawer-icon">${icon}</span>
          <div><strong>${title}</strong><p>${desc}</p></div>
        </div>`;
    }).join('');
    return `
      <div class="ds-prod-frame ds-prod-frame--wf ds-prod-frame--drawer">
        <div class="ds-prod-wf-canvas ds-prod-wf-canvas--blur" aria-hidden="true">
          <div class="ds-prod-wf-blur-node"></div>
          <div class="ds-prod-wf-blur-node"></div>
          <div class="ds-prod-wf-blur-node"></div>
        </div>
        <aside class="ds-prod-drawer ds-prod-drawer--wf">
          <div class="ds-prod-drawer-head">
            <div>
              <strong>Add New Step</strong>
              <p class="ds-prod-drawer-sub">Insert into AV1 after API Trigger</p>
            </div>
            <button type="button" class="ds-prod-drawer-close" aria-label="Close">×</button>
          </div>
          <div class="ds-prod-search ds-prod-search--compact">⌕ Search for steps</div>
          <div class="ds-prod-drawer-tabs">
            <span class="active">Home</span><span>Docusign</span><span>Utility</span><span>Apps</span>
          </div>
          <div class="ds-prod-drawer-list">${rows}</div>
        </aside>
      </div>`;
  },

  webformsBuilder(ctx = {}) {
    const formName = ctx.formName || 'IPP_goal_template_fillable.pdf';
    const formTitle = ctx.formTitle || 'Transit Operator Benefits — IPP Goal Plan';
    return `
      <div class="ds-prod-frame ds-prod-frame--forms ds-prod-forms-builder" data-ds-forms-tab="properties">
        <header class="ds-prod-forms-top">
          <div class="ds-prod-forms-top-left">
            <span class="ds-prod-forms-product-mark" aria-hidden="true">WF</span>
            <div class="ds-prod-forms-top-meta">
              <span class="ds-prod-forms-filename">${formName}</span>
              <span class="ds-prod-forms-subtitle">${formTitle}</span>
            </div>
          </div>
          <div class="ds-prod-forms-top-status">
            <span class="ds-prod-draft-tag">Draft</span>
            <span class="ds-prod-draft-tag ds-prod-draft-tag--warn">Unsaved changes</span>
          </div>
          <span class="ds-prod-forms-spacer"></span>
          <label class="ds-prod-toggle ds-prod-forms-doc-toggle"><input type="checkbox" checked disabled /> Document view</label>
          <button type="button" class="ds-prod-btn-outline-sm ds-prod-forms-btn-ghost">Preview</button>
          <button type="button" class="ds-prod-btn-primary-sm ds-prod-forms-activate-btn">Activate</button>
        </header>
        <div class="ds-prod-forms-subbar">
          <span>4 sections</span>
          <span class="ds-prod-forms-subbar-dot" aria-hidden="true">·</span>
          <span>12 fields</span>
          <span class="ds-prod-forms-subbar-dot" aria-hidden="true">·</span>
          <span class="ds-prod-forms-subbar-live">Last saved 2 min ago</span>
        </div>
        <div class="ds-prod-forms-body">
          <aside class="ds-prod-forms-outline">
            <div class="ds-prod-forms-ai-card">
              <div class="ds-prod-ai-badge-inline">✦ AI-assisted import</div>
              <p class="ds-prod-forms-ai-note">Layout and labels were detected from your PDF. Review every field before activation.</p>
            </div>
            <label class="ds-prod-forms-signer-label">Signer role
              <select class="ds-prod-select-sm ds-prod-forms-select">
                <option>SS Signer</option>
                <option>HR Reviewer</option>
              </select>
            </label>
            <p class="ds-prod-forms-nav-label">Form outline</p>
            <ul class="ds-prod-outline-tree ds-prod-outline-tree--rich">
              <li><button type="button" class="ds-prod-outline-item"><span class="ds-prod-outline-icon">📄</span> Welcome page</button></li>
              <li><button type="button" class="ds-prod-outline-item"><span class="ds-prod-outline-icon">📋</span> Employee Information</button></li>
              <li class="active">
                <button type="button" class="ds-prod-outline-item ds-prod-outline-item--active"><span class="ds-prod-outline-icon">▾</span> Employee Details</button>
                <ul>
                  <li><button type="button" class="ds-prod-outline-item ds-prod-outline-item--field">Name</button></li>
                  <li><button type="button" class="ds-prod-outline-item ds-prod-outline-item--field">Badge Number</button></li>
                  <li><button type="button" class="ds-prod-outline-item ds-prod-outline-item--field">Job Title</button></li>
                  <li><button type="button" class="ds-prod-outline-item ds-prod-outline-item--field ds-prod-outline-item--on">Status</button></li>
                </ul>
              </li>
              <li><button type="button" class="ds-prod-outline-item"><span class="ds-prod-outline-icon">🏢</span> Department Information</button></li>
            </ul>
          </aside>
          <main class="ds-prod-forms-canvas">
            <div class="ds-prod-forms-sheet">
              <div class="ds-prod-forms-sheet-head">
                <h3 class="ds-prod-forms-section-title">Employee Details</h3>
                <p class="ds-prod-forms-section-desc">Optional description · <a class="ds-prod-link" href="#">Customize text with Markdown</a></p>
              </div>
              ${[
                ['Name', 'Enter the employee name as it appears on their badge.', 'Sample Employee', false],
                ['Badge Number', 'Transit operator ID from HR system.', '048217', false],
                ['Job Title', '', 'Transit Operator', false],
              ].map(([label, hint, val, req]) => `
                <div class="ds-prod-form-field">
                  <label class="ds-prod-form-label">${label}${req ? ' <span class="ds-prod-form-req">*</span>' : ''}</label>
                  ${hint ? `<small class="ds-prod-form-hint">${hint}</small>` : ''}
                  <div class="ds-prod-form-input">${val}</div>
                </div>`).join('')}
              <div class="ds-prod-form-field ds-prod-form-field--selected">
                <label class="ds-prod-form-label">Status <span class="ds-prod-form-req">*</span></label>
                <small class="ds-prod-form-hint">Employment status at time of enrollment.</small>
                <div class="ds-prod-radio-row ds-prod-radio-row--cards">
                  <label class="ds-prod-radio-card"><input type="radio" name="wf-status" disabled /> <span>Probation</span></label>
                  <label class="ds-prod-radio-card ds-prod-radio-card--on"><input type="radio" name="wf-status" checked disabled /> <span>Regular</span></label>
                </div>
              </div>
            </div>
          </main>
          <aside class="ds-prod-forms-props">
            <div class="ds-prod-props-tabs" role="tablist">
              <button type="button" class="ds-prod-props-tab active" data-ds-forms-tab="properties" role="tab">Properties</button>
              <button type="button" class="ds-prod-props-tab" data-ds-forms-tab="rules" role="tab">Rules</button>
            </div>
            <div class="ds-prod-props-panel" data-ds-forms-panel="properties">
              <p class="ds-prod-props-kicker">Section</p>
              <label class="ds-prod-props-field">Section title <span class="ds-prod-form-req">*</span>
                <input type="text" value="Employee Details" readonly />
              </label>
              <label class="ds-prod-props-field">Section subtitle
                <input type="text" placeholder="Optional helper text" readonly />
              </label>
              <div class="ds-prod-props-divider"></div>
              <p class="ds-prod-props-kicker">Selected field · Status</p>
              <label class="ds-prod-props-field">Field label
                <input type="text" value="Status" readonly />
              </label>
              <label class="ds-prod-props-field">Validation
                <select class="ds-prod-select-sm ds-prod-forms-select" disabled>
                  <option>Required · pick one</option>
                </select>
              </label>
              <button type="button" class="ds-prod-link-danger ds-prod-forms-delete">Delete section</button>
            </div>
            <div class="ds-prod-props-panel" data-ds-forms-panel="rules" hidden>
              <p class="ds-prod-props-empty">No conditional rules on this section yet.</p>
              <button type="button" class="ds-prod-btn-outline-sm ds-prod-btn-full">+ Add rule</button>
            </div>
          </aside>
        </div>
      </div>`;
  },

  signing(ctx = {}) {
    const signer = ctx.signerName || 'Maria Santos';
    const agency = ctx.agency || 'California Dept of Technology';
    const docTitle = ctx.docTitle || 'DGS STD 213 — Master Services Agreement';
    const reqId = ctx.requestId || 'REQ-CA-2026-4201';
    const initials = signer.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `
      <div class="ds-prod-frame ds-prod-frame--sign ds-prod-sign-ceremony" data-ds-sign-state="start">
        <div class="ds-prod-sign-embed-bar" aria-hidden="true">
          <span class="ds-prod-sign-embed-lock">🔒</span>
          <span class="ds-prod-sign-embed-host">contracts.cdt.ca.gov</span>
          <span class="ds-prod-sign-embed-path">/vendor/sign</span>
          <span class="ds-prod-sign-embed-badge">Embedded signing</span>
        </div>
        <header class="ds-prod-sign-top">
          <div class="ds-prod-sign-top-left">
            <span class="ds-prod-sign-logo" aria-hidden="true">D</span>
            <span class="ds-prod-sign-brand">Docusign</span>
            <span class="ds-prod-sign-top-divider" aria-hidden="true"></span>
            <span class="ds-prod-sign-top-title">${docTitle}</span>
          </div>
          <div class="ds-prod-sign-top-right">
            <span class="ds-prod-sign-step-pill">Required fields <strong>1 of 2</strong></span>
            <button type="button" class="ds-prod-sign-icon-btn" title="Help" aria-label="Help">?</button>
            <button type="button" class="ds-prod-sign-icon-btn" title="Close" aria-label="Close">×</button>
          </div>
        </header>
        <div class="ds-prod-sign-body">
          <main class="ds-prod-sign-doc">
            <article class="ds-prod-sign-paper">
              <div class="ds-prod-sign-paper-head">
                <div class="ds-prod-sign-seal" aria-hidden="true">🏛</div>
                <div>
                  <p class="ds-prod-sign-agency">${agency}</p>
                  <h3 class="ds-prod-sign-doc-title">Master Services Agreement</h3>
                  <p class="ds-prod-sign-doc-id">${reqId} · DGS Form STD 213</p>
                </div>
              </div>
              <dl class="ds-prod-sign-meta">
                <div><dt>Vendor</dt><dd>Acme Cloud Solutions</dd></div>
                <div><dt>Contract value</dt><dd>$2,400,000</dd></div>
                <div><dt>Term</dt><dd>3 years + two 1-year options</dd></div>
                <div><dt>Signer</dt><dd>${signer}</dd></div>
              </dl>
              <section class="ds-prod-sign-section">
                <h4>Authorization</h4>
                <p>I am authorized to bind Acme Cloud Solutions and agree to the terms of this Master Services Agreement with the State of California.</p>
              </section>
              <div class="ds-prod-sign-field-wrap">
                <button type="button" class="ds-prod-sign-field-box" id="ds-sign-field-btn" data-ds-sign-adopt aria-label="Adopt and sign">
                  <span class="ds-prod-sign-tab-active">Sign</span>
                  <span class="ds-prod-sign-required">Required</span>
                  <span class="ds-prod-sign-line ds-prod-sign-line--empty" id="ds-sign-line">Click to sign</span>
                  <small class="ds-prod-sign-field-label">Authorized signatory</small>
                </button>
              </div>
              <p class="ds-prod-sign-legal">By selecting <strong>Adopt and Sign</strong>, I agree that the signature will be the electronic representation of my signature for all purposes when I use them on documents, including legally binding contracts.</p>
            </article>
          </main>
          <aside class="ds-prod-sign-panel">
            <div class="ds-prod-sign-panel-head">
              <div class="ds-prod-sign-avatar" aria-hidden="true">${initials}</div>
              <div>
                <p class="ds-prod-sign-panel-title">Review and sign</p>
                <p class="ds-prod-sign-panel-sub">${signer}</p>
              </div>
            </div>
            <ul class="ds-prod-sign-doc-list">
              <li class="ds-prod-sign-doc-item ds-prod-sign-doc-item--active">
                <span class="ds-prod-sign-doc-icon" aria-hidden="true">📄</span>
                <span>
                  <strong>DGS STD 213 — MSA.pdf</strong>
                  <small>12 pages · 2 required fields</small>
                </span>
              </li>
              <li class="ds-prod-sign-doc-item">
                <span class="ds-prod-sign-doc-icon" aria-hidden="true">📄</span>
                <span>
                  <strong>Exhibit A — Cloud SOW.pdf</strong>
                  <small>4 pages · view only</small>
                </span>
              </li>
            </ul>
            <div class="ds-prod-sign-panel-actions">
              <button type="button" class="ds-prod-btn-yellow ds-prod-btn-full ds-prod-sign-start-btn" data-ds-sign-start>Start</button>
              <button type="button" class="ds-prod-btn-primary-sm ds-prod-btn-full ds-prod-sign-finish-btn" data-ds-sign-finish hidden>Finish</button>
              <button type="button" class="ds-prod-btn-outline-sm ds-prod-btn-full">Other Actions ▾</button>
            </div>
            <div class="ds-prod-sign-progress" aria-hidden="true">
              <div class="ds-prod-sign-progress-fill" id="ds-sign-progress"></div>
            </div>
            <p class="ds-prod-sign-panel-foot">Secured by Docusign · ESIGN &amp; UETA compliant</p>
          </aside>
        </div>
      </div>`;
  },

  workspaceAdmin(ctx = {}) {
    const title = ctx.workspaceTitle || 'CDT Cloud Modernization — Vendor Hub';
    const vendor = ctx.vendorName || 'David Park';
    const uploads = ctx.uploadRequests || [
      { name: 'Upload SOC 2 Type II attestation', recipient: 'David Park', status: 'Draft', date: '6/18/2026 9:14 AM' },
      { name: 'Upload insurance certificates (Gov Code §927.8)', recipient: 'David Park', status: 'Draft', date: '6/18/2026 9:12 AM' },
      { name: 'Upload signed DGS Form STD 204', recipient: 'David Park', status: 'Draft', date: '6/18/2026 9:10 AM' },
    ];
    const initials = vendor.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `
      <div class="ds-prod-frame ds-prod-frame--ws-admin">
        <div class="ds-prod-ws-admin-head">
          <button type="button" class="ds-prod-ws-back" aria-label="Back">←</button>
          <div class="ds-prod-ws-admin-title-row">
            <h2>${title}</h2>
            <span class="ds-prod-status-pill ds-prod-status-pill--green">Active</span>
          </div>
          <div class="ds-prod-ws-admin-actions">
            <button type="button" class="ds-prod-ws-icon-btn">💬</button>
            <button type="button" class="ds-prod-ws-outline-btn">👤 Share</button>
            <div class="ds-prod-ws-add-wrap">
              <button type="button" class="ds-prod-btn-primary-sm">Add ▾</button>
              <div class="ds-prod-ws-add-menu">
                <div><span>📄</span> Document</div>
                <div><span>✍</span> Envelope <span class="ds-prod-ws-chevron">›</span></div>
                <div class="active"><span>⬆</span> Upload Request</div>
              </div>
            </div>
            <button type="button" class="ds-prod-ws-icon-btn">⋮</button>
          </div>
        </div>
        <div class="ds-prod-ws-tabs">
          <span class="active">Overview</span>
          <span>Documents</span>
          <span>Participants</span>
        </div>
        <div class="ds-prod-ws-summary">
          <div class="ds-prod-ws-summary-card"><strong>3</strong><span>Upload requests</span></div>
          <div class="ds-prod-ws-summary-card"><strong>1</strong><span>Envelope pending</span></div>
          <div class="ds-prod-ws-summary-card"><strong>2</strong><span>Participants active</span></div>
        </div>
        <div class="ds-prod-ws-table-wrap">
          <table class="ds-prod-ws-table">
            <thead>
              <tr>
                <th><input type="checkbox" disabled /></th>
                <th>Name ↕</th>
                <th>Recipients</th>
                <th>Status ↕</th>
                <th>Last Change ↓</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${uploads.map((row) => `
                <tr>
                  <td><input type="checkbox" disabled /></td>
                  <td>
                    <div class="ds-prod-ws-item-name">
                      <span class="ds-prod-ws-item-icon">⬆</span>
                      <div>
                        <strong>${row.name}</strong>
                        <small>Upload Request</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="ds-prod-ws-avatar ds-prod-ws-avatar--pink">${initials}</span>
                    ${row.recipient || vendor}
                  </td>
                  <td><span class="ds-prod-ws-status-dot"></span> ${row.status || 'Draft'}</td>
                  <td class="ds-prod-muted">${row.date || '6/18/2026 9:14 AM'}</td>
                  <td>
                    <button type="button" class="ds-prod-ws-edit-btn">Edit</button>
                    <button type="button" class="ds-prod-ws-icon-btn">⋮</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  workspaceParticipant(ctx = {}) {
    const name = ctx.participantName || 'Maria Santos';
    const tasks = ctx.tasks || [
      { type: 'sign', title: 'DGS STD 213 MSA — Acme Cloud Solutions.pdf', sender: 'James Chen · DGS Procurement', date: '6/18/2026', status: 'Needs your signature', cta: 'Sign' },
      { type: 'upload', title: 'Prevailing wage attestation — Phase II SOW', sender: 'James Chen · DGS Procurement', date: '6/18/2026', status: 'Upload requested', cta: 'Upload' },
    ];
    return `
      <div class="ds-prod-frame ds-prod-frame--ws-participant">
        <div class="ds-prod-ws-hub-card">
          <div class="ds-prod-ws-hub-top">
            <span class="ds-prod-logo-text">Docusign</span>
            <button type="button" class="ds-prod-ws-outline-btn">💬 Messages</button>
          </div>
          <h1 class="ds-prod-ws-hub-name">${name}</h1>
          <p class="ds-prod-ws-hub-lead">Review the following items and take action on any that need your attention.</p>
          ${tasks.map(t => `
            <div class="ds-prod-ws-task-row">
              <span class="ds-prod-ws-task-icon">${t.type === 'sign' ? '✎' : '⬆'}</span>
              <div class="ds-prod-ws-task-body">
                <strong>${t.title}</strong>
                <small>Sent by ${t.sender} on ${t.date}</small>
                <span class="ds-prod-ws-task-badge">${t.status}</span>
              </div>
              <button type="button" class="ds-prod-ws-action-btn">${t.cta}</button>
            </div>`).join('')}
        </div>
      </div>`;
  },

  connectPreviewSend(ctx = {}) {
    const title = ctx.contractTitle || 'Master Services Agreement — Acme IT Solutions';
    const live = ctx.animate ? ' ds-prod-cpv-live' : '';
    const flip = ctx.animate ? ' ds-prod-cpv-status-flip' : '';
    return `
      <div class="ds-prod-frame ds-prod-frame--connect-preview ds-prod-cpv-cartoon${live}">
        <div class="ds-prod-cpv-chrome ds-prod-cpv-chrome--send">
          <span class="ds-prod-cpv-sticker" aria-hidden="true">📄</span>
          <span class="ds-prod-cpv-flow-step">Step 1</span>
          <span class="ds-prod-cpv-logo">docusign</span>
        </div>
        <div class="ds-prod-cpv-panel ds-prod-cpv-docusign">
          <p class="ds-prod-cpv-route-label${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d1' : ''}">Envelope status changes</p>
          <div class="ds-prod-cpv-envelope-card${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d2' : ''}">
            <div class="ds-prod-cpv-envelope-icon" aria-hidden="true">📄</div>
            <div class="ds-prod-cpv-envelope-meta">
              <strong>${title}</strong>
              <small>REQ-2026-4201 · ${ctx.department || 'California Department of Technology'}</small>
            </div>
            <div class="ds-prod-cpv-status-stack${flip}">
              <span class="ds-prod-cpv-status-old">Sent</span>
              <span class="ds-prod-cpv-status-new">Completed</span>
            </div>
          </div>
          <div class="ds-prod-cpv-event-chip${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d4' : ''}">
            <span class="ds-prod-cpv-event-bolt" aria-hidden="true">⚡</span>
            <code>envelope-completed</code>
            <span class="ds-prod-cpv-event-note">Connect trigger fired</span>
          </div>
        </div>
      </div>`;
  },

  connectPreviewConnectPost(ctx = {}) {
    const endpoint = ctx.endpoint || 'https://middleware.state.ca.gov/docusign/connect';
    const shortUrl = endpoint.replace(/^https?:\/\//, '').slice(0, 32) + '…';
    const live = ctx.animate ? ' ds-prod-cpv-live' : '';
    return `
      <div class="ds-prod-frame ds-prod-frame--connect-preview ds-prod-cpv-cartoon${live}">
        <div class="ds-prod-cpv-chrome ds-prod-cpv-chrome--post">
          <span class="ds-prod-cpv-sticker" aria-hidden="true">⚡</span>
          <span class="ds-prod-cpv-flow-step">Step 2</span>
          <span>Connect POST</span>
        </div>
        <div class="ds-prod-cpv-panel ds-prod-cpv-post">
          <p class="ds-prod-cpv-route-label${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d1' : ''}">JSON payload to your URL</p>
          <div class="ds-prod-cpv-post-pipeline${ctx.animate ? ' ds-prod-cpv-post-pipeline--active' : ''}">
            <div class="ds-prod-cpv-post-node ds-prod-cpv-post-node--ds${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d2' : ''}">
              <span>📄</span><small>Docusign</small>
            </div>
            <div class="ds-prod-cpv-post-beam" aria-hidden="true">
              <span class="ds-prod-cpv-post-packet">POST</span>
            </div>
            <div class="ds-prod-cpv-post-node ds-prod-cpv-post-node--url${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d3' : ''}">
              <span>🖥</span><small>${shortUrl}</small>
            </div>
          </div>
          <pre class="ds-prod-cpv-json-snippet${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d4' : ''}">{
  "event": "envelope-completed",
  "envelopeId": "${(ctx.envelopeId || '8f3a2b1c').slice(0, 8)}…",
  "status": "completed"
}</pre>
          <div class="ds-prod-cpv-delivery-ok${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d5' : ''}">
            <span class="ds-prod-cpv-ok-badge">200 OK</span>
            <span>Delivered · HMAC signed</span>
          </div>
        </div>
      </div>`;
  },

  connectPreviewListener(ctx = {}) {
    const erp = ctx.erpSystem || 'FI$Cal';
    const live = ctx.animate ? ' ds-prod-cpv-live' : '';
    return `
      <div class="ds-prod-frame ds-prod-frame--connect-preview ds-prod-cpv-cartoon${live}">
        <div class="ds-prod-cpv-chrome ds-prod-cpv-chrome--listener">
          <span class="ds-prod-cpv-sticker" aria-hidden="true">🖥</span>
          <span class="ds-prod-cpv-flow-step">Step 3</span>
          <span>Your listener</span>
        </div>
        <div class="ds-prod-cpv-panel ds-prod-cpv-listener">
          <p class="ds-prod-cpv-route-label${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d1' : ''}">Validates &amp; routes the event</p>
          <ul class="ds-prod-cpv-listener-steps">
            <li class="${ctx.animate ? 'ds-prod-cpv-listener-step--on ds-prod-cpv-d2' : ''}"><span class="ds-prod-cpv-check">✓</span> Validate Connect signature</li>
            <li class="${ctx.animate ? 'ds-prod-cpv-listener-step--on ds-prod-cpv-d3' : ''}"><span class="ds-prod-cpv-check">✓</span> Parse <code>envelope-completed</code></li>
            <li class="${ctx.animate ? 'ds-prod-cpv-listener-step--on ds-prod-cpv-d4' : ''}"><span class="ds-prod-cpv-check">✓</span> Map fields → REQ-2026-4201</li>
            <li class="${ctx.animate ? 'ds-prod-cpv-listener-step--on ds-prod-cpv-d5' : ''}"><span class="ds-prod-cpv-check">✓</span> Route to ${erp} API</li>
          </ul>
          <div class="ds-prod-cpv-route-out${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d6' : ''}">
            <span class="ds-prod-cpv-route-arrow" aria-hidden="true">→</span>
            <span>POST /contracts · POST /encumbrances</span>
          </div>
        </div>
      </div>`;
  },

  connectPreviewErp(ctx = {}) {
    const erp = ctx.erpSystem || 'FI$Cal';
    const register = ctx.registerSystem || 'Agency Contract Register';
    const title = ctx.contractTitle || 'Master Services Agreement — Acme IT Solutions';
    const dept = ctx.department || 'California Department of Technology';
    const live = ctx.animate ? ' ds-prod-cpv-live' : '';
    const rowAnim = ctx.animate ? ' ds-prod-cpv-row-animate' : '';
    return `
      <div class="ds-prod-frame ds-prod-frame--connect-preview ds-prod-cpv-cartoon ds-prod-cpv-erp-full${live}">
        <div class="ds-prod-cpv-chrome ds-prod-cpv-chrome--erp">
          <span class="ds-prod-cpv-sticker" aria-hidden="true">🏛</span>
          <span class="ds-prod-cpv-flow-step">Step 4</span>
          <span>${erp} · ${register}</span>
        </div>
        <div class="ds-prod-cpv-panel ds-prod-cpv-erp ds-prod-cpv-erp-dense">
          <div class="ds-prod-cpv-erp-reports${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d1' : ''}">
            <div class="ds-prod-cpv-report-tile">
              <span class="ds-prod-cpv-report-icon" aria-hidden="true">📊</span>
              <div><strong>FY26 spend</strong><span>$4.2M</span></div>
            </div>
            <div class="ds-prod-cpv-report-tile">
              <span class="ds-prod-cpv-report-icon" aria-hidden="true">📋</span>
              <div><strong>Active</strong><span>128</span></div>
            </div>
            <div class="ds-prod-cpv-report-tile ds-prod-cpv-report-tile--sync">
              <span class="ds-prod-cpv-report-icon" aria-hidden="true">⚡</span>
              <div><strong>Connect sync</strong><span>Live</span></div>
            </div>
          </div>
          <div class="ds-prod-cpv-erp-toolbar${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d2' : ''}">
            <span class="active">Contracts</span>
            <span>Encumbrances</span>
            <span>Reports</span>
          </div>
          <div class="ds-prod-cpv-sync-banner${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d3' : ''}">
            <span class="ds-prod-cpv-value-icon" aria-hidden="true">✓</span>
            <div>
              <strong>Register &amp; encumbrance updated</strong>
              <small>${dept} · zero manual re-entry</small>
            </div>
          </div>
          <div class="ds-prod-cpv-erp-table-wrap${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d4' : ''}">
            <table class="ds-prod-cpv-erp-table">
              <thead><tr><th>Title</th><th>Status</th><th>Value</th></tr></thead>
              <tbody>
                <tr class="ds-prod-cpv-erp-row--muted"><td>IT Staff Augmentation FY24</td><td>Active</td><td>$1.2M</td></tr>
                <tr class="ds-prod-cpv-erp-row--muted"><td>Cloud Migration SOW</td><td>Active</td><td>$640K</td></tr>
                <tr class="ds-prod-cpv-erp-row--new${rowAnim}"><td><span class="ds-prod-cpv-new-badge">NEW</span> SaaS — TechVista Analytics</td><td>Executed</td><td>$890K/yr</td></tr>
              </tbody>
            </table>
          </div>
          <div class="ds-prod-cpv-erp-footer${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d5' : ''}">
            <div class="ds-prod-cpv-enc-mini">
              <span class="ds-prod-cpv-enc-mini-label">Encumbrance reserved</span>
              <div class="ds-prod-cpv-enc-bar-wrap">
                <div class="ds-prod-cpv-enc-bar${ctx.animate ? ' ds-prod-cpv-enc-bar--fill' : ''}"></div>
              </div>
              <strong>$890,000 · FY26</strong>
            </div>
            <div class="ds-prod-cpv-erp-kpis">
              <span><strong>REQ-4201</strong><small>Procurement</small></span>
              <span><strong>2.3s</strong><small>Sync time</small></span>
            </div>
          </div>
          <div class="ds-prod-cpv-connect-tag${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d6' : ''}">
            <span class="ds-prod-cpv-connect-dot"></span>
            Published via Connect · envelope-completed
          </div>
        </div>
      </div>`;
  },

  connectProductPreview(ctx = {}) {
    const stepId = ctx.stepId || 'sent';
    const base = {
      contractTitle: ctx.contractTitle,
      requester: ctx.requester,
      vendor: ctx.vendor,
      department: ctx.department,
      erpSystem: ctx.erpSystem,
      registerSystem: ctx.registerSystem,
      envelopeId: ctx.envelopeId,
      endpoint: ctx.endpoint,
      signerName: ctx.signerName,
      animate: ctx.animate === true,
    };
    const map = {
      sent: () => DS_RENDER_MOCK.connectPreviewSend(base),
      delivered: () => DS_RENDER_MOCK.connectPreviewConnectPost(base),
      recipient: () => DS_RENDER_MOCK.connectPreviewListener(base),
      completed: () => DS_RENDER_MOCK.connectPreviewErp(base),
    };
    return (map[stepId] || map.sent)();
  },

  explorerConsole(ctx = {}) {
    const live = ctx.animate ? ' ds-prod-cpv-live' : '';
    const active = ctx.animate ? ' ds-prod-cpv-post-pipeline--active' : '';
    return `
      <div class="ds-prod-frame ds-prod-frame--compact">
        <div class="ds-prod-cpv-panel ds-prod-cpv-post${live}" style="padding:12px;height:100%;box-sizing:border-box">
          <p class="ds-prod-cpv-route-label${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d1' : ''}">Live REST call</p>
          <div class="ds-prod-cpv-post-pipeline${active}${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d2' : ''}">
            <div class="ds-prod-cpv-post-node"><span>🖥</span><small>Explorer</small></div>
            <div class="ds-prod-cpv-post-beam"><span class="ds-prod-cpv-post-packet">GET</span></div>
            <div class="ds-prod-cpv-post-node"><span>☁</span><small>Docusign API</small></div>
          </div>
          <pre class="ds-prod-cpv-json-snippet${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d3' : ''}">GET /accounts/{accountId}/envelopes
Authorization: Bearer ••••
→ 200 OK · 142ms</pre>
          <div class="ds-prod-cpv-delivery-ok${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d4' : ''}"><span class="ds-prod-cpv-ok-badge">200 OK</span><span>envelope list returned</span></div>
        </div>
      </div>`;
  },

  agentFlow(ctx = {}) {
    const live = ctx.animate ? ' ds-prod-cpv-live' : '';
    return `
      <div class="ds-prod-frame ds-prod-frame--compact">
        <div class="ds-prod-cpv-panel ds-prod-cpv-listener${live}" style="padding:12px;height:100%;box-sizing:border-box">
          <p class="ds-prod-cpv-route-label${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d1' : ''}">Autonomous agreement flow</p>
          <ul class="ds-prod-cpv-listener-steps">
            <li class="${ctx.animate ? 'ds-prod-cpv-listener-step--on ds-prod-cpv-d2' : ''}"><span class="ds-prod-cpv-check">✓</span> Agent reads template</li>
            <li class="${ctx.animate ? 'ds-prod-cpv-listener-step--on ds-prod-cpv-d3' : ''}"><span class="ds-prod-cpv-check">✓</span> Creates envelope via API</li>
            <li class="${ctx.animate ? 'ds-prod-cpv-listener-step--on ds-prod-cpv-d4' : ''}"><span class="ds-prod-cpv-check">✓</span> Monitors signer status</li>
            <li class="${ctx.animate ? 'ds-prod-cpv-listener-step--on ds-prod-cpv-d5' : ''}"><span class="ds-prod-cpv-check">✓</span> Returns agreement summary</li>
          </ul>
          <div class="ds-prod-cpv-route-out${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d6' : ''}"><span class="ds-prod-cpv-route-arrow">→</span><span>Agent API · OAuth token</span></div>
        </div>
      </div>`;
  },

  govWorkflowPreview(ctx = {}) {
    const stepNum = (ctx.stepIndex ?? 0) + 1;
    const total = ctx.totalSteps || 9;
    const pct = Math.round((stepNum / total) * 100);
    const live = ctx.animate ? ' ds-prod-cpv-live' : '';
    const title = ctx.stepTitle || 'Contract intake';
    const product = ctx.stepProduct || 'eSignature';
    const persona = ctx.personaName || 'Agency buyer';
    const stateName = ctx.stateName || 'State agency';

    return `
      <div class="ds-prod-frame ds-prod-frame--compact">
        <div class="ds-prod-cpv-panel ds-prod-cpv-listener${live}" style="padding:12px;height:100%;box-sizing:border-box">
          <div class="ds-prod-cpv-gov-progress${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d1' : ''}">
            <span>Step ${stepNum} of ${total}</span>
            <div class="ds-prod-cpv-gov-bar"><div style="width:${pct}%"></div></div>
          </div>
          <p class="ds-prod-cpv-route-label${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d2' : ''}">${product}</p>
          <strong class="ds-prod-cpv-gov-title${ctx.animate ? ' ds-prod-cpv-rise ds-prod-cpv-d3' : ''}">${title}</strong>
          <ul class="ds-prod-cpv-listener-steps">
            <li class="${ctx.animate ? 'ds-prod-cpv-listener-step--on ds-prod-cpv-d4' : ''}"><span class="ds-prod-cpv-check">👤</span> ${persona}</li>
            <li class="${ctx.animate ? 'ds-prod-cpv-listener-step--on ds-prod-cpv-d5' : ''}"><span class="ds-prod-cpv-check">✓</span> IAM platform action</li>
            <li class="${ctx.animate ? 'ds-prod-cpv-listener-step--on ds-prod-cpv-d6' : ''}"><span class="ds-prod-cpv-check">→</span> ${stateName} workflow</li>
          </ul>
        </div>
      </div>`;
  },
};
