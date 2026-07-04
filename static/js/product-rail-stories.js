/* Animated story scenes for the minimizable preview rail — separate from inline UI mocks */

(function () {
  function anim(ctx, n) {
    return ctx.animate ? ` ds-prod-cpv-rise ds-prod-cpv-d${n}` : '';
  }

  function live(ctx) {
    return ctx.animate ? ' ds-rail-viz--live' : '';
  }

  function pipeline(ctx, { from, fromIcon, to, toIcon, packet }) {
    return `<div class="ds-rail-viz-pipeline${live(ctx)}">
      <div class="ds-rail-viz-node${anim(ctx, 2)}"><span>${fromIcon}</span><small>${from}</small></div>
      <div class="ds-rail-viz-beam"><span class="ds-rail-viz-packet">${packet}</span></div>
      <div class="ds-rail-viz-node${anim(ctx, 3)}"><span>${toIcon}</span><small>${to}</small></div>
    </div>`;
  }

  function browser(ctx, { url, label, inner, embed }) {
    return `<div class="ds-rail-viz-browser${live(ctx)}${anim(ctx, 2)}">
      <div class="ds-rail-viz-browser-bar"><span class="ds-rail-viz-dot"></span><span class="ds-rail-viz-dot"></span><span class="ds-rail-viz-dot"></span><span class="ds-rail-viz-url">${url}</span></div>
      <div class="ds-rail-viz-browser-body">
        ${label ? `<span class="ds-rail-viz-browser-label">${label}</span>` : ''}
        ${inner || ''}
        ${embed ? `<div class="ds-rail-viz-embed${anim(ctx, 3)}"><span class="ds-rail-viz-embed-badge">Docusign embedded</span><div class="ds-rail-viz-embed-sign"></div></div>` : ''}
      </div>
    </div>`;
  }

  function scoreRing(ctx, { score, flags }) {
    return `<div class="ds-rail-viz-score${live(ctx)}${anim(ctx, 2)}">
      <div class="ds-rail-viz-score-ring" style="--score:${score}"><span>${score}</span></div>
      <div class="ds-rail-viz-flags">${flags.map((f, i) =>
        `<span class="ds-rail-viz-flag${anim(ctx, 3 + i)}">${f}</span>`
      ).join('')}</div>
    </div>`;
  }

  function envelopeCard(ctx, { title, status, statusClass }) {
    return `<div class="ds-rail-viz-envelope${live(ctx)}${anim(ctx, 2)}">
      <div class="ds-rail-viz-envelope-icon">📄</div>
      <div class="ds-rail-viz-envelope-meta"><strong>${title}</strong><small>Secure delivery</small></div>
      <span class="ds-rail-viz-status ${statusClass || ''}">${status}</span>
    </div>`;
  }

  function connectBurst(ctx) {
    return `<div class="ds-rail-viz-connect${live(ctx)}${anim(ctx, 2)}">
      <span class="ds-rail-viz-bolt">⚡</span>
      <code>envelope-completed</code>
      <div class="ds-rail-viz-sync-row${anim(ctx, 4)}">
        <span class="ds-rail-viz-erp-tile">FI$Cal</span>
        <span class="ds-rail-viz-sync-arrow">→</span>
        <span class="ds-rail-viz-erp-ok">Encumbered</span>
      </div>
    </div>`;
  }

  function signLine(ctx) {
    return `<div class="ds-rail-viz-sign${live(ctx)}${anim(ctx, 2)}">
      <div class="ds-rail-viz-doc-lines"><span></span><span></span><span></span></div>
      <div class="ds-rail-viz-sign-field"><span class="ds-rail-viz-sign-label">Sign here</span><span class="ds-rail-viz-sign-stroke"></span></div>
      <span class="ds-rail-viz-seal${anim(ctx, 4)}">🔒 Sealed</span>
    </div>`;
  }

  function redirect(ctx) {
    return `<div class="ds-rail-viz-redirect${live(ctx)}${anim(ctx, 2)}">
      <div class="ds-rail-viz-redirect-from">Docusign</div>
      <div class="ds-rail-viz-redirect-arrow">↩</div>
      <div class="ds-rail-viz-redirect-to">Agency app<div class="ds-rail-viz-redirect-ok">Completed ✓</div></div>
    </div>`;
  }

  function linkQr(ctx) {
    return `<div class="ds-rail-viz-link${live(ctx)}${anim(ctx, 2)}">
      <div class="ds-rail-viz-qr"><div class="ds-rail-viz-qr-grid"></div></div>
      <div class="ds-rail-viz-link-text"><span class="ds-rail-viz-link-pill">Public URL live</span><small>forms.city.gov/benefits</small></div>
    </div>`;
  }

  function formProgress(ctx) {
    return `<div class="ds-rail-viz-form${live(ctx)}">
      ${['Name', 'Documents', 'Submit'].map((l, i) =>
        `<div class="ds-rail-viz-form-row${i <= 2 ? ' ds-rail-viz-form-row--done' : ''}${anim(ctx, 2 + i)}"><span class="ds-rail-viz-check">✓</span>${l}</div>`
      ).join('')}
    </div>`;
  }

  function deskQueue(ctx) {
    return `<div class="ds-rail-viz-queue${live(ctx)}">
      ${['Web Form #1042', 'Email: MSA review', 'Manual intake'].map((t, i) =>
        `<div class="ds-rail-viz-queue-card${anim(ctx, 2 + i)}"><span class="ds-rail-viz-queue-dot"></span>${t}</div>`
      ).join('')}
    </div>`;
  }

  function slaRing(ctx, { hours }) {
    return `<div class="ds-rail-viz-sla${live(ctx)}${anim(ctx, 2)}">
      <div class="ds-rail-viz-sla-ring"><span>${hours}h</span><small>SLA left</small></div>
      <span class="ds-rail-viz-priority">High priority</span>
    </div>`;
  }

  function fork(ctx) {
    return `<div class="ds-rail-viz-fork${live(ctx)}${anim(ctx, 2)}">
      <div class="ds-rail-viz-fork-root">Trigger</div>
      <div class="ds-rail-viz-fork-lines"><span class="ds-rail-viz-fork-leg ds-rail-viz-fork-leg--a">Legal</span><span class="ds-rail-viz-fork-leg ds-rail-viz-fork-leg--b">Finance</span></div>
    </div>`;
  }

  function taskStack(ctx) {
    return `<div class="ds-rail-viz-tasks${live(ctx)}">
      ${['Review indemnity', 'Budget sign-off'].map((t, i) =>
        `<div class="ds-rail-viz-task${anim(ctx, 2 + i)}">📌 ${t}</div>`
      ).join('')}
    </div>`;
  }

  function barChart(ctx, { bars }) {
    return `<div class="ds-rail-viz-chart${live(ctx)}${anim(ctx, 2)}">
      ${bars.map((b, i) =>
        `<div class="ds-rail-viz-bar-wrap"><div class="ds-rail-viz-bar${anim(ctx, 3 + i)}" style="--h:${b.pct}%"></div><small>${b.label}</small></div>`
      ).join('')}
    </div>`;
  }

  function searchBox(ctx, { query, count }) {
    return `<div class="ds-rail-viz-search${live(ctx)}${anim(ctx, 2)}">
      <div class="ds-rail-viz-search-input"><span class="ds-rail-viz-search-icon">🔎</span>${query}</div>
      <div class="ds-rail-viz-search-results${anim(ctx, 4)}">${count} agreements found</div>
    </div>`;
  }

  function avatars(ctx) {
    return `<div class="ds-rail-viz-avatars${live(ctx)}${anim(ctx, 2)}">
      ${['🏛', '⚖', '🏢'].map((a, i) =>
        `<span class="ds-rail-viz-avatar${anim(ctx, 3 + i)}">${a}</span>`
      ).join('')}
      <span class="ds-rail-viz-avatar-line"></span>
    </div>`;
  }

  function docVersions(ctx) {
    return `<div class="ds-rail-viz-versions${live(ctx)}">
      ${['v1', 'v2', 'v3'].map((v, i) =>
        `<div class="ds-rail-viz-version${i === 2 ? ' ds-rail-viz-version--active' : ''}${anim(ctx, 2 + i)}">${v}${i === 2 ? ' · current' : ''}</div>`
      ).join('')}
    </div>`;
  }

  function approvalChain(ctx) {
    return `<div class="ds-rail-viz-approvals${live(ctx)}">
      <div class="ds-rail-viz-approval ds-rail-viz-approval--done${anim(ctx, 2)}">Procurement ✓</div>
      <div class="ds-rail-viz-approval ds-rail-viz-approval--wait${anim(ctx, 3)}">GC ⏳</div>
    </div>`;
  }

  function apiResponse(ctx) {
    return `<div class="ds-rail-viz-api${live(ctx)}${anim(ctx, 2)}">
      <div class="ds-rail-viz-api-status"><span class="ds-rail-viz-ok">200 OK</span><span>142ms</span></div>
      <pre class="ds-rail-viz-api-json">{ "envelopes": […], "resultSetSize": 12 }</pre>
    </div>`;
  }

  function chatAgent(ctx, { message }) {
    return `<div class="ds-rail-viz-chat${live(ctx)}">
      <div class="ds-rail-viz-chat-user${anim(ctx, 2)}">${message}</div>
      <div class="ds-rail-viz-chat-agent${anim(ctx, 3)}"><span class="ds-rail-viz-typing"><span></span><span></span><span></span></span></div>
      <div class="ds-rail-viz-chat-reply${anim(ctx, 4)}">Template NDA v4 · creating envelope…</div>
    </div>`;
  }

  function govValueOrb(ctx, { product }) {
    const stepNum = (ctx.stepIndex ?? 0) + 1;
    return `<div class="ds-rail-viz-gov${live(ctx)}${anim(ctx, 2)}">
      <div class="ds-rail-viz-gov-orb"><span>${stepNum}</span></div>
      <div class="ds-rail-viz-gov-product">${product || 'IAM Platform'}</div>
      <div class="ds-rail-viz-gov-rays"></div>
    </div>`;
  }

  const SCENE_VISUALS = {
    'send:prefill': (ctx) => pipeline(ctx, { from: 'FI$Cal', fromIcon: '🏛', to: 'Send', toIcon: '📤', packet: 'DATA' }),
    'send:compliance': (ctx) => scoreRing(ctx, { score: 82, flags: ['⚠ Indemnity', '⚠ Liability'] }),
    'send:deliver': (ctx) => envelopeCard(ctx, { title: 'MSA — Acme IT', status: 'Sent → Delivered', statusClass: 'ds-rail-viz-status--sent' }),
    'send:sync': (ctx) => connectBurst(ctx),
    'embedded:portal': (ctx) => browser(ctx, { url: 'grants.city.gov', label: 'City Grants Portal', inner: '<button class="ds-rail-viz-cta">Sign agreement →</button>' }),
    'embedded:embed': (ctx) => browser(ctx, { url: 'grants.city.gov/sign', embed: true }),
    'embedded:sign': (ctx) => signLine(ctx),
    'embedded:return': (ctx) => redirect(ctx),
    'webforms:publish': (ctx) => linkQr(ctx),
    'webforms:intake': (ctx) => formProgress(ctx),
    'webforms:route': (ctx) => deskQueue(ctx),
    'webforms:trigger': (ctx) => pipeline(ctx, { from: 'Form', fromIcon: '📝', to: 'Send', toIcon: '📤', packet: 'AUTO' }),
    'maestro:trigger': (ctx) => pipeline(ctx, { from: 'ERP', fromIcon: '🎯', to: 'AV1', toIcon: '⚡', packet: 'EVENT' }),
    'maestro:branch': (ctx) => fork(ctx),
    'maestro:action': (ctx) => taskStack(ctx),
    'maestro:complete': (ctx) => connectBurst(ctx),
    'agreementDesk:intake': (ctx) => deskQueue(ctx),
    'agreementDesk:triage': (ctx) => slaRing(ctx, { hours: 24 }),
    'agreementDesk:review': (ctx) => scoreRing(ctx, { score: 82, flags: ['⚠ Clause 4', '⚠ Clause 9'] }),
    'agreementDesk:collab': (ctx) => avatars(ctx),
    'navigator:alert': (ctx) => barChart(ctx, { bars: [{ label: '90d', pct: 85 }, { label: '60d', pct: 55 }, { label: '30d', pct: 30 }] }),
    'navigator:risk': (ctx) => scoreRing(ctx, { score: 68, flags: ['8 gaps', 'Portfolio scan'] }),
    'navigator:find': (ctx) => searchBox(ctx, { query: 'Acme + MSA', count: 6 }),
    'navigator:report': (ctx) => apiResponse(ctx),
    'workspaces:invite': (ctx) => avatars(ctx),
    'workspaces:redline': (ctx) => docVersions(ctx),
    'workspaces:approve': (ctx) => approvalChain(ctx),
    'workspaces:archive': (ctx) => pipeline(ctx, { from: 'Workspace', fromIcon: '🤝', to: 'Navigator', toIcon: '📊', packet: 'PDF' }),
    'explorer:browse': (ctx) => browser(ctx, { url: 'developer.docusign.com', label: 'GET /envelopes', inner: '<code class="ds-rail-viz-code">/accounts/{id}/envelopes</code>' }),
    'explorer:auth': (ctx) => pipeline(ctx, { from: 'OAuth', fromIcon: '🔑', to: 'API', toIcon: '☁', packet: 'JWT' }),
    'explorer:execute': (ctx) => apiResponse(ctx),
    'explorer:automate': (ctx) => pipeline(ctx, { from: 'Explorer', fromIcon: '🖥', to: 'AV1', toIcon: '⚡', packet: 'COPY' }),
    'agent:ask': (ctx) => chatAgent(ctx, { message: 'Create NDA for new vendor' }),
    'agent:read': (ctx) => searchBox(ctx, { query: 'NDA template v4', count: 1 }),
    'agent:act': (ctx) => envelopeCard(ctx, { title: 'NDA — New Vendor', status: 'Creating…', statusClass: 'ds-rail-viz-status--sent' }),
    'agent:reply': (ctx) => apiResponse(ctx),
    'home:inbox': (ctx) => deskQueue(ctx),
    'home:action': (ctx) => taskStack(ctx),
    'home:sign': (ctx) => envelopeCard(ctx, { title: 'Grant amendment', status: 'Out for signature', statusClass: 'ds-rail-viz-status--sent' }),
    'home:sync': (ctx) => connectBurst(ctx),
  };

  function stepLi(ctx, s, i) {
    const on = ctx.animate && s.active !== false;
    return `<li class="ds-rail-story-step${on ? ' ds-rail-story-step--on' : ''}${anim(ctx, i + 4)}">
      <span class="ds-rail-story-step-icon" aria-hidden="true">${s.icon}</span>
      <span class="ds-rail-story-step-text">${s.text}</span>
    </li>`;
  }

  function renderVisual(ctx) {
    const key = ctx._sceneKey;
    const fn = key && SCENE_VISUALS[key];
    if (!fn) return '';
    return `<div class="ds-rail-story-visual" aria-hidden="true">${fn(ctx)}</div>`;
  }

  function renderCue(ctx) {
    const cue = window.DS_RAIL_STORY_CUES?.[ctx._sceneKey];
    if (!cue) return '';
    return `<details class="ds-rail-story-cue${anim(ctx, 4)}">
      <summary class="ds-rail-story-cue-summary">
        <span class="ds-rail-story-cue-label">Say this</span>
        <span class="ds-rail-story-cue-toggle" aria-hidden="true"></span>
      </summary>
      <p class="ds-rail-story-cue-text">${cue}</p>
    </details>`;
  }

  function panel(ctx) {
    const liveCls = ctx.animate ? ' ds-prod-cpv-live' : '';
    const steps = (ctx.steps || []).map((s, i) => stepLi(ctx, s, i)).join('');
    const visualHtml = renderVisual(ctx);
    const cueHtml = renderCue(ctx);
    return `
      <div class="ds-prod-frame ds-prod-frame--compact ds-rail-story-frame">
        <div class="ds-prod-cpv-panel ds-rail-story-panel${liveCls}">
          <p class="ds-rail-story-eyebrow${anim(ctx, 1)}">${ctx.eyebrow}</p>
          <h3 class="ds-rail-story-headline${anim(ctx, 2)}">${ctx.headline}</h3>
          ${visualHtml}
          <p class="ds-rail-story-body${anim(ctx, 3)}">${ctx.body}</p>
          ${cueHtml}
          ${steps ? `<ul class="ds-rail-story-steps">${steps}</ul>` : ''}
          ${ctx.footer ? `<div class="ds-rail-story-footer${anim(ctx, 7)}">${ctx.footer}</div>` : ''}
        </div>
      </div>`;
  }

  const SCENES = {
    home: {
      inbox: {
        eyebrow: 'Day in the life · Step 1',
        headline: 'One inbox for agreement work',
        body: 'Tasks, envelope status, and desk requests surface together — the left panel shows Home UI; this is the agency-wide story.',
        steps: [
          { icon: '📥', text: '3 tasks due today', active: true },
          { icon: '📄', text: '2 envelopes awaiting action' },
          { icon: '🔔', text: 'Desk request assigned' },
        ],
        footer: '<span class="ds-rail-story-tag">IAM home</span>',
      },
      action: {
        eyebrow: 'Day in the life · Step 2',
        headline: 'Clear next actions',
        body: 'Every agreement has an owner — procurement, legal, and signers know exactly what to do next.',
        steps: [
          { icon: '📌', text: 'Review vendor MSA', active: true },
          { icon: '✍', text: 'Sign grant amendment' },
          { icon: '📋', text: 'Approve desk intake' },
        ],
        footer: '<span class="ds-rail-story-tag">Accountability</span>',
      },
      sign: {
        eyebrow: 'Day in the life · Step 3',
        headline: 'Signing in the flow of work',
        body: 'eSignature is embedded in IAM — not a separate tool staff forget to check.',
        steps: [
          { icon: '📤', text: 'Envelope out for signature', active: true },
          { icon: '👤', text: 'Vendor signer notified' },
          { icon: '⏱', text: 'Reminder scheduled' },
        ],
        footer: '<span class="ds-rail-story-tag">eSignature</span>',
      },
      sync: {
        eyebrow: 'Day in the life · Step 4',
        headline: 'ERP stays in sync',
        body: 'Connect publishes completion events — FI$Cal and contract registers update without re-keying.',
        steps: [
          { icon: '✍', text: 'All parties signed', active: true },
          { icon: '⚡', text: 'Connect event fired' },
          { icon: '📊', text: 'Status in system of record' },
        ],
        footer: '<span class="ds-rail-story-tag ds-rail-story-tag--ok">Closed loop</span>',
      },
    },
    send: {
      prefill: {
        eyebrow: 'Behind the scenes · Step 1',
        headline: 'FI$Cal pre-fills the envelope',
        body: 'Vendor ID, contract value, and department codes sync from your ERP before anyone clicks Send.',
        steps: [
          { icon: '🏛', text: 'Procurement selects template', active: true },
          { icon: '↔', text: 'FI$Cal fields map to tabs' },
          { icon: '✓', text: 'Zero re-keying for staff' },
        ],
        footer: '<span class="ds-rail-story-tag">Integration value</span>',
      },
      compliance: {
        eyebrow: 'Behind the scenes · Step 2',
        headline: 'Playbook flags before send',
        body: 'AI-assisted review catches non-standard indemnity language against your agency playbook — separate from the Word UI on the left.',
        steps: [
          { icon: '📋', text: 'Playbook rules evaluated', active: true },
          { icon: '⚠', text: '2 clauses need legal eyes' },
          { icon: '→', text: 'Routed to GC queue' },
        ],
        footer: '<span class="ds-rail-story-tag">Risk reduction</span>',
      },
      deliver: {
        eyebrow: 'Behind the scenes · Step 3',
        headline: 'Envelope reaches the vendor',
        body: 'Signer order, reminders, and authentication ride the same envelope your team configured — delivered over secure channels.',
        steps: [
          { icon: '📤', text: 'Sent to Acme IT Solutions', active: true },
          { icon: '🔐', text: 'SMS identity check enabled' },
          { icon: '⏱', text: 'Auto-reminder in 3 days' },
        ],
        footer: '<span class="ds-rail-story-tag">Delivery path</span>',
      },
      sync: {
        eyebrow: 'Behind the scenes · Step 4',
        headline: 'Executed copy hits FI$Cal',
        body: 'When signing completes, Connect publishes status so encumbrance and contract register update automatically.',
        steps: [
          { icon: '✍', text: 'All parties signed', active: true },
          { icon: '⚡', text: 'Connect event fired' },
          { icon: '📊', text: 'REQ-2026-4201 encumbered' },
        ],
        footer: '<span class="ds-rail-story-tag ds-rail-story-tag--ok">ERP in sync</span>',
      },
    },
    embedded: {
      portal: {
        eyebrow: 'Citizen journey · Step 1',
        headline: 'Starts in your agency portal',
        body: 'Residents never leave your branded site — they click “Sign agreement” from a benefits or grants dashboard.',
        steps: [
          { icon: '🌐', text: 'City grants portal', active: true },
          { icon: '👤', text: 'Jane Smith logs in' },
          { icon: '📄', text: 'Grant agreement ready' },
        ],
        footer: '<span class="ds-rail-story-tag">Embedded entry</span>',
      },
      embed: {
        eyebrow: 'Citizen journey · Step 2',
        headline: 'Signing loads in-place',
        body: 'Docusign renders inside an iframe — no account creation, no redirect to a generic login page.',
        steps: [
          { icon: '🖼', text: 'Embedded session opens', active: true },
          { icon: '🔒', text: 'Session tied to clientUserId' },
          { icon: '📱', text: 'Works on mobile web' },
        ],
        footer: '<span class="ds-rail-story-tag">Seamless UX</span>',
      },
      sign: {
        eyebrow: 'Citizen journey · Step 3',
        headline: 'Signature captured with audit trail',
        body: 'Every field, IP, and timestamp is recorded for public-records compliance while the citizen sees a simple flow.',
        steps: [
          { icon: '✍', text: 'eSignature applied', active: true },
          { icon: '📝', text: 'Certificate of completion' },
          { icon: '🗂', text: 'Tamper-evident PDF sealed' },
        ],
        footer: '<span class="ds-rail-story-tag">Compliance</span>',
      },
      return: {
        eyebrow: 'Citizen journey · Step 4',
        headline: 'Returned to your application',
        body: 'returnUrl brings the citizen back to a confirmation screen — your CRM or case system updates in the same session.',
        steps: [
          { icon: '↩', text: 'Redirect to agency app', active: true },
          { icon: '✓', text: 'Status: Completed' },
          { icon: '🔔', text: 'Case worker notified' },
        ],
        footer: '<span class="ds-rail-story-tag ds-rail-story-tag--ok">Closed loop</span>',
      },
    },
    webforms: {
      publish: {
        eyebrow: 'Intake story · Step 1',
        headline: 'Public link goes live',
        body: 'Agencies share a self-service URL — no login required for residents enrolling in programs or submitting attestations.',
        steps: [
          { icon: '🔗', text: 'Form published to web', active: true },
          { icon: '📱', text: 'QR code on agency site' },
          { icon: '🌍', text: 'Accessible 24/7' },
        ],
        footer: '<span class="ds-rail-story-tag">Self-service</span>',
      },
      intake: {
        eyebrow: 'Intake story · Step 2',
        headline: 'Resident completes intake',
        body: 'Conditional logic hides irrelevant fields; validation runs before submit — reducing incomplete packets.',
        steps: [
          { icon: '📝', text: 'Benefits enrollment form', active: true },
          { icon: '✓', text: 'Required docs attached' },
          { icon: '📨', text: 'Submission confirmed' },
        ],
        footer: '<span class="ds-rail-story-tag">Clean data in</span>',
      },
      route: {
        eyebrow: 'Intake story · Step 3',
        headline: 'Routed to Agreement Desk',
        body: 'Rules assign priority, SLA timer, and owning team — intake becomes a trackable request, not an email.',
        steps: [
          { icon: '📥', text: 'Desk queue updated', active: true },
          { icon: '⏱', text: '48-hour SLA started' },
          { icon: '👥', text: 'Assigned to intake team' },
        ],
        footer: '<span class="ds-rail-story-tag">Operational control</span>',
      },
      trigger: {
        eyebrow: 'Intake story · Step 4',
        headline: 'Envelope auto-created',
        body: 'Workflow Builder can fire from the submission — template populated with form answers, ready for signature.',
        steps: [
          { icon: '⚡', text: 'Workflow trigger fired', active: true },
          { icon: '📄', text: 'Template populated' },
          { icon: '📤', text: 'Sent for signature' },
        ],
        footer: '<span class="ds-rail-story-tag ds-rail-story-tag--ok">Hands-free send</span>',
      },
    },
    maestro: {
      trigger: {
        eyebrow: 'Automation story · Step 1',
        headline: 'Procurement event fires AV1',
        body: 'New vendor onboarded in your source system — Workflow Builder picks up the trigger without manual handoff.',
        steps: [
          { icon: '🎯', text: 'Vendor onboard event', active: true },
          { icon: '⚡', text: 'AV1 workflow started' },
          { icon: '📋', text: 'Context from ERP attached' },
        ],
        footer: '<span class="ds-rail-story-tag">Event-driven</span>',
      },
      branch: {
        eyebrow: 'Automation story · Step 2',
        headline: 'Parallel approval paths',
        body: 'Legal and finance review run concurrently — the diagram on the left shows design; this is runtime behavior.',
        steps: [
          { icon: '⑂', text: 'Branch on contract value', active: true },
          { icon: '⚖', text: 'Legal path opened' },
          { icon: '💰', text: 'Finance path opened' },
        ],
        footer: '<span class="ds-rail-story-tag">Smart routing</span>',
      },
      action: {
        eyebrow: 'Automation story · Step 3',
        headline: 'Tasks land in Agreement Desk',
        body: 'Each branch creates actionable tasks with owners — no spreadsheet tracking or lost email threads.',
        steps: [
          { icon: '📌', text: 'Task: Review indemnity', active: true },
          { icon: '📌', text: 'Task: Budget sign-off' },
          { icon: '🔔', text: 'Reminders scheduled' },
        ],
        footer: '<span class="ds-rail-story-tag">Accountability</span>',
      },
      complete: {
        eyebrow: 'Automation story · Step 4',
        headline: 'Status written to system of record',
        body: 'When all steps finish, procurement status updates in FI$Cal — auditors see one timeline across systems.',
        steps: [
          { icon: '✓', text: 'All branches complete', active: true },
          { icon: '↔', text: 'ERP status = Active' },
          { icon: '📊', text: 'Dashboard refreshed' },
        ],
        footer: '<span class="ds-rail-story-tag ds-rail-story-tag--ok">Closed loop</span>',
      },
    },
    agreementDesk: {
      intake: {
        eyebrow: 'Desk story · Step 1',
        headline: 'Every channel, one queue',
        body: 'Email forwards, Web Form submissions, and manual requests appear together — nothing slips through inboxes.',
        steps: [
          { icon: '📥', text: '3 new requests today', active: true },
          { icon: '📧', text: 'Email intake parsed' },
          { icon: '📝', text: 'Web Form linked' },
        ],
        footer: '<span class="ds-rail-story-tag">Unified intake</span>',
      },
      triage: {
        eyebrow: 'Desk story · Step 2',
        headline: 'SLA-aware triage',
        body: 'Priority rules surface urgent solicitations first; assignees get clear ownership before legal spends time.',
        steps: [
          { icon: '⏱', text: 'SLA: 24h remaining', active: true },
          { icon: '🔴', text: 'High priority flagged' },
          { icon: '👤', text: 'Assigned to Maria L.' },
        ],
        footer: '<span class="ds-rail-story-tag">Speed to answer</span>',
      },
      review: {
        eyebrow: 'Desk story · Step 3',
        headline: 'Playbook scorecard runs',
        body: 'Vendor paper is scored against state standard terms — deviations route to GC before countersignature.',
        steps: [
          { icon: '📊', text: 'AI scorecard: 82/100', active: true },
          { icon: '⚠', text: '2 clauses flagged' },
          { icon: '⚖', text: 'GC review requested' },
        ],
        footer: '<span class="ds-rail-story-tag">Defensible review</span>',
      },
      collab: {
        eyebrow: 'Desk story · Step 4',
        headline: 'Escalated to Workspace',
        body: 'Complex deals move to a secure collaboration room — external counsel redlines without email attachments.',
        steps: [
          { icon: '🤝', text: 'Workspace created', active: true },
          { icon: '👥', text: 'Vendor counsel invited' },
          { icon: '📎', text: 'Version 1 uploaded' },
        ],
        footer: '<span class="ds-rail-story-tag ds-rail-story-tag--ok">Team alignment</span>',
      },
    },
    navigator: {
      alert: {
        eyebrow: 'Portfolio story · Step 1',
        headline: 'Renewals surfaced early',
        body: 'Agreement Manager watches expiry windows — finance and legal see risk before auto-renew clauses kick in.',
        steps: [
          { icon: '📅', text: '14 MSAs expire in 90d', active: true },
          { icon: '🔔', text: 'Owners notified' },
          { icon: '📈', text: '$2.4M exposure tracked' },
        ],
        footer: '<span class="ds-rail-story-tag">Proactive</span>',
      },
      risk: {
        eyebrow: 'Portfolio story · Step 2',
        headline: 'Non-standard terms flagged',
        body: 'Cross-portfolio analytics find indemnity gaps the agreements list alone might miss.',
        steps: [
          { icon: '🔍', text: 'Scan across 1,240 contracts', active: true },
          { icon: '⚠', text: '8 missing liability caps' },
          { icon: '📋', text: 'Remediation plan drafted' },
        ],
        footer: '<span class="ds-rail-story-tag">Enterprise risk</span>',
      },
      find: {
        eyebrow: 'Portfolio story · Step 3',
        headline: 'Instant search & drill-down',
        body: 'Filter by vendor, agency, or clause type — auditors get answers in seconds, not folder dives.',
        steps: [
          { icon: '🔎', text: 'Search: Acme + MSA', active: true },
          { icon: '📄', text: '6 agreements found' },
          { icon: '🏷', text: 'Metadata enriched' },
        ],
        footer: '<span class="ds-rail-story-tag">Findability</span>',
      },
      report: {
        eyebrow: 'Portfolio story · Step 4',
        headline: 'Audit-ready export',
        body: 'Insights roll up to leadership dashboards — proof of compliance for legislative oversight.',
        steps: [
          { icon: '📊', text: 'Renewal readiness report', active: true },
          { icon: '📤', text: 'Exported to PDF' },
          { icon: '✓', text: 'Shared with CFO office' },
        ],
        footer: '<span class="ds-rail-story-tag ds-rail-story-tag--ok">Board-ready</span>',
      },
    },
    workspaces: {
      invite: {
        eyebrow: 'Collaboration story · Step 1',
        headline: 'External parties invited securely',
        body: 'Vendor counsel joins a controlled room — no consumer Docusign accounts or attachment sprawl.',
        steps: [
          { icon: '✉', text: 'Invite sent to counsel@firm.com', active: true },
          { icon: '🔐', text: 'Access expires in 30 days' },
          { icon: '👁', text: 'Activity logged' },
        ],
        footer: '<span class="ds-rail-story-tag">Secure access</span>',
      },
      redline: {
        eyebrow: 'Collaboration story · Step 2',
        headline: 'Redlines without email threads',
        body: 'Version history and comments stay in one place — the left preview shows admin view; this is participant flow.',
        steps: [
          { icon: '📝', text: 'Version 3 uploaded', active: true },
          { icon: '💬', text: '4 comments resolved' },
          { icon: '↔', text: 'Compared to playbook' },
        ],
        footer: '<span class="ds-rail-story-tag">Fewer cycles</span>',
      },
      approve: {
        eyebrow: 'Collaboration story · Step 3',
        headline: 'Approval chain in one thread',
        body: 'Sequential sign-offs happen inside the workspace — stakeholders see exactly what changed since last version.',
        steps: [
          { icon: '✓', text: 'Procurement approved', active: true },
          { icon: '⏳', text: 'Waiting on GC' },
          { icon: '🔔', text: 'Reminder sent' },
        ],
        footer: '<span class="ds-rail-story-tag">Clear ownership</span>',
      },
      archive: {
        eyebrow: 'Collaboration story · Step 4',
        headline: 'Executed copy filed to Navigator',
        body: 'Final PDF and metadata sync to Agreement Manager — procurement, legal, and audit share one record.',
        steps: [
          { icon: '📁', text: 'Executed PDF stored', active: true },
          { icon: '🏷', text: 'Tagged REQ-2026-4201' },
          { icon: '🔗', text: 'Linked in Navigator' },
        ],
        footer: '<span class="ds-rail-story-tag ds-rail-story-tag--ok">Single source of truth</span>',
      },
    },
    explorer: {
      browse: {
        eyebrow: 'Developer story · Step 1',
        headline: 'Pick an endpoint from the catalog',
        body: 'The left panel is the live explorer — this walkthrough shows how a call fits into your integration story.',
        steps: [
          { icon: '📚', text: 'eSignature group expanded', active: true },
          { icon: '🎯', text: 'GET /envelopes selected' },
          { icon: '📖', text: 'Description loaded' },
        ],
        footer: '<span class="ds-rail-story-tag">Discovery</span>',
      },
      auth: {
        eyebrow: 'Developer story · Step 2',
        headline: 'OAuth token already attached',
        body: 'This demo session’s bearer token is injected — same auth your apps use in production.',
        steps: [
          { icon: '🔑', text: 'Bearer token from session', active: true },
          { icon: '🏛', text: 'Demo account scoped' },
          { icon: '✓', text: 'No extra keys needed' },
        ],
        footer: '<span class="ds-rail-story-tag">Secure call</span>',
      },
      execute: {
        eyebrow: 'Developer story · Step 3',
        headline: 'Live response in milliseconds',
        body: 'Real API round-trip — status code, latency, and JSON body validate your integration before code ships.',
        steps: [
          { icon: '▶', text: 'Run clicked', active: true },
          { icon: '✓', text: '200 OK · 142ms' },
          { icon: '📦', text: 'Envelope list returned' },
        ],
        footer: '<span class="ds-rail-story-tag">Proof it works</span>',
      },
      automate: {
        eyebrow: 'Developer story · Step 4',
        headline: 'Pattern drops into automation',
        body: 'Copy the working call into Workflow Builder, Connect listeners, or CI pipelines — same contract everywhere.',
        steps: [
          { icon: '📋', text: 'Request copied', active: true },
          { icon: '⚡', text: 'Added to AV1 workflow' },
          { icon: '🔄', text: 'Scheduled nightly sync' },
        ],
        footer: '<span class="ds-rail-story-tag ds-rail-story-tag--ok">Production-ready</span>',
      },
    },
    agent: {
      ask: {
        eyebrow: 'Agent story · Step 1',
        headline: 'Natural language request',
        body: 'Staff or a chatbot asks in plain English — the left panel shows API config; this is the autonomous path.',
        steps: [
          { icon: '💬', text: '“Create NDA for new vendor”', active: true },
          { icon: '🤖', text: 'Agent parses intent' },
          { icon: '🎯', text: 'Template identified' },
        ],
        footer: '<span class="ds-rail-story-tag">Human-friendly</span>',
      },
      read: {
        eyebrow: 'Agent story · Step 2',
        headline: 'Agent reads agreement data',
        body: 'Repository search and envelope history inform the next action — grounded in your IAM tenant.',
        steps: [
          { icon: '🔍', text: 'Query agreement store', active: true },
          { icon: '📄', text: 'Standard NDA v4 found' },
          { icon: '🏷', text: 'Vendor context applied' },
        ],
        footer: '<span class="ds-rail-story-tag">Grounded AI</span>',
      },
      act: {
        eyebrow: 'Agent story · Step 3',
        headline: 'Envelope created via API',
        body: 'Agent API executes with the same OAuth session — no shadow IT or duplicate credentials.',
        steps: [
          { icon: '⚡', text: 'POST /envelopes', active: true },
          { icon: '✍', text: 'Signers configured' },
          { icon: '📤', text: 'Sent for signature' },
        ],
        footer: '<span class="ds-rail-story-tag">Action taken</span>',
      },
      reply: {
        eyebrow: 'Agent story · Step 4',
        headline: 'Structured summary returned',
        body: 'Calling system gets envelope ID, status, and next steps — ready for CRM or case management update.',
        steps: [
          { icon: '📨', text: 'JSON summary returned', active: true },
          { icon: '🆔', text: 'Envelope ID attached' },
          { icon: '✓', text: 'Case marked In progress' },
        ],
        footer: '<span class="ds-rail-story-tag ds-rail-story-tag--ok">Closed loop</span>',
      },
    },
  };

  window.DS_RAIL_STORY_ORDER = Object.fromEntries(
    Object.entries(SCENES).map(([sectionId, scenes]) => [sectionId, Object.keys(scenes)])
  );

  window.DS_RAIL_STORY_META = Object.fromEntries(
    Object.entries(SCENES).flatMap(([sectionId, scenes]) =>
      Object.entries(scenes).map(([stepId, scene]) => [
        `${sectionId}:${stepId}`,
        { title: scene.headline, sub: scene.eyebrow },
      ])
    )
  );

  window.DS_RENDER_RAIL = {
    railStory(ctx = {}) {
      const sectionId = ctx.sectionId;
      const stepId = ctx.stepId;
      const scene = SCENES[sectionId]?.[stepId];
      if (!scene) {
        return panel({
          eyebrow: 'Story preview',
          headline: 'Walkthrough unavailable',
          body: 'Use the arrows below to explore the integration story.',
          animate: ctx.animate,
        });
      }
      return panel({ ...scene, animate: ctx.animate === true, _sceneKey: `${sectionId}:${stepId}` });
    },

    govWorkflowValue(ctx = {}) {
      const stepNum = (ctx.stepIndex ?? 0) + 1;
      const total = ctx.totalSteps || 9;
      const pct = Math.round((stepNum / total) * 100);
      const live = ctx.animate ? ' ds-prod-cpv-live' : '';
      const headline = ctx.valueHeadline || ctx.stepTitle || 'Business outcome';
      const body = ctx.valueText || 'See how this step delivers value to agency stakeholders.';
      const audience = ctx.valueAudience || ctx.personaName || 'Agency team';

      return `
        <div class="ds-prod-frame ds-prod-frame--compact ds-rail-story-frame">
          <div class="ds-prod-cpv-panel ds-rail-story-panel ds-rail-story-panel--gov${live}">
            <div class="ds-rail-story-progress${anim(ctx, 1)}">
              <span>Lifecycle ${stepNum} / ${total}</span>
              <div class="ds-rail-story-progress-bar"><div style="width:${pct}%"></div></div>
            </div>
            <p class="ds-rail-story-eyebrow${anim(ctx, 2)}">${ctx.stepProduct || 'IAM Platform'} · Value lens</p>
            <h3 class="ds-rail-story-headline${anim(ctx, 3)}">${headline}</h3>
            <div class="ds-rail-story-visual" aria-hidden="true">${govValueOrb(ctx, { product: ctx.stepProduct })}</div>
            <p class="ds-rail-story-body${anim(ctx, 4)}">${body}</p>
            <ul class="ds-rail-story-steps">
              <li class="ds-rail-story-step ds-rail-story-step--on${anim(ctx, 5)}">
                <span class="ds-rail-story-step-icon">👤</span>
                <span class="ds-rail-story-step-text">${audience}</span>
              </li>
              <li class="ds-rail-story-step ds-rail-story-step--on${anim(ctx, 6)}">
                <span class="ds-rail-story-step-icon">🏛</span>
                <span class="ds-rail-story-step-text">${ctx.stateName || 'State agency'} program</span>
              </li>
            </ul>
            <div class="ds-rail-story-footer${anim(ctx, 7)}">
              <span class="ds-rail-story-tag">Left panel = product UI · Here = business outcome</span>
            </div>
          </div>
        </div>`;
    },
  };
})();
