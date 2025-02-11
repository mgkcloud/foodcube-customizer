import { calculateRequirements } from '../calculationUtils';
import { detectConnections } from '../connectionDetector';
import { packPanels } from '../panelPacker';
import { GridCell } from '../../components/types';

const createTestGrid = (config: 'single' | 'line' | 'L' | 'U'): GridCell[][] => {
  const grid: GridCell[][] = Array(3).fill(null).map(() => 
    Array(3).fill(null).map(() => ({ hasCube: false, claddingEdges: new Set() }))
  );

  // Place cubes based on configuration
  switch (config) {
    case 'single':
      grid[1][1].hasCube = true;
      grid[1][1].claddingEdges = new Set(['N', 'E', 'S', 'W']);
      break;
    case 'line':
      grid[1][0].hasCube = true;
      grid[1][1].hasCube = true;
      grid[1][2].hasCube = true;
      grid[1][0].claddingEdges = new Set(['N', 'W', 'S']);
      grid[1][1].claddingEdges = new Set(['N', 'S']);
      grid[1][2].claddingEdges = new Set(['N', 'E', 'S']);
      break;
    case 'L':
      grid[1][1].hasCube = true;
      grid[1][2].hasCube = true;
      grid[2][1].hasCube = true;
      grid[1][1].claddingEdges = new Set(['N', 'W']);
      grid[1][2].claddingEdges = new Set(['N', 'E', 'S']);
      grid[2][1].claddingEdges = new Set(['W', 'S']);
      break;
    case 'U':
      grid[1][0].hasCube = true;
      grid[1][1].hasCube = true;
      grid[1][2].hasCube = true;
      grid[2][0].hasCube = true;
      grid[2][2].hasCube = true;
      grid[1][0].claddingEdges = new Set(['N', 'W']);
      grid[1][1].claddingEdges = new Set(['N']);
      grid[1][2].claddingEdges = new Set(['N', 'E']);
      grid[2][0].claddingEdges = new Set(['W', 'S']);
      grid[2][2].claddingEdges = new Set(['E', 'S']);
      break;
  }

  return grid;
};

describe('Cladding Calculations', () => {
  describe('Single Cube', () => {
    it('should calculate correct requirements for a single cube with all edges cladded', () => {
      const grid = createTestGrid('single');
      const requirements = calculateRequirements(grid);
      
      // For a single cube with all edges(4 edges) cladded, we should get:
      // - 1 four-pack (2 side + 1 left + 1 right)
      expect(requirements).toEqual({
        fourPackRegular: 1,     // 2 side + 1 left + 1 right
        fourPackExtraTall: 0,
        twoPackRegular: 0,
        twoPackExtraTall: 0,
        leftPanels: 0,
        rightPanels: 0,
        sidePanels: 0,
        straightCouplings: 0,   // No connectors needed
        cornerConnectors: 0     // No connectors needed
      });
    });
  });

  describe('Straight Line Configuration', () => {
    it('should calculate correct requirements for three cubes in a line', () => {
      const grid = createTestGrid('line');
      const requirements = calculateRequirements(grid);
      
      // For three cubes in a line(8 edges), we should get:
      // - 1 four-pack (2 side + 1 left + 1 right)
      // - 2 two-packs (4 sides)
      // - 2 straight couplings
      expect(requirements).toEqual({
        fourPackRegular: 1,     // 2 side + 1 left + 1 right
        fourPackExtraTall: 0,
        twoPackRegular: 2,     // 4 sides in two 2-packs
        twoPackExtraTall: 0,
        leftPanels: 0,
        rightPanels: 0,
        sidePanels: 0,
        straightCouplings: 2,   // Two straight connections
        cornerConnectors: 0     // No corners in a line
      });
    });
  });

  describe('L-Shape Configuration', () => {
    it('should calculate correct requirements for L-shape', () => {
      const grid = createTestGrid('L');
      const requirements = calculateRequirements(grid);
      
      // For L-shaped configuration(8 edges), we should get:
      // - 1 four-pack (2 side + 1 right + 1 left)
      // - 1 left panel (1 side)
      // - 2 two-packs (2 sides each)
      // - 1 corner connector
      // - 1 straight coupling
      expect(requirements).toEqual({
        fourPackRegular: 1,     // 2 side + 1 right + 1 left
        fourPackExtraTall: 0,
        twoPackRegular: 2,     // 2 two-packs with 2 sides each
        twoPackExtraTall: 0,
        leftPanels: 1,         // 1 extra left panel
        rightPanels: 0,        // Used in four-pack
        sidePanels: 0,         // All used in packs
        straightCouplings: 1,   // One straight connection
        cornerConnectors: 1     // One corner where L meets
      });
    });
  });

  describe('U-Shape Configuration', () => {
    it('should calculate correct requirements for U-shape', () => {
      const grid = createTestGrid('U');
      const requirements = calculateRequirements(grid);
      
      // For U-shaped configuration(12 edges), we should get:
      // - 1 four-pack (2 side + 1 right + 1 left)
      // - 2 two-packs (4 sides)
      // - 2 corner connectors
      // - 2 straight couplings
      expect(requirements).toEqual({
        fourPackRegular: 1,     // 2 side + 1 right + 1 left
        fourPackExtraTall: 0,
        twoPackRegular: 2,     // 4 sides in two 2-packs
        twoPackExtraTall: 0,
        leftPanels: 0,
        rightPanels: 0,
        sidePanels: 0,
        straightCouplings: 2,   // Two straight connections
        cornerConnectors: 2     // Two corners where U meets
      });
    });
  });
});

