import { calculateRequirements } from '@/utils/calculation/calculationUtils';
import { GridCell } from '@/components/types';

const logGridState = (grid: GridCell[][], testName: string) => {
  console.log(`\n=== ${testName} ===`);
  console.log('Grid state:');
  for (let i = 0; i < grid.length; i++) {
    let row = '';
    for (let j = 0; j < grid[i].length; j++) {
      row += grid[i][j].hasCube ? '[R]' : '[ ]';
    }
    console.log(row);
  }
};

describe('calculateRequirements', () => {
  // Helper to add cladding to a cube
  const addCladding = (grid: GridCell[][], row: number, col: number, edges: ('top' | 'right' | 'bottom' | 'left')[]) => {
    edges.forEach(edge => grid[row][col].claddingEdges.add(edge));
  };
  const createEmptyGrid = (): GridCell[][] => {
    return Array(3).fill(null).map(() => 
      Array(3).fill(null).map(() => ({ hasCube: false, claddingEdges: new Set() }))
    );
  };

  const setCube = (grid: GridCell[][], row: number, col: number) => {
    grid[row][col].hasCube = true;
  };

  const logTestCase = (testName: string, grid: GridCell[][], result: any) => {
    console.log(`\n=== ${testName} Test Case ===`);
    logGridState(grid, testName);
    console.log('\nAdjacent cubes for each position:');
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[i][j].hasCube) {
          console.log(`Position [${i},${j}]:`);
          console.log(`  Top: ${i > 0 && grid[i-1][j].hasCube}`);
          console.log(`  Right: ${j < 2 && grid[i][j+1].hasCube}`);
          console.log(`  Bottom: ${i < 2 && grid[i+1][j].hasCube}`);
          console.log(`  Left: ${j > 0 && grid[i][j-1].hasCube}`);
        }
      }
    }
    console.log('\nCalculated Requirements:', result);
  };

  test('single cube with all edges cladded', () => {
    const grid = createEmptyGrid();
    setCube(grid, 1, 1); // Center cube
    addCladding(grid, 1, 1, ['top', 'right', 'bottom', 'left']);
    const result = calculateRequirements(grid);
    logTestCase('Single Cube All Edges', grid, result);
    // Single cube with 4 edges should use exactly one 4-pack
    expect(result).toEqual({
      fourPackRegular: 1,     // 1 four-pack (2 side + 1 left + 1 right)
      fourPackExtraTall: 0,
      twoPackRegular: 0,
      twoPackExtraTall: 0,
      leftPanels: 0,          // All used in four-pack
      rightPanels: 0,         // All used in four-pack
      sidePanels: 0,          // All used in four-pack
      cornerConnectors: 0,
      straightCouplings: 0
    });
  });

  test('three cubes in a line with cladding', () => {
    const grid = createEmptyGrid();
    // Set up three cubes in a row
    setCube(grid, 1, 0);
    setCube(grid, 1, 1);
    setCube(grid, 1, 2);
    // Add cladding to connect them
    addCladding(grid, 1, 0, ['left', 'right']);
    addCladding(grid, 1, 1, ['left', 'right']);
    addCladding(grid, 1, 2, ['left', 'right']);
    const result = calculateRequirements(grid);
    logTestCase('Three Cubes Line', grid, result);
    // Three cubes in line with 8 edges total
    expect(result).toEqual({
      fourPackRegular: 1,     // 1 four-pack (2 side + 1 left + 1 right)
      fourPackExtraTall: 0,
      twoPackRegular: 2,     // 2 two-packs for remaining 4 sides
      twoPackExtraTall: 0,
      leftPanels: 0,          // Used in four-pack
      rightPanels: 0,         // Used in four-pack
      sidePanels: 0,          // All used in packs
      cornerConnectors: 0,
      straightCouplings: 2     // 2 straight connections
    });
  });

  test('L-shaped configuration with cladding', () => {
    const grid = createEmptyGrid();
    setCube(grid, 1, 1); // Center
    setCube(grid, 1, 2); // Right
    setCube(grid, 2, 1); // Bottom
    // Add cladding to the L-shape
    addCladding(grid, 1, 1, ['right', 'bottom']);
    addCladding(grid, 1, 2, ['left']);
    addCladding(grid, 2, 1, ['top']);
    const result = calculateRequirements(grid);
    logTestCase('L-shaped Configuration', grid, result);
    // L-shaped with 8 edges total
    expect(result).toEqual({
      fourPackRegular: 1,     // 1 four-pack (2 side + 1 left + 1 right)
      fourPackExtraTall: 0,
      twoPackRegular: 2,     // 2 two-packs for remaining sides
      twoPackExtraTall: 0,
      leftPanels: 1,          // 1 extra left panel
      rightPanels: 0,         // Used in four-pack
      sidePanels: 0,          // All used in packs
      cornerConnectors: 1,     // 1 L-connection
      straightCouplings: 1     // 1 straight connection
    });
  });

  test('U-shaped configuration', () => {
    const grid = createEmptyGrid();
    setCube(grid, 2, 0); // Bottom left
    setCube(grid, 2, 1); // Bottom center
    setCube(grid, 2, 2); // Bottom right
    setCube(grid, 1, 0); // Middle left
    setCube(grid, 1, 2); // Middle right
    const result = calculateRequirements(grid);
    logTestCase('U-shaped Configuration', grid, result);
    // U-shaped with 12 edges total
    expect(result).toEqual({
      fourPackRegular: 1,     // 1 four-pack (2 side + 1 left + 1 right)
      fourPackExtraTall: 0,
      twoPackRegular: 2,     // 2 two-packs for remaining sides
      twoPackExtraTall: 0,
      leftPanels: 2,          // 2 extra left panels
      rightPanels: 2,         // 2 extra right panels
      sidePanels: 0,          // All used in packs
      cornerConnectors: 2,     // 2 corner connections
      straightCouplings: 2     // 2 straight connections
    });
  });

  test('all corners configuration', () => {
    const grid = createEmptyGrid();
    // Create a plus shape to test all corner types
    setCube(grid, 0, 1); // Top
    setCube(grid, 1, 0); // Left
    setCube(grid, 1, 1); // Center
    setCube(grid, 1, 2); // Right
    setCube(grid, 2, 1); // Bottom
    const result = calculateRequirements(grid);
    logTestCase('All Corners Configuration', grid, result);
    // Plus shape with 12 edges total
    expect(result).toEqual({
      fourPackRegular: 1,     // 1 four-pack (2 side + 1 left + 1 right)
      fourPackExtraTall: 0,
      twoPackRegular: 2,     // 2 two-packs for remaining sides
      twoPackExtraTall: 0,
      leftPanels: 2,          // 2 extra left panels
      rightPanels: 2,         // 2 extra right panels
      sidePanels: 0,          // All used in packs
      cornerConnectors: 4,     // 4 corner connections in plus shape
      straightCouplings: 2     // 2 straight connections
    });
  });
});
