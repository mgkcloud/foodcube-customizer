import { GridCell, CompassDirection } from '../types';
import { countPanels } from '../panelCounter';
import { detectConnections } from '../connectionDetector';
import { createTestGrid } from '../testUtils';

// Helper function to create packs from panel counts
function createPacks(sidePanels: number, leftPanels: number, rightPanels: number) {
  let fourPacks = 0;
  let twoPacks = 0;
  let singlePanels = 0;

  // Create four-packs (2 side + 1 left + 1 right)
  while (sidePanels >= 2 && leftPanels >= 1 && rightPanels >= 1) {
    fourPacks++;
    sidePanels -= 2;
    leftPanels--;
    rightPanels--;
  }

  // Create two-packs (2 sides)
  while (sidePanels >= 2) {
    twoPacks++;
    sidePanels -= 2;
  }

  // Create two-packs from remaining left/right panels
  while (leftPanels >= 1 && rightPanels >= 1) {
    twoPacks++;
    leftPanels--;
    rightPanels--;
  }

  // Create two-packs from remaining side panels and left/right panels
  while (sidePanels >= 1 && (leftPanels >= 1 || rightPanels >= 1)) {
    twoPacks++;
    sidePanels--;
    if (leftPanels >= 1) leftPanels--;
    else rightPanels--;
  }

  // Count remaining single panels
  singlePanels = sidePanels + leftPanels + rightPanels;

  return { fourPacks, twoPacks, singlePanels };
}

// Helper function to visualize the grid
function visualizeGrid(grid: GridCell[][]) {
  return grid.map(row => 
    row.map(cell => 
      cell.hasCube ? 'X' : '.'
    ).join('')
  ).join('\n');
}

describe('Detailed Configuration Tests', () => {
  test('Single cube configuration', () => {
    const grid = createTestGrid(
      [[1]],
      { '0,0': { entry: 'W', exit: 'E' } }
    );

    console.log('Single cube grid:');
    console.log(visualizeGrid(grid));

    const panelCounts = countPanels(grid);
    const connections = detectConnections(grid);
    const packs = createPacks(panelCounts.sidePanels, panelCounts.leftPanels, panelCounts.rightPanels);

    console.log('Panel counts:', panelCounts);
    console.log('Connections:', connections);
    console.log('Packs:', packs);

    expect(panelCounts).toEqual({ sidePanels: 2, leftPanels: 1, rightPanels: 1 });
    expect(connections).toEqual({ straight: 0, cornerLeft: 0, cornerRight: 0 });
    expect(packs).toEqual({ fourPacks: 1, twoPacks: 0, singlePanels: 0 });
  });

  test('Three cubes in a line configuration', () => {
    const grid = createTestGrid(
      [[1, 1, 1]],
      {
        '0,0': { entry: 'W', exit: 'E' },
        '0,1': { entry: 'W', exit: 'E' },
        '0,2': { entry: 'W', exit: 'E' }
      }
    );

    console.log('Three cubes in a line grid:');
    console.log(visualizeGrid(grid));

    const panelCounts = countPanels(grid);
    const connections = detectConnections(grid);
    const packs = createPacks(panelCounts.sidePanels, panelCounts.leftPanels, panelCounts.rightPanels);

    console.log('Panel counts:', panelCounts);
    console.log('Connections:', connections);
    console.log('Packs:', packs);

    expect(panelCounts).toEqual({ sidePanels: 6, leftPanels: 1, rightPanels: 1 });
    expect(connections).toEqual({ straight: 2, cornerLeft: 0, cornerRight: 0 });
    expect(packs).toEqual({ fourPacks: 1, twoPacks: 2, singlePanels: 0 });
  });

  test('L-shaped configuration', () => {
    const grid = createTestGrid(
      [[1, 1],
       [0, 1]],
      {
        '0,0': { entry: 'W', exit: 'E' },
        '0,1': { entry: 'W', exit: 'S' },
        '1,1': { entry: 'N', exit: 'S' }
      }
    );

    console.log('L-shaped grid:');
    console.log(visualizeGrid(grid));

    const panelCounts = countPanels(grid);
    const connections = detectConnections(grid);
    const packs = createPacks(panelCounts.sidePanels, panelCounts.leftPanels, panelCounts.rightPanels);

    console.log('Panel counts:', panelCounts);
    console.log('Connections:', connections);
    console.log('Packs:', packs);

    expect(panelCounts).toEqual({ sidePanels: 5, leftPanels: 2, rightPanels: 1 });
    expect(connections).toEqual({ straight: 1, cornerLeft: 0, cornerRight: 1 });
    expect(packs).toEqual({ fourPacks: 1, twoPacks: 2, singlePanels: 1 });
  });

  test('U-shaped configuration', () => {
    const grid = createTestGrid(
      [[1, 1, 1],
       [1, 0, 1]],
      {
        '0,0': { entry: 'W', exit: 'S' },
        '1,0': { entry: 'N', exit: 'E' },
        '1,1': { entry: 'W', exit: 'E' },
        '1,2': { entry: 'W', exit: 'N' },
        '0,2': { entry: 'S', exit: 'E' }
      }
    );

    console.log('U-shaped grid:');
    console.log(visualizeGrid(grid));

    const panelCounts = countPanels(grid);
    const connections = detectConnections(grid);
    const packs = createPacks(panelCounts.sidePanels, panelCounts.leftPanels, panelCounts.rightPanels);

    console.log('Panel counts:', panelCounts);
    console.log('Connections:', connections);
    console.log('Packs:', packs);

    expect(panelCounts).toEqual({ sidePanels: 6, leftPanels: 1, rightPanels: 1 });
    expect(connections).toEqual({ straight: 2, cornerLeft: 1, cornerRight: 1 });
    expect(packs).toEqual({ fourPacks: 1, twoPacks: 2, singlePanels: 0 });
  });
});
