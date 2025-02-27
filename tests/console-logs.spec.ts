import { test, expect } from '@playwright/test';

interface LogEntry {
  type: string;
  text: string;
  location: {
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
}

test('Capture console logs for U-shaped configuration', async ({ page }) => {
  // Set up console log capture
  const logs: LogEntry[] = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Navigate to the application
  await page.goto('/');
  
  // Wait for grid to be ready
  await page.waitForSelector('.grid-container', { state: 'visible' });
  await page.waitForTimeout(500);
  
  // Apply U-shaped preset
  await page.getByText('U-Shape').click();
  
  // Wait for grid to update
  await page.waitForTimeout(1000);
  
  // Make sure cladding is enabled
  const claddingToggle = page.getByText('Cladding');
  const isCladdingEnabled = await claddingToggle.evaluate(el => el.classList.contains('active'));
  if (!isCladdingEnabled) {
    await claddingToggle.click();
    await page.waitForTimeout(500);
  }
  
  // Wait for calculations to complete
  await page.waitForTimeout(1000);
  
  // Filter logs for relevant information
  const gridStateLogs = logs.filter(log => 
    log.text.includes('Grid State Update') || 
    log.text.includes('Analyzing path') ||
    log.text.includes('Raw panel requirements') ||
    log.text.includes('Packed panel requirements')
  );
  
  console.log('Captured logs:', gridStateLogs);
  
  // Check if we have logs about the path analysis
  const pathAnalysisLogs = logs.filter(log => log.text.includes('Analyzing path'));
  expect(pathAnalysisLogs.length).toBeGreaterThan(0);
  
  // Check if we have logs about panel requirements
  const requirementsLogs = logs.filter(log => 
    log.text.includes('Raw panel requirements') || 
    log.text.includes('Packed panel requirements')
  );
  expect(requirementsLogs.length).toBeGreaterThan(0);
  
  // Extract the requirements from the page
  const requirements = await page.evaluate(() => {
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
    }, {} as Record<string, number>);
  });
  
  console.log('U-Shape requirements from UI:', requirements);
  
  // Verify against known truth for U-shaped configuration
  expect(requirements).not.toBeNull();
  if (requirements) {
    expect(requirements['Four-Pack (Regular)']).toBe(1);
    expect(requirements['Two-Pack (Regular)']).toBe(2);
    expect(requirements['Corner Connector']).toBe(2);
    expect(requirements['Straight Coupling']).toBe(2);
  }
}); 