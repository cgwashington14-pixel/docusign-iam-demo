/* Scroll reveals, stat count-up, topbar elevation — respects reduced motion */

(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const REVEAL = [
    '.page-header',
    '.proof-section',
    '.trust-bar',
    '.home-demo-intro',
    '.home-impact-band',
    '.alert',
    '.biz-hero-card',
    '.biz-proof-bar',
    '.exec-hero',
    '.not-found-hero',
    '.clm-ts-hero',
    '.clm-ts-section',
    '.clm-ts-admin-strip',
  ];

  const STAGGER = [
    '.proof-grid',
    '.stats-bar',
    '.trust-pills',
    '.feature-grid',
    '.launch-grid',
    '.welcome-steps',
    '.scv-home-grid',
    '.exec-tile-grid',
    '.biz-proof-metrics',
    '.grid-2',
    '.grid-3',
    '.clm-ts-symptom-grid',
    '.clm-ts-status-row',
    '.clm-ts-escalate',
    '.clm-ts-life-track',
    '.clm-ts-life-stores',
  ];

  function setupReveals() {
    if (reduced) return;

    REVEAL.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el.classList.contains('ds-reveal')) el.classList.add('ds-reveal');
      });
    });

    STAGGER.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.closest('[data-ds-product]')) return;
        el.classList.add('ds-stagger-reveal');
        [...el.children].forEach((child, i) => {
          child.style.setProperty('--stagger-i', String(i));
        });
      });
    });

    const targets = document.querySelectorAll('.ds-reveal, .ds-stagger-reveal');
    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    );
    targets.forEach((el) => io.observe(el));
  }

  function animateCount(el) {
    if (reduced) return;
    const raw = el.textContent.trim();
    if (!raw || raw === '—' || raw === 'Live') return;
    const digits = raw.replace(/,/g, '');
    const num = parseInt(digits, 10);
    if (Number.isNaN(num) || num <= 0 || num > 50000) return;

    const prefix = raw.match(/^[^\d]*/)?.[0] || '';
    const suffix = raw.match(/[^\d]*$/)?.[0] || '';
    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(num * eased);
      el.textContent = prefix + val.toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function setupCountUp() {
    document.querySelectorAll('.stats-bar-val').forEach((el) => {
      const parent = el.closest('.stats-bar-item');
      if (!parent) return;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCount(el);
              io.disconnect();
            }
          });
        },
        { threshold: 0.5 }
      );
      io.observe(parent);
    });
  }

  function setupTopbarScroll() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        topbar.classList.toggle('is-scrolled', window.scrollY > 6);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupReveals();
    setupCountUp();
    setupTopbarScroll();
  });
})();
