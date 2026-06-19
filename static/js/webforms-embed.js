/* Embedded Web Forms — launch instances inside the portal */

let wfEmbedActiveUrl = null;

async function wfCreateInstance(formId, prefill, label) {
  const statusEl = document.getElementById('wf-embed-status');
  if (statusEl) statusEl.textContent = 'Creating form instance…';

  try {
    const res = await fetch('/api/webform/instance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_id: formId,
        prefill: prefill || {},
        client_user_id: 'portal-' + Date.now(),
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.formUrl) {
      throw new Error(data.error || 'Could not create instance');
    }
    wfShowEmbedFrame(data.formUrl, label || data.formName || 'Web Form');
    if (statusEl) statusEl.textContent = 'Form loaded — complete it below.';
    if (typeof showToast === 'function') showToast('Web Form opened in portal', 'success');
    return data;
  } catch (e) {
    if (statusEl) statusEl.textContent = e.message;
    if (typeof showToast === 'function') showToast(e.message, 'error');
    throw e;
  }
}

function wfShowEmbedFrame(url, title) {
  wfEmbedActiveUrl = url;
  const wrap = document.getElementById('wf-embed-frame-wrap');
  const frame = document.getElementById('wf-embed-frame');
  const titleEl = document.getElementById('wf-embed-frame-title');
  if (!wrap || !frame) return;
  wrap.style.display = 'block';
  if (titleEl) titleEl.textContent = title || 'Web Form';
  frame.src = url;
  wfScrollEmbed();
}

function wfShowDemoEmbed(kind) {
  const demos = {
    vendor: {
      title: 'Vendor Registration (demo)',
      html: `
        <div class="wf-embed-mock">
          <h3>📝 Vendor Registration</h3>
          <div class="biz-mock biz-mock--webform">
            <div class="biz-mock-form-row"><span>Company</span><div class="biz-mock-input">Acme Cloud Solutions</div></div>
            <div class="biz-mock-form-row"><span>Email</span><div class="biz-mock-input">bids@acmecloud.example</div></div>
            <div class="biz-mock-form-row"><span>Cert</span><div class="biz-mock-input">CA small business ✓</div></div>
            <button type="button" class="biz-mock-btn" onclick="showToast('Demo only — login to launch a live Web Form','default')">Submit registration →</button>
          </div>
          <p style="text-align:center;font-size:12px;color:var(--muted);margin-top:16px">Login with DocuSign to embed your real Web Forms here.</p>
        </div>`,
    },
    intake: {
      title: 'Contract Request (demo)',
      html: `
        <div class="wf-embed-mock">
          <h3>📋 New Contract Request</h3>
          <div class="biz-mock biz-mock--form">
            <div class="biz-mock-form-row"><span>Vendor</span><div class="biz-mock-input">Vendor name</div></div>
            <div class="biz-mock-form-row"><span>Amount</span><div class="biz-mock-input">$0.00</div></div>
            <div class="biz-mock-form-row"><span>Need</span><div class="biz-mock-input">Describe the purchase</div></div>
            <button type="button" class="biz-mock-btn" onclick="showToast('Demo only — login to launch a live Web Form','default')">Submit request →</button>
          </div>
        </div>`,
    },
    benefits: {
      title: 'Benefits Enrollment (demo)',
      html: `
        <div class="wf-embed-mock">
          <h3>🏠 Benefits Intake</h3>
          <div class="biz-mock biz-mock--form">
            <div class="biz-mock-form-row"><span>Name</span><div class="biz-mock-input">Robert Johnson</div></div>
            <div class="biz-mock-form-row"><span>Case ID</span><div class="biz-mock-input">CASE-2026-00981</div></div>
            <div class="biz-mock-form-row"><span>Program</span><div class="biz-mock-input">Housing Assistance</div></div>
            <button type="button" class="biz-mock-btn" onclick="showToast('Demo only — login to launch a live Web Form','default')">Continue →</button>
          </div>
        </div>`,
    },
  };
  const demo = demos[kind] || demos.vendor;
  const wrap = document.getElementById('wf-embed-frame-wrap');
  const mockHost = document.getElementById('wf-embed-mock-host');
  const frame = document.getElementById('wf-embed-frame');
  const titleEl = document.getElementById('wf-embed-frame-title');
  if (!wrap) return;
  wrap.style.display = 'block';
  if (titleEl) titleEl.textContent = demo.title;
  if (frame) frame.style.display = 'none';
  if (mockHost) {
    mockHost.style.display = 'block';
    mockHost.innerHTML = demo.html;
  }
  wfScrollEmbed();
}

function wfLaunchFromCard(formId, formName) {
  const prefill = {};
  document.querySelectorAll(`[data-wf-form="${formId}"] input`).forEach(inp => {
    if (inp.name && inp.value) prefill[inp.name.replace(/^pf_/, '')] = inp.value;
  });
  const frame = document.getElementById('wf-embed-frame');
  if (frame) frame.style.display = 'block';
  const mockHost = document.getElementById('wf-embed-mock-host');
  if (mockHost) mockHost.style.display = 'none';
  return wfCreateInstance(formId, prefill, formName);
}

function wfScrollEmbed() {
  document.getElementById('wf-embed-frame-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function wfLoadGovEmbedForms() {
  const grid = document.getElementById('wf-gov-embed-grid');
  if (!grid) return;
  if (!GW_DATA?.is_authenticated) {
    grid.innerHTML = `
      <div class="wf-embed-card">
        <div class="wf-embed-card-head"><strong>Vendor registration</strong><span>Solicitation workflow</span></div>
        <div class="wf-embed-card-body"><p style="font-size:12px;color:var(--muted)">Demo mock — login for live forms.</p></div>
        <div class="wf-embed-card-actions">
          <button type="button" class="btn btn-primary btn-sm" onclick="wfShowDemoEmbed('vendor')">Launch in portal</button>
        </div>
      </div>
      <div class="wf-embed-card">
        <div class="wf-embed-card-head"><strong>Contract request</strong><span>First-party workflow</span></div>
        <div class="wf-embed-card-body"><p style="font-size:12px;color:var(--muted)">Demo mock intake form.</p></div>
        <div class="wf-embed-card-actions">
          <button type="button" class="btn btn-primary btn-sm" onclick="wfShowDemoEmbed('intake')">Launch in portal</button>
        </div>
      </div>
      <div class="wf-embed-card">
        <div class="wf-embed-card-head"><strong>Benefits enrollment</strong><span>Constituent services</span></div>
        <div class="wf-embed-card-body"><p style="font-size:12px;color:var(--muted)">Demo with sample pre-fill.</p></div>
        <div class="wf-embed-card-actions">
          <button type="button" class="btn btn-primary btn-sm" onclick="wfShowDemoEmbed('benefits')">Launch in portal</button>
        </div>
      </div>`;
    return;
  }
  try {
    const res = await fetch('/api/webforms');
    const data = await res.json();
    const forms = data.forms || [];
    if (!forms.length) {
      grid.innerHTML = '<p style="font-size:13px;color:var(--muted)">No Web Forms on this account. Build one in DocuSign and refresh.</p>';
      return;
    }
    grid.innerHTML = forms.slice(0, 6).map(f => {
      const name = (f.formProperties && f.formProperties.name) || f.name || f.id;
      const short = f.id.slice(0, 8);
      return `
        <div class="wf-embed-card">
          <div class="wf-embed-card-head"><strong>${name}</strong><span>Live · ${short}…</span></div>
          <div class="wf-embed-card-body"><p style="font-size:12px;color:var(--muted)">Opens embedded in this portal — no new tab required.</p></div>
          <div class="wf-embed-card-actions">
            <button type="button" class="btn btn-primary btn-sm" onclick="wfCreateInstance('${f.id}', {}, '${name.replace(/'/g, "\\'")}')">Launch in portal</button>
            <a href="/webforms" class="btn btn-secondary btn-sm">Pre-fill →</a>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = `<p style="font-size:13px;color:var(--red)">${e.message}</p>`;
  }
}

window.wfCreateInstance = wfCreateInstance;
window.wfShowDemoEmbed = wfShowDemoEmbed;
window.wfShowEmbedFrame = wfShowEmbedFrame;
window.wfLaunchFromCard = wfLaunchFromCard;
window.wfScrollEmbed = wfScrollEmbed;
window.wfLoadGovEmbedForms = wfLoadGovEmbedForms;
