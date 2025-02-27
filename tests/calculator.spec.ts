import { test, expect } from '@playwright/test';

// Define directions for our tests
type Direction = 'N' | 'S' | 'E' | 'W';

// Extend Window interface to include our custom logs property
declare global {
  interface Window {
    console: Console & {
      logs?: string[];
    };
  }
}

// Ground truth configuration rules
const CONFIGURATION_RULES = {
  // For a single cube with all edges(4 edges) cladded, we should get:
  // 1 four-pack (2 side + 1 left + 1 right)
  SINGLE_CUBE: {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 0,
    twoPackExtraTall: 0,
    sidePanels: 0,
    leftPanels: 0,
    rightPanels: 0,
    straightCouplings: 0,
    cornerConnectors: 0
  },
  // For three cubes in a line(8 edges), we should get:
  // 1 four-pack (2 side + 1 left + 1 right)
  // 2 two-packs (2 sides each)
  // 2 straight couplings
  THREE_LINE: {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 2,
    twoPackExtraTall: 0,
    sidePanels: 0,
    leftPanels: 0,
    rightPanels: 0,
    straightCouplings: 2,
    cornerConnectors: 0
  },
  // For L-shaped configuration(8 edges), we should get:
  // 1 four-pack (2 side + 1 right + 1 left)
  // 1 left panel (1 side)
  // 1 two-pack (2 sides)
  // 1 corner connector
  // 1 straight coupling
  L_SHAPE: {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 1,
    twoPackExtraTall: 0,
    sidePanels: 1,
    leftPanels: 0,
    rightPanels: 0,
    straightCouplings: 1,
    cornerConnectors: 1
  },
  // For U-shaped (12 edges) configurations:
  // 1 four-pack (2 side + 1 right + 1 left)
  // 2 two-packs (2 sides each)
  // 2 corner connectors
  // 2 straight couplings
  U_SHAPE: {
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 2,
    twoPackExtraTall: 0,
    sidePanels: 0,
    leftPanels: 0,
    rightPanels: 0,
    straightCouplings: 2,
    cornerConnectors: 2
  }
};

// Helper function to extract requirements from the UI
async function getRequirements(page) {
  // Wait for the requirements data element to be present
  await page.waitForSelector('[data-testid="requirements-data"]', { timeout: 5000 });
  
  // Extract the requirements directly from the data attributes
  const requirements = await page.evaluate(() => {
    const dataElement = document.querySelector('[data-testid="requirements-data"]');
    if (!dataElement) return null;
    
    return {
      fourPackRegular: parseInt(dataElement.getAttribute('data-four-pack-regular') || '0', 10),
      fourPackExtraTall: parseInt(dataElement.getAttribute('data-four-pack-extra-tall') || '0', 10),
      twoPackRegular: parseInt(dataElement.getAttribute('data-two-pack-regular') || '0', 10),
      twoPackExtraTall: parseInt(dataElement.getAttribute('data-two-pack-extra-tall') || '0', 10),
      sidePanels: parseInt(dataElement.getAttribute('data-side-panels') || '0', 10),
      leftPanels: parseInt(dataElement.getAttribute('data-left-panels') || '0', 10),
      rightPanels: parseInt(dataElement.getAttribute('data-right-panels') || '0', 10),
      straightCouplings: parseInt(dataElement.getAttribute('data-straight-couplings') || '0', 10),
      cornerConnectors: parseInt(dataElement.getAttribute('data-corner-connectors') || '0', 10)
    };
  });
  
  // Fallback to the body data attribute if the element method fails
  if (!requirements) {
    const requirementsJson = await page.evaluate(() => {
      return document.body.getAttribute('data-requirements');
    });
    
    if (requirementsJson) {
      try {
        return JSON.parse(requirementsJson);
      } catch (e) {
        console.error('Failed to parse requirements JSON:', e);
      }
    }
    
    // Last resort: parse from text content
    return getRequirementsFromText(page);
  }
  
  console.log('Requirements extracted:', requirements);
  return requirements;
}

// Fallback method to extract requirements from text content
async function getRequirementsFromText(page) {
  // Extract the text content of the requirements summary
  const requirementsText = await page.evaluate(() => {
    // Get all the requirement elements
    const packElements = document.querySelectorAll('.grid.grid-cols-\\[auto_auto_1fr\\]');
    const connectorElements = document.querySelectorAll('.flex.items-center.gap-1.text-xs.sm\\:text-sm.group.relative');
    
    // Combine all text content
    let allText = '';
    packElements.forEach(el => {
      allText += el.textContent + ' ';
    });
    connectorElements.forEach(el => {
      allText += el.textContent + ' ';
    });
    
    return allText;
  });
  
  console.log('Requirements text:', requirementsText);
  
  // Parse the requirements from the text
  const fourPackRegular = extractNumberFromText(requirementsText, '4-Pack');
  const fourPackExtraTall = 0; // Not currently displayed in the UI
  const twoPackRegular = extractNumberFromText(requirementsText, '2-Pack');
  const twoPackExtraTall = 0; // Not currently displayed in the UI
  const sidePanels = extractNumberFromText(requirementsText, 'Side');
  const leftPanels = extractNumberFromText(requirementsText, 'Left');
  const rightPanels = extractNumberFromText(requirementsText, 'Right');
  const straightCouplings = extractNumberFromText(requirementsText, 'Straight');
  const cornerConnectors = extractNumberFromText(requirementsText, 'Corner');
  
  return {
    fourPackRegular,
    fourPackExtraTall,
    twoPackRegular,
    twoPackExtraTall,
    sidePanels,
    leftPanels,
    rightPanels,
    straightCouplings,
    cornerConnectors
  };
}

// Helper function to extract a number from text
function extractNumberFromText(text, label) {
  // Look for patterns like "4-Pack - " or "Straight (2)"
  const packRegex = new RegExp(`${label}\\s*-\\s*(\\d+)`);
  const countRegex = new RegExp(`${label}\\s*\\((\\d+)\\)`);
  
  let match = text.match(packRegex);
  if (!match) {
    match = text.match(countRegex);
  }
  
  return match ? parseInt(match[1], 10) : 0;
}

// Helper function to clear the grid
async function clearGrid(page) {
  // Look for a clear button
  const clearButton = await page.getByText('Clear', { exact: false });
  if (await clearButton.count() > 0) {
    await clearButton.click();
    await page.waitForTimeout(500); // Wait for the grid to clear
  } else {
    console.log('Clear button not found, attempting to clear grid manually');
    // Manually clear by clicking on each cell with a cube
    const cells = await page.locator('[data-has-cube="true"]').all();
    for (const cell of cells) {
      await cell.click();
      await page.waitForTimeout(100);
    }
  }
  
  // Wait for the grid to be cleared and calculations to update
  await page.waitForTimeout(500);
}

// Helper function to apply a preset configuration
async function applyPreset(page, presetName) {
  // Map preset names to their data-testid attributes
  const presetMap = {
    'Straight (3x1)': 'preset-straight',
    'L-Shape': 'preset-l-shape',
    'U-Shape': 'preset-u-shape'
  };
  
  const presetId = presetMap[presetName];
  if (!presetId) {
    console.warn(`Unknown preset name: ${presetName}`);
    return false;
  }
  
  // Find the preset button by data-testid
  const presetButton = page.locator(`[data-testid="${presetId}"]`);
  
  // Check if the button exists
  if (await presetButton.count() > 0) {
    await presetButton.click();
    
    // Wait for the preset to be applied and calculations to complete
    await page.waitForTimeout(1000);
    
    return true;
  }
  
  console.warn(`Preset button "${presetName}" not found`);
  return false;
}

// Helper function to place a cube at a specific position in the grid
async function placeCubeAt(page, row, col) {
  // Find the specific grid cell by its data-testid
  const cellSelector = `[data-testid="grid-cell-${row}-${col}"]`;
  
  try {
    await page.waitForSelector(cellSelector, { timeout: 5000 });
    
    // Click on the cell to place a cube
    await page.locator(cellSelector).click();
    await page.waitForTimeout(300); // Wait for the cube to be placed
    
    // Verify the cube was placed
    const hasCube = await page.locator(cellSelector).getAttribute('data-has-cube');
    if (hasCube !== 'true') {
      console.warn(`Failed to place cube at row ${row}, col ${col}`);
      
      // Try clicking again
      await page.locator(cellSelector).click();
      await page.waitForTimeout(300);
    }
    
    return true;
  } catch (e) {
    console.error(`Error placing cube at [${row}, ${col}]:`, e);
    
    // Fallback: try to find any grid cell and click at the appropriate position
    const gridContainer = await page.locator('[data-testid="grid-wrapper"]');
    if (await gridContainer.count() > 0) {
      const boundingBox = await gridContainer.boundingBox();
      if (boundingBox) {
        // Estimate cell size and position
        const cellWidth = boundingBox.width / 5; // Assuming 5x5 grid
        const cellHeight = boundingBox.height / 5;
        
        // Calculate position to click
        const x = boundingBox.x + (col + 0.5) * cellWidth;
        const y = boundingBox.y + (row + 0.5) * cellHeight;
        
        // Click at the calculated position
        await page.mouse.click(x, y);
        await page.waitForTimeout(300);
        
        return true;
      }
    }
    
    return false;
  }
}

// Helper function to enable debug mode
async function enableDebugMode(page) {
  // Try to find the debug toggle by data-testid
  const debugToggle = await page.locator('[data-testid="debug-toggle"]');
  if (await debugToggle.count() > 0) {
    // Check if it's already enabled
    const isChecked = await debugToggle.getAttribute('aria-checked');
    if (isChecked !== 'true') {
      await debugToggle.click();
      await page.waitForTimeout(300);
    }
    return true;
  }
  
  // Try to find by label
  const debugLabel = await page.locator('[data-testid="debug-label"]');
  if (await debugLabel.count() > 0) {
    await debugLabel.click();
    await page.waitForTimeout(300);
    return true;
  }
  
  console.warn('Debug toggle not found');
  return false;
}

// Test suite
test.describe('Cladding Cube Calculator', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to load - look for the configurator
    await page.waitForSelector('[data-testid="foodcube-configurator"]', { timeout: 10000 });
    
    // Enable debug mode for better visibility
    await enableDebugMode(page);
    
    // Clear the grid to start fresh
    await clearGrid(page);
  });
  
  test('Single cube configuration should match ground truth', async ({ page }) => {
    // Place a single cube
    await placeCubeAt(page, 1, 1);
    
    // Wait for calculations to complete
    await page.waitForTimeout(1000);
    
    // Get the calculated requirements
    const requirements = await getRequirements(page);
    
    // Compare with ground truth
    const expected = CONFIGURATION_RULES.SINGLE_CUBE;
    
    // Log for debugging
    console.log('Single cube requirements:', requirements);
    console.log('Expected:', expected);
    
    // Assert that the requirements match the ground truth
    expect(requirements.fourPackRegular).toBe(expected.fourPackRegular);
    expect(requirements.twoPackRegular).toBe(expected.twoPackRegular);
    expect(requirements.sidePanels).toBe(expected.sidePanels);
    expect(requirements.straightCouplings).toBe(expected.straightCouplings);
    expect(requirements.cornerConnectors).toBe(expected.cornerConnectors);
  });
  
  test('Three cubes in a line configuration should match ground truth', async ({ page }) => {
    // Try to use the preset first
    const presetApplied = await applyPreset(page, 'Straight (3x1)');
    
    if (!presetApplied) {
      // Place three cubes in a line manually
      await placeCubeAt(page, 1, 0);
      await placeCubeAt(page, 1, 1);
      await placeCubeAt(page, 1, 2);
    }
    
    // Wait for calculations to complete
    await page.waitForTimeout(1000);
    
    // Get the calculated requirements
    const requirements = await getRequirements(page);
    
    // Compare with ground truth
    const expected = CONFIGURATION_RULES.THREE_LINE;
    
    // Log for debugging
    console.log('Three cubes line requirements:', requirements);
    console.log('Expected:', expected);
    
    // Assert that the requirements match the ground truth
    expect(requirements.fourPackRegular).toBe(expected.fourPackRegular);
    expect(requirements.twoPackRegular).toBe(expected.twoPackRegular);
    expect(requirements.sidePanels).toBe(expected.sidePanels);
    expect(requirements.straightCouplings).toBe(expected.straightCouplings);
    expect(requirements.cornerConnectors).toBe(expected.cornerConnectors);
  });
  
  test('L-shaped configuration should match ground truth', async ({ page }) => {
    // Try to use the preset first
    const presetApplied = await applyPreset(page, 'L-Shape');
    
    if (!presetApplied) {
      // Place cubes in an L-shape manually
      await placeCubeAt(page, 1, 0);
      await placeCubeAt(page, 1, 1);
      await placeCubeAt(page, 2, 1);
    }
    
    // Wait for calculations to complete
    await page.waitForTimeout(1000);
    
    // Get the calculated requirements
    const requirements = await getRequirements(page);
    
    // Compare with ground truth
    const expected = CONFIGURATION_RULES.L_SHAPE;
    
    // Log for debugging
    console.log('L-shape requirements:', requirements);
    console.log('Expected:', expected);
    
    // Assert that the requirements match the ground truth
    expect(requirements.fourPackRegular).toBe(expected.fourPackRegular);
    expect(requirements.twoPackRegular).toBe(expected.twoPackRegular);
    expect(requirements.sidePanels).toBe(expected.sidePanels);
    expect(requirements.straightCouplings).toBe(expected.straightCouplings);
    expect(requirements.cornerConnectors).toBe(expected.cornerConnectors);
  });
  
  test('U-shaped configuration should match ground truth', async ({ page }) => {
    // Try to use the preset first
    const presetApplied = await applyPreset(page, 'U-Shape');
    
    if (!presetApplied) {
      // Place cubes in a U-shape manually
      await placeCubeAt(page, 0, 0);
      await placeCubeAt(page, 1, 0);
      await placeCubeAt(page, 2, 0);
      await placeCubeAt(page, 2, 1);
      await placeCubeAt(page, 2, 2);
    }
    
    // Wait for calculations to complete
    await page.waitForTimeout(1000);
    
    // Get the calculated requirements
    const requirements = await getRequirements(page);
    
    // Compare with ground truth
    const expected = CONFIGURATION_RULES.U_SHAPE;
    
    // Log for debugging
    console.log('U-shape requirements:', requirements);
    console.log('Expected:', expected);
    
    // Assert that the requirements match the ground truth
    expect(requirements.fourPackRegular).toBe(expected.fourPackRegular);
    expect(requirements.twoPackRegular).toBe(expected.twoPackRegular);
    expect(requirements.sidePanels).toBe(expected.sidePanels);
    expect(requirements.straightCouplings).toBe(expected.straightCouplings);
    expect(requirements.cornerConnectors).toBe(expected.cornerConnectors);
  });
}); 