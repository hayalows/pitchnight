/* Off Script: lightweight event-day direction access.
   No geolocation permission, tracking, payments, or additional network requests. */
(() => {
  "use strict";
  const dock = document.getElementById("event-day-dock");
  const strip = document.getElementById("arrival-guide");
  const venue = document.getElementById("venue");
  if (!dock || !strip || !venue) return;
  const mobile = window.matchMedia("(max-width: 720px)");
  let stripVisible = true, venueVisible = false;
  const update = () => {
    dock.hidden = !mobile.matches || stripVisible || venueVisible;
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
    });
    update();
  }, { threshold: 0 });
  observer.observe(strip);
  observer.observe(venue);
  mobile.addEventListener?.("change", update);
})();
