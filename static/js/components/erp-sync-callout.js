/* Shared ERP sync callout HTML for Connect demo + Gov Workflows post_execution */

function erpSyncCalloutHtml(opts = {}) {
  const vendor = opts.vendor || 'Acme Cloud Solutions, Inc.';
  const erp = opts.erp || 'FI$Cal';
  const value = opts.value || '$890,000/yr';
  const encumbrance = opts.encumbrance || 'ENC-2026-CDT-0048217';
  const registerId = opts.registerId || 'REG-2026-4421';
  const sub = opts.sub || `Contract data from the Connect webhook is transformed and pushed to ${erp} and your contract register — no re-keying.`;

  return `
    <div class="erp-sync-callout" role="region" aria-label="API sync to system of record">
      <div class="erp-sync-callout-head">
        <span class="erp-sync-callout-kicker">Connect → API call → ${erp}</span>
        <strong>Executed agreement synced to your system of record</strong>
        <p class="erp-sync-callout-sub">${sub}</p>
      </div>
      <div class="erp-sync-flow" aria-hidden="true">
        <span class="erp-sync-step erp-sync-step--done">① Connect webhook</span>
        <span class="erp-sync-arrow">→</span>
        <span class="erp-sync-step erp-sync-step--active">② Agency middleware</span>
        <span class="erp-sync-arrow">→</span>
        <span class="erp-sync-step erp-sync-step--pulse">③ POST ${erp}</span>
      </div>
      <div class="erp-sync-api-block">
        <div class="erp-sync-api-row">
          <span class="method-badge method-POST">POST</span>
          <code>/api/contracts/sync → ${erp} Contract API</code>
          <span class="erp-sync-status">201 Created</span>
        </div>
        <pre class="erp-sync-api-pre">{
  "event": "envelope-completed",
  "vendor": "${vendor}",
  "total_value": "${value}",
  "synced": true,
  "fi_cal_encumbrance": "${encumbrance}",
  "contract_register_id": "${registerId}",
  "targetSystems": ["${erp}", "AgencyContractDB", "Agreement Manager"]
}</pre>
      </div>
    </div>`;
}

window.erpSyncCalloutHtml = erpSyncCalloutHtml;
