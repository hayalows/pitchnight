"""End-to-end journeys for the OffScript homepage (site/index.html).

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
    # The local static server has no API. Model an activated list here while
    # production keeps the form closed until server-side delivery is configured.
    pg.route("**/api/list-status", lambda route: route.fulfill(
        status=200, content_type="application/json", body='{"open":true}'))
    # Resolve the newly separate About page without requiring a reverse proxy.
    pg.route("**/about/", lambda route: route.fulfill(
        status=200, content_type="text/html", path="site/about.html"))
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
        expect(pg.locator(".site-header .nav")).to_be_visible()
        expect(pg.locator(".menu-btn")).to_be_hidden()
        expect(pg.locator('.site-header .nav a[href="/events/pitch-night-001/"]')).to_be_visible()
        expect(pg.get_by_role("heading", level=1)).to_contain_text("Beyond")
        assert not errors, errors
    check("desktop layout, nav and no script errors", desktop_basics)

    # 2. Phone: menu opens, closes with Escape and returns focus, closes on link tap
    def phone_menu():
        pg, _ = page_at(b, 390, 844)
        assert pg.evaluate("document.documentElement.scrollWidth") <= 390
        btn = pg.locator(".menu-btn")
        expect(pg.locator(".site-header .nav")).to_be_hidden()
        btn.click()
        expect(btn).to_have_attribute("aria-expanded", "true")
        expect(pg.locator("#site-menu")).to_be_visible()
        expect(pg.locator("#site-menu").get_by_role("link", name="Connection Board")).to_be_visible()
        expect(pg.locator('#site-menu a[data-nav="home"]')).to_have_attribute("aria-current", "page")
        pg.keyboard.press("Escape")
        expect(btn).to_have_attribute("aria-expanded", "false")
        expect(pg.locator("#site-menu")).to_be_hidden()
        expect(btn).to_be_focused()
        btn.click()
        pg.locator("#site-menu").get_by_role("link", name="About").click()
        assert pg.url.endswith("/about/"), pg.url
    check("phone menu opens, dismisses and navigates to About", phone_menu)

    # 3. Every "list" link lands in the email field
    def list_links_focus():
        # On screen: the hero button wakes the card itself. Off screen: the header button opens the list sheet in place.
        pg, _ = page_at(b, 1440, 900)
        pg.locator(".hero-actions [data-focus-signup]").click()
        pg.wait_for_timeout(300)
        expect(pg.locator("#email")).to_be_focused()
        assert not pg.evaluate("document.getElementById('os-list').open")
        pg.mouse.wheel(0, 2600); pg.wait_for_timeout(600)
        pg.locator(".header-cta").click(); pg.wait_for_timeout(500)
        assert pg.evaluate("document.getElementById('os-list').open"), "list sheet opens where you are"
        expect(pg.locator("#os-list-email")).to_be_focused()
        assert pg.url.endswith("/site/index.html"), "no navigation"
    check("Get on the list works where you are", list_links_focus)

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

    # Consent must be explicit, and no request may be sent until it is granted.
    def consent_required():
        pg, _ = page_at(b, 390, 844)
        called = []
        pg.route("**/api/subscribe", lambda r: (called.append(True), r.fulfill(status=200, body="{}")))
        pg.fill("#email", "sample@example.com")
        pg.get_by_role("button", name="Notify me").click()
        expect(pg.locator("#signup-msg")).to_contain_text("Tick the box")
        assert not called, "submitted without consent"
    check("explicit email consent before submission", consent_required)

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
        pg.locator("#consent").check()
        pg.get_by_role("button", name="Notify me").click()
        return pg, seen

    # 5. Success: payload is correct, field hides, confirmation shown
    def success():
        pg, seen = submit_with(200)
        expect(pg.locator("#signup-msg")).to_contain_text("Check your inbox")
        expect(pg.locator(".field")).to_be_hidden()
        assert '"email":"kojo@example.com"' in seen["body"], seen
        assert '"source":"offscriptgh-home"' in seen["body"], seen
        assert '"consent":true' in seen["body"], seen
    check("sign-up success state and payload", success)

    # 6. Endpoint unavailable (404): honest message, button usable again
    def not_open():
        pg, _ = submit_with(404)
        expect(pg.locator("#signup-msg")).to_contain_text("couldn't save your email")
        expect(pg.get_by_role("button", name="Notify me")).to_be_enabled()
    check("endpoint unavailable (404) state", not_open)

    # 7. Server error and offline
    def server_error():
        pg, _ = submit_with(500)
        expect(pg.locator("#signup-msg")).to_contain_text("couldn't save your email")
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
    def footer_and_board():
        pg, _ = page_at(b, 390, 844, is_mobile=True, has_touch=True)
        assert pg.locator("#stickybar").count() == 0, "no nagging bottom bar"
        assert pg.locator(".osf .osf-links a").count() == 4
        assert pg.locator('.osf a[href*="pitch-night-001"]').count() == 0, "footer has no Pitch Night column"
        assert pg.locator(".osf-g").count() == 9, "footer logo is nine letters"
        pg.route("https://docs.google.com/**", lambda r: r.fulfill(status=200, content_type="text/html", body="<p>form</p>"))
        pg.locator("#connect [data-os-board]").scroll_into_view_if_needed(); pg.wait_for_timeout(300)
        pg.locator("#connect [data-os-board]").tap(); pg.wait_for_timeout(800)
        assert pg.evaluate("document.getElementById('os-board').open"), "board opens in place"
        assert pg.url.endswith("/site/index.html")
    check("footer is lean and the Connection Board opens in place", footer_and_board)

    def keyboard():
        pg, _ = page_at(b, 1440, 900)
        pg.keyboard.press("Tab")
        expect(pg.locator(".skip")).to_be_focused()
        pg.keyboard.press("Tab")
        expect(pg.locator(".site-header .brand")).to_be_focused()
        outline = pg.evaluate("getComputedStyle(document.activeElement).outlineStyle")
        assert outline != "none", outline
    check("keyboard order and visible focus", keyboard)

    # 11. Reduced motion stops the ticker
    def reduced():
        pg, _ = page_at(b, 1440, 900, reduced_motion="reduce")
        anim = pg.evaluate("getComputedStyle(document.querySelector('.ticker-track')).animationName")
        assert anim == "none", anim
    check("reduced motion stops the ticker", reduced)

    # 12. Story: the stage follows the step being read on desktop; phones show each prop inline
    def story():
        pg, _ = page_at(b, 1366, 768)
        pg.locator('[data-story-step="2"]').scroll_into_view_if_needed()
        pg.evaluate("document.querySelector('[data-story-step=\\'2\\']').scrollIntoView({block:'center'})")
        pg.wait_for_timeout(700)
        expect(pg.locator('[data-story-prop="2"]')).to_have_class("story-prop is-active")
        expect(pg.locator("[data-story-count]")).to_have_text("03")
        ph, _ = page_at(b, 390, 844)
        expect(ph.locator(".story-stage")).to_be_hidden()
        expect(ph.locator('[data-story-step="0"] .step-prop')).to_be_visible()
    check("story stage follows the steps; phones show props inline", story)

    # 13. Motion control pauses the looping text and the prop wall, and remembers it
    def motion_toggle():
        pg, _ = page_at(b, 1366, 768)
        pg.locator(".ticker [data-motion-toggle]").click()
        assert pg.evaluate("getComputedStyle(document.querySelector('.ticker-track')).animationPlayState") == "paused"
        assert pg.evaluate("getComputedStyle(document.querySelector('.propwall-track')).animationPlayState") == "paused"
        expect(pg.locator(".ticker [data-motion-toggle]")).to_have_attribute("aria-pressed", "true")
        pg.reload(); pg.wait_for_load_state("networkidle")
        expect(pg.locator(".ticker [data-motion-toggle]")).to_have_attribute("aria-pressed", "true")
    check("pause control stops looping motion and is remembered", motion_toggle)

    # 14. Props: each wall prop opens the Studio on that prop; the loop copy is hidden; no duplicate ids
    def props():
        pg, _ = page_at(b, 1366, 768)
        hrefs = pg.eval_on_selector_all(".propwall-track li:not([aria-hidden]) a", "a=>a.map(x=>x.getAttribute('href'))")
        assert len(hrefs) == 10 and hrefs[0].endswith("props.html?prop=1"), hrefs
        hidden = pg.eval_on_selector_all(".propwall-track li[aria-hidden=true] a", "a=>a.every(x=>x.tabIndex===-1)")
        assert hidden, "loop copy is focusable"
        dupes = pg.evaluate("(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.filter((x,i)=>ids.indexOf(x)!==i)})()")
        assert not dupes, dupes
        pg.wait_for_timeout(2400)  # let the hero props finish their entrance pop
        assert pg.evaluate("document.querySelector('.hero-prop--arch svg').getBoundingClientRect().width") > 150
    check("prop wall links, hidden loop copy and unique ids", props)

    # 15. Fold: on common laptops the whole hero (headline, actions, email field) fits on the first screen
    def fold():
        for w, h in [(1536, 730), (1366, 768), (1280, 650), (1440, 900)]:
            pg, _ = page_at(b, w, h)
            pg.wait_for_timeout(1800)
            box = pg.evaluate("""(()=>{const b=s=>document.querySelector(s).getBoundingClientRect().bottom;
              return {actions:b('.hero-actions'),field:b('#signup .field'),card:b('.next-card'),tickerTop:document.querySelector('.ticker').getBoundingClientRect().top}})()""")
            assert box["actions"] <= h and box["field"] <= h and box["card"] <= h, (w, h, box)
            assert box["tickerTop"] < h, ("ticker should peek above the fold", w, h, box)
            pg.close()
    check("laptop hero fits the first screen and the ticker peeks", fold)

    # 16. Round 3: stickers move, nothing duplicated, calm navigation
    def round3():
        pg, _ = page_at(b, 1536, 730)
        pg.wait_for_timeout(2600)
        box = pg.locator(".hero-prop--arch").bounding_box()
        x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        pg.mouse.move(x, y); pg.mouse.down()
        for i in range(10): pg.mouse.move(x - 25 * i, y - 15 * i)
        pg.mouse.up(); pg.wait_for_timeout(2400)
        after = pg.locator(".hero-prop--arch").bounding_box()
        assert abs(after["x"] - box["x"]) < 6 and abs(after["y"] - box["y"]) < 12, ("sticker springs home, no gap left", box, after)
        assert pg.url.endswith("/site/index.html"), "dragging a sticker must not navigate"
        assert not pg.evaluate("document.querySelector('.hero-title').textContent.includes('usual.')"), "no full stop after usual"
        assert pg.locator(".hero-actions [data-focus-signup]").is_visible(), "laptop hero has a Get on the list button"
        assert pg.locator(".about .tag").count() == 0 and pg.locator(".aside-note").count() == 0
        assert not pg.evaluate("[...document.querySelectorAll('main .label')].some(l => /^\\s*0\\d+ \\//.test(l.textContent))"), "no numbered section labels"
        pg.evaluate("scrollTo(0, 2400)"); pg.wait_for_timeout(300); pg.evaluate("scrollTo(0, 3200)"); pg.wait_for_timeout(400)
        assert pg.evaluate("document.querySelector('.site-header').getBoundingClientRect().top") == 0, "header never hides"
        ph, _ = page_at(b, 390, 664, is_mobile=True, has_touch=True)
        ph.wait_for_timeout(2400)
        assert ph.locator(".header-cta").is_hidden(), "phone header keeps only Menu"
        a = ph.locator(".hero-prop--bubble").bounding_box(); c = ph.locator(".next-card").bounding_box()
        assert a["y"] < c["y"] and a["y"] + a["height"] <= c["y"] + 90, ("stickers tuck onto the card edge on phones", a, c)
        ph.tap(".hero-prop--bubble"); ph.wait_for_timeout(120)
        a2 = ph.locator(".hero-prop--bubble").bounding_box()
        assert abs(a2["x"] - a["x"]) + abs(a2["y"] - a["y"]) > 10, "a tap tosses the sticker"
        ph.wait_for_timeout(2200)
        a3 = ph.locator(".hero-prop--bubble").bounding_box()
        assert abs(a3["x"] - a["x"]) + abs(a3["y"] - a["y"]) < 14, "and it lands back home"
        ph.locator(".menu-btn").tap(); ph.wait_for_timeout(500)
        assert ph.evaluate("document.activeElement.id") == "site-menu", "menu opens without a focus ring on the logo"
        ph.locator(".menu-close").tap(); ph.wait_for_timeout(400)
    check("stickers spring home, no duplicates, header stays put", round3)

    # 19. Selecting signup from the mobile menu must close the modal before focusing the inline form.
    def mobile_menu_inline_signup():
        ph, _ = page_at(b, 390, 844, is_mobile=True, has_touch=True)
        ph.locator(".menu-btn").tap()
        ph.wait_for_timeout(180)
        # Modal focus can scroll the background to the top; exercise the inline-card case with the menu open.
        ph.locator(".next-card").evaluate("(el) => el.scrollIntoView({block:'center',behavior:'instant'})")
        ph.wait_for_timeout(200)
        assert ph.evaluate("(() => {const r=document.getElementById('list').getBoundingClientRect();return r.top>=40&&r.bottom<=innerHeight+4})()"), "signup card must be visible for the inline shortcut"
        ph.locator(".menu-sheet-foot [data-os-list]").tap()
        ph.wait_for_timeout(180)
        assert ph.evaluate("!document.getElementById('site-menu').open"), "menu was left open over signup form"
        assert ph.evaluate("document.activeElement.id === 'email'"), "email field should have focus"
        ph.close()
    check("mobile menu closes before focusing an already-visible signup form", mobile_menu_inline_signup)
    # Navigate from the footer, then restore Back without a long animated scroll.
    def footer_navigation_restoration():
        ph, _ = page_at(b, 390, 844, is_mobile=True, has_touch=True)
        ph.evaluate("window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})")
        ph.wait_for_timeout(150)
        ph.locator('footer a[href="/events/"]').first.click()
        ph.wait_for_url("**/events/")
        assert ph.evaluate("scrollY < 10"), "fresh page did not start at top"
        ph.go_back(wait_until="domcontentloaded")
        ph.wait_for_timeout(650)
        assert ph.evaluate("scrollY >= document.documentElement.scrollHeight-innerHeight-150"), "Back did not restore footer"
        ph.close()
    check("fresh navigation begins at top and browser Back restores footer", footer_navigation_restoration)

    def modal_background_and_reopen():
        ph, _ = page_at(b, 390, 844, is_mobile=True, has_touch=True)
        ph.evaluate("window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})")
        ph.wait_for_timeout(180)
        ph.locator("footer [data-os-list]").first.tap()
        assert ph.locator("#os-list").evaluate("(d)=>d.open")
        before = ph.evaluate("scrollY")
        ph.mouse.wheel(0,-500)
        ph.wait_for_timeout(150)
        assert abs(ph.evaluate("scrollY") - before) < 2, "background scroll not locked"
        ph.locator("#os-list [data-os-close]").first.tap()
        ph.wait_for_timeout(75)
        ph.locator("footer [data-os-list]").first.evaluate("(a)=>a.click()")
        ph.wait_for_timeout(350)
        assert ph.locator("#os-list").evaluate("(d)=>d.open"), "stale close timer dismissed sheet"
        ph.keyboard.press("Escape")
        ph.wait_for_timeout(350)
        assert not ph.locator("#os-list").evaluate("(d)=>d.open")
        ph.close()
    check("modal prevents background scroll and cancels rapid close race", modal_background_and_reopen)


    b.close()

width = max(len(n) for n, _, _ in results)
for name, status, note in results:
    print(f"{status}  {name.ljust(width)}  {note}")
failed = [r for r in results if r[1] == "FAIL"]
print(f"\n{len(results) - len(failed)}/{len(results)} journeys passed")
sys.exit(1 if failed else 0)
