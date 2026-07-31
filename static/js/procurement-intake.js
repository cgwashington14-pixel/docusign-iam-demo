/* Procurement & Intake — CA agency customer-facing presentation */
(function () {
  'use strict';

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

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function clearProcureTimers() {
    procureTimers.forEach(clearTimeout);
    procureTimers = [];
  }

  function procureLater(fn, ms) {
    procureTimers.push(setTimeout(fn, ms));
  }

  function updateNavToggleLabel() {
    var label = $('#is-nav-toggle-label');
    if (!label) return;
    label.textContent = document.body.classList.contains('sidebar-collapsed')
      ? 'Nav · hover left edge'
      : 'Keep navigation open';
  }

  function updateChromeToggleLabel() {
    var label = $('#is-chrome-toggle-label');
    if (!label) return;
    var focused = document.body.classList.contains('is-focus-mode');
    label.textContent = focused ? 'Exit focus (hover chrome)' : 'Focus mode';
    var btn = $('#is-chrome-toggle');
    if (btn) btn.classList.toggle('is-active', focused);
  }

  function tuckStoryChrome() {
    /* Left nav tucks for a clean canvas; guide rails stay open and polished */
    if (typeof setSidebarCollapsed === 'function') {
      setSidebarCollapsed(true);
    } else {
      document.body.classList.add('sidebar-collapsed');
    }
    if (typeof guideRailSetCollapsed === 'function') {
      guideRailSetCollapsed('scv', false);
      guideRailSetCollapsed('hl', false);
    } else {
      document.body.classList.remove('scv-rail-collapsed', 'hl-rail-collapsed');
    }
  }

  function showHomeNav() {
    if (typeof setSidebarCollapsed === 'function') {
      setSidebarCollapsed(false);
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    document.documentElement.classList.remove('is-story-focus');
  }

  function enableFocusMode(on) {
    document.body.classList.toggle('is-focus-mode', !!on);
    document.documentElement.classList.toggle('is-story-focus', !!on);
    try {
      localStorage.setItem('ds-is-focus', on ? '1' : '0');
    } catch (e) {}
    if (on) tuckStoryChrome();
    else showHomeNav();
    updateNavToggleLabel();
    updateChromeToggleLabel();
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

  function bind() {
    document.body.classList.add('is-page');

    // Show home / left nav by default; focus mode is opt-in (hover-tucked chrome)
    if (localStorage.getItem('ds-is-focus') === '1') {
      enableFocusMode(true);
    } else {
      showHomeNav();
      updateChromeToggleLabel();
      updateNavToggleLabel();
    }

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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
