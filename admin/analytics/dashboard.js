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
  const fmt = n => Number(n || 0).toLocaleString("en-GH", { maximumFractionDigits: 0 });
  const cedi = n => "GH₵" + Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  function renderBarList(target, items) {
    target.replaceChildren();
    if (!items || !items.length) return empty(target, "No measured sessions in this period.");
    const maximum = Math.max(...items.map(i => i.value), 1);
    for (const item of items.slice(0, 8)) {
      const wrap = document.createElement("div");
      const label = document.createElement("div");
      label.className = "bar-label";
      const name = document.createElement("span");
      name.textContent = item.name === "direct" ? "Direct / unknown" : item.name;
      const number = document.createElement("span");
      number.textContent = fmt(item.value);
      label.append(name, number);
      const track = document.createElement("div");
      track.className = "bar-track";
      const bar = document.createElement("div");
      bar.className = "bar-fill";
      bar.style.width = (100 * item.value / maximum).toFixed(1) + "%";
      track.append(bar);
      wrap.append(label, track);
      target.append(wrap);
    }
  }
  function renderActions(totals) {
    const container = byId("actions");
    container.replaceChildren();
    const rows = [
      ["Programme opens", "programme_open"],
      ["Poster studio opens", "poster_open"],
      ["Poster download clicks", "poster_download_click"],
      ["Poster share clicks", "poster_share_click"],
      ["Form completion acknowledgements", "form_acknowledged"],
      ["Website share clicks", "site_share_click"]
    ];
    for (const [label, key] of rows) {
      const row = document.createElement("div");
      row.className = "action-row";
      const t = document.createElement("span");
      t.textContent = label;
      const v = document.createElement("strong");
      v.textContent = fmt(totals[key]);
      row.append(t, v);
      container.append(row);
    }
  }
  function renderCampaigns(items) {
    const body = byId("campaigns");
    body.replaceChildren();
    const filtered = (items || []).filter(i => i.name !== "none");
    if (!filtered.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 2;
      cell.textContent = "No tagged campaigns recorded yet";
      row.append(cell);
      body.append(row);
      return;
    }
    for (const entry of filtered.slice(0, 12)) {
      const row = document.createElement("tr");
      const a = document.createElement("td"), b = document.createElement("td");
      a.textContent = entry.name;
      b.textContent = fmt(entry.value);
      row.append(a, b);
      body.append(row);
    }
  }
  function drawTrend(data) {
    const container = byId("traffic-chart");
    container.replaceChildren();
    const daily = data || [];
    if (!daily.some(item => item.sessions > 0)) {
      container.classList.add("chart-empty");
      container.textContent = "No traffic recorded in this date range.";
      return;
    }
    container.classList.remove("chart-empty");
    const NS = "http://www.w3.org/2000/svg";
    const el = (name, attrs) => {
      const x = document.createElementNS(NS, name);
      for (const [k, v] of Object.entries(attrs || {})) x.setAttribute(k, String(v));
      return x;
    };
    const svg = el("svg", { viewBox: "0 0 620 206", role: "img", "aria-label": "Daily measured sessions, from " + daily[0].day + " to " + daily[daily.length - 1].day });
    const max = Math.max(1, ...daily.map(x => x.sessions));
    const plotX = 13, plotY = 15, width = 595, height = 145;
    for (let j = 0; j < 4; j++) {
      const y = plotY + j * height / 3;
      svg.append(el("line", { x1: plotX, y1: y, x2: plotX + width, y2: y, stroke: "#d6d0c5", "stroke-dasharray": "4 5" }));
    }
    const coords = daily.map((x, i) => [
      plotX + (daily.length === 1 ? width / 2 : width * i / (daily.length - 1)),
      plotY + height * (1 - x.sessions / max)
    ]);
    const d = coords.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    svg.append(el("path", { d: d + " L" + coords[coords.length - 1][0] + " 160 L" + coords[0][0] + " 160 Z", fill: "#123cb3", "fill-opacity": ".09" }));
    svg.append(el("path", { d, stroke: "#123cb3", "stroke-width": 3, fill: "none", "stroke-linejoin": "round", "stroke-linecap": "round" }));
    if (daily.length <= 7) for (const p of coords) svg.append(el("circle", { cx: p[0], cy: p[1], r: 3.5, fill: "#123cb3" }));
    const positions = [...new Set([0, Math.floor((daily.length - 1) / 2), daily.length - 1])];
    for (const i of positions) {
      const date = new Date(daily[i].day + "T00:00:00Z");
      const label = el("text", {
        x: coords[i][0], y: 193, fill: "#6b685e", "font-size": 11,
        "text-anchor": i === 0 ? "start" : i === daily.length - 1 ? "end" : "middle"
      });
      label.textContent = date.toLocaleDateString("en-GH", { month: "short", day: "numeric", timeZone: "UTC" });
      svg.append(label);
    }
    container.append(svg);
  }
  function renderFigures(figures) {
    const items = [["figure-forms", "formResponses"], ["figure-paid", "paidTickets"], ["figure-gross", "grossCedis"]];
    for (const [id, key] of items) byId(id).value = figures && typeof figures[key] === "number" ? String(figures[key]) : "";
    setText("figure-updated", figures?.updatedAt ? "Last updated " + new Date(figures.updatedAt).toLocaleString("en-GH", { timeZone: "UTC" }) + " GMT" : "No reported totals saved");
  }
  function render(data) {
    current = data;
    const totals = data.totals || {};
    setText("metric-sessions", fmt(totals.sessions));
    setText("metric-ticket", fmt(totals.ticket_open));
    setText("metric-posters", fmt(totals.poster_download_click));
    setText("metric-payment", fmt(totals.payment_link_click));
    setText("views", fmt(totals.pageViews) + " page views");
    drawTrend(data.daily);
    renderBarList(byId("sources"), data.sources);
    renderActions(totals);
    renderCampaigns(data.campaigns);
    renderFigures(data.figures);
    const coverage = byId("coverage");
    coverage.hidden = data.coverage?.complete !== false && !data.coverage?.unreadable;
    if (!coverage.hidden) coverage.textContent = "Data coverage is incomplete. Storage scan limit reached or some records could not be read; shown counts may be lower than actual activity.";
    setText("generated-at", "Report updated " + new Date(data.generatedAt).toLocaleString("en-GH", { timeZone: "UTC" }) + " GMT");
    status.textContent = "Measured activity · " + data.windowDays + " day window · Ghana time (GMT)";
  }
  async function load() {
    status.textContent = "Loading real analytics…";
    try {
      const data = await api("GET", null, "?days=" + byId("period").value);
      visible(true);
      render(data);
    } catch (e) {
      if (e.status === 401) {
        visible(false);
        error.textContent = "";
      } else {
        status.textContent = e.message;
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
      visible(true);
      await load();
    } catch (e) {
      error.textContent = e.message;
    } finally { button.disabled = false; }
  });
  byId("period").addEventListener("change", load);
  byId("refresh").addEventListener("click", load);
  byId("logout").addEventListener("click", async () => {
    try { await api("DELETE"); }
    catch (_) {}
    current = null;
    visible(false);
    error.textContent = "";
    byId("admin-password").focus();
  });
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
    const safe = /^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
    return '"' + safe.replace(/"/g, '""') + '"';
  }
  byId("export").addEventListener("click", () => {
    if (!current) return;
    const rows = [["Section", "Metric", "Value"], ["Reporting", "Days", current.windowDays],
      ["Reporting", "Generated at UTC", current.generatedAt],
      ["Quality", "Complete", current.coverage?.complete ? "Yes" : "No"]];
    for (const [key, value] of Object.entries(current.totals || {})) rows.push(["Activity", key, value]);
    for (const item of current.daily || []) rows.push(["Daily sessions", item.day, item.sessions]);
    for (const item of current.sources || []) rows.push(["Source", item.name, item.value]);
    for (const item of current.campaigns || []) rows.push(["Campaign", item.name, item.value]);
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
