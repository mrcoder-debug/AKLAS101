import { test, expect, type Page } from "@playwright/test";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.waitForSelector("#email", { timeout: 10000 });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(student|instructor|admin|dashboard)/, { timeout: 15000 });
}

test("Phase 7: Student certificates page", async ({ page }) => {
  await login(page, "sam@aklas.test", "Student123!");
  await page.goto("/student/certificates");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "screenshots/p7-student-certificates.png", fullPage: true });
});

test("Phase 7: Complete course to earn certificate", async ({ page }) => {
  await login(page, "sam@aklas.test", "Student123!");

  // Go through all lessons to trigger certificate
  await page.goto("/student/courses/intro-to-electronics");
  await page.waitForLoadState("networkidle");

  const lessonLinks = page.locator("a[href*='/lessons/']");
  const count = await lessonLinks.count();

  for (let i = 0; i < count; i++) {
    // Re-fetch after each navigation
    await page.goto("/student/courses/intro-to-electronics");
    await page.waitForLoadState("networkidle");

    const links = page.locator("a[href*='/lessons/']");
    const href = await links.nth(i).getAttribute("href");
    if (!href) continue;

    await page.goto(href);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);

    const markBtn = page.locator('button:has-text("Mark complete")');
    if (await markBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await markBtn.click();
      await page.waitForTimeout(1500);
    }
  }

  // Now screenshot the certificates page
  await page.goto("/student/certificates");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/p7-certificates-earned.png", fullPage: true });
});

test("Phase 7: Public certificate page", async ({ page }) => {
  await login(page, "sam@aklas.test", "Student123!");
  await page.goto("/student/certificates");
  await page.waitForLoadState("networkidle");

  // Find the "View Certificate" link
  const viewLink = page.locator('a[href*="/certificates/"]').first();
  const isVisible = await viewLink.isVisible({ timeout: 3000 }).catch(() => false);

  if (isVisible) {
    const href = await viewLink.getAttribute("href");
    if (href) {
      // Open in same page (not new tab)
      await page.goto(href);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "screenshots/p7-certificate-public.png", fullPage: true });
    }
  } else {
    // No cert yet — still screenshot the empty state
    await page.screenshot({ path: "screenshots/p7-certificate-public-na.png", fullPage: true });
  }
});

test("Phase 7: Admin enrollments page", async ({ page }) => {
  await login(page, "admin@aklas.test", "Admin123!");
  await page.goto("/admin/enrollments");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/p7-admin-enrollments.png", fullPage: true });
});

test("Phase 7: Profile with gamification stats", async ({ page }) => {
  await login(page, "sam@aklas.test", "Student123!");
  await page.goto("/profile");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200); // wait for XP ring animation
  await page.screenshot({ path: "screenshots/p7-profile-gamification.png", fullPage: true });
});

test("Phase 7: Profile gamification widget closeup", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page, "sam@aklas.test", "Student123!");
  await page.goto("/profile");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  // Scroll the "Your Progress" section into view
  const widget = page.locator("text=Your Progress").first();
  await widget.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500); // let XP ring animate
  await page.screenshot({ path: "screenshots/p7-gamification-widget.png" });
});
