/* IAM Insights & Reporting — full-screen reporting walkthrough */

const GR_STEPS = [
  {
    id: 'dashboard',
    title: 'Executive dashboard',
    icon: '▦',
    headline: 'One pane of glass for contract portfolio health',
    text: 'Leaders see open contracts, spend exposure, renewal risk, and obligation backlog without exporting to spreadsheets.',
    render: grRenderDashboard,
  },
  {
    id: 'obligations',
    title: 'Obligation tracking',
    icon: '✓',
    headline: 'Never miss a deliverable or compliance deadline',
    text: 'IAM extracts insurance renewals, reporting duties, and SLA milestones from executed contracts — assigned owners and due dates included.',
    render: grRenderObligations,
  },
  {
    id: 'renewals',
    title: 'Auto-renewals',
    icon: '↻',
    headline: 'Get ahead of renewal windows and notice periods',
    text: 'Auto-renew and evergreen contracts surface 90-day alerts so procurement can renegotiate or issue notice before deadlines pass.',
    render: grRenderRenewals,
  },
  {
    id: 'types',
    title: 'Agreement types',
    icon: '◧',
    headline: 'Understand your contract mix at a glance',
    text: 'Break down the repository by MSA, SOW, NDA, grant, lease, and more — filterable for audits and category management.',
    render: grRenderTypes,
  },
  {
    id: 'spend',
    title: 'Agreements by spend',
    icon: '$',
    headline: 'Tie contract value to budget and encumbrance',
    text: 'Rank agreements by total value and annual spend. Feed CFO dashboards and ERP reconciliation without manual roll-ups.',
    render: grRenderSpend,
  },
  {
    id: 'party',
    title: 'Party view',
    icon: '👥',
    headline: 'See every agreement with a vendor or partner',
    text: 'Party-centric view shows all active contracts, amendments, and obligations for Acme Cloud or any counterparty — critical for vendor management.',
    render: grRenderParty,
  },
];

let grCurrentStep = 0;
let grPlaying = false;
let grTimer = null;

function grGetDoc() {
  return (typeof gwGetScenario === 'function' ? gwGetScenario() : GW_DATA.first_party).document;
}

function grGetCtx() {
  return GW_DATA.context || {};
}

function grInit() {
  grRenderRail();
  grRenderStep();
}

function grRenderRail() {
  const rail = document.getElementById('gr-rail');
  if (!rail) return;
  rail.innerHTML = GR_STEPS.map((s, i) => {
    const state = i < grCurrentStep ? 'done' : i === grCurrentStep ? 'active' : '';
    return `
      <button type="button" class="gw-rail-step ${state}" onclick="grGoTo(${i})">
        <span class="gw-rail-icon">${s.icon}</span>
        <span class="gw-rail-title">${s.title}</span>
      </button>
      ${i < GR_STEPS.length - 1 ? `<span class="gw-rail-connector ${i < grCurrentStep ? 'done' : ''}"></span>` : ''}`;
  }).join('');
}

function grRenderStep() {
  const step = GR_STEPS[grCurrentStep];
  if (!step) return;

  document.getElementById('gr-step-counter').textContent = `View ${grCurrentStep + 1} of ${GR_STEPS.length}`;
  document.getElementById('gr-step-title').textContent = step.title;
  document.getElementById('gr-value-headline').textContent = step.headline;
  document.getElementById('gr-value-text').textContent = step.text;
  document.getElementById('gr-progress-bar').style.width = `${((grCurrentStep + 1) / GR_STEPS.length) * 100}%`;
  document.getElementById('gr-btn-prev').disabled = grCurrentStep === 0;
  document.getElementById('gr-btn-next').disabled = grCurrentStep >= GR_STEPS.length - 1;

  const canvas = document.getElementById('gr-visual-canvas');
  canvas.innerHTML = step.render();
  grRenderRail();
}

function grGoTo(i) { grCurrentStep = i; grRenderStep(); }
function grStepNext() { if (grCurrentStep < GR_STEPS.length - 1) { grCurrentStep++; grRenderStep(); } else grStopPlay(); }
function grStepPrev() { if (grCurrentStep > 0) { grCurrentStep--; grRenderStep(); } }
function grTogglePlay() { grPlaying ? grStopPlay() : grStartPlay(); }
function grStartPlay() {
  grPlaying = true;
  document.getElementById('gr-btn-play').textContent = '⏸ Pause';
  grTimer = setInterval(() => {
    if (grCurrentStep >= GR_STEPS.length - 1) { grStopPlay(); return; }
    grStepNext();
  }, 5500);
}
function grStopPlay() {
  grPlaying = false;
  clearInterval(grTimer);
  const btn = document.getElementById('gr-btn-play');
  if (btn) btn.textContent = '▶ Play reporting tour';
}

function grInsightsChrome(title, activeNav) {
  return `
    <div class="iam-app iam-app--insights">
      <aside class="iam-sidebar">
        <div class="iam-sidebar-brand">IAM Insights</div>
        <nav class="iam-nav">
          ${['Dashboard', 'Obligations', 'Renewals', 'Types', 'Spend', 'Parties'].map(n => `
            <div class="iam-nav-item ${n === activeNav ? 'active' : ''}">${n}</div>`).join('')}
        </nav>
      </aside>
      <main class="iam-main">
        <header class="iam-main-header"><h3>${title}</h3><span class="iam-insights-filter">California · All agencies</span></header>`;
}

function grRenderDashboard() {
  const doc = grGetDoc();
  const ctx = grGetCtx();
  return grInsightsChrome('Portfolio dashboard', 'Dashboard') + `
        <div class="iam-kpi-row">
          <div class="iam-kpi"><span class="iam-kpi-val">847</span><span class="iam-kpi-label">Active agreements</span></div>
          <div class="iam-kpi"><span class="iam-kpi-val">$1.2B</span><span class="iam-kpi-label">Total encumbered</span></div>
          <div class="iam-kpi iam-kpi--warn"><span class="iam-kpi-val">23</span><span class="iam-kpi-label">Renewals (90d)</span></div>
          <div class="iam-kpi iam-kpi--alert"><span class="iam-kpi-val">8</span><span class="iam-kpi-label">Overdue obligations</span></div>
        </div>
        <div class="gr-chart-row">
          <div class="gr-chart-card">
            <div class="gr-chart-title">Contracts by stage</div>
            <div class="gr-bar-chart">
              <div class="gr-bar" style="--h:85%"><span>Active</span><em>612</em></div>
              <div class="gr-bar" style="--h:45%"><span>Renewal</span><em>89</em></div>
              <div class="gr-bar" style="--h:30%"><span>Negotiation</span><em>34</em></div>
              <div class="gr-bar" style="--h:20%"><span>Expired</span><em>112</em></div>
            </div>
          </div>
          <div class="gr-chart-card gr-chart-card--highlight">
            <div class="gr-chart-title">Featured contract (walkthrough)</div>
            <div class="iam-dash-contract">
              <strong>${doc.vendor}</strong>
              <div class="iam-dash-contract-meta">${doc.type.split('(')[0].trim()} · ${doc.value}</div>
              <div class="iam-dash-contract-meta">${ctx.state || 'California'} · ${doc.agency.split('(')[0].trim()}</div>
              <span class="clm-pill clm-pill--ok">Executed</span>
            </div>
          </div>
        </div>
      </main>
    </div>`;
}

function grRenderObligations() {
  const doc = grGetDoc();
  return grInsightsChrome('Obligation tracking', 'Obligations') + `
        <table class="iam-task-table gr-oblig-table">
          <thead><tr><th>Obligation</th><th>Contract</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>
            <tr class="active"><td>Certificate of insurance</td><td>${doc.vendor}</td><td>Contract admin</td><td><span class="gw-task-due gw-task-due--soon">Jul 2027</span></td><td><span class="clm-pill">Tracked</span></td></tr>
            <tr><td>SOC 2 attestation</td><td>${doc.vendor}</td><td>CISO office</td><td><span class="gw-task-due gw-task-due--soon">Dec 2026</span></td><td><span class="clm-pill clm-pill--new">Due soon</span></td></tr>
            <tr><td>Quarterly SLA report</td><td>${doc.vendor}</td><td>Program manager</td><td><span class="gw-task-due">Sep 2026</span></td><td><span class="clm-pill">Open</span></td></tr>
            <tr><td>Annual price review</td><td>TechVista Analytics</td><td>Procurement</td><td><span class="gw-task-due gw-task-due--overdue">Overdue</span></td><td><span class="clm-pill">Escalated</span></td></tr>
          </tbody>
        </table>
      </main>
    </div>`;
}

function grRenderRenewals() {
  const doc = grGetDoc();
  return grInsightsChrome('Auto-renewal pipeline', 'Renewals') + `
        <div class="gr-renewal-timeline">
          <div class="gr-renewal-item gr-renewal-item--urgent">
            <span class="gr-renewal-date">30 days</span>
            <div><strong>TechVista Analytics</strong><span>SaaS · Auto-renew · Notice window open</span></div>
          </div>
          <div class="gr-renewal-item">
            <span class="gr-renewal-date">90 days</span>
            <div><strong>${doc.vendor}</strong><span>MSA option year · ${doc.value}</span></div>
          </div>
          <div class="gr-renewal-item">
            <span class="gr-renewal-date">180 days</span>
            <div><strong>Statewide NDA bundle</strong><span>Evergreen · 12 vendors</span></div>
          </div>
        </div>
        <div class="gr-chart-card" style="margin-top:16px">
          <div class="gr-chart-title">Renewals by quarter</div>
          <div class="gr-bar-chart gr-bar-chart--horizontal">
            <div class="gr-hbar" style="--w:75%"><span>Q3 2026</span><em>18</em></div>
            <div class="gr-hbar" style="--w:55%"><span>Q4 2026</span><em>12</em></div>
            <div class="gr-hbar" style="--w:40%"><span>Q1 2027</span><em>9</em></div>
          </div>
        </div>
      </main>
    </div>`;
}

function grRenderTypes() {
  return grInsightsChrome('Agreement types', 'Types') + `
        <div class="gr-chart-row">
          <div class="gr-donut-wrap">
            <div class="gr-donut" style="--p1:35;--p2:25;--p3:20;--p4:12;--p5:8"></div>
            <ul class="gr-donut-legend">
              <li><span style="background:#4C00FF"></span> MSA / IT Services (35%)</li>
              <li><span style="background:#0891B2"></span> SOW / Task orders (25%)</li>
              <li><span style="background:#0F8A52"></span> SaaS / Subscription (20%)</li>
              <li><span style="background:#B45309"></span> NDA / Amendments (12%)</li>
              <li><span style="background:#9199A6"></span> Other (8%)</li>
            </ul>
          </div>
          <div class="gr-chart-card">
            <div class="gr-chart-title">By department</div>
            <div class="gr-hbar" style="--w:90%"><span>Technology</span><em>312</em></div>
            <div class="gr-hbar" style="--w:70%"><span>Health &amp; Human Services</span><em>198</em></div>
            <div class="gr-hbar" style="--w:50%"><span>Transportation</span><em>142</em></div>
            <div class="gr-hbar" style="--w:35%"><span>General Services</span><em>97</em></div>
          </div>
        </div>
      </main>
    </div>`;
}

function grRenderSpend() {
  const doc = grGetDoc();
  return grInsightsChrome('Agreements by spend', 'Spend') + `
        <div class="gr-spend-list">
          <div class="gr-spend-row gr-spend-row--top">
            <span>1</span>
            <div><strong>${doc.vendor}</strong><span>${doc.type.split('(')[0].trim()}</span></div>
            <em>${doc.value}</em>
          </div>
          <div class="gr-spend-row"><span>2</span><div><strong>Oracle Statewide ERP</strong><span>ELA Amendment</span></div><em>$18.4M</em></div>
          <div class="gr-spend-row"><span>3</span><div><strong>Microsoft Corp</strong><span>Enterprise Agreement</span></div><em>$12.1M</em></div>
          <div class="gr-spend-row"><span>4</span><div><strong>TechVista Analytics</strong><span>SaaS Subscription</span></div><em>$890K/yr</em></div>
        </div>
        <div class="gr-chart-card" style="margin-top:16px">
          <div class="gr-chart-title">Spend concentration</div>
          <div class="gr-spend-band"><span>Top 10 vendors</span><div class="gr-spend-bar" style="--w:68%"></div><em>68% of total</em></div>
          <div class="gr-spend-band"><span>Remaining portfolio</span><div class="gr-spend-bar gr-spend-bar--muted" style="--w:32%"></div><em>32%</em></div>
        </div>
      </main>
    </div>`;
}

function grRenderParty() {
  const doc = grGetDoc();
  return grInsightsChrome('Party view — ' + doc.vendor.split(',')[0], 'Parties') + `
        <div class="gr-party-header">
          <div class="gr-party-avatar">${doc.vendor.charAt(0)}</div>
          <div>
            <h4>${doc.vendor}</h4>
            <span>4 active agreements · $3.1M total value · Primary: ${doc.agency.split('(')[0].trim()}</span>
          </div>
        </div>
        <table class="iam-task-table">
          <thead><tr><th>Agreement</th><th>Type</th><th>Value</th><th>Expires</th><th>Status</th></tr></thead>
          <tbody>
            <tr class="active"><td>${doc.type.split('(')[0].trim()}</td><td>MSA</td><td>${doc.value}</td><td>Jun 2029</td><td><span class="clm-pill clm-pill--ok">Active</span></td></tr>
            <tr><td>SOW #3 — Cloud migration</td><td>SOW</td><td>$840K</td><td>Dec 2026</td><td><span class="clm-pill">Active</span></td></tr>
            <tr><td>Mutual NDA</td><td>NDA</td><td>—</td><td>Evergreen</td><td><span class="clm-pill clm-pill--ok">Active</span></td></tr>
            <tr><td>DPA Amendment 2025</td><td>Amendment</td><td>—</td><td>Mar 2027</td><td><span class="clm-pill">Renewal due</span></td></tr>
          </tbody>
        </table>
      </main>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('gr-visual-canvas')) grInit();
});
