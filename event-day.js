/* Off Script: lightweight event-day direction access.
   No geolocation permission, tracking, payments, or additional network requests. */
(() => {
  "use strict";
  const dock = document.getElementById("event-day-dock");
  const strip = document.getElementById("arrival-guide");
  const venue = document.getElementById("venue");
  const primaryDirections = [...document.querySelectorAll(".v2-actions .v2-ticket-button, #details .ticket-cta")];
  if (!dock || !strip || !venue) return;
  const mobile = window.matchMedia("(max-width: 720px)");
  let stripVisible = true, venueVisible = false;
  const visibleDirections = new Set();
  const update = () => {
    dock.hidden = !mobile.matches || stripVisible || venueVisible || visibleDirections.size > 0;
  };
  if (!("IntersectionObserver" in window)) {
    dock.hidden = !mobile.matches;
    mobile.addEventListener?.("change", () => { dock.hidden = !mobile.matches; });
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target === strip) stripVisible = entry.isIntersecting;
      if (entry.target === venue) venueVisible = entry.isIntersecting;
      if (primaryDirections.includes(entry.target)) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) visibleDirections.add(entry.target);
        else visibleDirections.delete(entry.target);
      }
    });
    update();
  }, { threshold: [0, 0.35, 0.6] });
  observer.observe(strip);
  observer.observe(venue);
  primaryDirections.forEach(action => observer.observe(action));
  mobile.addEventListener?.("change", update);
})();
