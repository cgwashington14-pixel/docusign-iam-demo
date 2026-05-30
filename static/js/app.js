// ── Webhook live polling ──────────────────────────────────────────────────────
let lastEventCount = 0;

function pollWebhooks() {
  if (!document.getElementById('event-log')) return;
  fetch('/webhook/events')
    .then(r => r.json())
    .then(events => {
      if (events.length !== lastEventCount) {
        lastEventCount = events.length;
        renderEvents(events);
      }
    })
    .catch(() => {});
}

function renderEvents(events) {
  const log = document.getElementById('event-log');
  if (!log) return;
  if (!events.length) {
    log.innerHTML = '<div class="event-empty">No webhook events received yet.<br>Configure Connect below and send an envelope to see live events.</div>';
    return;
  }
  log.innerHTML = events.slice().reverse().map(e => `
    <div class="event-item">
      <span class="event-time mono">${e.received_at.replace('T',' ').replace('Z','').slice(0,19)}</span>
      <span class="event-type">${e.event || 'envelope'}</span>
      <span>${statusBadge(e.status)}</span>
      <span class="mono text-muted text-xs">${e.envelope_id}</span>
    </div>
  `).join('');
}

function statusBadge(s) {
  const map = {
    completed: 'completed', sent: 'sent', delivered: 'delivered',
    declined: 'declined', voided: 'voided', created: 'created'
  };
  const cls = map[s?.toLowerCase()] || 'sent';
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${s || '—'}</span>`;
}

function clearEvents() {
  fetch('/webhook/clear', { method: 'POST' })
    .then(() => { lastEventCount = 0; renderEvents([]); });
}

// ── API Explorer ──────────────────────────────────────────────────────────────
let activeEndpoint = null;

function selectEndpoint(method, path, desc) {
  activeEndpoint = { method, path };
  document.querySelectorAll('.endpoint-item').forEach(el => el.classList.remove('active'));
  event.currentTarget.classList.add('active');

  const panel = document.getElementById('explorer-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="card" style="margin-top:20px">
      <div class="card-header">
        <div class="flex items-center gap-8">
          <span class="method-badge method-${method}">${method}</span>
          <span class="mono text-sm">${path}</span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="runCall()">Run →</button>
      </div>
      <div class="form-group">
        <label>Path (editable)</label>
        <input type="text" id="call-path" value="${path}" />
      </div>
      ${method !== 'GET' ? `
      <div class="form-group">
        <label>Request Body (JSON)</label>
        <textarea id="call-body" rows="6" placeholder='{}'></textarea>
      </div>` : ''}
      <div id="call-response"></div>
    </div>
  `;
}

function runCall() {
  const path = document.getElementById('call-path')?.value || '';
  const bodyEl = document.getElementById('call-body');
  let body = null;
  if (bodyEl) {
    try { body = JSON.parse(bodyEl.value || '{}'); } catch(e) {
      document.getElementById('call-response').innerHTML =
        '<div class="alert alert-error"><span class="alert-icon">⚠</span><div>Invalid JSON body</div></div>';
      return;
    }
  }

  document.getElementById('call-response').innerHTML =
    '<div style="padding:16px;color:var(--muted);font-size:12px;">Running…</div>';

  fetch('/explorer/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: activeEndpoint.method, path, body })
  })
  .then(r => r.json())
  .then(data => {
    const statusClass = data.status_code < 300 ? '2xx' : data.status_code < 500 ? '4xx' : '5xx';
    const json = JSON.stringify(data.response || data.error, null, 2);
    document.getElementById('call-response').innerHTML = `
      <div class="response-panel mt-16">
        <div class="response-header">
          <span class="status-pill status-${statusClass}">${data.status_code}</span>
          <span class="text-muted text-xs">${data.latency_ms || '—'}ms</span>
          <span class="mono text-xs text-muted" style="margin-left:auto">${data.url || ''}</span>
        </div>
        <div class="response-body">${escHtml(json)}</div>
      </div>
    `;
  })
  .catch(err => {
    document.getElementById('call-response').innerHTML =
      `<div class="alert alert-error mt-16"><span class="alert-icon">⚠</span><div>${err.message}</div></div>`;
  });
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById(tabId);
  if (panel) panel.style.display = 'block';
  event.currentTarget.classList.add('active');
}

// ── Copy to clipboard ─────────────────────────────────────────────────────────
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('event-log')) {
    pollWebhooks();
    setInterval(pollWebhooks, 3000);
  }
});
