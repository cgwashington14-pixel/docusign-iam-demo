/* California Gov Workflow Walkthrough — cinematic document + CLM stage */

const GW_DATA = JSON.parse(document.getElementById('gw-scenario-data').textContent);
let gwCurrentState = GW_DATA.state || 'CA';
let gwCurrentScenario = 'first_party';
let gwCurrentStep = 0;
let gwPlaying = false;
let gwPlayTimer = null;
const GW_PLAY_INTERVAL = 5000;
let gwLastStep = -1;

/** Business value callouts per workflow step — for executives & agency leaders */
const GW_VALUE = {
  initiate: { headline: 'One front door for every contract request', text: 'Agreement Desk replaces email chains and lost attachments. Procurement and program staff submit once; leadership gets visibility from day one.', audience: 'COO · Procurement · Program directors' },
  intake: { headline: 'Vendor paper enters a controlled intake queue', text: 'Third-party contracts no longer sit in inboxes. CLM classifies the document, assigns an owner, and starts the clock on review SLAs.', audience: 'Procurement · Legal · Vendor managers' },
  generate: { headline: 'Generate contracts in minutes, not weeks', text: 'CLM pulls vendor, amount, and program data from your ERP and merges it into approved templates — with mandatory state clauses already in place.', audience: 'Contracts team · Business owners' },
  ai_scorecard: { headline: 'AI review catches risk before Legal spends time', text: 'Iris compares vendor language to your playbook in seconds — flagging liability, data residency, and insurance gaps so counsel focuses on what matters.', audience: 'Legal · Risk · CISO' },
  contracts_review: { headline: 'Structured approval — no more version confusion', text: 'Contracts team sees one authoritative draft with a clear routing chain. High-value deals auto-queue executive approval per policy.', audience: 'Contracts · Finance · Executives' },
  contracts_triage: { headline: 'Triage vendor paper against agency standards', text: 'Contracts quickly scores incoming vendor agreements and routes only exceptions to Legal — keeping routine deals moving.', audience: 'Contracts · Procurement' },
  legal_review: { headline: 'Legal stays in control of routing', text: 'Hub-and-spoke assignment lets counsel pick the next approver — suggested by playbook or entered manually — without losing audit trail.', audience: 'General Counsel · Legal ops' },
  external_review: { headline: 'Secure collaboration with vendors', text: 'Workspace gives external parties a controlled view to comment and redline — without email attachments or uncontrolled copies.', audience: 'Legal · Vendor relationship owners' },
  negotiation: { headline: 'Negotiation loops stay visible and auditable', text: 'Every redline round is tracked on the document and in CLM. Teams see exactly what changed in Article 6 Liability before accepting or sending back.', audience: 'Legal · Contracts · Vendor managers' },
  negotiation_out: { headline: 'Send redlines to vendor with one action', text: 'Agency counter-proposals go out through Workspace — vendors respond in context, not via scattered email threads.', audience: 'Legal · Contracts' },
  negotiation_return: { headline: 'Vendor responses route back automatically', text: 'When the vendor counters, CLM notifies the right owner and updates the task queue — nothing falls through the cracks.', audience: 'Legal · Procurement' },
  contracts_final: { headline: 'Final contracts sign-off before execution', text: 'Contracts confirms all playbook deviations are resolved and mandatory approvals are complete before signature.', audience: 'Contracts · Compliance' },
  contracts_approval: { headline: 'Final approval gate before signature', text: 'Contracts verifies all negotiation rounds are closed and policy requirements met — then releases for signature.', audience: 'Contracts · Compliance' },
  executive_approval: { headline: 'Policy-driven executive routing — automatic', text: 'Contracts above your dollar threshold route to the Director without manual escalation. Executives see a summary packet, not a 40-page PDF.', audience: 'CEO · Director · CFO' },
  signature: { headline: 'Sign anywhere — mobile, embedded, or in portal', text: 'DocuSign eSignature closes the loop with tamper-evident execution. Both parties sign the same final version — no re-keying.', audience: 'Authorized signers · All stakeholders' },
  post_execution: { headline: 'Executed contracts feed reporting & ERP automatically', text: 'Agreement Manager captures renewals, obligations, and expiration dates. FI$Cal and your contract register update without manual data entry.', audience: 'CFO · CIO · Contract administrators' },
};

const GW_PLAIN = {
  initiate: 'A program manager submits a new contract request through Agreement Desk. The system captures vendor, value, and business owner — and opens a tracked workflow.',
  intake: 'Vendor paper arrives through the portal. CLM classifies the document and places it in the intake queue for Contracts.',
  generate: 'CLM generates the contract from your approved template, pre-filling vendor and dollar amount from FI$Cal.',
  ai_scorecard: 'Iris scans the draft against California Standard Terms and highlights clauses that need Legal attention.',
  contracts_review: 'The Contracts team reviews the draft, confirms playbook compliance, and advances to Legal.',
  contracts_triage: 'Contracts triages vendor paper and determines whether Legal review is required.',
  legal_review: 'Legal counsel reviews flagged clauses and assigns the next approver using hub-and-spoke routing.',
  external_review: 'The vendor receives a secure Workspace link to review and comment on the draft.',
  negotiation: 'Both sides exchange redlines on Article 6 Liability. The document shows exactly what was deleted and added.',
  negotiation_out: 'Agency sends counter-redlines to the vendor through Workspace.',
  negotiation_return: 'Vendor response returns to the agency queue for Legal review.',
  contracts_final: 'Contracts gives final approval once all redlines are resolved.',
  contracts_approval: 'Contracts confirms the agreement is ready for signature.',
  executive_approval: 'Because this contract exceeds $1M, CLM automatically routes to the Department Director for approval.',
  signature: 'Authorized signers execute the final version via DocuSign eSignature.',
  post_execution: 'The executed contract syncs to Agreement Manager for reporting and pushes metadata back to FI$Cal.',
};

function gwProductBadgeClass(product) {
  const p = String(product || '');
  if (p === 'CLM') return 'clm';
  if (p === 'IAM Platform' || (p.includes('CLM') && p.includes('IAM'))) return 'both';
  return 'iam';
}

function gwSwitchTab(id) {
  document.querySelectorAll('.gw-tab-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('#gw-tabs .tab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById('gw-tab-' + id);
  if (panel) panel.style.display = 'block';
  event.currentTarget.classList.add('active');
  if (id === 'reporting' && typeof grInit === 'function') grInit();
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
    `Follow one contract from intake to execution for <strong>${ctx.state}</strong> — document, IAM Platform screens, tasks, and reporting in <strong>DocuSign Intelligent Agreement Management</strong>.`;
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

/* ── Live document panel with inline redlines ─────────────────────────────── */

function gwDocPhase(stepId) {
  const order = {
    initiate: 0, generate: 1, ai_scorecard: 2, contracts_review: 3,
    legal_review: 4, external_review: 5, negotiation: 6,
    executive_approval: 7, signature: 8, post_execution: 9,
    intake: 0, contracts_triage: 2, negotiation_out: 6, negotiation_return: 5,
    contracts_final: 6, contracts_approval: 6,
  };
  return order[stepId] ?? 0;
}

function gwStateCtx() {
  const ctx = GW_DATA.context || {};
  const state = ctx.state || GW_DATA.state || 'California';
  return {
    state,
    erp: (ctx.erp || 'FI$Cal').split('(')[0].trim(),
    proc: (ctx.procurement || 'DGS').split('(')[0].trim(),
    legal: ctx.legal || 'Delegated agency counsel',
    legalShort: (ctx.legal || 'Agency counsel').split('—')[0].trim(),
    itAuth: (ctx.it_authority || 'State IT authority').split('(')[0].trim(),
  };
}

function gwLegalReviewNote(clauseId, sid, state, sc) {
  if (sid !== 'legal_review') return '';
  const notes = {
    limitation_liability: `Confirm 12-month fee cap aligns with DGS STD 213 and ${state} procurement policy. Carve-outs for IP infringement and confidentiality required.`,
    indemnification: `Mutual indemnification acceptable. Agency shall not indemnify vendor negligence — verify Art. 7.3 limits pass-through of sovereign liability.`,
    insurance: `Require certificates naming State of ${state} as additional insured. Minimums per Gov Code §927.8: $2M CGL, $5M technology E&O, $5M cyber.`,
    audit_rights: `State Auditor access per Gov Code §8546 confirmed. Retain 7-year records; CPRA response language in §9.2 is mandatory.`,
    data_residency: `U.S.-only storage and 72-hour breach notice satisfy CPRA / Civ. Code §1798.82. Cross-check SAM 5305 for ${sc.itAuth} data tier.`,
  };
  const text = notes[clauseId];
  if (!text) return '';
  return `<span class="gw-doc-legal-comment"><span class="gw-doc-legal-comment-pin">⚖</span><span class="gw-doc-legal-comment-body"><strong>${sc.legalShort}</strong> ${text}</span></span>`;
}

function gwWrapWordShell(doc, step, ctx, innerHtml, opts = {}) {
  const sc = gwStateCtx();
  const state = sc.state;
  const vendorShort = doc.vendor.split(',')[0].trim();
  const reqId = 'REQ-2026-' + (4200 + (step.order || 1));
  const contractNo = 'CT-2026-' + (4200 + (step.order || 1));
  const version = opts.version || 'Draft v0.4 — Legal Review';
  const pageHint = opts.pageHint || 'Pages 4–8 · Articles 5–9 under review';

  return `
    <div class="gw-word-shell">
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
          <button type="button" class="gw-word-tool gw-word-tool--active">Reviewing</button>
          <button type="button" class="gw-word-tool">Track Changes</button>
          <button type="button" class="gw-word-tool">Compare</button>
          <button type="button" class="gw-word-tool">${state} Playbook</button>
          <span class="gw-word-ribbon-divider"></span>
          <button type="button" class="gw-word-tool gw-word-tool--iam">Iris flags · 1 open</button>
        </div>
      </div>
      <div class="gw-word-meta-strip">
        <span><strong>State of ${state}</strong> · ${doc.agency.split('(')[0].trim()}</span>
        <span>${doc.template.split('—')[0].trim()}</span>
        <span class="gw-word-meta-pill">${version}</span>
        <span class="gw-word-meta-pill gw-word-meta-pill--legal">With legal comments</span>
      </div>
      <div class="gw-word-doc-area">
        <div class="gw-word-ruler"></div>
        <div class="gw-word-page">${innerHtml}</div>
      </div>
      <div class="gw-word-statusbar">
        <span>${pageHint}</span>
        <span>${reqId} · ${doc.value}</span>
        <span>Zoom 100%</span>
      </div>
    </div>`;
}

function gwClauseHighlight(clauseId, sid, showHighlights) {
  const map = {
    ai_scorecard: ['limitation_liability', 'data_residency', 'indemnification'],
    contracts_review: ['value', 'prevailing_wage', 'anti_lobbying'],
    legal_review: ['indemnification', 'limitation_liability', 'insurance', 'audit_rights'],
    external_review: ['limitation_liability'],
  };
  const active = map[sid] || [];
  return showHighlights && active.includes(clauseId) ? ' gw-doc-highlight' + (clauseId === 'limitation_liability' && sid === 'ai_scorecard' ? ' gw-doc-highlight--warn' : '') : '';
}

function gwBuildContractHtml(doc, step, ctx) {
  const sc = gwStateCtx();
  const state = sc.state;
  const sid = step.id;
  const phase = gwDocPhase(sid);
  const isThirdParty = gwCurrentScenario === 'third_party';
  const showBody = phase >= 1;
  const showHighlights = sid === 'ai_scorecard' || sid === 'legal_review' || sid === 'contracts_review';
  const showSignatures = sid === 'signature' || sid === 'executive_approval' || sid === 'post_execution';
  const executed = sid === 'post_execution';
  const agencyShort = doc.agency.split('(')[0].trim();
  const vendorShort = doc.vendor.split(',')[0].trim();
  const templateRef = doc.template.split('—')[0].trim();
  const erp = sc.erp;
  const hl = (id) => gwClauseHighlight(id, sid, showHighlights);
  const legal = (id) => gwLegalReviewNote(id, sid, state, sc);
  const sowRef = doc.solicitation || 'RFO-CDT-2026-0142';

  const intakeOverlay = sid === 'initiate' || sid === 'intake' ? `
    <div class="gw-doc-intake-overlay">
      <div class="gw-doc-intake-card">
        <div class="gw-doc-intake-title">Agreement Desk · New request</div>
        <div class="gw-doc-intake-field"><label>Request type</label><span>${doc.type.split('(')[0].trim()}</span></div>
        <div class="gw-doc-intake-field"><label>Vendor</label><span>${doc.vendor}</span></div>
        <div class="gw-doc-intake-field"><label>Contract value</label><span>${doc.value}</span></div>
        <div class="gw-doc-intake-field"><label>Business owner</label><span>${agencyShort}</span></div>
        <div class="gw-doc-intake-actions"><span class="gw-doc-intake-btn">Submit to queue</span></div>
      </div>
    </div>` : '';

  const generateOverlay = sid === 'generate' ? `
    <div class="gw-doc-gen-banner">
      <span class="gw-doc-gen-spinner"></span>
      Generating from ${templateRef} — merging ${erp} fields and mandatory ${state} clauses…
    </div>` : '';

  if (!showBody) {
    return `${intakeOverlay}${generateOverlay}
      <div class="gw-doc-paper gw-doc-paper--empty">
        <div class="gw-doc-placeholder"><div class="gw-doc-placeholder-icon">📄</div><p>Document will generate after intake is approved</p></div>
      </div>`;
  }

  if (isThirdParty) {
    return gwBuildThirdPartyContract(doc, step, ctx, { intakeOverlay, generateOverlay, executed, showSignatures, sid, hl, agencyShort, vendorShort, state });
  }

  /* ── First-party MSA (DGS STD 213 style) ─────────────────────────────────── */

  const liabilityCap = 'The total cumulative liability of either party under this Agreement shall not exceed the total fees paid or payable under this Agreement during the twelve (12) months immediately preceding the event giving rise to the claim.';
  const liabilityVendor = 'Provider shall have unlimited liability for all claims, damages, losses, and causes of action arising under or relating to this Agreement, including without limitation direct, indirect, incidental, and consequential damages.';
  const liabilityCompromise = liabilityCap + ' Nothing in this Section limits liability for (a) breach of confidentiality, (b) infringement of intellectual property rights, or (c) fraud or willful misconduct.';

  const section6 = sid === 'negotiation' ? `
    <div class="gw-doc-article">
      <h4 class="gw-doc-article-title">ARTICLE 6 — LIMITATION OF LIABILITY</h4>
      <p class="gw-doc-p gw-doc-clause gw-doc-clause--redline" data-clause="limitation_liability">
        <span class="gw-doc-clause-num">6.1</span> <strong>Cap on Liability.</strong>
        <span class="gw-doc-redline-del">${liabilityVendor}</span>
        <span class="gw-doc-redline-add">${liabilityCompromise}</span>
        <span class="gw-doc-redline-note">← Vendor v0.6 counter-proposal · Legal reviewing</span>
      </p>
      <p class="gw-doc-p"><span class="gw-doc-clause-num">6.2</span> <strong>Exclusion of Consequential Damages.</strong> EXCEPT FOR BREACHES OF SECTION 5 (DATA SECURITY) OR SECTION 7 (INDEMNIFICATION), NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS OR LOST DATA.</p>
    </div>` : `
    <div class="gw-doc-article">
      <h4 class="gw-doc-article-title">ARTICLE 6 — LIMITATION OF LIABILITY</h4>
        <p class="gw-doc-p gw-doc-clause${hl('limitation_liability')}" data-clause="limitation_liability">
        <span class="gw-doc-clause-num">6.1</span> <strong>Cap on Liability.</strong> ${phase >= 6 && sid !== 'negotiation' ? liabilityCompromise : liabilityCap}
        ${sid === 'ai_scorecard' ? '<span class="gw-doc-margin-note">Iris: compare to playbook — cap language acceptable; verify carve-outs</span>' : ''}
        ${legal('limitation_liability')}
      </p>
      <p class="gw-doc-p"><span class="gw-doc-clause-num">6.2</span> <strong>Exclusion of Consequential Damages.</strong> EXCEPT FOR BREACHES OF SECTION 5 OR SECTION 7, NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.</p>
    </div>`;

  return `
    ${intakeOverlay}
    ${generateOverlay}
    <div class="gw-doc-paper ${executed ? 'gw-doc-paper--executed' : ''}">
      ${executed ? '<div class="gw-doc-stamp">Fully Executed</div>' : ''}

      <div class="gw-doc-letterhead">
        <div class="gw-doc-letterhead-state">State of ${state}</div>
        <div class="gw-doc-letterhead-agency">${doc.agency}</div>
        <div class="gw-doc-letterhead-ref">${templateRef} · Solicitation ${sowRef}</div>
      </div>

      <h3 class="gw-doc-doc-title">MASTER SERVICES AGREEMENT</h3>
      <p class="gw-doc-meta-line gw-doc-meta-center">Contract No. CT-2026-${4200 + (step.order || 1)}</p>

      <div class="gw-doc-recitals">
        <p class="gw-doc-p"><strong>RECITALS</strong></p>
        <p class="gw-doc-p">WHEREAS, Agency desires to procure information technology goods and services from Provider pursuant to ${state} Public Contract Code and Department of General Services (DGS) contracting requirements; and</p>
        <p class="gw-doc-p">WHEREAS, Provider represents that it has the capability, experience, and resources to perform the services described in one or more Statements of Work executed under this Agreement;</p>
        <p class="gw-doc-p">NOW, THEREFORE, in consideration of the mutual covenants herein, the parties agree as follows:</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 1 — DEFINITIONS</h4>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">1.1</span> <strong>"Agreement"</strong> means this Master Services Agreement, all Statements of Work, Exhibits, and amendments executed by both parties.</p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">1.2</span> <strong>"Deliverables"</strong> means all work product, reports, software, documentation, and materials developed or provided by Provider under a Statement of Work.</p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">1.3</span> <strong>"State Data"</strong> means all information owned by, controlled by, or pertaining to Agency that is processed, stored, or transmitted by Provider under this Agreement.</p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">1.4</span> <strong>"Statement of Work" or "SOW"</strong> means a document substantially in the form of Exhibit A describing specific services, deliverables, milestones, and fees.</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 2 — TERM</h4>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">2.1</span> <strong>Initial Term.</strong> This Agreement commences on the Effective Date and continues for ${doc.term.split('+')[0].trim()}, unless earlier terminated in accordance with Article 14.</p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">2.2</span> <strong>Extension Options.</strong> ${doc.term.includes('option') ? doc.term.split('+').slice(1).join('+').trim() || 'Agency may exercise optional extension periods as set forth in the applicable SOW, subject to DGS approval and available appropriation.' : 'Optional extension periods may be exercised per DGS STD 213 and applicable SOW provisions.'}</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 3 — SCOPE OF SERVICES</h4>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">3.1</span> Provider shall perform the services and deliver the Deliverables specified in each SOW executed under this Agreement.</p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">3.2</span> <strong>Initial SOW.</strong> The parties incorporate by reference Statement of Work No. 1 (Exhibit B) for cloud infrastructure modernization services described in Solicitation ${sowRef}.</p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">3.3</span> Provider shall assign qualified personnel and comply with Agency security policies, including SAM Section 5305 and applicable ${state} Information Security standards.</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 4 — COMPENSATION AND PAYMENT</h4>
        <p class="gw-doc-p gw-doc-clause${hl('value')}" data-clause="value">
          <span class="gw-doc-clause-num">4.1</span> <strong>Contract Value.</strong> The total not-to-exceed value for SOW No. 1 is <strong>${doc.value}</strong>, funded from Agency appropriation as recorded in ${erp}.
          ${sid === 'generate' ? '<span class="gw-doc-fill-anim">← pre-filled from ERP</span>' : ''}
        </p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">4.2</span> <strong>Invoicing.</strong> Provider shall submit invoices monthly in accordance with DGS Invoice Standards. Agency shall pay undisputed amounts within forty-five (45) days of receipt of a correct invoice.</p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">4.3</span> <strong>Encumbrance.</strong> Agency shall not be obligated to pay amounts in excess of the encumbered balance. No payment shall be made until this Agreement is fully executed and filed with DGS.</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 5 — DATA SECURITY AND PRIVACY</h4>
        <p class="gw-doc-p gw-doc-clause${hl('data_residency')}" data-clause="data_residency">
          <span class="gw-doc-clause-num">5.1</span> <strong>Data Location.</strong> All State Data shall be stored, processed, and maintained within the continental United States in data centers meeting SOC 2 Type II or equivalent standards. Provider shall not transfer State Data outside the U.S. without prior written Agency approval.
          ${legal('data_residency')}
        </p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">5.2</span> <strong>Security Requirements.</strong> Provider shall implement administrative, physical, and technical safeguards consistent with NIST SP 800-53 Moderate baseline and Agency's Information Security policies.</p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">5.3</span> <strong>Breach Notification.</strong> Provider shall notify Agency within seventy-two (72) hours of discovering any Security Incident affecting State Data, and shall cooperate with Agency's obligations under ${state} Civil Code §1798.82 and applicable CPRA requirements.</p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">5.4</span> <strong>Subprocessors.</strong> Provider shall maintain a current list of subprocessors and provide thirty (30) days' notice before adding any subprocessor that accesses State Data.</p>
      </div>

      ${section6}

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 7 — INDEMNIFICATION</h4>
        <p class="gw-doc-p gw-doc-clause${hl('indemnification')}" data-clause="indemnification">
          <span class="gw-doc-clause-num">7.1</span> <strong>Mutual Indemnification.</strong> Each party shall defend, indemnify, and hold harmless the other party and its officers, employees, and agents from third-party claims arising from the indemnifying party's negligence, willful misconduct, or breach of this Agreement, subject to Section 6.
          ${legal('indemnification')}
        </p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">7.2</span> <strong>Provider IP Claims.</strong> Provider shall indemnify Agency against claims that Deliverables infringe U.S. intellectual property rights, except to the extent arising from Agency specifications or combinations with non-Provider materials.</p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">7.3</span> <strong>Agency Limitation.</strong> Agency shall not indemnify Provider for claims arising solely from Provider's acts, omissions, or failure to comply with applicable law, including data protection obligations.</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 8 — INSURANCE</h4>
        <p class="gw-doc-p gw-doc-clause${hl('insurance')}" data-clause="insurance">
          <span class="gw-doc-clause-num">8.1</span> Provider shall maintain, at its sole expense: (a) Commercial General Liability insurance of not less than $2,000,000 per occurrence; (b) Workers' Compensation as required by ${state} law; (c) Professional Liability / Technology E&amp;O of not less than $5,000,000 per claim; and (d) Cyber Liability of not less than $5,000,000 per occurrence.
          ${legal('insurance')}
        </p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">8.2</span> Provider shall furnish certificates of insurance naming the State of ${state} as additional insured and shall provide thirty (30) days' prior written notice of cancellation or material change.</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 9 — AUDIT AND RECORDS</h4>
        <p class="gw-doc-p gw-doc-clause${hl('audit_rights')}" data-clause="audit_rights">
          <span class="gw-doc-clause-num">9.1</span> Agency, the State Auditor, and DGS shall have the right to audit Provider's records relating to this Agreement upon reasonable notice during the term and for seven (7) years thereafter, per Government Code §8546 et seq.
          ${legal('audit_rights')}
        </p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">9.2</span> Provider shall retain all books, records, and supporting documentation in accordance with ${state} records retention requirements and shall produce records in response to lawful Public Records Act requests.</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 10 — INTELLECTUAL PROPERTY</h4>
        <p class="gw-doc-p gw-doc-clause${hl('ip_ownership')}" data-clause="ip_ownership">
          <span class="gw-doc-clause-num">10.1</span> <strong>Work Product.</strong> All Deliverables and work product created specifically for Agency under this Agreement shall be deemed "works made for hire" and owned exclusively by Agency. To the extent any work product does not qualify as work made for hire, Provider assigns all right, title, and interest to Agency.
        </p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">10.2</span> <strong>Pre-Existing IP.</strong> Provider retains ownership of pre-existing materials and grants Agency a perpetual, irrevocable, royalty-free license to use such materials as incorporated into Deliverables.</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 11 — PREVAILING WAGE</h4>
        <p class="gw-doc-p gw-doc-clause${hl('prevailing_wage')}" data-clause="prevailing_wage">
          <span class="gw-doc-clause-num">11.1</span> If services under any SOW are subject to ${state} Labor Code §1770, Provider shall pay not less than prevailing wage rates and shall maintain certified payroll records. Provider shall register with the Department of Industrial Relations as required.
        </p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 12 — ANTI-LOBBYING AND CONFLICT OF INTEREST</h4>
        <p class="gw-doc-p gw-doc-clause${hl('anti_lobbying')}" data-clause="anti_lobbying">
          <span class="gw-doc-clause-num">12.1</span> Provider certifies compliance with Public Contract Code §2010 and shall submit DGS Form STD 204 (Lobbying Disclosure) with its proposal. Provider shall disclose any actual or potential conflicts of interest.
        </p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 13 — GOVERNING LAW</h4>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">13.1</span> This Agreement shall be governed by the laws of the State of ${state}. Venue for any dispute shall lie in the state or federal courts located in ${state}.</p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">13.2</span> The parties shall attempt to resolve disputes through good-faith negotiation before initiating formal proceedings. Nothing herein limits Agency's rights under the ${state} Public Contract Code.</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">ARTICLE 14 — TERMINATION</h4>
        <p class="gw-doc-p gw-doc-clause${hl('termination')}" data-clause="termination">
          <span class="gw-doc-clause-num">14.1</span> <strong>Termination for Convenience.</strong> Agency may terminate this Agreement or any SOW for convenience upon thirty (30) days' written notice. Agency shall pay Provider for accepted Deliverables and non-cancelable commitments incurred prior to termination.
        </p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">14.2</span> <strong>Termination for Cause.</strong> Either party may terminate for material breach if the breach is not cured within thirty (30) days of written notice.</p>
      </div>

      <div class="gw-doc-exhibits">
        <p class="gw-doc-p"><strong>EXHIBITS</strong></p>
        <p class="gw-doc-p gw-doc-exhibit-line">Exhibit A — Statement of Work Template (DGS STD 213)</p>
        <p class="gw-doc-p gw-doc-exhibit-line">Exhibit B — SOW No. 1: Cloud Infrastructure Modernization (${doc.value})</p>
        <p class="gw-doc-p gw-doc-exhibit-line">Exhibit C — Service Level Agreement and Performance Credits</p>
        <p class="gw-doc-p gw-doc-exhibit-line">Exhibit D — Information Security Requirements (SAM 5305)</p>
        <p class="gw-doc-p gw-doc-exhibit-line">Exhibit E — DGS Form STD 204 (Lobbying Certification)</p>
      </div>

      <p class="gw-doc-p gw-doc-witness"><strong>IN WITNESS WHEREOF</strong>, the parties have executed this Agreement by their duly authorized representatives.</p>

      <div class="gw-doc-parties-block">
        <p class="gw-doc-meta-line"><strong>AGENCY:</strong> ${doc.agency}</p>
        <p class="gw-doc-meta-line"><strong>PROVIDER:</strong> ${doc.vendor}</p>
      </div>

      ${showSignatures ? `
        <div class="gw-doc-signatures">
          <div class="gw-doc-sig-block">
            <div class="gw-doc-sig-line">${executed ? '<span class="gw-sign-animation" style="display:inline">/s/ Authorized Agency Signer</span>' : ''}</div>
            <span>Agency Authorized Signer</span>
            <span class="gw-doc-sig-meta">${agencyShort}</span>
            ${sid === 'signature' && !executed ? '<span class="gw-doc-sig-pending">Awaiting DocuSign</span>' : ''}
          </div>
          <div class="gw-doc-sig-block">
            <div class="gw-doc-sig-line">${executed ? '<span class="gw-sign-animation" style="display:inline">/s/ ' + vendorShort + '</span>' : ''}</div>
            <span>${doc.vendor}</span>
            <span class="gw-doc-sig-meta">Provider</span>
          </div>
        </div>
      ` : ''}
    </div>`;
}

function gwBuildThirdPartyContract(doc, step, ctx, opts) {
  const { intakeOverlay, generateOverlay, executed, showSignatures, sid, hl, agencyShort, vendorShort, state } = opts;
  const liabilityCap = 'Provider\'s aggregate liability shall not exceed the fees paid in the twelve (12) months preceding the claim.';
  const liabilityVendor = 'Provider shall have unlimited liability for all claims arising under this Agreement.';

  const section7 = sid === 'negotiation' ? `
    <div class="gw-doc-article">
      <h4 class="gw-doc-article-title">7. LIMITATION OF LIABILITY</h4>
      <p class="gw-doc-p gw-doc-clause gw-doc-clause--redline" data-clause="limitation_liability">
        <span class="gw-doc-clause-num">7.1</span>
        <span class="gw-doc-redline-del">${liabilityVendor}</span>
        <span class="gw-doc-redline-add">${liabilityCap}</span>
        <span class="gw-doc-redline-note">← Vendor counter · Agency requesting playbook cap</span>
      </p>
    </div>` : `
    <div class="gw-doc-article">
      <h4 class="gw-doc-article-title">7. LIMITATION OF LIABILITY</h4>
      <p class="gw-doc-p gw-doc-clause${hl('limitation_liability')}" data-clause="limitation_liability">
        <span class="gw-doc-clause-num">7.1</span> ${liabilityCap}
      </p>
    </div>`;

  return `
    ${intakeOverlay}${generateOverlay}
    <div class="gw-doc-paper ${executed ? 'gw-doc-paper--executed' : ''}">
      ${executed ? '<div class="gw-doc-stamp">Fully Executed</div>' : ''}
      <div class="gw-doc-letterhead">
        <div class="gw-doc-letterhead-state">State of ${state}</div>
        <div class="gw-doc-letterhead-agency">${doc.agency}</div>
      </div>
      <h3 class="gw-doc-doc-title">SAAS SUBSCRIPTION AGREEMENT</h3>
      <p class="gw-doc-meta-line"><strong>Customer:</strong> ${agencyShort} &nbsp;·&nbsp; <strong>Provider:</strong> ${vendorShort}</p>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">1. SUBSCRIPTION SERVICES</h4>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">1.1</span> Provider grants Agency a non-exclusive subscription to access the analytics platform described in Order Form No. 1.</p>
        <p class="gw-doc-p gw-doc-clause${hl('value')}" data-clause="value"><span class="gw-doc-clause-num">1.2</span> <strong>Fees.</strong> Annual subscription fee: <strong>${doc.value}</strong>. ${doc.term}.</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">2. DATA PROTECTION</h4>
        <p class="gw-doc-p gw-doc-clause${hl('data_residency')}" data-clause="data_residency"><span class="gw-doc-clause-num">2.1</span> Provider shall process Agency data only in U.S. data centers and comply with ${state} Civil Code §1798.82 breach notification requirements.</p>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">2.2</span> Provider shall maintain SOC 2 Type II certification and make audit reports available upon request.</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">3. SERVICE LEVELS</h4>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">3.1</span> Provider guarantees 99.9% monthly uptime. Service credits apply for failures per Exhibit A.</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">4. INDEMNIFICATION</h4>
        <p class="gw-doc-p gw-doc-clause${hl('indemnification')}" data-clause="indemnification"><span class="gw-doc-clause-num">4.1</span> Provider shall indemnify Agency against third-party IP infringement claims relating to the subscription service.</p>
      </div>

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">5. INSURANCE</h4>
        <p class="gw-doc-p gw-doc-clause${hl('insurance')}" data-clause="insurance"><span class="gw-doc-clause-num">5.1</span> Provider shall maintain CGL ($2M), cyber liability ($5M), and professional liability ($3M) coverage.</p>
      </div>

      ${section7}

      <div class="gw-doc-article">
        <h4 class="gw-doc-article-title">8. GOVERNING LAW &amp; RENEWAL</h4>
        <p class="gw-doc-p"><span class="gw-doc-clause-num">8.1</span> Governed by ${state} law. Auto-renews annually unless either party gives ninety (90) days' notice before term end.</p>
      </div>

      ${showSignatures ? `
        <div class="gw-doc-signatures">
          <div class="gw-doc-sig-block"><div class="gw-doc-sig-line"></div><span>Agency Signer</span></div>
          <div class="gw-doc-sig-block"><div class="gw-doc-sig-line"></div><span>${vendorShort}</span></div>
        </div>` : ''}
    </div>`;
}

function gwRenderDocument(step) {
  const doc = gwGetScenario().document;
  const ctx = GW_DATA.context || {};
  const sid = step.id;

  const versions = {
    initiate: 'Intake form', generate: 'Draft v0.1 — generating',
    ai_scorecard: 'Draft v0.2', contracts_review: 'Draft v0.3',
    legal_review: 'Draft v0.4', external_review: 'Draft v0.5 — vendor review',
    negotiation: 'Draft v0.6 — redlined', executive_approval: 'Draft v0.7 — approved',
    signature: 'Final v1.0', post_execution: 'Executed v1.0',
  };
  const statuses = {
    initiate: 'Intake', generate: 'Generating', ai_scorecard: 'AI Review',
    contracts_review: 'Contracts Review', legal_review: 'Legal Review',
    external_review: 'Vendor Review', negotiation: 'In Negotiation',
    executive_approval: 'Executive Review', signature: 'Ready to Sign',
    post_execution: 'Executed',
  };

  document.getElementById('gw-doc-version').textContent = versions[sid] || 'Draft';
  document.getElementById('gw-doc-status').textContent = statuses[sid] || 'In Progress';
  document.getElementById('gw-doc-status').className = 'gw-doc-status gw-doc-status--' + sid;

  const page = document.getElementById('gw-doc-page');
  page.innerHTML = gwBuildContractHtml(doc, step, ctx);
  page.className = 'gw-doc-page gw-doc-page--' + sid;

  const hint = document.getElementById('gw-doc-flow-hint');
  const flowHint = step.flow_hint || 'forward';
  if (flowHint === 'loop_back') {
    hint.style.display = 'flex';
    hint.className = 'gw-doc-flow-hint gw-doc-flow-hint--back';
    hint.innerHTML = '<span class="gw-doc-flow-arrow">←</span> Sent back to vendor — redlines on Article 6 Liability';
  } else if (flowHint === 'forward_after_loop') {
    hint.style.display = 'flex';
    hint.className = 'gw-doc-flow-hint gw-doc-flow-hint--forward';
    hint.innerHTML = '<span class="gw-doc-flow-arrow">→</span> Negotiation resolved — document advances';
  } else {
    hint.style.display = 'none';
  }

  const meta = document.getElementById('gw-doc-meta');
  const reqId = 'REQ-2026-' + (4200 + (step.order || 1));
  meta.innerHTML = `
    <span>${reqId}</span>
    <span>${doc.solicitation}</span>
    <span>${doc.template.split('—')[0].trim()}</span>`;
}

/* ── Value callout ─────────────────────────────────────────────────────────── */

function gwRenderValueCallout(step) {
  const sc = gwStateCtx();
  let v = GW_VALUE[step.id] || {
    headline: step.title,
    text: step.description,
    audience: 'Agency stakeholders',
  };
  if (step.id === 'legal_review') {
    v = {
      headline: `${sc.state} legal review with playbook-backed routing`,
      text: `${sc.legalShort} reviews flagged clauses against ${sc.state} Standard Terms and DGS STD 213, then assigns the next approver — Contracts Final or Vendor Review — without breaking audit trail.`,
      audience: 'General Counsel · ' + sc.proc + ' · Legal ops',
    };
  }
  document.getElementById('gw-value-headline').textContent = v.headline;
  document.getElementById('gw-value-text').textContent = v.text;
  document.getElementById('gw-value-audience').textContent = v.audience;
}

/* ── Tasks & notifications panel ───────────────────────────────────────────── */

function gwRenderTasksPanel(step, persona) {
  const doc = gwGetScenario().document;
  const reqId = 'REQ-2026-' + (4200 + (step.order || 1));
  const sid = step.id;
  const personaName = persona.name || step.persona;

  const allTasks = gwGetTasksData(step, persona, doc, reqId);
  const activeTasks = allTasks.filter(t => t.active);
  const notifications = allTasks.filter(t => t.notif);
  const outstanding = allTasks.filter(t => !t.notif && !t.done);
  const dueWeek = allTasks.filter(t => t.dueWeek);

  document.getElementById('gw-tasks-count').textContent = String(notifications.length + outstanding.length);

  document.getElementById('gw-tasks-notifications').innerHTML = notifications.length
    ? notifications.map(n => `
      <div class="gw-task-notif gw-task-notif--${n.urgency || 'new'}">
        <span class="gw-task-notif-icon">${n.icon || '•'}</span>
        <div><strong>${n.title}</strong><span>${n.detail}</span></div>
      </div>`).join('')
    : '<div class="gw-task-notif"><span>No new notifications</span></div>';

  document.getElementById('gw-tasks-list').innerHTML = outstanding.map(t => `
    <div class="gw-task-item ${t.active ? 'gw-task-item--active' : ''} ${t.overdue ? 'gw-task-item--overdue' : t.soon ? 'gw-task-item--soon' : ''}">
      <span class="gw-task-check"></span>
      <div class="gw-task-item-body">
        <span class="gw-task-item-title">${t.title}</span>
        <span class="gw-task-item-meta">${t.assignee} · ${reqId}</span>
      </div>
      <span class="gw-task-due gw-task-due--${t.dueClass || 'default'}">${t.due}</span>
    </div>`).join('');

  document.getElementById('gw-tasks-due').innerHTML = dueWeek.length
    ? dueWeek.map(t => `
      <div class="gw-task-item ${t.overdue ? 'gw-task-item--overdue' : 'gw-task-item--soon'}">
        <span class="gw-task-check"></span>
        <div class="gw-task-item-body">
          <span class="gw-task-item-title">${t.title}</span>
          <span class="gw-task-item-meta">${t.assignee}</span>
        </div>
        <span class="gw-task-due gw-task-due--${t.dueClass}">${t.due}</span>
      </div>`).join('')
    : '<div class="gw-task-item"><span class="gw-task-item-body"><span class="gw-task-item-title">No tasks due this week</span></span></div>';
}

function gwGetTasksData(step, persona, doc, reqId) {
  const sid = step.id;
  const pn = persona.name || 'Assignee';
  const sc = gwStateCtx();
  const base = [
    { notif: true, icon: '📋', title: 'New request in queue', detail: `${doc.type.split('(')[0].trim()} · ${doc.value}`, urgency: sid === 'initiate' || sid === 'intake' ? 'new' : '' },
  ];

  const byStep = {
    initiate: [
      { title: 'Complete intake form', assignee: pn, due: 'Today', dueClass: 'soon', active: true, soon: true, dueWeek: true },
      { title: 'Attach SOW & budget approval', assignee: 'Program manager', due: 'Jun 20', dueClass: 'soon', soon: true, dueWeek: true },
    ],
    intake: [
      { title: 'Validate vendor registration', assignee: 'Procurement', due: 'Today', dueClass: 'soon', active: true, soon: true, dueWeek: true },
      { title: 'Classify document type', assignee: 'CLM (auto)', due: 'Done', dueClass: 'done', done: true },
    ],
    generate: [
      { notif: true, icon: '⚡', title: 'Document generated', detail: 'Template merged with ERP data', urgency: 'new' },
      { title: 'Review generated draft', assignee: pn, due: 'Today', dueClass: 'soon', active: true, soon: true, dueWeek: true },
    ],
    ai_scorecard: [
      { notif: true, icon: '✦', title: 'Iris flagged 2 clauses', detail: 'Article 6 Liability · Article 7 Insurance', urgency: 'urgent' },
      { title: 'Review AI scorecard', assignee: pn, due: 'Today', dueClass: 'soon', active: true, soon: true, dueWeek: true },
    ],
    contracts_review: [
      { title: 'Contracts playbook review', assignee: pn, due: 'Jun 19', dueClass: 'soon', active: true, soon: true, dueWeek: true },
      { title: 'Confirm executive routing', assignee: 'CLM (auto)', due: 'Queued', dueClass: 'default' },
    ],
    legal_review: [
      { notif: true, icon: '⚖', title: 'Legal review assigned', detail: `${sc.legalShort} · ${sc.state} playbook`, urgency: 'new' },
      { title: 'Review Art. 6 liability cap', assignee: pn, due: 'Today', dueClass: 'soon', active: true, soon: true, dueWeek: true },
      { title: 'Route to Vendor Review', assignee: pn, due: 'Today', dueClass: 'soon', soon: true, dueWeek: true },
      { title: 'Verify Gov Code §927.8 insurance', assignee: pn, due: 'Jun 19', dueClass: 'soon', soon: true, dueWeek: true },
    ],
    external_review: [
      { notif: true, icon: '👥', title: 'Vendor invited to Workspace', detail: doc.vendor, urgency: 'new' },
      { title: 'Await vendor comments', assignee: doc.vendor, due: 'Jun 22', dueClass: 'default', dueWeek: true },
    ],
    negotiation: [
      { notif: true, icon: '↩', title: 'Negotiation round 2', detail: 'Vendor counter on Article 6 Liability', urgency: 'urgent' },
      { title: 'Accept or reject redlines', assignee: pn, due: 'Today', dueClass: 'overdue', active: true, overdue: true, dueWeek: true },
    ],
    executive_approval: [
      { notif: true, icon: '★', title: 'Executive approval required', detail: `${doc.value} exceeds threshold`, urgency: 'urgent' },
      { title: 'Director review & approve', assignee: pn, due: 'Today', dueClass: 'soon', active: true, soon: true, dueWeek: true },
    ],
    signature: [
      { notif: true, icon: '✍', title: 'Ready for signature', detail: 'Envelope prepared in eSignature', urgency: 'new' },
      { title: 'Agency signature', assignee: pn, due: 'Jun 20', dueClass: 'soon', active: true, soon: true, dueWeek: true },
      { title: 'Vendor signature', assignee: doc.vendor, due: 'Jun 21', dueClass: 'default', dueWeek: true },
    ],
    post_execution: [
      { notif: true, icon: '✓', title: 'Contract executed', detail: 'Synced to Agreement Manager & ERP', urgency: 'new' },
      { title: 'Insurance cert renewal', assignee: 'Contract admin', due: 'Jul 2027', dueClass: 'default' },
      { title: 'Quarterly SLA report', assignee: doc.vendor, due: 'Sep 2026', dueClass: 'soon', dueWeek: true },
    ],
  };

  const stepTasks = byStep[sid] || byStep.contracts_review || [];
  return [...base, ...stepTasks];
}


function gwRenderReporting() {
  const doc = gwGetScenario().document;
  const ctx = GW_DATA.context || {};
  const erp = (ctx.erp || 'ERP').split('(')[0].trim();
  const isThirdParty = gwCurrentScenario === 'third_party';
  const step = gwGetScenario().steps[gwCurrentStep];
  const executed = step && step.id === 'post_execution';
  const sid = step ? step.id : '';
  const reqId = 'REQ-2026-' + (4200 + ((step && step.order) || 1));

  document.getElementById('gw-reporting-live').textContent = executed ? 'Synced to Agreement Manager' : 'Live preview';
  document.getElementById('gw-reporting-live').className = 'gw-reporting-live' + (executed ? ' gw-reporting-live--active' : '');
  document.getElementById('gw-reporting-sub').textContent = executed
    ? 'Contract metadata, obligations, and renewal dates synced from IAM Platform to Agreement Manager'
    : 'Obligations and dates populate as the contract moves through CLM — full sync after execution';

  const renewals = isThirdParty ? [
    { label: doc.vendor, date: 'Jun 2029', note: 'Auto-renew · 90-day notice window opens Mar 2029', urgency: 'future' },
    { label: 'Annual subscription tier', date: 'Jun 2027', note: 'Price adjustment review per §9', urgency: 'medium' },
  ] : [
    { label: doc.type.split('+')[0].trim(), date: 'Jun 2029', note: 'Option year 2 · DGS extension review', urgency: 'future' },
    { label: 'SOW performance period', date: 'Jun 2028', note: 'Mid-term SLA assessment', urgency: 'medium' },
  ];

  const expirations = [
    { label: 'Base term ends', date: isThirdParty ? 'Jun 2028' : 'Jun 2027', note: doc.term, urgency: 'medium' },
    { label: 'Maximum term (with options)', date: 'Jun 2029', note: 'Final expiration if all options exercised', urgency: 'low' },
  ];

  const obligations = [
    { label: 'Certificate of insurance', date: 'Jul 2027', note: 'Annual renewal · Article 7', status: executed ? 'tracked' : 'pending' },
    { label: 'Data security attestation', date: 'Dec 2026', note: 'SOC 2 report due · §5', status: executed ? 'tracked' : 'pending' },
    { label: 'Quarterly SLA report', date: 'Sep 2026', note: 'Provider deliverable · SOW §3', status: 'pending' },
    { label: erp + ' encumbrance sync', date: executed ? 'Today' : 'On execution', note: 'Budget line committed post-signature', status: executed ? 'done' : 'pending' },
  ];

  const outstandingTasks = [
    { label: sid === 'post_execution' ? 'Insurance cert renewal' : 'Review assigned contract', date: sid === 'post_execution' ? 'Jul 2027' : 'Today', note: `${doc.vendor} · ${reqId}`, urgency: sid === 'negotiation' ? 'medium' : 'medium' },
    { label: 'Legal hub routing', date: sid === 'legal_review' ? 'Overdue' : 'Jun 22', note: 'Assign next approver if pending', urgency: sid === 'legal_review' ? 'medium' : 'low' },
    { label: 'Executive approval packet', date: parseInt((doc.value || '').replace(/\D/g, '')) >= (GW_DATA.executive_threshold || 1000000) ? 'Required' : 'N/A', note: 'Auto-queued above threshold', urgency: 'low' },
  ].filter(t => t.date !== 'N/A');

  function renderItems(items, elId) {
    document.getElementById(elId).innerHTML = items.map(it => `
      <div class="gw-report-row gw-report-row--${it.urgency || it.status || 'default'}">
        <div class="gw-report-row-main">
          <span class="gw-report-row-label">${it.label}</span>
          <span class="gw-report-row-note">${it.note}</span>
        </div>
        <span class="gw-report-row-date">${it.date}</span>
      </div>`).join('');
  }

  renderItems(outstandingTasks, 'gw-report-tasks');

  renderItems(renewals, 'gw-report-renewals');
  renderItems(expirations, 'gw-report-expirations');
  renderItems(obligations, 'gw-report-obligations');

  document.getElementById('gw-reporting-section').classList.toggle('gw-reporting-section--executed', executed);
}

/* ── CLM / Agreement Desk mock ─────────────────────────────────────────────── */

function gwRenderClmMock(step, persona, root) {
  const scope = root || document;
  const el = (id) => scope.querySelector('#' + id) || document.getElementById(id);
  const doc = gwGetScenario().document;
  const ctx = GW_DATA.context || {};
  const erp = (ctx.erp || 'ERP').split('(')[0].trim();
  const screen = step.clm_screen || 'agreement_desk';
  const reqId = 'REQ-2026-' + (4200 + (step.order || 1));
  const sid = step.id;

  const productLabels = {
    initiate: 'Agreement Desk', generate: 'CLM · Document Builder',
    ai_scorecard: 'CLM · Iris Review', contracts_review: 'CLM · Approvals',
    legal_review: 'IAM · Legal Review', external_review: 'CLM · Workspace',
    negotiation: 'CLM · Redline', executive_approval: 'CLM · Executive',
    signature: 'IAM · eSignature', post_execution: 'IAM · Agreement Manager',
  };
  el('clm-mock-product-label').textContent = productLabels[sid] || 'IAM Platform';

  el('clm-mock-bc').textContent =
    sid === 'post_execution' ? `Agreement Manager › ${doc.vendor}` :
    sid === 'signature' ? `eSignature › ${reqId}` :
    `Agreement Desk › ${reqId} › ${step.title}`;

  el('clm-mock-status').textContent =
    sid === 'signature' ? 'Ready to Sign' :
    sid === 'post_execution' ? 'Executed' :
    sid === 'negotiation' ? 'In Negotiation' :
    sid === 'initiate' ? 'New Request' : 'In Review';

  el('clm-mock-persona').innerHTML = `
    <span class="clm-mock-avatar">${persona.icon || '?'}</span>
    <div>
      <div class="clm-mock-persona-name">${persona.name || step.persona}</div>
      <div class="clm-mock-persona-role">${persona.title || ''}</div>
    </div>
    <span class="clm-mock-acting">Active now</span>`;

  const mockRoot = scope.querySelector('.clm-mock--embedded') || scope.querySelector('.clm-mock');
  if (mockRoot) mockRoot.classList.toggle('clm-mock--legal-review', sid === 'legal_review');

  if (sid === 'legal_review') {
    const sc = gwStateCtx();
    el('clm-mock-bc').textContent = `State of ${sc.state} › Legal Review › ${reqId}`;
    el('clm-mock-status').textContent = 'Awaiting route';
  }

  const banner = el('clm-flow-banner');
  const hint = step.flow_hint || 'forward';
  if (hint === 'loop_back') {
    banner.style.display = 'flex';
    banner.className = 'clm-flow-banner clm-flow-banner--back';
    banner.innerHTML = '<span class="clm-flow-arrow-icon">←</span> Returned for counter-redlines on Article 6';
  } else if (hint === 'forward_after_loop') {
    banner.style.display = 'flex';
    banner.className = 'clm-flow-banner clm-flow-banner--forward';
    banner.innerHTML = '<span class="clm-flow-arrow-icon">→</span> Redlines accepted — advancing workflow';
  } else {
    banner.style.display = 'none';
  }

  const bodies = {
    agreement_desk: `
      <div class="clm-screen-title">Agreement Desk — Intake queue</div>
      <div class="clm-desk-layout">
        <div class="clm-desk-sidebar">
          <div class="clm-desk-nav active">My queue <span>3</span></div>
          <div class="clm-desk-nav">Team requests</div>
          <div class="clm-desk-nav">All open</div>
        </div>
        <div class="clm-desk-main">
          <table class="clm-desk-table">
            <thead><tr><th>Request</th><th>Type</th><th>Agency</th><th>Status</th></tr></thead>
            <tbody>
              <tr class="clm-desk-row active"><td><span class="clm-desk-id">${reqId}</span></td><td>${doc.type.split('(')[0].trim()}</td><td>${doc.agency.split('(')[0].trim()}</td><td><span class="clm-pill clm-pill--new">New</span></td></tr>
              <tr class="clm-desk-row"><td>REQ-2026-4198</td><td>SOW Amendment</td><td>Procurement</td><td><span class="clm-pill">Review</span></td></tr>
              <tr class="clm-desk-row"><td>REQ-2026-4187</td><td>NDA</td><td>Legal</td><td><span class="clm-pill">Sign</span></td></tr>
            </tbody>
          </table>
          <div class="clm-desk-detail">
            <div class="clm-field"><label>Vendor</label><span>${doc.vendor}</span></div>
            <div class="clm-field"><label>Value</label><span>${doc.value}</span></div>
            <div class="clm-field"><label>Source</label><span>${erp} pre-fill</span></div>
          </div>
          <button class="clm-btn-primary clm-btn-compact">Open request →</button>
        </div>
      </div>`,
    document_builder: `
      <div class="clm-screen-title">Generate from template</div>
      <div class="clm-gen-preview">
        <div class="clm-gen-doc-thumb"><div class="clm-gen-doc-lines"></div><span>${doc.template.split('—')[0].trim()}</span></div>
        <div class="clm-gen-fields">
          <div class="clm-panel-label">Fields merging from ${erp}</div>
          <div class="clm-kv clm-kv--anim"><span>Vendor</span><strong>${doc.vendor}</strong></div>
          <div class="clm-kv clm-kv--anim"><span>Amount</span><strong>${doc.value}</strong></div>
          <div class="clm-kv"><span>Term</span><strong>${doc.term.split('+')[0].trim()}</strong></div>
          <div class="clm-checklist"><div class="clm-check done">✓ Mandatory clauses inserted</div><div class="clm-check done">✓ SOW schedule attached</div><div class="clm-check done">✓ Ethics certification block</div></div>
        </div>
      </div>`,
    iris_review: `
      <div class="clm-screen-title">Iris AI-assisted review</div>
      <div class="clm-iris-layout">
        <div class="clm-iris-doc">
          <div class="clm-iris-doc-line">§5 Data residency — <em>matches playbook</em></div>
          <div class="clm-iris-doc-line clm-iris-doc-line--flag">Art. 6 Liability — <strong>deviation detected</strong></div>
          <div class="clm-iris-doc-line">Article 7 Insurance — <em>matches playbook</em></div>
        </div>
        <div class="clm-iris-panel">
          <div class="clm-iris-score">${(gwGetScorecard() || {}).overall_score || 88}<span>/100</span></div>
          <div class="clm-iris-label">Playbook match</div>
          <div class="clm-flag clm-flag--warn">⚠ Article 6 Liability cap deviation</div>
          <div class="clm-flag clm-flag--ok">✓ §5 Data residency OK</div>
          <button class="clm-btn-sm">Apply suggested redline to Article 6</button>
        </div>
      </div>`,
    approval_queue: `
      <div class="clm-screen-title">Approval routing</div>
      <div class="clm-approval-chain">
        <div class="clm-approval-node done"><span>1</span> Contracts</div>
        <div class="clm-approval-arrow">→</div>
        <div class="clm-approval-node active"><span>2</span> Legal</div>
        <div class="clm-approval-arrow">→</div>
        <div class="clm-approval-node"><span>3</span> Vendor</div>
        <div class="clm-approval-arrow">→</div>
        <div class="clm-approval-node exec"><span>★</span> Executive</div>
      </div>
      <div class="clm-rule-alert">Auto: ${doc.value} exceeds $${(GW_DATA.executive_threshold || 1000000).toLocaleString()} — executive step queued after legal</div>`,
    legal_hub: (() => {
      const sc = gwStateCtx();
      const req = 'REQ-2026-' + (4200 + (step.order || 1));
      return `
      <div class="iam-legal-review">
        <div class="iam-legal-header">
          <div class="iam-legal-header-left">
            <span class="iam-legal-kicker">IAM Platform · Legal Review</span>
            <strong>${req} · ${doc.type.split('(')[0].trim()}</strong>
            <span class="iam-legal-sub">${doc.agency.split('(')[0].trim()} ↔ ${doc.vendor.split(',')[0].trim()}</span>
          </div>
          <div class="iam-legal-header-actions">
            <button type="button" class="clm-btn-sm clm-btn-ghost">Save review notes</button>
            <button type="button" class="clm-btn-sm">Approve &amp; route →</button>
          </div>
        </div>
        <div class="iam-legal-split">
          <div class="iam-legal-doc-pane">
            <div class="iam-legal-doc-label">Contract document · Draft v0.4</div>
            <div class="iam-legal-doc-scroll">
              ${typeof gwWrapWordShell === 'function' && typeof gwBuildContractHtml === 'function'
                ? gwWrapWordShell(doc, step, ctx, gwBuildContractHtml(doc, step, ctx), { version: 'Draft v0.4 — Legal Review', pageHint: 'Articles 5–9 · legal comments visible' })
                : '<p>Document preview</p>'}
            </div>
          </div>
          <div class="iam-legal-side">
            <div class="iam-legal-playbook">
              <div class="iam-legal-side-title">${sc.state} playbook</div>
              <div class="iam-legal-playbook-ref">DGS STD 213 · ${sc.proc} Standard Terms</div>
              <div class="iam-legal-clause-list">
                <div class="iam-legal-clause iam-legal-clause--warn">
                  <span class="iam-legal-clause-ref">Art. 6.1 Liability cap</span>
                  <span class="iam-legal-clause-status">Review</span>
                  <p>Iris flagged deviation — confirm 12-mo fee cap &amp; carve-outs</p>
                </div>
                <div class="iam-legal-clause iam-legal-clause--ok">
                  <span class="iam-legal-clause-ref">Art. 7 Indemnification</span>
                  <span class="iam-legal-clause-status">OK</span>
                  <p>Mutual indemnification matches ${sc.state} standard language</p>
                </div>
                <div class="iam-legal-clause iam-legal-clause--ok">
                  <span class="iam-legal-clause-ref">Art. 8 Insurance</span>
                  <span class="iam-legal-clause-status">OK</span>
                  <p>Gov Code §927.8 minimums cited · COI required pre-signature</p>
                </div>
                <div class="iam-legal-clause iam-legal-clause--ok">
                  <span class="iam-legal-clause-ref">Art. 9 Audit / CPRA</span>
                  <span class="iam-legal-clause-status">OK</span>
                  <p>State Auditor access · 7-year retention · public records</p>
                </div>
              </div>
            </div>
            <div class="iam-legal-routing">
              <div class="iam-legal-side-title">Assign next approver</div>
              <p class="iam-legal-routing-desc">Hub-and-spoke routing — ${persona.name || 'Counsel'} selects the next step in the workflow.</p>
              <div class="iam-legal-route-chain">
                <div class="iam-legal-route-node done"><span>✓</span> Contracts</div>
                <div class="iam-legal-route-arrow">→</div>
                <div class="iam-legal-route-node active"><span>⚖</span> Legal <small>You</small></div>
                <div class="iam-legal-route-arrow">→</div>
                <div class="iam-legal-route-node suggested"><span>→</span> Vendor Review <small>Suggested</small></div>
                <div class="iam-legal-route-arrow">→</div>
                <div class="iam-legal-route-node"><span>✍</span> Signature</div>
              </div>
              <div class="clm-assign-row iam-legal-assign">
                <label>Route to</label>
                <select class="clm-select"><option selected>Vendor Review (external) — suggested</option><option>Contracts Final Approval</option><option>Return to Contracts</option></select>
                <button type="button" class="clm-btn-sm">Route</button>
              </div>
              ${doc.value.includes('2,400') || doc.value.includes('2400') ? `<div class="clm-rule-alert iam-legal-threshold">Auto: ${doc.value} exceeds $${(GW_DATA.executive_threshold || 1000000).toLocaleString()} — executive approval queued after vendor review</div>` : ''}
            </div>
          </div>
        </div>
      </div>`;
    })(),
    workspace: `
      <div class="clm-screen-title">Workspace — external review</div>
      <div class="clm-workspace">
        <div class="clm-ws-doc">
          <div class="clm-ws-doc-title">${doc.template || doc.type}</div>
          <div class="clm-ws-highlight">Article 6 Liability — vendor comment</div>
        </div>
        <div class="clm-ws-comments">
          <div class="clm-comment"><strong>${doc.vendor}</strong> Proposed unlimited liability in Article 6 <span>2h ago</span></div>
          <div class="clm-comment clm-comment--agency"><strong>${persona.name}</strong> Reviewing counter-proposal <span>Now</span></div>
        </div>
      </div>`,
    redline_compare: `
      <div class="clm-screen-title">Redline compare — linked to document Article 6</div>
      <div class="clm-redline-inline">
        <div class="clm-redline-clause"><span class="clm-redline-clause-ref">Article 6.1 — Cap on Liability</span></div>
        <div class="clm-redline-wrap">
          <div class="clm-redline-col"><div class="clm-redline-h">Agency playbook</div><div class="clm-redline-text">Liability capped at 12 mo fees</div></div>
          <div class="clm-redline-mid"><div class="clm-loop-visual"><span class="clm-loop-arrow">↩</span><span>Loop</span><span class="clm-loop-arrow">→</span></div></div>
          <div class="clm-redline-col"><div class="clm-redline-h">Vendor v0.6</div><div class="clm-redline-text del">Unlimited liability</div><div class="clm-redline-text add">Cap at 12 mo fees</div></div>
        </div>
      </div>
      <div class="clm-redline-actions"><button class="clm-btn-sm">Accept change</button><button class="clm-btn-sm clm-btn-ghost">Reject → loop back</button></div>`,
    executive_approval: `
      <div class="clm-screen-title">Executive approval</div>
      <div class="clm-exec-card">
        <div class="clm-exec-badge">Automatic routing triggered</div>
        <div class="clm-exec-val">${doc.value}</div>
        <div class="clm-exec-threshold">Threshold ≥ $${(GW_DATA.executive_threshold || 1000000).toLocaleString()}</div>
        <div class="clm-exec-signer">${persona.name || 'Director'} · Authorized signer</div>
        <button class="clm-btn-primary">Review summary &amp; approve</button>
      </div>`,
    esign_handoff: `
      <div class="clm-screen-title">Send for signature — eSignature</div>
      <div class="clm-esign">
        <div class="clm-esign-recipient"><span>A</span> ${persona.name || 'Agency Signer'} · Agency</div>
        <div class="clm-esign-recipient"><span>V</span> ${doc.vendor} · Vendor</div>
        <div class="clm-esign-status">Envelope prepared · signature blocks placed on final v1.0</div>
        <button class="clm-btn-primary">Send with DocuSign</button>
      </div>`,
    obligations_erp: `
      <div class="clm-screen-title">Post-execution — Agreement Manager sync</div>
      <div class="clm-navigator-sync">
        <div class="clm-sync-row"><span>Contract recorded in Agreement Manager</span><span class="clm-pill clm-pill--ok">Done</span></div>
        <div class="clm-sync-row"><span>Obligations extracted (4)</span><span class="clm-pill clm-pill--ok">Done</span></div>
        <div class="clm-sync-row"><span>Renewal date: Jun 2029</span><span class="clm-pill">Tracked</span></div>
        <div class="clm-sync-row clm-sync-row--erp"><span>↗ ${erp} encumbrance committed</span><span class="clm-pill clm-pill--ok">Synced</span></div>
      </div>`,
  };

  el('clm-mock-body').innerHTML = bodies[screen] || bodies.agreement_desk;

  const rulesEl = el('clm-mock-rules');
  const rules = step.business_rules || [];
  rulesEl.innerHTML = sid === 'legal_review' ? '' : (rules.length ? rules.map(r => `
    <div class="clm-rule ${r.auto ? 'clm-rule--auto' : 'clm-rule--manual'}">
      <span class="clm-rule-type">${r.auto ? 'Auto' : 'Manual'}</span>
      <div><strong>${r.label}</strong><span>${r.detail}</span></div>
    </div>`).join('') : '');
}

function gwRenderDiagram() {
  const steps = gwGetScenario().steps;
  const wrap = document.getElementById('gw-diagram');
  wrap.innerHTML = steps.map((s, i) => {
    const persona = GW_DATA.personas[s.persona] || {};
    const state = i < gwCurrentStep ? 'done' : i === gwCurrentStep ? 'active' : '';
    const productClass = gwProductBadgeClass(s.product);
    const loopMark = s.flow_hint === 'loop_back' ? '<span class="gw-rail-loop">↩</span>' : '';
    const icons = {
      initiate: '📥', generate: '📝', ai_scorecard: '✦', contracts_review: '📋',
      legal_review: '⚖', external_review: '👥', negotiation: '↔',
      executive_approval: '★', signature: '✍', post_execution: '✓',
    };
    return `
      <button type="button" class="gw-rail-step ${state}" data-step="${i}" onclick="gwGoToStep(${i})" title="${s.title}">
        ${loopMark}
        <span class="gw-rail-icon">${icons[s.id] || s.order}</span>
        <span class="gw-rail-num">${s.order}</span>
        <span class="gw-rail-title">${s.title}</span>
        <span class="gw-rail-persona">${persona.name || s.persona}</span>
        <span class="gw-flow-product gw-flow-product--${productClass}">${s.product}</span>
      </button>
      ${i < steps.length - 1 ? `<span class="gw-rail-connector ${i < gwCurrentStep ? 'done' : ''}"></span>` : ''}`;
  }).join('');
}

function gwRenderStep() {
  const steps = gwGetScenario().steps;
  const step = steps[gwCurrentStep];
  if (!step) return;

  const persona = GW_DATA.personas[step.persona] || {};
  const total = steps.length;
  const sc = gwStateCtx();

  document.getElementById('gw-step-title').textContent = step.title;
  document.getElementById('gw-step-product').textContent = step.product;
  document.getElementById('gw-step-product').className = 'gw-product-badge gw-product-badge--' + gwProductBadgeClass(step.product);

  document.getElementById('gw-persona-row').innerHTML = `
    <div class="gw-persona-chip gw-persona-chip--${persona.color || 'muted'}">
      <span class="gw-persona-avatar">${persona.icon || '?'}</span>
      <div>
        <div class="gw-persona-name">${persona.name || step.persona}</div>
        <div class="gw-persona-title">${persona.title || ''} · ${persona.dept || ''}</div>
      </div>
    </div>`;

  document.getElementById('gw-step-desc').textContent = step.description;
  document.getElementById('gw-narrative-summary').textContent =
    step.id === 'legal_review'
      ? `${sc.legalShort} reviews Articles 5–9 against the ${sc.state} playbook — liability cap, indemnification, insurance (Gov Code §927.8), audit rights, and CPRA data terms — then routes to the next approver.`
      : (GW_PLAIN[step.id] || step.description);

  document.getElementById('gw-step-actions').innerHTML = (step.actions || [])
    .map(a => `<li>${a}</li>`).join('');

  gwRenderValueCallout(step);
  if (typeof GW_STEP_DEFAULT_VIEW !== 'undefined') {
    gwActiveVisualView = GW_STEP_DEFAULT_VIEW[step.id] || 'clm';
  }
  if (typeof gwRenderVisualHero === 'function') gwRenderVisualHero(step, persona);

  const apiEl = document.getElementById('gw-step-api');
  if (step.api) {
    apiEl.style.display = 'block';
    apiEl.innerHTML = `
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:6px">API Call</div>
      <div class="code-block" style="font-size:10px">${step.api.method} ${step.api.path}\n// ${step.api.desc}</div>`;
  } else {
    apiEl.style.display = 'none';
  }

  document.querySelectorAll('.gw-clause-item').forEach(el => {
    el.classList.toggle('highlighted', (step.clauses_highlighted || []).includes(el.dataset.clauseId));
  });

  const scorecardEl = document.getElementById('gw-scorecard-card');
  if (scorecardEl) {
    if (step.ai_review) {
      scorecardEl.open = true;
      gwRenderScorecard();
    } else {
      scorecardEl.open = false;
    }
  }

  gwLastStep = gwCurrentStep;

  document.getElementById('gw-step-counter').textContent = `Step ${gwCurrentStep + 1} of ${total}`;
  document.getElementById('gw-progress-bar').style.width = `${((gwCurrentStep + 1) / total) * 100}%`;

  document.getElementById('gw-btn-prev').disabled = gwCurrentStep === 0;
  document.getElementById('gw-btn-next').disabled = gwCurrentStep >= total - 1;

  gwRenderDiagram();

  const hero = document.getElementById('gw-visual-hero');
  if (hero) {
    hero.classList.remove('gw-visual-hero--pulse');
    void hero.offsetWidth;
    hero.classList.add('gw-visual-hero--pulse');
  }
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
  document.getElementById('gw-btn-play').textContent = '▶ Play walkthrough';
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
            <span class="gw-product-badge gw-product-badge--iam">IAM</span>
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
            <span class="gw-product-badge gw-product-badge--both">IAM Platform</span>
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
  const productClass = gwProductBadgeClass(step.product);
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
  window.gwBuildContractHtml = gwBuildContractHtml;
  window.gwWrapWordShell = gwWrapWordShell;
  window.gwStateCtx = gwStateCtx;
  window.gwGetTasksData = gwGetTasksData;
  window.gwGetScenario = gwGetScenario;
  gwSelectScenario('first_party');
});
