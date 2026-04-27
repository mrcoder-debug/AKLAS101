// End-to-end automation + screenshot runner for the AKLAS LMS app.
// Usage:  node scripts/test-app.js
// Starts the dev server automatically if not already running.
// Screenshots are saved to  screenshots/<index>_<label>.png

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { startServer, stopServer, BASE_URL } from './serve.js';

const SCREENSHOTS_DIR = path.resolve('screenshots');
let shotIndex = 0;

async function shot(page, label) {
  const filename = `${String(++shotIndex).padStart(2, '0')}_${label}.png`;
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, filename), fullPage: true });
  console.log(`  📸 ${filename}`);
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('button[type="submit"]').click();
  // /dashboard dispatches to /admin | /instructor | /student via role redirect
  await page.waitForURL(/\/(admin|instructor|student)/, { timeout: 20_000 });
  await page.waitForLoadState('networkidle');
}

async function logout(page) {
  // If the dashboard header is available use the user-menu dropdown.
  // Fallback: navigate to /login directly (handles error-page states).
  const trigger = page.locator('header').getByRole('button').last();
  const visible = await trigger.isVisible({ timeout: 3_000 }).catch(() => false);
  if (visible) {
    await trigger.click();
    // Wait for the Radix DropdownMenuContent portal to appear in the DOM.
    await page.waitForSelector('[role="menu"]', { timeout: 5_000 });
    // Match by role+name or fall back to text content.
    const signOut = page.locator('[role="menuitem"]:has-text("Sign out"), button:has-text("Sign out")').first();
    await signOut.click();
  } else {
    await page.goto(`${BASE_URL}/api/auth/signout`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.goto(`${BASE_URL}/login`);
  }
  await page.waitForURL(/\/login/, { timeout: 10_000 });
  await page.waitForLoadState('networkidle');
}

async function navigate(page, route, label) {
  await page.goto(`${BASE_URL}${route}`);
  await page.waitForLoadState('networkidle');
  await shot(page, label);
}

async function run() {
  const weStarted = await startServer();
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  try {
    // ── Public pages ──────────────────────────────────────────────
    console.log('\n── Public pages');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await shot(page, 'home');

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await shot(page, 'login');

    // ── Admin flow ────────────────────────────────────────────────
    console.log('\n── Admin flow  (admin@aklas.test)');
    await login(page, 'admin@aklas.test', 'Admin123!');
    await shot(page, 'admin_dashboard');

    await navigate(page, '/admin/users', 'admin_users');
    await navigate(page, '/admin/courses', 'admin_courses');
    await navigate(page, '/admin/invitations', 'admin_invitations');
    await navigate(page, '/admin/audit', 'admin_audit');

    await logout(page);
    await shot(page, 'post_admin_logout');

    // ── Instructor flow ───────────────────────────────────────────
    console.log('\n── Instructor flow  (mara@aklas.test)');
    await login(page, 'mara@aklas.test', 'Instructor123!');
    await shot(page, 'instructor_dashboard');

    await navigate(page, '/instructor/courses/new', 'instructor_new_course');

    await logout(page);
    await shot(page, 'post_instructor_logout');

    // ── Student flow ──────────────────────────────────────────────
    console.log('\n── Student flow  (sam@aklas.test)');
    await login(page, 'sam@aklas.test', 'Student123!');
    await shot(page, 'student_dashboard');

    await logout(page);
    await shot(page, 'post_student_logout');

  } finally {
    await browser.close();
    if (weStarted) await stopServer();
  }

  console.log(`\n✅ Done — ${shotIndex} screenshots saved to screenshots/\n`);
}

run().catch(err => { console.error(err); process.exit(1); });
