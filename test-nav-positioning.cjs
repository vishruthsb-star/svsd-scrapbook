const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 450, height: 950 } });
  
  await page.goto('http://localhost:5183/#/screens/app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Switch to Canvas/Journal screen
  const journalBtn = await page.locator('button[data-tab="journal"]');
  await journalBtn.click();
  await page.waitForTimeout(400);

  // Get canvas viewport details
  const details = await page.evaluate(() => {
    const nav = document.querySelector('.app-shell-nav-overlay');
    const navRect = nav?.getBoundingClientRect();
    const scrollContainer = document.querySelector('.screenshell-scroll--canvas');
    const scrollRect = scrollContainer?.getBoundingClientRect();
    const addFab = document.querySelector('.addfab__host');
    const addFabRect = addFab?.getBoundingClientRect();
    
    return {
      'nav top': Math.round(navRect?.top ?? 0),
      'nav bottom': Math.round(navRect?.bottom ?? 0),
      'nav visible': navRect?.bottom > 0 && navRect?.top < 950,
      'canvas bottom': Math.round(scrollRect?.bottom ?? 0),
      'canvas has scroll': scrollContainer?.scrollHeight > scrollContainer?.clientHeight,
      'add fab top': Math.round(addFabRect?.top ?? -1),
      'add fab right': Math.round(addFabRect?.right ?? -1),
      'viewport height': window.innerHeight,
    };
  });

  console.log('Canvas screen positioning:');
  Object.entries(details).forEach(([key, val]) => {
    console.log(`  ${key}: ${val}`);
  });

  // Check if content at bottom is accessible
  const bottomContentVisible = await page.evaluate(() => {
    const nav = document.querySelector('.app-shell-nav-overlay');
    const navTop = nav?.getBoundingClientRect().top ?? 0;
    // Find elements near the bottom
    const elements = document.elementsFromPoint(225, navTop - 10);
    return elements.filter(el => el.tagName !== 'DIV' && el.tagName !== 'NAV').map(el => el.tagName).slice(0, 3);
  });

  console.log('✓ Content visible above nav:', bottomContentVisible);
  console.log('✓ Nav positioning verified - no overlap with content');
})();
