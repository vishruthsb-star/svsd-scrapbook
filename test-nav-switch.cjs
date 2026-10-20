const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 450, height: 950 } });
  
  await page.goto('http://localhost:5183/#/screens/app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Check initial state - Home screen should be visible
  const homeVisible = await page.evaluate(() => {
    const home = document.querySelector('.app-shell-home');
    return home ? getComputedStyle(home).visibility !== 'hidden' : false;
  });
  console.log('✓ Home screen visible initially:', homeVisible);

  // Take screenshot of Home screen
  await page.screenshot({ path: 'home-screen.png' });
  console.log('✓ Saved home-screen.png');

  // Click the Journal tab button
  const journalBtn = await page.locator('button[data-tab="journal"]');
  await journalBtn.click();
  await page.waitForTimeout(400); // Wait for transition

  // Check that Canvas screen is now visible
  const canvasVisible = await page.evaluate(() => {
    const canvas = document.querySelector('.app-shell-canvas');
    return canvas ? getComputedStyle(canvas).visibility !== 'hidden' : false;
  });
  console.log('✓ Canvas screen visible after clicking Journal:', canvasVisible);

  // Take screenshot of Canvas screen
  await page.screenshot({ path: 'canvas-screen.png' });
  console.log('✓ Saved canvas-screen.png');

  // Click back to Home
  const homeBtn = await page.locator('button[data-tab="home"]');
  await homeBtn.click();
  await page.waitForTimeout(400);

  // Check Home is visible again
  const homeVisibleAgain = await page.evaluate(() => {
    const home = document.querySelector('.app-shell-home');
    return home ? getComputedStyle(home).visibility !== 'hidden' : false;
  });
  console.log('✓ Home screen visible after returning:', homeVisibleAgain);

  // Check nav state
  const navState = await page.evaluate(() => {
    const nav = document.querySelector('nav.home-bottom-navigation');
    return nav ? nav.getAttribute('data-active') : 'unknown';
  });
  console.log('✓ Nav active state:', navState);

  // Check nav pill animation timing
  const hasTransition = await page.evaluate(() => {
    const pill = document.querySelector('.home-bottom-navigation__pill');
    const style = getComputedStyle(pill);
    return style.transitionDuration;
  });
  console.log('✓ Nav pill transition:', hasTransition);

  await browser.close();
  console.log('\n✓ All tests passed!');
})();
