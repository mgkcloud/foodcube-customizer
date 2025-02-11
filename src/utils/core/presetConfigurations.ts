import { GridCell, CompassDirection } from './types';
import { createTestGrid } from '../testing/testUtils';

export const createSingleCube = (): GridCell[][] => {
  return createTestGrid(
    [[1]],
    {
      '0,0': { entry: 'W', exit: 'E' }  // Simple W→E flow
    }
  );
};

export const createLineCubes = (): GridCell[][] => {
  return createTestGrid(
    [[1, 1, 1]],
    {
      '0,0': { entry: 'W', exit: 'E' },  // Start of flow
      '0,1': { entry: 'W', exit: 'E' },  // Middle
      '0,2': { entry: 'W', exit: 'E' }   // End of flow
    }
  );
};

export const createLShapeCubes = (): GridCell[][] => {
  return createTestGrid(
    [[1, 1],
     [0, 1]],
    {
      '0,0': { entry: 'W', exit: 'E' },   // Start of flow
      '0,1': { entry: 'W', exit: 'S' },   // Corner turn
      '1,1': { entry: 'N', exit: 'S' }    // End of flow
    }
  );
};

export const createUShapeCubes = (): GridCell[][] => {
  return createTestGrid(
    [[1, 1, 1],
     [1, 0, 1]],
    {
      '0,0': { entry: 'W', exit: 'S' },   // First corner
      '1,0': { entry: 'N', exit: 'E' },   // Bottom left
      '1,1': { entry: 'W', exit: 'E' },   // Bottom middle
      '1,2': { entry: 'W', exit: 'N' },   // Bottom right
      '0,2': { entry: 'S', exit: 'E' }    // Second corner
    }
  );
};

// Helper to validate a configuration matches expected panel counts
export interface ExpectedCounts {
  sidePanels: number;
  leftPanels: number;
  rightPanels: number;
  straightCouplings: number;
  cornerConnectors: number;
}

export const EXPECTED_COUNTS = {
  singleCube: {
    sidePanels: 2,    // Front and back
    leftPanels: 1,    // Left side
    rightPanels: 1,   // Right side
    straightCouplings: 0,
    cornerConnectors: 0
  },
  lineCubes: {
    sidePanels: 6,    // 2 from four-pack + 2 + 2 from two-packs
    leftPanels: 1,    // Left side at start
    rightPanels: 1,   // Right side at end
    straightCouplings: 2,
    cornerConnectors: 0
  },
  lShapeCubes: {
    sidePanels: 5,    // 2 from four-pack + 2 from two-pack + 1 extra
    leftPanels: 2,    // 1 from four-pack + 1 extra
    rightPanels: 1,   // from four-pack
    straightCouplings: 1,
    cornerConnectors: 1
  },
  uShapeCubes: {
    sidePanels: 6,    // 2 from four-pack + 2 + 2 from two-packs
    leftPanels: 1,    // Left side at start
    rightPanels: 1,   // Right side at end
    straightCouplings: 2,
    cornerConnectors: 2
  }
} as const;
