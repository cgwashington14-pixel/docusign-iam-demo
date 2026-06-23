/* Workspaces — live API demo (centralized agreement hubs) */

async function wsRefreshList() {
  const table = document.getElementById('ws-live-table');
  const count = document.getElementById('ws-live-count');
  const status = document.getElementById('ws-live-status');
  if (!table) return;
  if (status) status.textContent = 'Loading workspaces…';
  table.innerHTML = typeof apiDemoRenderCard === 'function'
    ? apiDemoRenderCard({ running: 'Listing agreement hubs in your demo account…' }, { phase: 'running' })
      + '<div style="padding:16px;color:var(--muted);font-size:12px">Loading…</div>'
    : '<div style="padding:16px;color:var(--muted);font-size:12px">Loading…</div>';
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
      table.innerHTML = afterHtml + '<div style="padding:24px;text-align:center;color:var(--muted);font-size:12px">No workspaces yet — create one below to start a dynamic hub.</div>';
      return;
    }
    const rows = data.workspaces.map(w => `
      <tr style="border-bottom:1px solid var(--border-subtle);cursor:pointer" onclick="wsSelectWorkspace('${w.workspaceId}', '${(w.workspaceName || '').replace(/'/g, "\\'")}')">
        <td style="padding:10px 12px;font-weight:500">${w.workspaceName || '—'}</td>
        <td style="padding:10px 12px;font-family:monospace;font-size:11px;color:var(--muted)">${(w.workspaceId || '').slice(0, 20)}…</td>
        <td style="padding:10px 12px"><span class="badge completed"><span class="badge-dot"></span>${w.status || 'active'}</span></td>
        <td style="padding:10px 12px;font-size:11px;color:var(--muted)">${w.created || '—'}</td>
        <td style="padding:10px 12px"><button type="button" class="btn btn-ghost btn-sm" onclick="event.stopPropagation();wsLoadFiles('${w.workspaceId}')">View files</button></td>
      </tr>`).join('');
    table.innerHTML = afterHtml + `<table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="border-bottom:1px solid var(--border)">
        <th style="text-align:left;padding:8px 12px;color:var(--muted)">Name</th>
        <th style="text-align:left;padding:8px 12px;color:var(--muted)">ID</th>
        <th style="text-align:left;padding:8px 12px;color:var(--muted)">Status</th>
        <th style="text-align:left;padding:8px 12px;color:var(--muted)">Created</th>
        <th style="text-align:left;padding:8px 12px;color:var(--muted)"></th>
      </tr></thead><tbody>${rows}</tbody></table>`;
  } catch (e) {
    if (status) status.textContent = e.message;
    table.innerHTML = `<div style="padding:16px;color:var(--red);font-size:12px">${e.message}</div>`;
  }
}

async function wsCreateWorkspace() {
  const nameInput = document.getElementById('ws-create-name');
  const resultEl = document.getElementById('ws-create-result');
  const name = (nameInput?.value || '').trim() || 'CDT Cloud Modernization — Vendor Hub';
  const narration = typeof apiDemoForExplorer === 'function'
    ? apiDemoForExplorer('POST', '/workspaces', 'Workspaces', 'Create dynamic workspace hub')
    : null;
  if (resultEl) {
    resultEl.innerHTML = (typeof apiDemoRenderCard === 'function' ? apiDemoRenderCard(narration, { phase: 'running' }) : '')
      + '<div style="color:var(--muted);font-size:12px">POST /api/workspaces…</div>';
  }
  try {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceName: name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Create failed');
    if (resultEl) {
      const afterText = typeof apiDemoInterpretResponse === 'function'
        ? apiDemoInterpretResponse(narration, 200, data)
        : 'Workspace created — invite vendor and agency reviewers next.';
      resultEl.innerHTML = (typeof apiDemoRenderCard === 'function' ? apiDemoRenderCard(narration, { phase: 'after', extra: afterText }) : '')
        + `<div class="alert alert-success"><span>✓</span><div>
        <div class="alert-title">Workspace created</div>
        <div class="alert-detail mono">${data.workspaceName} · ${data.workspaceId}</div></div></div>`;
    }
    if (typeof showToast === 'function') showToast('Workspace created via API', 'success');
    wsRefreshList();
    if (data.workspaceId) wsSelectWorkspace(data.workspaceId, data.workspaceName || name);
  } catch (e) {
    if (resultEl) {
      resultEl.innerHTML = `<div class="alert alert-error"><span>⚠</span><div>
        <div class="alert-title">Could not create workspace</div>
        <div class="alert-detail">${e.message}</div></div></div>`;
    }
  }
}

async function wsSelectWorkspace(id, name) {
  const wrap = document.getElementById('ws-detail-wrap');
  const detailEl = document.getElementById('ws-detail-panel');
  const titleEl = document.getElementById('ws-detail-title');
  if (titleEl) titleEl.textContent = name || id;
  if (wrap) wrap.style.display = 'block';
  if (!detailEl) return;
  detailEl.innerHTML = '<div style="padding:12px;color:var(--muted);font-size:12px">Loading workspace details…</div>';
  try {
    const res = await fetch(`/api/workspaces/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load workspace');
    detailEl.innerHTML = `
      <div class="code-block" style="font-size:11px;max-height:220px;overflow:auto">${JSON.stringify(data, null, 2)}</div>
      <button type="button" class="btn btn-secondary btn-sm" style="margin-top:10px" onclick="wsLoadFiles('${id}')">GET files / folders →</button>`;
  } catch (e) {
    detailEl.innerHTML = `<div style="color:var(--red);font-size:12px">${e.message}</div>`;
  }
}

async function wsLoadFiles(id) {
  const filesEl = document.getElementById('ws-files-panel');
  if (!filesEl) return;
  filesEl.style.display = 'block';
  filesEl.innerHTML = '<div style="padding:12px;color:var(--muted);font-size:12px">GET /api/workspaces/{id}/files…</div>';
  try {
    const res = await fetch(`/api/workspaces/${id}/files`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not list files');
    const files = data.files || [];
    filesEl.innerHTML = files.length
      ? `<div class="code-block" style="font-size:11px">${JSON.stringify(files, null, 2)}</div>`
      : `<div style="font-size:12px;color:var(--muted);line-height:1.6">No files yet. Add documents, envelopes, or upload requests via the Workspaces API.<details style="margin-top:10px"><summary style="cursor:pointer;font-weight:600">Raw API response</summary><pre class="code-block" style="font-size:10px;margin-top:8px">${JSON.stringify(data.raw, null, 2)}</pre></details></div>`;
  } catch (e) {
    filesEl.innerHTML = `<div style="color:var(--red);font-size:12px">${e.message}</div>`;
  }
}

function wsRunExplorer(method, path, body) {
  const out = document.getElementById('ws-explorer-response');
  const narration = typeof apiDemoForExplorer === 'function'
    ? apiDemoForExplorer(method, path, 'Workspaces', '')
    : null;
  if (out) {
    out.innerHTML = (typeof apiDemoRenderCard === 'function' ? apiDemoRenderCard(narration, { phase: 'running' }) : '')
      + '<div style="padding:12px;color:var(--muted);font-size:12px">Running…</div>';
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
      out.innerHTML = afterHtml + `<div style="font-size:11px;margin-bottom:6px;color:var(--muted)">HTTP ${data.status_code} · ${data.latency_ms}ms</div>
        <pre class="code-block" style="font-size:11px;max-height:320px;overflow:auto">${JSON.stringify(data.response, null, 2)}</pre>`;
    })
    .catch(err => { if (out) out.innerHTML = `<div style="color:var(--red)">${err.message}</div>`; });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('ws-live-table')) wsRefreshList();
});
