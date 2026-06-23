/* Plain-language demo narration for API / tech-mode views */

const API_DEMO = {
  // Gov workflow step IDs
  initiate: {
    showing: 'A program manager starts a contract in CLM — vendor, budget, and project data already pulled from FI$Cal.',
    doing: 'This POST creates a new contract record from the DGS template and merges ERP fields into the document.',
    say: '“Instead of re-keying vendor and budget data, CLM calls FI$Cal once and pre-fills the agreement.”',
    afterSuccess: 'You get back a contract ID and draft status — the agreement is ready for clause assembly and review.',
  },
  generate: {
    showing: 'CLM assembles mandatory California clauses and SOW terms into the draft agreement.',
    doing: 'Document generation runs inside CLM — no separate API call in this demo step, but the output feeds the review queue.',
    say: '“The platform inserts prevailing wage, anti-lobbying, and data residency language automatically.”',
  },
  contracts_review: {
    showing: 'DGS Contracts validates budget authority and clause completeness before legal review.',
    doing: 'Internal workflow routing — tasks and approvals are tracked in IAM Platform.',
    say: '“Contracts confirms the RFO reference and encumbrance before we spend legal time on redlines.”',
  },
  legal_review: {
    showing: 'Counsel reviews the Word draft with Iris flags beside each risky clause.',
    doing: 'The playbook-review API compares the draft against your agency’s approved Standard Terms library.',
    say: '“Iris highlights where vendor language diverges from our playbook — counsel approves or sends redlines.”',
    afterSuccess: 'The response lists clause scores and deviations — each maps to a redline or approval in the UI.',
  },
  external_review: {
    showing: 'The vendor opens a shared Workspace to review terms and propose changes.',
    doing: 'POST /workspaces creates a collaborative hub where both parties comment on the same document version.',
    say: '“We invite the vendor into a Workspace instead of emailing PDFs back and forth.”',
    afterSuccess: 'Workspace ID and invite link are returned — participants see one live agreement hub.',
  },
  negotiation: {
    showing: 'Contracts merges vendor redlines against the agency baseline in CLM.',
    doing: 'Version compare and redline merge happen in CLM; approved changes update the contract record.',
    say: '“Every change is tracked against our pre-approved language — we accept some edits and reject others.”',
  },
  contracts_final: {
    showing: 'Final package approved with obligations and renewal dates captured for lifecycle management.',
    doing: 'CLM locks the approved version and prepares the signature envelope payload.',
    say: '“Before signature, we capture insurance renewals and reporting deadlines as trackable obligations.”',
  },
  signature: {
    showing: 'The authorized signer completes eSignature; vendor counter-signs on the same envelope.',
    doing: 'POST /envelopes sends the final PDF for signature with routing, tabs, and audit trail.',
    say: '“One API call creates the envelope, assigns signers, and starts the legally binding signature flow.”',
    afterSuccess: 'Envelope ID and status “sent” confirm the agreement is out for signature.',
  },
  post_execution: {
    showing: 'Executed contract metadata flows back to FI$Cal and the agency contract register.',
    doing: 'DocuSign Connect fires a webhook on envelope-completed; middleware pushes encumbrance and obligation data to ERP.',
    say: '“Signature isn’t the end — Connect automatically syncs the executed agreement to our system of record.”',
    afterSuccess: 'FI$Cal encumbrance and contract register IDs confirm the downstream sync.',
  },
  intake: {
    showing: 'A vendor uploads their paper through the agency portal; CLM classifies and routes it.',
    doing: 'The intake API ingests third-party PDFs, runs classification, and queues the document for review.',
    say: '“Vendor paper lands in one intake queue — AI tells us what kind of agreement it is before humans open it.”',
  },
  ai_scorecard: {
    showing: 'Agreement Manager shows a scorecard grading vendor paper against CA Standard Terms.',
    doing: 'The analyze API extracts provisions and scores deviations from your pre-approved clause library.',
    say: '“In seconds we see a 72/100 score and exactly which clauses need negotiation.”',
    afterSuccess: 'Score, grade, and deviation list drive the contracts triage decision.',
  },
  contracts_triage: {
    showing: 'Contracts reviews the AI scorecard and assigns priority and SLA.',
    doing: 'Workflow task assignment in IAM Platform — no external API in this demo beat.',
    say: '“The scorecard tells us whether to negotiate vendor paper or replace it with our template.”',
  },
  negotiation_out: {
    showing: 'Agency redlines are sent to the vendor through a CLM negotiation workflow.',
    doing: 'PUT updates the negotiation package and notifies the vendor workspace.',
    say: '“We push our mandatory redlines out — the vendor responds in the same collaborative thread.”',
  },
  vendor_response: {
    showing: 'Vendor returns a counter-proposal on flagged clauses.',
    doing: 'Workspace and CLM sync the counter-redline version for legal review.',
    say: '“Every round stays in IAM — no lost email attachments.”',
  },
  execute: {
    showing: 'Final agreed terms are sent for signature after negotiation closes.',
    doing: 'POST /envelopes executes the awarded contract with the merged document.',
    say: '“Once both sides agree, we execute with the same eSignature API agencies already trust.”',
    afterSuccess: 'Envelope created — signers receive notification immediately.',
  },
  erp_sync: {
    showing: 'Post-signature data syncs to FI$Cal and eProcure.',
    doing: 'Connect webhook → agency middleware → ERP contract API.',
    say: '“Encumbrance and vendor status update automatically — no manual re-entry.”',
  },
  webform: {
    showing: 'A citizen or vendor fills a Web Form embedded in your portal.',
    doing: 'POST /forms/{id}/instances creates a pre-filled form session and returns a URL for embedding.',
    say: '“Your CRM passes name and email — DocuSign returns a form URL you load in this iframe.”',
    afterSuccess: 'formUrl in the response is what you embed — submission can trigger a workflow.',
  },
  workflow_trigger: {
    showing: 'Maestro / Workflow Builder starts a procurement or onboarding flow from your app.',
    doing: 'POST trigger sends instance_name and trigger_inputs — ERP and HRIS values map into workflow fields.',
    say: '“FI$Cal and Workday data ride along in trigger_inputs so the workflow starts fully pre-filled.”',
    afterSuccess: 'Instance ID lets you poll status or open the embedded workflow view.',
  },
};

const API_EXAMPLE_DEMO = {
  erp_prefill: {
    showing: 'Contract fields populate from FI$Cal before anyone opens Word.',
    doing: 'CLM looks up the encumbrance ID and maps vendor, amount, and appropriation into the template.',
    say: '“Watch the contract appear with twelve fields already filled from our ERP — zero copy-paste.”',
    afterSuccess: 'contractId and prefilledFields count prove the ERP connector worked.',
  },
  hris_prefill: {
    showing: 'HR onboarding envelope with employee data from Workday.',
    doing: 'Template roles and tabs are filled from HRIS fields before the envelope is sent.',
    say: '“Workday is the source of truth — DocuSign just sends what HR already verified.”',
    afterSuccess: 'envelopeId and prefillSource show which HR record powered the send.',
  },
  sql_prefill: {
    showing: 'Agency SQL contract register feeds a new CLM contract.',
    doing: 'Custom connector runs a parameterized query and maps rows into template fields.',
    say: '“Legacy databases still participate — we query the project register and pre-fill the SOW.”',
    afterSuccess: 'Contract ID ties back to the project ID in your agency database.',
  },
  post_execution: {
    showing: 'Executed agreement metadata lands in FI$Cal and the contract register.',
    doing: 'Connect event payload includes extracted dates, value, vendor, and obligations.',
    say: '“When the last signature completes, middleware pushes structured metadata to every downstream system.”',
    afterSuccess: 'synced: true and fi_cal_encumbrance confirm ERP received the execution.',
  },
  ai_review: {
    showing: 'Iris scores vendor paper against your Standard Terms library.',
    doing: 'Analyze API returns overall score, deviations, and extracted provisions.',
    say: '“Legal doesn’t read 40 pages blind — Iris tells us which articles fail the playbook.”',
    afterSuccess: 'Deviation list drives the redline conversation with the vendor.',
  },
};

function apiDemoMatchPath(method, path, group) {
  const p = (path || '').toLowerCase();
  const g = (group || '').toLowerCase();
  const rules = [
    { test: () => p.includes('/envelopes') && method === 'POST' && !p.includes('/views'), key: 'signature' },
    { test: () => p.includes('/views/recipient'), key: 'signature', override: {
      showing: 'Embedded signing inside your agency portal — no redirect to email.',
      doing: 'POST /views/recipient returns a one-time signing URL for the recipient.',
      say: '“The citizen never leaves our site — we generate a signing session via API.”',
      afterSuccess: 'url in the response loads the embedded signing ceremony.',
    }},
    { test: () => p.includes('/envelopes') && method === 'GET', key: null, override: {
      showing: 'Recent envelopes in the demo account — audit and status at a glance.',
      doing: 'Lists envelopes with status, dates, and subjects for reporting or replay.',
      say: '“Every agreement sent through IAM is queryable — this is your operational dashboard feed.”',
      afterSuccess: 'Envelope list returns status per item — sent, delivered, completed, etc.',
    }},
    { test: () => p.includes('/templates'), key: null, override: {
      showing: 'Agency templates available for repeatable sends.',
      doing: 'GET /templates returns reusable envelope definitions with roles and tabs.',
      say: '“Templates encode policy once — every send uses the same approved language.”',
    }},
    { test: () => p.includes('/connect'), key: 'post_execution' },
    { test: () => p.includes('/forms') && p.includes('/instances'), key: 'webform' },
    { test: () => g.includes('web form') && p.includes('/forms'), key: 'webform' },
    { test: () => p.includes('/workflows') && p.includes('/trigger'), key: 'workflow_trigger' },
    { test: () => g.includes('workflow'), key: 'workflow_trigger' },
    { test: () => p.includes('/workspaces') && method === 'POST', key: 'external_review' },
    { test: () => p.includes('/workspaces'), key: 'external_review', override: {
      showing: 'Agreement hubs where agency and vendor collaborate on one contract.',
      doing: 'Workspaces API lists or opens a hub with folders, files, and participant access.',
      say: '“Think of a Workspace as a secure deal room — created and managed entirely via API.”',
    }},
    { test: () => p.includes('/agreements'), key: 'ai_scorecard' },
    { test: () => p.includes('/clm') || p.includes('playbook'), key: 'legal_review' },
    { test: () => p.includes('analyze'), key: 'ai_scorecard' },
    { test: () => p.includes('/rooms'), key: 'external_review' },
  ];
  for (const r of rules) {
    if (r.test()) {
      const base = r.key ? API_DEMO[r.key] : null;
      return { ...(base || {}), ...(r.override || {}) };
    }
  }
  return null;
}

function apiDemoForStep(step) {
  if (!step) return null;
  const byId = API_DEMO[step.id];
  const api = step.api || {};
  const byPath = apiDemoMatchPath(api.method, api.path, '');
  return {
    showing: byId?.showing || byPath?.showing || step.description,
    doing: byId?.doing || byPath?.doing || (api.desc ? `${api.method || 'API'} ${api.path || ''} — ${api.desc}` : ''),
    say: byId?.say || byPath?.say || '',
    afterSuccess: byId?.afterSuccess || byPath?.afterSuccess || '',
    stepTitle: step.title,
  };
}

function apiDemoForExplorer(method, path, group, desc) {
  const matched = apiDemoMatchPath(method, path, group);
  if (matched) {
    return {
      showing: matched.showing || desc,
      doing: matched.doing || desc,
      say: matched.say || '',
      afterSuccess: matched.afterSuccess || '',
    };
  }
  return {
    showing: desc || 'Live call against the State & Local demo account.',
    doing: `${method} ${path} — ${desc || 'DocuSign REST API'}`,
    say: group ? `“This is the ${group} API surface — same auth token, different base path.”` : '',
    afterSuccess: '',
  };
}

function apiDemoInterpretResponse(narration, statusCode, response) {
  const sc = Number(statusCode);
  const ok = sc >= 200 && sc < 300;
  const lines = [];
  if (ok) {
    lines.push(narration?.afterSuccess || apiDemoGuessSuccess(response));
    if (sc === 201) lines.push('HTTP 201 — a new resource was created (envelope, workspace, instance, etc.).');
    else if (sc === 200) lines.push('HTTP 200 — request succeeded; inspect the JSON for IDs you can use in the next demo step.');
  } else if (sc === 401) {
    lines.push('Not authenticated — sign in via JWT or OAuth on the portal, then retry. Say: “Our server holds the token; your app would pass Bearer auth the same way.”');
  } else if (sc === 404) {
    lines.push('Not found — replace {id} placeholders in the path with a real envelope, workspace, or workflow ID from a prior step.');
  } else if (sc >= 400) {
    lines.push('Client or server error — in a live demo, explain the validation message and show a pre-filled example that succeeds.');
  }
  return lines.filter(Boolean).join(' ');
}

function apiDemoGuessSuccess(response) {
  if (!response || typeof response !== 'object') return 'Call completed — walk through the response fields with your audience.';
  if (response.envelopeId) return `Envelope ${response.envelopeId} — use this ID for status, documents, or embedded signing next.`;
  if (response.workspaceId) return `Workspace ${response.workspaceId} — invite participants or list folders next.`;
  if (response.instanceId || response.workflowInstanceId) return 'Workflow instance started — poll status or open the embedded Maestro view.';
  if (response.formUrl || response.url) return 'Signing or form URL returned — embed it in your portal iframe.';
  if (Array.isArray(response.envelopes)) return `${response.envelopes.length} envelope(s) returned — pick one for a deeper drill-down.`;
  if (Array.isArray(response.workspaces)) return `${response.workspaces.length} workspace(s) — select one to show collaboration.`;
  return 'Call completed — point to the IDs and status fields your integration would persist.';
}

function apiDemoEsc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function apiDemoRenderCard(narration, opts = {}) {
  if (!narration) return '';
  const phase = opts.phase || 'before';
  const extra = opts.extra || '';
  const title = phase === 'running' ? 'Calling API…' : phase === 'after' ? 'What just happened' : 'Demo script · plain language';
  let body = '';
  if (phase === 'before') {
    if (narration.showing) body += `<p class="api-demo-line"><strong>What you’re showing:</strong> ${apiDemoEsc(narration.showing)}</p>`;
    if (narration.doing) body += `<p class="api-demo-line"><strong>What the API does:</strong> ${apiDemoEsc(narration.doing)}</p>`;
    if (narration.say) body += `<p class="api-demo-say">${apiDemoEsc(narration.say)}</p>`;
  } else if (phase === 'running') {
    body = `<p class="api-demo-line">${apiDemoEsc(narration.running || 'Sending the request to DocuSign with your portal’s auth token…')}</p>`;
  } else if (phase === 'after' && extra) {
    body = `<p class="api-demo-line">${apiDemoEsc(extra)}</p>`;
  }
  if (!body) return '';
  return `<div class="api-demo-narration api-demo-narration--${phase}" role="note">
    <div class="api-demo-narration-label">${apiDemoEsc(title)}</div>
    ${body}
  </div>`;
}

window.apiDemoForStep = apiDemoForStep;
window.apiDemoForExplorer = apiDemoForExplorer;
window.apiDemoInterpretResponse = apiDemoInterpretResponse;
window.apiDemoRenderCard = apiDemoRenderCard;
window.API_EXAMPLE_DEMO = API_EXAMPLE_DEMO;
