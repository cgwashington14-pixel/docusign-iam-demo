/* Microsoft Word ribbon tools — IAM AI-Assisted Review task pane & sample contract views */

let gwWordToolMode = 'reviewing';
let gwWordFocusClause = null;

function gwWordUsesShell(step) {
  const sid = step.id;
  if (gwCurrentScenario === 'solicitation' && typeof gwDocPhase === 'function' && gwDocPhase(sid) < 6) return false;
  return ['legal_review', 'ai_scorecard', 'contracts_review', 'negotiation', 'negotiation_out', 'negotiation_return'].includes(sid);
}

function gwWordDefaultMode(step) {
  if (step.id === 'legal_review' || step.id === 'ai_scorecard') return 'playbook';
  if (step.id === 'negotiation' || step.id === 'negotiation_out' || step.id === 'negotiation_return') return 'track';
  return 'reviewing';
}

function gwApplyTrackChangesMarkup(html, step) {
  const sid = step?.id || '';
  if (sid === 'negotiation' || sid === 'negotiation_out' || sid === 'negotiation_return') {
    return html
      .replace(/gw-doc-redline-del/g, 'gw-doc-redline-del gw-track-del')
      .replace(/gw-doc-redline-add/g, 'gw-doc-redline-add gw-track-ins');
  }
  return html
    .replace(
      /(<span class="gw-doc-clause-num">6\.1<\/span> <strong>Cap on Liability\.<\/strong> )([^<]+)/,
      '$1<span class="gw-track-ins">$2</span><span class="gw-track-del">Provider shall have unlimited liability for all claims arising under this Agreement.</span>'
    )
    .replace(
      /(All State Data shall be stored and processed within the continental United States)/,
      '<span class="gw-track-ins">$1</span>'
    );
}

function gwBuildWordCompareView(doc, step, ctx) {
  const sc = typeof gwStateCtx === 'function' ? gwStateCtx() : { state: 'State' };
  return `
    <div class="gw-word-compare">
      <div class="gw-word-compare-col gw-word-compare-col--playbook">
        <div class="gw-word-compare-h">${sc.state} playbook · Agency standard</div>
        <div class="gw-word-compare-block">
          <strong>Article 6.1 — Cap on Liability</strong>
          <p>Total aggregate liability shall not exceed twelve (12) months of fees paid under this Agreement. Carve-outs: IP infringement, confidentiality breach, gross negligence.</p>
        </div>
        <div class="gw-word-compare-block">
          <strong>Article 5.1 — Data Location</strong>
          <p>All State Data stored and processed within the continental United States. SOC 2 Type II required.</p>
        </div>
        <div class="gw-word-compare-block">
          <strong>Article 7 — Insurance</strong>
          <p>Minimums per Gov Code §927.8: $2M CGL, $5M technology E&O, $5M cyber liability.</p>
        </div>
      </div>
      <div class="gw-word-compare-mid">↔</div>
      <div class="gw-word-compare-col gw-word-compare-col--vendor">
        <div class="gw-word-compare-h">Vendor draft · ${doc.vendor.split(',')[0].trim()}</div>
        <div class="gw-word-compare-block gw-word-compare-block--warn">
          <strong>Article 6.1 — Cap on Liability</strong>
          <p><span class="gw-track-del">Unlimited liability</span> for all direct and indirect damages.</p>
        </div>
        <div class="gw-word-compare-block">
          <strong>Article 5.1 — Data Location</strong>
          <p>U.S. data centers — matches playbook.</p>
        </div>
        <div class="gw-word-compare-block gw-word-compare-block--warn">
          <strong>Article 7 — Insurance</strong>
          <p>$1M CGL only — <em>below state minimum</em></p>
        </div>
      </div>
    </div>`;
}

function gwBuildIrisWordPane(doc, step, ctx, mode) {
  const sc = typeof gwStateCtx === 'function' ? gwStateCtx() : { state: 'State', proc: 'Procurement' };
  const scorecard = typeof gwGetScorecard === 'function' ? gwGetScorecard() : null;
  const clauses = scorecard?.clauses || [];
  const flagged = clauses.filter(c => c.status === 'warn' || c.status === 'fail');
  const showClauses = mode === 'iris' ? (flagged.length ? flagged : clauses.slice(0, 3)) : clauses;
  const score = scorecard?.overall_score ?? 88;
  const grade = scorecard?.grade ?? 'B+';
  const standards = (ctx?.standards || GW_DATA?.context?.standards || []);
  const stdRef = standards[0] || `${sc.state} Standard Terms`;
  const procRef = standards[1] || sc.proc + ' Standard Terms';

  const clauseRows = showClauses.map((c, i) => {
    const st = c.status || 'pass';
    const icon = st === 'pass' ? '✓' : st === 'warn' ? '!' : '✗';
    const cls = st === 'pass' ? 'ok' : st === 'warn' ? 'warn' : 'fail';
    const active = gwWordFocusClause === c.name || (!gwWordFocusClause && i === 0 && st !== 'pass');
    return `
      <button type="button" class="gw-iris-clause gw-iris-clause--${cls} ${active ? 'active' : ''}"
        data-clause-focus="${c.name.replace(/"/g, '&quot;')}" onclick="gwFocusWordClause(this)">
        <span class="gw-iris-clause-icon">${icon}</span>
        <span class="gw-iris-clause-name">${c.name}</span>
        ${c.score != null ? `<span class="gw-iris-clause-score">${c.score}</span>` : ''}
        <span class="gw-iris-clause-note">${c.note || ''}</span>
      </button>`;
  }).join('');

  const focusClause = showClauses.find(c => c.name === gwWordFocusClause) || showClauses.find(c => c.status === 'warn') || showClauses[0];

  return `
    <aside class="gw-word-taskpane gw-iris-word-pane" aria-label="IAM AI-Assisted Review">
      <div class="gw-iris-pane-brand">
        <span class="gw-iris-pane-logo">DocuSign</span>
        <span class="gw-iris-pane-product">IAM · AI-Assisted Review</span>
      </div>
      <div class="gw-iris-pane-playbook-title">${sc.state} Playbook</div>
      <div class="gw-iris-pane-playbook-ref">${stdRef}</div>
      <div class="gw-iris-pane-playbook-ref gw-iris-pane-playbook-ref--sub">${procRef}</div>
      <div class="gw-iris-pane-score-row">
        <div class="gw-iris-pane-score-circle">${score}<small>${grade}</small></div>
        <div class="gw-iris-pane-score-meta">
          <strong>Playbook match</strong>
          <span>${scorecard?.summary ? scorecard.summary.slice(0, 90) + '…' : 'Compared against ' + sc.state + ' mandatory terms.'}</span>
        </div>
      </div>
      <div class="gw-iris-pane-section-label">${mode === 'iris' ? 'Iris flags · ' + (flagged.length || showClauses.length) + ' open' : 'All clauses · ' + clauses.length}</div>
      <div class="gw-iris-pane-clauses">${clauseRows || '<p class="gw-iris-pane-empty">No clause data for this step.</p>'}</div>
      ${focusClause ? `
      <div class="gw-iris-pane-detail">
        <div class="gw-iris-pane-detail-title">${focusClause.name}</div>
        <div class="gw-iris-pane-detail-row">
          <span class="gw-iris-pane-detail-label">Playbook</span>
          <p>${focusClause.note || 'Matches ' + sc.state + ' standard language.'}</p>
        </div>
        <div class="gw-iris-pane-detail-row gw-iris-pane-detail-row--contract">
          <span class="gw-iris-pane-detail-label">In contract</span>
          <p>${focusClause.status === 'warn' ? 'Deviation detected — review highlighted text in document.' : 'Language aligns with approved playbook.'}</p>
        </div>
        <button type="button" class="gw-iris-pane-apply" onclick="showToast('Suggested playbook language applied to draft','success')">Apply suggested language</button>
      </div>` : ''}
      <div class="gw-iris-pane-foot">Word add-in · ${doc.template?.split('—')[0].trim() || 'MSA'}</div>
    </aside>`;
}

function gwWordShellTools(state, activeMode, flagCount) {
  const tools = [
    { id: 'reviewing', label: 'Reviewing' },
    { id: 'track', label: 'Track Changes' },
    { id: 'compare', label: 'Compare' },
    { id: 'playbook', label: `${state} Playbook` },
  ];
  return tools.map(t => `
    <button type="button" class="gw-word-tool ${t.id === activeMode ? 'gw-word-tool--active' : ''}"
      data-word-tool="${t.id}">${t.label}</button>`).join('')
    + `<span class="gw-word-ribbon-divider"></span>
    <button type="button" class="gw-word-tool gw-word-tool--iam ${activeMode === 'iris' ? 'gw-word-tool--active' : ''}"
      data-word-tool="iris">Iris flags · ${flagCount || 1} open</button>`;
}

function gwWordMetaPills(mode, version) {
  const pills = [`<span class="gw-word-meta-pill">${version}</span>`];
  if (mode === 'reviewing') pills.push('<span class="gw-word-meta-pill gw-word-meta-pill--legal">With legal comments</span>');
  if (mode === 'track') pills.push('<span class="gw-word-meta-pill gw-word-meta-pill--track">Track changes on</span>');
  if (mode === 'compare') pills.push('<span class="gw-word-meta-pill gw-word-meta-pill--compare">Side-by-side compare</span>');
  if (mode === 'playbook' || mode === 'iris') pills.push('<span class="gw-word-meta-pill gw-word-meta-pill--iris">IAM AI-Assisted Review</span>');
  return pills.join('');
}

function gwWordStatusHint(mode, pageHint) {
  const hints = {
    reviewing: pageHint || 'Articles 5–9 · legal comments visible',
    track: 'Track changes · Article 6 liability · Article 5 data',
    compare: 'Compare · playbook vs vendor draft',
    playbook: 'AI-Assisted Review · playbook task pane',
    iris: 'Iris flags · focus on deviations',
  };
  return hints[mode] || pageHint;
}

function gwWrapWordShell(doc, step, ctx, innerHtml, opts = {}) {
  const sc = typeof gwStateCtx === 'function' ? gwStateCtx() : { state: 'State', proc: 'Agency' };
  const state = sc.state;
  const vendorShort = doc.vendor.split(',')[0].trim();
  const reqId = 'REQ-2026-' + (4200 + (step.order || 1));
  const contractNo = 'CT-2026-' + (4200 + (step.order || 1));
  const version = opts.version || 'Draft v0.4 — Legal Review';
  const pageHint = opts.pageHint || 'Pages 4–8 · Articles 5–9 under review';
  const mode = opts.mode || gwWordToolMode || gwWordDefaultMode(step);
  const shellKey = step.id + '-' + (step.order || 0);
  const scorecard = typeof gwGetScorecard === 'function' ? gwGetScorecard() : null;
  const flagCount = (scorecard?.clauses || []).filter(c => c.status === 'warn' || c.status === 'fail').length;

  let pageContent = innerHtml;
  if (mode === 'track') pageContent = gwApplyTrackChangesMarkup(innerHtml, step);
  if (mode === 'compare') pageContent = gwBuildWordCompareView(doc, step, ctx);

  const showPane = mode === 'playbook' || mode === 'iris';
  const paneHtml = showPane ? gwBuildIrisWordPane(doc, step, ctx, mode) : '';

  return `
    <div class="gw-word-shell ${showPane ? 'gw-word-shell--split' : ''}" data-gw-word-shell="${shellKey}" data-step-id="${step.id}">
      <div class="gw-word-titlebar">
        <span class="gw-word-traffic"><i></i><i></i><i></i></span>
        <span class="gw-word-filename">${contractNo}_MSA_${vendorShort.replace(/\s+/g, '_')}.docx — Microsoft Word</span>
        <span class="gw-word-save">Saved to ${sc.proc} contract share</span>
      </div>
      <div class="gw-word-ribbon">
        <div class="gw-word-ribbon-tabs">
          <span>File</span><span>Home</span><span class="active">Review</span><span>View</span>
        </div>
        <div class="gw-word-ribbon-tools">
          ${gwWordShellTools(state, mode, flagCount)}
        </div>
      </div>
      <div class="gw-word-meta-strip">
        <span><strong>State of ${state}</strong> · ${doc.agency.split('(')[0].trim()}</span>
        <span>${doc.template.split('—')[0].trim()}</span>
        ${gwWordMetaPills(mode, version)}
      </div>
      <div class="gw-word-body ${showPane ? 'gw-word-body--split' : ''}">
        <div class="gw-word-doc-area">
          <div class="gw-word-ruler"></div>
          <div class="gw-word-page">${pageContent}</div>
        </div>
        ${paneHtml}
      </div>
      <div class="gw-word-statusbar">
        <span>${gwWordStatusHint(mode, pageHint)}</span>
        <span>${reqId} · ${doc.value}</span>
        <span>Zoom 100%</span>
      </div>
    </div>`;
}

function gwRefreshWordShell(shellEl, mode) {
  if (!shellEl) return;
  gwWordToolMode = mode;
  const stepId = shellEl.dataset.stepId;
  const steps = typeof gwGetScenario === 'function' ? gwGetScenario().steps : [];
  const step = steps.find(s => s.id === stepId) || steps[gwCurrentStep];
  if (!step) return;
  const doc = gwGetScenario().document;
  const ctx = GW_DATA.context || {};
  const inner = typeof gwBuildContractHtml === 'function' ? gwBuildContractHtml(doc, step, ctx) : '';
  const version = step.id === 'ai_scorecard' ? 'Draft v0.2 — AI Review' : 'Draft v0.4 — Legal Review';
  const pageHint = step.id === 'ai_scorecard' ? 'Iris playbook review · flagged clauses' : 'Articles 5–9 · legal comments visible';
  const parent = shellEl.parentElement;
  const tmp = document.createElement('div');
  tmp.innerHTML = gwWrapWordShell(doc, step, ctx, inner, { mode, version, pageHint });
  const newShell = tmp.firstElementChild;
  if (newShell && parent) {
    shellEl.replaceWith(newShell);
    gwInitWordShell(parent);
  }
}

function gwInitWordShell(root) {
  const scope = root || document;
  scope.querySelectorAll('.gw-word-shell[data-gw-word-shell]').forEach(shell => {
    shell.querySelectorAll('[data-word-tool]').forEach(btn => {
      if (btn.dataset.gwWordBound) return;
      btn.dataset.gwWordBound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        gwRefreshWordShell(shell, btn.dataset.wordTool);
      });
    });
  });
}

function gwFocusWordClause(btn) {
  gwWordFocusClause = btn.dataset.clauseFocus;
  const shell = btn.closest('.gw-word-shell');
  if (shell) gwRefreshWordShell(shell, gwWordToolMode === 'iris' ? 'iris' : 'playbook');
}

function gwOpenPlaybookForClause(clauseId) {
  const clauseMap = {
    limitation_liability: 'Limitation of Liability',
    indemnification: 'Indemnification',
    data_residency: 'Data Residency',
    termination: 'Termination',
    audit_rights: 'Audit Rights',
    anti_lobbying: 'Anti-Lobbying',
    prevailing_wage: 'Prevailing Wage',
    ip_ownership: 'IP Ownership',
  };
  gwWordFocusClause = clauseMap[clauseId] || null;
  gwWordToolMode = 'playbook';
  if (typeof gwSetVisualView === 'function') gwSetVisualView('document');
  else if (typeof gwRenderStep === 'function') gwRenderStep();
  setTimeout(() => {
    const shell = document.querySelector('.gw-word-shell[data-gw-word-shell]');
    if (shell) gwRefreshWordShell(shell, 'playbook');
    else gwInitWordShell(document.getElementById('gw-visual-canvas'));
  }, 50);
}

function gwBindClauseList() {
  document.querySelectorAll('#gw-clause-list .gw-clause-item').forEach(el => {
    el.classList.add('gw-clause-item--clickable');
    if (el.dataset.clauseBound) return;
    el.dataset.clauseBound = '1';
    el.addEventListener('click', () => {
      document.querySelectorAll('#gw-clause-list .gw-clause-item').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      gwOpenPlaybookForClause(el.dataset.clauseId);
    });
  });
}

window.gwWrapWordShell = gwWrapWordShell;
window.gwInitWordShell = gwInitWordShell;
window.gwWordUsesShell = gwWordUsesShell;
window.gwWordDefaultMode = gwWordDefaultMode;
window.gwFocusWordClause = gwFocusWordClause;
window.gwOpenPlaybookForClause = gwOpenPlaybookForClause;
window.gwRefreshWordShell = gwRefreshWordShell;
