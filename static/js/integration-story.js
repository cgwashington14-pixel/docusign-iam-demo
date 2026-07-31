/* Integration Story — CA agency customer-facing presentation */
(function () {
  'use strict';

  var PLATFORMS = {
    salesforce: {
      systemLabel: 'Salesforce · Opportunity',
      agencyBadge: 'Caltrans',
      agencyName: 'Caltrans · Vendor opportunity',
      headline: 'Send from the opportunity — not from email.',
      body: 'A contracts officer opens a Salesforce opportunity for a Bay Area maintenance MSA. One action launches a DocuSign envelope with vendor, amount, term, and signers already filled. When the last signature lands, the opportunity status and executed PDF write back automatically.',
      bullets: [
        'Pre-built DocuSign for Salesforce — no custom middleware to start',
        'Opportunity / Account / Custom object → envelope tabs',
        'Completed envelope → status, documents, and custom fields'
      ],
      miniSys: 'Salesforce record',
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
      headline: 'List item or Power App — same envelope path.',
      body: 'A DGS procurement specialist selects a row in a SharePoint vendor list — or a field inspector submits a Power App request. DocuSign pulls those columns into an MOU envelope, routes through Teams-friendly approval, and returns the signed package to the list and document library.',
      bullets: [
        'SharePoint list columns map to envelope fields',
        'Power Apps can launch signing without leaving the app',
        'Signed PDF lands in SharePoint / OneDrive; status updates the list'
      ],
      miniSys: 'SharePoint / Power App',
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
      body: 'A CDT service catalog request for a SaaS renewal includes vendor, cost center, and approvers. From ServiceNow, DocuSign generates the renewal packet, routes legal and budget owners, and updates the request with completion status plus the executed attachment.',
      bullets: [
        'ServiceNow spoke / IntegrationHub patterns available',
        'Catalog variables → envelope recipients and tabs',
        'Connect or spoke updates RITM / case on completion'
      ],
      miniSys: 'ServiceNow request',
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

  var currentPlatform = 'salesforce';
  var currentStep = 0;
  var animTimer = null;
  var animTimers = [];

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
    }

    var setText = function (id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setText('is-plat-agency-name', p.agencyName);
    setText('is-plat-headline', p.headline);
    setText('is-plat-body', p.body);
    setText('is-mini-sys', p.miniSys);

    var bullets = $('#is-plat-bullets');
    if (bullets) {
      bullets.innerHTML = p.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('');
    }

    applyRecord(key);
    setFlowStep(0);
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

    selectPlatform('salesforce');
    lightPanels(0);
    if ($('#is-panel-source')) $('#is-panel-source').classList.add('is-lit');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
