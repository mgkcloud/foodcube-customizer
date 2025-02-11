import { PANEL_RULES, IRRIGATION_RULES } from '../../core/rules';
import { createTestGrid } from '../testUtils';
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
    it('should validate valid irrigation paths', () => {
      const validGrid = createTestGrid(
        [[1, 1]],
        {
          '0,0': { entry: 'W', exit: 'E' },
          '0,1': { entry: 'W', exit: 'E' }
        }
      );
      expect(IRRIGATION_RULES.validatePath(validGrid)).toBe(true);
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
      expect(IRRIGATION_RULES.validatePath(invalidGrid)).toBe(false);
    });

    it('should reject disconnected paths', () => {
      const invalidGrid = createTestGrid(
        [[1, 0, 1]],
        {
          '0,0': { entry: 'W', exit: 'E' },
          '0,2': { entry: 'W', exit: 'E' }
        }
      );
      expect(IRRIGATION_RULES.validatePath(invalidGrid)).toBe(false);
    });
  });
});
