import { countPanels } from './panelCounter';
import { createTestGrid } from './testUtils';
import { CompassDirection } from './types';

import { CONFIGURATION_RULES } from '../../core/rules';

describe('Panel Counter - Irrigation Path Based', () => {
  describe('Single Cube Configuration', () => {
    const config = CONFIGURATION_RULES.SINGLE_CUBE;
    it('should count panels correctly for a single cube with irrigation path (4 edges)', () => {
      // Single cube with flow from West to East
      const grid = createTestGrid(
        [[1]],
        {
          '0,0': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection }  // Flow W→E
        }
      );
      
      const result = countPanels(grid);
      expect(result).toEqual({
        sidePanels: 2,    // 2 side panels (four-pack)
        leftPanels: 1,    // 1 left panel (four-pack)
        rightPanels: 1,   // 1 right panel (four-pack)
        straightCouplings: 0,
        cornerConnectors: 0
      });
    });
  });

  describe('Line Configuration', () => {
    const config = CONFIGURATION_RULES.THREE_LINE;
    it('should count panels correctly for three cubes in a line (8 edges)', () => {
      // Three cubes with continuous flow West to East
      const grid = createTestGrid(
        [[1, 1, 1]],
        {
          '0,0': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },  // Start of flow
          '0,1': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },  // Middle of flow
          '0,2': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection }   // End of flow
        }
      );
      
      const result = countPanels(grid);
      expect(result).toEqual({
        sidePanels: 6,    // 2 from four-pack + 2 from first two-pack + 2 from second two-pack
        leftPanels: 1,    // 1 from four-pack
        rightPanels: 1,   // 1 from four-pack
        straightCouplings: 2,  // 2 straight connections between cubes
        cornerConnectors: 0
      });

      // Verify total edges matches panel count
      expect(result.sidePanels + result.leftPanels + result.rightPanels).toBe(8); // 8 edges total
    });

    it('should count panels correctly for three cubes in a vertical line', () => {
      // Three cubes with continuous flow North to South
      const grid = createTestGrid(
        [[1],
         [1],
         [1]],
        {
          '0,0': { entry: 'N' as CompassDirection, exit: 'S' as CompassDirection },  // Start of flow
          '1,0': { entry: 'N' as CompassDirection, exit: 'S' as CompassDirection },  // Middle of flow
          '2,0': { entry: 'N' as CompassDirection, exit: 'S' as CompassDirection }   // End of flow
        }
      );
      
      const result = countPanels(grid);
      expect(result).toEqual({
        sidePanels: 6,    // 2 from four-pack + 2 from first two-pack + 2 from second two-pack
        leftPanels: 1,    // 1 from four-pack
        rightPanels: 1,   // 1 from four-pack
        straightCouplings: 2,  // 2 straight connections between cubes
        cornerConnectors: 0
      });

      // Verify total edges matches panel count
      expect(result.sidePanels + result.leftPanels + result.rightPanels).toBe(8); // 8 edges total
    });

    it('should reject T-junction configurations', () => {
      // Attempt to create T-junction (should be invalid)
      const grid = createTestGrid(
        [[0, 1, 0],
         [1, 1, 1]],
        {
          '0,1': { entry: 'S' as CompassDirection, exit: 'N' as CompassDirection },  // Vertical piece
          '1,0': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },  // Horizontal flow
          '1,1': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },
          '1,2': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection }
        }
      );
      
      const result = countPanels(grid);
      expect(result).toEqual({
        sidePanels: 0,    // Invalid configuration
        leftPanels: 0,
        rightPanels: 0,
        straightCouplings: 0,
        cornerConnectors: 0
      });
    });
  });

  describe('L-Shape Configuration', () => {
    it('should count panels correctly for L-shaped configuration (8 edges)', () => {
      // L-shape with flow turning from West to South
      const grid = createTestGrid(
        [[1, 1],
         [0, 1]],
        {
          '0,0': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },   // Start of flow
          '0,1': { entry: 'W' as CompassDirection, exit: 'S' as CompassDirection },   // Corner turn
          '1,1': { entry: 'N' as CompassDirection, exit: 'S' as CompassDirection }    // End of flow
        }
      );
      
      const result = countPanels(grid);
      expect(result).toEqual({
        sidePanels: 5,    // 2 from four-pack + 2 from two-pack + 1 extra side
        leftPanels: 2,    // 1 from four-pack + 1 extra after turn
        rightPanels: 1,   // 1 from four-pack
        straightCouplings: 1,  // 1 straight connection
        cornerConnectors: 1    // 1 corner turn
      });

      // Verify total edges matches panel count
      expect(result.sidePanels + result.leftPanels + result.rightPanels).toBe(8); // 8 edges total
    });

    it('should count panels correctly for L-shaped configuration in opposite direction', () => {
      // L-shape with flow turning from East to South
      const grid = createTestGrid(
        [[1, 1],
         [1, 0]],
        {
          '0,1': { entry: 'E' as CompassDirection, exit: 'W' as CompassDirection },   // Start of flow
          '0,0': { entry: 'E' as CompassDirection, exit: 'S' as CompassDirection },   // Corner turn
          '1,0': { entry: 'N' as CompassDirection, exit: 'S' as CompassDirection }    // End of flow
        }
      );
      
      const result = countPanels(grid);
      expect(result).toEqual({
        sidePanels: 5,    // 2 from four-pack + 2 from two-pack + 1 extra side
        leftPanels: 2,    // 1 from four-pack + 1 extra after turn
        rightPanels: 1,   // 1 from four-pack
        straightCouplings: 1,  // 1 straight connection
        cornerConnectors: 1    // 1 corner turn
      });

      // Verify total edges matches panel count
      expect(result.sidePanels + result.leftPanels + result.rightPanels).toBe(8); // 8 edges total
    });
  });

  describe('U-Shape Configuration', () => {
    it('should count panels correctly for U-shaped configuration (12 edges)', () => {
      // U-shape with flow West→South→East
      const grid = createTestGrid(
        [[1, 1, 1],
         [1, 0, 1]],
        {
          '0,0': { entry: 'W' as CompassDirection, exit: 'S' as CompassDirection },   // First corner
          '1,0': { entry: 'N' as CompassDirection, exit: 'E' as CompassDirection },   // Bottom left
          '1,1': { entry: 'W' as CompassDirection, exit: 'E' as CompassDirection },   // Bottom middle
          '1,2': { entry: 'W' as CompassDirection, exit: 'N' as CompassDirection },   // Bottom right
          '0,2': { entry: 'S' as CompassDirection, exit: 'E' as CompassDirection }    // Second corner
        }
      );
      
      const result = countPanels(grid);
      expect(result).toEqual({
        sidePanels: 6,    // 2 from four-pack + 2 from first two-pack + 2 from second two-pack
        leftPanels: 1,    // 1 from four-pack
        rightPanels: 1,   // 1 from four-pack (used at start)
        straightCouplings: 2,  // 2 straight connections between cubes
        cornerConnectors: 2    // 2 corner turns for U-shape
      });

      // Verify total edges matches panel count (12 edges for U-shape)
      expect(result.sidePanels + result.leftPanels + result.rightPanels).toBe(8); // 8 cladded edges
    });

    it('should handle U-shape with different flow direction', () => {
      // U-shape with flow East→South→West (reversed)
      const grid = createTestGrid(
        [[1, 1, 1],
         [1, 0, 1]],
        {
          '0,2': { entry: 'E' as CompassDirection, exit: 'S' as CompassDirection },   // First corner
          '1,2': { entry: 'N' as CompassDirection, exit: 'W' as CompassDirection },   // Bottom right
          '1,1': { entry: 'E' as CompassDirection, exit: 'W' as CompassDirection },   // Bottom middle
          '1,0': { entry: 'E' as CompassDirection, exit: 'N' as CompassDirection },   // Bottom left
          '0,0': { entry: 'S' as CompassDirection, exit: 'W' as CompassDirection }    // Second corner
        }
      );
      
      const result = countPanels(grid);
      expect(result).toEqual({
        sidePanels: 6,    // 2 from four-pack + 2 from first two-pack + 2 from second two-pack
        leftPanels: 1,    // 1 from four-pack (used at start)
        rightPanels: 1,   // 1 from four-pack
        straightCouplings: 2,  // 2 straight connections between cubes
        cornerConnectors: 2    // 2 corner turns for U-shape
      });

      // Verify total edges matches panel count (12 edges for U-shape)
      expect(result.sidePanels + result.leftPanels + result.rightPanels).toBe(8); // 8 cladded edges
    });
  });
});
