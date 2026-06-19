/* Faithful DocuSign product UI mockups — rendered before live demo sections */

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
      <div class="ds-prod-frame">
        ${dsChrome('', { activeNav: 'Home' })}
        <div class="ds-prod-hero">
          <h2>Welcome back, ${name}</h2>
          <div class="ds-prod-hero-actions">
            <button type="button" class="ds-prod-btn-yellow">Start ▾</button>
            <button type="button" class="ds-prod-btn-outline">Send an Envelope</button>
            <button type="button" class="ds-prod-btn-outline">Create a Request</button>
            <button type="button" class="ds-prod-btn-outline">Create a Web Form</button>
          </div>
        </div>
        <div class="ds-prod-home-grid">
          <div class="ds-prod-home-main">
            <div class="ds-prod-card">
              <div class="ds-prod-card-head">TASKS <span>(3)</span> ›</div>
              ${[
                ['Needs To Sign', `From: ${DS_DEMO.team}`, 'CDT MSA — Signature Required'],
                ['Needs To Sign', `From: ${DS_DEMO.team}`, 'Grant Agreement — Signature Required'],
                ['Needs To Sign', `From: ${DS_DEMO.team}`, 'Vendor registration form — review & sign'],
              ].map(([status, from, taskName]) => `
                <div class="ds-prod-task-row">
                  <span class="ds-prod-task-icon">✎</span>
                  <div><strong>${status}</strong><br><small>${from}</small><br>${taskName}</div>
                  <span class="ds-prod-kebab">⋮</span>
                </div>`).join('')}
            </div>
            <div class="ds-prod-card">
              <div class="ds-prod-card-head">AGREEMENT ACTIVITY ⓘ</div>
              ${[
                ['SOW OHA-RFP-2026-038_Sample_SOW.docx', 'Expiring Soon', 'amber'],
                ['CDT MSA — Acme Cloud (AV1).docx', 'Completed', 'green'],
                ['Vendor Registration — IPP_goal_template.pdf', 'Completed', 'green'],
              ].map(([file, status, color]) => `
                <div class="ds-prod-activity-row">
                  <span class="ds-prod-file-icon">📄</span>
                  <div>${file}</div>
                  <span class="ds-prod-status-pill ds-prod-status-pill--${color}">${status}</span>
                </div>`).join('')}
            </div>
          </div>
          <div class="ds-prod-home-side">
            <div class="ds-prod-card">
              <div class="ds-prod-card-head">OVERVIEW</div>
              ${[
                ['Open requests', '36'], ['Waiting for others', '8'],
                ['Expiring soon', '0'], ['Completed', '28'], ['Upcoming renewals', '1'],
              ].map(([k, v]) => `<div class="ds-prod-overview-row"><span>${k}</span><strong>${v}</strong></div>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
  },

  tasks(ctx = {}) {
    return `
      <div class="ds-prod-frame">
        ${dsChrome('', { activeNav: 'Home' })}
        <div class="ds-prod-page">
          <h2 class="ds-prod-page-title">Tasks</h2>
          <div class="ds-prod-filter-bar">
            <div class="ds-prod-search">⌕ Search Tasks</div>
            <span class="ds-prod-filter-chip">Assigned to: Me ×</span>
            <span class="ds-prod-filter-chip">Assigned Date: Last 6 Months ×</span>
            <button type="button" class="ds-prod-filter-btn">Filters ⚙</button>
          </div>
          <table class="ds-prod-table">
            <thead><tr>
              <th>Task type ↕</th><th>Name ↕</th><th>Due date ↕</th><th>Assigned date ↕</th><th></th>
            </tr></thead>
            <tbody>
              ${[
                ['Needs To Sign · From: ' + DS_DEMO.team, 'CDT MSA — Signature Required', '10/15/2026', '5/18/2026'],
                ['Needs To Sign · From: ' + DS_DEMO.team, 'Grant Agreement — Signature Required', '9/27/2026', '3/30/2026'],
                ['Needs To Sign · From: ' + DS_DEMO.team, 'Vendor registration — review & sign', '10/1/2026', '5/18/2026'],
              ].map(([type, name, due, assigned]) => `
                <tr>
                  <td><span class="ds-prod-task-icon">✎</span> ${type}</td>
                  <td>${name}</td>
                  <td>${due}</td>
                  <td>${assigned}</td>
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
      <div class="ds-prod-frame">
        ${dsChrome('', { activeNav: 'Agreements' })}
        <div class="ds-prod-page">
          <div class="ds-prod-insights-banner">
            <div class="ds-prod-insights-banner-head">
              <strong>✦ My Insights</strong>
              <button type="button" class="ds-prod-link-btn">Hide Insights ×</button>
            </div>
            <div class="ds-prod-insights-banner-grid">
              <div class="ds-prod-mini-chart-card"><div class="ds-prod-chart-title">Upcoming renewals</div><div class="ds-prod-mini-bars"></div></div>
              <div class="ds-prod-insight-card">
                <strong>Some parties have multiple names.</strong>
                <p>Different spellings for the same party are listed separately. Clean up duplicates to improve reporting.</p>
                <button type="button" class="ds-prod-btn-primary-sm">+ Clean Up Parties</button>
                <button type="button" class="ds-prod-btn-ghost-sm">Do This Later</button>
              </div>
            </div>
          </div>
          <div class="ds-prod-search-row">
            <div class="ds-prod-search ds-prod-search--wide">Try "which agreements expire in 90 days"</div>
            <button type="button" class="ds-prod-filter-btn">Filters</button>
            <button type="button" class="ds-prod-btn-primary-sm">✦ Ask Iris</button>
          </div>
          <table class="ds-prod-table ds-prod-table--agreements">
            <thead><tr>
              <th>Original File Name</th><th>Parties</th><th>Status</th><th>Agreement Type</th><th>Total Contract Value</th><th>Effective Date</th><th>Expiration Date</th>
            </tr></thead>
            <tbody>
              ${[
                ['CDT MSA — Acme Cloud (AV1).docx', 'California Dept of Technology; Acme Cloud Solutions', 'Active', 'Master Service Agreement', '$2,400,000', '1/15/2026', '1/14/2029'],
                ['DGS STD 213 — Phase II SOW.docx', 'Dept of General Services; Acme Cloud Solutions', 'Active', 'Services Agreement', '$840,000', '3/1/2026', '2/28/2027'],
                ['Vendor Registration — IPP_goal_template.pdf', 'CDT; Vertex Systems LLC', 'Active', 'Form', '—', '3/10/2026', '—'],
              ].map(([file, parties, status, type, val, eff, exp], i) => `
                <tr class="${i === 0 ? 'highlight' : ''}">
                  <td><a class="ds-prod-link">${file}</a></td>
                  <td>${parties}</td>
                  <td><span class="ds-prod-dot-green"></span> ${status}</td>
                  <td>${type}</td>
                  <td>${val}</td>
                  <td>${eff}</td>
                  <td>${exp}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  agreementDesk(ctx = {}) {
    const rows = [
      ['CDT Cloud Modernization — MSA Intake', 'REQ-2026-4201', 'green', '6/18/2026 9:42 AM', '6/30/2026', 'Contracts Lead · CDT', 'Legal Review · DGS', true],
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

  wordReview(ctx = {}) {
    return `
      <div class="ds-prod-frame ds-prod-frame--word">
        <div class="ds-prod-word-top">
          <span>CDT MSA — Cloud Services SOW.docx</span>
          <span class="ds-prod-draft-tag">Draft</span>
          <span class="ds-prod-word-spacer"></span>
          <span>1 / 4</span>
          <span class="ds-prod-word-zoom">100%</span>
          <button type="button" class="ds-prod-btn-primary-sm">Edit in Word ↗</button>
          <button type="button" class="ds-prod-btn-dark-sm">✦ AI-Assisted Review</button>
        </div>
        <div class="ds-prod-word-body">
          <aside class="ds-prod-word-rail"><span>📄</span><span>🔍</span><span>💬</span></aside>
          <div class="ds-prod-word-doc">
            <div class="ds-prod-word-doc-head">
              <span class="ds-prod-doc-type">Statement of Work</span>
              <h3>California Department of Technology<br>Cloud Modernization Services</h3>
            </div>
            <table class="ds-prod-word-table">
              <tr><td>Contract ID</td><td>REQ-CA-2026-4201</td></tr>
              <tr><td>Term</td><td>3 years + two 1-year options</td></tr>
              <tr><td>Total value</td><td class="ds-prod-highlight">$2,400,000</td></tr>
            </table>
            <p class="ds-prod-word-lead">Managed cloud infrastructure, security controls, and migration support for agency modernization initiatives.</p>
            <div class="ds-prod-comment-inline">
              <span class="ds-prod-avatar-sm ds-prod-avatar-sm--teal">LR</span>
              <div>
                <span class="ds-prod-comment-meta">${DS_DEMO.legal} · 6/5/2026</span>
                <p>Confirm liability cap matches DGS STD 213 before routing to signature.</p>
              </div>
            </div>
          </div>
          <aside class="ds-prod-ai-panel ds-prod-ai-panel--clean">
            <div class="ds-prod-ai-head">✦ AI-Assisted <span class="ds-prod-ai-close">×</span></div>
            <div class="ds-prod-ai-tabs"><span class="active">Chat</span><span>Playbooks</span></div>
            <div class="ds-prod-ai-body ds-prod-ai-body--clean">
              <p class="ds-prod-ai-greeting">Review this SOW against your agency playbook.</p>
              <div class="ds-prod-ai-summary-card">
                <span class="ds-prod-ai-summary-label">Document summary</span>
                <p>3-year term · $2.4M · US data residency · 90-day renewal notice.</p>
              </div>
              <div class="ds-prod-ai-shortcuts ds-prod-ai-shortcuts--compact">
                <button type="button">Does this agreement automatically renew?</button>
                <button type="button">Flag deviations from STD 213</button>
              </div>
            </div>
            <div class="ds-prod-ai-input">
              <span>+</span>
              <input type="text" placeholder="Ask about this agreement…" readonly />
              <span class="ds-prod-ai-send">→</span>
            </div>
            <small class="ds-prod-ai-disclaimer">AI responses are not legal advice.</small>
          </aside>
        </div>
      </div>`;
  },

  wordPlaybooks(ctx = {}) {
    return `
      <div class="ds-prod-frame ds-prod-frame--word">
        <div class="ds-prod-word-top">
          <span>CDT MSA — Cloud Services SOW.docx</span>
          <span class="ds-prod-draft-tag">Draft</span>
          <span class="ds-prod-word-spacer"></span>
          <button type="button" class="ds-prod-btn-primary-sm">Edit in Word ↗</button>
          <button type="button" class="ds-prod-btn-dark-sm">✦ AI-Assisted Review</button>
        </div>
        <div class="ds-prod-word-body">
          <aside class="ds-prod-word-rail"><span>📄</span><span>🔍</span><span>💬</span></aside>
          <div class="ds-prod-word-doc ds-prod-word-doc--dim">
            <h3>California Department of Technology<br>Cloud Modernization Services</h3>
            <p class="ds-prod-highlight-inline">3-year term · $2.4M · STD 213</p>
          </div>
          <aside class="ds-prod-ai-panel">
            <div class="ds-prod-ai-head">✦ AI-Assisted</div>
            <div class="ds-prod-ai-tabs"><span>Chat</span><span class="active">Playbooks</span></div>
            <div class="ds-prod-ai-actions">
              <button type="button" class="ds-prod-btn-primary-sm">New Playbook</button>
              <button type="button" class="ds-prod-btn-outline-sm">+ Generate Playbook</button>
            </div>
            <div class="ds-prod-search ds-prod-search--compact">⌕ Search playbooks</div>
            ${[
              ['CA STD 213 Playbook', 'Tests liability, insurance, and data residency for state MSAs.', 'Needs Review (4)', 'Passed (39)', 'Not Run (21)'],
              ['Cloud SOW Playbook', 'Scope, SLAs, and termination for cloud services agreements.', 'Passed (12)', 'Passed (8)', 'Not Run (5)'],
            ].map(([title, desc, a, b, c]) => `
              <div class="ds-prod-playbook-card">
                <div class="ds-prod-playbook-head"><strong>${title}</strong><span>☆</span></div>
                <p>${desc}</p>
                <a class="ds-prod-link">See details</a>
                <div class="ds-prod-playbook-pills">
                  <span class="ds-prod-pill-orange">${a}</span>
                  <span class="ds-prod-pill-green">${b}</span>
                  <span class="ds-prod-pill-gray">${c}</span>
                </div>
              </div>`).join('')}
          </aside>
        </div>
      </div>`;
  },

  workflowDiagram(ctx = {}) {
    const wfName = ctx.workflowName || 'AV1';
    const steps = [
      ['⚡', 'API Trigger (Prefill)', 'POST trigger_inputs from FI$Cal'],
      ['📋', 'Collect Data with Web Forms', 'Vendor · fields pre-populated'],
      ['🪪', 'Verify Someone\'s Identity', 'Recipients: Vendor contact'],
      ['📄', 'Prepare eSignature Template', 'DGS STD 213 MSA'],
      ['✍', 'Send Documents for Signature', 'James Chen · Maria Santos'],
    ];
    const branchSteps = [
      ['🖥', 'Show a Confirmation Screen', 'REQ-CA-2026-4201 logged'],
      ['🏁', 'Path End', 'Sync to Agreement Manager'],
    ];
    return `
      <div class="ds-prod-frame ds-prod-frame--wf">
        <div class="ds-prod-wf-toolbar">
          <strong>${wfName}</strong>
          <span class="ds-prod-status-pill ds-prod-status-pill--green">active</span>
          <span class="ds-prod-wf-toolbar-spacer"></span>
          <button type="button" class="ds-prod-btn-outline-sm">Preview</button>
          <button type="button" class="ds-prod-btn-primary-sm">Publish</button>
        </div>
        <div class="ds-prod-wf-canvas">
          ${steps.map(([icon, title, sub], i) => `
            <div class="ds-prod-wf-step">
              <div class="ds-prod-wf-node">
                <span class="ds-prod-wf-icon">${icon}</span>
                <div><strong>${title}</strong>${sub ? `<small>${sub}</small>` : ''}</div>
              </div>
              ${i < steps.length - 1 ? '<div class="ds-prod-wf-connector"></div>' : ''}
            </div>`).join('')}
          <div class="ds-prod-wf-branch">
            <span class="ds-prod-wf-branch-label">True</span>
            <div class="ds-prod-wf-branch-col">
              ${branchSteps.map(([icon, title, sub]) => `
                <div class="ds-prod-wf-step">
                  <div class="ds-prod-wf-node"><span class="ds-prod-wf-icon">${icon}</span><div><strong>${title}</strong>${sub ? `<small>${sub}</small>` : ''}</div></div>
                  <div class="ds-prod-wf-connector"></div>
                </div>`).join('')}
            </div>
            <span class="ds-prod-wf-branch-label">False</span>
            <div class="ds-prod-wf-branch-col ds-prod-wf-branch-col--dim">
              ${branchSteps.slice(0, 2).map(([icon, title, sub]) => `
                <div class="ds-prod-wf-step">
                  <div class="ds-prod-wf-node"><span class="ds-prod-wf-icon">${icon}</span><div><strong>${title}</strong></div></div>
                  <div class="ds-prod-wf-connector"></div>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
  },

  workflowSteps(ctx = {}) {
    const steps = [
      ['Suggested', 'Collect Data with Web Forms', 'Send a form out to capture data', '📋', true],
      ['Suggested', 'Prepare a Signature Template', 'Configure an eSignature template for use in Workflow Builder', '📄', true],
      ['Suggested', 'Send an Email', 'Send a customizable message', '✉', true],
      ['Documents', 'Use eSignature API', 'Add an eSignature workflow from our list of APIs', '</>', false],
      ['Documents', 'Prepare Document Template', 'Create accurate, custom agreements', '📄', false],
      ['Documents', 'Send Documents for Signature', 'Prepare and send documents for signature', '✍', false],
      ['DocuSign Identify', 'Verify Someone\'s Identity', 'Verify a participant\'s identity', '🛡', false],
      ['DocuSign Identify', 'Risk Assessment', 'Assess the risk of a participant\'s identity', '🔍', false],
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
        <div class="ds-prod-wf-canvas ds-prod-wf-canvas--blur"></div>
        <aside class="ds-prod-drawer">
          <div class="ds-prod-drawer-head">
            <strong>Add New Step</strong>
            <span>×</span>
          </div>
          <div class="ds-prod-search ds-prod-search--compact">⌕ Search for steps</div>
          <div class="ds-prod-drawer-tabs">
            <span class="active">Home</span><span>DocuSign</span><span>Utility</span><span>Apps</span>
          </div>
          <div class="ds-prod-drawer-list">${rows}</div>
        </aside>
      </div>`;
  },

  webformsBuilder(ctx = {}) {
    const formName = ctx.formName || 'IPP_goal_template_fillable.pdf';
    return `
      <div class="ds-prod-frame ds-prod-frame--forms">
        <div class="ds-prod-forms-top">
          <span>${formName}</span>
          <span class="ds-prod-draft-tag">Draft</span>
          <span class="ds-prod-draft-tag">Unsaved Changes</span>
          <span class="ds-prod-forms-spacer"></span>
          <label class="ds-prod-toggle"><input type="checkbox" checked disabled /> Document view</label>
          <button type="button" class="ds-prod-btn-outline-sm">Preview</button>
          <button type="button" class="ds-prod-btn-primary-sm">Activate</button>
        </div>
        <div class="ds-prod-forms-body">
          <aside class="ds-prod-forms-outline">
            <div class="ds-prod-ai-badge-inline">✦ AI-Assisted</div>
            <p class="ds-prod-forms-ai-note">Form layout and field labels are identified using AI. Always review before use.</p>
            <label>Signer <select class="ds-prod-select-sm"><option>SS Signer</option></select></label>
            <ul class="ds-prod-outline-tree">
              <li>Welcome page</li>
              <li>Employee Information</li>
              <li class="active">Employee Details ▸
                <ul>
                  <li>Name</li><li>Badge Number</li><li>Job Title</li><li>Status</li>
                </ul>
              </li>
              <li>Department Information</li>
            </ul>
          </aside>
          <main class="ds-prod-forms-canvas">
            <h3>Employee Details</h3>
            <p class="ds-prod-muted">Optional description · <a class="ds-prod-link">Customize text with Markdown Syntax</a></p>
            ${[
              ['Name', 'Enter the employee name as it appears on their badge.', 'Sample Employee'],
              ['Badge Number', '', '048217'],
              ['Job Title', '', 'Transit Operator'],
            ].map(([label, hint, val]) => `
              <div class="ds-prod-form-field">
                <label>${label}</label>
                ${hint ? `<small>${hint}</small>` : ''}
                <div class="ds-prod-form-input">${val}</div>
              </div>`).join('')}
            <div class="ds-prod-form-field">
              <label>Status *</label>
              <div class="ds-prod-radio-row"><label><input type="radio" disabled /> Probation</label><label><input type="radio" checked disabled /> Regular</label></div>
            </div>
          </main>
          <aside class="ds-prod-forms-props">
            <div class="ds-prod-props-tabs"><span class="active">Properties</span><span>Rules</span></div>
            <label>Section title *<input type="text" value="Employee Details" readonly /></label>
            <label>Section subtitle<input type="text" readonly /></label>
            <button type="button" class="ds-prod-link-danger">🗑 Delete Section</button>
          </aside>
        </div>
      </div>`;
  },

  signing(ctx = {}) {
    const signer = ctx.signerName || 'Jane Smith';
    return `
      <div class="ds-prod-frame ds-prod-frame--sign">
        <div class="ds-prod-sign-top">
          <span class="ds-prod-logo-text">DocuSign</span>
          <span>Permit Application — Signature Required</span>
        </div>
        <div class="ds-prod-sign-body">
          <div class="ds-prod-sign-doc">
            <h3>City of Oakland<br>Permit Application</h3>
            <p><strong>Applicant:</strong> ${signer}</p>
            <p><strong>Project:</strong> Residential solar installation — 1234 Broadway</p>
            <div class="ds-prod-sign-field-box">
              <div class="ds-prod-sign-tab-active">Sign</div>
              <div class="ds-prod-sign-line">/s/ ${signer}</div>
              <small>Authorized signer</small>
            </div>
            <p class="ds-prod-muted">By selecting Adopt and Sign, I agree that the signature will be the electronic representation of my signature.</p>
          </div>
          <aside class="ds-prod-sign-panel">
            <p><strong>Review and sign</strong></p>
            <p class="ds-prod-muted">1 document · Permit Application.pdf</p>
            <button type="button" class="ds-prod-btn-yellow ds-prod-btn-full">Start</button>
            <button type="button" class="ds-prod-btn-outline-sm ds-prod-btn-full">Other Actions ▾</button>
            <div class="ds-prod-sign-progress"><div class="ds-prod-sign-progress-fill"></div></div>
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
              ${uploads.map((row, i) => `
                <tr class="${i === 0 ? 'highlight' : ''}">
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
            <span class="ds-prod-logo-text">DocuSign</span>
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
};
