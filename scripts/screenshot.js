// Usage: node scripts/screenshot.js <url> [output-path]
// Example: node scripts/screenshot.js http://localhost:3000 screenshot.png

import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:3000';
const output = process.argv[3] ?? 'screenshot.png';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.screenshot({ path: output, fullPage: true });
await browser.close();

console.log(`Screenshot saved → ${output}`);
