/* Business View — simple, visual storyboards for non-technical stakeholders */

const GW_BIZ_DEFAULT = {
  emoji: '📋',
  scene: 'People work together on an agreement.',
  who: 'Your agency team',
  what: 'DocuSign IAM keeps everyone on the same page and tracks every step.',
  why: 'Less confusion, faster deals, clear audit trail.',
  color: '#7B5CFA',
};

const GW_BIZ_STEPS = {
  initiate: {
    emoji: '📝', scene: 'A manager taps “New contract request.”', color: '#6366F1',
    who: 'Program manager or business owner',
    what: 'Fill a simple form: who is the vendor, how much, and what you are buying.',
    why: 'No hunting through email — the request is logged and tracked from day one.',
    mock: 'form',
  },
  intake: {
    emoji: '📥', scene: 'Vendor paper lands in the inbox.', color: '#0EA5E9',
    who: 'Contracts team',
    what: 'The vendor’s document is scanned in and sorted automatically.',
    why: 'Third-party paper gets the same careful tracking as agency templates.',
    mock: 'inbox',
  },
  generate: {
    emoji: '⚡', scene: 'The contract builds itself from your template.', color: '#8B5CF6',
    who: 'System + contracts (you click approve)',
    what: 'Vendor name, dollars, and dates pop in from your finance system.',
    why: 'Weeks of copy-paste become minutes — with mandatory clauses already included.',
    mock: 'merge',
  },
  ai_scorecard: {
    emoji: '✨', scene: 'AI reads the contract like a smart highlighter.', color: '#A855F7',
    who: 'Iris AI + contracts reviewer',
    what: 'Risky or missing clauses get flagged before lawyers spend time.',
    why: 'Catch problems early — especially on vendor paper that does not match your rules.',
    mock: 'ai',
  },
  contracts_review: {
    emoji: '👀', scene: 'Contracts checks the draft against the playbook.', color: '#6366F1',
    who: 'Contracts analyst',
    what: 'Confirm terms match agency policy and route to the next person.',
    why: 'The right expert sees it at the right time — nothing skips a step.',
    mock: 'checklist',
  },
  contracts_triage: {
    emoji: '🗂️', scene: 'Incoming vendor doc gets sorted.', color: '#0EA5E9',
    who: 'Contracts intake',
    what: 'Classify the document and assign priority.',
    why: 'Urgent deals move fast; everything else stays organized.',
    mock: 'inbox',
  },
  contracts_final: {
    emoji: '✅', scene: 'Final contracts sign-off before sending.', color: '#22C55E',
    who: 'Contracts manager',
    what: 'Last look — all redlines resolved, approvals captured.',
    why: 'One clear “go” before signature.',
    mock: 'checklist',
  },
  contracts_approval: {
    emoji: '✅', scene: 'Contracts says “ready to sign.”', color: '#22C55E',
    who: 'Contracts manager',
    what: 'Verify negotiations are done and send to signature.',
    why: 'Clean handoff to execution.',
    mock: 'checklist',
  },
  legal_review: {
    emoji: '⚖️', scene: 'Legal reads the fine print.', color: '#EC4899',
    who: 'Agency attorney',
    what: 'Compare against state standard terms; approve or send back for fixes.',
    why: 'Protect the public interest without slowing good deals.',
    mock: 'legal',
  },
  external_review: {
    emoji: '🤝', scene: 'The vendor gets a secure link to review.', color: '#14B8A6',
    who: 'Vendor + your team',
    what: 'Both sides comment in one shared workspace — no email attachments.',
    why: 'Everyone sees the same version. No “which PDF is latest?”',
    mock: 'collab',
  },
  negotiation: {
    emoji: '↔️', scene: 'Back and forth until terms match.', color: '#F59E0B',
    who: 'Contracts + vendor',
    what: 'Track each round of changes side by side.',
    why: 'Disputes get resolved in the tool — not in scattered threads.',
    mock: 'redline',
  },
  negotiation_out: {
    emoji: '📤', scene: 'Your redlines go to the vendor.', color: '#F59E0B',
    who: 'Contracts',
    what: 'Send proposed changes and wait for their response.',
    why: 'Clear record of what you asked for.',
    mock: 'redline',
  },
  negotiation_return: {
    emoji: '📥', scene: 'Vendor sends their counter-proposal.', color: '#F59E0B',
    who: 'Vendor',
    what: 'Review their edits and accept or push back.',
    why: 'Stay in control of the negotiation timeline.',
    mock: 'redline',
  },
  executive_approval: {
    emoji: '⭐', scene: 'Big dollar deal? Director gets a ping.', color: '#EAB308',
    who: 'Department director or executive',
    what: 'One-page summary — approve or ask questions.',
    why: 'High-value contracts get leadership eyes without extra meetings.',
    mock: 'exec',
  },
  signature: {
    emoji: '✍️', scene: 'Sign on phone, tablet, or computer.', color: '#22C55E',
    who: 'Authorized signers (agency + vendor)',
    what: 'Both parties sign the same final PDF with DocuSign.',
    why: 'Done in minutes — legally binding, fully auditable.',
    mock: 'sign',
  },
  post_execution: {
    emoji: '🎉', scene: 'Signed! Data flows to your systems.', color: '#10B981',
    who: 'Finance + contract administrators',
    what: 'Copy lands in Agreement Manager; ERP gets budget and dates.',
    why: 'Renewals and obligations tracked — no spreadsheet archaeology.',
    mock: 'sync',
  },
  sol_publish: {
    emoji: '📢', scene: 'The state posts “We’re buying something!”', color: '#0EA5E9',
    who: 'Procurement / IT authority',
    what: 'Publish the RFO publicly and open vendor sign-up.',
    why: 'Fair competition starts with one clear front door.',
    mock: 'webform-publish',
  },
  sol_register: {
    emoji: '📝', scene: 'Vendors raise their hand online.', color: '#38BDF8',
    who: 'Vendors + procurement',
    what: 'Web Form registration, Q&A, and addenda — all logged.',
    why: 'No lost emails; every bidder gets the same updates.',
    mock: 'webform',
  },
  sol_intake: {
    emoji: '📬', scene: 'Proposals arrive before the deadline.', color: '#6366F1',
    who: 'Contracts',
    what: 'Late bids rejected automatically; good ones queue for scoring.',
    why: 'Fair, timestamped intake — defensible in audits.',
    mock: 'inbox',
  },
  sol_evaluation: {
    emoji: '🏅', scene: 'Committee picks the best value offer.', color: '#A855F7',
    who: 'Evaluation committee',
    what: 'Score technical + cost; AI checks mandatory requirements.',
    why: 'Transparent ranking memo for the award file.',
    mock: 'score',
  },
  sol_award: {
    emoji: '🏆', scene: 'Winner announced — budget checked.', color: '#F59E0B',
    who: 'Contracts + finance',
    what: 'Intent-to-award notice, notify other bidders, verify budget.',
    why: 'Award is public, protest-ready, and funded.',
    mock: 'award',
  },
};

const GW_BIZ_MOCKS = {
  form: () => `
    <div class="biz-mock biz-mock--form">
      <div class="biz-mock-form-row"><span>Vendor</span><div class="biz-mock-input">Acme Cloud Solutions</div></div>
      <div class="biz-mock-form-row"><span>Amount</span><div class="biz-mock-input">$2,400,000</div></div>
      <div class="biz-mock-form-row"><span>Need</span><div class="biz-mock-input">Cloud services · 3 years</div></div>
      <button type="button" class="biz-mock-btn">Submit request →</button>
    </div>`,
  inbox: () => `
    <div class="biz-mock biz-mock--inbox">
      <div class="biz-mock-inbox-item biz-mock-inbox-item--new"><span>📄</span> New proposal · just arrived</div>
      <div class="biz-mock-inbox-item"><span>📄</span> Vendor contract · in review</div>
      <div class="biz-mock-inbox-item"><span>✓</span> Completed yesterday</div>
    </div>`,
  merge: () => `
    <div class="biz-mock biz-mock--merge">
      <div class="biz-mock-merge-col"><div class="biz-mock-merge-label">Your ERP</div><div class="biz-mock-chip">$2.4M</div><div class="biz-mock-chip">Acme</div></div>
      <div class="biz-mock-merge-arrow">→</div>
      <div class="biz-mock-merge-col"><div class="biz-mock-merge-label">Contract PDF</div><div class="biz-mock-doc"></div></div>
    </div>`,
  ai: () => `
    <div class="biz-mock biz-mock--ai">
      <div class="biz-mock-ai-row biz-mock-ai-row--ok">✓ Insurance looks good</div>
      <div class="biz-mock-ai-row biz-mock-ai-row--warn">! Liability needs a look</div>
      <div class="biz-mock-ai-row biz-mock-ai-row--ok">✓ Data stays in the U.S.</div>
    </div>`,
  checklist: () => `
    <div class="biz-mock biz-mock--check">
      <div class="biz-mock-check done">✓ Policy match</div>
      <div class="biz-mock-check done">✓ Budget OK</div>
      <div class="biz-mock-check active">→ Route to legal</div>
    </div>`,
  legal: () => `
    <div class="biz-mock biz-mock--legal">
      <div class="biz-mock-legal-doc"></div>
      <div class="biz-mock-legal-stamp">Approved ✓</div>
    </div>`,
  collab: () => `
    <div class="biz-mock biz-mock--collab">
      <div class="biz-mock-bubble biz-mock-bubble--you">Please review §6</div>
      <div class="biz-mock-bubble biz-mock-bubble--them">We accept with one edit</div>
    </div>`,
  redline: () => `
    <div class="biz-mock biz-mock--redline">
      <div class="biz-mock-redline-old">Unlimited liability</div>
      <div class="biz-mock-redline-arrow">↓</div>
      <div class="biz-mock-redline-new">Cap at 12 months fees</div>
    </div>`,
  exec: () => `
    <div class="biz-mock biz-mock--exec">
      <div class="biz-mock-exec-amt">$2,400,000</div>
      <div class="biz-mock-exec-label">Needs director approval</div>
      <button type="button" class="biz-mock-btn">Approve ✓</button>
    </div>`,
  sign: () => `
    <div class="biz-mock biz-mock--sign">
      <div class="biz-mock-sign-line">/s/ Authorized Signer</div>
      <div class="biz-mock-sign-tab">Sign here</div>
    </div>`,
  sync: () => `
    <div class="biz-mock biz-mock--sync">
      <div class="biz-mock-sync-row"><span>Agreement Manager</span><span class="biz-mock-pill">Saved ✓</span></div>
      <div class="biz-mock-sync-row"><span>Finance system</span><span class="biz-mock-pill">Synced ✓</span></div>
      <div class="biz-mock-sync-row"><span>Renewal reminder</span><span class="biz-mock-pill">Set ✓</span></div>
    </div>`,
  'webform-publish': () => `
    <div class="biz-mock biz-mock--webform">
      <div class="biz-mock-wf-banner">📢 RFO now open for bids!</div>
      <div class="biz-mock-wf-row"><span>Register vendors</span><span>Web Form →</span></div>
    </div>`,
  webform: () => `
    <div class="biz-mock biz-mock--webform">
      <div class="biz-mock-form-row"><span>Company</span><div class="biz-mock-input">Your Business LLC</div></div>
      <div class="biz-mock-form-row"><span>Email</span><div class="biz-mock-input">vendor@example.com</div></div>
      <button type="button" class="biz-mock-btn">Register →</button>
    </div>`,
  score: () => `
    <div class="biz-mock biz-mock--score">
      <div class="biz-mock-score-row lead"><span>🥇 Acme Cloud</span><strong>94</strong></div>
      <div class="biz-mock-score-row"><span>Northstar IT</span><strong>87</strong></div>
      <div class="biz-mock-score-row"><span>Vertex Systems</span><strong>84</strong></div>
    </div>`,
  award: () => `
    <div class="biz-mock biz-mock--award">
      <div class="biz-mock-award-trophy">🏆</div>
      <div class="biz-mock-award-name">Acme Cloud Solutions</div>
      <div class="biz-mock-award-sub">Intent to award · budget verified</div>
    </div>`,
};

function gwBizStepMeta(step) {
  return GW_BIZ_STEPS[step.id] || {
    ...GW_BIZ_DEFAULT,
    scene: step.title,
    what: step.description || GW_BIZ_DEFAULT.what,
  };
}

function gwGetCustomerProof() {
  return (typeof GW_DATA !== 'undefined' && GW_DATA.customer_proof) || { metrics: [], step_proof: {} };
}

function gwBizStepProof(step) {
  const proof = gwGetCustomerProof();
  const link = proof.step_proof?.[step.id];
  if (link && proof.metrics?.[link.metric_idx] != null) {
    return { ...proof.metrics[link.metric_idx], note: link.note };
  }
  if (step.id === 'signature') {
    return {
      value: '70%+',
      label: 'MSAs signed same day they are sent',
      customer: 'California Dept. of Water Resources',
      detail: 'Published DocuSign customer story',
      url: 'https://www.docusign.com/customer-stories/docusign-helps-the-california-natural-resources-agency-and-the-department-of-water-resources-accelerate-its-digital-transformation',
      note: 'Weeks-long paper ceremonies reduced to minutes.',
    };
  }
  return proof.metrics?.[0] || null;
}

function gwRenderProofBar(step) {
  const proof = gwGetCustomerProof();
  const stepProof = gwBizStepProof(step);
  const reach = proof.agency_reach;
  const metricsHtml = (proof.metrics || []).slice(0, 4).map(m => `
    <div class="biz-proof-chip">
      <span class="biz-proof-val">${m.value}</span>
      <span class="biz-proof-lbl">${m.label}</span>
    </div>`).join('');

  const highlight = stepProof ? `
    <div class="biz-proof-highlight">
      <div class="biz-proof-highlight-stat">${stepProof.value}</div>
      <div class="biz-proof-highlight-body">
        <strong>${stepProof.label}</strong>
        <span>${stepProof.customer}${stepProof.note ? ' — ' + stepProof.note : ''}</span>
        ${stepProof.url ? `<a href="${stepProof.url}" target="_blank" rel="noopener" class="biz-proof-link">Source ↗</a>` : ''}
      </div>
    </div>` : '';

  return `
    <div class="biz-proof-bar">
      <div class="biz-proof-reach">
        <span class="biz-proof-reach-val">${reach?.value || '5,500+'}</span>
        <span class="biz-proof-reach-lbl">${reach?.label || 'Government agencies trust DocuSign'}</span>
        ${reach?.url ? `<a href="${reach.url}" target="_blank" rel="noopener" class="biz-proof-link">Public source ↗</a>` : ''}
      </div>
      <div class="biz-proof-metrics">${metricsHtml}</div>
      ${highlight}
      <p class="biz-proof-disclaimer">${proof.subhead || 'Published customer outcomes — not demo projections.'}</p>
    </div>`;
}

function gwBizProductViews(step) {
  const sid = step.id;
  if (sid === 'signature') return ['product', 'document'];
  if (sid === 'post_execution') return ['product', 'document'];
  if (['generate', 'ai_scorecard', 'legal_review', 'negotiation', 'negotiation_out', 'negotiation_return'].includes(sid)) {
    return ['product', 'document'];
  }
  if (typeof gwCurrentScenario !== 'undefined' && gwCurrentScenario === 'solicitation'
      && typeof gwDocPhase === 'function' && gwDocPhase(sid) < 6) {
    return ['product', 'document'];
  }
  return ['product'];
}

function gwRenderBusinessClm(step, persona, container) {
  const template = document.getElementById('gw-clm-template');
  if (!template || !container) return;
  container.innerHTML = template.innerHTML;
  const root = container.querySelector('.clm-mock--embedded') || container.querySelector('.clm-mock');
  if (root && typeof gwRenderClmMock === 'function') {
    gwRenderClmMock(step, persona, root);
  }
}

function gwRenderBusinessDocument(step, persona, container) {
  const doc = typeof gwGetScenario === 'function' ? gwGetScenario().document : {};
  const ctx = (typeof GW_DATA !== 'undefined' && GW_DATA.context) || {};
  if (typeof gwVisualDocument === 'function') {
    container.innerHTML = gwVisualDocument(step, doc, ctx);
    if (typeof gwInitWordShell === 'function') gwInitWordShell(container);
    return;
  }
  if (typeof gwBuildContractHtml === 'function') {
    container.innerHTML = `<div class="gw-doc-panel gw-doc-panel--hero biz-doc-fallback"><div class="gw-doc-viewport gw-doc-viewport--hero"><div class="gw-doc-page">${gwBuildContractHtml(doc, step, ctx)}</div></div></div>`;
  }
}

function gwRenderBusinessProductPane(step, persona, view) {
  const wrap = document.createElement('div');
  wrap.className = 'biz-product-pane-inner';
  if (view === 'document') {
    gwRenderBusinessDocument(step, persona, wrap);
  } else if (step.id === 'signature' && typeof gwVisualSigning === 'function') {
    const doc = gwGetScenario().document;
    wrap.innerHTML = gwVisualSigning(step, persona, doc);
  } else if (step.id === 'post_execution' && typeof gwVisualNavigator === 'function') {
    wrap.innerHTML = gwVisualNavigator(gwGetScenario().document);
  } else {
    gwRenderBusinessClm(step, persona, wrap);
  }
  return wrap;
}

function gwRenderBusinessProduct(step, persona, container) {
  const views = gwBizProductViews(step);
  const primary = views[0];
  container.innerHTML = `
    <div class="biz-product-shell">
      ${views.length > 1 ? `
      <div class="biz-product-tabs" id="biz-product-tabs">
        <button type="button" class="biz-product-tab active" data-biz-view="product">IAM Platform screen</button>
        <button type="button" class="biz-product-tab" data-biz-view="document">Contract document</button>
      </div>` : `<div class="biz-product-tabs biz-product-tabs--single"><span class="biz-product-tab-label">Actual software experience</span></div>`}
      <div class="biz-product-frame" id="biz-product-frame"></div>
    </div>`;
  const frame = container.querySelector('#biz-product-frame');
  frame.appendChild(gwRenderBusinessProductPane(step, persona, primary));

  container.querySelectorAll('.biz-product-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.biz-product-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const v = btn.dataset.bizView === 'document' ? 'document' : 'product';
      frame.innerHTML = '';
      frame.appendChild(gwRenderBusinessProductPane(step, persona, v));
    });
  });
}

function gwRenderBusinessMock(step) {
  const meta = gwBizStepMeta(step);
  const fn = GW_BIZ_MOCKS[meta.mock] || GW_BIZ_MOCKS.form;
  return fn();
}

function gwRenderBusinessView(step, persona) {
  const meta = gwBizStepMeta(step);
  const doc = typeof gwGetScenario === 'function' ? gwGetScenario().document : {};
  const sc = typeof gwStateCtx === 'function' ? gwStateCtx() : { state: 'State' };
  const steps = gwGetScenario().steps;
  const next = steps[gwCurrentStep + 1];
  const canvas = document.getElementById('gw-visual-canvas');
  const hero = document.getElementById('gw-visual-hero');
  if (!canvas) return;

  if (hero) hero.classList.add('gw-visual-hero--business');

  document.getElementById('gw-visual-tabs')?.replaceChildren();
  document.getElementById('gw-visual-viewing').textContent =
    `Business View · ${persona.name || 'Team member'}`;

  canvas.className = 'gw-visual-canvas gw-visual-canvas--business';
  canvas.innerHTML = `
    <div class="biz-story" style="--biz-accent:${meta.color}">
      ${gwRenderProofBar(step)}
      <div class="biz-split">
        <div class="biz-split-left">
          <div class="biz-hero-card">
            <div class="biz-emoji-ring">${meta.emoji}</div>
            <h3 class="biz-scene-title">${meta.scene}</h3>
            <p class="biz-doc-hint">${doc.vendor ? doc.vendor.split(',')[0].trim() + ' · ' : ''}${doc.value || ''}</p>
          </div>
          <div class="biz-mock-wrap">
            <div class="biz-mock-label">Simple picture of this step</div>
            ${gwRenderBusinessMock(step)}
          </div>
          <div class="biz-cards">
            <div class="biz-card">
              <span class="biz-card-icon">👤</span>
              <strong>Who</strong>
              <p>${meta.who}</p>
            </div>
            <div class="biz-card">
              <span class="biz-card-icon">👉</span>
              <strong>What happens</strong>
              <p>${meta.what}</p>
            </div>
            <div class="biz-card">
              <span class="biz-card-icon">💡</span>
              <strong>Why it matters</strong>
              <p>${meta.why}</p>
            </div>
          </div>
          ${(step.id === 'sol_register' || step.id === 'sol_publish') ? `
          <div class="biz-webform-cta">
            <p>Try a live Web Form in the portal →</p>
            <button type="button" class="biz-mock-btn" onclick="gwSwitchTab('webforms', null); if(typeof wfScrollEmbed==='function') wfScrollEmbed();">Open Web Forms tab</button>
          </div>` : ''}
          ${next ? `<div class="biz-next-hint">Next up: <strong>${next.title}</strong> →</div>` : `<div class="biz-next-hint biz-next-hint--done">🎉 Flow complete for ${sc.state}!</div>`}
        </div>
        <div class="biz-split-right">
          <div class="biz-product-wrap" id="biz-product-wrap"></div>
        </div>
      </div>
    </div>`;

  const productWrap = canvas.querySelector('#biz-product-wrap');
  if (productWrap) gwRenderBusinessProduct(step, persona, productWrap);

  const stepProof = gwBizStepProof(step);
  const headline = document.getElementById('gw-value-headline');
  const text = document.getElementById('gw-value-text');
  const audience = document.getElementById('gw-value-audience');
  if (headline) headline.textContent = stepProof ? `${stepProof.value} ${stepProof.label}` : meta.scene;
  if (text) text.textContent = stepProof ? `${stepProof.customer}. ${stepProof.note || stepProof.detail || meta.why}` : meta.why;
  if (audience) audience.textContent = stepProof ? 'Published gov customer outcome' : 'Business & executive viewers';

  const titleEl = document.getElementById('gw-step-title');
  if (titleEl) titleEl.textContent = meta.emoji + ' ' + step.title;
  const summary = document.getElementById('gw-narrative-summary');
  if (summary) summary.textContent = meta.what;
}

function gwBusinessModeActive() {
  return document.body.classList.contains('business-mode');
}

window.gwRenderBusinessView = gwRenderBusinessView;
window.gwBusinessModeActive = gwBusinessModeActive;
