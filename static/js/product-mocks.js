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
      ${items.map(([label, on]) => `<div class="ds-prod-sidebar-item ${on ? 'active' : ''}">${label}</div>`).join('')}
      <div class="ds-prod-sidebar-section">Custom Dashboards</div>
      <div class="ds-prod-sidebar-item">Agency Agreements</div>
      <div class="ds-prod-sidebar-item">CDT Vendor Hub</div>
      <div class="ds-prod-sidebar-section">Reports</div>
    </aside>`;
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

  request(ctx = {}) {
    const title = ctx.requestTitle || 'CDT Cloud Modernization — IAM Intake';
    return `
      <div class="ds-prod-frame">
        <div class="ds-prod-request-head">
          <div>
            <h2>${title}</h2>
            <span class="ds-prod-status-pill ds-prod-status-pill--green">Fully Approved and ready for Signature</span>
          </div>
          <div class="ds-prod-request-actions">
            <span class="ds-prod-avatar-sm">${DS_DEMO.initials}</span><span class="ds-prod-avatar-sm">CL</span><span class="ds-prod-avatar-sm">LG</span>
            <button type="button" class="ds-prod-btn-outline-sm">Following</button>
            <button type="button" class="ds-prod-btn-outline-sm">Share</button>
          </div>
        </div>
        <div class="ds-prod-request-tabs">
          ${['Overview', 'Details', 'Documents', 'Approvals', 'Envelopes'].map((t, i) =>
            `<span class="ds-prod-request-tab ${i === 0 ? 'active' : ''}">${t}</span>`).join('')}
        </div>
        <div class="ds-prod-request-body">
          <main class="ds-prod-feed">
            <div class="ds-prod-feed-head">
              <strong>Activity Feed</strong>
              <select class="ds-prod-select-sm"><option>All activity</option></select>
              <button type="button" class="ds-prod-btn-primary-sm">Send Message</button>
            </div>
            <div class="ds-prod-feed-item">
              <span class="ds-prod-feed-date">6/8/2026</span>
              <div class="ds-prod-feed-row"><span class="ds-prod-feed-icon">⚙</span> Workflow Builder changed status to <strong>Fully Approved and ready for Signature</strong></div>
              <div class="ds-prod-feed-row"><span class="ds-prod-feed-icon">✓</span> Approved risk review checkpoint</div>
              <div class="ds-prod-feed-row"><span class="ds-prod-feed-icon">📄</span> ${DS_DEMO.vendor} uploaded <strong>CDT MSA — Cloud Services SOW.docx</strong></div>
              <div class="ds-prod-feed-message">
                <span class="ds-prod-avatar-sm">${DS_DEMO.initials}</span>
                <div><strong>${DS_DEMO.lead}</strong> · 6/8/2026<br>Please review the attached SOW before we route to signature.</div>
              </div>
            </div>
            <div class="ds-prod-feed-compose"><input type="text" placeholder="Add a comment…" readonly /></div>
          </main>
          <aside class="ds-prod-request-side">
            <button type="button" class="ds-prod-btn-primary-sm ds-prod-btn-full">✦ Chat with request</button>
            <div class="ds-prod-side-section">
              <strong>Information</strong>
              ${[
                ['Request ID', 'REQ-2026-4201'], ['Status', 'Fully Approved and ready for Signature'],
                ['Request type', 'Cloud services intake'], ['Submitter', DS_DEMO.lead],
                ['Owner', DS_DEMO.owner], ['Due Date', '6/15/2026'], ['Created', '6/8/2026'],
              ].map(([k, v]) => `<div class="ds-prod-side-row"><span>${k}</span><span>${v}</span></div>`).join('')}
            </div>
            <button type="button" class="ds-prod-link-danger">🗑 Delete Request</button>
          </aside>
        </div>
      </div>`;
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
              ['Name', 'Enter the employee name as it appears on their badge.', 'Cole Mitchell'],
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
