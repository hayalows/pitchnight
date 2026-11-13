/* Off Script venue explorer. All positions are illustrative. No booking endpoint,
   checkout, inventory, geolocation or third-party tracking. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const grid = $("seat-grid");
  const seats = [];
  const buttons = new Map();
  for (let row = 1; row <= 7; row++) {
    for (const side of ["L", "R"]) {
      for (let col = 1; col <= 4; col++) {
        const id = side + row + "-" + col;
        const x = side === "L" ? -5.2 + (col - 1) * 1.05 : 2.05 + (col - 1) * 1.05;
        const z = -5.7 + (row - 1) * 1.88;
        seats.push({ id, side, row, col, x, z });
      }
    }
  }
  const seatById = new Map(seats.map(s => [s.id, s]));
  const zoneOf = row => row <= 2 ? "FRONT" : row <= 5 ? "MIDDLE" : "REAR";
  const sideOf = side => side === "L" ? "LEFT" : "RIGHT";
  const labelOf = seat => sideOf(seat.side) + " / " + zoneOf(seat.row);
  let selected = null;
  let engine = null;
  let enginePromise = null;
  let activeView = "plan";

  function buildSeatButton(seat) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "seat";
    b.textContent = String(seat.col);
    b.dataset.seatId = seat.id;
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", "Illustrative seat " + seat.id + ", " + sideOf(seat.side).toLowerCase() + " section, row " + seat.row + ". Not reservable.");
    b.title = "Preview " + seat.id + ", not a reservation";
    b.addEventListener("click", () => selectSeat(seat));
    if (!buttons.has(seat.id)) buttons.set(seat.id, []);
    buttons.get(seat.id).push(b);
    return b;
  }
  for (let row = 1; row <= 7; row++) {
    const r = document.createElement("div");
    r.className = "seat-row";
    r.setAttribute("role", "group");
    r.setAttribute("aria-label", "Illustrative row " + row);
    const left = document.createElement("div"), right = document.createElement("div");
    left.className = right.className = "seat-bank";
    const aisle = document.createElement("div");
    aisle.className = "aisle";
    aisle.setAttribute("aria-hidden", "true");
    const marker = document.createElement("span");
    marker.className = "row-num";
    marker.textContent = String(row).padStart(2, "0");
    aisle.append(marker);
    seats.filter(seat => seat.row === row && seat.side === "L").forEach(seat => left.append(buildSeatButton(seat)));
    seats.filter(seat => seat.row === row && seat.side === "R").forEach(seat => right.append(buildSeatButton(seat)));
    r.append(left, aisle, right);
    grid.append(r);
  }

  let focusRow = 1;
  const rowTabButtons = new Map();
  const rowChips = $("row-chips");
  const rowDetail = $("row-detail");
  function showRow(row) {
    focusRow = row;
    for (const [number, button] of rowTabButtons) button.setAttribute("aria-pressed", String(number === row));
    // Remove stale DOM references when the detail row changes.
    for (const [id, list] of buttons) buttons.set(id, list.filter(button => !button.classList.contains("seat-detail")));
    rowDetail.replaceChildren();
    for (const side of ["L", "R"]) {
      const block = document.createElement("section");
      block.className = "detail-bank";
      const heading = document.createElement("h4");
      heading.textContent = sideOf(side) + " SIDE / ROW " + String(row).padStart(2, "0");
      const bank = document.createElement("div");
      bank.className = "detail-bank-seats";
      seats.filter(seat => seat.row === row && seat.side === side).forEach(seat => {
        const button = buildSeatButton(seat);
        button.classList.add("seat-detail");
        button.textContent = side + seat.col;
        button.setAttribute("aria-pressed", String(!!selected && selected.id === seat.id));
        bank.append(button);
      });
      block.append(heading,bank);
      rowDetail.append(block);
    }
  }
  for (let row=1;row<=7;row++){
    const tab=document.createElement("button");
    tab.type="button";tab.className="row-chip";
    tab.textContent=String(row).padStart(2,"0");
    tab.setAttribute("aria-label","Explore illustrative row "+row);
    tab.setAttribute("aria-pressed","false");
    tab.addEventListener("click",()=>showRow(row));
    rowChips.append(tab);
    rowTabButtons.set(row,tab);
  }
  showRow(1);

  function setFeedback(message) {
    $("aside-feedback").textContent = message || "";
  }
  function updateLink() {
    const url = new URL(location.href);
    if (selected) url.searchParams.set("seat", selected.id);
    else url.searchParams.delete("seat");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  function selectSeat(seat, skipUrl = false) {
    selected = seat || null;
    if (selected && focusRow !== selected.row) showRow(selected.row);
    for (const [id, list] of buttons) {
      for (const button of list) button.setAttribute("aria-pressed", String(!!selected && selected.id === id));
    }
    $("quick-selection").hidden = !selected || activeView !== "plan";
    if (selected) $("quick-seat-id").textContent=selected.id;
    document.body.classList.toggle("has-selected-seat",!!selected && activeView==="plan");
    $("reset-seat").disabled = !selected;
    $("seat-placeholder").hidden = !!selected;
    $("seat-selection").hidden = !selected;
    $("seat-eye").disabled = !selected;
    $("seat-share").disabled = !selected;
    if (selected) {
      $("selection-name").textContent = labelOf(selected);
      $("selection-id").textContent = "DEMO POSITION / " + selected.id;
      $("selection-area").textContent = zoneOf(selected.row) + " · " + sideOf(selected.side);
      $("selection-row").textContent = String(selected.row).padStart(2, "0");
      const range = selected.row <= 2 ? "close to the stage" : selected.row <= 5 ? "around the middle of the audience" : "towards the entrance, farther from the stage";
      $("seat-copy").textContent = "This example chair is " + range + " in the " + sideOf(selected.side).toLowerCase() + " seating bank. The central aisle runs between the two banks.";
      setFeedback("Preview selected: " + selected.id + ". No seat has been booked.");
    } else {
      setFeedback("Selection cleared.");
    }
    if (!skipUrl) updateLink();
    if (engine) engine.setSelected(selected);
  }

  const tabs = [...document.querySelectorAll('[role="tab"][data-view]')];
  async function showView(name) {
    activeView = name;
    tabs.forEach(tab => {
      const yes = tab.dataset.view === name;
      tab.setAttribute("aria-selected", String(yes));
      tab.tabIndex = yes ? 0 : -1;
    });
    $("panel-plan").hidden = name !== "plan";
    $("panel-3d").hidden = name !== "3d";
    $("quick-selection").hidden = !selected || name !== "plan";
    document.body.classList.toggle("has-selected-seat",!!selected && name==="plan");
    if (name === "3d") {
      if (!enginePromise) {
        $("three-loader").hidden = false;
        // Check capability before downloading 3D assets. Slow or GPU-less phones
        // retain the fully functional seating plan.
        let webglSupported=false;
        try {
          const probe=document.createElement("canvas");
          const gl=probe.getContext("webgl2")||probe.getContext("webgl");
          webglSupported=!!gl;
          gl?.getExtension("WEBGL_lose_context")?.loseContext();
        } catch (_error) { webglSupported=false; }
        if (!webglSupported) {
          $("three-loader").hidden=true;
          $("three-fallback").hidden=false;
          $("3d-state").textContent="2D PLAN AVAILABLE";
          enginePromise=Promise.resolve(null);
        } else enginePromise = import("./venue-3d.js?v=2").then(module => {
          return module.createVenueScene({
            canvas: $("venue-3d-canvas"),
            seats,
            onPick: id => { const seat = seatById.get(id); if (seat) selectSeat(seat); },
          });
        }).then(instance => {
          engine = instance;
          engine.setSelected(selected);
          $("three-loader").hidden = true;
          $("three-fallback").hidden = true;
          $("3d-state").textContent = "DRAG TO LOOK AROUND";
          return engine;
        }).catch(error => {
          console.warn("Optional venue scene unavailable", error);
          $("three-loader").hidden = true;
          $("three-fallback").hidden = false;
          $("3d-state").textContent = "2D PLAN AVAILABLE";
          setFeedback("The 3D view could not load. The seating plan is still available.");
          return null;
        });
      }
      const scene = await enginePromise;
      if (scene && activeView === "3d") scene.resize();
    }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => { showView(tab.dataset.view); });
    tab.addEventListener("keydown", ev => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(ev.key)) return;
      ev.preventDefault();
      const targetIndex = ev.key === "Home" ? 0 : ev.key === "End" ? tabs.length - 1 :
        ev.key === "ArrowRight" ? (i + 1) % tabs.length : (i + tabs.length - 1) % tabs.length;
      tabs[targetIndex].focus();
      showView(tabs[targetIndex].dataset.view);
    });
  });
  $("reset-seat").addEventListener("click", () => selectSeat(null));
  $("quick-clear").addEventListener("click", () => selectSeat(null));
  $("quick-view").addEventListener("click", () => $("seat-eye").click());
  $("seat-eye").addEventListener("click", async () => {
    if (!selected) return;
    const target = selected;
    await showView("3d");
    if (engine) {
      engine.viewFromSeat(target);
      $("3d-state").textContent = "VIEW FROM " + target.id;
      if (window.matchMedia("(max-width:790px)").matches) {
        $("panel-3d").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      $("panel-3d").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth", block: "start" });
      setFeedback("Your sample seat remains selected. 3D is unavailable on this device; the plan still works.");
    }
  });
  $("seat-share").addEventListener("click", async () => {
    if (!selected) return;
    const link = new URL(location.href);
    link.searchParams.set("seat", selected.id);
    link.hash = "explorer";
    const message = "Illustrative Off Script venue view " + selected.id + ". No reservation is made.";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Off Script venue preview", text: message, url: link.href });
        setFeedback("Preview shared. This is not a seat reservation.");
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message + "\n" + link.href);
        setFeedback("Preview link copied. No seat has been booked.");
      } else {
        setFeedback("Copy this link to share: " + link.href);
      }
    } catch (error) {
      if (error.name !== "AbortError") setFeedback("Could not share. Try copying the page link.");
    }
  });
  $("fallback-plan").addEventListener("click", () => showView("plan"));
  for (const [id, method, arg] of [
    ["turn-left", "rotate", -.18], ["turn-right", "rotate", .18],
    ["zoom-out", "zoom", 1.16], ["zoom-in", "zoom", .86],
    ["stage-camera", "stageView", null],
    ["reset-camera", "reset", null],
  ]) {
    $(id).addEventListener("click", () => {
      if (!engine) return;
      if (arg === null) engine[method](); else engine[method](arg);
      $("3d-state").textContent = "DRAG TO LOOK AROUND";
    });
  }
  const requestedId = new URLSearchParams(location.search).get("seat");
  if (requestedId && seatById.has(requestedId)) selectSeat(seatById.get(requestedId), true);
  else if (requestedId) setFeedback("That sample position isn't in this illustration.");
})();
