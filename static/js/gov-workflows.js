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
    GW_DATA.executive_threshold = pkg.executive_threshold || 1000000;
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
    `See how <strong>DocuSign IAM</strong> and <strong>CLM</strong> orchestrate intake, review, negotiation, and execution for <strong>${ctx.state}</strong> agencies.`;
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

let gwLastStep = -1;

function gwRenderClmMock(step, persona) {
  const doc = gwGetScenario().document;
  const ctx = GW_DATA.context || {};
  const erp = (ctx.erp || 'ERP').split('(')[0].trim();
  const screen = step.clm_screen || 'agreement_desk';
  const reqId = 'REQ-2026-' + (4200 + (step.order || 1));

  document.getElementById('clm-mock-bc').textContent =
    `Agreement Desk › ${reqId} › ${step.title}`;
  document.getElementById('clm-mock-status').textContent =
    step.id === 'signature' ? 'Ready to Sign' :
    step.id === 'post_execution' ? 'Executed' :
    step.id === 'negotiation' ? 'In Negotiation' : 'In Review';

  document.getElementById('clm-mock-persona').innerHTML = `
    <span class="clm-mock-avatar">${persona.icon || '?'}</span>
    <div>
      <div class="clm-mock-persona-name">${persona.name || step.persona}</div>
      <div class="clm-mock-persona-role">${persona.title || ''}</div>
    </div>
    <span class="clm-mock-acting">Active now</span>`;

  const banner = document.getElementById('clm-flow-banner');
  const hint = step.flow_hint || 'forward';
  if (hint === 'loop_back') {
    banner.style.display = 'flex';
    banner.className = 'clm-flow-banner clm-flow-banner--back';
    banner.innerHTML = '<span class="clm-flow-arrow-icon">←</span> Returned to vendor for counter-redlines';
  } else if (hint === 'forward_after_loop') {
    banner.style.display = 'flex';
    banner.className = 'clm-flow-banner clm-flow-banner--forward';
    banner.innerHTML = '<span class="clm-flow-arrow-icon">→</span> Negotiation resolved — advancing workflow';
  } else if (gwLastStep >= 0 && gwCurrentStep > gwLastStep && step.id === 'negotiation') {
    banner.style.display = 'flex';
    banner.className = 'clm-flow-banner clm-flow-banner--back';
    banner.innerHTML = '<span class="clm-flow-arrow-icon">↩</span> Sent back for negotiation';
  } else {
    banner.style.display = 'none';
  }

  const bodies = {
    agreement_desk: `
      <div class="clm-screen-title">Agreement Desk — Intake Queue</div>
      <table class="clm-desk-table">
        <tr class="clm-desk-row active"><td><span class="clm-desk-id">${reqId}</span></td><td>${doc.type || 'Contract'}</td><td>${doc.agency || ''}</td><td><span class="clm-pill clm-pill--new">New</span></td></tr>
        <tr class="clm-desk-row"><td>REQ-2026-4198</td><td>SOW Amendment</td><td>Procurement</td><td><span class="clm-pill">Review</span></td></tr>
        <tr class="clm-desk-row"><td>REQ-2026-4187</td><td>NDA</td><td>Legal</td><td><span class="clm-pill">Sign</span></td></tr>
      </table>
      <div class="clm-desk-detail">
        <div class="clm-field"><label>Vendor</label><span>${doc.vendor}</span></div>
        <div class="clm-field"><label>Value</label><span>${doc.value}</span></div>
        <div class="clm-field"><label>Source</label><span>${erp} pre-fill</span></div>
      </div>`,
    document_builder: `
      <div class="clm-screen-title">Generate from Template</div>
      <div class="clm-split">
        <div class="clm-panel"><div class="clm-panel-label">Template</div><div class="clm-panel-val">${doc.template}</div>
          <div class="clm-checklist"><div class="clm-check done">✓ Mandatory clauses</div><div class="clm-check done">✓ SOW schedule</div><div class="clm-check">○ Ethics cert</div></div></div>
        <div class="clm-panel"><div class="clm-panel-label">Pre-filled from ${erp}</div>
          <div class="clm-kv"><span>Vendor</span><strong>${doc.vendor}</strong></div>
          <div class="clm-kv"><span>Amount</span><strong>${doc.value}</strong></div></div>
      </div>`,
    iris_review: `
      <div class="clm-screen-title">Iris AI-Assisted Review</div>
      <div class="clm-split">
        <div class="clm-doc-preview"><div class="clm-doc-line"></div><div class="clm-doc-line short"></div><div class="clm-doc-line highlight"></div><div class="clm-doc-line"></div></div>
        <div class="clm-iris-panel">
          <div class="clm-iris-score">${(gwGetScorecard() || {}).overall_score || 88}<span>/100</span></div>
          <div class="clm-iris-label">Playbook match</div>
          <div class="clm-flag clm-flag--warn">⚠ Liability cap deviation</div>
          <div class="clm-flag clm-flag--ok">✓ Data residency OK</div>
          <button class="clm-btn-sm">Apply suggested redline</button>
        </div>
      </div>`,
    approval_queue: `
      <div class="clm-screen-title">Approval Routing</div>
      <div class="clm-approval-chain">
        <div class="clm-approval-node done"><span>1</span> Contracts</div>
        <div class="clm-approval-arrow">→</div>
        <div class="clm-approval-node active"><span>2</span> Legal</div>
        <div class="clm-approval-arrow">→</div>
        <div class="clm-approval-node"><span>3</span> Vendor</div>
        <div class="clm-approval-arrow">→</div>
        <div class="clm-approval-node exec"><span>★</span> Executive</div>
      </div>
      <div class="clm-rule-alert">Auto: Value ${doc.value} exceeds $${(GW_DATA.executive_threshold || 1000000).toLocaleString()} — executive step queued</div>`,
    legal_hub: `
      <div class="clm-screen-title">Legal Hub — Assign Next Approver</div>
      <div class="clm-hub">
        <div class="clm-hub-center">Legal<br><small>${persona.name || 'Counsel'}</small></div>
        <div class="clm-hub-spoke clm-hub-spoke--suggested">→ Contracts Final <span>Suggested</span></div>
        <div class="clm-hub-spoke">→ Vendor Review</div>
        <div class="clm-hub-spoke">→ Procurement</div>
      </div>
      <div class="clm-assign-row">
        <label>Next approver</label>
        <select class="clm-select"><option>Suggested: Contracts Final</option><option>Vendor Review</option><option>Manual entry…</option></select>
        <button class="clm-btn-sm">Route</button>
      </div>`,
    workspace: `
      <div class="clm-screen-title">Workspace — External Review</div>
      <div class="clm-workspace">
        <div class="clm-ws-doc">${doc.template || doc.type}</div>
        <div class="clm-ws-comments">
          <div class="clm-comment"><strong>${doc.vendor}</strong> Proposed change to §6 Liability <span>2h ago</span></div>
          <div class="clm-comment clm-comment--agency"><strong>${persona.name}</strong> Reviewing counter-proposal <span>Now</span></div>
        </div>
      </div>`,
    redline_compare: `
      <div class="clm-screen-title">Redline Compare — v1.0 vs v1.1</div>
      <div class="clm-redline-wrap">
        <div class="clm-redline-col"><div class="clm-redline-h">Baseline (Playbook)</div><div class="clm-redline-text">Liability capped at contract value</div></div>
        <div class="clm-redline-mid"><div class="clm-loop-visual"><span class="clm-loop-arrow">↩</span><span>Negotiation loop</span><span class="clm-loop-arrow">→</span></div></div>
        <div class="clm-redline-col"><div class="clm-redline-h">Vendor v1.1</div><div class="clm-redline-text del">Unlimited liability</div><div class="clm-redline-text add">Cap at 12 mo fees</div></div>
      </div>
      <div class="clm-redline-actions"><button class="clm-btn-sm">Accept</button><button class="clm-btn-sm clm-btn-ghost">Reject → loop back</button></div>`,
    executive_approval: `
      <div class="clm-screen-title">Executive Approval</div>
      <div class="clm-exec-card">
        <div class="clm-exec-badge">Automatic routing triggered</div>
        <div class="clm-exec-val">${doc.value}</div>
        <div class="clm-exec-threshold">Threshold ≥ $${(GW_DATA.executive_threshold || 1000000).toLocaleString()}</div>
        <div class="clm-exec-signer">${persona.name || 'Director'} · Authorized Signer</div>
        <button class="clm-btn-primary">Review &amp; Approve</button>
      </div>`,
    esign_handoff: `
      <div class="clm-screen-title">Send for Signature — eSignature</div>
      <div class="clm-esign">
        <div class="clm-esign-recipient"><span>A</span> ${persona.name || 'Agency Signer'} · Agency</div>
        <div class="clm-esign-recipient"><span>V</span> ${doc.vendor} · Vendor</div>
        <div class="clm-esign-status">Envelope prepared · Ready to send</div>
        <button class="clm-btn-primary">Send with DocuSign</button>
      </div>`,
    obligations_erp: `
      <div class="clm-screen-title">Post-Execution — Obligations &amp; ${erp}</div>
      <div class="clm-obligations">
        <div class="clm-obl"><span>Insurance renewal</span><span>Jul 2027</span></div>
        <div class="clm-obl"><span>Annual report</span><span>Jun 2027</span></div>
        <div class="clm-obl clm-obl--sync"><span>↗ ${erp} encumbrance synced</span><span class="clm-pill clm-pill--ok">Done</span></div>
      </div>`,
  };

  document.getElementById('clm-mock-body').innerHTML = bodies[screen] || bodies.agreement_desk;

  const rulesEl = document.getElementById('clm-mock-rules');
  const rules = step.business_rules || [];
  rulesEl.innerHTML = rules.length ? rules.map(r => `
    <div class="clm-rule ${r.auto ? 'clm-rule--auto' : 'clm-rule--manual'}">
      <span class="clm-rule-type">${r.auto ? 'Auto' : 'Manual'}</span>
      <div><strong>${r.label}</strong><span>${r.detail}</span></div>
    </div>`).join('') : '';
}

function gwRenderDiagram() {
  const steps = gwGetScenario().steps;
  const wrap = document.getElementById('gw-diagram');
  const cols = Math.min(steps.length, 5);
  wrap.innerHTML = `
    <div class="gw-flow-grid" style="--cols:${cols}">
      ${steps.map((s, i) => {
        const persona = GW_DATA.personas[s.persona] || {};
        const state = i < gwCurrentStep ? 'done' : i === gwCurrentStep ? 'active' : '';
        const productClass = s.product === 'CLM' ? 'clm' : s.product === 'IAM' ? 'iam' : 'both';
        const loopMark = s.flow_hint === 'loop_back' && i === gwCurrentStep ? '<span class="gw-loop-badge">↩</span>' : '';
        return `
          <div class="gw-flow-node ${state}" data-step="${i}" onclick="gwGoToStep(${i})">
            ${loopMark}
            <div class="gw-flow-node-num">${s.order}</div>
            <div class="gw-flow-node-body">
              <div class="gw-flow-node-title">${s.title}</div>
              <div class="gw-flow-node-persona">${persona.name || s.persona}</div>
            </div>
            <span class="gw-flow-product gw-flow-product--${productClass}">${s.product}</span>
          </div>`;
      }).join('')}
    </div>
    ${steps.some(s => s.id === 'negotiation') ? '<div class="gw-diagram-loop-note"><span>↩</span> Negotiation may loop back to vendor review before advancing</div>' : ''}`;
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
    (step.product === 'CLM' ? 'clm' : step.product === 'IAM' ? 'iam' : 'both');

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

  gwRenderClmMock(step, persona);
  gwLastStep = gwCurrentStep;

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
