import { test, expect } from '@playwright/test';

test.describe('Integrated Tutorial System', () => {
  test('should show welcome modal to first-time users', async ({ page }) => {
    // Clear localStorage to simulate first-time user
    await page.addInitScript(() => {
      localStorage.clear();
    });
    
    // Visit the page
    await page.goto('/');
    
    // Welcome modal should be visible
    const welcomeModal = page.locator('text=Welcome to FoodCube Garden Designer');
    await expect(welcomeModal).toBeVisible();
    
    // Should have options to start or skip tutorial
    await expect(page.locator('button:text("Skip Tutorial")')).toBeVisible();
    await expect(page.locator('button:text("Start Tutorial")')).toBeVisible();
  });
  
  test('should start tutorial and navigate through interactive steps', async ({ page }) => {
    // Clear localStorage to simulate first-time user
    await page.addInitScript(() => {
      localStorage.clear();
    });
    
    // Visit the page
    await page.goto('/');
    
    // Click Start Tutorial
    await page.locator('button:text("Start Tutorial")').click();
    
    // The tutorial tooltip should now be visible
    const tutorialTooltip = page.locator('[data-testid="tutorial-tooltip-welcome"]');
    await expect(tutorialTooltip).toBeVisible();
    
    // We should see the first step title
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    // Click Next to move to step 2
    await page.locator('text=Next').click();
    await expect(page.locator('[data-testid="tutorial-tooltip-grid"]')).toBeVisible();
    
    // Click Next to move to step 3
    await page.locator('text=Next').click();
    await expect(page.locator('[data-testid="tutorial-tooltip-presets"]')).toBeVisible();
    
    // Click Next to move to step 4
    await page.locator('text=Next').click();
    await expect(page.locator('[data-testid="tutorial-tooltip-layout-options"]')).toBeVisible();
    
    // Click Next to move to step 5 - interactive preset selection
    await page.locator('text=Next').click();
    await expect(page.locator('[data-testid="tutorial-tooltip-select-preset"]')).toBeVisible();
    
    // Actually click the L-Shape preset to interact
    await page.locator('[data-testid="preset-l-shape"]').click();
    
    // A brief pause to allow for the interaction to register
    await page.waitForTimeout(1000);
    
    // Next step should appear automatically after interaction
    await expect(page.locator('[data-testid="tutorial-tooltip-remove-cube"]')).toBeVisible();
  });
  
  test('should not show welcome modal to returning users', async ({ page }) => {
    // Set localStorage to simulate returning user
    await page.addInitScript(() => {
      localStorage.setItem('foodcube-tutorial-completed', 'true');
      localStorage.setItem('foodcube-welcome-modal-shown', 'true');
    });
    
    // Visit the page
    await page.goto('/');
    
    // Welcome modal should not be visible
    const welcomeModal = page.locator('text=Welcome to FoodCube Garden Designer');
    await expect(welcomeModal).not.toBeVisible();
  });
  
  test('should restart tutorial when help button is clicked', async ({ page }) => {
    // Set localStorage to simulate returning user who has completed tutorial
    await page.addInitScript(() => {
      localStorage.setItem('foodcube-tutorial-completed', 'true');
      localStorage.setItem('foodcube-welcome-modal-shown', 'true');
    });
    
    // Visit the page
    await page.goto('/');
    
    // Click the help button
    await page.locator('button[aria-label="Help"]').click();
    
    // The tutorial tooltip should now be visible
    const tutorialTooltip = page.locator('[data-testid="tutorial-tooltip-welcome"]');
    await expect(tutorialTooltip).toBeVisible();
  });
  
  test('should allow interacting with grid elements during tutorial', async ({ page }) => {
    // Clear localStorage to simulate first-time user
    await page.addInitScript(() => {
      localStorage.clear();
    });
    
    // Visit the page
    await page.goto('/');
    
    // Click Start Tutorial
    await page.locator('button:text("Start Tutorial")').click();
    
    // Navigate to the interactive step for selecting a preset
    await page.locator('text=Next').click(); // Step 1 -> 2
    await page.locator('text=Next').click(); // Step 2 -> 3
    await page.locator('text=Next').click(); // Step 3 -> 4
    await page.locator('text=Next').click(); // Step 4 -> 5 (Select Preset)
    
    // Should be on the preset selection step
    await expect(page.locator('[data-testid="tutorial-tooltip-select-preset"]')).toBeVisible();
    
    // Click the L-Shape preset, this should work even with the spotlight active
    await page.locator('[data-testid="preset-l-shape"]').click();
    
    // Wait for the next step to appear automatically
    await page.waitForTimeout(1000);
    
    // Should be on the "Remove a Cube" step
    await expect(page.locator('[data-testid="tutorial-tooltip-remove-cube"]')).toBeVisible();
    
    // Verify that we can interact with the cube grid
    await page.locator('[data-testid="grid-cell-1-1"]').click();
    
    // Wait for animation and next step
    await page.waitForTimeout(1000);
    
    // Should have moved to the next step
    await expect(page.locator('[data-testid="tutorial-tooltip-add-cube"]')).toBeVisible();
  });
});