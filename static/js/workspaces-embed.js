/* Workspaces — live API demo + California EDD branded open hub */

const WS_EDD_DEFAULTS = {
  agencyName: 'California Employment Development Department',
  agencyShort: 'EDD',
  agencyTagline: 'Vendor Onboarding Hub',
  participantName: 'Priya Nair',
  participantTitle: 'Contracts Officer · California Employment Development Department',
  vendorName: 'David Park',
  vendorCompany: 'Acme Staffing Solutions, Inc.',
  workspaceTitle: 'CA EDD Vendor Onboarding — Acme Staffing',
};

let wsHubState = {
  id: null,
  name: null,
  view: 'admin',
  ctx: null,
};

function wsEscape(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wsBaseCtx(overrides = {}) {
  const pageCtx = (typeof window !== 'undefined' && window.DS_WS_CONTEXT) || {};
  return {
    ...WS_EDD_DEFAULTS,
    ...pageCtx,
    branded: true,
    ...overrides,
  };
}

function wsCtxFromOnboarding(name, onboard = {}, filesPayload = {}) {
  const docs = onboard.documents || [];
  const uploads = onboard.upload_requests || filesPayload.upload_requests || [];
  const envelopes = onboard.envelopes || filesPayload.envelopes || [];
  const signItems = (docs.length ? docs : envelopes.filter((e) => e.source === 'esign')).map((d) => ({
    name: d.name || d.filename || 'Agreement',
    recipient: WS_EDD_DEFAULTS.vendorName,
    status: d.status || 'Created',
    date: new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
    kind: 'Envelope',
  }));
  const uploadRows = uploads.map((u) => ({
    name: u.name || 'Upload request',
    recipient: WS_EDD_DEFAULTS.vendorName,
    status: (u.status || 'draft').replace(/^\w/, (c) => c.toUpperCase()),
    date: new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
  }));
  const tasks = [
    ...signItems.map((s) => ({
      type: 'sign',
      title: `${s.name}.pdf`,
      sender: `${WS_EDD_DEFAULTS.participantName} · EDD Contracts`,
      date: new Date().toLocaleDateString('en-US'),
      status: 'Needs your signature',
      cta: 'Sign',
    })),
    ...uploadRows.slice(0, 2).map((u) => ({
      type: 'upload',
      title: u.name,
      sender: `${WS_EDD_DEFAULTS.participantName} · EDD Contracts`,
      date: new Date().toLocaleDateString('en-US'),
      status: 'Upload requested',
      cta: 'Upload',
    })),
  ];
  return wsBaseCtx({
    workspaceTitle: name || WS_EDD_DEFAULTS.workspaceTitle,
    uploadRequests: uploadRows.length ? uploadRows : undefined,
    signItems: signItems.length ? signItems : undefined,
    tasks: tasks.length ? tasks : undefined,
    summary: {
      uploads: uploadRows.length || uploads.length || 3,
      envelopes: signItems.length || Math.max(envelopes.length, 2),
      participants: onboard.vendor_user_id ? 2 : 2,
    },
  });
}

function wsRenderHub(ctx, view, { stayLive = true } = {}) {
  const host = document.getElementById('ws-open-hub');
  const wrap = document.getElementById('ws-open-wrap');
  const titleEl = document.getElementById('ws-open-title');
  if (!host || !wrap) return;
  const mockKey = view === 'participant' ? 'workspaceParticipant' : 'workspaceAdmin';
  const fn = (typeof DS_RENDER_MOCK === 'object' && DS_RENDER_MOCK[mockKey]) || null;
  if (!fn) {
    host.innerHTML = '<div style="padding:24px;color:var(--muted)">Product mock unavailable — refresh the page.</div>';
    wrap.style.display = 'block';
    return;
  }
  host.innerHTML = fn(ctx);
  wrap.style.display = 'block';
  if (titleEl) titleEl.textContent = ctx.workspaceTitle || 'Open EDD workspace';
  document.getElementById('ws-view-admin')?.classList.toggle('btn-secondary', view === 'admin');
  document.getElementById('ws-view-admin')?.classList.toggle('btn-ghost', view !== 'admin');
  document.getElementById('ws-view-participant')?.classList.toggle('btn-secondary', view === 'participant');
  document.getElementById('ws-view-participant')?.classList.toggle('btn-ghost', view !== 'participant');
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (typeof dsSwitchMock === 'function') {
    dsSwitchMock('workspaces', mockKey, ctx);
  }
  // Keep live demo visible when inspecting a real workspace + files
  if (stayLive) {
    if (typeof dsOpenLive === 'function') dsOpenLive('workspaces');
  } else if (typeof dsShowPreview === 'function') {
    dsShowPreview('workspaces');
  }
}

function wsSetHubView(view) {
  wsHubState.view = view === 'participant' ? 'participant' : 'admin';
  if (wsHubState.ctx) wsRenderHub(wsHubState.ctx, wsHubState.view, { stayLive: !!wsHubState.id });
}

function wsOpenEddDemo() {
  const ctx = wsBaseCtx();
  wsHubState = { id: null, name: ctx.workspaceTitle, view: 'admin', ctx };
  wsRenderHub(ctx, 'admin', { stayLive: false });
  const filesEl = document.getElementById('ws-files-panel');
  if (filesEl) {
    filesEl.style.display = 'none';
    filesEl.innerHTML = '';
  }
  if (typeof showToast === 'function') showToast('Opened California EDD hub preview', 'success');
}

async function wsOpenLiveHub(id, name, onboard = null) {
  wsHubState.id = id;
  wsHubState.name = name;
  const filesEl = document.getElementById('ws-files-panel');
  if (filesEl) {
    filesEl.style.display = 'block';
    filesEl.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:14px">Loading documents, envelopes, and upload requests…</div>';
  }
  let filesPayload = {};
  try {
    const res = await fetch(`/api/workspaces/${id}/files`);
    filesPayload = await res.json();
    if (!res.ok) throw new Error(filesPayload.error || `Could not list files (HTTP ${res.status})`);
  } catch (err) {
    if (filesEl) {
      filesEl.innerHTML = `<div class="alert alert-error" style="margin:0"><span>⚠</span><div>
        <div class="alert-title">Could not load files</div>
        <div class="alert-detail">${wsEscape(err.message)}</div>
        <div style="margin-top:8px"><button type="button" class="btn btn-secondary btn-sm" onclick="wsLoadFiles(${JSON.stringify(String(id))})">Try again</button></div>
      </div></div>`;
    }
  }
  const ctx = wsCtxFromOnboarding(name, onboard || {}, filesPayload);
  wsHubState.ctx = ctx;
  wsHubState.view = 'admin';
  wsRenderHub(ctx, 'admin', { stayLive: true });
  if (filesEl && !filesEl.querySelector('.alert-error')) {
    wsRenderFilesPanel(filesEl, filesPayload, { workspaceId: id, workspaceName: name });
  }
  wsHighlightSelectedRow(id);
}

function wsHighlightSelectedRow(id) {
  document.querySelectorAll('[data-ws-row]').forEach((row) => {
    const selected = row.getAttribute('data-ws-row') === String(id);
    row.classList.toggle('ws-row-selected', selected);
    row.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
}

function wsFileLabel(item) {
  return item.name || item.document_name || item.filename || item.title
    || item.envelope_name || item.upload_request_name || 'Untitled';
}

function wsFileId(item) {
  return item.document_id || item.documentId || item.envelope_id || item.envelopeId
    || item.upload_request_id || item.uploadRequestId || '';
}

function wsRenderFilesPanel(filesEl, data, meta = {}) {
  const files = data.files || [];
  const uploads = data.upload_requests || [];
  const envelopes = data.envelopes || [];
  const total = files.length + uploads.length + envelopes.length;
  const title = meta.workspaceName ? wsEscape(meta.workspaceName) : 'Selected workspace';

  const rowHtml = (kind, icon, item) => {
    const label = wsEscape(wsFileLabel(item));
    const id = wsEscape(wsFileId(item));
    const status = wsEscape(item.status || item.content_type || kind);
    return `<tr>
      <td style="padding:10px 12px;width:36px">${icon}</td>
      <td style="padding:10px 12px">
        <div style="font-weight:600;color:var(--text)">${label}</div>
        <div class="mono text-xs text-muted" style="margin-top:2px">${id ? id.slice(0, 28) + (id.length > 28 ? '…' : '') : '—'}</div>
      </td>
      <td style="padding:10px 12px;font-size:13px;color:var(--muted)">${kind}</td>
      <td style="padding:10px 12px;font-size:13px"><span class="badge completed"><span class="badge-dot"></span>${status}</span></td>
    </tr>`;
  };

  let body = '';
  if (envelopes.length) {
    body += envelopes.map((e) => rowHtml('Envelope', '✍', e)).join('');
  }
  if (files.length) {
    body += files.map((f) => rowHtml('Document', '📄', f)).join('');
  }
  if (uploads.length) {
    body += uploads.map((u) => rowHtml('Upload request', '⬆', u)).join('');
  }

  filesEl.innerHTML = `
    <div class="ws-files-browser">
      <div class="ws-files-browser-head">
        <div>
          <div class="ws-files-browser-title">Files in this workspace</div>
          <div class="ws-files-browser-sub">${title} · ${total} item${total === 1 ? '' : 's'} · GET /api/workspaces/{id}/files</div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="wsLoadFiles(${JSON.stringify(String(meta.workspaceId || wsHubState.id || ''))})">↻ Refresh files</button>
      </div>
      ${total ? `<div class="table-wrap"><table class="ws-files-table">
        <thead><tr>
          <th></th>
          <th>Name</th>
          <th>Type</th>
          <th>Status</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table></div>` : `<div class="ws-files-empty">No documents, envelopes, or upload requests in this workspace yet.</div>`}
      <details style="margin-top:12px">
        <summary style="cursor:pointer;font-size:13px;font-weight:600;color:var(--muted)">Raw API JSON</summary>
        <pre class="code-block" style="font-size:12px;margin-top:8px;max-height:240px;overflow:auto">${wsEscape(JSON.stringify({
          files, envelopes, upload_requests: uploads, count: data.count,
        }, null, 2))}</pre>
      </details>
    </div>`;
}

async function wsRefreshList() {
  const table = document.getElementById('ws-live-table');
  const count = document.getElementById('ws-live-count');
  const status = document.getElementById('ws-live-status');
  if (!table) return;
  if (status) status.textContent = 'Loading workspaces…';
  table.innerHTML = (typeof apiDemoRenderCard === 'function'
    ? apiDemoRenderCard({ running: 'Listing agreement hubs in your demo account…' }, { phase: 'running' })
    : '') + (typeof dsSkeletonBlock === 'function' ? dsSkeletonBlock(4) : '<div style="padding:16px;color:var(--muted);font-size:14px">Loading…</div>');
  try {
    const res = await fetch('/api/workspaces');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not list workspaces');
    if (count) count.textContent = `${data.count || 0} found`;
    if (status) status.textContent = 'GET /api/workspaces → 200';
    const afterHtml = typeof apiDemoRenderCard === 'function'
      ? apiDemoRenderCard(
          typeof apiDemoForExplorer === 'function' ? apiDemoForExplorer('GET', '/workspaces', 'Workspaces', '') : null,
          { phase: 'after', extra: typeof apiDemoInterpretResponse === 'function'
            ? apiDemoInterpretResponse(null, 200, data)
            : `${data.count || 0} workspace(s) ready to open.` })
      : '';
    if (!data.workspaces?.length) {
      table.innerHTML = afterHtml + '<div style="padding:24px;text-align:center;color:var(--muted);font-size:14px">No workspaces yet — create one below to start a dynamic hub.</div>';
      return;
    }
    const rows = data.workspaces.map(w => {
      const id = w.workspaceId || w.workspace_id || '';
      const nm = w.workspaceName || w.name || '—';
      const safeName = nm.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const selected = wsHubState.id && String(wsHubState.id) === String(id);
      return `
      <tr data-ws-row="${wsEscape(id)}" class="${selected ? 'ws-row-selected' : ''}" aria-selected="${selected ? 'true' : 'false'}"
          style="border-bottom:1px solid var(--border-subtle);cursor:pointer"
          onclick="wsSelectWorkspace('${id}', '${safeName}')">
        <td style="padding:10px 12px;font-weight:500">${wsEscape(nm)}</td>
        <td style="padding:10px 12px;font-family:monospace;font-size:13px;color:var(--muted)">${wsEscape(String(id).slice(0, 20))}…</td>
        <td style="padding:10px 12px"><span class="badge completed"><span class="badge-dot"></span>${wsEscape(w.status || 'active')}</span></td>
        <td style="padding:10px 12px;font-size:13px;color:var(--muted)">${wsEscape(w.created || w.created_date || '—')}</td>
        <td style="padding:10px 12px;display:flex;gap:6px;flex-wrap:wrap">
          <button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation();wsSelectWorkspace('${id}', '${safeName}')">View files</button>
        </td>
      </tr>`;
    }).join('');
    table.innerHTML = afterHtml + `<table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="border-bottom:1px solid var(--border)">
        <th style="text-align:left;padding:8px 12px;color:var(--muted)">Name</th>
        <th style="text-align:left;padding:8px 12px;color:var(--muted)">ID</th>
        <th style="text-align:left;padding:8px 12px;color:var(--muted)">Status</th>
        <th style="text-align:left;padding:8px 12px;color:var(--muted)">Created</th>
        <th style="text-align:left;padding:8px 12px;color:var(--muted)"></th>
      </tr></thead><tbody>${rows}</tbody></table>`;
    if (wsHubState.id) wsHighlightSelectedRow(wsHubState.id);
  } catch (e) {
    if (status) status.textContent = e.message;
    table.innerHTML = typeof dsErrorRetry === 'function'
      ? dsErrorRetry(e.message, 'wsRefreshList')
      : `<div style="padding:16px;color:var(--red);font-size:14px">${wsEscape(e.message)}</div>`;
  }
}

async function wsCreateWorkspace() {
  const nameInput = document.getElementById('ws-create-name');
  const seedInput = document.getElementById('ws-seed-onboarding');
  const resultEl = document.getElementById('ws-create-result');
  const name = (nameInput?.value || '').trim() || WS_EDD_DEFAULTS.workspaceTitle;
  const seed = seedInput ? !!seedInput.checked : true;
  const narration = typeof apiDemoForExplorer === 'function'
    ? apiDemoForExplorer('POST', '/workspaces', 'Workspaces', 'Create dynamic workspace hub')
    : null;
  if (resultEl) {
    resultEl.innerHTML = (typeof apiDemoRenderCard === 'function' ? apiDemoRenderCard(narration, { phase: 'running' }) : '')
      + `<div style="color:var(--muted);font-size:14px">POST /api/workspaces${seed ? ' + EDD onboarding pack…' : '…'}</div>`;
  }
  try {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceName: name, name, seed }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Create failed');
    const wsId = data.workspaceId || data.workspace_id;
    const wsName = data.workspaceName || data.name || name;
    const onboard = data.onboarding || {};
    const docs = onboard.documents || [];
    const envs = onboard.envelopes || [];
    const uploads = onboard.upload_requests || [];
    const summaryBits = [];
    if (docs.length) summaryBits.push(`${docs.length} document(s) to sign`);
    if (envs.length) summaryBits.push(`${envs.length} envelope(s)`);
    if (uploads.length) summaryBits.push(`${uploads.length} upload request(s)`);
    const packLine = summaryBits.length
      ? `<div class="alert-detail" style="margin-top:6px">${summaryBits.join(' · ')} staged for CA EDD vendor onboarding.</div>
         <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:var(--muted);line-height:1.6">
           ${docs.map(d => `<li>Sign: ${wsEscape(d.name || d.filename)}</li>`).join('')}
           ${uploads.map(u => `<li>Upload: ${wsEscape(u.name)}</li>`).join('')}
         </ul>`
      : (seed ? '<div class="alert-detail" style="margin-top:6px">Onboarding seed ran — open the branded hub below.</div>' : '');
    if (resultEl) {
      const afterText = typeof apiDemoInterpretResponse === 'function'
        ? apiDemoInterpretResponse(narration, 200, data)
        : 'Workspace created — EDD vendor pack staged.';
      resultEl.innerHTML = (typeof apiDemoRenderCard === 'function' ? apiDemoRenderCard(narration, { phase: 'after', extra: afterText }) : '')
        + `<div class="alert alert-success"><span>✓</span><div>
        <div class="alert-title">Workspace created</div>
        <div class="alert-detail mono">${wsEscape(wsName)} · ${wsEscape(wsId)}</div>
        ${packLine}
        <div style="margin-top:10px"><button type="button" class="btn btn-primary btn-sm" data-ws-open="${String(wsId).replace(/"/g, '')}" data-ws-name="${String(wsName).replace(/"/g, '&quot;')}">Open EDD-branded hub →</button></div>
        </div></div>`;
      resultEl.querySelector('[data-ws-open]')?.addEventListener('click', (ev) => {
        const btn = ev.currentTarget;
        wsSelectWorkspace(btn.getAttribute('data-ws-open'), btn.getAttribute('data-ws-name') || wsName, onboard);
      });
    }
    if (typeof showToast === 'function') {
      showToast(summaryBits.length ? `EDD hub ready · ${summaryBits.join(', ')}` : 'Workspace created via API', 'success');
    }
    wsRefreshList();
    if (wsId) await wsSelectWorkspace(wsId, wsName, onboard);
  } catch (e) {
    if (resultEl) {
      const needsReauth = /scope|consent|dtr\.|refresh token/i.test(e.message || '');
      resultEl.innerHTML = `<div class="alert alert-error"><span>⚠</span><div>
        <div class="alert-title">Could not create workspace</div>
        <div class="alert-detail">${wsEscape(e.message)}</div>
        ${needsReauth ? '<div style="margin-top:10px"><a class="btn btn-primary btn-sm" href="/oauth/login?next=/workspaces">Refresh Token →</a></div>' : ''}
        </div></div>`;
    }
  }
}

async function wsSelectWorkspace(id, name, onboard = null) {
  const detailEl = document.getElementById('ws-detail-panel');
  if (detailEl) detailEl.innerHTML = '<div style="padding:12px;color:var(--muted);font-size:14px">Loading workspace details…</div>';
  try {
    const res = await fetch(`/api/workspaces/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load workspace');
    if (detailEl) {
      detailEl.innerHTML = `<div class="code-block" style="font-size:13px;max-height:220px;overflow:auto">${wsEscape(JSON.stringify(data, null, 2))}</div>`;
    }
    await wsOpenLiveHub(id, name || data.workspaceName || data.name, onboard);
  } catch (e) {
    if (detailEl) detailEl.innerHTML = `<div style="color:var(--red);font-size:14px">${wsEscape(e.message)}</div>`;
    // Still open branded preview so the use case is visible
    await wsOpenLiveHub(id, name, onboard);
  }
}

async function wsLoadFiles(id) {
  const filesEl = document.getElementById('ws-files-panel');
  const wrap = document.getElementById('ws-open-wrap');
  if (wrap) wrap.style.display = 'block';
  if (!filesEl) return;
  filesEl.style.display = 'block';
  filesEl.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:14px">GET /api/workspaces/{id}/files…</div>';
  if (typeof dsOpenLive === 'function') dsOpenLive('workspaces');
  try {
    const res = await fetch(`/api/workspaces/${id}`);
    const data = await res.json().catch(() => ({}));
    const name = (data && (data.workspaceName || data.name)) || wsHubState.name || id;
    await wsOpenLiveHub(id, name);
  } catch (e) {
    filesEl.innerHTML = `<div style="color:var(--red);font-size:14px">${wsEscape(e.message)}</div>`;
  }
}

function wsRunExplorer(method, path, body) {
  const out = document.getElementById('ws-explorer-response');
  const narration = typeof apiDemoForExplorer === 'function'
    ? apiDemoForExplorer(method, path, 'Workspaces', '')
    : null;
  if (out) {
    out.innerHTML = (typeof apiDemoRenderCard === 'function' ? apiDemoRenderCard(narration, { phase: 'running' }) : '')
      + '<div style="padding:12px;color:var(--muted);font-size:14px">Running…</div>';
  }
  fetch('/explorer/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group: 'Workspaces', method, path, body }),
  })
    .then(r => r.json())
    .then(data => {
      if (!out) return;
      const afterText = typeof apiDemoInterpretResponse === 'function'
        ? apiDemoInterpretResponse(narration, data.status_code, data.response)
        : '';
      const afterHtml = typeof apiDemoRenderCard === 'function'
        ? apiDemoRenderCard(narration, { phase: 'after', extra: afterText })
        : '';
      out.innerHTML = afterHtml + `<div style="font-size:13px;margin-bottom:6px;color:var(--muted)">HTTP ${data.status_code} · ${data.latency_ms}ms</div>
        <pre class="code-block" style="font-size:13px;max-height:320px;overflow:auto">${wsEscape(JSON.stringify(data.response, null, 2))}</pre>`;
    })
    .catch(err => { if (out) out.innerHTML = `<div style="color:var(--red)">${wsEscape(err.message)}</div>`; });
}

document.addEventListener('DOMContentLoaded', () => {
  // Page context from server for branded mocks
  try {
    const el = document.getElementById('ws-page-context');
    if (el?.textContent) window.DS_WS_CONTEXT = JSON.parse(el.textContent);
  } catch (_) { /* ignore */ }
  if (document.getElementById('ws-live-table')) wsRefreshList();
});
