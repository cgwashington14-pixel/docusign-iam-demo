/* Embedded Workflow Builder — launch instances inside the portal */

async function maestroLaunchInPortal(workflowId, workflowName) {
  const statusEl = document.getElementById('maestro-embed-status');
  if (statusEl) statusEl.textContent = 'Launching workflow…';

  try {
    const res = await fetch(`/api/workflow/${workflowId}/launch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok || !data.embed_url) {
      throw new Error(data.error || 'Could not launch workflow');
    }
    maestroShowEmbedFrame(data.embed_url, workflowName || 'Workflow');
    if (statusEl) {
      statusEl.textContent = data.message || (
        data.trigger_method === 'url'
          ? 'Start form loaded — complete it below.'
          : 'Workflow loaded — complete steps below.'
      );
    }
    if (typeof showToast === 'function') {
      showToast(
        data.trigger_method === 'url' ? 'Workflow start form opened in portal' : 'Workflow triggered in portal',
        'success',
      );
    }
    return data;
  } catch (e) {
    if (statusEl) statusEl.textContent = e.message;
    if (typeof showToast === 'function') showToast(e.message, 'error');
    throw e;
  }
}

function maestroShowEmbedFrame(url, title) {
  const wrap = document.getElementById('maestro-embed-frame-wrap');
  const frame = document.getElementById('maestro-embed-frame');
  const titleEl = document.getElementById('maestro-embed-frame-title');
  if (!wrap || !frame) return;
  wrap.style.display = 'block';
  if (titleEl) titleEl.textContent = title || 'Workflow';
  frame.src = url;
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function maestroLaunchSelected() {
  const sel = document.getElementById('wf-workflow-select');
  if (!sel || !sel.value) return;
  const label = sel.options[sel.selectedIndex]?.text || 'Workflow';
  return maestroLaunchInPortal(sel.value, label);
}

document.addEventListener('DOMContentLoaded', () => {
  const autoUrl = document.body.dataset.maestroEmbedUrl;
  const autoTitle = document.body.dataset.maestroEmbedTitle;
  if (autoUrl) maestroShowEmbedFrame(autoUrl, autoTitle || 'Workflow');
});
