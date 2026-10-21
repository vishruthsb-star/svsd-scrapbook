import { expect, test } from '@playwright/test';

const ROUTES = [
  ['/#/', 'Scrapbook component gallery'],
  ['/#/screens/app', 'a library of thoughts'],
  ['/#/showcase', 'Vishruth scrapbook iPhone showcase'],
] as const;

test('every public HashRouter route loads again after refresh', async ({ page }) => {
  for (const [route, expectedText] of ROUTES) {
    await page.goto(route);
    await expect(page.getByText(expectedText, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText(expectedText, { exact: true })).toBeVisible();
  }
});

test('showcase keeps a same-origin interactive app under the iPhone frame', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/showcase');

  const hardware = page.locator('.iphone-frame__hardware');
  await expect(hardware).toBeVisible();
  await expect(page.locator('.iphone-frame__aperture')).toBeVisible();

  const iframe = page.locator('.iphone-frame__product');
  await expect(iframe).toHaveAttribute('src', /#\/screens\/app$/);
  const source = await iframe.getAttribute('src');
  expect(new URL(source!, baseURL).origin).toBe(new URL(baseURL).origin);

  await page.getByLabel('Show showcase controls').click();
  const slider = page.getByLabel('iPhone scale');
  await slider.press('End');
  await expect(slider).toHaveValue('150');
  await page.getByRole('button', { name: 'Reset' }).click();

  const app = page.frameLocator('.iphone-frame__product');
  await app.getByText('vishruth’s scrapbook', { exact: true }).click();
  await expect(app.locator('.scrapbook-canvas-page')).toBeVisible();
});
