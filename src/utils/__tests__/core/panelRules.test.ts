import { determinePanelConfiguration } from '@/utils/core/panelRules';
import { GridCell, CompassDirection } from '@/components/types';
import { createFlowCell } from '@/utils/core/gridCell';
import { createTestGrid } from '@/utils/testing/testHelpers';

describe('Panel Rules', () => {
  describe('Straight Line Configuration', () => {
    it('should correctly determine panels for a straight line of 3 cubes', () => {
      // Create a straight line: [0,0] -> [0,1] -> [0,2] with proper flow connections
      const grid = createTestGrid(
        [[1, 1, 1]],
        {
          '0,0': { entry: 'W', exit: 'E' },
          '0,1': { entry: 'W', exit: 'E' },
          '0,2': { entry: 'W', exit: 'E' }
        }
      );
      
      // First cube (start)
      const startConfig = determinePanelConfiguration(grid, 0, 0);
      expect(startConfig).toHaveLength(3);
      expect(startConfig).toContainEqual({ type: 'left', direction: 'N' });
      expect(startConfig).toContainEqual({ type: 'right', direction: 'S' });
      expect(startConfig).toContainEqual({ type: 'side', direction: 'W' });
      
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
      // Create an L shape: [0,0] -> [0,1] -> [1,1]
      const grid = createTestGrid(
        [
          [1, 1],
          [0, 1]
        ],
        {
          '0,0': { entry: 'W', exit: 'E' },
          '0,1': { entry: 'W', exit: 'S' },
          '1,1': { entry: 'N', exit: 'E' }
        }
      );
      
      // First cube (top)
      const topConfig = determinePanelConfiguration(grid, 0, 0);
      expect(topConfig).toHaveLength(3);
      expect(topConfig).toContainEqual({ type: 'left', direction: 'N' });
      expect(topConfig).toContainEqual({ type: 'right', direction: 'S' });
      expect(topConfig).toContainEqual({ type: 'side', direction: 'W' });
      
      // Corner cube
      const cornerConfig = determinePanelConfiguration(grid, 0, 1);
      expect(cornerConfig).toHaveLength(2);
      expect(cornerConfig).toContainEqual({ type: 'left', direction: 'N' });
      expect(cornerConfig).toContainEqual({ type: 'right', direction: 'E' });
      
      // Bottom cube
      const bottomConfig = determinePanelConfiguration(grid, 1, 1);
      expect(bottomConfig).toHaveLength(3);
      expect(bottomConfig).toContainEqual({ type: 'left', direction: 'W' });
      expect(bottomConfig).toContainEqual({ type: 'right', direction: 'S' });
      expect(bottomConfig).toContainEqual({ type: 'side', direction: 'E' });
    });
  });
  
  describe('U-Shape Configuration', () => {
    it('should correctly determine panels for a U-shaped configuration', () => {
      // Create a U shape: 
      const grid = createTestGrid(
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
      );
      
      // First corner cube
      const topLeftConfig = determinePanelConfiguration(grid, 0, 0);
      expect(topLeftConfig).toHaveLength(3);
      expect(topLeftConfig).toContainEqual({ type: 'left', direction: 'W' });
      expect(topLeftConfig).toContainEqual({ type: 'right', direction: 'N' });
      expect(topLeftConfig).toContainEqual({ type: 'side', direction: 'E' });
      
      // Top middle cube
      const topMiddleConfig = determinePanelConfiguration(grid, 0, 1);
      expect(topMiddleConfig).toHaveLength(2);
      expect(topMiddleConfig).toContainEqual({ type: 'left', direction: 'N' });
      expect(topMiddleConfig).toContainEqual({ type: 'right', direction: 'S' });
      
      // Second corner cube
      const topRightConfig = determinePanelConfiguration(grid, 0, 2);
      expect(topRightConfig).toHaveLength(3);
      expect(topRightConfig).toContainEqual({ type: 'left', direction: 'N' });
      expect(topRightConfig).toContainEqual({ type: 'right', direction: 'E' });
      expect(topRightConfig).toContainEqual({ type: 'side', direction: 'S' });
    });
  });
});
