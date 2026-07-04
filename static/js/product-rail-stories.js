/* Animated story scenes for the minimizable preview rail — separate from inline UI mocks */

(function () {
  function anim(ctx, n) {
    return ctx.animate ? ` ds-prod-cpv-rise ds-prod-cpv-d${n}` : '';
  }

  function stepLi(ctx, s, i) {
    const on = ctx.animate && s.active !== false;
    return `<li class="ds-rail-story-step${on ? ' ds-rail-story-step--on' : ''}${anim(ctx, i + 3)}">
      <span class="ds-rail-story-step-icon" aria-hidden="true">${s.icon}</span>
      <span class="ds-rail-story-step-text">${s.text}</span>
    </li>`;
  }

  function panel(ctx) {
    const live = ctx.animate ? ' ds-prod-cpv-live' : '';
    const steps = (ctx.steps || []).map((s, i) => stepLi(ctx, s, i)).join('');
    return `
      <div class="ds-prod-frame ds-prod-frame--compact ds-rail-story-frame">
        <div class="ds-prod-cpv-panel ds-rail-story-panel${live}">
          <p class="ds-rail-story-eyebrow${anim(ctx, 1)}">${ctx.eyebrow}</p>
          <h3 class="ds-rail-story-headline${anim(ctx, 2)}">${ctx.headline}</h3>
          <p class="ds-rail-story-body${anim(ctx, 2)}">${ctx.body}</p>
          ${steps ? `<ul class="ds-rail-story-steps">${steps}</ul>` : ''}
          ${ctx.footer ? `<div class="ds-rail-story-footer${anim(ctx, 6)}">${ctx.footer}</div>` : ''}
        </div>
      </div>`;
  }

  const SCENES = {
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
      return panel({ ...scene, animate: ctx.animate === true });
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
            <p class="ds-rail-story-body${anim(ctx, 3)}">${body}</p>
            <ul class="ds-rail-story-steps">
              <li class="ds-rail-story-step ds-rail-story-step--on${anim(ctx, 4)}">
                <span class="ds-rail-story-step-icon">👤</span>
                <span class="ds-rail-story-step-text">${audience}</span>
              </li>
              <li class="ds-rail-story-step ds-rail-story-step--on${anim(ctx, 5)}">
                <span class="ds-rail-story-step-icon">🏛</span>
                <span class="ds-rail-story-step-text">${ctx.stateName || 'State agency'} program</span>
              </li>
            </ul>
            <div class="ds-rail-story-footer${anim(ctx, 6)}">
              <span class="ds-rail-story-tag">Left panel = product UI · Here = business outcome</span>
            </div>
          </div>
        </div>`;
    },
  };
})();
