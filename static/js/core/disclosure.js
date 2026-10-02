/* Progressive disclosure — collapses secondary page sections so every page opens short.
 *
 * Mark any container with `data-disclosure` (collapsed) or `data-disclosure="open"`.
 * Its first heading (h2/h3, or the element matching `data-disclosure-title`) becomes the
 * toggle; everything after it moves into the collapsible body. Built on <details>, so it
 * is keyboard accessible and works with browser find-in-page.
 *
 * Anchors, URL hashes and `dsDisclosureReveal(el)` open whatever section contains a target.
 */
(function () {
  "use strict";

  function build(host) {
    if (host.querySelector(":scope > details.disclosure")) return;
    const sel = host.getAttribute("data-disclosure-title") || "h2, h3";
    const title = host.querySelector(sel);
    if (!title && host.getAttribute("data-disclosure-mode") !== "card") return;

    const details = document.createElement("details");
    details.className = "disclosure";
    if (host.getAttribute("data-disclosure") === "open") details.open = true;

    const summary = document.createElement("summary");
    summary.className = "disclosure-summary";
    const body = document.createElement("div");
    body.className = "disclosure-body";

    // Card mode — the whole header row is the toggle.
    const cardHead = host.getAttribute("data-disclosure-mode") === "card" ? host.querySelector(":scope > .card-header") : null;
    if (cardHead) {
      summary.classList.add("disclosure-summary--card");
      let n = cardHead.nextSibling;
      while (n) {
        const nx = n.nextSibling;
        body.appendChild(n);
        n = nx;
      }
      host.insertBefore(details, cardHead);
      summary.appendChild(cardHead);
      details.appendChild(summary);
      details.appendChild(body);
      host.classList.add("has-disclosure");
      return;
    }

    // Which direct child of the host holds the title?
    let head = title;
    while (head.parentNode !== host && head.parentNode) head = head.parentNode;

    if (head === title) {
      // Mode A — the heading itself is the toggle.
      let node = title.nextSibling;
      while (node) {
        const next = node.nextSibling;
        body.appendChild(node);
        node = next;
      }
      host.insertBefore(details, title);
      summary.appendChild(title);
    } else {
      // Mode B — the header block stays visible; a "show / hide" row toggles the rest.
      const label = host.getAttribute("data-disclosure-label") || "Show details";
      summary.classList.add("disclosure-summary--link");
      const closed = document.createElement("span");
      closed.className = "disclosure-label disclosure-label--closed";
      closed.textContent = label;
      const opened = document.createElement("span");
      opened.className = "disclosure-label disclosure-label--open";
      opened.textContent = "Hide";
      summary.appendChild(closed);
      summary.appendChild(opened);
      let node = head.nextSibling;
      while (node) {
        const next = node.nextSibling;
        body.appendChild(node);
        node = next;
      }
      host.appendChild(details);
    }
    details.appendChild(summary);
    details.appendChild(body);
    host.classList.add("has-disclosure");
  }

  function reveal(el) {
    if (!el) return;
    // The target may itself be a disclosure host (e.g. a section id).
    const own = el.querySelector ? el.querySelector(":scope > details.disclosure") : null;
    if (own) own.open = true;
    let node = el.closest ? el.closest("details.disclosure") : null;
    while (node) {
      node.open = true;
      node = node.parentElement ? node.parentElement.closest("details.disclosure") : null;
    }
  }

  function revealHash() {
    if (!location.hash || location.hash.length < 2) return;
    let target = null;
    try {
      target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    } catch (e) {
      return;
    }
    if (target) {
      reveal(target);
      target.scrollIntoView({ block: "start" });
    }
  }

  function init() {
    document.querySelectorAll("[data-disclosure]").forEach(build);
    revealHash();
  }

  document.addEventListener(
    "click",
    function (e) {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute("href").length < 2) return;
      const target = document.getElementById(a.getAttribute("href").slice(1));
      if (target) reveal(target);
    },
    true,
  );
  window.addEventListener("hashchange", revealHash);

  // Print everything open.
  window.addEventListener("beforeprint", function () {
    document.querySelectorAll("details.disclosure").forEach(function (d) {
      d.dataset.wasOpen = d.open ? "1" : "";
      d.open = true;
    });
  });
  window.addEventListener("afterprint", function () {
    document.querySelectorAll("details.disclosure").forEach(function (d) {
      d.open = d.dataset.wasOpen === "1";
    });
  });

  window.dsDisclosureReveal = reveal;
  window.dsDisclosureOpenAll = function (root) {
    (root || document).querySelectorAll("details.disclosure").forEach(function (d) {
      d.open = true;
    });
  };

  // Build before page scripts run so they see the final DOM.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
