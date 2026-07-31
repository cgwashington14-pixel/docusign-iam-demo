/* Integration Story — CA agency customer-facing presentation */
(function () {
  'use strict';

  var PLATFORMS = {
    salesforce: {
      systemLabel: 'Salesforce · Opportunity',
      agencyBadge: 'Caltrans',
      agencyName: 'Caltrans · Vendor opportunity',
      headline: 'Send from the opportunity — not from email.',
      body: 'Open the Salesforce opportunity. Launch DocuSign with vendor, amount, term, and signers already filled. When signing finishes, status and the executed PDF write back to that opportunity.',
      bullets: [
        'Pre-built DocuSign for Salesforce',
        'Opportunity fields → envelope tabs',
        'Completed status + PDF → same record'
      ],
      soWhat: 'Contracts stay on the opportunity your program team already manages — no parallel tracker.',
      webhookTarget: 'Salesforce · OPP-2026-1847',
      embedHost: 'Salesforce opportunity',
      record: {
        type: 'Opportunity',
        id: 'OPP-2026-1847',
        name: 'Highway Maintenance MSA — Bay Area',
        fields: {
          vendor: 'Pacific Infrastructure Group',
          amount: '$2,450,000',
          contact: 'Maria Chen · Contracts',
          email: 'm.chen@dot.ca.gov',
          term: '36 months · renewable',
          status: 'Negotiation'
        }
      }
    },
    microsoft: {
      systemLabel: 'SharePoint · Procurement list',
      agencyBadge: 'DGS',
      agencyName: 'DGS · SharePoint list + Power App',
      headline: 'List or Power App — same envelope path.',
      body: 'Select a SharePoint row or submit a Power App request. DocuSign maps those fields into an MOU, can embed signing in the app, and returns the signed file to the library with list status updated.',
      bullets: [
        'SharePoint columns → envelope fields',
        'Power Apps embedded signing',
        'Signed PDF + status → list / library'
      ],
      soWhat: 'Procurement works in Microsoft 365 end-to-end — no export to “go get signatures.”',
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
      body: 'A CDT catalog request already has vendor, cost center, and approvers. DocuSign fulfills the agreement step inside the ticket, then Connect marks the request complete with the attachment.',
      bullets: [
        'Catalog variables → recipients & tabs',
        'Sign inside or beside the RITM',
        'Connect updates request on completion'
      ],
      soWhat: 'IT and procurement close the loop in ServiceNow — the ticket is the truth, including the signed agreement.',
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

  var MCP_SCENARIOS = {
    renewals: {
      user: 'Which Caltrans MSAs renew in the next 90 days?',
      tool: 'search_agreements',
      args: '{ agency: "Caltrans", type: "MSA", renewsWithinDays: 90 }',
      answer: 'I found 3 Caltrans master service agreements renewing in the next 90 days. The Bay Area maintenance MSA is highest value and renews June 30, 2027.',
      rows: [
        ['Agreement', 'Value', 'Renewal'],
        ['Highway Maintenance MSA — Bay Area', '$2,450,000', 'Jun 30, 2027'],
        ['Central Valley Striping MSA', '$980,000', 'Jul 15, 2027'],
        ['District 4 On-Call Design MSA', '$1,200,000', 'Aug 1, 2027']
      ],
      pills: ['sky', 'sky', 'sky']
    },
    status: {
      user: 'What’s the status of the Bay Area maintenance packet?',
      tool: 'get_envelope',
      args: '{ envelopeId: "ENV-CA-4821", include: ["recipients", "status"] }',
      answer: 'Envelope ENV-CA-4821 is completed. Program manager and legal signed; the authorized signer finished today. The executed PDF is available to write back to Salesforce.',
      rows: [
        ['Recipient', 'Role', 'Status'],
        ['Maria Chen', 'Program manager', 'Signed'],
        ['Legal counsel', 'Reviewer', 'Signed'],
        ['Authorized signer', 'Signer', 'Completed']
      ],
      pills: ['green', 'green', 'green']
    },
    workflow: {
      user: 'Start the DGS vendor onboarding workflow for Golden State Supply.',
      tool: 'trigger_workflow',
      args: '{ workflow: "DGS Vendor Onboarding", vendor: "Golden State Supply Co.", amount: 485000 }',
      answer: 'Workflow instance WF-2026-9912 is running. Intake and compliance steps are queued; the first DocuSign envelope will generate when the catalog variables are validated.',
      rows: [
        ['Step', 'Owner', 'State'],
        ['Validate vendor record', 'Procurement', 'In progress'],
        ['Generate onboarding packet', 'DocuSign', 'Queued'],
        ['Route for signature', 'DGS Contracts', 'Waiting']
      ],
      pills: ['amber', 'sky', 'amber']
    },
    terms: {
      user: 'Pull parties, value, and renewal date from the CDT SaaS renewal.',
      tool: 'get_agreement',
      args: '{ agreementId: "AGR-CDT-1884", fields: ["parties", "value", "renewalDate"] }',
      answer: 'Here are the key terms from the CDT Enterprise Security SaaS renewal. These fields can pre-populate the next envelope or sync to ServiceNow.',
      rows: [
        ['Field', 'Value', 'Source'],
        ['Party A', 'State of California · CDT', 'Agreement Manager'],
        ['Party B', 'NexusShield Technologies', 'Agreement Manager'],
        ['Contract value', '$1,120,000', 'Extracted']
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
          '<div class="is-agency-bar"><span class="is-agency-cloud">Sales</span><span>Opportunities</span><span class="is-agency-pill">Caltrans</span></div>' +
          '<div class="is-agency-body">' +
            '<div class="is-agency-title-row"><strong>' + r.name + '</strong><span class="is-agency-status" data-mock-status>' + r.fields.status + '</span></div>' +
            '<div class="is-agency-id">' + r.id + '</div>' +
            '<div class="is-agency-fields">' +
              '<div data-mock-field><span>Vendor</span><em>' + r.fields.vendor + '</em></div>' +
              '<div data-mock-field><span>Amount</span><em>' + r.fields.amount + '</em></div>' +
              '<div data-mock-field><span>Signer</span><em>' + r.fields.email + '</em></div>' +
            '</div>' +
            '<button type="button" class="is-agency-cta" data-mock-cta tabindex="-1">Send with DocuSign</button>' +
            '<div class="is-agency-progress" data-mock-progress>' +
              '<div class="is-agency-step" data-mock-step>1 · Prefill</div>' +
              '<div class="is-agency-step" data-mock-step>2 · Sign</div>' +
              '<div class="is-agency-step" data-mock-step>3 · Write-back</div>' +
            '</div>' +
            '<div class="is-agency-done" data-mock-done>Opportunity updated · PDF attached</div>' +
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
              '<div class="is-ms-app-label">Power App · Field request</div>' +
              '<div class="is-ms-app-fields"><span>Amount ' + r.fields.amount + '</span><span>Term ' + r.fields.term + '</span></div>' +
              '<div class="is-embed-mini" data-mock-embed><em>Embedded signing</em><button type="button" tabindex="-1">Sign</button></div>' +
            '</div>' +
            '<div class="is-agency-done" data-mock-done>List status Complete · PDF in library</div>' +
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
            '<div class="is-sn-node" data-mock-step>Request opened</div>' +
            '<div class="is-sn-node" data-mock-step>DocuSign packet</div>' +
            '<div class="is-sn-node" data-mock-step>Approvers signed</div>' +
            '<div class="is-sn-node" data-mock-step>RITM closed</div>' +
          '</div>' +
          '<div class="is-agency-done" data-mock-done>Request Completed · agreement attached</div>' +
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
        var cta = mock.querySelector('[data-mock-cta]');
        if (cta) cta.classList.add('is-pulse');
      }, 1000);
      $all('[data-mock-step]', mock).forEach(function (el, i) {
        platLater(function () { el.classList.add('is-on'); }, 1300 + i * 550);
      });
      platLater(function () {
        var st = mock.querySelector('[data-mock-status]');
        if (st) { st.textContent = 'Closed Won'; st.classList.add('is-done'); }
        var done = mock.querySelector('[data-mock-done]');
        if (done) done.classList.add('is-show');
      }, 3000);
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
    setText('is-plat-so-what', p.soWhat);

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
