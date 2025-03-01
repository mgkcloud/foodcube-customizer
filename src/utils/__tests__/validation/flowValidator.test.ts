import { GridCell } from '@/components/types';
import { validateIrrigationPath, clearConnectedCubesCache } from '@/utils/validation/flowValidator';
import { countPanels } from '@/utils/calculation/panelCounter';

// Helper to create grid cells
const createGridCell = (hasCube: boolean = false, row: number = 0, col: number = 0): GridCell => ({
  id: `${row},${col}`,
  row,
  col,
  hasCube,
  connections: { entry: null, exit: null },
  rotation: 0,
  type: 'standard',
  claddingEdges: new Set(),
  excludedCladdingEdges: new Set()
});

// Helper to create an empty test grid
const createEmptyGrid = (rows: number, cols: number): GridCell[][] => {
  const grid: GridCell[][] = [];
  for (let i = 0; i < rows; i++) {
    grid[i] = [];
    for (let j = 0; j < cols; j++) {
      grid[i][j] = createGridCell(false, i, j);
    }
  }
  return grid;
};

describe('Flow Validator Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearConnectedCubesCache();
  });

  test('Single cube configuration', () => {
    // Create 3x3 grid with a single cube in the center
    const grid = createEmptyGrid(3, 3);
    grid[1][1].hasCube = true;

    // Validate flow path
    expect(validateIrrigationPath(grid)).toBe(true);

    // Calculate requirements
    const requirements = countPanels(grid);

    // Expected requirements for a single cube
    expect(requirements.fourPackRegular).toBe(1);
    expect(requirements.twoPackRegular).toBe(0);
    expect(requirements.sidePanels).toBe(0);
    expect(requirements.leftPanels).toBe(0);
    expect(requirements.rightPanels).toBe(0);
    expect(requirements.straightCouplings).toBe(0);
    expect(requirements.cornerConnectors).toBe(0);
  });

  test('Straight line configuration', () => {
    // Create 3x5 grid with 3 cubes in a line
    const grid = createEmptyGrid(3, 5);
    grid[1][1].hasCube = true;
    grid[1][2].hasCube = true;
    grid[1][3].hasCube = true;

    // Validate flow path
    expect(validateIrrigationPath(grid)).toBe(true);

    // Calculate requirements
    const requirements = countPanels(grid);

    // Expected requirements for 3 cubes in a line
    expect(requirements.fourPackRegular).toBe(1);
    expect(requirements.twoPackRegular).toBe(2);
    expect(requirements.sidePanels).toBe(0);
    expect(requirements.leftPanels).toBe(0);
    expect(requirements.rightPanels).toBe(0);
    expect(requirements.straightCouplings).toBe(2);
    expect(requirements.cornerConnectors).toBe(0);
  });

  test('L-shaped configuration', () => {
    // Create 3x3 grid with 3 cubes in an L-shape
    const grid = createEmptyGrid(3, 3);
    grid[1][0].hasCube = true;
    grid[1][1].hasCube = true;
    grid[2][1].hasCube = true;

    // Validate flow path
    expect(validateIrrigationPath(grid)).toBe(true);

    // Calculate requirements
    const requirements = countPanels(grid);

    // Expected requirements for L-shaped configuration
    expect(requirements.fourPackRegular).toBe(1);
    expect(requirements.twoPackRegular).toBe(2);
    expect(requirements.sidePanels).toBe(0);
    expect(requirements.leftPanels).toBe(1);
    expect(requirements.rightPanels).toBe(0);
    expect(requirements.straightCouplings).toBe(1);
    expect(requirements.cornerConnectors).toBe(1);
  });

  test('U-shaped configuration', () => {
    // Create 3x4 grid with 5 cubes in a U-shape
    const grid = createEmptyGrid(3, 4);
    grid[0][0].hasCube = true;
    grid[1][0].hasCube = true;
    grid[2][0].hasCube = true;
    grid[2][1].hasCube = true;
    grid[2][2].hasCube = true;

    // Validate flow path
    expect(validateIrrigationPath(grid)).toBe(true);

    // Calculate requirements
    const requirements = countPanels(grid);

    // Expected requirements for U-shaped configuration
    expect(requirements.fourPackRegular).toBe(1);
    expect(requirements.twoPackRegular).toBe(2);
    expect(requirements.sidePanels).toBe(0);
    expect(requirements.leftPanels).toBe(0);
    expect(requirements.rightPanels).toBe(0);
    expect(requirements.straightCouplings).toBe(2);
    expect(requirements.cornerConnectors).toBe(2);
  });
}); 