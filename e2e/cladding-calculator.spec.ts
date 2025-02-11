import { test, expect } from '@playwright/test';

test.describe('Cladding Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('single cube configuration gives correct requirements', async ({ page }) => {
    // Click center cell to place cube
    await page.click('[data-testid="grid-cell-1-1"]');
    
    // Get the requirements summary
    const requirements = await page.evaluate(() => {
      const summary = document.querySelector('[data-testid="requirements-summary"]');
      return summary?.textContent;
    });

    // Verify requirements match our core truth:
    // 1 four-pack (2 side + 1 left + 1 right)
    expect(requirements).toContain('4-Pack Regular: 1');
    expect(requirements).toContain('Corner Connectors: 0');
    expect(requirements).toContain('Straight Couplings: 0');
  });

  test('three cubes in line gives correct requirements', async ({ page }) => {
    // Click cells to create horizontal line
    await page.click('[data-testid="grid-cell-1-0"]');
    await page.click('[data-testid="grid-cell-1-1"]');
    await page.click('[data-testid="grid-cell-1-2"]');

    const requirements = await page.evaluate(() => {
      const summary = document.querySelector('[data-testid="requirements-summary"]');
      return summary?.textContent;
    });

    // Verify requirements match our core truth:
    // 1 four-pack (2 side + 1 left + 1 right)
    // 2 two-packs (4 sides)
    // 2 straight couplings
    expect(requirements).toContain('4-Pack Regular: 1');
    expect(requirements).toContain('2-Pack Regular: 2');
    expect(requirements).toContain('Corner Connectors: 0');
    expect(requirements).toContain('Straight Couplings: 2');
  });

  test('L-shaped configuration gives correct requirements', async ({ page }) => {
    // Click cells to create L shape
    await page.click('[data-testid="grid-cell-1-0"]');
    await page.click('[data-testid="grid-cell-1-1"]');
    await page.click('[data-testid="grid-cell-2-1"]');

    const requirements = await page.evaluate(() => {
      const summary = document.querySelector('[data-testid="requirements-summary"]');
      return summary?.textContent;
    });

    // Verify requirements match our core truth:
    // 1 four-pack (2 side + 1 right + 1 left)
    // 2 two-packs (4 sides)
    // 1 extra side panel
    // 1 corner connector
    // 1 straight coupling
    expect(requirements).toContain('4-Pack Regular: 1');
    expect(requirements).toContain('2-Pack Regular: 2');
    expect(requirements).toContain('Single Panels: 1');
    expect(requirements).toContain('Corner Connectors: 1');
    expect(requirements).toContain('Straight Couplings: 1');
  });

  test('U-shaped configuration gives correct requirements', async ({ page }) => {
    // Click cells to create U shape
    await page.click('[data-testid="grid-cell-0-0"]');
    await page.click('[data-testid="grid-cell-1-0"]');
    await page.click('[data-testid="grid-cell-2-0"]');
    await page.click('[data-testid="grid-cell-2-1"]');
    await page.click('[data-testid="grid-cell-2-2"]');

    const requirements = await page.evaluate(() => {
      const summary = document.querySelector('[data-testid="requirements-summary"]');
      return summary?.textContent;
    });

    // Verify requirements match our core truth:
    // 1 four-pack (2 side + 1 right + 1 left)
    // 2 two-packs (4 sides)
    // 2 corner connectors
    // 2 straight couplings
    expect(requirements).toContain('4-Pack Regular: 1');
    expect(requirements).toContain('2-Pack Regular: 2');
    expect(requirements).toContain('Corner Connectors: 2');
    expect(requirements).toContain('Straight Couplings: 2');
  });

  test('validates irrigation pathway rules', async ({ page }) => {
    // Attempt to create invalid T-shape (should prevent placement)
    await page.click('[data-testid="grid-cell-1-0"]');
    await page.click('[data-testid="grid-cell-1-1"]');
    await page.click('[data-testid="grid-cell-1-2"]');
    await page.click('[data-testid="grid-cell-0-1"]'); // This should be prevented

    // Verify T-shape was prevented
    const invalidCell = await page.evaluate(() => {
      const cell = document.querySelector('[data-testid="grid-cell-0-1"]');
      return cell?.getAttribute('data-has-cube');
    });

    expect(invalidCell).toBe('false');

    // Verify error message
    const errorMessage = await page.evaluate(() => {
      const error = document.querySelector('[data-testid="error-message"]');
      return error?.textContent;
    });

    expect(errorMessage).toContain('Invalid cube placement');
  });

  test('handles cube removal and recalculation correctly', async ({ page }) => {
    // Create L shape
    await page.click('[data-testid="grid-cell-1-0"]');
    await page.click('[data-testid="grid-cell-1-1"]');
    await page.click('[data-testid="grid-cell-2-1"]');

    // Get initial requirements
    const initialRequirements = await page.evaluate(() => {
      const summary = document.querySelector('[data-testid="requirements-summary"]');
      return summary?.textContent;
    });

    // Remove middle cube
    await page.click('[data-testid="grid-cell-1-1"]');

    // Get updated requirements
    const updatedRequirements = await page.evaluate(() => {
      const summary = document.querySelector('[data-testid="requirements-summary"]');
      return summary?.textContent;
    });

    // Verify requirements were updated correctly
    expect(initialRequirements).not.toEqual(updatedRequirements);
    expect(updatedRequirements).toContain('Corner Connectors: 0');
  });
});
