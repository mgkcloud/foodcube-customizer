import { createTestGrid } from '@/utils/testing/testHelpers';
import { CompassDirection } from '@/components/types';
import * as validateConfiguration from '@/utils/validation/configValidator';
import { IRRIGATION_RULES } from '@/utils/core/irrigationRules';

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
      expect(validateConfiguration.countOutgoingConnections(grid, row, col)).toBe(0);
    });

    it('should invalidate single cube with invalid flow', () => {
      const grid = createTestGrid(
        [[1]],
        {
          '0,0': { entry: 'W' as CompassDirection, exit: 'S' as CompassDirection }
        }
      );

      const [row, col] = [0, 0];
      const cell = grid[row][col];
      
      expect(validateConfiguration.hasValidConnections(cell)).toBe(true);
      expect(validateConfiguration.hasValidFlow(cell.connections!.entry, cell.connections!.exit)).toBe(false);
    });
  });

  describe('Linear Configuration', () => {
    it('should validate line of cubes with valid flow', () => {
      const grid = createTestGrid(
        [[1, 1, 1]],
        {
          '0,0': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },
          '0,1': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },
          '0,2': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection }
        }
      );

      // Check each cell's connectivity
      for (let col = 0; col < 3; col++) {
        const [row, currentCol] = [0, col];
        const cell = grid[row][currentCol];

        expect(validateConfiguration.hasValidConnections(cell)).toBe(true);
        expect(validateConfiguration.hasValidFlow(cell.connections!.entry, cell.connections!.exit)).toBe(true);
        
        // First and last cube should only connect to one other
        if (col === 0) {
          expect(validateConfiguration.countIncomingConnections(grid, row, currentCol)).toBe(0);
          expect(validateConfiguration.countOutgoingConnections(grid, row, currentCol)).toBe(1);
        } else if (col === 2) {
          expect(validateConfiguration.countIncomingConnections(grid, row, currentCol)).toBe(1);
          expect(validateConfiguration.countOutgoingConnections(grid, row, currentCol)).toBe(0);
        } else {
          // Middle cube connects to both others
          expect(validateConfiguration.countIncomingConnections(grid, row, currentCol)).toBe(1);
          expect(validateConfiguration.countOutgoingConnections(grid, row, currentCol)).toBe(1);
        }
      }
    });
  });

  describe('L-Shape Configuration', () => {
    it('should validate L-shape with corner connector', () => {
      const grid = createTestGrid(
        [
          [1, 1],
          [0, 1]
        ],
        {
          '0,0': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },
          '0,1': { entry: 'W' as CompassDirection, exit: 'S' as CompassDirection },
          '1,1': { entry: 'N' as CompassDirection, exit: 'S' as CompassDirection }
        }
      );

      // Validate first cube (start of L)
      const firstCell = grid[0][0];
      expect(validateConfiguration.hasValidConnections(firstCell)).toBe(true);
      expect(validateConfiguration.hasValidFlow(firstCell.connections!.entry, firstCell.connections!.exit)).toBe(true);
      expect(validateConfiguration.countIncomingConnections(grid, 0, 0)).toBe(0);
      expect(validateConfiguration.countOutgoingConnections(grid, 0, 0)).toBe(1);

      // Validate corner cube
      const cornerCell = grid[0][1];
      expect(validateConfiguration.hasValidConnections(cornerCell)).toBe(true);
      expect(validateConfiguration.countIncomingConnections(grid, 0, 1)).toBe(1);
      expect(validateConfiguration.countOutgoingConnections(grid, 0, 1)).toBe(1);

      // Validate end cube
      const endCell = grid[1][1];
      expect(validateConfiguration.hasValidConnections(endCell)).toBe(true);
      expect(validateConfiguration.hasValidFlow(endCell.connections!.entry, endCell.connections!.exit)).toBe(true);
      expect(validateConfiguration.countIncomingConnections(grid, 1, 1)).toBe(1);
      expect(validateConfiguration.countOutgoingConnections(grid, 1, 1)).toBe(0);
    });
  });
});
