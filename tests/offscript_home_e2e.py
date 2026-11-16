"""End-to-end journeys for the Offscript homepage (site/index.html).

Run from the repository root:
    python3 -m http.server 8099 &
    python3 tests/offscript_home_e2e.py            # uses Playwright's Chromium
    CHROME=/usr/bin/google-chrome python3 tests/offscript_home_e2e.py
Every journey uses the real page in a real browser. Sign-up responses are stubbed
at the network layer so each state (success, list not open, server error, offline)
can be checked without a back end.
"""
import os
import sys

from playwright.sync_api import sync_playwright, expect

URL = os.environ.get("URL", "http://localhost:8099/site/index.html")
CHROME = os.environ.get("CHROME")

results = []


def check(name, fn):
    try:
        fn()
        results.append((name, "PASS", ""))
    except Exception as e:  # report and keep going so every journey is seen
        results.append((name, "FAIL", str(e).splitlines()[0][:160]))


def page_at(browser, w, h, **kw):
    pg = browser.new_page(viewport={"width": w, "height": h}, **kw)
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(URL)
    pg.wait_for_load_state("networkidle")
    return pg, errors


with sync_playwright() as p:
    args = {"args": ["--no-sandbox"]}
    if CHROME:
        args["executable_path"] = CHROME
    b = p.chromium.launch(**args)

    # 1. Desktop: no horizontal overflow, nav visible, menu button hidden, no JS errors
    def desktop_basics():
        pg, errors = page_at(b, 1440, 900)
        assert pg.evaluate("document.documentElement.scrollWidth") <= 1440
        expect(pg.locator("#site-nav")).to_be_visible()
        expect(pg.locator(".menu-btn")).to_be_hidden()
        expect(pg.get_by_role("heading", level=1)).to_contain_text("Beyond")
        assert not errors, errors
    check("desktop layout, nav and no script errors", desktop_basics)

    # 2. Phone: menu opens, closes with Escape and returns focus, closes on link tap
    def phone_menu():
        pg, _ = page_at(b, 390, 844)
        assert pg.evaluate("document.documentElement.scrollWidth") <= 390
        btn = pg.locator(".menu-btn")
        expect(pg.locator("#site-nav")).to_be_hidden()
        btn.click()
        expect(btn).to_have_attribute("aria-expanded", "true")
        expect(pg.get_by_role("link", name="Connection Board").first).to_be_visible()
        pg.keyboard.press("Escape")
        expect(btn).to_have_attribute("aria-expanded", "false")
        expect(btn).to_be_focused()
        btn.click()
        pg.locator("#site-nav").get_by_role("link", name="About").click()
        expect(btn).to_have_attribute("aria-expanded", "false")
    check("phone menu open, Escape, link closes it", phone_menu)

    # 3. Every "list" link lands in the email field
    def list_links_focus():
        pg, _ = page_at(b, 1440, 900)
        pg.locator(".soon a").click()
        pg.wait_for_timeout(700)
        expect(pg.locator("#email")).to_be_focused()
    check("Tell me first lands in the email field", list_links_focus)

    # 4. Validation: empty and malformed emails explain the fix and mark the field
    def validation():
        pg, _ = page_at(b, 1440, 900)
        pg.get_by_role("button", name="Notify me").click()
        expect(pg.locator("#signup-msg")).to_contain_text("Enter your email")
        expect(pg.locator("#email")).to_have_attribute("aria-invalid", "true")
        pg.fill("#email", "kojo@")
        pg.get_by_role("button", name="Notify me").click()
        expect(pg.locator("#signup-msg")).to_contain_text("does not look right")
        pg.fill("#email", "kojo@example.com")
        expect(pg.locator("#email")).not_to_have_attribute("aria-invalid", "true")
    check("form validation messages", validation)

    def submit_with(status=None, offline=False):
        pg, _ = page_at(b, 1440, 900)
        seen = {}

        def handler(route):
            seen["body"] = route.request.post_data
            if offline:
                route.abort()
            else:
                route.fulfill(status=status, body="{}", content_type="application/json")
        pg.route("**/api/subscribe", handler)
        pg.fill("#email", "kojo@example.com")
        pg.get_by_role("button", name="Notify me").click()
        return pg, seen

    # 5. Success: payload is correct, field hides, confirmation shown
    def success():
        pg, seen = submit_with(200)
        expect(pg.locator("#signup-msg")).to_contain_text("You are on the list")
        expect(pg.locator(".field")).to_be_hidden()
        assert '"email":"kojo@example.com"' in seen["body"], seen
        assert '"source":"offscriptgh-home"' in seen["body"], seen
    check("sign-up success state and payload", success)

    # 6. No back end yet (404): honest message, button usable again
    def not_open():
        pg, _ = submit_with(404)
        expect(pg.locator("#signup-msg")).to_contain_text("not open just yet")
        expect(pg.get_by_role("button", name="Notify me")).to_be_enabled()
    check("list not open yet (404) state", not_open)

    # 7. Server error and offline
    def server_error():
        pg, _ = submit_with(500)
        expect(pg.locator("#signup-msg")).to_contain_text("could not save")
    check("server error (500) state", server_error)

    def offline():
        pg, _ = submit_with(offline=True)
        expect(pg.locator("#signup-msg")).to_contain_text("offline")
    check("offline state", offline)

    # 8. Spam trap: a filled hidden field sends nothing
    def honeypot():
        pg, _ = page_at(b, 1440, 900)
        calls = []
        pg.route("**/api/subscribe", lambda r: (calls.append(1), r.fulfill(status=200, body="{}")))
        pg.evaluate("document.getElementById('company').value='bot'")
        pg.fill("#email", "kojo@example.com")
        pg.get_by_role("button", name="Notify me").click()
        pg.wait_for_timeout(400)
        assert not calls, "honeypot submission reached the network"
    check("spam trap blocks bots quietly", honeypot)

    # 9. Phone sticky bar: hidden at load, shows mid-page, hides at the footer
    def sticky():
        pg, _ = page_at(b, 390, 844)
        bar = pg.locator("#stickybar")
        assert "is-visible" not in (bar.get_attribute("class") or "")
        pg.locator("#about").scroll_into_view_if_needed()
        pg.mouse.wheel(0, 900)
        pg.wait_for_timeout(500)
        assert "is-visible" in bar.get_attribute("class"), "bar did not appear mid-page"
        pg.locator(".legal").scroll_into_view_if_needed()
        pg.wait_for_timeout(500)
        assert "is-visible" not in bar.get_attribute("class"), "bar covers the footer"
    check("phone sticky bar timing", sticky)

    # 10. Keyboard: skip link first, then the logo, focus visible
    def keyboard():
        pg, _ = page_at(b, 1440, 900)
        pg.keyboard.press("Tab")
        expect(pg.locator(".skip")).to_be_focused()
        pg.keyboard.press("Tab")
        expect(pg.locator(".brand")).to_be_focused()
        outline = pg.evaluate("getComputedStyle(document.activeElement).outlineStyle")
        assert outline != "none", outline
    check("keyboard order and visible focus", keyboard)

    # 11. Reduced motion stops the ticker
    def reduced():
        pg, _ = page_at(b, 1440, 900, reduced_motion="reduce")
        anim = pg.evaluate("getComputedStyle(document.querySelector('.ticker-track')).animationName")
        assert anim == "none", anim
    check("reduced motion stops the ticker", reduced)

    b.close()

width = max(len(n) for n, _, _ in results)
for name, status, note in results:
    print(f"{status}  {name.ljust(width)}  {note}")
failed = [r for r in results if r[1] == "FAIL"]
print(f"\n{len(results) - len(failed)}/{len(results)} journeys passed")
sys.exit(1 if failed else 0)
