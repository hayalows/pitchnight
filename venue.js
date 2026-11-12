/* Off Script: lightweight venue map and share controls.
   Maps embed loads only after a guest explicitly asks to view it. */
(function () {
  "use strict";
  const mapOpen = document.getElementById("venue-map-open");
  const mapClose = document.getElementById("venue-map-close");
  const mapCover = document.getElementById("venue-map-cover");
  const mapFrame = document.getElementById("venue-map-frame");
  const mapTools = document.getElementById("venue-map-tools");
  const shareButton = document.getElementById("venue-share");
  const feedback = document.getElementById("venue-feedback");
  if (!mapOpen || !mapClose || !mapCover || !mapFrame || !mapTools) return;

  const mapLink = "https://www.google.com/maps/search/?api=1&query=Digital%20360%20Studio%2C%20Haatso%2C%20Ghana&query_place_id=ChIJFZs9TgCd3w8RrOHv201Asok";
  const embedLink = "https://www.google.com/maps?q=MQ6W%2BWRP%2C%20Haatso%2C%20Ghana&z=16&output=embed";

  mapOpen.addEventListener("click", () => {
    mapFrame.src = embedLink;
    mapFrame.hidden = false;
    mapTools.hidden = false;
    mapCover.hidden = true;
    mapOpen.setAttribute("aria-expanded", "true");
    mapClose.focus();
  });

  mapClose.addEventListener("click", () => {
    mapFrame.hidden = true;
    mapFrame.removeAttribute("src");
    mapTools.hidden = true;
    mapCover.hidden = false;
    mapOpen.setAttribute("aria-expanded", "false");
    mapOpen.focus();
  });

  if (!shareButton || !feedback) return;
  shareButton.addEventListener("click", async () => {
    const message = "Pitch Night · Friday 13 November 2026, 6:30 PM GMT. Digital 360 Studio, Haatso, Accra (MQ6W+WRP).";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Pitch Night venue · Digital 360 Studio", text: message, url: mapLink });
        feedback.textContent = "";
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(message + "\n" + mapLink);
      feedback.textContent = "Location link copied. Ready to share.";
    } catch (_) {
      feedback.textContent = "Unable to copy the link. Use Get Directions to open the location.";
    }
  });
})();
