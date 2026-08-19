/* Workspaces — live API demo + California EDD branded open hub */

const WS_EDD_DEFAULTS = {
  agencyName: 'California Employment Development Department',
  agencyShort: 'EDD',
  agencyTagline: 'Vendor Onboarding Hub',
  participantName: 'Priya Nair',
  participantTitle: 'Contracts Officer · California Employment Development Department',
  vendorName: 'Corey Washington',
  vendorCompany: 'Acme Staffing Solutions, Inc.',
  workspaceTitle: 'CA EDD Vendor Onboarding — Acme Staffing',
  signerEmail: 'cwdocusign1@gmail.com',
  signerName: 'Corey Washington',
};

let wsHubState = {
  id: null,
  name: null,
  view: 'sign',
  ctx: null,
  envelopeId: null,
  signingUrl: null,
  effectiveDate: '',
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

function wsEffectiveDateValue() {
  const hub = document.getElementById('ws-hub-effective-date');
  const create = document.getElementById('ws-effective-date');
  return (hub?.value || create?.value || wsHubState.effectiveDate || '').trim();
}

function wsSyncEffectiveDateInputs(value) {
  if (!value) return;
  wsHubState.effectiveDate = value;
  const hub = document.getElementById('ws-hub-effective-date');
  const create = document.getElementById('ws-effective-date');
  if (hub) hub.value = value;
  if (create) create.value = value;
}

function wsSetViewButtons(view) {
  const map = {
    sign: document.getElementById('ws-view-sign'),
    admin: document.getElementById('ws-view-admin'),
    participant: document.getElementById('ws-view-participant'),
  };
  Object.entries(map).forEach(([key, btn]) => {
    if (!btn) return;
    const active = key === view;
    btn.classList.toggle('btn-primary', active && key === 'sign');
    btn.classList.toggle('btn-secondary', active && key !== 'sign');
    btn.classList.toggle('btn-ghost', !active);
  });
}

function wsShowSigningChrome(show) {
  const toolbar = document.getElementById('ws-sign-toolbar');
  const panel = document.getElementById('ws-signing-panel');
  const host = document.getElementById('ws-open-hub');
  if (toolbar) toolbar.style.display = show ? 'flex' : 'none';
  if (panel) panel.style.display = show ? 'block' : 'none';
  if (host) host.style.display = show ? 'none' : 'block';
}

function wsCtxFromOnboarding(name, onboard = {}, filesPayload = {}) {
  const docs = onboard.documents || [];
  const uploads = onboard.upload_requests || filesPayload.upload_requests || [];
  const envelopes = onboard.envelopes || filesPayload.envelopes || [];
  const invitation = onboard.invitation || {
    email: onboard.signer_email || WS_EDD_DEFAULTS.signerEmail,
    name: onboard.signer_name || WS_EDD_DEFAULTS.signerName,
    status: onboard.vendor_user_id ? 'invited' : 'invited',
  };
  const signItems = (docs.length ? docs : envelopes.filter((e) => (
    e.source === 'esign' || e.source === 'esign_email' || e.source === 'esign_embedded' || e.source === 'workspaces_attached'
  ))).map((d) => ({
    name: d.name || d.filename || 'Agreement',
    recipient: d.recipient || WS_EDD_DEFAULTS.vendorName,
    status: d.status || 'Sent',
    date: new Date().toLocaleString('en-US', {
      month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    }),
    kind: 'Envelope',
  }));
  const uploadRows = uploads.map((u) => ({
    name: u.name || 'Upload request',
    recipient: u.recipient || WS_EDD_DEFAULTS.vendorName,
    status: (u.status || 'Waiting for upload').replace(/^\w/, (c) => c.toUpperCase()),
    date: new Date().toLocaleString('en-US', {
      month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    }),
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
    signerEmail: invitation.email || onboard.signer_email || WS_EDD_DEFAULTS.signerEmail,
    vendorEmail: invitation.email || onboard.signer_email || WS_EDD_DEFAULTS.signerEmail,
    invitation,
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
  wsShowSigningChrome(false);
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
  wsSetViewButtons(view);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (typeof dsSwitchMock === 'function') {
    dsSwitchMock('workspaces', mockKey, ctx);
  }
  if (stayLive) {
    if (typeof dsOpenLive === 'function') dsOpenLive('workspaces');
  } else if (typeof dsShowPreview === 'function') {
    dsShowPreview('workspaces');
  }
}

function wsSetHubView(view) {
  const next = view === 'participant' || view === 'admin' || view === 'sign' ? view : 'sign';
  wsHubState.view = next;
  wsSetViewButtons(next);
  if (next === 'sign') {
    if (wsHubState.id) {
      wsShowLiveSigning();
    } else {
      wsOpenEddDemo();
    }
    return;
  }
  if (wsHubState.ctx) {
    wsRenderHub(wsHubState.ctx, next, { stayLive: !!wsHubState.id });
  } else {
    const ctx = wsBaseCtx({ workspaceTitle: wsHubState.name || WS_EDD_DEFAULTS.workspaceTitle });
    wsHubState.ctx = ctx;
    wsRenderHub(ctx, next, { stayLive: !!wsHubState.id });
  }
}

function wsOpenEddDemo() {
  const ctx = wsBaseCtx();
  wsHubState = {
    id: null,
    name: ctx.workspaceTitle,
    view: 'admin',
    ctx,
    envelopeId: null,
    signingUrl: null,
    effectiveDate: wsEffectiveDateValue(),
  };
  wsRenderHub(ctx, 'admin', { stayLive: false });
  const filesEl = document.getElementById('ws-files-panel');
  if (filesEl) {
    filesEl.style.display = 'none';
    filesEl.innerHTML = '';
  }
  if (typeof showToast === 'function') showToast('Opened California EDD hub preview (mock)', 'success');
}

async function wsShowLiveSigning({ forceNew = false, sendEmail = false } = {}) {
  const wrap = document.getElementById('ws-open-wrap');
  const panel = document.getElementById('ws-signing-panel');
  const loading = document.getElementById('ws-signing-loading');
  const frame = document.getElementById('ws-signing-frame');
  const titleEl = document.getElementById('ws-open-title');
  const subEl = document.getElementById('ws-open-sub');
  const meta = document.getElementById('ws-sign-meta');
  if (!wrap || !panel) return;

  wrap.style.display = 'block';
  wsShowSigningChrome(true);
  wsSetViewButtons('sign');
  wsHubState.view = 'sign';
  if (titleEl) titleEl.textContent = wsHubState.name || 'Live EDD signing hub';
  if (subEl) subEl.textContent = `Embedded signing · ${WS_EDD_DEFAULTS.signerEmail}`;
  if (meta) meta.textContent = `Signer · ${WS_EDD_DEFAULTS.signerEmail}`;
  if (typeof dsOpenLive === 'function') dsOpenLive('workspaces');

  panel.querySelector('.ws-signing-error')?.remove();

  if (wsHubState.signingUrl && !forceNew && frame) {
    if (loading) loading.style.display = 'none';
    frame.style.display = 'block';
    frame.src = wsHubState.signingUrl;
    wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  if (loading) {
    loading.style.display = 'block';
    loading.textContent = 'Creating live DocuSign signing session…';
  }
  if (frame) {
    frame.style.display = 'none';
    frame.removeAttribute('src');
  }

  const effectiveDate = wsEffectiveDateValue();
  wsSyncEffectiveDateInputs(effectiveDate);
  const workspaceId = wsHubState.id || 'demo';
  try {
    const res = await fetch(`/api/workspaces/${encodeURIComponent(workspaceId)}/open-signing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        effectiveDate,
        sendEmail: !!sendEmail,
        envelopeId: forceNew ? null : wsHubState.envelopeId,
        signerEmail: WS_EDD_DEFAULTS.signerEmail,
        signerName: WS_EDD_DEFAULTS.signerName,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || `Signing session failed (HTTP ${res.status})`);
    if (!data.signingUrl) throw new Error('No signingUrl returned — check DocuSign auth.');

    wsHubState.envelopeId = data.envelopeId || null;
    wsHubState.signingUrl = data.signingUrl;
    if (loading) loading.style.display = 'none';
    if (frame) {
      frame.style.display = 'block';
      frame.src = data.signingUrl;
    }
    if (meta) {
      const bits = [`Signer · ${data.signerEmail || WS_EDD_DEFAULTS.signerEmail}`];
      if (data.effectiveDate) bits.push(`Effective ${data.effectiveDate}`);
      if (data.envelopeId) bits.push(`${String(data.envelopeId).slice(0, 8)}…`);
      meta.textContent = bits.join(' · ');
    }
    if (typeof showToast === 'function') {
      showToast(
        data.emailEnvelopeId
          ? `Signing open · email also sent to ${data.signerEmail}`
          : `Live signing ready for ${data.signerEmail || WS_EDD_DEFAULTS.signerEmail}`,
        'success',
      );
    }
  } catch (err) {
    if (loading) loading.style.display = 'none';
    const errEl = document.createElement('div');
    errEl.className = 'ws-signing-error';
    errEl.innerHTML = `<strong>Could not open live signing</strong><div style="margin-top:6px">${wsEscape(err.message)}</div>
      <div style="margin-top:10px"><button type="button" class="btn btn-secondary btn-sm" onclick="wsReloadSigning()">Try again</button></div>`;
    panel.prepend(errEl);
  }
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function wsReloadSigning() {
  wsHubState.signingUrl = null;
  wsHubState.envelopeId = null;
  wsShowLiveSigning({ forceNew: true });
}

async function wsOpenLiveHub(id, name, onboard = null) {
  wsHubState.id = id;
  wsHubState.name = name;
  wsHubState.view = 'admin';
  wsHubState.signingUrl = null;
  if (onboard?.hub_envelope_id) wsHubState.envelopeId = onboard.hub_envelope_id;
  else wsHubState.envelopeId = null;
  if (onboard?.effective_date) wsSyncEffectiveDateInputs(onboard.effective_date);
  if (!onboard?.invitation && onboard?.signer_email) {
    onboard = {
      ...onboard,
      invitation: {
        email: onboard.signer_email,
        name: onboard.signer_name || WS_EDD_DEFAULTS.signerName,
        status: 'invited',
      },
    };
  }

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
  // Overview first — shows workspace invitation + assigned recipient
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
  if (status) status.textContent = 'Refreshing…';
  try {
    const res = await fetch('/api/workspaces');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Refresh failed');
    const list = data.workspaces || [];
    if (count) count.textContent = `${list.length} found`;
    if (status) status.textContent = 'GET ok';
    if (!table) return;
    if (!list.length) {
      table.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted);font-size:14px">No workspaces yet — create a dynamic hub below.</div>';
      return;
    }
    table.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>ID</th><th>Status</th><th>Created</th><th></th></tr></thead>
      <tbody>
        ${list.map((w) => {
          const id = w.workspaceId || w.workspace_id || '';
          const name = w.workspaceName || w.name || 'Workspace';
          return `<tr data-ws-row="${wsEscape(id)}" style="cursor:pointer" onclick="wsSelectWorkspace(${JSON.stringify(String(id))}, ${JSON.stringify(String(name))})">
            <td style="font-weight:500">${wsEscape(name)}</td>
            <td class="mono text-xs text-muted">${wsEscape(id)}</td>
            <td><span class="badge completed"><span class="badge-dot"></span>${wsEscape(w.status || 'active')}</span></td>
            <td class="text-xs text-muted">${wsEscape(w.created || w.created_date || '—')}</td>
            <td><button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation();wsSelectWorkspace(${JSON.stringify(String(id))}, ${JSON.stringify(String(name))})">Open hub</button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>`;
    if (wsHubState.id) wsHighlightSelectedRow(wsHubState.id);
  } catch (e) {
    if (status) status.textContent = e.message;
    if (table) {
      table.innerHTML = typeof dsErrorRetry === 'function'
        ? dsErrorRetry(e.message, 'wsRefreshList')
        : `<div style="padding:16px;color:var(--red);font-size:14px">${wsEscape(e.message)}</div>`;
    }
  }
}

async function wsCreateWorkspace() {
  const nameInput = document.getElementById('ws-create-name');
  const seedInput = document.getElementById('ws-seed-onboarding');
  const resultEl = document.getElementById('ws-create-result');
  const name = (nameInput?.value || '').trim() || WS_EDD_DEFAULTS.workspaceTitle;
  const seed = seedInput ? !!seedInput.checked : true;
  const effectiveDate = wsEffectiveDateValue();
  wsSyncEffectiveDateInputs(effectiveDate);
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
      body: JSON.stringify({ workspaceName: name, name, seed, effectiveDate }),
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
    if (onboard.signer_email) summaryBits.push(`emailed ${onboard.signer_email}`);
    const packLine = summaryBits.length
      ? `<div class="alert-detail" style="margin-top:6px">${summaryBits.join(' · ')} staged for CA EDD vendor onboarding.</div>
         <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:var(--muted);line-height:1.6">
           ${docs.map((d) => `<li>Sign: ${wsEscape(d.name || d.filename)}</li>`).join('')}
           ${uploads.map((u) => `<li>Upload: ${wsEscape(u.name)}</li>`).join('')}
         </ul>`
      : (seed ? '<div class="alert-detail" style="margin-top:6px">Onboarding seed ran — open live signing below.</div>' : '');
    if (resultEl) {
      const afterText = typeof apiDemoInterpretResponse === 'function'
        ? apiDemoInterpretResponse(narration, 200, data)
        : 'Workspace created — EDD vendor pack staged.';
      resultEl.innerHTML = (typeof apiDemoRenderCard === 'function' ? apiDemoRenderCard(narration, { phase: 'after', extra: afterText }) : '')
        + `<div class="alert alert-success"><span>✓</span><div>
        <div class="alert-title">Workspace created</div>
        <div class="alert-detail mono">${wsEscape(wsName)} · ${wsEscape(wsId)}</div>
        ${packLine}
        <div style="margin-top:10px"><button type="button" class="btn btn-primary btn-sm" data-ws-open="${String(wsId).replace(/"/g, '')}" data-ws-name="${String(wsName).replace(/"/g, '&quot;')}">Open live signing hub →</button></div>
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
      + `<div style="padding:16px;color:var(--muted)">Running ${method} ${path}…</div>`;
  }
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  fetch(`/api${path.startsWith('/') ? path : `/${path}`}`, opts)
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (out) {
        const after = typeof apiDemoInterpretResponse === 'function'
          ? apiDemoInterpretResponse(narration, res.status, data)
          : '';
        out.innerHTML = (typeof apiDemoRenderCard === 'function' ? apiDemoRenderCard(narration, { phase: 'after', extra: after }) : '')
          + `<pre class="code-block" style="font-size:12px;max-height:360px;overflow:auto">${wsEscape(JSON.stringify(data, null, 2))}</pre>`;
      }
      if (method === 'GET' && path.includes('workspaces')) wsRefreshList();
    })
    .catch((e) => {
      if (out) out.innerHTML = `<div class="alert alert-error"><span>⚠</span><div>${wsEscape(e.message)}</div></div>`;
    });
}

window.wsOpenEddDemo = wsOpenEddDemo;
window.wsSetHubView = wsSetHubView;
window.wsCreateWorkspace = wsCreateWorkspace;
window.wsSelectWorkspace = wsSelectWorkspace;
window.wsRefreshList = wsRefreshList;
window.wsLoadFiles = wsLoadFiles;
window.wsRunExplorer = wsRunExplorer;
window.wsReloadSigning = wsReloadSigning;
window.wsShowLiveSigning = wsShowLiveSigning;
