import { createTestGrid } from './testUtils';
import { CompassDirection } from './types';
import { validateConfiguration } from './validationUtils';
import { IRRIGATION_RULES } from './irrigationRules';

describe('Irrigation Validation Rules', () => {
  describe('Single Cube Configuration', () => {
    it('should validate single cube with valid flow', () => {
      const grid = createTestGrid(
        [[1]],
        {
          '0,0': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection }
        }
      );

      const [row, col] = [0, 0];
      const cell = grid[row][col];
      
      expect(validateConfiguration.hasValidConnections(cell)).toBe(true);
      expect(validateConfiguration.hasValidFlow(cell.connections!.entry, cell.connections!.exit)).toBe(true);
      expect(validateConfiguration.countIncomingConnections(grid, row, col)).toBe(0);
    });
  });

  describe('Line Configuration', () => {
    it('should validate three cubes in a line', () => {
      const grid = createTestGrid(
        [[1, 1, 1]],
        {
          '0,0': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },
          '0,1': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },
          '0,2': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection }
        }
      );

      // Check middle cube connections
      const [row, col] = [0, 1];
      const cell = grid[row][col];
      
      expect(validateConfiguration.hasValidConnections(cell)).toBe(true);
      expect(validateConfiguration.hasValidFlow(cell.connections!.entry, cell.connections!.exit)).toBe(true);
      expect(validateConfiguration.countIncomingConnections(grid, row, col)).toBe(1);
      expect(validateConfiguration.isContinuousFlow('E', 'W')).toBe(true);
    });
  });

  describe('L-Shape Configuration', () => {
    it('should validate L-shaped configuration', () => {
      const grid = createTestGrid(
        [[1, 1],
         [0, 1]],
        {
          '0,0': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },
          '0,1': { entry: 'W' as CompassDirection, exit: 'S' as CompassDirection },
          '1,1': { entry: 'N' as CompassDirection, exit: 'S' as CompassDirection }
        }
      );

      // Check corner cube
      const [row, col] = [0, 1];
      const cell = grid[row][col];
      
      expect(validateConfiguration.hasValidConnections(cell)).toBe(true);
      expect(validateConfiguration.hasValidFlow(cell.connections!.entry, cell.connections!.exit)).toBe(true);
      expect(validateConfiguration.countIncomingConnections(grid, row, col)).toBe(1);
      expect(validateConfiguration.isContinuousFlow('E', 'W')).toBe(true);
    });
  });

  describe('U-Shape Configuration', () => {
    it('should validate U-shaped configuration', () => {
      const grid = createTestGrid(
        [[1, 1, 1],
         [1, 0, 1]],
        {
          '0,0': { entry: 'W' as CompassDirection, exit: 'S' as CompassDirection },
          '1,0': { entry: 'N' as CompassDirection, exit: 'E' as CompassDirection },
          '1,1': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },
          '1,2': { entry: 'W' as CompassDirection, exit: 'N' as CompassDirection },
          '0,2': { entry: 'S' as CompassDirection, exit: 'E' as CompassDirection }
        }
      );

      // Check first corner cube
      const [row, col] = [0, 0];
      const cell = grid[row][col];
      
      expect(validateConfiguration.hasValidConnections(cell)).toBe(true);
      expect(validateConfiguration.hasValidFlow(cell.connections!.entry, cell.connections!.exit)).toBe(true);
      expect(validateConfiguration.countIncomingConnections(grid, row, col)).toBe(0);
    });
  });

  describe('Invalid Configurations', () => {
    it('should reject T-junctions', () => {
      const grid = createTestGrid(
        [[0, 1, 0],
         [1, 1, 1]],
        {
          '0,1': { entry: 'S' as CompassDirection, exit: 'N' as CompassDirection },
          '1,0': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },
          '1,1': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },
          '1,2': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection }
        }
      );

      // Check T-junction cube
      const [row, col] = [1, 1];
      const cell = grid[row][col];
      
      // Should have too many incoming connections
      expect(validateConfiguration.countIncomingConnections(grid, row, col)).toBeGreaterThan(1);
    });
  });
});
