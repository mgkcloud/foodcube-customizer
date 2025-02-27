import { GridCell, CompassDirection } from '@/components/types';
import { createEmptyCell } from '@/utils/core/gridCell';
import { IRRIGATION_RULES } from '@/utils/core/irrigationRules';

/**
 * Interface representing a cell with flow connections
 */
export interface FlowCell extends GridCell {
  connections: {
    entry: CompassDirection | null;
    exit: CompassDirection | null;
  };
}

/**
 * Creates a cell with specified entry and exit flow connections
 */
export function createFlowCell(entry: CompassDirection, exit: CompassDirection): FlowCell {
  const baseCell = createEmptyCell();
  return {
    ...baseCell,
    hasCube: true,
    id: `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    row: 0,
    col: 0,
    type: 'cube',
    connections: { entry, exit }
  };
}

/**
 * Interface for cell connection definitions
 */
export interface CellConnections {
  entry: CompassDirection;
  exit: CompassDirection;
}

/**
 * Creates a test grid with specified cube placements and connections
 * @param layout - 2D array where 1 represents a cube, 0 represents empty space
 * @param connections - Optional map of cell coordinates to entry/exit connections
 * @returns A grid of cells with the specified cubes and connections
 */
export function createTestGrid(
  layout: number[][],
  connections: Record<string, CellConnections> = {}
): GridCell[][] {
  const grid: GridCell[][] = [];

  for (let row = 0; row < layout.length; row++) {
    grid[row] = [];
    for (let col = 0; col < layout[row].length; col++) {
      const key = `${row},${col}`;
      const cellConnections = connections[key];
      
      if (layout[row][col] === 1) {
        const baseCell = createEmptyCell();
        if (cellConnections) {
          grid[row][col] = {
            ...baseCell,
            id: `cell-${row}-${col}`,
            row,
            col,
            hasCube: true,
            type: 'cube',
            connections: { 
              entry: cellConnections.entry,
              exit: cellConnections.exit 
            }
          };
        } else {
          grid[row][col] = { 
            ...baseCell,
            id: `cell-${row}-${col}`,
            row,
            col,
            hasCube: true,
            type: 'cube'
          };
        }
      } else {
        const emptyCell = createEmptyCell();
        grid[row][col] = {
          ...emptyCell,
          id: `cell-${row}-${col}`,
          row,
          col,
          type: 'empty'
        };
      }
    }
  }

  return grid;
}

/**
 * Creates standard test configurations for different shapes
 */
export const TEST_CONFIGURATIONS = {
  /**
   * Creates a single cube test grid with flow
   * @returns A grid with a single cube and flow path
   */
  createSingleCube: () => createTestGrid(
    [[1]],
    {
      '0,0': { entry: 'W', exit: 'E' }
    }
  ),

  /**
   * Creates a 3-cube line test grid with flow
   * @returns A grid with three cubes in a line and a flow path
   */
  createThreeCubeLine: () => createTestGrid(
    [[1, 1, 1]],
    {
      '0,0': { entry: 'W', exit: 'E' },
      '0,1': { entry: 'W', exit: 'E' },
      '0,2': { entry: 'W', exit: 'E' }
    }
  ),

  /**
   * Creates an L-shaped test grid with flow
   * @returns A grid with an L-shaped configuration and flow path
   */
  createLShape: () => createTestGrid(
    [
      [1, 1],
      [0, 1]
    ],
    {
      '0,0': { entry: 'W', exit: 'E' },
      '0,1': { entry: 'W', exit: 'S' },
      '1,1': { entry: 'N', exit: 'S' }
    }
  ),

  /**
   * Creates a U-shaped test grid with flow
   * @returns A grid with a U-shaped configuration and flow path
   */
  createUShape: () => createTestGrid(
    [
      [1, 1, 1],
      [1, 0, 1]
    ],
    {
      '1,0': { entry: 'N', exit: 'S' },
      '0,0': { entry: 'N', exit: 'E' },
      '0,1': { entry: 'W', exit: 'E' },
      '0,2': { entry: 'W', exit: 'S' },
      '1,2': { entry: 'N', exit: 'S' }
    }
  )
};

/**
 * Expected panel results based on IRRIGATION_RULES
 */
export const EXPECTED_RESULTS = {
  SINGLE_CUBE: {
    sidePanels: 2,
    leftPanels: 1,
    rightPanels: 1,
    straightCouplings: 0,
    cornerConnectors: 0,
    
    // Packed results
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 0,
    twoPackExtraTall: 0
  },
  
  THREE_LINE: {
    sidePanels: 6,
    leftPanels: 1,
    rightPanels: 1,
    straightCouplings: 2,
    cornerConnectors: 0,
    
    // Packed results
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 2,
    twoPackExtraTall: 0
  },
  
  L_SHAPE: {
    sidePanels: 5,
    leftPanels: 2,
    rightPanels: 1,
    straightCouplings: 1,
    cornerConnectors: 1,
    
    // Packed results
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 1,
    twoPackExtraTall: 0,
    extraLeftPanel: 1 // Extra left panel
  },
  
  U_SHAPE: {
    sidePanels: 6,
    leftPanels: 2,
    rightPanels: 2,
    straightCouplings: 2,
    cornerConnectors: 2,
    
    // Packed results
    fourPackRegular: 1,
    fourPackExtraTall: 0,
    twoPackRegular: 2,
    twoPackExtraTall: 0
  }
};
