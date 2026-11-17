"""Browser journeys for the connected OffScript family: main pages and event pages served
through the Cloudflare Worker.

Run from the repository root:
    node site/build.mjs
    node tools/local-worker.mjs 8787 &      # Worker with the event archive served from this checkout
    CHROME=/usr/bin/google-chrome python3 tests/offscript_family_e2e.py
Third-party requests (Google Forms and similar) are blocked so results do not depend on the network.
"""
import os
import sys

from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("BASE", "http://localhost:8787")
CHROME = os.environ.get("CHROME")
EVENT = "/events/pitch-night-001/"
results = []


def check(name, fn):
    try:
        fn()
        results.append((name, "PASS", ""))
    except Exception as e:
        results.append((name, "FAIL", str(e).splitlines()[0][:180]))


def open_page(browser, path, w=1366, h=768):
    pg = browser.new_page(viewport={"width": w, "height": h})
    seen, errors = [], []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("request", lambda r: seen.append(r.url))
    pg.add_init_script("try{localStorage.setItem('offscript-pitch-night-001-thanks-seen','yes')}catch(e){}")
    pg.route("**/*", lambda r: r.continue_() if r.request.url.startswith(BASE) else r.abort())
    pg.goto(BASE + path, wait_until="load")
    pg.wait_for_timeout(400)
    return pg, seen, errors


with sync_playwright() as p:
    args = {"args": ["--no-sandbox"]}
    if CHROME:
        args["executable_path"] = CHROME
    b = p.chromium.launch(**args)

    def family_bar():
        for path, here in [(EVENT, "Pitch Night 001"), (EVENT + "props.html", "Prop Studio"), (EVENT + "venue-explore.html", "The venue")]:
            pg, _, errors = open_page(b, path)
            # One navigation layer: no second bar on top, just a breadcrumb that links home.
            assert pg.locator(".osx-bar").count() == 0, path
            bar = pg.locator(".osx-crumbs")
            expect(bar).to_be_visible()
            expect(bar.locator('[aria-current="page"]')).to_have_text(here)
            expect(bar.locator('a[href="/"]').first).to_be_visible()
            expect(pg.locator(".osx-foot")).to_have_count(1)
            assert pg.locator("footer").count() == 1, (path, "one footer only")
            assert not errors, (path, errors)
    check("every event page has one breadcrumb home and one footer", family_bar)

    def logo_goes_home():
        for path, sel in [(EVENT, ".site-header .brand"), (EVENT, '.osx-foot-brand a[aria-label="OffScript home"]'), (EVENT + "props.html", ".prop-brand"), (EVENT + "venue-explore.html", ".head-logo")]:
            pg, _, _ = open_page(b, path)
            assert pg.get_attribute(sel, "href") == "/", (path, sel, pg.get_attribute(sel, "href"))
    check("the OffScript logo on event pages leads to the main site", logo_goes_home)

    def back_links_stay():
        pg, _, _ = open_page(b, EVENT + "props.html")
        assert pg.get_attribute(".prop-back", "href") == EVENT, pg.get_attribute(".prop-back", "href")
        pg.locator(".prop-back").click()
        pg.wait_for_load_state("load")
        assert pg.url == BASE + EVENT, pg.url
    check("'Back to the event' returns to the event, not the parent site", back_links_stay)

    def favicon_everywhere():
        for path in ["/", "/about/", "/events/", EVENT, EVENT + "props.html", EVENT + "venue-explore.html"]:
            pg, _, _ = open_page(b, path)
            icons = pg.eval_on_selector_all('link[rel="icon"]', "l=>l.map(x=>x.getAttribute('href'))")
            assert icons == ["/favicon.svg"], (path, icons)
        pg, _, _ = open_page(b, "/favicon.svg")
        assert "#e8382b" in pg.content(), "favicon is not the red mark"
    check("one red favicon on every page", favicon_everywhere)

    def no_google_fonts():
        pg, seen, _ = open_page(b, EVENT)
        assert not [u for u in seen if "fonts.g" in u], [u for u in seen if "fonts.g" in u]
        fam = pg.evaluate("getComputedStyle(document.querySelector('#main h1, h1')).fontFamily")
        assert "Anton" in fam, fam
        assert pg.evaluate("document.fonts.check('40px Anton')")
    check("event fonts are self-hosted (no Google Fonts request)", no_google_fonts)

    def frame_alignment():
        for w in (1366, 1920, 2560):
            pg, _, _ = open_page(b, EVENT, w, 1200)
            xs = pg.evaluate("""[
              document.querySelector('.osx-crumbs a').getBoundingClientRect().left,
              document.querySelector('.site-header .brand').getBoundingClientRect().left,
              document.querySelector('.paper-intro .post-kicker').getBoundingClientRect().left,
              document.querySelector('#about .section-kicker, #about [class*=kicker], #about span').getBoundingClientRect().left]""")
            assert max(xs) - min(xs) <= 8, (w, xs)
            assert pg.evaluate("document.documentElement.scrollWidth") <= w
    check("breadcrumb, header and thank-you note share one frame at 1366/1920/2560", frame_alignment)

    def main_matches_event_frame():
        for w in (1366, 2560):
            main, _, _ = open_page(b, "/", w, 1000)
            ev, _, _ = open_page(b, EVENT, w, 1000)
            a = main.evaluate("document.querySelector('.site-header .brand').getBoundingClientRect().left")
            c = ev.evaluate("document.querySelector('.site-header .brand').getBoundingClientRect().left")
            assert abs(a - c) <= 8, (w, a, c)
    check("main site and event pages align to the same frame", main_matches_event_frame)

    def phone_pages():
        for path in ["/", "/about/", "/events/", "/join/", "/privacy/", EVENT, EVENT + "props.html"]:
            pg, _, errors = open_page(b, path, 390, 844)
            assert pg.evaluate("document.documentElement.scrollWidth") <= 390, path
            assert not errors, (path, errors)
    check("no sideways scroll or script errors on phones", phone_pages)

    def nav_current():
        for path, key in [("/about/", "about"), ("/events/", "events"), ("/join/", "join")]:
            pg, _, _ = open_page(b, path)
            expect(pg.locator(f'.site-header .nav a[data-nav="{key}"]')).to_have_attribute("aria-current", "page")
    check("the header marks the current page", nav_current)

    def list_from_subpage():
        pg, _, _ = open_page(b, "/about/")
        pg.locator(".site-header .header-cta").click()
        pg.wait_for_url(BASE + "/#list")
        pg.wait_for_timeout(800)
        expect(pg.locator("#list")).to_be_in_viewport()
    check("'Get on the list' from another page lands on the sign-up card", list_from_subpage)

    b.close()

width = max(len(n) for n, _, _ in results)
for name, status, note in results:
    print(f"{status}  {name.ljust(width)}  {note}")
failed = [r for r in results if r[1] == "FAIL"]
print(f"\n{len(results) - len(failed)}/{len(results)} journeys passed")
sys.exit(1 if failed else 0)
