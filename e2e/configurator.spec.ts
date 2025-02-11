import { test, expect } from '@playwright/test';

test.describe('Foodcube Configurator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('initial state shows empty grid', async ({ page }) => {
    await expect(page.getByText('Cladding Configurator')).toBeVisible();
    await expect(page.getByText('Tap grid to place Foodcube')).toBeVisible();
  });

  test('can place cube and add cladding', async ({ page }) => {
    // Click center cell to place cube
    const grid = page.locator('.grid');
    const cells = grid.locator('.aspect-square');
    await cells.nth(4).click(); // Center cell

    // Wait for cube to appear
    await expect(cells.nth(4).locator('img')).toBeVisible();

    // Click top edge to add cladding
    const topEdge = cells.nth(4).locator('[data-edge="top"]');
    await topEdge.click();

    // Check if summary updates
    const summary = page.locator('.summary');
    await expect(summary.getByText(/Panels Required/)).toBeVisible();
    
    // Verify non-zero values in summary
    const panelCount = await summary.locator('.panel-count').first().textContent();
    expect(Number(panelCount)).toBeGreaterThan(0);
  });

  test('can apply preset configuration', async ({ page }) => {
    // Click L-shape preset
    await page.getByText('L-Shape').click();

    // Check if grid updates with L-shape configuration
    const grid = page.locator('.grid');
    const cells = grid.locator('.aspect-square');
    
    // Verify L-shape pattern
    await expect(cells.nth(4)).toHaveClass(/hasCube/); // Center
    await expect(cells.nth(5)).toHaveClass(/hasCube/); // Right
    await expect(cells.nth(7)).toHaveClass(/hasCube/); // Bottom

    // Check if summary shows non-zero values
    const summary = page.locator('.summary');
    const connectorCount = await summary.locator('.connector-count').first().textContent();
    expect(Number(connectorCount)).toBeGreaterThan(0);
  });

  test('updates requirements when toggling cladding', async ({ page }) => {
    // Place cube in center
    const grid = page.locator('.grid');
    const cells = grid.locator('.aspect-square');
    await cells.nth(4).click();

    // Get initial panel count
    const summary = page.locator('.summary');
    const initialCount = await summary.locator('.panel-count').first().textContent();

    // Toggle all edges
    const edges = cells.nth(4).locator('[data-edge]');
    await edges.click({ force: true });

    // Get updated panel count
    const updatedCount = await summary.locator('.panel-count').first().textContent();
    expect(Number(updatedCount)).toBeGreaterThan(Number(initialCount));
  });
});
