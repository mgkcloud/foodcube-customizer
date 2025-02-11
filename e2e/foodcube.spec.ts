import { test, expect } from '@playwright/test';

test.describe('FoodCube Configurator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render the grid correctly', async ({ page }) => {
    // Check if the grid is visible
    await expect(page.locator('.grid')).toBeVisible();
    
    // Check if we have the expected number of cells
    const cells = await page.locator('.cell').count();
    expect(cells).toBe(16); // 4x4 grid
  });

  test('should add a cube when clicking a cell', async ({ page }) => {
    // Click the center cell
    await page.locator('.cell').nth(5).click();
    
    // Verify the cell now has a cube
    await expect(page.locator('.cell').nth(5)).toHaveClass(/hasCube/);
  });

  test('should toggle cladding on exposed edges', async ({ page }) => {
    // Add a cube
    await page.locator('.cell').nth(5).click();
    
    // Click an edge to add cladding
    await page.locator('.edge.top').nth(5).click();
    
    // Verify the edge has cladding
    await expect(page.locator('.edge.top').nth(5)).toHaveClass(/hasPanel/);
  });

  test('should update requirements when adding cubes and cladding', async ({ page }) => {
    // Add a cube
    await page.locator('.cell').nth(5).click();
    
    // Add cladding to two adjacent edges
    await page.locator('.edge.top').nth(5).click();
    await page.locator('.edge.right').nth(5).click();
    
    // Check the requirements summary
    const summary = page.locator('.requirements-summary');
    await expect(summary).toContainText('Corner Connector: 1');
    await expect(summary).toContainText('Straight Coupling: 2');
  });

  test('should handle multiple cubes and shared edges', async ({ page }) => {
    // Add two adjacent cubes
    await page.locator('.cell').nth(5).click();
    await page.locator('.cell').nth(6).click();
    
    // Add cladding to outer edges
    await page.locator('.edge.top').nth(5).click();
    await page.locator('.edge.top').nth(6).click();
    
    // Verify the shared edge is not showing cladding options
    const sharedEdge = page.locator('.edge.right').nth(5);
    await expect(sharedEdge).not.toHaveClass(/exposed/);
  });
});
