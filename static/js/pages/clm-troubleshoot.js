/* CLM Workflow Troubleshoot — diagnostic wizard, search, animated admin demos */

const CLM_TS_REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CLM_TS_DIAGNOSES = {
  lifecycle: {
    title: "Walk the request from kickoff to close",
    pills: [
      { cls: "clm-ts-pill--ok", text: "101" },
      { cls: "clm-ts-pill--xml", text: "Params vs attributes" },
    ],
    summary: "Internal request, edits, approvals, external redline, then remap anything that changed. Params is the kickoff snapshot. Attributes are what people edit on the file. Variables are what Decisions read — they stay stale until Find Document + Update Variable Value.",
    steps: [
      "Play the lifecycle 101 once. Watch the company name across Params, attributes, and the workflow variable.",
      "Request: map Doc Gen / Params into document attributes. Harvest TemplateFieldData schema from an empty test workflow first.",
      "Edit / Approve: Review Data and Approve can change metadata or upload a new version. The variable does not move by itself.",
      "External redline: Review and Send for External Review + Wait for External Review (or automated Send for External Review). A Word redline is a new version, not an automatic attribute rewrite.",
      "Close: Find Document, map attributes that changed, then Finish. If a Decision still reads Params, it is answering day-one data.",
    ],
    jump: "#lifecycle",
    jumpLabel: "Play the lifecycle 101",
    life: 0,
  },
  failed: {
    title: "The workflow instance failed",
    pills: [
      { cls: "clm-ts-pill--fail", text: "Failed" },
      { cls: "clm-ts-pill--config", text: "Activity panel" },
    ],
    summary: "A step threw an exception or hit a Failure output. The instance stopped. Do not assume the last human task is the cause — the failing step is usually the next automated step.",
    steps: [
      "Open Admin → Automation Tools → Workflows → Activity. Filter by Workflow Status = Failed (and the workflow name).",
      "Click the instance name to open it, then use the Execution View icon. Find the step with a Failure / error state.",
      "Read the Activity Panel error text (connector, missing field, invalid type, XPath, permissions).",
      "Open the same step in Configuration. Check rogue spaces, unpublished changes, and every connector output path.",
      "Fix on a clone if this is production, publish fully (Save → Publish icon → Publish link), then start a new instance. A Failed run is already stopped — abort is for in-progress instances and does not resume mid-stream.",
    ],
    jump: "#errors",
    jumpLabel: "Open the error catalog",
    scene: "failed",
  },
  stuck: {
    title: "The workflow looks stuck",
    pills: [
      { cls: "clm-ts-pill--stuck", text: "Executing" },
      { cls: "clm-ts-pill--config", text: "Human vs engine" },
    ],
    summary: "Stuck almost always means either a human task is waiting, or an automated step is blocked. For an in-progress instance: pause suspends automated steps (you can resume); abort cancels automated and human work so tasks leave the queue, then you start over.",
    steps: [
      "On Activity, confirm status is Executing (not Failed). Open Execution View and note the current step type.",
      "If it is a human step (Approval, Choice, Routing, Review Data): check Tasks, assignee/task group, and whether the notification email went to a real CLM user.",
      "If it is automated (connector, XPath, metadata, Find Document): inspect the Activity Panel. Common blockers are missing required fields, bad credentials, or an XPath that returns nothing and has no Failure path.",
      "Pause if you need to inspect without the engine racing ahead (in-progress only). Resume from the current step after the fix, or abort, republish, and start from the beginning.",
      "If users need the task removed from their queue, abort is required — pause will not clear the task.",
    ],
    jump: "#clm-ts-activity-demo",
    jumpLabel: "Play the Executing walkthrough",
    scene: "stuck",
  },
  complete: {
    title: "It shows Complete but work did not finish",
    pills: [
      { cls: "clm-ts-pill--stuck", text: "False complete" },
      { cls: "clm-ts-pill--config", text: "Finish step" },
    ],
    summary: "Without a Finish step on the canvas, a workflow that dies mid-path can still report Complete in the activity monitor. Finish is how the engine knows a successful conclusion — and how parent workflows resume.",
    steps: [
      "Open the workflow configuration (not only the instance). Confirm at least one Finish step exists on every successful path.",
      "If Finish is missing, add it, publish fully, and re-test. Failed runs should then show Failure instead of Complete.",
      "Community guidance: if a Failed instance is missing from a Workflow Overview report, use a Workflow Step report (more granular). Set distinct Stage Names on human steps.",
      "Enable “Send a notification when workflow encounters an error” on the Start step so the next miss is emailed, not silent.",
    ],
    jump: "#clm-ts-activity-demo",
    jumpLabel: "Play False Complete",
    scene: "complete",
  },
  routing: {
    title: "Routed to the wrong person or path",
    pills: [
      { cls: "clm-ts-pill--config", text: "Routing" },
      { cls: "clm-ts-pill--xml", text: "Decision / Rule" },
    ],
    summary: "Wrong path is almost always a Decision/Rule condition, a missing connector output (for example no Rejected line), a Routing option list, or stale attribute values used in the condition.",
    steps: [
      "In Execution View, inspect the Decision or Rule step output (Standard vs Non-Standard, True vs False). Compare that to the variable/attribute value at that moment.",
      "If a human Routing or Choice step ran, confirm Options (including dynamic pipe- or comma-delimited lists). Official: Routing is commonly followed by a Decision when the choice should change the path — not required if every option continues to the same step.",
      "Click every connector line. Each prior-step output (Approved, Rejected, Success, Failure, Timed Out, Step Cancelled) needs a destination. A missing Rejected path is a classic silent stall.",
      "If routing uses document attributes, run Find Document immediately before the Decision so you are not evaluating a stale variable.",
      "Confirm assignees are CLM users (or a populated task group). Empty groups and emails that are not in CLM cause tasks to sit unclaimed.",
    ],
    jump: "#clm-ts-route-demo",
    jumpLabel: "See the missing Rejected path",
  },
  attribute: {
    title: "Attribute, company, or Params value is wrong",
    pills: [
      { cls: "clm-ts-pill--xml", text: "Attributes" },
      { cls: "clm-ts-pill--config", text: "Params" },
    ],
    summary: "An attribute and a workflow variable are not the same data. They can start equal and then diverge after a human Review Data step. Params is incoming trigger XML — do not overwrite it.",
    steps: [
      "In Execution View, open the document XML and the Params XML. Confirm the node path (attribute group + field) rather than guessing the UI label.",
      "If a user updated metadata during the workflow, Find Document to refresh the document XML, then Update Variable Value from that metadata (Execution View shows the node path, often like <%#Doc.Group.Field%>).",
      "Check Admin attribute field names for trailing spaces — extra spaces on attribute group fields cause mapping steps to fail.",
      "Doc Gen form fields are not attributes until you map them with Update Document Metadata Value. Company/party values live in an attribute group you defined or in party/Actor XML — not automatically on the document.",
      "Never edit Params in place. Copy to a working XML variable, then Evaluate XPath against Params or the copy.",
    ],
    jump: "#clm-ts-diverge",
    jumpLabel: "Play attribute vs variable",
  },
  xml: {
    title: "XML, XPath, or schema problem",
    pills: [
      { cls: "clm-ts-pill--xml", text: "XML" },
      { cls: "clm-ts-pill--fail", text: "XPath" },
    ],
    summary: "CLM navigates data as XML nodes. Doc Gen values sit under Params → TemplateFieldData. Schema for that payload only appears after an associated Doc Gen configuration has triggered the workflow once.",
    steps: [
      "Trigger (or use) an empty/test workflow once so TemplateFieldData schema is populated, then copy that schema into the real workflow.",
      "In Evaluate XPath, select the correct source variable (Params, Document, Folder, custom XML). A valid XPath against the wrong variable returns empty.",
      "Use Execution View to copy the live XML and test the path (for example /Params/TemplateFieldData/Department).",
      "For bulk metadata, the Update Document Metadata Value XML method must follow the documented bulk-metadata schema (PATCH vs PUT). Find Document output is the usual baseline.",
      "If JSON from a connector must become XML (or the reverse), use Convert JSON to XML and watch array nodes that need json:Array='true'.",
    ],
    jump: "#xml",
    jumpLabel: "XML and XPath",
  },
  connector: {
    title: "Connector or provider step failed",
    pills: [
      { cls: "clm-ts-pill--fail", text: "Connector" },
      { cls: "clm-ts-pill--config", text: "Credentials" },
    ],
    summary: "System and provider errors are recorded in the Workflow Activity Panel. Typical causes: connector user permissions, stale credentials, missing required fields (including custom-required fields on the record), and invalid data-type formats.",
    steps: [
      "Read the Activity Panel error exactly — map it to permissions, credentials, missing fields, or data type.",
      "Connections → Connection → Manage Connection: re-enter credentials if needed. Credential changes do not rewrite existing workflow designs.",
      "Confirm the connector user can access every object the step uses.",
      "Add every required field on the connection step, including custom-required fields on the target record.",
      "Match value format to the field type (dates, numbers, picklists). Then republish and run a new instance.",
    ],
    jump: "#errors",
    jumpLabel: "Error catalog",
  },
  escalate: {
    title: "Decide who should own the next step",
    pills: [
      { cls: "clm-ts-pill--ok", text: "Admin" },
      { cls: "clm-ts-pill--config", text: "Developer" },
      { cls: "clm-ts-pill--fail", text: "Support" },
    ],
    summary: "Most customer issues are configuration: publish, spaces, routing lines, assignees, stale attributes. Escalate when the engine misbehaves with a correct design, or when the fix needs custom code / ETL.",
    steps: [
      "Admin / power user: publish, rogue spaces, task assignment, pause/abort, Finish step, connector field mapping, Decision conditions.",
      "Workflow developer: XPath, custom XML payloads, C# expressions, bulk metadata XML, JSON conversion, dynamic routing lists.",
      "Docusign Support (CLM customers must have Premier or Enterprise Premier — confirm with the account team): platform/engine defects, account-level failures, errors you cannot reproduce after a clean republish. Phone callback is not offered for the CLM category — use the Support Center case.",
      "Professional Services: ETL configuration documents, net-new complex automation, work that needs a statement of work.",
      "Attach workflow name, instance ID, UTC time, step name, Activity Panel text, UAT vs prod, and last publish time.",
    ],
    jump: "#escalate",
    jumpLabel: "Escalation matrix",
  },
};

const CLM_TS_SCENES = {
  failed: {
    status: { text: "Failed", cls: "clm-ts-pill--fail" },
    crumb: "Activity",
    nodes: [
      { id: "start", label: "Start" },
      { id: "review", label: "Review Data" },
      { id: "decision", label: "Decision" },
      { id: "ns", label: "Update NetSuite" },
      { id: "finish", label: "Finish" },
    ],
    beats: [
      {
        active: "start",
        done: [],
        title: "Filter Activity",
        panel: "Workflow Status = Failed. Open the instance — do not start from the document folder.",
        caption: "Admins live here: Admin → Automation Tools → Workflows → Activity.",
      },
      {
        active: "review",
        done: ["start"],
        title: "Execution View",
        panel: "Review Data completed. The last human task is rarely the failure.",
        caption: "Walk the canvas. Note which step is current before you change configuration.",
      },
      {
        active: "decision",
        done: ["start", "review"],
        title: "Decision: Standard",
        panel: "Condition matched. The path continued to the connector.",
        caption: "A clean Decision does not mean the run succeeded. Keep going.",
      },
      {
        active: "ns",
        done: ["start", "review", "decision"],
        fail: "ns",
        title: "Missing required field: Customer ID",
        panel: "This is the Activity Panel sentence to copy. Add required (and custom-required) fields, publish fully, start a new instance.",
        caption: "Root cause is on the engine step — not Legal’s review.",
      },
      {
        active: "",
        done: ["start", "review", "decision"],
        fail: "ns",
        skip: ["finish"],
        title: "Finish never reached",
        panel: "A Failed instance is already stopped. Abort does not resume this run. Parent workflows wait until a later instance actually hits Finish.",
        caption: "Fix the canvas, publish fully, then start a new instance.",
      },
    ],
  },
  stuck: {
    status: { text: "Executing", cls: "clm-ts-pill--stuck" },
    crumb: "Tasks",
    nodes: [
      { id: "start", label: "Start" },
      { id: "review", label: "Review Data" },
      { id: "decision", label: "Decision" },
      { id: "sign", label: "Send for signature" },
      { id: "finish", label: "Finish" },
    ],
    beats: [
      {
        active: "start",
        done: [],
        title: "Status is Executing",
        panel: "Not Failed. Something is waiting — a person or a blocked automated step.",
        caption: "Filter Activity by Executing before you abort anything.",
      },
      {
        active: "review",
        done: ["start"],
        wait: "review",
        waitLabel: "Jane · Legal",
        title: "Human step — task in queue",
        panel: "Review Data is assigned to Jane (Legal). Required attributes are incomplete, so the instance will sit here.",
        caption: "Open Tasks. Confirm the assignee is a CLM user and can see every required field.",
      },
      {
        active: "review",
        done: ["start"],
        wait: "review",
        waitLabel: "Jane · Legal",
        title: "Pause vs abort",
        panel: "Pause suspends automated steps and does not cancel them (task stays). Abort cancels the task so it leaves the queue — then you start a new run from Start.",
        caption: "If Jane just needs a nudge, do not abort. If the assignee is wrong, abort after you fix the task group.",
      },
    ],
  },
  complete: {
    status: { text: "Complete", cls: "clm-ts-pill--ok" },
    crumb: "Configuration",
    nodes: [
      { id: "start", label: "Start" },
      { id: "approve", label: "Approve 1" },
      { id: "ghost", label: "No Finish step" },
    ],
    beats: [
      {
        active: "start",
        done: [],
        title: "Activity says Complete",
        panel: "The business owner says work stopped. Believe the canvas, not the status chip — yet.",
        caption: "Open Configuration, not only the instance.",
      },
      {
        active: "approve",
        done: ["start"],
        fail: "approve",
        title: "Approve 1 failed",
        panel: "Without a Finish step, Docusign documents that Activity can still show Complete.",
        caption: "This is the false-Complete trap. Add Finish on every successful end path.",
      },
      {
        active: "",
        done: ["start"],
        fail: "approve",
        skip: ["ghost"],
        title: "Add Finish, then republish",
        panel: "With Finish on the canvas, the same failure reports as Failure. Parent workflows can resume only after Finish is reached.",
        caption: "Turn on error email on the Start step so the next miss is not silent.",
      },
    ],
  },
};

function clmTsEl(id) {
  return document.getElementById(id);
}

function clmTsSetDiagnosis(key) {
  const data = CLM_TS_DIAGNOSES[key];
  const box = clmTsEl("clm-ts-result");
  if (!data || !box) return;

  document.querySelectorAll(".clm-ts-symptom").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.ts === key);
  });

  const pills = data.pills
    .map((p) => `<span class="clm-ts-pill ${p.cls}">${p.text}</span>`)
    .join("");
  const steps = data.steps
    .map((s, i) => `<li style="--stagger-i:${i}">${s}</li>`)
    .join("");

  box.innerHTML = `
    <div class="clm-ts-result-meta">${pills}</div>
    <h3>${data.title}</h3>
    <p>${data.summary}</p>
    <ol class="clm-ts-steps clm-ts-steps--play">${steps}</ol>
    <p class="clm-ts-result-actions">
      <a class="btn btn-secondary btn-sm" href="${data.jump}" ${data.scene ? `data-play-scene="${data.scene}"` : ""}${data.life != null ? ` data-play-life="${data.life}"` : ""}${data.jump === "#clm-ts-diverge" ? " data-diverge=\"1\"" : ""}>${data.jumpLabel} →</a>
    </p>
  `;
  box.classList.add("is-open");
  box.hidden = false;
  box.classList.remove("is-fresh");
  void box.offsetWidth;
  box.classList.add("is-fresh");

  if (data.scene) clmTsSetScene(data.scene);
  if (data.life != null) clmTsLifeSet(0);
}

function clmTsNorm(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

let clmTsQuery = "";
let clmTsErrKey = "all";

function clmTsApplyFilters() {
  const query = clmTsNorm(clmTsQuery);
  const cards = document.querySelectorAll("[data-ts-search]");
  let visibleErrors = 0;
  let errorTotal = 0;
  cards.forEach((el) => {
    const hay = clmTsNorm(el.getAttribute("data-ts-search") + " " + el.textContent);
    const matchSearch = !query || hay.includes(query);
    const isError = el.classList.contains("clm-ts-error");
    const matchErr = !isError || clmTsErrKey === "all" || el.dataset.err === clmTsErrKey;
    const show = matchSearch && matchErr;
    el.classList.toggle("clm-ts-hidden", !show);
    if (isError) {
      errorTotal += 1;
      if (show) visibleErrors += 1;
    }
  });
  const empty = clmTsEl("clm-ts-empty");
  if (empty) {
    const filtering = Boolean(query) || clmTsErrKey !== "all";
    empty.classList.toggle("is-visible", filtering && visibleErrors === 0 && errorTotal > 0);
  }
  if (query) {
    document.querySelectorAll(".clm-ts-error").forEach((d) => {
      if (!d.classList.contains("clm-ts-hidden")) d.open = true;
    });
  }
}

function clmTsSearch(q) {
  clmTsQuery = q;
  clmTsApplyFilters();
}

function clmTsErrFilter(key) {
  clmTsErrKey = key;
  document.querySelectorAll("[data-err-filter]").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.errFilter === key);
  });
  clmTsApplyFilters();
}

function clmTsCopy(btn) {
  const target = document.getElementById(btn.getAttribute("data-copy") || btn.dataset.copy);
  const text = target ? target.innerText : btn.dataset.copyText;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const prev = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => { btn.textContent = prev; }, 1400);
  }).catch(() => {
    btn.textContent = "Select to copy";
  });
}

function clmTsToc() {
  const links = [...document.querySelectorAll(".clm-ts-toc a")];
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const onScroll = () => {
    const y = window.scrollY + 120;
    let current = sections[0];
    sections.forEach((sec) => {
      if (sec.offsetTop <= y) current = sec;
    });
    links.forEach((a) => {
      a.classList.toggle("is-active", current && a.getAttribute("href") === "#" + current.id);
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ── Activity walkthrough ─────────────────────────────────────────────────── */

let clmTsSceneKey = "failed";
let clmTsTimer = null;
let clmTsBeat = 0;

function clmTsRenderFlow(scene) {
  const flow = clmTsEl("clm-ts-flow");
  if (!flow) return;
  flow.innerHTML = scene.nodes.map((n, i) => `
    <div class="clm-ts-flow-step" data-node="${n.id}">
      <span class="clm-ts-flow-dot" aria-hidden="true"></span>
      <span class="clm-ts-flow-label">${n.label}</span>
      <span class="clm-ts-flow-wait" hidden></span>
    </div>
    ${i < scene.nodes.length - 1 ? '<span class="clm-ts-flow-arrow" aria-hidden="true"></span>' : ""}
  `).join("");
}

function clmTsApplyBeat(scene, beat) {
  const flow = clmTsEl("clm-ts-flow");
  if (!flow) return;
  flow.querySelectorAll(".clm-ts-flow-step").forEach((el) => {
    const id = el.getAttribute("data-node");
    el.classList.toggle("is-active", beat.active === id);
    el.classList.toggle("is-done", (beat.done || []).includes(id));
    el.classList.toggle("is-fail", beat.fail === id);
    el.classList.toggle("is-wait", beat.wait === id);
    el.classList.toggle("is-skip", (beat.skip || []).includes(id));
    const wait = el.querySelector(".clm-ts-flow-wait");
    if (wait) {
      if (beat.wait === id && beat.waitLabel) {
        wait.hidden = false;
        wait.textContent = beat.waitLabel;
      } else {
        wait.hidden = true;
      }
    }
  });
  const title = clmTsEl("clm-ts-demo-panel-title");
  const body = clmTsEl("clm-ts-demo-panel-body");
  const caption = clmTsEl("clm-ts-demo-caption");
  const crumb = clmTsEl("clm-ts-crumb-here");
  if (title) title.textContent = beat.title;
  if (body) body.textContent = beat.panel;
  if (caption) caption.textContent = beat.caption;
  if (crumb) crumb.textContent = scene.crumb;
  const panel = document.querySelector(".clm-ts-demo-panel");
  if (panel) {
    panel.classList.remove("is-flash");
    void panel.offsetWidth;
    panel.classList.add("is-flash");
  }
}

function clmTsStopPlay() {
  if (clmTsTimer) {
    clearInterval(clmTsTimer);
    clmTsTimer = null;
  }
  const btn = clmTsEl("clm-ts-demo-play");
  if (btn) btn.textContent = "▶ Play";
}

function clmTsSetScene(key, opts = {}) {
  const scene = CLM_TS_SCENES[key];
  if (!scene) return;
  clmTsSceneKey = key;
  clmTsBeat = 0;
  clmTsStopPlay();

  document.querySelectorAll("[data-demo-scene]").forEach((btn) => {
    const on = btn.dataset.demoScene === key;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });

  const pill = clmTsEl("clm-ts-demo-status-pill");
  if (pill) {
    pill.className = "clm-ts-pill " + scene.status.cls;
    pill.textContent = scene.status.text;
  }

  clmTsRenderFlow(scene);
  clmTsApplyBeat(scene, scene.beats[0]);
  if (opts.autoplay) clmTsPlay();
}

function clmTsPlay() {
  const scene = CLM_TS_SCENES[clmTsSceneKey];
  if (!scene) return;
  const btn = clmTsEl("clm-ts-demo-play");
  if (clmTsTimer) {
    clmTsStopPlay();
    return;
  }
  if (CLM_TS_REDUCED) {
    clmTsApplyBeat(scene, scene.beats[scene.beats.length - 1]);
    clmTsBeat = scene.beats.length - 1;
    return;
  }
  if (btn) btn.textContent = "❚❚ Pause";
  const delay = 1300;
  const tick = () => {
    clmTsBeat += 1;
    if (clmTsBeat >= scene.beats.length) {
      clmTsStopPlay();
      return;
    }
    clmTsApplyBeat(scene, scene.beats[clmTsBeat]);
  };
  clmTsApplyBeat(scene, scene.beats[0]);
  clmTsBeat = 0;
  clmTsTimer = setInterval(tick, delay);
}

function clmTsPlayFromHero() {
  const demo = clmTsEl("clm-ts-activity-demo");
  if (demo) demo.scrollIntoView({ behavior: CLM_TS_REDUCED ? "auto" : "smooth", block: "center" });
  clmTsSetScene(clmTsSceneKey, { autoplay: true });
}

function clmTsAdminStrip() {
  const items = [...document.querySelectorAll("#clm-ts-admin-steps li")];
  if (!items.length) return;
  if (CLM_TS_REDUCED) {
    items.forEach((el) => el.classList.add("is-lit"));
    return;
  }
  let i = 0;
  const pulse = () => {
    items.forEach((el, idx) => el.classList.toggle("is-lit", idx === i));
    i = (i + 1) % items.length;
  };
  pulse();
  setInterval(pulse, 1800);
}

function clmTsDivergePlay() {
  const varVal = clmTsEl("clm-ts-var-val");
  const attrVal = clmTsEl("clm-ts-attr-val");
  const varBox = clmTsEl("clm-ts-var-box");
  const attrBox = clmTsEl("clm-ts-attr-box");
  const cap = clmTsEl("clm-ts-diverge-caption");
  if (!varVal || !attrVal) return;

  const frames = [
    {
      v: "Acme LLC",
      a: "Acme LLC",
      split: false,
      refresh: false,
      cap: "Kickoff — you wrote the attribute from the variable. They match.",
    },
    {
      v: "Acme LLC",
      a: "Acme Inc",
      split: true,
      refresh: false,
      cap: "Review Data: Jane edits the document attribute. The variable is unchanged.",
    },
    {
      v: "Acme LLC",
      a: "Acme Inc",
      split: true,
      refresh: false,
      cap: "A Decision that still reads the variable will take the wrong path.",
    },
    {
      v: "Acme Inc",
      a: "Acme Inc",
      split: false,
      refresh: true,
      cap: "Find Document refreshes XML, then Update Variable Value from current metadata. Now they match again.",
    },
  ];

  let i = 0;
  const apply = () => {
    const f = frames[i];
    varVal.textContent = f.v;
    attrVal.textContent = f.a;
    varBox.classList.toggle("is-stale", f.split);
    attrBox.classList.toggle("is-changed", f.split);
    varBox.classList.toggle("is-refresh", f.refresh);
    attrBox.classList.toggle("is-refresh", f.refresh);
    if (cap) cap.textContent = f.cap;
  };
  apply();
  if (CLM_TS_REDUCED) {
    i = frames.length - 1;
    apply();
    return;
  }
  const id = setInterval(() => {
    i += 1;
    if (i >= frames.length) {
      clearInterval(id);
      return;
    }
    apply();
  }, 1600);
}

function clmTsPublishLoop() {
  const steps = [...document.querySelectorAll(".clm-ts-publish-step")];
  if (!steps.length) return;
  if (CLM_TS_REDUCED) {
    steps.forEach((el) => el.classList.add("is-on"));
    return;
  }
  let i = 0;
  const tick = () => {
    if (i === 0) steps.forEach((el) => el.classList.remove("is-on"));
    if (i < steps.length) steps[i].classList.add("is-on");
    i = (i + 1) % (steps.length + 1);
  };
  const host = clmTsEl("clm-ts-publish");
  if (!host) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !host.dataset.playing) {
        host.dataset.playing = "1";
        tick();
        setInterval(tick, 850);
      }
    });
  }, { threshold: 0.35 });
  io.observe(host);
}

/* ── Lifecycle 101 ─────────────────────────────────────────────────────────── */

const CLM_TS_LIFE = [
  {
    kicker: "Stage 1 · Request",
    title: "Someone starts the request inside CLM",
    biz: "Fill the generation form (company, value, department). You get a draft in a folder and a task list later — not an XML file.",
    admin: "That payload lands in Params (often TemplateFieldData). It is a kickoff snapshot. It does not become document attributes until Update Document Metadata Value maps it.",
    steps: "Typical steps: Start · Doc Gen trigger · Update Document Metadata Value",
    caption: "Watch the company name. Params stays Acme LLC. Attributes and the variable only catch up if the design maps and refreshes them.",
    params: "Acme LLC",
    attr: "— not mapped yet —",
    variable: "Acme LLC",
    paramsNote: "Do not overwrite. Debugging copy of what started the run.",
    attrNote: "Left-hand metadata on the file. Empty until you map or Review Data fills it.",
    varNote: "Often copied from Params at kickoff. Not yet the live attribute.",
    flags: { params: "", attr: "is-stale", variable: "" },
  },
  {
    kicker: "Stage 2 · Edit",
    title: "Internal users correct the file and the metadata",
    biz: "Review Data asks for required fields. On Approve, you can also download, compare versions, upload a new Word file, or edit attributes.",
    admin: "Those edits write the document attribute (and maybe a new version). The workflow variable is unchanged unless you refresh. Required attributes that the assignee cannot see will sit the instance on Executing.",
    steps: "Typical steps: Review Data (up to 50 attributes) · Approve (version upload allowed)",
    caption: "Jane changes Company to Acme Inc on the document. Params and the variable still say Acme LLC.",
    params: "Acme LLC",
    attr: "Acme Inc",
    variable: "Acme LLC",
    paramsNote: "Still day-one form data. Official: do not mutate it.",
    attrNote: "Current metadata on the file — what people just typed.",
    varNote: "Stale. A Decision that reads this variable will take the wrong path.",
    flags: { params: "is-stale", attr: "is-changed", variable: "is-stale" },
  },
  {
    kicker: "Stage 3 · Approve",
    title: "Internal approval chooses the next path",
    biz: "Approve or reject. Reject should come back for edits — not vanish.",
    admin: "Approve outputs Approved / Rejected. Draw both lines. If the Decision still reads the kickoff variable, it ignores the name Legal just corrected. Find Document immediately before that Decision.",
    steps: "Typical steps: Approve · Choice / Routing · Decision (after refresh)",
    caption: "Routing is people. Conditions are data. If those two disagree, the instance looks 'random.'",
    params: "Acme LLC",
    attr: "Acme Inc",
    variable: "Acme LLC",
    paramsNote: "Useless for 'current company' questions.",
    attrNote: "Correct on the file — only if the next step reads attributes, not the old variable.",
    varNote: "Still stale until Find Document + Update Variable Value.",
    flags: { params: "is-stale", attr: "is-changed", variable: "is-stale" },
  },
  {
    kicker: "Stage 4 · Redline",
    title: "The document leaves CLM users for external review",
    biz: "Vendor or outside counsel gets a secure review. They edit the Word/PDF and send it back. You see a new version, not an email attachment chain.",
    admin: "Human path: Review and Send for External Review, then Wait for External Review. Automated path: Send for External Review. Official limits: more than 10 files fails; combined size ≤ 25 MB; email ingest is PDF/DOCX. Wait outputs include Completed with Document, Completed without Document, Expired, Failure, and Cancelled paths — wire them. A redline is a new checked-in version. It does not automatically rewrite CLM attributes.",
    steps: "Typical steps: Review and Send for External Review · Wait for External Review (or Send for External Review)",
    caption: "Version 3 is back. Company in the Word body may have changed. The attribute panel may still say Acme Inc until you remap.",
    params: "Acme LLC",
    attr: "Acme Inc",
    variable: "Acme LLC",
    paramsNote: "Unchanged. Still the original form.",
    attrNote: "May be unchanged even after a Word redline. Body ≠ metadata.",
    varNote: "Still the kickoff copy. Do not send this to a connector yet.",
    flags: { params: "is-stale", attr: "is-stale", variable: "is-stale" },
  },
  {
    kicker: "Stage 5 · Close",
    title: "Remap what changed, then finish",
    biz: "Legal confirms the latest version, maybe one more internal approve, then signature. You should see the current company name on the record — not last month's.",
    admin: "Find Document (refresh XML from the new version) → Update Variable Value from current metadata → map attributes that actually changed → optional Data Reconciliation after signature if Salesforce tracked content is in play → Send / Review and Send for Signature → Finish. Parent workflows wait until Finish is reached.",
    steps: "Typical steps: Find Document · Update Variable Value · Update Document Metadata Value · Signature · Finish",
    caption: "After refresh, attributes and the variable match the latest file. Params still shows the original request — that is by design.",
    params: "Acme LLC",
    attr: "Northwind LLC",
    variable: "Northwind LLC",
    paramsNote: "Kept on purpose for debugging the original request.",
    attrNote: "Mapped from the current document after redline / Review Data.",
    varNote: "Refreshed. Safe for Decisions, connectors, and naming.",
    flags: { params: "is-stale", attr: "is-refresh", variable: "is-refresh" },
  },
];

let clmTsLifeTimer = null;
let clmTsLifeIdx = 0;

function clmTsLifeSet(i, opts = {}) {
  const beat = CLM_TS_LIFE[i];
  if (!beat) return;
  clmTsLifeIdx = i;

  document.querySelectorAll("[data-life]").forEach((el) => {
    const n = Number(el.dataset.life);
    el.classList.toggle("is-on", n === i);
    el.classList.toggle("is-done", n < i);
  });

  const setTxt = (id, v) => { const el = clmTsEl(id); if (el) el.textContent = v; };
  setTxt("clm-ts-life-kicker", beat.kicker);
  setTxt("clm-ts-life-title", beat.title);
  setTxt("clm-ts-life-biz", beat.biz);
  setTxt("clm-ts-life-admin", beat.admin);
  const steps = clmTsEl("clm-ts-life-steps");
  if (steps) steps.innerHTML = `<strong>Typical steps:</strong> ${beat.steps.replace(/^Typical steps:\s*/i, "")}`;
  setTxt("clm-ts-life-caption", beat.caption);
  setTxt("clm-ts-life-params", beat.params);
  setTxt("clm-ts-life-attr", beat.attr);
  setTxt("clm-ts-life-var", beat.variable);
  setTxt("clm-ts-life-params-note", beat.paramsNote);
  setTxt("clm-ts-life-attr-note", beat.attrNote);
  setTxt("clm-ts-life-var-note", beat.varNote);

  const paint = (id, flag) => {
    const el = clmTsEl(id);
    if (!el) return;
    el.classList.remove("is-stale", "is-changed", "is-refresh");
    if (flag) el.classList.add(flag);
  };
  paint("clm-ts-life-params-box", beat.flags.params);
  paint("clm-ts-life-attr-box", beat.flags.attr);
  paint("clm-ts-life-var-box", beat.flags.variable);

  if (opts.autoplay) clmTsLifePlay(i);
}

function clmTsLifePlay(from = 0) {
  if (clmTsLifeTimer) {
    clearInterval(clmTsLifeTimer);
    clmTsLifeTimer = null;
  }
  const start = Number.isInteger(from) ? from : 0;
  clmTsLifeSet(start);
  if (CLM_TS_REDUCED) {
    clmTsLifeSet(CLM_TS_LIFE.length - 1);
    return;
  }
  let i = start;
  clmTsLifeTimer = setInterval(() => {
    i += 1;
    if (i >= CLM_TS_LIFE.length) {
      clearInterval(clmTsLifeTimer);
      clmTsLifeTimer = null;
      return;
    }
    clmTsLifeSet(i);
  }, 2200);
}

function clmTsLifeFromHero() {
  const host = clmTsEl("clm-ts-life");
  if (host) host.scrollIntoView({ behavior: CLM_TS_REDUCED ? "auto" : "smooth", block: "center" });
  clmTsLifePlay(0);
}

function clmTsInit() {
  document.querySelectorAll(".clm-ts-symptom").forEach((btn) => {
    btn.addEventListener("click", () => clmTsSetDiagnosis(btn.dataset.ts));
  });

  const resultBox = clmTsEl("clm-ts-result");
  if (resultBox) {
    resultBox.addEventListener("click", (e) => {
      const a = e.target.closest("[data-play-scene]");
      if (a && a.dataset.playScene) {
        clmTsSetScene(a.dataset.playScene, { autoplay: true });
      }
      if (a && a.dataset.diverge) {
        setTimeout(clmTsDivergePlay, 350);
      }
      if (a && a.dataset.playLife != null) {
        setTimeout(() => clmTsLifePlay(0), 200);
      }
    });
  }

  const search = clmTsEl("clm-ts-search");
  if (search) search.addEventListener("input", () => clmTsSearch(search.value));

  document.querySelectorAll(".clm-ts-copy").forEach((btn) => {
    btn.addEventListener("click", () => clmTsCopy(btn));
  });

  const caseBtn = clmTsEl("clm-ts-copy-case");
  if (caseBtn) {
    caseBtn.addEventListener("click", () => {
      caseBtn.dataset.copy = "clm-ts-case-notes";
      clmTsCopy(caseBtn);
    });
  }

  document.querySelectorAll("[data-demo-scene]").forEach((btn) => {
    btn.addEventListener("click", () => clmTsSetScene(btn.dataset.demoScene, { autoplay: true }));
  });
  const play = clmTsEl("clm-ts-demo-play");
  if (play) play.addEventListener("click", clmTsPlay);
  const heroPlay = clmTsEl("clm-ts-play-activity");
  if (heroPlay) heroPlay.addEventListener("click", clmTsPlayFromHero);

  const lifePlay = clmTsEl("clm-ts-life-play");
  if (lifePlay) lifePlay.addEventListener("click", () => clmTsLifePlay(0));
  const heroLife = clmTsEl("clm-ts-play-life");
  if (heroLife) heroLife.addEventListener("click", clmTsLifeFromHero);
  document.querySelectorAll("#clm-ts-life-track [data-life], #clm-ts-life-gaps [data-life]").forEach((el) => {
    const go = () => {
      if (clmTsLifeTimer) {
        clearInterval(clmTsLifeTimer);
        clmTsLifeTimer = null;
      }
      clmTsLifeSet(Number(el.dataset.life));
    };
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    });
  });

  const diverge = clmTsEl("clm-ts-diverge-play");
  if (diverge) diverge.addEventListener("click", clmTsDivergePlay);

  document.querySelectorAll("[data-err-filter]").forEach((btn) => {
    btn.addEventListener("click", () => clmTsErrFilter(btn.dataset.errFilter));
  });

  const params = new URLSearchParams(location.search);
  const symptom = params.get("symptom");
  if (symptom && CLM_TS_DIAGNOSES[symptom]) clmTsSetDiagnosis(symptom);

  clmTsSetScene("failed");
  clmTsAdminStrip();
  clmTsPublishLoop();
  clmTsToc();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", clmTsInit);
} else {
  clmTsInit();
}
