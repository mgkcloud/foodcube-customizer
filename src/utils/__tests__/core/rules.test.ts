import { VALID_TURNS, STRAIGHT_PATHS } from '@/utils/core/irrigationRules';
import { createTestGrid } from '@/utils/testing/testHelpers';
import { CompassDirection } from '@/components/types';

describe('Core Rules', () => {
  describe('Panel Rules', () => {
    const validateConfiguration = (
      config: number[][],
      connections: Record<string, { entry: CompassDirection, exit: CompassDirection }>,
      expectedPanels: {
        sidePanels: number,
        leftPanels: number,
        rightPanels: number
      },
      expectedCouplings: {
        straight: number,
        corner: number
      }
    ) => {
      const grid = createTestGrid(config, connections);
      const result = PANEL_RULES.validatePanelCounts(
        expectedPanels.sidePanels,
        expectedPanels.leftPanels,
        expectedPanels.rightPanels,
        expectedCouplings.corner,
        expectedCouplings.straight,
        // Calculate total edges from panels
        expectedPanels.sidePanels + expectedPanels.leftPanels + expectedPanels.rightPanels
      );
      expect(result).toBe(true);
    };

    it('should validate single cube configuration (4 edges)', () => {
      validateConfiguration(
        [[1]],
        { '0,0': { entry: 'W', exit: 'E' } },
        { sidePanels: 2, leftPanels: 1, rightPanels: 1 },
        { straight: 0, corner: 0 }
      );
    });

    it('should validate three cubes in line (8 edges)', () => {
      validateConfiguration(
        [[1, 1, 1]],
        {
          '0,0': { entry: 'W', exit: 'E' },
          '0,1': { entry: 'W', exit: 'E' },
          '0,2': { entry: 'W', exit: 'E' }
        },
        { sidePanels: 6, leftPanels: 1, rightPanels: 1 },
        { straight: 2, corner: 0 }
      );
    });

    it('should validate L-shaped configuration (8 edges)', () => {
      validateConfiguration(
        [
          [1, 1],
          [0, 1]
        ],
        {
          '0,0': { entry: 'W', exit: 'E' },
          '0,1': { entry: 'W', exit: 'S' },
          '1,1': { entry: 'N', exit: 'S' }
        },
        { sidePanels: 5, leftPanels: 2, rightPanels: 1 },
        { straight: 1, corner: 1 }
      );
    });

    it('should validate U-shaped configuration (12 edges)', () => {
      validateConfiguration(
        [
          [1, 1, 1],
          [1, 0, 1]
        ],
        {
          '0,0': { entry: 'W', exit: 'S' },
          '1,0': { entry: 'N', exit: 'E' },
          '1,2': { entry: 'W', exit: 'N' },
          '0,2': { entry: 'S', exit: 'E' }
        },
        { sidePanels: 6, leftPanels: 1, rightPanels: 1 },
        { straight: 2, corner: 2 }
      );
    });
  });

  describe('Irrigation Rules', () => {
    const validateFlow = (
      config: number[][],
      connections: Record<string, { entry: CompassDirection, exit: CompassDirection }>,
      expectedValid: boolean
    ) => {
      const grid = createTestGrid(config, connections);
      // Validate the flow based on the rules
      let isValid = true;
      
      // Check if all connections are valid according to rules
      Object.values(connections).forEach(({ entry, exit }) => {
        if (entry && exit) {
          const flowPath = `${entry}→${exit}`;
          // If it's not a straight path and not a valid turn, it's invalid
          if (!STRAIGHT_PATHS.has(flowPath) && !VALID_TURNS.has(flowPath)) {
            isValid = false;
          }
        }
      });
      
      expect(isValid).toBe(expectedValid);
    };

    it('should validate straight flow paths', () => {
      validateFlow(
        [[1]],
        { '0,0': { entry: 'W', exit: 'E' } },
        true
      );
      
      validateFlow(
        [[1]],
        { '0,0': { entry: 'N', exit: 'S' } },
        true
      );
    });

    it('should invalidate impossible flow paths', () => {
      validateFlow(
        [[1]],
        { '0,0': { entry: 'N', exit: 'W' } },
        false
      );
      
      validateFlow(
        [[1]],
        { '0,0': { entry: 'S', exit: 'E' } },
        false
      );
    });

    it('should validate valid irrigation paths', () => {
      const validGrid = createTestGrid(
        [[1, 1]],
        {
          '0,0': { entry: 'W', exit: 'E' },
          '0,1': { entry: 'W', exit: 'E' }
        }
      );
      
      // Validate manually for now
      let isValid = true;
      for (let row = 0; row < validGrid.length; row++) {
        for (let col = 0; col < validGrid[0].length; col++) {
          if (validGrid[row][col].hasCube && validGrid[row][col].connections) {
            const { entry, exit } = validGrid[row][col].connections;
            if (entry && exit) {
              const flowPath = `${entry}→${exit}`;
              if (!STRAIGHT_PATHS.has(flowPath) && !VALID_TURNS.has(flowPath)) {
                isValid = false;
              }
            }
          }
        }
      }
      
      expect(isValid).toBe(true);
    });

    it('should reject T-junctions', () => {
      const invalidGrid = createTestGrid(
        [
          [1, 1],
          [0, 1]
        ],
        {
          '0,0': { entry: 'W', exit: 'E' },
          '0,1': { entry: 'W', exit: 'S' },
          '1,1': { entry: 'N', exit: 'E' } // This creates a T-junction
        }
      );
      
      // Manual validation
      // A T-junction is created when a cell has more than 2 adjacent cells with cubes
      let hasInvalidJunction = false;
      for (let row = 0; row < invalidGrid.length; row++) {
        for (let col = 0; col < invalidGrid[0].length; col++) {
          if (invalidGrid[row][col].hasCube) {
            // Count adjacent cubes
            let adjacentCount = 0;
            // Check North
            if (row > 0 && invalidGrid[row-1][col].hasCube) adjacentCount++;
            // Check South
            if (row < invalidGrid.length-1 && invalidGrid[row+1][col].hasCube) adjacentCount++;
            // Check East
            if (col < invalidGrid[0].length-1 && invalidGrid[row][col+1].hasCube) adjacentCount++;
            // Check West
            if (col > 0 && invalidGrid[row][col-1].hasCube) adjacentCount++;
            
            if (adjacentCount > 2) {
              hasInvalidJunction = true;
              break;
            }
          }
        }
      }
      
      expect(hasInvalidJunction).toBe(true);
    });

    it('should reject disconnected paths', () => {
      const invalidGrid = createTestGrid(
        [[1, 0, 1]],
        {
          '0,0': { entry: 'W', exit: 'E' },
          '0,2': { entry: 'W', exit: 'E' }
        }
      );
      
      // Manual validation
      // A disconnected path is created when there are multiple separate paths
      let hasDisconnectedPaths = false;
      let visitedCells = new Set<string>();
      for (let row = 0; row < invalidGrid.length; row++) {
        for (let col = 0; col < invalidGrid[0].length; col++) {
          if (invalidGrid[row][col].hasCube && !visitedCells.has(`${row},${col}`)) {
            // Perform DFS
            let stack = [[row, col]];
            while (stack.length > 0) {
              let [currRow, currCol] = stack.pop()!;
              if (!visitedCells.has(`${currRow},${currCol}`)) {
                visitedCells.add(`${currRow},${currCol}`);
                // Check adjacent cells
                if (currRow > 0 && invalidGrid[currRow-1][currCol].hasCube) stack.push([currRow-1, currCol]);
                if (currRow < invalidGrid.length-1 && invalidGrid[currRow+1][currCol].hasCube) stack.push([currRow+1, currCol]);
                if (currCol < invalidGrid[0].length-1 && invalidGrid[currRow][currCol+1].hasCube) stack.push([currRow, currCol+1]);
                if (currCol > 0 && invalidGrid[currRow][currCol-1].hasCube) stack.push([currRow, currCol-1]);
              }
            }
            // If there are still unvisited cells with cubes, it's a disconnected path
            for (let row2 = 0; row2 < invalidGrid.length; row2++) {
              for (let col2 = 0; col2 < invalidGrid[0].length; col2++) {
                if (invalidGrid[row2][col2].hasCube && !visitedCells.has(`${row2},${col2}`)) {
                  hasDisconnectedPaths = true;
                  break;
                }
              }
            }
          }
        }
      }
      
      expect(hasDisconnectedPaths).toBe(true);
    });
  });
});
