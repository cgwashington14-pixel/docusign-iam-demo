/* Integration Story — CA agency customer-facing presentation */
(function () {
  'use strict';

  var PLATFORMS = {
    salesforce: {
      systemLabel: 'Salesforce · Agreement Request',
      agencyBadge: 'Caltrans',
      agencyName: 'Caltrans · Agreement request',
      headline: 'Send from the agency record — not from email.',
      body: 'DocuSign eSignature for Salesforce works with Cases, custom objects (like an Agreement Request), and Experience Cloud community users. Merge fields pre-fill the envelope from the request; vendors can sign as community users; writeback returns the PDF and status to that same record.',
      bullets: [
        'Cases, custom objects, and related agency records',
        'Experience Cloud / community users as signers',
        'Document writeback + configurable field updates'
      ],
      challenge: 'Agreement requests stall in email while vendors and staff chase packets off-system',
      outcome: 'Staff work the request in Salesforce; vendors sign via community access; PDF and status return to the request',
      webhookTarget: 'Salesforce · AGR-REQ-2026-1847',
      embedHost: 'Experience Cloud vendor portal',
      record: {
        type: 'Agreement Request',
        id: 'AGR-REQ-2026-1847',
        name: 'Highway Maintenance MSA — Bay Area',
        fields: {
          vendor: 'Pacific Infrastructure Group',
          amount: '$2,450,000',
          contact: 'Maria Chen · Contracts',
          email: 'contracts@pacificinfra.example',
          term: '36 months · renewable',
          status: 'Pending vendor signature'
        }
      }
    },
    microsoft: {
      systemLabel: 'SharePoint · Procurement list',
      agencyBadge: 'DGS',
      agencyName: 'DGS · SharePoint list + Power App',
      headline: 'SharePoint lists and Power Platform — one Microsoft path.',
      body: 'DocuSign for SharePoint can pre-populate from list columns and update when complete. Power Apps typically calls the DocuSign connector via Power Automate — including generating an embedded signing URL so signing can stay in-app.',
      bullets: [
        'SharePoint: list pre-populate + completion update',
        'Power Automate DocuSign connector actions',
        'Embedded signing URL pattern for Power Apps'
      ],
      challenge: 'Procurement leaves Microsoft 365 to chase signatures and re-file signed PDFs',
      outcome: 'Completed agreements can return to SharePoint; Power Apps can host signing via connector flows',
      webhookTarget: 'SharePoint · REQ-DGS-4421',
      embedHost: 'Power App / SharePoint',
      record: {
        type: 'List item',
        id: 'REQ-DGS-4421',
        name: 'Statewide Office Supplies MOU',
        fields: {
          vendor: 'Golden State Supply Co.',
          amount: '$485,000',
          contact: 'James Ortiz · Procurement',
          email: 'j.ortiz@dgs.ca.gov',
          term: '24 months',
          status: 'Pending award'
        }
      }
    },
    servicenow: {
      systemLabel: 'ServiceNow · Catalog request',
      agencyBadge: 'CDT',
      agencyName: 'CDT · IT / procurement request',
      headline: 'Close the ticket with a signed agreement.',
      body: 'The DocuSign eSignature Spoke for ServiceNow IntegrationHub can create envelopes from templates, map catalog variables into DocuSign fields, wait on signature webhooks, and attach completed documents back to the ServiceNow record.',
      bullets: [
        'DocuSign eSignature Spoke (IntegrationHub)',
        'Catalog / flow variables → envelope fields',
        'Webhook wait + attach documents to the record'
      ],
      challenge: 'Catalog requests close without a reliable link to the signed agreement',
      outcome: 'Flow Designer can pause for signature, then attach the completed packet and continue the RITM',
      webhookTarget: 'ServiceNow · RITM0188472',
      embedHost: 'ServiceNow workspace',
      record: {
        type: 'Catalog request',
        id: 'RITM0188472',
        name: 'Enterprise Security SaaS Renewal',
        fields: {
          vendor: 'NexusShield Technologies',
          amount: '$1,120,000',
          contact: 'Priya Shah · CDT Contracts',
          email: 'priya.shah@cdt.ca.gov',
          term: '12 months · auto-renew option',
          status: 'Awaiting signature'
        }
      }
    }
  };

  var platAnimTimers = [];
  var connectTimers = [];
  var procureTimers = [];

  var PROCURE_PHASES = {
    intake: {
      eyebrow: 'Pre-execution',
      headline: 'Right data in. Cleaner drafts out.',
      body: 'Requests arrive by email, shared drive, and adjacent systems of record — then get retyped into packets. IAM helps pull trusted fields into the draft, or extract context from incoming paper, so intake starts with signal instead of guesswork.',
      points: [
        'Map known vendor, amount, and program data into the agreement',
        'Extract context from vendor paper when the request is unstructured',
        'Cut the rekey loop that introduces errors before anyone signs'
      ],
      before: 'Fields scattered across inboxes and drives; drafts rebuilt by hand',
      after: 'Structured intake that pre-fills the packet and keeps context with the request'
    },
    triage: {
      eyebrow: 'Triage & route',
      headline: 'Simple and complex should not share one holding pattern.',
      body: 'A routine supply order and a multi-million MSA often land in the same queue — and both wait. DocuSign IAM helps orchestrate intake by complexity so fast lanes move, and high-risk work gets the review it deserves.',
      points: [
        'Separate lightweight packets from high-value, multi-party agreements',
        'Keep one platform of record for both paths',
        'Reduce the “everything waits together” backlog agencies feel every quarter'
      ],
      before: 'Every request sits in the same stalled pile regardless of risk or value',
      after: 'Routed lanes — quick complete for simple work, governed review for complex'
    },
    approve: {
      eyebrow: 'Approvals',
      headline: 'Know who stood in the approval path — and prove it.',
      body: 'Liability and auditability matter when dollars, vendors, and public trust are on the line. IAM captures who was in the process, what they decided, and when — a trail you can explain to leadership, auditors, and counsel.',
      points: [
        'Named approvers with timestamps on each decision',
        'A clear chain from program → legal → authorized signer',
        'Evidence that travels with the agreement, not a lost email thread'
      ],
      before: 'Approvals lived in inboxes; reconstructing “who said yes” is a scavenger hunt',
      after: 'An auditable approval path tied to the agreement itself'
    },
    post: {
      eyebrow: 'Post-execution',
      headline: 'Signed should mean usable — not trapped.',
      body: 'After execution, critical terms often stay locked in PDFs. Teams rekey renewal dates, values, and obligations into other systems — and errors creep in. IAM helps unlock that content so post-execution work starts from the signed truth.',
      points: [
        'Surface parties, values, renewals, and obligations from completed agreements',
        'Reduce rekey into ERP, procurement, and program trackers',
        'Feed renewals and oversight without rebuilding the file from scratch'
      ],
      before: 'Dead-end PDFs, manual rekey, and avoidable data errors',
      after: 'Structured post-execution data ready for renewals and downstream systems'
    }
  };

  var MCP_SCENARIOS = {
    renewals: {
      user: 'Which supplier MSAs renew in the next 90 days?',
      tool: 'getAllAgreements',
      args: '{ agreementType: "MSA", dateFilters: "renewal window" }',
      answer: 'Agreement Manager returned three MSA records in that renewal window. Highest value is the Bay Area maintenance MSA (illustrative agency scenario).',
      rows: [
        ['Agreement', 'Value', 'Renewal'],
        ['Highway Maintenance MSA — Bay Area', '$2,450,000', 'Jun 30, 2027'],
        ['Central Valley Striping MSA', '$980,000', 'Jul 15, 2027'],
        ['District 4 On-Call Design MSA', '$1,200,000', 'Aug 1, 2027']
      ],
      pills: ['sky', 'sky', 'sky']
    },
    status: {
      user: 'What’s the status of envelope ENV-CA-4821?',
      tool: 'getEnvelope',
      args: '{ envelopeId: "ENV-CA-4821" }',
      answer: 'eSignature tools report the envelope completed. Recipient-level status is available through related MCP eSignature tools — useful before a Connect writeback or CRM update.',
      rows: [
        ['Recipient', 'Role', 'Status'],
        ['Maria Chen', 'Program manager', 'Completed'],
        ['Legal counsel', 'Reviewer', 'Completed'],
        ['Authorized signer', 'Signer', 'Completed']
      ],
      pills: ['green', 'green', 'green']
    },
    workflow: {
      user: 'Start the vendor onboarding Workflow Builder process for Golden State Supply.',
      tool: 'triggerWorkflow',
      args: 'getWorkflowTriggerRequirements → triggerWorkflow({ inputs })',
      answer: 'After reading trigger requirements, MCP started a Workflow Builder instance. High-impact actions like this are designed for human confirmation in the AI client before execution.',
      rows: [
        ['Step', 'Owner', 'State'],
        ['Validate vendor record', 'Procurement', 'In progress'],
        ['Generate onboarding packet', 'Workflow', 'Queued'],
        ['Route for signature', 'Contracts', 'Waiting']
      ],
      pills: ['amber', 'sky', 'amber']
    },
    terms: {
      user: 'Pull parties, value, and renewal date for agreement AGR-CDT-1884.',
      tool: 'getAgreementDetails',
      args: '{ agreementId: "AGR-CDT-1884" }',
      answer: 'Agreement Manager returned structured metadata for that agreement. Those values can inform a renewal envelope or a downstream workflow — Agreement Manager MCP access is retrieval-oriented.',
      rows: [
        ['Field', 'Value', 'Source'],
        ['Party A', 'State of California · CDT', 'Agreement Manager'],
        ['Party B', 'NexusShield Technologies', 'Agreement Manager'],
        ['Contract value', '$1,120,000', 'Agreement data']
      ],
      pills: ['sky', 'sky', 'green']
    }
  };

  var currentPlatform = 'salesforce';
  var currentStep = 0;
  var animTimer = null;
  var animTimers = [];
  var mcpTimers = [];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function clearAnimTimers() {
    animTimers.forEach(function (id) { clearTimeout(id); });
    animTimers = [];
    if (animTimer) {
      clearTimeout(animTimer);
      animTimer = null;
    }
  }

  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    animTimers.push(id);
    return id;
  }

  function clearMapped() {
    $all('.is-record-fields > div').forEach(function (row) { row.classList.remove('is-mapped'); });
    $all('.is-tab').forEach(function (tab) {
      tab.classList.remove('is-filled', 'is-flying');
      var em = tab.querySelector('em');
      if (em) em.textContent = '—';
    });
    var route = $('#is-envelope-route');
    if (route) {
      route.classList.remove('is-active');
      $all('.is-route-step', route).forEach(function (s) { s.classList.remove('is-signed'); });
    }
    var status = $('#is-envelope-status');
    if (status) {
      status.textContent = 'Ready to map fields';
      status.classList.remove('is-ok');
    }
    var envId = $('#is-envelope-id');
    if (envId) envId.textContent = 'ENV — awaiting send';
    $all('.is-wb-list li').forEach(function (li) { li.classList.remove('is-in'); });
    var st = document.querySelector('[data-field="status"]');
    if (st) {
      st.textContent = PLATFORMS[currentPlatform].record.fields.status;
      st.className = 'is-status is-status--open';
    }
  }

  function lightPanels(step) {
    var source = $('#is-panel-source');
    var envelope = $('#is-panel-envelope');
    var target = $('#is-panel-target');
    [source, envelope, target].forEach(function (p) { if (p) p.classList.remove('is-lit'); });
    if (step >= 0 && source) source.classList.add('is-lit');
    if (step >= 1 && envelope) envelope.classList.add('is-lit');
    if (step >= 3 && target) target.classList.add('is-lit');
  }

  function fillTabs() {
    var fields = PLATFORMS[currentPlatform].record.fields;
    var keys = ['vendor', 'amount', 'contact', 'email', 'term'];
    keys.forEach(function (key, i) {
      later(function () {
        var row = document.querySelector('[data-field="' + key + '"]');
        if (row && row.parentElement) row.parentElement.classList.add('is-mapped');
        var tab = document.querySelector('.is-tab[data-map="' + key + '"]');
        if (tab) {
          tab.classList.add('is-filled', 'is-flying');
          var em = tab.querySelector('em');
          if (em) em.textContent = fields[key];
          later(function () { tab.classList.remove('is-flying'); }, 450);
        }
        if (i === keys.length - 1) {
          var status = $('#is-envelope-status');
          if (status) status.textContent = 'Fields mapped · ready to send';
          var envId = $('#is-envelope-id');
          if (envId) envId.textContent = 'ENV-CA-' + (1000 + Math.floor(Math.random() * 8000));
        }
      }, i * 220);
    });
  }

  function activateRoute() {
    var route = $('#is-envelope-route');
    if (route) route.classList.add('is-active');
    var status = $('#is-envelope-status');
    if (status) status.textContent = 'Routing for signature…';
    $all('.is-route-step').forEach(function (step, i) {
      later(function () {
        step.classList.add('is-signed');
        if (i === 2 && status) {
          status.textContent = 'Completed · all parties signed';
          status.classList.add('is-ok');
        }
      }, 400 + i * 450);
    });
  }

  function activateWriteback() {
    $all('.is-wb-list li').forEach(function (li, i) {
      later(function () { li.classList.add('is-in'); }, i * 280);
    });
    later(function () {
      var st = document.querySelector('[data-field="status"]');
      if (st) {
        st.textContent = 'Completed';
        st.className = 'is-status is-status--done';
      }
    }, 900);
  }

  function setFlowStep(step) {
    clearAnimTimers();
    currentStep = step;
    $all('.is-flow-step').forEach(function (btn) {
      var s = parseInt(btn.getAttribute('data-step'), 10);
      btn.classList.toggle('is-flow-step--active', s === step);
      btn.classList.toggle('is-flow-step--done', s < step);
    });

    clearMapped();
    lightPanels(step);

    if (step >= 1) {
      lightPanels(Math.max(step, 1));
      fillTabs();
    }
    if (step >= 2) {
      later(activateRoute, step === 2 ? 200 : 1100);
    }
    if (step >= 3) {
      later(function () {
        lightPanels(3);
        activateWriteback();
      }, step === 3 ? 1400 : 2200);
    }
  }

  function applyRecord(platformKey) {
    var p = PLATFORMS[platformKey];
    if (!p) return;
    var r = p.record;
    var setText = function (id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setText('is-source-title', p.systemLabel);
    setText('is-source-badge', p.agencyBadge);
    setText('is-record-type', r.type);
    setText('is-record-id', r.id);
    setText('is-record-name', r.name);
    Object.keys(r.fields).forEach(function (key) {
      var el = document.querySelector('[data-field="' + key + '"]');
      if (!el) return;
      if (key === 'status') {
        el.textContent = r.fields[key];
        el.className = 'is-status is-status--open';
      } else {
        el.textContent = r.fields[key];
      }
    });
  }

  function clearPlatTimers() {
    platAnimTimers.forEach(function (id) { clearTimeout(id); });
    platAnimTimers = [];
  }

  function platLater(fn, ms) {
    var id = setTimeout(fn, ms);
    platAnimTimers.push(id);
    return id;
  }

  function platformVisualHtml(key) {
    var p = PLATFORMS[key];
    var r = p.record;
    if (key === 'salesforce') {
      return (
        '<div class="is-agency-mock is-agency-mock--sf" data-mock="salesforce">' +
          '<div class="is-agency-bar"><span class="is-agency-cloud">Public Sector</span><span>Agreement Requests</span><span class="is-agency-pill">Caltrans</span></div>' +
          '<div class="is-agency-body">' +
            '<div class="is-agency-title-row"><strong>' + r.name + '</strong><span class="is-agency-status" data-mock-status>' + r.fields.status + '</span></div>' +
            '<div class="is-agency-id">' + r.id + ' · Custom object</div>' +
            '<div class="is-agency-fields">' +
              '<div data-mock-field><span>Vendor</span><em>' + r.fields.vendor + '</em></div>' +
              '<div data-mock-field><span>Amount</span><em>' + r.fields.amount + '</em></div>' +
              '<div data-mock-field><span>Community signer</span><em>' + r.fields.email + '</em></div>' +
            '</div>' +
            '<div class="is-sf-community" data-mock-community>Experience Cloud · vendor community user</div>' +
            '<button type="button" class="is-agency-cta" data-mock-cta tabindex="-1">Send with DocuSign</button>' +
            '<div class="is-agency-progress" data-mock-progress>' +
              '<div class="is-agency-step" data-mock-step>1 · Prefill from request</div>' +
              '<div class="is-agency-step" data-mock-step>2 · Community signs</div>' +
              '<div class="is-agency-step" data-mock-step>3 · Writeback to request</div>' +
            '</div>' +
            '<div class="is-agency-done" data-mock-done>PDF on Agreement Request · status updated for staff</div>' +
          '</div>' +
        '</div>'
      );
    }
    if (key === 'microsoft') {
      return (
        '<div class="is-agency-mock is-agency-mock--ms" data-mock="microsoft">' +
          '<div class="is-agency-bar"><span class="is-agency-ms">SharePoint</span><span>Procurement list</span><span class="is-agency-pill">DGS</span></div>' +
          '<div class="is-agency-body">' +
            '<div class="is-ms-list">' +
              '<div class="is-ms-row is-ms-row--head"><span>Request</span><span>Vendor</span><span>Status</span></div>' +
              '<div class="is-ms-row is-ms-row--active" data-mock-row><span>' + r.id + '</span><span>' + r.fields.vendor + '</span><span data-mock-status>' + r.fields.status + '</span></div>' +
              '<div class="is-ms-row"><span>REQ-DGS-4390</span><span>Valley Print Co.</span><span>Awarded</span></div>' +
            '</div>' +
            '<div class="is-ms-app" data-mock-app>' +
              '<div class="is-ms-app-label">Power App → Power Automate → DocuSign</div>' +
              '<div class="is-ms-app-fields"><span>Amount ' + r.fields.amount + '</span><span>Term ' + r.fields.term + '</span></div>' +
              '<div class="is-embed-mini" data-mock-embed><em>Embedded signing URL</em><button type="button" tabindex="-1">Sign</button></div>' +
            '</div>' +
            '<div class="is-agency-done" data-mock-done>SharePoint updated · completed file stored</div>' +
          '</div>' +
        '</div>'
      );
    }
    return (
      '<div class="is-agency-mock is-agency-mock--sn" data-mock="servicenow">' +
        '<div class="is-agency-bar"><span class="is-agency-sn">ServiceNow</span><span>Catalog request</span><span class="is-agency-pill">CDT</span></div>' +
        '<div class="is-agency-body">' +
          '<div class="is-agency-title-row"><strong>' + r.name + '</strong><span class="is-agency-status" data-mock-status>' + r.fields.status + '</span></div>' +
          '<div class="is-agency-id">' + r.id + ' · ' + r.fields.amount + '</div>' +
          '<div class="is-sn-timeline">' +
            '<div class="is-sn-node" data-mock-step>Catalog request</div>' +
            '<div class="is-sn-node" data-mock-step>Spoke: create envelope</div>' +
            '<div class="is-sn-node" data-mock-step>Wait for webhook</div>' +
            '<div class="is-sn-node" data-mock-step>Attach + continue flow</div>' +
          '</div>' +
          '<div class="is-agency-done" data-mock-done>Documents attached to ServiceNow record</div>' +
        '</div>' +
      '</div>'
    );
  }

  function animatePlatformVisual(key) {
    clearPlatTimers();
    var root = $('#is-plat-visual');
    if (!root) return;
    root.innerHTML = platformVisualHtml(key);
    var mock = root.querySelector('.is-agency-mock');
    if (!mock) return;

    platLater(function () { mock.classList.add('is-agency-mock--in'); }, 40);

    if (key === 'salesforce') {
      $all('[data-mock-field]', mock).forEach(function (el, i) {
        platLater(function () { el.classList.add('is-lit-field'); }, 280 + i * 220);
      });
      platLater(function () {
        var community = mock.querySelector('[data-mock-community]');
        if (community) community.classList.add('is-on');
      }, 850);
      platLater(function () {
        var cta = mock.querySelector('[data-mock-cta]');
        if (cta) cta.classList.add('is-pulse');
      }, 1100);
      $all('[data-mock-step]', mock).forEach(function (el, i) {
        platLater(function () { el.classList.add('is-on'); }, 1400 + i * 550);
      });
      platLater(function () {
        var st = mock.querySelector('[data-mock-status]');
        if (st) { st.textContent = 'Fully executed'; st.classList.add('is-done'); }
        var done = mock.querySelector('[data-mock-done]');
        if (done) done.classList.add('is-show');
      }, 3200);
      return;
    }

    if (key === 'microsoft') {
      platLater(function () {
        var row = mock.querySelector('[data-mock-row]');
        if (row) row.classList.add('is-focus-row');
      }, 300);
      platLater(function () {
        var app = mock.querySelector('[data-mock-app]');
        if (app) app.classList.add('is-show-app');
      }, 900);
      platLater(function () {
        var emb = mock.querySelector('[data-mock-embed]');
        if (emb) emb.classList.add('is-sign-pulse');
      }, 1500);
      platLater(function () {
        var st = mock.querySelector('[data-mock-status]');
        if (st) { st.textContent = 'Complete'; st.classList.add('is-done'); }
        var done = mock.querySelector('[data-mock-done]');
        if (done) done.classList.add('is-show');
      }, 2400);
      return;
    }

    $all('[data-mock-step]', mock).forEach(function (el, i) {
      platLater(function () { el.classList.add('is-on'); }, 350 + i * 500);
    });
    platLater(function () {
      var st = mock.querySelector('[data-mock-status]');
      if (st) { st.textContent = 'Closed Complete'; st.classList.add('is-done'); }
      var done = mock.querySelector('[data-mock-done]');
      if (done) done.classList.add('is-show');
    }, 2600);
  }

  /* Note: ServiceNow "Closed Complete" is illustrative RITM wording after spoke + webhook flow. */

  function syncConnectTarget(key) {
    var p = PLATFORMS[key];
    if (!p) return;
    var name = $('#is-webhook-target-name');
    if (name) name.textContent = p.webhookTarget;
    var host = $('#is-embed-host-label');
    if (host) host.textContent = p.embedHost;
    $all('[data-wb-field]').forEach(function (el) {
      var kind = el.getAttribute('data-wb-field');
      var em = el.querySelector('em');
      if (!em) return;
      if (kind === 'status') em.textContent = p.record.fields.status;
      if (kind === 'pdf') em.textContent = '—';
      if (kind === 'date') em.textContent = '—';
    });
    $all('.is-webhook-events li').forEach(function (li) { li.classList.remove('is-fire'); });
    var target = $('#is-webhook-target');
    if (target) target.classList.remove('is-synced');
  }

  function replayConnectEvents() {
    connectTimers.forEach(function (id) { clearTimeout(id); });
    connectTimers = [];
    var events = $all('.is-webhook-events li');
    events.forEach(function (li) { li.classList.remove('is-fire'); });
    syncConnectTarget(currentPlatform);

    events.forEach(function (li, i) {
      var id = setTimeout(function () {
        li.classList.add('is-fire');
        if (i === 0) {
          var st = document.querySelector('[data-wb-field="status"] em');
          if (st) st.textContent = 'Sent';
        }
        if (i === 1) {
          var st2 = document.querySelector('[data-wb-field="status"] em');
          if (st2) st2.textContent = 'Delivered';
        }
        if (i === 2) {
          var st3 = document.querySelector('[data-wb-field="status"] em');
          var pdf = document.querySelector('[data-wb-field="pdf"] em');
          var date = document.querySelector('[data-wb-field="date"] em');
          if (st3) st3.textContent = 'Completed';
          if (pdf) pdf.textContent = 'Attached';
          if (date) date.textContent = 'Today';
          var target = $('#is-webhook-target');
          if (target) {
            target.classList.remove('is-synced');
            void target.offsetWidth;
            target.classList.add('is-synced');
          }
        }
      }, 350 + i * 700);
      connectTimers.push(id);
    });
  }

  function selectPlatform(key) {
    if (!PLATFORMS[key]) return;
    currentPlatform = key;
    $all('.is-platform-tab').forEach(function (tab) {
      var on = tab.getAttribute('data-platform') === key;
      tab.classList.toggle('is-platform-tab--active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    var p = PLATFORMS[key];
    var detail = $('#is-platform-detail');
    if (detail) {
      detail.classList.remove('is-switching');
      void detail.offsetWidth;
      detail.classList.add('is-switching');
      detail.setAttribute('data-platform', key);
    }

    var setText = function (id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setText('is-plat-agency-name', p.agencyName);
    setText('is-plat-headline', p.headline);
    setText('is-plat-body', p.body);
    setText('is-plat-challenge', p.challenge);
    setText('is-plat-outcome', p.outcome);

    var bullets = $('#is-plat-bullets');
    if (bullets) {
      bullets.innerHTML = p.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('');
    }

    applyRecord(key);
    setFlowStep(0);
    animatePlatformVisual(key);
    syncConnectTarget(key);
  }

  function updateNavToggleLabel() {
    var label = $('#is-nav-toggle-label');
    var collapsed = document.body.classList.contains('sidebar-collapsed');
    if (label) label.textContent = collapsed ? 'Show navigation' : 'Hide navigation';
  }

  function updateChromeToggleLabel() {
    var label = $('#is-chrome-toggle-label');
    var focused = document.body.classList.contains('is-focus-mode');
    if (label) label.textContent = focused ? 'Exit focus mode' : 'Focus mode';
    var btn = $('#is-chrome-toggle');
    if (btn) btn.classList.toggle('is-active', focused);
  }

  function enableFocusMode(on) {
    document.body.classList.toggle('is-focus-mode', on);
    document.documentElement.classList.toggle('is-story-focus', on);
    localStorage.setItem('ds-is-focus', on ? '1' : '0');

    if (on) {
      if (typeof toggleExecutiveMode === 'function' && typeof executiveModeActive === 'function' && executiveModeActive()) {
        toggleExecutiveMode(false);
      }
      if (typeof toggleScvMode === 'function' && typeof scvModeActive === 'function' && scvModeActive()) {
        toggleScvMode(false);
      }
      if (typeof toggleHighLevelMode === 'function' && typeof hlModeActive === 'function' && hlModeActive()) {
        toggleHighLevelMode(false);
      }
      if (typeof setSidebarCollapsed === 'function') {
        setSidebarCollapsed(true);
      } else {
        document.body.classList.add('sidebar-collapsed');
      }
    }
    updateNavToggleLabel();
    updateChromeToggleLabel();
  }

  function clearMcpTimers() {
    mcpTimers.forEach(function (id) { clearTimeout(id); });
    mcpTimers = [];
  }

  function mcpLater(fn, ms) {
    var id = setTimeout(fn, ms);
    mcpTimers.push(id);
    return id;
  }

  function pillClass(kind) {
    if (kind === 'amber') return 'is-mcp-result-pill is-mcp-result-pill--amber';
    if (kind === 'sky') return 'is-mcp-result-pill is-mcp-result-pill--sky';
    return 'is-mcp-result-pill';
  }

  function renderMcpScenario(key) {
    var scenario = MCP_SCENARIOS[key];
    var thread = $('#is-mcp-thread');
    if (!scenario || !thread) return;

    clearMcpTimers();
    $all('.is-mcp-prompt').forEach(function (btn) {
      btn.classList.toggle('is-mcp-prompt--active', btn.getAttribute('data-mcp') === key);
    });

    thread.innerHTML = '';

    function addUser() {
      var wrap = document.createElement('div');
      wrap.className = 'is-mcp-msg is-mcp-msg--user';
      wrap.innerHTML = '<span class="is-mcp-msg-label">Agency user</span><div class="is-mcp-bubble"></div>';
      thread.appendChild(wrap);
      wrap.querySelector('.is-mcp-bubble').textContent = scenario.user;
    }

    function addTool() {
      var wrap = document.createElement('div');
      wrap.className = 'is-mcp-msg is-mcp-msg--tool';
      var rows = scenario.rows.map(function (row, idx) {
        if (idx === 0) {
          return '<div class="is-mcp-result-row"><span>' + row[0] + '</span><span>' + row[1] + '</span><span>' + row[2] + '</span></div>';
        }
        var pill = scenario.pills[idx - 1] || 'green';
        var third = idx === 0 ? row[2] : '<span class="' + pillClass(pill) + '">' + row[2] + '</span>';
        return '<div class="is-mcp-result-row"><strong>' + row[0] + '</strong><span>' + row[1] + '</span>' + third + '</div>';
      }).join('');

      wrap.innerHTML =
        '<span class="is-mcp-msg-label">DocuSign MCP tool</span>' +
        '<div class="is-mcp-tool">' +
          '<div class="is-mcp-tool-head"><span class="is-mcp-tool-name">' + scenario.tool + '</span><span class="is-mcp-tool-status">Returned</span></div>' +
          '<div class="is-mcp-tool-args">' + scenario.args + '</div>' +
          '<div class="is-mcp-result">' + rows + '</div>' +
        '</div>';
      thread.appendChild(wrap);
      thread.scrollTop = thread.scrollHeight;
    }

    function addAnswer() {
      var wrap = document.createElement('div');
      wrap.className = 'is-mcp-msg is-mcp-msg--assistant';
      wrap.innerHTML = '<span class="is-mcp-msg-label">Assistant</span><div class="is-mcp-bubble"></div>';
      thread.appendChild(wrap);
      wrap.querySelector('.is-mcp-bubble').textContent = scenario.answer;
      thread.scrollTop = thread.scrollHeight;
    }

    addUser();
    mcpLater(addTool, 420);
    mcpLater(addAnswer, 980);
  }

  function clearProcureTimers() {
    procureTimers.forEach(clearTimeout);
    procureTimers = [];
  }

  function procureLater(fn, ms) {
    procureTimers.push(setTimeout(fn, ms));
  }

  function setProcureCopy(key) {
    var phase = PROCURE_PHASES[key];
    if (!phase) return;
    var eyebrow = $('#is-procure-eyebrow');
    var headline = $('#is-procure-headline');
    var body = $('#is-procure-body');
    var points = $('#is-procure-points');
    var before = $('#is-procure-before');
    var after = $('#is-procure-after');
    if (eyebrow) eyebrow.textContent = phase.eyebrow;
    if (headline) headline.textContent = phase.headline;
    if (body) body.textContent = phase.body;
    if (before) before.textContent = phase.before;
    if (after) after.textContent = phase.after;
    if (points) {
      points.innerHTML = phase.points.map(function (p) {
        return '<li>' + p + '</li>';
      }).join('');
    }
  }

  function buildProcureScenes() {
    var host = $('#is-procure-visual');
    if (!host) return;
    host.innerHTML =
      '<div class="is-proc-scene" data-proc-scene="intake">' +
        '<div class="is-proc-chrome"><strong>Intake → draft</strong><span class="is-proc-pill">IAM</span></div>' +
        '<div class="is-proc-scatter">' +
          '<span class="is-proc-chip" data-chip>Email thread</span>' +
          '<span class="is-proc-chip" data-chip>Shared drive PDF</span>' +
          '<span class="is-proc-chip" data-chip>ERP / FI$Cal fields</span>' +
          '<span class="is-proc-chip" data-chip>Program request</span>' +
        '</div>' +
        '<div class="is-proc-draft">' +
          '<div class="is-proc-draft-row" data-draft-row><span>Vendor</span><em>Pacific Infrastructure Group</em></div>' +
          '<div class="is-proc-draft-row" data-draft-row><span>Amount</span><em>$2,450,000</em></div>' +
          '<div class="is-proc-draft-row" data-draft-row><span>Program</span><em>Bay Area maintenance</em></div>' +
          '<div class="is-proc-draft-row" data-draft-row><span>Term</span><em>36 months · renewable</em></div>' +
        '</div>' +
      '</div>' +
      '<div class="is-proc-scene" data-proc-scene="triage">' +
        '<div class="is-proc-chrome"><strong>Intake queue</strong><span class="is-proc-pill">Holding pattern</span></div>' +
        '<div class="is-proc-queue">' +
          '<div class="is-proc-card" data-proc-card="simple">' +
            '<span class="is-proc-card-tag is-simple">Simple</span>' +
            '<div><strong>Office supplies PO</strong><small>$12,400 · single approver</small></div>' +
            '<span class="is-proc-card-status" data-card-status>Waiting</span>' +
          '</div>' +
          '<div class="is-proc-card" data-proc-card="complex">' +
            '<span class="is-proc-card-tag is-complex">Complex</span>' +
            '<div><strong>Highway Maintenance MSA</strong><small>$2.45M · multi-party review</small></div>' +
            '<span class="is-proc-card-status" data-card-status>Waiting</span>' +
          '</div>' +
        '</div>' +
        '<div class="is-proc-lanes" data-proc-lanes>' +
          '<div class="is-proc-lane">Fast lane<em>Template · light approval</em></div>' +
          '<div class="is-proc-lane">Full review<em>Legal · risk · authorized signer</em></div>' +
        '</div>' +
      '</div>' +
      '<div class="is-proc-scene" data-proc-scene="approve">' +
        '<div class="is-proc-chrome"><strong>Approval audit trail</strong><span class="is-proc-pill">Liable path</span></div>' +
        '<div class="is-proc-audit">' +
          '<div class="is-proc-audit-row" data-audit="0"><span class="is-proc-audit-dot">1</span><div><strong>Maria Chen · Contracts</strong><small>Submitted for review</small></div><time>09:14</time></div>' +
          '<div class="is-proc-audit-row" data-audit="1"><span class="is-proc-audit-dot">2</span><div><strong>Legal counsel</strong><small>Approved with redline notes</small></div><time>11:02</time></div>' +
          '<div class="is-proc-audit-row" data-audit="2"><span class="is-proc-audit-dot">3</span><div><strong>Program manager</strong><small>Budget &amp; scope confirmed</small></div><time>13:40</time></div>' +
          '<div class="is-proc-audit-row" data-audit="3"><span class="is-proc-audit-dot">4</span><div><strong>Authorized signer</strong><small>Ready for signature</small></div><time>15:18</time></div>' +
        '</div>' +
      '</div>' +
      '<div class="is-proc-scene" data-proc-scene="post">' +
        '<div class="is-proc-chrome"><strong>After execution</strong><span class="is-proc-pill">Unlock data</span></div>' +
        '<div class="is-proc-post">' +
          '<div class="is-proc-post-col">' +
            '<h4>Trapped in the PDF</h4>' +
            '<div class="is-proc-trap" data-trap>Renewal date retyped…</div>' +
            '<div class="is-proc-trap" data-trap>Contract value mismatch</div>' +
            '<div class="is-proc-trap" data-trap>Obligation missed in tracker</div>' +
          '</div>' +
          '<div class="is-proc-post-col is-good">' +
            '<h4>Structured for reuse</h4>' +
            '<div class="is-proc-unlock" data-unlock>Renewal · Jun 30, 2027</div>' +
            '<div class="is-proc-unlock" data-unlock>Value · $2,450,000</div>' +
            '<div class="is-proc-unlock" data-unlock>Obligation · insurance certificate</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function showProcureScene(key) {
    $all('[data-proc-scene]').forEach(function (el) {
      el.classList.toggle('is-on', el.getAttribute('data-proc-scene') === key);
    });
  }

  function animateIntakeScene() {
    showProcureScene('intake');
    $all('[data-chip]').forEach(function (chip) {
      chip.classList.remove('is-gather');
    });
    $all('[data-draft-row]').forEach(function (row) {
      row.classList.remove('is-filled');
    });
    $all('[data-chip]').forEach(function (chip, i) {
      procureLater(function () {
        chip.classList.add('is-gather');
      }, 180 + i * 220);
    });
    $all('[data-draft-row]').forEach(function (row, i) {
      procureLater(function () {
        row.classList.add('is-filled');
      }, 980 + i * 240);
    });
  }

  function animateTriageScene() {
    showProcureScene('triage');
    var simple = document.querySelector('[data-proc-card="simple"]');
    var complex = document.querySelector('[data-proc-card="complex"]');
    var lanes = document.querySelector('[data-proc-lanes]');
    [simple, complex].forEach(function (card) {
      if (!card) return;
      card.classList.add('is-stuck');
      card.classList.remove('is-routed');
      var status = card.querySelector('[data-card-status]');
      if (status) status.textContent = 'Waiting';
    });
    if (lanes) lanes.classList.remove('is-on');

    procureLater(function () {
      if (lanes) lanes.classList.add('is-on');
    }, 700);
    procureLater(function () {
      if (simple) {
        simple.classList.remove('is-stuck');
        simple.classList.add('is-routed');
        var s = simple.querySelector('[data-card-status]');
        if (s) s.textContent = 'Fast lane';
      }
    }, 1200);
    procureLater(function () {
      if (complex) {
        complex.classList.remove('is-stuck');
        complex.classList.add('is-routed');
        var s = complex.querySelector('[data-card-status]');
        if (s) s.textContent = 'Full review';
      }
    }, 1650);
  }

  function animateApproveScene() {
    showProcureScene('approve');
    $all('[data-audit]').forEach(function (row) {
      row.classList.remove('is-on');
    });
    $all('[data-audit]').forEach(function (row, i) {
      procureLater(function () {
        row.classList.add('is-on');
      }, 280 + i * 420);
    });
  }

  function animatePostScene() {
    showProcureScene('post');
    $all('[data-trap]').forEach(function (el) {
      el.classList.remove('is-err');
    });
    $all('[data-unlock]').forEach(function (el) {
      el.classList.remove('is-on');
    });
    $all('[data-trap]').forEach(function (el, i) {
      procureLater(function () {
        el.classList.add('is-err');
      }, 220 + i * 280);
    });
    $all('[data-unlock]').forEach(function (el, i) {
      procureLater(function () {
        el.classList.add('is-on');
      }, 1100 + i * 320);
    });
  }

  function selectProcurePhase(key, animate) {
    if (!PROCURE_PHASES[key]) return;
    $all('.is-procure-phase').forEach(function (btn) {
      var on = btn.getAttribute('data-procure') === key;
      btn.classList.toggle('is-procure-phase--active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    setProcureCopy(key);
    clearProcureTimers();
    if (animate === false) {
      showProcureScene(key);
      if (key === 'intake') {
        $all('[data-chip]').forEach(function (c) { c.classList.add('is-gather'); });
        $all('[data-draft-row]').forEach(function (r) { r.classList.add('is-filled'); });
      } else if (key === 'triage') {
        $all('[data-proc-card]').forEach(function (card) {
          card.classList.remove('is-stuck');
          card.classList.add('is-routed');
        });
        var lanes = document.querySelector('[data-proc-lanes]');
        if (lanes) lanes.classList.add('is-on');
        var simple = document.querySelector('[data-proc-card="simple"] [data-card-status]');
        var complex = document.querySelector('[data-proc-card="complex"] [data-card-status]');
        if (simple) simple.textContent = 'Fast lane';
        if (complex) complex.textContent = 'Full review';
      } else if (key === 'approve') {
        $all('[data-audit]').forEach(function (r) { r.classList.add('is-on'); });
      } else if (key === 'post') {
        $all('[data-unlock]').forEach(function (u) { u.classList.add('is-on'); });
      }
      return;
    }
    if (key === 'intake') animateIntakeScene();
    else if (key === 'triage') animateTriageScene();
    else if (key === 'approve') animateApproveScene();
    else animatePostScene();
  }

  function playProcureStory() {
    var btn = $('#is-procure-play');
    if (btn && btn.classList.contains('is-playing')) {
      clearProcureTimers();
      btn.classList.remove('is-playing');
      btn.textContent = '▶ Play the intake story';
      selectProcurePhase('intake', false);
      return;
    }
    if (btn) {
      btn.classList.add('is-playing');
      btn.textContent = '■ Stop';
    }
    var order = ['intake', 'triage', 'approve', 'post'];
    var i = 0;
    function next() {
      if (i >= order.length) {
        if (btn) {
          btn.classList.remove('is-playing');
          btn.textContent = '▶ Play the intake story';
        }
        return;
      }
      selectProcurePhase(order[i], true);
      i += 1;
      procureLater(next, i === 1 ? 3200 : 3600);
    }
    clearProcureTimers();
    next();
  }

  function animateFlow() {
    var btn = $('#is-play-btn');
    if (btn && btn.classList.contains('is-playing')) {
      clearAnimTimers();
      btn.classList.remove('is-playing');
      btn.textContent = '▶ Animate the flow';
      return;
    }
    if (btn) {
      btn.classList.add('is-playing');
      btn.textContent = '■ Stop';
    }

    var steps = [0, 1, 2, 3];
    var i = 0;
    function next() {
      if (i >= steps.length) {
        if (btn) {
          btn.classList.remove('is-playing');
          btn.textContent = '▶ Animate the flow';
        }
        return;
      }
      setFlowStep(steps[i]);
      i += 1;
      animTimer = setTimeout(next, i === 1 ? 900 : 2800);
    }
    next();
  }

  function bind() {
    document.body.classList.add('is-page');

    // Default to a clean presentation surface on this page
    if (localStorage.getItem('ds-is-focus') !== '0') {
      enableFocusMode(true);
    } else {
      updateChromeToggleLabel();
      updateNavToggleLabel();
    }

    var playBtn = $('#is-play-btn');
    if (playBtn) playBtn.addEventListener('click', animateFlow);

    var navBtn = $('#is-nav-toggle');
    if (navBtn) {
      navBtn.addEventListener('click', function () {
        if (typeof toggleSidebarCollapsed === 'function') {
          toggleSidebarCollapsed();
        } else {
          document.body.classList.toggle('sidebar-collapsed');
        }
        updateNavToggleLabel();
      });
    }

    var chromeBtn = $('#is-chrome-toggle');
    if (chromeBtn) {
      chromeBtn.addEventListener('click', function () {
        enableFocusMode(!document.body.classList.contains('is-focus-mode'));
      });
    }

    $all('.is-flow-step').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var play = $('#is-play-btn');
        if (play) {
          play.classList.remove('is-playing');
          play.textContent = '▶ Animate the flow';
        }
        clearAnimTimers();
        setFlowStep(parseInt(btn.getAttribute('data-step'), 10));
      });
    });

    $all('.is-platform-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        selectPlatform(tab.getAttribute('data-platform'));
      });
    });

    $all('.is-mcp-prompt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        renderMcpScenario(btn.getAttribute('data-mcp'));
      });
    });

    var replayBtn = $('#is-webhook-replay');
    if (replayBtn) replayBtn.addEventListener('click', replayConnectEvents);

    buildProcureScenes();
    selectProcurePhase('intake', false);
    $all('.is-procure-phase').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var play = $('#is-procure-play');
        if (play) {
          play.classList.remove('is-playing');
          play.textContent = '▶ Play the intake story';
        }
        clearProcureTimers();
        selectProcurePhase(tab.getAttribute('data-procure'), true);
      });
    });
    var procurePlay = $('#is-procure-play');
    if (procurePlay) procurePlay.addEventListener('click', playProcureStory);

    selectPlatform('salesforce');
    lightPanels(0);
    if ($('#is-panel-source')) $('#is-panel-source').classList.add('is-lit');
    renderMcpScenario('renewals');
    platLater(replayConnectEvents, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
