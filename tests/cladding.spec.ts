import { test, expect } from '@playwright/test';

// Helper function to extract requirements from the page
async function getRequirements(page) {
  return page.evaluate(() => {
    const requirementsElement = document.querySelector('.requirements-list');
    if (!requirementsElement) return null;
    
    const items = Array.from(requirementsElement.querySelectorAll('li'));
    return items.reduce((acc, item) => {
      const text = item.textContent || '';
      const match = text.match(/(\d+)\s+x\s+(.+)/);
      if (match) {
        const [_, count, name] = match;
        acc[name.trim()] = parseInt(count, 10);
      }
      return acc;
    }, {});
  });
}

// Helper function to wait for grid to be ready
async function waitForGridReady(page) {
  await page.waitForSelector('.grid-container', { state: 'visible' });
  // Wait a bit for any animations or calculations to complete
  await page.waitForTimeout(500);
}

test('Single cube preset and custom placement should have same requirements', async ({ page }) => {
  // Navigate to the application
  await page.goto('/');
  await waitForGridReady(page);
  
  // First, test with preset (single cube)
  await page.getByText('Single Cube').click();
  await waitForGridReady(page);
  
  // Make sure cladding is enabled
  const claddingToggle = page.getByText('Cladding');
  const isCladdingEnabled = await claddingToggle.evaluate(el => el.classList.contains('active'));
  if (!isCladdingEnabled) {
    await claddingToggle.click();
    await waitForGridReady(page);
  }
  
  // Get requirements for preset
  const presetRequirements = await getRequirements(page);
  console.log('Preset requirements:', presetRequirements);
  
  // Clear the grid
  await page.getByText('Clear Grid').click();
  await waitForGridReady(page);
  
  // Place a custom cube
  await page.locator('.grid-cell').nth(4).click(); // Center cell (1,1)
  await waitForGridReady(page);
  
  // Make sure cladding is enabled for custom placement
  const isCladdingEnabledAfterCustom = await claddingToggle.evaluate(el => el.classList.contains('active'));
  if (!isCladdingEnabledAfterCustom) {
    await claddingToggle.click();
    await waitForGridReady(page);
  }
  
  // Get requirements for custom placement
  const customRequirements = await getRequirements(page);
  console.log('Custom requirements:', customRequirements);
  
  // Compare requirements
  expect(customRequirements).toEqual(presetRequirements);
  
  // Verify against known truth for single cube
  expect(customRequirements['Four-Pack (Regular)']).toBe(1);
});

test('L-shaped configuration preset and custom placement should have same requirements', async ({ page }) => {
  // Navigate to the application
  await page.goto('/');
  await waitForGridReady(page);
  
  // First, test with preset (L-shaped)
  await page.getByText('L-Shape').click();
  await waitForGridReady(page);
  
  // Make sure cladding is enabled
  const claddingToggle = page.getByText('Cladding');
  const isCladdingEnabled = await claddingToggle.evaluate(el => el.classList.contains('active'));
  if (!isCladdingEnabled) {
    await claddingToggle.click();
    await waitForGridReady(page);
  }
  
  // Get requirements for preset
  const presetRequirements = await getRequirements(page);
  console.log('L-Shape preset requirements:', presetRequirements);
  
  // Clear the grid
  await page.getByText('Clear Grid').click();
  await waitForGridReady(page);
  
  // Place custom cubes in L-shape
  // Center and two adjacent cells to form an L
  await page.locator('.grid-cell').nth(4).click(); // Center (1,1)
  await page.locator('.grid-cell').nth(1).click(); // Top-center (0,1)
  await page.locator('.grid-cell').nth(5).click(); // Right-center (1,2)
  await waitForGridReady(page);
  
  // Make sure cladding is enabled for custom placement
  const isCladdingEnabledAfterCustom = await claddingToggle.evaluate(el => el.classList.contains('active'));
  if (!isCladdingEnabledAfterCustom) {
    await claddingToggle.click();
    await waitForGridReady(page);
  }
  
  // Get requirements for custom placement
  const customRequirements = await getRequirements(page);
  console.log('L-Shape custom requirements:', customRequirements);
  
  // Compare requirements
  expect(customRequirements).toEqual(presetRequirements);
  
  // Verify against known truth for L-shaped configuration
  expect(customRequirements['Four-Pack (Regular)']).toBe(1);
  expect(customRequirements['Two-Pack (Regular)']).toBe(2);
  expect(customRequirements['Corner Connector']).toBe(1);
  expect(customRequirements['Straight Coupling']).toBe(1);
});

test('Toggling cladding should update requirements dynamically', async ({ page }) => {
  // Navigate to the application
  await page.goto('/');
  await waitForGridReady(page);
  
  // Apply single cube preset
  await page.getByText('Single Cube').click();
  await waitForGridReady(page);
  
  // Make sure cladding is enabled
  const claddingToggle = page.getByText('Cladding');
  const isCladdingEnabled = await claddingToggle.evaluate(el => el.classList.contains('active'));
  if (!isCladdingEnabled) {
    await claddingToggle.click();
    await waitForGridReady(page);
  }
  
  // Get requirements with cladding enabled
  const requirementsWithCladding = await getRequirements(page);
  console.log('Requirements with cladding:', requirementsWithCladding);
  
  // Toggle cladding off
  await claddingToggle.click();
  await waitForGridReady(page);
  
  // Get requirements with cladding disabled
  const requirementsWithoutCladding = await getRequirements(page);
  console.log('Requirements without cladding:', requirementsWithoutCladding);
  
  // Requirements should be different when cladding is toggled
  expect(requirementsWithCladding).not.toEqual(requirementsWithoutCladding);
  
  // With cladding disabled, there should be no panel requirements
  expect(requirementsWithoutCladding['Four-Pack (Regular)']).toBe(0);
}); 