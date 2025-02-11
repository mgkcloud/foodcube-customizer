import { determinePanelConfiguration } from '../../core/panelRules';
import { GridCell } from '@/components/types';

describe('Panel Rules', () => {
  const createEmptyGrid = (size: number): GridCell[][] => {
    return Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        hasCube: false,
        claddingEdges: new Set(),
      }))
    );
  };

  const createGridWithPath = (path: [number, number][]): GridCell[][] => {
    const size = Math.max(...path.flat()) + 1;
    const grid = createEmptyGrid(size);
    path.forEach(([row, col]) => {
      grid[row][col].hasCube = true;
    });
    return grid;
  };

  describe('Straight Line Configuration', () => {
    it('should correctly determine panels for a straight line of 3 cubes', () => {
      // Create a straight line: [0,0] -> [0,1] -> [0,2]
      const grid = createGridWithPath([[0,0], [0,1], [0,2]]);
      
      // First cube (start)
      const startConfig = determinePanelConfiguration(grid, 0, 0);
      expect(startConfig).toHaveLength(3);
      expect(startConfig).toContainEqual({ type: 'left', direction: 'N' });
      expect(startConfig).toContainEqual({ type: 'right', direction: 'S' });
      expect(startConfig).toContainEqual({ type: 'side', direction: 'E' });

      // Middle cube
      const middleConfig = determinePanelConfiguration(grid, 0, 1);
      expect(middleConfig).toHaveLength(2);
      expect(middleConfig).toContainEqual({ type: 'left', direction: 'N' });
      expect(middleConfig).toContainEqual({ type: 'right', direction: 'S' });

      // Last cube (end)
      const endConfig = determinePanelConfiguration(grid, 0, 2);
      expect(endConfig).toHaveLength(3);
      expect(endConfig).toContainEqual({ type: 'left', direction: 'N' });
      expect(endConfig).toContainEqual({ type: 'right', direction: 'S' });
      expect(endConfig).toContainEqual({ type: 'side', direction: 'E' });
    });
  });

  describe('L-Shape Configuration', () => {
    it('should correctly determine panels for an L-shaped configuration', () => {
      // Create an L-shape: [0,0] -> [1,0] -> [1,1]
      const grid = createGridWithPath([[0,0], [1,0], [1,1]]);
      
      // First cube (top)
      const topConfig = determinePanelConfiguration(grid, 0, 0);
      expect(topConfig).toHaveLength(3);
      expect(topConfig).toContainEqual({ type: 'left', direction: 'W' });
      expect(topConfig).toContainEqual({ type: 'right', direction: 'E' });
      expect(topConfig).toContainEqual({ type: 'side', direction: 'S' });

      // Middle cube (corner)
      const cornerConfig = determinePanelConfiguration(grid, 1, 0);
      expect(cornerConfig).toHaveLength(2);
      expect(cornerConfig).toContainEqual({ type: 'left', direction: 'S' });
      expect(cornerConfig).toContainEqual({ type: 'right', direction: 'N' });

      // Last cube (end)
      const endConfig = determinePanelConfiguration(grid, 1, 1);
      expect(endConfig).toHaveLength(3);
      expect(endConfig).toContainEqual({ type: 'left', direction: 'N' });
      expect(endConfig).toContainEqual({ type: 'right', direction: 'S' });
      expect(endConfig).toContainEqual({ type: 'side', direction: 'E' });
    });
  });

  describe('U-Shape Configuration', () => {
    it('should correctly determine panels for a U-shaped configuration', () => {
      // Create a U-shape: [0,0] -> [1,0] -> [2,0] -> [2,1]
      const grid = createGridWithPath([[0,0], [1,0], [2,0], [2,1]]);
      
      // First cube (top)
      const topConfig = determinePanelConfiguration(grid, 0, 0);
      expect(topConfig).toHaveLength(3);
      expect(topConfig).toContainEqual({ type: 'left', direction: 'W' });
      expect(topConfig).toContainEqual({ type: 'right', direction: 'E' });
      expect(topConfig).toContainEqual({ type: 'side', direction: 'S' });

      // First corner
      const corner1Config = determinePanelConfiguration(grid, 1, 0);
      expect(corner1Config).toHaveLength(2);
      expect(corner1Config).toContainEqual({ type: 'left', direction: 'W' });
      expect(corner1Config).toContainEqual({ type: 'right', direction: 'E' });

      // Second corner
      const corner2Config = determinePanelConfiguration(grid, 2, 0);
      expect(corner2Config).toHaveLength(2);
      expect(corner2Config).toContainEqual({ type: 'left', direction: 'S' });
      expect(corner2Config).toContainEqual({ type: 'right', direction: 'N' });

      // End cube
      const endConfig = determinePanelConfiguration(grid, 2, 1);
      expect(endConfig).toHaveLength(3);
      expect(endConfig).toContainEqual({ type: 'left', direction: 'N' });
      expect(endConfig).toContainEqual({ type: 'right', direction: 'S' });
      expect(endConfig).toContainEqual({ type: 'side', direction: 'E' });
    });
  });
});
