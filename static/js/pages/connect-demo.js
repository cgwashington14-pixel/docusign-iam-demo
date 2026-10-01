/* Docusign Connect — business walkthrough, annotated payloads, live log */

const CONNECT_DEMO_META = window.CONNECT_DEMO_META || {
  contract_title: 'Master Services Agreement — Acme IT Solutions',
  department: 'California Department of Technology',
  requester: 'Maria Chen, Program Manager',
  vendor: 'Acme IT Solutions, Inc.',
  envelope_id: '8f3a2b1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
  erp_system: 'FI$Cal',
  register_system: 'Agency Contract Register',
};

const CONNECT_WALKTHROUGH = [
  {
    id: 'sent',
    event: 'envelope-sent',
    status: 'sent',
    flowNodes: [0],
    headline: 'Contract sent for signature',
    plain: 'Procurement sent the MSA to the vendor contact. Docusign notifies your systems that the envelope is out.',
    action: 'Your case tracker can show “Awaiting signature” — no manual status update needed.',
    erpToast: null,
    fieldGuide: [
      { key: 'event', plain: 'What happened — envelope was sent to signers.' },
      { key: 'envelopeId', plain: 'Unique ID — store this in your contract register to match future updates.' },
      { key: 'status', plain: 'Current envelope state: sent.' },
      { key: 'emailSubject', plain: 'Subject line the signer sees in their inbox.' },
    ],
  },
  {
    id: 'delivered',
    event: 'envelope-delivered',
    status: 'delivered',
    flowNodes: [1],
    headline: 'Vendor opened the signing link',
    plain: 'The vendor viewed the agreement. They have not signed yet — useful for follow-up reminders.',
    action: 'Secretary or program staff can see “Viewed” without calling the vendor.',
    erpToast: null,
    fieldGuide: [
      { key: 'event', plain: 'Signer opened the email or signing session.' },
      { key: 'status', plain: 'delivered — viewed but not completed.' },
    ],
  },
  {
    id: 'recipient',
    event: 'recipient-completed',
    status: 'signed',
    flowNodes: [2],
    headline: 'Agency director signed',
    plain: 'One signer finished. If multiple signers remain, the envelope stays open.',
    action: 'Workflow can assign the next task to the vendor counter-signer.',
    erpToast: null,
    fieldGuide: [
      { key: 'event', plain: 'A single recipient completed signing.' },
      { key: 'recipients.signers', plain: 'Array of signers — check each status field.' },
    ],
  },
  {
    id: 'completed',
    event: 'envelope-completed',
    status: 'completed',
    flowNodes: [3],
    headline: 'Contract fully executed',
    plain: 'All parties signed. This is the event most agencies subscribe to for ERP and register updates.',
    action: 'Middleware reads the payload and posts encumbrance + contract metadata to FI$Cal.',
    erpToast: '✓ FI$Cal encumbrance updated · Contract register synced',
    fieldGuide: [
      { key: 'event', plain: 'envelope-completed — the “done” signal for integrations.' },
      { key: 'status', plain: 'completed — legally executed.' },
      { key: 'completedDateTime', plain: 'Official execution timestamp for audit.' },
      { key: 'envelopeId', plain: 'Match to your procurement request ID in middleware.' },
    ],
  },
];

function connectBuildPayload(step) {
  const m = CONNECT_DEMO_META;
  const base = {
    event: step.event,
    apiVersion: 'v2.1',
    uri: `/restapi/v2.1/accounts/{accountId}/envelopes/${m.envelope_id}`,
    retryCount: 0,
    configurationId: 10492831,
    generatedDateTime: new Date().toISOString(),
    data: {
      accountId: 'e6ecbed2-8887-4c87-b290-39a8e3b5d2f1',
      userId: 'a1b2c3d4-0000-4000-8000-000000000001',
      envelopeId: m.envelope_id,
      envelopeSummary: {
        status: step.status === 'signed' ? 'sent' : step.status,
        emailSubject: m.contract_title,
        sender: {
          userName: m.requester.split(',')[0],
          email: 'maria.chen@state.ca.gov',
        },
        completedDateTime: step.event === 'envelope-completed' ? new Date().toISOString() : null,
        recipients: {
          signers: [
            { name: 'Director, CDT', email: 'director@state.ca.gov', status: step.id === 'recipient' || step.id === 'completed' ? 'completed' : 'sent' },
            { name: m.vendor, email: 'signer@acme-it.example.gov', status: step.id === 'completed' ? 'completed' : 'sent' },
          ],
        },
        customFields: {
          textCustomFields: [
            { name: 'ProcurementRequestId', value: 'REQ-2026-4201' },
            { name: 'Department', value: m.department },
          ],
        },
      },
    },
  };
  return base;
}

let connectWalkTimer = null;
let connectWalkIndex = 0;
let connectSelectedStatus = 'envelope-completed';

function connectEl(id) {
  return document.getElementById(id);
}

const CONNECT_PREVIEW_STAGES = {
  sent: { title: 'Step 1 · Docusign', sub: 'Envelope status changes' },
  delivered: { title: 'Step 2 · Connect POST', sub: 'JSON payload to your URL' },
  recipient: { title: 'Step 3 · Your listener', sub: 'Validates & routes the event' },
  completed: { title: 'Step 4 · FI$Cal', sub: 'Register & encumbrance updated' },
};

const CONNECT_WALK_STEP_MS = 4800;
const CONNECT_PREVIEW_SWAP_MS = 450;
const CONNECT_RAIL_MIN_KEY = 'connect-mock-rail-minimized';

function connectRenderProductPreview(step, opts = {}) {
  const host = connectEl('connect-mock-host');
  if (!host || typeof DS_RENDER_MOCK?.connectProductPreview !== 'function') return;

  const m = CONNECT_DEMO_META;
  const stepId = step?.id || 'completed';
  const animate = opts.animate !== false && !!step;

  const html = DS_RENDER_MOCK.connectProductPreview({
    stepId,
    contractTitle: m.contract_title,
    requester: (m.requester || 'Maria Chen').split(',')[0].trim(),
    vendor: m.vendor,
    department: m.department,
    erpSystem: m.erp_system,
    registerSystem: m.register_system,
    envelopeId: m.envelope_id,
    endpoint: window.CONNECT_WEBHOOK_URL || 'https://middleware.state.ca.gov/docusign/connect',
    signerName: 'Director, CDT',
    animate,
  });

  const stage = CONNECT_PREVIEW_STAGES[stepId] || CONNECT_PREVIEW_STAGES.sent;
  const titleEl = connectEl('connect-mock-stage-title');
  const subEl = connectEl('connect-mock-stage-sub');
  const labelsEl = connectEl('connect-mock-stage-labels');
  if (titleEl) titleEl.textContent = stage.title;
  if (subEl) subEl.textContent = stage.sub;
  if (labelsEl && animate) {
    labelsEl.classList.remove('connect-mock-stage-labels--pulse');
    void labelsEl.offsetWidth;
    labelsEl.classList.add('connect-mock-stage-labels--pulse');
  }

  const syncEl = connectEl('connect-mock-sync');
  if (syncEl) syncEl.hidden = !opts.playing;

  const hasPreview = !!host.querySelector('.ds-prod-frame--connect-preview');
  const shouldSwap = hasPreview && (opts.transition !== false) && animate;

  const mount = () => {
    host.innerHTML = html;
    host.classList.remove('connect-mock-host--swap-out');
    host.classList.add('connect-mock-host--swap-in');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => host.classList.remove('connect-mock-host--swap-in'));
    });
    host.removeAttribute('aria-busy');
  };

  if (shouldSwap) {
    host.classList.add('connect-mock-host--swap-out');
    setTimeout(mount, CONNECT_PREVIEW_SWAP_MS);
  } else {
    mount();
  }
}

function connectRenderFlow(activeNodes = []) {
  const nodes = document.querySelectorAll('.connect-node');
  nodes.forEach((node, i) => {
    node.classList.remove('connect-node--active', 'connect-node--done');
    if (activeNodes.includes(i)) node.classList.add('connect-node--active');
    if (activeNodes.length && i < Math.max(...activeNodes)) node.classList.add('connect-node--done');
  });
  document.querySelectorAll('.connect-flow-arrow').forEach((arrow, i) => {
    arrow.classList.toggle('connect-flow-arrow--active', activeNodes.includes(i + 1) || activeNodes.includes(i));
  });
}

function connectRenderTimeline(activeId) {
  document.querySelectorAll('.connect-timeline-step').forEach(el => {
    const id = el.dataset.stepId;
    el.classList.remove('connect-timeline-step--active', 'connect-timeline-step--done');
    const idx = CONNECT_WALKTHROUGH.findIndex(s => s.id === id);
    const activeIdx = CONNECT_WALKTHROUGH.findIndex(s => s.id === activeId);
    if (id === activeId) el.classList.add('connect-timeline-step--active');
    else if (idx >= 0 && idx < activeIdx) el.classList.add('connect-timeline-step--done');
  });
}

function connectRenderFieldGuide(guide) {
  const box = connectEl('connect-field-guide');
  if (!box || !guide) return;
  box.innerHTML = guide.map(f => `
    <div class="connect-field-item">
      <div class="connect-field-key">${f.key}</div>
      <div class="connect-field-plain">${f.plain}</div>
    </div>`).join('');
}

function connectRenderPayload(step) {
  const payload = connectBuildPayload(step);
  const pre = connectEl('connect-payload-pre');
  if (pre) pre.textContent = JSON.stringify(payload, null, 2);
  connectRenderFieldGuide(step.fieldGuide);
  const label = connectEl('connect-payload-event-label');
  if (label) label.textContent = step.event;
}

function connectShowErpToast(msg) {
  const toast = connectEl('connect-erp-toast');
  if (!toast || !msg) return;
  toast.textContent = msg;
  toast.classList.add('connect-erp-toast--show');
  setTimeout(() => toast.classList.remove('connect-erp-toast--show'), 3200);
}

function connectShowErpReveal(step) {
  const reveal = connectEl('connect-erp-reveal');
  const mount = connectEl('connect-erp-sync-mount');
  if (!reveal || !mount) return;

  if (step && step.id === 'completed' && typeof erpSyncCalloutHtml === 'function') {
    const m = CONNECT_DEMO_META;
    mount.innerHTML = erpSyncCalloutHtml({
      vendor: m.vendor || 'Acme IT Solutions, Inc.',
      erp: m.erp_system || 'FI$Cal',
      value: '$890,000/yr',
      sub: 'This is the payoff: Connect delivers the webhook, your middleware maps fields from the JSON, and FI$Cal plus the contract register update automatically — staff see the new row below.',
    });
    reveal.hidden = false;
    requestAnimationFrame(() => {
      reveal.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  } else {
    reveal.hidden = true;
  }
}

function connectToggleMockRail(forceMinimized) {
  const root = connectEl('connect-demo-root');
  const rail = connectEl('connect-mock-rail');
  const btn = connectEl('connect-mock-minimize-btn');
  if (!root || !rail) return;

  const minimized = typeof forceMinimized === 'boolean'
    ? forceMinimized
    : !root.classList.contains('connect-demo-root--rail-minimized');

  root.classList.toggle('connect-demo-root--rail-minimized', minimized);
  rail.classList.toggle('connect-mock-rail--minimized', minimized);

  if (btn) {
    btn.setAttribute('aria-expanded', minimized ? 'false' : 'true');
    btn.setAttribute('aria-label', minimized ? 'Expand product preview' : 'Minimize product preview');
    btn.title = minimized ? 'Expand panel' : 'Minimize panel';
    const icon = btn.querySelector('.connect-mock-minimize-icon');
    if (icon) icon.textContent = minimized ? '‹' : '›';
  }

  try {
    localStorage.setItem(CONNECT_RAIL_MIN_KEY, minimized ? '1' : '0');
  } catch (_) { /* ignore */ }
}

function connectInitRailState() {
  try {
    if (localStorage.getItem(CONNECT_RAIL_MIN_KEY) === '1') {
      connectToggleMockRail(true);
    }
  } catch (_) { /* ignore */ }
}

function connectUpdateStepControls() {
  const max = CONNECT_WALKTHROUGH.length - 1;
  const atStart = connectWalkIndex <= 0;
  const atEnd = connectWalkIndex >= max;
  const stepNum = connectWalkIndex + 1;
  const total = CONNECT_WALKTHROUGH.length;

  ['connect-step-prev', 'connect-mock-step-prev'].forEach(id => {
    const btn = connectEl(id);
    if (btn) btn.disabled = atStart;
  });
  ['connect-step-next', 'connect-mock-step-next'].forEach(id => {
    const btn = connectEl(id);
    if (btn) btn.disabled = atEnd;
  });

  const counter = connectEl('connect-step-counter');
  if (counter) counter.textContent = `Step ${stepNum} of ${total}`;

  const railCounter = connectEl('connect-mock-step-counter');
  if (railCounter) railCounter.textContent = `${stepNum} / ${total}`;
}

function connectStepPrev() {
  connectStopWalkthrough();
  if (connectWalkIndex > 0) connectGoToStep(connectWalkIndex - 1);
  connectUpdateStepControls();
}

function connectStepNext() {
  connectStopWalkthrough();
  if (connectWalkIndex < CONNECT_WALKTHROUGH.length - 1) connectGoToStep(connectWalkIndex + 1);
  connectUpdateStepControls();
}

function connectGoToStep(index) {
  const step = CONNECT_WALKTHROUGH[index];
  if (!step) return;
  connectWalkIndex = index;
  connectRenderFlow(step.flowNodes);
  connectRenderTimeline(step.id);
  connectRenderProductPreview(step, { playing: !!connectWalkTimer, animate: true, transition: true });
  connectRenderPayload(step);
  connectShowErpReveal(step);
  if (step.erpToast) connectShowErpToast(step.erpToast);
  const statusCards = document.querySelectorAll('.connect-status-card');
  statusCards.forEach(c => c.classList.toggle('connect-status-card--selected', c.dataset.event === step.event));
  connectUpdateStepControls();
}

function connectStopWalkthrough() {
  if (connectWalkTimer) {
    clearInterval(connectWalkTimer);
    connectWalkTimer = null;
  }
  const btn = connectEl('connect-play-btn');
  if (btn) {
    btn.classList.remove('is-playing');
    btn.innerHTML = '▶ Play sample walkthrough';
  }
  connectEl('connect-mock-rail')?.classList.remove('connect-mock-rail--playing');
}

function connectResetWalkthrough() {
  connectStopWalkthrough();
  connectEl('connect-erp-reveal') && (connectEl('connect-erp-reveal').hidden = true);
  connectWalkIndex = 0;
  document.querySelectorAll('.connect-status-card').forEach(c => {
    c.classList.toggle('connect-status-card--selected', c.dataset.event === 'envelope-sent');
  });
  connectPlayWalkthrough();
}

function connectPlayWalkthrough() {
  const btn = connectEl('connect-play-btn');
  if (connectWalkTimer) {
    connectStopWalkthrough();
    return;
  }
  connectEl('connect-erp-reveal') && (connectEl('connect-erp-reveal').hidden = true);
  connectWalkIndex = 0;
  if (btn) {
    btn.classList.add('is-playing');
    btn.innerHTML = '■ Stop walkthrough';
  }
  connectEl('connect-mock-rail')?.classList.add('connect-mock-rail--playing');
  connectGoToStep(0);
  connectWalkTimer = setInterval(() => {
    connectWalkIndex += 1;
    if (connectWalkIndex >= CONNECT_WALKTHROUGH.length) {
      clearInterval(connectWalkTimer);
      connectWalkTimer = null;
      if (btn) {
        btn.classList.remove('is-playing');
        btn.innerHTML = '▶ Play sample walkthrough';
      }
      connectEl('connect-mock-rail')?.classList.remove('connect-mock-rail--playing');
      connectUpdateStepControls();
      return;
    }
    connectGoToStep(connectWalkIndex);
  }, CONNECT_WALK_STEP_MS);
}

function connectSelectStatus(eventName) {
  connectSelectedStatus = eventName;
  const fromGuide = (window.CONNECT_STATUS_GUIDE || []).find(s => s.event === eventName);
  const fromWalk = CONNECT_WALKTHROUGH.find(s => s.event === eventName);
  const step = fromWalk || {
    event: eventName,
    status: fromGuide?.status || 'sent',
    fieldGuide: [
      { key: 'event', plain: fromGuide?.plain || 'Connect event notification.' },
      { key: 'status', plain: 'Envelope or recipient status at time of event.' },
    ],
  };
  if (fromGuide && !fromWalk) {
    step.headline = fromGuide.headline;
    step.plain = fromGuide.plain;
    step.action = fromGuide.action;
  }
  if (fromWalk) {
    connectStopWalkthrough();
    connectWalkIndex = CONNECT_WALKTHROUGH.findIndex(s => s.id === fromWalk.id);
    connectGoToStep(connectWalkIndex);
    return;
  }
  connectRenderPayload(step);
  if (eventName === 'envelope-completed') {
    connectShowErpReveal({ id: 'completed' });
  } else {
    connectShowErpReveal(null);
  }
  document.querySelectorAll('.connect-status-card').forEach(c => {
    c.classList.toggle('connect-status-card--selected', c.dataset.event === eventName);
  });
  const label = connectEl('connect-payload-event-label');
  if (label) label.textContent = eventName;
}

function connectEventPlainSummary(e) {
  const map = {
    'envelope-sent': 'Agreement emailed to signers — mark as “Out for signature” in your tracker.',
    'envelope-delivered': 'Signer opened the link — good time for a friendly reminder if needed.',
    'envelope-completed': 'Fully signed — update FI$Cal, contract register, and notify finance.',
    'recipient-completed': 'One signer finished — check if others still pending.',
    'envelope-declined': 'Signer refused — alert contracts team immediately.',
    'envelope-voided': 'Envelope cancelled — reverse any pending holds.',
  };
  return map[e.event] || 'Docusign Connect pushed a status update to your listener endpoint.';
}

function connectRenderLiveEvents(events) {
  const log = connectEl('event-log');
  const countEl = connectEl('event-count');
  if (!log) return;
  if (countEl) countEl.textContent = `${events.length} event${events.length !== 1 ? 's' : ''}`;

  if (!events.length) {
    log.innerHTML = '<div class="event-empty">No live events yet.<br>Configure Connect with the URL above, or use <strong>Play sample walkthrough</strong> to see how payloads look.</div>';
    return;
  }

  log.innerHTML = events.slice().reverse().map(e => {
    const badge = typeof statusBadge === 'function' ? statusBadge(e.status) : `<span class="badge sent">${e.status || '—'}</span>`;
    const time = (e.received_at || '').replace('T', ' ').replace('Z', '').slice(0, 19);
    return `
      <div class="event-item" data-event-id="${e.id}" onclick="connectToggleEventDetail(${e.id})" role="button" tabindex="0" aria-expanded="false">
        <span class="event-time mono">${time}</span>
        <span class="event-type">${e.event || 'envelope'}</span>
        ${badge}
        <span class="mono text-muted text-xs">${e.envelope_id || '—'}</span>
        <div class="connect-event-detail" id="connect-event-detail-${e.id}" hidden>
          <p>${connectEventPlainSummary(e)}</p>
          ${e.raw ? `<pre class="code-block" style="margin-top:8px;font-size:12px;max-height:200px;overflow:auto">${e.raw.replace(/</g, '&lt;')}</pre>` : ''}
        </div>
      </div>`;
  }).join('');
}

function connectToggleEventDetail(id) {
  const detail = connectEl(`connect-event-detail-${id}`);
  const row = document.querySelector(`.event-item[data-event-id="${id}"]`);
  if (!detail || !row) return;
  const open = detail.hidden;
  detail.hidden = !open;
  row.classList.toggle('event-item--expanded', open);
  row.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function connectInitPolling() {
  let lastCount = 0;
  function poll() {
    if (!connectEl('event-log')) return;
    fetch('/webhook/events')
      .then(r => r.json())
      .then(events => {
        if (events.length !== lastCount) {
          lastCount = events.length;
          connectRenderLiveEvents(events);
        }
      })
      .catch(() => {});
  }
  poll();
  setInterval(poll, 3000);
}

function connectInit() {
  if (!connectEl('connect-demo-root')) return;

  connectRenderFlow([3]);
  const completed = CONNECT_WALKTHROUGH.find(s => s.id === 'completed');
  if (completed) {
    connectRenderPayload(completed);
    connectRenderProductPreview(completed, { animate: false });
  } else {
    connectRenderProductPreview({ id: 'sent' }, { animate: false });
  }
  connectEl('connect-erp-reveal') && (connectEl('connect-erp-reveal').hidden = true);
  document.querySelectorAll('.connect-status-card').forEach(c => {
    c.classList.toggle('connect-status-card--selected', c.dataset.event === 'envelope-completed');
  });

  connectWalkIndex = completed ? CONNECT_WALKTHROUGH.length - 1 : 0;
  connectUpdateStepControls();

  document.querySelectorAll('.connect-timeline-step').forEach(el => {
    el.classList.add('connect-timeline-step--clickable');
    el.setAttribute('role', 'button');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    const goTimelineStep = () => {
      const idx = CONNECT_WALKTHROUGH.findIndex(s => s.id === el.dataset.stepId);
      if (idx >= 0) {
        connectStopWalkthrough();
        connectGoToStep(idx);
      }
    };
    el.addEventListener('click', goTimelineStep);
    el.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        goTimelineStep();
      }
    });
  });

  document.addEventListener('keydown', ev => {
    if (!connectEl('connect-demo-root')) return;
    if (ev.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      connectStepPrev();
    } else if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      connectStepNext();
    }
  });

  document.querySelectorAll('.connect-status-card').forEach(card => {
    card.addEventListener('click', () => connectSelectStatus(card.dataset.event));
    card.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        connectSelectStatus(card.dataset.event);
      }
    });
  });

  connectEl('event-log')?.addEventListener('keydown', ev => {
    const row = ev.target.closest('.event-item[data-event-id]');
    if (!row || (ev.key !== 'Enter' && ev.key !== ' ')) return;
    ev.preventDefault();
    connectToggleEventDetail(Number(row.dataset.eventId));
  });

  connectInitRailState();

  connectEl('connect-mock-rail-head')?.addEventListener('click', ev => {
    const root = connectEl('connect-demo-root');
    if (!root?.classList.contains('connect-demo-root--rail-minimized')) return;
    if (ev.target.closest('.connect-mock-minimize-btn')) return;
    connectToggleMockRail(false);
  });

  connectInitPolling();
}

window.connectPlayWalkthrough = connectPlayWalkthrough;
window.connectResetWalkthrough = connectResetWalkthrough;
window.connectStepPrev = connectStepPrev;
window.connectStepNext = connectStepNext;
window.connectToggleMockRail = connectToggleMockRail;
window.connectSelectStatus = connectSelectStatus;
window.connectToggleEventDetail = connectToggleEventDetail;

document.addEventListener('DOMContentLoaded', connectInit);
