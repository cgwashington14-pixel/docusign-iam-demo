/* California Gov Workflow Walkthrough — auto-play demo engine */

const GW_DATA = JSON.parse(document.getElementById('gw-scenario-data').textContent);
let gwCurrentState = GW_DATA.state || 'CA';
let gwCurrentScenario = 'first_party';
let gwCurrentStep = 0;
let gwPlaying = false;
let gwPlayTimer = null;
const GW_PLAY_INTERVAL = 4500;

function gwSwitchTab(id) {
  document.querySelectorAll('.gw-tab-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('#gw-tabs .tab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById('gw-tab-' + id);
  if (panel) panel.style.display = 'block';
  event.currentTarget.classList.add('active');
}

function gwGetScenario() {
  return GW_DATA[gwCurrentScenario];
}

function gwGetScorecard() {
  return GW_DATA.scorecards[gwCurrentScenario];
}

async function gwChangeState(abbr) {
  gwStopPlay();
  abbr = abbr.toUpperCase();
  if (abbr === gwCurrentState && GW_DATA.context) return;

  const bar = document.getElementById('gw-context-bar');
  bar.style.opacity = '0.5';

  try {
    const res = await fetch(`/api/gov-workflows/state/${abbr}`);
    const pkg = await res.json();
    if (!res.ok) throw new Error(pkg.error || 'Failed to load state');

    GW_DATA.state = pkg.abbr;
    GW_DATA.context = pkg.context;
    GW_DATA.first_party = pkg.first_party;
    GW_DATA.third_party = pkg.third_party;
    GW_DATA.personas = pkg.personas;
    GW_DATA.scorecards = pkg.scorecards;
    GW_DATA.use_cases = pkg.use_cases;
    gwCurrentState = pkg.abbr;
    gwCurrentStep = 0;

    gwUpdateStateUI(pkg);
    gwSelectScenario(gwCurrentScenario);

    const url = new URL(window.location);
    url.searchParams.set('state', abbr);
    history.replaceState(null, '', url);
  } catch (e) {
    showToast('Could not load state: ' + e.message, 'error');
  } finally {
    bar.style.opacity = '1';
  }
}

function gwUpdateStateUI(pkg) {
  const ctx = pkg.context;
  const uc = pkg.use_cases;

  document.getElementById('gw-state-badge').textContent = ctx.state + ' State Agencies';
  document.getElementById('gw-page-sub').innerHTML =
    `Step-by-step demos for first-party and third-party contracting — Agreement Cloud, IAM, and CLM tailored to <strong>${ctx.state}</strong> agencies.`;
  document.getElementById('gw-state-flag').textContent = ctx.flag;
  document.getElementById('gw-state-badge-text').textContent = ctx.badge;
  document.getElementById('ctx-erp').textContent = ctx.erp;
  document.getElementById('ctx-proc').textContent = ctx.procurement;
  document.getElementById('ctx-it').textContent = ctx.it_authority;
  document.getElementById('ctx-legal').textContent = ctx.legal;

  document.getElementById('uc-fp-title').textContent = uc.first_party.use_case;
  document.getElementById('uc-fp-agency').textContent = uc.first_party.agency;
  document.getElementById('uc-tp-title').textContent = uc.third_party.use_case;
  document.getElementById('uc-tp-agency').textContent = uc.third_party.agency;

  document.getElementById('gw-fp-btn-sub').textContent =
    uc.first_party.agency.split('—')[0].trim().slice(0, 48) + ' — agency template';
  document.getElementById('gw-tp-btn-sub').textContent =
    uc.third_party.vendor + ' vendor paper';

  document.getElementById('gw-standards-title').textContent = ctx.state;
  document.getElementById('gw-standards-list').innerHTML = ctx.standards
    .map(s => `<li class="standards-item">${s}</li>`).join('');

  // Update clause standards text
  if (pkg.clauses) {
    const items = document.querySelectorAll('#gw-clause-list .gw-clause-item');
    pkg.clauses.forEach((c, i) => {
      const el = items[i]?.querySelector('.clause-standard-text');
      if (el) el.textContent = c.ca_standard || c.state_standard || '';
    });
  }

  document.title = ctx.state + ' Gov Workflows — DocuSign Gov Portal';
}

function gwSelectScenario(id) {
  gwStopPlay();
  gwCurrentScenario = id;
  gwCurrentStep = 0;
  document.querySelectorAll('.gw-scenario-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.scenario === id);
  });
  gwRenderDocSummary();
  gwRenderPrefill();
  gwRenderStep();
  gwRenderDiagram();
}

function gwRenderDocSummary() {
  const doc = gwGetScenario().document;
  const fields = [
    ['Type', doc.type],
    ['Template', doc.template],
    ['Value', doc.value],
    ['Term', doc.term],
    ['Vendor', doc.vendor],
    ['Agency', doc.agency],
    ['Solicitation', doc.solicitation],
  ];
  document.getElementById('gw-doc-fields').innerHTML = fields.map(([l, v]) => `
    <div class="extraction-item">
      <span class="extraction-label">${l}</span>
      <span class="extraction-value">${v}</span>
    </div>
  `).join('');
}

function gwRenderPrefill() {
  const pf = gwGetScenario().prefill_source;
  document.getElementById('gw-prefill-system').textContent = pf.system;
  document.getElementById('gw-prefill-fields').innerHTML = pf.fields.map(f => `
    <div class="gw-prefill-row">
      <div class="gw-prefill-field">
        <span class="gw-prefill-label">${f.field}</span>
        <span class="gw-prefill-value">${f.value}</span>
      </div>
      <span class="gw-prefill-source mono">${f.source}</span>
    </div>
  `).join('');
}

function gwRenderDiagram() {
  const steps = gwGetScenario().steps;
  const wrap = document.getElementById('gw-diagram');
  const cols = steps.length <= 5 ? steps.length : Math.ceil(steps.length / 2);
  wrap.innerHTML = `
    <div class="gw-flow-grid" style="--cols:${cols}">
      ${steps.map((s, i) => {
        const persona = GW_DATA.personas[s.persona] || {};
        const state = i < gwCurrentStep ? 'done' : i === gwCurrentStep ? 'active' : '';
        const productClass = s.product === 'CLM' ? 'clm' : s.product.includes('CLM') ? 'both' : 'cloud';
        return `
          <div class="gw-flow-node ${state}" data-step="${i}" onclick="gwGoToStep(${i})">
            <div class="gw-flow-node-num">${s.order}</div>
            <div class="gw-flow-node-body">
              <div class="gw-flow-node-title">${s.title}</div>
              <div class="gw-flow-node-persona">${persona.name || s.persona}</div>
            </div>
            <span class="gw-flow-product gw-flow-product--${productClass}">${s.product}</span>
            ${i < steps.length - 1 ? '<div class="gw-flow-connector"></div>' : ''}
          </div>`;
      }).join('')}
    </div>`;
}

function gwRenderStep() {
  const steps = gwGetScenario().steps;
  const step = steps[gwCurrentStep];
  if (!step) return;

  const persona = GW_DATA.personas[step.persona] || {};
  const total = steps.length;

  document.getElementById('gw-step-title').textContent = `Step ${step.order}: ${step.title}`;
  document.getElementById('gw-step-product').textContent = step.product;
  document.getElementById('gw-step-product').className = 'gw-product-badge gw-product-badge--' +
    (step.product === 'CLM' ? 'clm' : step.product.includes('CLM') ? 'both' : 'cloud');

  document.getElementById('gw-persona-row').innerHTML = `
    <div class="gw-persona-chip gw-persona-chip--${persona.color || 'muted'}">
      <span class="gw-persona-avatar">${persona.icon || '?'}</span>
      <div>
        <div class="gw-persona-name">${persona.name || step.persona}</div>
        <div class="gw-persona-title">${persona.title || ''} · ${persona.dept || ''}</div>
      </div>
    </div>`;

  document.getElementById('gw-step-desc').textContent = step.description;
  document.getElementById('gw-step-actions').innerHTML = (step.actions || [])
    .map(a => `<li>${a}</li>`).join('');

  const apiEl = document.getElementById('gw-step-api');
  if (step.api) {
    apiEl.style.display = 'block';
    apiEl.innerHTML = `
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:6px">API Call</div>
      <div class="code-block" style="font-size:10px">${step.api.method} ${step.api.path}\n// ${step.api.desc}</div>`;
  } else {
    apiEl.style.display = 'none';
  }

  // Highlight clauses
  document.querySelectorAll('.gw-clause-item').forEach(el => {
    el.classList.toggle('highlighted', (step.clauses_highlighted || []).includes(el.dataset.clauseId));
  });

  // AI scorecard
  const scorecardEl = document.getElementById('gw-scorecard-card');
  if (step.ai_review) {
    scorecardEl.style.display = 'block';
    gwRenderScorecard();
  } else {
    scorecardEl.style.display = 'none';
  }

  document.getElementById('gw-step-counter').textContent = `Step ${gwCurrentStep + 1} of ${total}`;
  document.getElementById('gw-progress-bar').style.width = `${((gwCurrentStep + 1) / total) * 100}%`;

  document.getElementById('gw-btn-prev').disabled = gwCurrentStep === 0;
  document.getElementById('gw-btn-next').disabled = gwCurrentStep >= total - 1;

  gwRenderDiagram();
}

function gwRenderScorecard() {
  const sc = gwGetScorecard();
  if (!sc) return;

  const gradeColor = sc.overall_score >= 90 ? 'var(--green)' : sc.overall_score >= 75 ? 'var(--amber)' : 'var(--red)';

  document.getElementById('gw-scorecard-header').innerHTML = `
    <div class="gw-score-overall">
      <div class="gw-score-circle" style="--score-color:${gradeColor}">
        <span class="gw-score-num">${sc.overall_score}</span>
        <span class="gw-score-grade">${sc.grade}</span>
      </div>
      <div class="gw-score-summary">${sc.summary}</div>
    </div>`;

  document.getElementById('gw-scorecard-clauses').innerHTML = (sc.clauses || []).map(c => {
    if (c.status === 'na') {
      return `<div class="gw-score-clause gw-score-clause--na">
        <span class="gw-score-clause-name">${c.name}</span>
        <span class="gw-score-clause-note">${c.note}</span>
      </div>`;
    }
    const icon = c.status === 'pass' ? '✓' : c.status === 'warn' ? '!' : '✗';
    const cls = c.status === 'pass' ? 'pass' : c.status === 'warn' ? 'warn' : 'fail';
    return `<div class="gw-score-clause gw-score-clause--${cls}">
      <div class="gw-score-clause-left">
        <span class="gw-score-clause-icon">${icon}</span>
        <span class="gw-score-clause-name">${c.name}</span>
      </div>
      <div class="gw-score-clause-right">
        <span class="gw-score-clause-score">${c.score}</span>
        <span class="gw-score-clause-note">${c.note}</span>
      </div>
    </div>`;
  }).join('');
}

function gwGoToStep(i) {
  gwCurrentStep = i;
  gwRenderStep();
}

function gwStepNext() {
  const total = gwGetScenario().steps.length;
  if (gwCurrentStep < total - 1) {
    gwCurrentStep++;
    gwRenderStep();
  } else {
    gwStopPlay();
  }
}

function gwStepPrev() {
  if (gwCurrentStep > 0) {
    gwCurrentStep--;
    gwRenderStep();
  }
}

function gwTogglePlay() {
  if (gwPlaying) gwStopPlay();
  else gwStartPlay();
}

function gwStartPlay() {
  gwPlaying = true;
  document.getElementById('gw-btn-play').textContent = '⏸ Pause';
  gwPlayTimer = setInterval(() => {
    const total = gwGetScenario().steps.length;
    if (gwCurrentStep >= total - 1) {
      gwStopPlay();
      return;
    }
    gwStepNext();
  }, GW_PLAY_INTERVAL);
}

function gwStopPlay() {
  gwPlaying = false;
  clearInterval(gwPlayTimer);
  document.getElementById('gw-btn-play').textContent = '▶ Auto-play';
}

function gwAppendHint(text) {
  const ta = document.getElementById('gw-builder-input');
  const cur = ta.value.trim();
  ta.value = cur ? cur + ', ' + text.toLowerCase() : text;
}

async function gwGenerateScenario() {
  const desc = document.getElementById('gw-builder-input').value.trim();
  if (!desc) return;

  const out = document.getElementById('gw-builder-output');
  out.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--muted)">Generating…</div>';

  try {
    const res = await fetch('/api/gov-workflows/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc, state: gwCurrentState }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');

    out.innerHTML = `
      <div class="gw-builder-result">
        <div class="card gw-builder-path gw-builder-path--iam">
          <div class="card-header">
            <span class="card-title">${data.iam_path.title}</span>
            <span class="gw-product-badge gw-product-badge--cloud">IAM</span>
          </div>
          <p style="font-size:12px;color:var(--muted);margin-bottom:14px">${data.iam_path.subtitle}</p>
          <div class="gw-builder-steps">
            ${data.iam_path.steps.map((s, i) => gwBuilderStepHtml(s, i + 1)).join('')}
          </div>
          <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">
            ${data.iam_path.products.map(p => `<span class="gw-builder-product-tag">${p}</span>`).join('')}
          </div>
        </div>
        <div class="card gw-builder-path gw-builder-path--clm">
          <div class="card-header">
            <span class="card-title">${data.clm_path.title}</span>
            <span class="gw-product-badge gw-product-badge--clm">CLM</span>
          </div>
          <p style="font-size:12px;color:var(--muted);margin-bottom:14px">${data.clm_path.subtitle}</p>
          <div class="gw-builder-steps">
            ${data.clm_path.steps.map((s, i) => gwBuilderStepHtml(s, i + 1)).join('')}
          </div>
          <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">
            ${data.clm_path.products.map(p => `<span class="gw-builder-product-tag">${p}</span>`).join('')}
          </div>
        </div>
        <div class="card gw-builder-convergence">
          <div class="card-header"><span class="card-title">Convergence · ${data.state ? data.state.state : gwCurrentState}</span></div>
          <p style="font-size:12px;color:var(--muted);line-height:1.6">${data.convergence_note}</p>
        </div>
      </div>`;
  } catch (e) {
    out.innerHTML = `<div class="alert alert-error"><div class="alert-body"><div class="alert-detail">${e.message}</div></div></div>`;
  }
}

function gwBuilderStepHtml(step, num) {
  const persona = GW_DATA.personas[step.persona] || {};
  const productClass = step.product === 'CLM' ? 'clm' : 'cloud';
  return `
    <div class="gw-builder-step">
      <span class="gw-builder-step-num">${num}</span>
      <div class="gw-builder-step-body">
        <span class="gw-builder-step-name">${step.step}</span>
        <span class="gw-builder-step-persona">${persona.name || step.persona}</span>
      </div>
      <span class="gw-flow-product gw-flow-product--${productClass}">${step.product}</span>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  gwSelectScenario('first_party');
});
