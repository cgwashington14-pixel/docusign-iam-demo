/* Integration Story — CA agency 5-minute tee-up */
(function () {
  'use strict';

  var PLATFORMS = {
    salesforce: {
      mark: 'SF',
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
      demos: [
        { href: '/envelopes/send?prefill=vendor', label: '▶ Demo: Send pre-filled envelope', muted: false },
        { href: '/webhooks', label: 'Connect write-back', muted: true }
      ],
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
      },
      say: '“In Salesforce, the opportunity already holds the vendor, amount, and signers. DocuSign for Salesforce turns that record into a ready-to-send envelope — then writes completion back.”'
    },
    microsoft: {
      mark: 'MS',
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
      demos: [
        { href: '/embedded?prefill=permit', label: '▶ Demo: Embedded / in-app signing', muted: false },
        { href: '/webforms?sample=1', label: 'Web Form intake', muted: true }
      ],
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
      },
      say: '“Microsoft is everywhere in California agencies — SharePoint lists and Power Apps are natural starts. The pattern is identical: pull the list fields, send the envelope, put the signed file back.”'
    },
    servicenow: {
      mark: 'SN',
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
      demos: [
        { href: '/maestro', label: '▶ Demo: Workflow automation', muted: false },
        { href: '/webhooks', label: 'Connect completion events', muted: true }
      ],
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
      },
      say: '“ServiceNow already owns the request. DocuSign doesn’t invent a parallel process — it fulfills the agreement step inside the ticket, then marks the request complete.”'
    }
  };

  var FLOW_SAYS = [
    '“California agencies already keep the truth in Salesforce, ServiceNow, and Microsoft. DocuSign doesn’t replace those systems — it uses them to start the agreement, then returns the executed result.”',
    '“The hard work is already done in the record. We map those fields into envelope tabs and recipients so people aren’t re-typing agency data.”',
    '“Routing comes from the record too — program, legal, authorized signer — so the path matches agency policy, not a one-size email blast.”',
    '“When the last signature lands, Connect pushes status, documents, and key data back. The system of record stays the system of record.”'
  ];

  var PLAY_BEATS = [
    { t: 0, label: 'CA frame', action: function () { setFlowStep(0); highlightBeat(0); } },
    { t: 45, label: 'Scale', action: function () { highlightBeat(1); scrollToId('is-universe'); } },
    { t: 90, label: 'Loop · source', action: function () { scrollToId('is-crux'); setFlowStep(0); highlightBeat(2); } },
    { t: 120, label: 'Loop · prefill', action: function () { setFlowStep(1); } },
    { t: 150, label: 'Loop · route', action: function () { setFlowStep(2); } },
    { t: 180, label: 'Loop · write-back', action: function () { setFlowStep(3); } },
    { t: 195, label: 'Salesforce', action: function () { selectPlatform('salesforce'); scrollToId('is-platforms'); highlightBeat(3); } },
    { t: 225, label: 'Microsoft', action: function () { selectPlatform('microsoft'); } },
    { t: 255, label: 'ServiceNow', action: function () { selectPlatform('servicenow'); } },
    { t: 280, label: 'Iris', action: function () { scrollToId('is-iris'); highlightBeat(4); } },
    { t: 300, label: 'Handoff', action: function () { scrollToId('is-handoff'); stopPlay(true); } }
  ];

  var TOTAL_MS = 300000;
  var playTimer = null;
  var playStarted = 0;
  var playRaf = null;
  var currentPlatform = 'salesforce';
  var currentStep = 0;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function scrollToId(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setSay(text) {
    var el = $('#is-say-text');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(function () {
      el.textContent = text;
      el.style.opacity = '1';
    }, 160);
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
      setTimeout(function () {
        var row = document.querySelector('[data-field="' + key + '"]');
        if (row && row.parentElement) row.parentElement.classList.add('is-mapped');
        var tab = document.querySelector('.is-tab[data-map="' + key + '"]');
        if (tab) {
          tab.classList.add('is-filled', 'is-flying');
          var em = tab.querySelector('em');
          if (em) em.textContent = fields[key];
          setTimeout(function () { tab.classList.remove('is-flying'); }, 450);
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
      setTimeout(function () {
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
      setTimeout(function () { li.classList.add('is-in'); }, i * 280);
    });
    setTimeout(function () {
      var st = document.querySelector('[data-field="status"]');
      if (st) {
        st.textContent = 'Completed';
        st.className = 'is-status is-status--done';
      }
    }, 900);
  }

  function setFlowStep(step) {
    currentStep = step;
    $all('.is-flow-step').forEach(function (btn) {
      var s = parseInt(btn.getAttribute('data-step'), 10);
      btn.classList.toggle('is-flow-step--active', s === step);
      btn.classList.toggle('is-flow-step--done', s < step);
    });

    clearMapped();
    lightPanels(step);
    setSay(FLOW_SAYS[step] || FLOW_SAYS[0]);

    if (step >= 1) {
      lightPanels(Math.max(step, 1));
      fillTabs();
    }
    if (step >= 2) {
      setTimeout(activateRoute, step === 2 ? 200 : 1100);
    }
    if (step >= 3) {
      setTimeout(function () {
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

    var links = $('#is-plat-demo-links');
    if (links) {
      links.innerHTML = p.demos.map(function (d) {
        return '<a href="' + d.href + '" class="is-demo-chip' + (d.muted ? ' is-demo-chip--muted' : '') + '">' + d.label + '</a>';
      }).join('');
    }

    applyRecord(key);
    setSay(p.say);
    setFlowStep(0);
  }

  function highlightBeat(idx) {
    $all('.is-beat').forEach(function (beat) {
      beat.classList.toggle('is-current', parseInt(beat.getAttribute('data-beat'), 10) === idx);
    });
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateProgress(elapsedMs) {
    var fill = $('#is-progress-fill');
    var label = $('#is-progress-label');
    var time = $('#is-progress-time');
    var pct = Math.min(100, (elapsedMs / TOTAL_MS) * 100);
    if (fill) fill.style.width = pct + '%';
    if (time) time.textContent = formatTime(elapsedMs / 1000) + ' / 5:00';
    var current = PLAY_BEATS[0];
    for (var i = 0; i < PLAY_BEATS.length; i++) {
      if (elapsedMs / 1000 >= PLAY_BEATS[i].t) current = PLAY_BEATS[i];
    }
    if (label) label.textContent = current.label;
  }

  function stopPlay(finished) {
    playTimer = null;
    if (playRaf) {
      cancelAnimationFrame(playRaf);
      playRaf = null;
    }
    var btn = $('#is-play-btn');
    if (btn) {
      btn.classList.remove('is-playing');
      btn.textContent = finished ? '✓ Story complete — explore below' : '▶ Play 5-minute story';
    }
    if (finished) {
      var bar = $('#is-progress-bar');
      if (bar) {
        setTimeout(function () { bar.classList.remove('is-visible'); }, 2500);
      }
    }
  }

  function startPlay() {
    if (playTimer) {
      stopPlay(false);
      var bar = $('#is-progress-bar');
      if (bar) bar.classList.remove('is-visible');
      return;
    }

    var btn = $('#is-play-btn');
    if (btn) {
      btn.classList.add('is-playing');
      btn.textContent = '■ Stop story';
    }
    var bar = $('#is-progress-bar');
    if (bar) bar.classList.add('is-visible');

    playStarted = Date.now();
    var fired = {};
    scrollToId('is-hero');
    selectPlatform('salesforce');
    setFlowStep(0);
    highlightBeat(0);

    function tick() {
      var elapsed = Date.now() - playStarted;
      updateProgress(elapsed);
      PLAY_BEATS.forEach(function (beat, i) {
        if (!fired[i] && elapsed / 1000 >= beat.t) {
          fired[i] = true;
          beat.action();
        }
      });
      if (elapsed < TOTAL_MS) {
        playRaf = requestAnimationFrame(tick);
      }
    }
    playRaf = requestAnimationFrame(tick);
    playTimer = true;
  }

  function bind() {
    var playBtn = $('#is-play-btn');
    if (playBtn) playBtn.addEventListener('click', startPlay);

    $all('.is-flow-step').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setFlowStep(parseInt(btn.getAttribute('data-step'), 10));
      });
    });

    $all('.is-platform-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        selectPlatform(tab.getAttribute('data-platform'));
      });
    });

    $all('.is-beat').forEach(function (beat) {
      beat.addEventListener('click', function () {
        var idx = parseInt(beat.getAttribute('data-beat'), 10);
        highlightBeat(idx);
        if (idx === 0) { scrollToId('is-hero'); setFlowStep(0); }
        else if (idx === 1) scrollToId('is-universe');
        else if (idx === 2) { scrollToId('is-crux'); setFlowStep(0); }
        else if (idx === 3) { scrollToId('is-platforms'); selectPlatform('salesforce'); }
        else if (idx === 4) scrollToId('is-iris');
      });
    });

    // Initial state
    selectPlatform('salesforce');
    lightPanels(0);
    $('#is-panel-source') && $('#is-panel-source').classList.add('is-lit');

    // Smooth opacity for say text
    var say = $('#is-say-text');
    if (say) say.style.transition = 'opacity 0.16s ease';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
