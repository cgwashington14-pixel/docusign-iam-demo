/* Embedded Web Forms — launch Training/Travel Request inside the portal.
   Prefer a properly constructed embedded iframe URL (isEmbedded + frameAncestors).
   DocuSign JS is optional enhancement; new-tab always available as backup. */

let wfEmbedActiveUrl = null;
let wfDocuSignReady = null;

function wfIntegrationKey() {
  return window.DS_INTEGRATION_KEY || '';
}

function wfEnsureDocuSignJs() {
  if (window.DocuSign && typeof window.DocuSign.loadDocuSign === 'function') {
    return Promise.resolve();
  }
  if (window.loadDocuSign) return Promise.resolve();
  if (wfDocuSignReady) return wfDocuSignReady;
  wfDocuSignReady = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ds-js="1"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Docusign JS failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js-d.docusign.com/bundle.js';
    script.async = true;
    script.dataset.dsJs = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Docusign JS failed to load'));
    document.head.appendChild(script);
  });
  return wfDocuSignReady;
}

function wfParseLaunchUrl(url) {
  const raw = String(url || '');
  const hash = raw.includes('#') ? raw.split('#').pop() : '';
  const params = new URLSearchParams(hash.replace(/^\?/, ''));
  return {
    formUrlBase: raw.split('#')[0].split('?')[0],
    instanceToken: params.get('instanceToken') || '',
  };
}

function wfBuildEmbeddedUrl(launch) {
  const parsed = wfParseLaunchUrl(launch.formUrl || launch.formUrlBase || '');
  const formUrlBase = launch.formUrlBase || parsed.formUrlBase;
  const instanceToken = launch.instanceToken || parsed.instanceToken;
  if (!formUrlBase || !instanceToken) return launch.formUrl || '';

  const ancestors = [
    window.location.origin,
    'https://apps-d.docusign.com',
    'https://apps.docusign.com',
  ].join(' ');

  const qs = new URLSearchParams({
    isEmbedded: 'true',
    enableEmbedded: '1',
    frameAncestors: ancestors,
  });
  return `${formUrlBase}?${qs.toString()}#instanceToken=${encodeURIComponent(instanceToken)}`;
}

function wfSetPrefillSummary(prefill) {
  const el = document.getElementById('wf-embed-prefill-summary');
  if (!el) return;
  const entries = Object.entries(prefill || {});
  if (!entries.length) {
    el.style.display = 'none';
    el.innerHTML = '';
    return;
  }
  el.style.display = 'flex';
  el.innerHTML = entries.slice(0, 10).map(([k, v]) =>
    `<span class="wf-prefill-chip"><strong>${k}</strong> ${String(v)}</span>`
  ).join('');
}

function wfSetOpenTabLink(url) {
  const link = document.getElementById('wf-embed-open-tab');
  if (!link) return;
  if (url) {
    link.href = url;
    link.style.display = 'inline-flex';
  } else {
    link.removeAttribute('href');
    link.style.display = 'none';
  }
}

function wfSetStatus(msg) {
  const statusEl = document.getElementById('wf-embed-status');
  if (statusEl) statusEl.textContent = msg || '';
}

function wfShowEmbedError(msg) {
  const host = document.getElementById('wf-embed-host');
  const wrap = document.getElementById('wf-embed-frame-wrap');
  if (wrap) wrap.style.display = 'block';
  if (host) {
    host.style.display = 'block';
    host.innerHTML = `<div class="wf-embed-error" role="alert">
      <strong>Could not embed the form here.</strong>
      <p>${msg || 'Use Open in new tab to continue the demo.'}</p>
    </div>`;
  }
  wfSetStatus(msg || 'Embed failed — open in new tab');
}

async function wfCreateInstance(formId, prefill, label, options) {
  const opts = options || {};
  wfSetStatus('Creating form instance…');

  try {
    const payload = {
      form_id: formId,
      prefill: prefill || {},
      client_user_id: 'portal-' + Date.now(),
      return_url: window.location.origin + '/webforms',
    };
    if (opts.sample || opts.autoPrefill) {
      payload.sample = !!opts.sample;
      payload.auto_prefill = true;
    }
    const res = await fetch('/api/webform/instance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.formUrl) {
      throw new Error(data.error || 'Could not create instance');
    }
    await wfShowEmbedFrame(data.formUrl, label || data.formName || 'Web Form', data);
    const filled = data.prefill && Object.keys(data.prefill).length
      ? ` · ${Object.keys(data.prefill).length} fields pre-filled`
      : '';
    wfSetStatus('Form loaded in portal' + filled);
    if (typeof showToast === 'function') {
      showToast(
        filled ? 'Travel/training form opened with sample pre-fill' : 'Web Form opened in portal',
        'success'
      );
    }
    return data;
  } catch (e) {
    wfSetStatus(e.message);
    if (typeof showToast === 'function') showToast(e.message, 'error');
    throw e;
  }
}

async function wfLaunchSample(label) {
  wfSetStatus('Launching travel/training request with pre-fill…');
  if (typeof showToast === 'function') showToast('Creating travel/training form instance…', 'default');

  try {
    const res = await fetch('/api/webform/sample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.formUrl) {
      throw new Error(data.error || `Could not launch sample form (HTTP ${res.status})`);
    }
    const title = label || data.formName || 'Training/Travel Request Form';
    await wfShowEmbedFrame(data.formUrl, title, data);
    const count = data.prefill ? Object.keys(data.prefill).length : 0;
    wfSetStatus(count
      ? `${title} loaded — ${count} fields pre-filled`
      : `${title} loaded below`);
    if (typeof showToast === 'function') {
      showToast(
        count ? `Opened ${title} with ${count} pre-filled fields` : `Opened ${title}`,
        'success'
      );
    }
    return data;
  } catch (e) {
    wfShowEmbedError(e.message);
    if (typeof showToast === 'function') showToast(e.message, 'error');
    throw e;
  }
}

function wfMountIframe(frame, embedUrl) {
  if (!frame || !embedUrl) return;
  frame.style.display = 'block';
  frame.setAttribute('allow', 'camera; private-network; fullscreen');
  frame.setAttribute('referrerpolicy', 'origin');
  // Important: set src after display so layout is ready
  frame.src = embedUrl;
}

async function wfTryDocuSignJs(host, launch, embedUrl) {
  const ik = wfIntegrationKey();
  if (!ik) throw new Error('Missing Docusign integration key');
  await wfEnsureDocuSignJs();
  const loader = window.DocuSign?.loadDocuSign || window.loadDocuSign;
  if (typeof loader !== 'function') throw new Error('Docusign JS unavailable');

  const docusign = await loader(ik);
  if (!docusign?.webforms) throw new Error('Docusign JS webforms API unavailable');

  const parsed = wfParseLaunchUrl(launch.formUrl || '');
  const formUrlBase = launch.formUrlBase || parsed.formUrlBase;
  const instanceToken = launch.instanceToken || parsed.instanceToken;
  if (!formUrlBase || !instanceToken) throw new Error('Missing form URL or instance token');

  host.innerHTML = '';
  const session = docusign.webforms({
    url: formUrlBase,
    options: {
      instanceToken,
      frameAncestors: [
        window.location.origin,
        'https://apps-d.docusign.com',
        'https://apps.docusign.com',
      ],
      autoResizeHeight: true,
      hideWelcomePage: false,
      useFocusedViewForSigning: true,
      iframeStyles: {
        minHeight: '640px',
        height: '72vh',
        width: '100%',
        border: '0',
        background: '#fff',
      },
    },
  });
  session.mount(host);
  // If JS mount produced no iframe, fall back
  setTimeout(() => {
    if (!host.querySelector('iframe') && embedUrl) {
      host.innerHTML = '';
      const frame = document.getElementById('wf-embed-frame');
      if (frame) {
        host.style.display = 'none';
        wfMountIframe(frame, embedUrl);
      }
    }
  }, 1500);
  return session;
}

async function wfShowEmbedFrame(url, title, launchMeta) {
  const launch = Object.assign({}, launchMeta || {}, { formUrl: url });
  const embedUrl = wfBuildEmbeddedUrl(launch) || url;
  wfEmbedActiveUrl = embedUrl;

  const wrap = document.getElementById('wf-embed-frame-wrap');
  const host = document.getElementById('wf-embed-host');
  const frame = document.getElementById('wf-embed-frame');
  const titleEl = document.getElementById('wf-embed-frame-title');
  const mockHost = document.getElementById('wf-embed-mock-host');
  if (!wrap) {
    // Last resort if markup is missing
    window.open(embedUrl, '_blank', 'noopener');
    return;
  }

  wrap.style.display = 'block';
  if (mockHost) {
    mockHost.style.display = 'none';
    mockHost.innerHTML = '';
  }
  if (titleEl) titleEl.textContent = title || 'Web Form';
  wfSetOpenTabLink(embedUrl);
  wfSetPrefillSummary(launch.prefill || {});

  // Reliable path: iframe with embedded URL params
  if (host) {
    host.style.display = 'none';
    host.innerHTML = '';
  }
  if (frame) {
    wfMountIframe(frame, embedUrl);
  }

  // Optional DocuSign JS enhancement (non-blocking)
  if (host && wfIntegrationKey()) {
    wfTryDocuSignJs(host, launch, embedUrl).then(() => {
      if (host.querySelector('iframe')) {
        host.style.display = 'block';
        if (frame) {
          frame.style.display = 'none';
          frame.removeAttribute('src');
        }
      }
    }).catch((err) => {
      console.warn('[webforms] Docusign JS optional embed skipped', err);
    });
  }

  wfScrollEmbed();
}

function wfShowDemoEmbed(kind) {
  const demos = {
    vendor: {
      title: 'Vendor Registration (demo)',
      html: `
        <div class="wf-embed-mock">
          <h3>Vendor Registration</h3>
          <div class="biz-mock biz-mock--webform">
            <div class="biz-mock-form-row"><span>Company</span><div class="biz-mock-input">Acme Cloud Solutions</div></div>
            <div class="biz-mock-form-row"><span>Email</span><div class="biz-mock-input">bids@acmecloud.example</div></div>
            <div class="biz-mock-form-row"><span>Cert</span><div class="biz-mock-input">CA small business ✓</div></div>
            <button type="button" class="biz-mock-btn" onclick="showToast('Demo only — login to launch a live Web Form','default')">Submit registration →</button>
          </div>
        </div>`,
    },
    intake: {
      title: 'Contract Request (demo)',
      html: `
        <div class="wf-embed-mock">
          <h3>New Contract Request</h3>
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
          <h3>Benefits Intake</h3>
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
  const host = document.getElementById('wf-embed-host');
  const titleEl = document.getElementById('wf-embed-frame-title');
  if (!wrap) return;
  wrap.style.display = 'block';
  if (titleEl) titleEl.textContent = demo.title;
  if (frame) {
    frame.style.display = 'none';
    frame.removeAttribute('src');
  }
  if (host) {
    host.style.display = 'none';
    host.innerHTML = '';
  }
  wfSetOpenTabLink(null);
  wfSetPrefillSummary({});
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
  return wfCreateInstance(formId, prefill, formName, { autoPrefill: !Object.keys(prefill).length });
}

function wfScrollEmbed() {
  const el = document.getElementById('wf-embed-frame-wrap');
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function wfEscapeAttr(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function wfLoadGovEmbedForms() {
  const grid = document.getElementById('wf-gov-embed-grid');
  if (!grid) return;
  if (!GW_DATA?.is_authenticated) {
    grid.innerHTML = `
      <div class="wf-embed-card wf-embed-card--sample">
        <div class="wf-embed-card-head"><strong>Training/Travel Request</strong><span>Demo mock</span></div>
        <div class="wf-embed-card-body"><p style="font-size:14px;color:var(--muted)">Shows ERP/HRIS pre-fill for requestor + expenses. Login for the live form.</p></div>
        <div class="wf-embed-card-actions">
          <button type="button" class="btn btn-primary btn-sm" onclick="wfShowDemoEmbed('benefits')">Preview sample</button>
        </div>
      </div>`;
    return;
  }
  try {
    const res = await fetch('/api/webforms');
    const data = await res.json();
    const forms = data.forms || [];
    if (!forms.length) {
      grid.innerHTML = '<p style="font-size:15px;color:var(--muted)">No Web Forms on this account. Build one in Docusign and refresh.</p>';
      return;
    }
    const sampleCard = `
      <div class="wf-embed-card wf-embed-card--sample">
        <div class="wf-embed-card-head"><strong>Travel/Training with pre-fill</strong><span>Recommended</span></div>
        <div class="wf-embed-card-body"><p style="font-size:14px;color:var(--muted)">Opens <strong>Training/Travel Request Form</strong> in this portal with requestor, destination, and expense fields filled.</p></div>
        <div class="wf-embed-card-actions">
          <button type="button" class="btn btn-primary btn-sm" onclick="wfLaunchSample('Training/Travel Request Form')">Launch travel/training</button>
        </div>
      </div>`;
    const formCards = forms.slice(0, 5).map(f => {
      const name = (f.formProperties && f.formProperties.name) || f.name || f.id;
      const short = f.id.slice(0, 8);
      const safeName = wfEscapeAttr(name);
      return `
        <div class="wf-embed-card">
          <div class="wf-embed-card-head"><strong>${name}</strong><span>Live · ${short}…</span></div>
          <div class="wf-embed-card-body"><p style="font-size:14px;color:var(--muted)">Opens embedded with sample pre-fill — no new tab required.</p></div>
          <div class="wf-embed-card-actions">
            <button type="button" class="btn btn-primary btn-sm" onclick="wfCreateInstance('${f.id}', {}, '${safeName}', { autoPrefill: true })">Launch with pre-fill</button>
          </div>
        </div>`;
    }).join('');
    grid.innerHTML = sampleCard + formCards;
  } catch (e) {
    grid.innerHTML = `<p style="font-size:15px;color:var(--red)">${e.message}</p>`;
  }
}

window.wfCreateInstance = wfCreateInstance;
window.wfLaunchSample = wfLaunchSample;
window.wfShowDemoEmbed = wfShowDemoEmbed;
window.wfShowEmbedFrame = wfShowEmbedFrame;
window.wfLaunchFromCard = wfLaunchFromCard;
window.wfScrollEmbed = wfScrollEmbed;
window.wfLoadGovEmbedForms = wfLoadGovEmbedForms;
window.wfBuildEmbeddedUrl = wfBuildEmbeddedUrl;
