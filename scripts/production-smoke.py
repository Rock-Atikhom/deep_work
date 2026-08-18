from playwright.sync_api import Page, sync_playwright


def run_smoke(page: Page) -> None:
    console_errors: list[str] = []
    page.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )

    page.goto("http://127.0.0.1:4174/", wait_until="networkidle")

    assert page.title() == "Deep Work Companion"
    assert page.get_by_role("heading", name="Make room for focused learning").is_visible()
    assert page.get_by_text("No camera analysis is used in this session.").is_visible()

    page.get_by_label("Subject").fill("Biology")
    page.get_by_label("Session goal").fill("Review cell respiration notes")
    page.get_by_role("radio", name="25 minutes").check()
    page.get_by_role("button", name="Start session").click()

    assert page.get_by_role("heading", name="Focus Stage").is_visible()
    assert page.get_by_text("Timer-Only Session").is_visible()
    assert page.get_by_text("Review cell respiration notes").is_visible()
    page.wait_for_timeout(100)
    page.reload(wait_until="networkidle")
    page.get_by_role("heading", name="Focus Stage").wait_for(state="visible")
    assert page.get_by_text("Review cell respiration notes").is_visible()

    page.get_by_role("button", name="Pause session").click()
    assert page.get_by_role("heading", name="Focus Stage").is_visible()
    assert page.get_by_text("Session paused").is_visible()
    page.get_by_role("button", name="Resume session").click()
    page.get_by_role("button", name="End session").click()

    assert page.get_by_role("heading", name="Reflect on this session").is_visible()
    page.get_by_role("button", name="Yes").click()
    assert page.get_by_role("heading", name="Session complete").is_visible()
    assert not console_errors, f"Unexpected browser console errors: {console_errors}"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    try:
        run_smoke(browser.new_page())
    finally:
        browser.close()
