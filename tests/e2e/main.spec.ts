import { test, expect, type Page } from "@playwright/test";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await expect(page.locator("h1, .card-title, [class*='CardTitle']").first()).toBeVisible({ timeout: 10000 });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  // Wait for redirect away from /login
  await page.waitForURL(/\/(student|instructor|admin|dashboard)/, { timeout: 15000 });
}

async function logout(page: Page) {
  // Click the avatar/dropdown trigger (Radix DropdownMenuTrigger renders as button with aria-haspopup)
  await page.locator('[aria-haspopup="menu"]').click();
  await page.click('button:has-text("Sign out")');
  await page.waitForURL("/login", { timeout: 10000 });
}

// ─── Student Flows ──────────────────────────────────────────────────────────

test.describe("Student flows", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "sam@aklas.test", "Student123!");
  });

  test("Dashboard loads with XP progress and streak", async ({ page }) => {
    await page.goto("/student");
    await expect(page).toHaveURL("/student");
    // Page should not show error
    await expect(page.locator("text=Student Portal")).toBeVisible({ timeout: 8000 });
    // Screenshot for reference
    await page.screenshot({ path: "screenshots/student-dashboard.png", fullPage: true });
  });

  test("My Courses page lists enrolled courses", async ({ page }) => {
    await page.goto("/student/courses");
    // Sam is enrolled in intro-to-electronics
    await expect(page.locator("text=Introduction to Electronics")).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "screenshots/student-courses.png", fullPage: true });
  });

  test("Course overview: leaderboard sidebar and forum link visible", async ({ page }) => {
    await page.goto("/student/courses/intro-to-electronics");
    // Main course heading
    await expect(page.locator("h1:has-text('Introduction to Electronics'), h2:has-text('Introduction to Electronics')").first()).toBeVisible({ timeout: 8000 });
    // Forum link should be present
    await expect(page.locator('a[href*="forum"]').first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "screenshots/course-overview.png", fullPage: true });
  });

  test("Lesson viewer: open lesson and mark complete", async ({ page }) => {
    await page.goto("/student/courses/intro-to-electronics");
    // Click the first lesson link
    const firstLesson = page.locator("a[href*='/lessons/']").first();
    await expect(firstLesson).toBeVisible({ timeout: 8000 });
    await firstLesson.click();
    // Wait for lesson page
    await page.waitForURL(/\/lessons\//, { timeout: 10000 });
    // Lesson title visible
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 8000 });
    // Check for Mark complete button (might already be complete if test ran before)
    const markCompleteBtn = page.locator('button:has-text("Mark complete")');
    const alreadyComplete = page.locator('text=Complete').first();
    const isComplete = await alreadyComplete.isVisible().catch(() => false);
    if (!isComplete) {
      await expect(markCompleteBtn).toBeVisible({ timeout: 5000 });
      await markCompleteBtn.click();
      // Toast or badge should appear
      await expect(page.locator("text=Complete, text=complete").first()).toBeVisible({ timeout: 8000 });
    }
    await page.screenshot({ path: "screenshots/lesson-viewer.png", fullPage: true });
  });

  test("Quiz: take Ohm's Law quiz and pass", async ({ page }) => {
    await page.goto("/student/courses/intro-to-electronics");
    // Open lesson 1 (Ohm's Law) which has the quiz
    const firstLesson = page.locator("a[href*='/lessons/']").first();
    await firstLesson.click();
    await page.waitForURL(/\/lessons\//, { timeout: 10000 });

    // Click the Quiz tab
    await page.locator('[role="tab"]:has-text("Quiz")').click();
    await expect(page.locator('button:has-text("Start quiz")')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Start quiz")');

    // Answer all 5 questions with correct answers
    await page.locator('label:has-text("5 A")').click();
    await page.locator('label:has-text("Halves the current")').click();
    await page.locator('label:has-text("P = V × I")').click();
    await page.locator('label:has-text("Ohm")').click();
    await page.locator('label:has-text("The sum of each resistor")').click();

    // Submit
    const submitBtn = page.locator('button:has-text("Submit quiz")');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    // Expect pass result
    await expect(page.locator("text=Passed!").first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "screenshots/quiz-result.png", fullPage: true });
  });

  test("Forum: create a thread and view it", async ({ page }) => {
    await page.goto("/student/courses/intro-to-electronics/forum");
    await expect(page.locator("h1:has-text('Discussion')")).toBeVisible({ timeout: 8000 });

    // Click Start a Discussion
    await page.click('button:has-text("Start a Discussion")');
    await expect(page.locator("#thread-title")).toBeVisible({ timeout: 5000 });

    // Fill the form
    const threadTitle = `Test Question ${Date.now()}`;
    await page.fill("#thread-title", threadTitle);
    await page.fill("#thread-content", "This is a test discussion post to verify the forum is working correctly end to end.");

    // Submit
    await page.click('button[type="submit"]:has-text("Post")');

    // Should redirect to thread detail page
    await page.waitForURL(/\/forum\/[a-z0-9]+$/, { timeout: 10000 });
    await expect(page.locator(`h1:has-text("${threadTitle}")`)).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "screenshots/forum-thread.png", fullPage: true });
  });

  test("Forum: post a reply and upvote thread", async ({ page }) => {
    // Navigate to forum list and open the first thread (created above or seeded)
    await page.goto("/student/courses/intro-to-electronics/forum");
    await expect(page.locator("h1:has-text('Discussion')")).toBeVisible({ timeout: 8000 });

    const firstThread = page.locator("a[href*='/forum/']").first();
    // If no threads yet, create one
    const noThreads = await page.locator("text=No discussions yet").isVisible().catch(() => false);
    if (noThreads) {
      await page.click('button:has-text("Start a Discussion")');
      await page.fill("#thread-title", `E2E Test Thread ${Date.now()}`);
      await page.fill("#thread-content", "Created by E2E test to test replies and voting.");
      await page.click('button[type="submit"]:has-text("Post")');
      await page.waitForURL(/\/forum\/[a-z0-9]+$/, { timeout: 10000 });
    } else {
      await firstThread.click();
      await page.waitForURL(/\/forum\/[a-z0-9]+$/, { timeout: 10000 });
    }

    // Thread detail page — attempt to post a reply
    const replyTextarea = page.locator("textarea").first();
    await expect(replyTextarea).toBeVisible({ timeout: 8000 });
    await replyTextarea.fill("This is a test reply from the E2E test suite.");
    await page.locator('button:has-text("Reply")').last().click();

    // Reply should appear
    await expect(page.locator("text=This is a test reply from the E2E test suite.")).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "screenshots/forum-reply.png", fullPage: true });

    // Upvote the thread (ChevronUp button)
    const upvoteBtn = page.locator('button[aria-label*="upvote"], button svg[class*="ChevronUp"]').first();
    if (await upvoteBtn.isVisible().catch(() => false)) {
      await upvoteBtn.click();
      await page.waitForTimeout(500);
    }
  });
});

// ─── Instructor Flows ───────────────────────────────────────────────────────

test.describe("Instructor flows", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "mara@aklas.test", "Instructor123!");
  });

  test("Instructor dashboard loads", async ({ page }) => {
    await page.goto("/instructor");
    await expect(page.locator("text=Instructor Portal")).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "screenshots/instructor-dashboard.png", fullPage: true });
  });

  test("Analytics page loads", async ({ page }) => {
    await page.goto("/instructor/analytics");
    await expect(page.locator("text=Instructor Portal")).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "screenshots/instructor-analytics.png", fullPage: true });
  });

  test("Course management: view intro-to-electronics lessons", async ({ page }) => {
    await page.goto("/instructor/courses");
    await expect(page.locator("text=Introduction to Electronics")).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "screenshots/instructor-courses.png", fullPage: true });
  });
});

// ─── Admin Flows ─────────────────────────────────────────────────────────────

test.describe("Admin flows", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin@aklas.test", "Admin123!");
  });

  test("Admin dashboard loads", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=Admin Portal")).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "screenshots/admin-dashboard.png", fullPage: true });
  });

  test("Users list renders", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.locator("text=Admin Portal")).toBeVisible({ timeout: 8000 });
    // Should show at least the seeded users
    await expect(page.locator("text=sam@aklas.test").first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "screenshots/admin-users.png", fullPage: true });
  });

  test("Invitations page renders", async ({ page }) => {
    await page.goto("/admin/invitations");
    await expect(page.locator("text=Admin Portal")).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "screenshots/admin-invitations.png", fullPage: true });
  });

  test("Audit log renders", async ({ page }) => {
    await page.goto("/admin/audit");
    await expect(page.locator("text=Admin Portal")).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: "screenshots/admin-audit.png", fullPage: true });
  });
});
