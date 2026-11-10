/* The Off Script reporting surface. All numbers come from authenticated API responses. */
(() => {
  "use strict";
  const byId = id => document.getElementById(id);
  const login = byId("login-panel");
  const workspace = byId("workspace");
  const form = byId("login-form");
  const error = byId("login-error");
  const status = byId("status");
  let current = null;
  let loadId = 0;
  let figuresDirty = false;
  const countryNames = new Intl.DisplayNames(["en-GH"], { type: "region" });
  const fmt = n => Number(n || 0).toLocaleString("en-GH", { maximumFractionDigits: 0 });
  const setText = (id, text) => { const el = byId(id); if (el) el.textContent = text; };
  function visible(signedIn) {
    login.hidden = signedIn;
    workspace.hidden = !signedIn;
  }
  async function api(method, payload, query) {
    const response = await fetch("/api/admin" + (query || ""), {
      method,
      credentials: "same-origin",
      headers: payload ? { "Content-Type": "application/json" } : {},
      body: payload ? JSON.stringify(payload) : undefined,
      cache: "no-store"
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(result.error || "Request failed. Try again.");
      err.status = response.status;
      throw err;
    }
    return result;
  }
  function empty(element, message) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = message;
    element.replaceChildren(p);
  }
  function renderBarList(target, items, total, emptyText, labelFor) {
    target.replaceChildren();
    if (!items || !items.length) return empty(target, emptyText || "No measured sessions in this period.");
    for (const item of items) {
      const share = total > 0 ? (item.value / total) * 100 : 0;
      const wrap = document.createElement("div");
      wrap.className = "bar-item";
      const label = document.createElement("div");
      label.className = "bar-label";
      const name = document.createElement("span");
      const aliases = { direct: "Direct / unknown", mobile: "700 px or less", desktop: "Over 700 px", none: "No campaign tag" };
      name.textContent = labelFor ? labelFor(item.name) : Object.hasOwn(aliases, item.name) ? aliases[item.name] : item.name;
      const number = document.createElement("span");
      number.textContent = fmt(item.value) + " of " + fmt(total) + " · " + share.toFixed(1) + "%";
      label.append(name, number);
      const track = document.createElement("div");
      track.className = "bar-track";
      track.setAttribute("role", "img");
      track.setAttribute("aria-label", name.textContent + ": " + fmt(item.value) + " of " + fmt(total) + " sessions");
      const bar = document.createElement("div");
      bar.className = "bar-fill";
      bar.style.width = Math.max(0, Math.min(100, share)).toFixed(1) + "%";
      track.append(bar);
      wrap.append(label, track);
      target.append(wrap);
    }
  }
  function renderActions(totals, actionSessions) {
    const container = byId("actions");
    container.replaceChildren();
    const rows = [
      ["Registration button selected", "ticket_open"],
      ["Registration desk opened", "registration_desk_open"],
      ["Google Form link opened", "registration_form_link"],
      ["Form submission box ticked", "form_acknowledged"],
      ["Paystack link selected", "payment_link_click"],
      ["Ticket section seen", "tickets_seen"],
      ["Programme section seen", "programme_seen"],
      ["Programme opened", "programme_open"],
      ["Host section seen", "host_seen"],
      ["Host profile opened", "host_open"],
      ["FAQ answer opened", "faq_open"],
      ["Poster studio opened", "poster_open"],
      ["Poster format changed", "poster_format_change"],
      ["Poster download attempted", "poster_download_click"],
      ["Poster share attempted", "poster_share_click"],
      ["Website share attempted", "site_share_click"],
      ["Feedback form opened", "feedback_open"]
    ];
    for (const [label, key] of rows) {
      const row = document.createElement("tr");
      const title = document.createElement("th");
      title.scope = "row";
      title.textContent = label;
      const sessions = document.createElement("td");
      sessions.textContent = fmt(actionSessions[key]);
      const events = document.createElement("td");
      events.textContent = fmt(totals[key]);
      row.append(title, sessions, events);
      container.append(row);
    }
  }
  function renderFeedback(feedback) {
    const notes = feedback?.notes || [];
    const list = byId("feedback-notes");
    list.replaceChildren();
    const count = notes.length;
    if (feedback?.unavailable) {
      setText("feedback-summary", "Feedback could not be loaded. Use Refresh to try again.");
      return;
    }
    const average = count ? notes.reduce((sum, note) => sum + note.rating, 0) / count : 0;
    const partial = feedback?.truncated || feedback?.unreadable > 0;
    setText("feedback-summary", count ? fmt(count) + " responses shown · " + average.toFixed(1) + "/5 average ease" +
      (partial ? " · Some notes are missing" : "") :
      (partial ? "Feedback records could not be read." : "No feedback in this date range."));
    const topics = { registration: "Registration or payment", programme: "Programme or host", poster: "Poster", other: "Other" };
    for (const note of notes) {
      const li = document.createElement("li");
      const title = document.createElement("h3");
      title.textContent = topics[note.topic] + " · " + note.rating + "/5";
      const time = document.createElement("time");
      time.dateTime = note.submittedAt;
      time.textContent = new Date(note.submittedAt).toLocaleString("en-GH", { timeZone: "UTC" }) + " GMT";
      const message = document.createElement("p");
      message.textContent = note.message;
      li.append(title, time, message);
      list.append(li);
    }
  }
  function renderCampaigns(items, total, quality) {
    const body = byId("campaigns");
    body.replaceChildren();
    const entries = [...(items || [])].sort((a, b) => a.name === "none" ? 1 : b.name === "none" ? -1 : b.value - a.value);
    if (!entries.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 3;
      cell.textContent = "No sessions have been recorded yet.";
      row.append(cell); body.append(row);
    }
    for (const entry of entries) {
      const row = document.createElement("tr");
      const name = document.createElement("td");
      const value = document.createElement("td");
      const share = document.createElement("td");
      name.textContent = entry.name === "none" ? "No campaign tag" : entry.name;
      if (entry.name === "none") row.className = "untagged-row";
      value.textContent = fmt(entry.value);
      share.textContent = total ? (100 * entry.value / total).toFixed(1) + "%" : "0%";
      row.append(name, value, share);
      body.append(row);
    }
    setText("campaign-total", fmt(total));
    setText("campaign-share", total ? "100%" : "0%");
    setText("campaign-summary", fmt(quality.taggedSessions) + " tagged · " + fmt(quality.untaggedSessions) + " without a campaign tag. Both are included.");
  }
  function drawTrend(days) {
    const target = byId("traffic-chart");
    const table = byId("daily-table-body");
    target.replaceChildren();
    table.replaceChildren();
    const daily = days || [];
    for (const entry of daily) {
      const row = document.createElement("tr");
      for (const value of [entry.day, fmt(entry.sessions), fmt(entry.pageViews)]) {
        const td = document.createElement("td");
        td.textContent = value;
        row.append(td);
      }
      table.append(row);
    }
    if (!daily.some(entry => entry.sessions > 0)) return empty(target, "No recorded sessions in this date range.");
    const maxValue = Math.max(1, ...daily.map(d => d.sessions));
    const axisMaximum = Math.max(2, Math.ceil(maxValue / 2) * 2);
    const graph = document.createElement("div");
    graph.className = "trend-graph";
    const axis = document.createElement("div");
    axis.className = "trend-axis";
    [axisMaximum, axisMaximum / 2, 0].forEach(n => {
      const label = document.createElement("span");
      label.textContent = fmt(n);
      axis.append(label);
    });
    const scroll = document.createElement("div");
    scroll.className = "trend-scroll";
    scroll.tabIndex = 0;
    scroll.setAttribute("role", "region");
    scroll.setAttribute("aria-label", "Session bar chart. Scroll to view more days.");
    const bars = document.createElement("div");
    bars.className = "trend-bars";
    bars.style.minWidth = Math.max(400, daily.length * 48) + "px";
    for (const entry of daily) {
      const figure = document.createElement("div");
      figure.className = "trend-day";
      figure.setAttribute("role", "img");
      figure.setAttribute("aria-label", entry.day + ": " + fmt(entry.sessions) + " sessions, " + fmt(entry.pageViews) + " page views");
      figure.title = entry.day + " · " + fmt(entry.sessions) + " sessions";
      const area = document.createElement("div");
      area.className = "trend-area";
      const label = document.createElement("span");
      label.className = "trend-value";
      label.textContent = fmt(entry.sessions);
      const bar = document.createElement("span");
      bar.className = "trend-column";
      bar.style.height = entry.sessions ? (entry.sessions / axisMaximum * 100).toFixed(1) + "%" : "0%";
      const date = document.createElement("span");
      date.className = "trend-date";
      date.textContent = new Date(entry.day + "T00:00:00Z").toLocaleDateString("en-GH", { day: "numeric", month: "short", timeZone: "UTC" });
      area.append(label, bar); figure.append(area, date); bars.append(figure);
    }
    scroll.append(bars);
    graph.append(axis, scroll);
    target.append(graph);
    if (daily.length > 7) {
      const tip = document.createElement("p");
      tip.className = "hint scroll-tip";
      tip.textContent = "Scroll across to see all " + daily.length + " days. Exact numbers are available below.";
      target.append(tip);
    }
  }
  function renderFigures(figures) {
    const items = [["figure-forms", "formResponses"], ["figure-paid", "paidTickets"], ["figure-gross", "grossCedis"]];
    for (const [id, key] of items) byId(id).value = figures && typeof figures[key] === "number" ? String(figures[key]) : "";
    setText("figure-updated", figures?.updatedAt ? "Last updated " + new Date(figures.updatedAt).toLocaleString("en-GH", { timeZone: "UTC" }) + " GMT" : "No reported totals saved");
  }
  function render(data) {
    current = data;
    const totals = data.totals || {};
    const quality = data.quality || {};
    const actions = data.actionSessions || {};
    const total = totals.sessions || 0;
    setText("metric-sessions", fmt(total));
    setText("metric-ticket", fmt(totals.ticketSessions));
    setText("metric-posters", fmt(totals.posterSessions));
    setText("metric-engaged", fmt(totals.paymentSessions));
    const rate = value => total ? (100 * (Number(value) || 0) / total).toFixed(1) + "% of measured sessions" : "No sessions measured yet";
    setText("metric-ticket-share", rate(totals.ticketSessions));
    setText("metric-poster-share", rate(totals.posterSessions));
    setText("metric-engaged-share", rate(totals.paymentSessions));
    setText("views", fmt(totals.pageViews) + " page views · " + fmt(total) + " sessions");
    drawTrend(data.daily);
    renderBarList(byId("sources"), data.sources, total, "No traffic sources measured yet.");
    renderBarList(byId("countries"), data.countries, total, "No country information recorded.",
      code => code === "unknown" ? "Unknown" : countryNames.of(code));
    renderBarList(byId("devices"), data.devices, total, "No device information recorded yet.");
    renderActions(totals, actions);
    renderCampaigns(data.campaigns, total, quality);
    renderFeedback(data.feedback);
    if (!figuresDirty) renderFigures(data.figures);
    byId("save-figures").disabled = data.figuresUnavailable;
    if (data.figuresUnavailable) setText("figure-updated", "Event totals could not be loaded. Refresh before editing.");
    const coverage = byId("coverage");
    coverage.hidden = data.coverage?.complete === true;
    if (!coverage.hidden) {
      const gaps = [];
      if (data.coverage?.truncated) gaps.push("the " + fmt(data.coverage.cap) + "-record limit was reached");
      if (data.coverage?.unreadable) gaps.push(fmt(data.coverage.unreadable) + " records could not be read");
      if (data.coverage?.duplicates) gaps.push(fmt(data.coverage.duplicates) + " duplicate records were excluded");
      coverage.textContent = "Partial report. " + gaps.join("; ") + ". Charts and shares cover the " + fmt(total) + " included sessions.";
    }
    const equal = Number(quality.sourceSessions) === total && Number(quality.campaignSessions) === total &&
      Number(quality.deviceSessions) === total && Number(quality.countrySessions) === total && Number(quality.dailySessions) === total && quality.reconciled === true;
    const statusLine = byId("reconciliation");
    statusLine.classList.toggle("mismatch", !equal);
    statusLine.textContent = equal
      ? "The daily, source, campaign, screen size and country totals each match the " + fmt(total) + " sessions shown."
      : "The breakdowns do not match the session total. Refresh before using these figures.";
    setText("generated-at", "Generated " + new Date(data.generatedAt).toLocaleString("en-GH", { timeZone: "UTC" }) +
      " GMT. Last visitor activity: " + (data.lastActivityAt ? new Date(data.lastActivityAt).toLocaleString("en-GH", { timeZone: "UTC" }) + " GMT" : "none recorded"));
    status.textContent = "Showing the last " + data.windowDays + " days · " + data.minDate + " to " + data.maxDate + " · Ghana time (GMT)";
  }
  async function load() {
    const request = ++loadId;
    status.textContent = "Loading report…";
    try {
      const data = await api("GET", null, "?days=" + byId("period").value);
      if (request !== loadId) return;
      visible(true);
      render(data);
    } catch (e) {
      if (request !== loadId) return;
      if (e.status === 401) {
        current = null;
        figuresDirty = false;
        visible(false);
        error.textContent = "";
      } else {
        status.textContent = current ? e.message + " Showing the previously loaded report (" + current.windowDays + " days)." : e.message;
        if (workspace.hidden) error.textContent = e.message;
      }
    }
  }
  form.addEventListener("submit", async event => {
    event.preventDefault();
    error.textContent = "";
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      await api("POST", { password: byId("admin-password").value });
      byId("admin-password").value = "";
      await load();
    } catch (e) {
      error.textContent = e.message;
    } finally { button.disabled = false; }
  });
  byId("period").addEventListener("change", load);
  byId("refresh").addEventListener("click", load);
  byId("logout").addEventListener("click", async () => {
    ++loadId;
    try { await api("DELETE"); }
    catch (error) { status.textContent = error.message; return; }
    current = null;
    figuresDirty = false;
    renderFigures(null);
    byId("feedback-notes").replaceChildren();
    visible(false);
    error.textContent = "";
    byId("admin-password").focus();
  });
  byId("figures-form").addEventListener("input", () => { figuresDirty = true; });
  byId("figures-form").addEventListener("submit", async event => {
    event.preventDefault();
    const save = byId("save-figures");
    const message = byId("figure-message");
    message.textContent = "";
    const raw = [byId("figure-forms").value, byId("figure-paid").value, byId("figure-gross").value];
    if (raw.some(v => !v.trim())) { message.textContent = "Fill in all three fields before saving."; return; }
    const figures = { formResponses: Number(raw[0]), paidTickets: Number(raw[1]), grossCedis: Number(raw[2]) };
    if (!Number.isInteger(figures.formResponses) || !Number.isInteger(figures.paidTickets) ||
        !Number.isFinite(figures.grossCedis) || figures.formResponses < 0 || figures.paidTickets < 0 ||
        figures.grossCedis < 0) { message.textContent = "Check your amounts and counts."; return; }
    save.disabled = true;
    try {
      const response = await api("PUT", figures);
      if (current) current.figures = response.figures;
      figuresDirty = false;
      renderFigures(response.figures);
      message.style.color = "#12572e";
      message.textContent = "Organiser totals saved.";
    } catch (e) {
      message.style.color = "";
      message.textContent = e.message;
    } finally { save.disabled = false; }
  });
  function csvCell(value) {
    const raw = String(value ?? "");
    const safe = /^(?:\s*[=+\-@]|[\t\r\n])/.test(raw) ? "'" + raw : raw;
    return '"' + safe.replace(/"/g, '""') + '"';
  }
  byId("export").addEventListener("click", () => {
    if (!current) return;
    const rows = [["Section", "Metric", "Value"], ["Reporting", "Days", current.windowDays],
      ["Reporting", "Generated at UTC", current.generatedAt],
      ["Quality", "Complete", current.coverage?.complete ? "Yes" : "No"]];
    for (const [key, value] of Object.entries(current.totals || {})) rows.push(["Activity", key, value]);
    for (const [key, value] of Object.entries(current.actionSessions || {})) rows.push(["Sessions with action", key, value]);
    for (const item of current.daily || []) {
      rows.push(["Daily sessions", item.day, item.sessions]);
      rows.push(["Daily page views", item.day, item.pageViews]);
    }
    for (const item of current.sources || []) rows.push(["Source sessions", item.name, item.value]);
    for (const item of current.campaigns || []) rows.push(["Campaign sessions", item.name, item.value]);
    for (const item of current.devices || []) rows.push(["Screen size sessions", item.name, item.value]);
    for (const item of current.countries || []) rows.push(["Country sessions", item.name, item.value]);
    rows.push(["Quality", "Unreadable session records", current.coverage?.unreadable]);
    rows.push(["Quality", "Duplicate session records", current.coverage?.duplicates]);
    rows.push(["Quality", "Session breakdowns reconcile", Boolean(current.quality?.reconciled)]);
    if (current.figures) for (const key of ["formResponses","paidTickets","grossCedis","updatedAt"]) rows.push(["Organiser reported", key, current.figures[key]]);
    const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "make-your-case-analytics-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  load();
})();
