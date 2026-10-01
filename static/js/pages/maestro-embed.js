/* Embedded Workflow Builder — launch instances inside the portal */

async function maestroLaunchInPortal(workflowId, workflowName) {
  const statusEl = document.getElementById('maestro-embed-status');
  if (statusEl) statusEl.textContent = 'Launching workflow with prefill payload…';

  const payload = typeof collectPrefillPayload === 'function'
    ? collectPrefillPayload()
    : { instance_name: `Gov demo — ${workflowName || 'AV1'}`, trigger_inputs: {} };

  try {
    const res = await fetch(`/api/workflow/${workflowId}/launch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.embed_url) {
      throw new Error(data.error || 'Could not launch workflow');
    }
    maestroShowEmbedFrame(data.embed_url, workflowName || 'AV1');
    if (statusEl) {
      const prefillNote = data.request_body?.trigger_inputs ? 'Prefill payload sent — ' : '';
      statusEl.textContent = prefillNote + (data.message || (
        data.trigger_method === 'url'
          ? 'Start form loaded — complete steps below (prefill payload shown above).'
          : 'Workflow loaded — participants pre-filled from trigger_inputs.'
      ));
    }
    if (typeof showToast === 'function') {
      showToast(
        data.trigger_method === 'url'
          ? 'AV1 start form opened — review prefill payload'
          : 'AV1 triggered with API prefill',
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
  if (titleEl) titleEl.textContent = title || 'AV1';
  frame.src = url;
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function maestroLaunchSelected() {
  const sel = document.getElementById('wf-workflow-select');
  if (!sel || !sel.value) return;
  const label = sel.options[sel.selectedIndex]?.text || 'AV1';
  return maestroLaunchInPortal(sel.value, label);
}

document.addEventListener('DOMContentLoaded', () => {
  const autoUrl = document.body.dataset.maestroEmbedUrl;
  const autoTitle = document.body.dataset.maestroEmbedTitle;
  if (autoUrl) maestroShowEmbedFrame(autoUrl, autoTitle || 'AV1');
});
