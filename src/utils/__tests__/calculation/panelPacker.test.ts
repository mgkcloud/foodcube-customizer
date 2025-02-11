import { packPanels } from '../../calculation/panelPacker';
import { Requirements } from '@/components/types';

describe('packPanels', () => {
  // Truth: For a single cube with all edges(4 edges) cladded
  test('single cube with all edges cladded', () => {
    const counts: Requirements = {
      sidePanels: 2,  // top and bottom
      leftPanels: 1,  // left
      rightPanels: 1, // right
      fourPackRegular: 0,
      fourPackExtraTall: 0,
      twoPackRegular: 0,
      twoPackExtraTall: 0,
      straightCouplings: 0,
      cornerConnectors: 0
    };

    const result = packPanels(counts);
      expect(result).toEqual({
        fourPackRegular: 1,     // Uses 2 side + 1 left + 1 right
        fourPackExtraTall: 0,
        twoPackRegular: 0,
        twoPackExtraTall: 0,
        leftPanels: 0,
        rightPanels: 0,
        sidePanels: 0,
        straightCouplings: 0,
        cornerConnectors: 0
      });
  });

  // Truth: For three cubes in a line(8 edges)
  test('three cubes in a line with cladding', () => {
    const counts: Requirements = {
      sidePanels: 6,  // 3 pairs of top/bottom
      leftPanels: 1,  // leftmost cube
      rightPanels: 1, // rightmost cube
      fourPackRegular: 0,
      fourPackExtraTall: 0,
      twoPackRegular: 0,
      twoPackExtraTall: 0,
      straightCouplings: 2,
      cornerConnectors: 0
    };

    const result = packPanels(counts);
      expect(result).toEqual({
        fourPackRegular: 1,     // Uses 2 side + 1 left + 1 right
        fourPackExtraTall: 0,
        twoPackRegular: 2,     // Uses remaining 4 side panels (2 two-packs)
        twoPackExtraTall: 0,
        leftPanels: 0,
        rightPanels: 0,
        sidePanels: 0,
        straightCouplings: 2,   // Two straight couplings between cubes
        cornerConnectors: 0
      });
  });

  // Truth: For L-shaped configuration(8 edges)
  test('L-shaped configuration with cladding', () => {
    const counts: Requirements = {
      sidePanels: 5,  // 2 pairs of top/bottom + 1 extra side
      leftPanels: 2,  // 1 for 4-pack + 1 extra
      rightPanels: 1, // 1 for 4-pack
      fourPackRegular: 0,
      fourPackExtraTall: 0,
      twoPackRegular: 0,
      twoPackExtraTall: 0,
      straightCouplings: 1,
      cornerConnectors: 1
    };

    const result = packPanels(counts);
      expect(result).toEqual({
        fourPackRegular: 1,     // Uses 2 side + 1 left + 1 right
        fourPackExtraTall: 0,
        twoPackRegular: 1,     // Uses 2 side panels (1 two-pack)
        twoPackExtraTall: 0,
        leftPanels: 1,         // 1 extra left panel
        rightPanels: 0,        // Used in four-pack
        sidePanels: 1,         // 1 extra side panel at turn
        straightCouplings: 1,   // One straight coupling
        cornerConnectors: 1     // One corner connector
      });
  });

  // Truth: For U-shaped configuration(12 edges)
  test('U-shaped configuration with cladding', () => {
    const counts: Requirements = {
      sidePanels: 8,  // 3 pairs of top/bottom
      leftPanels: 2,  // 2 left edges
      rightPanels: 2, // 2 right edges
      fourPackRegular: 0,
      fourPackExtraTall: 0,
      twoPackRegular: 0,
      twoPackExtraTall: 0,
      straightCouplings: 2,
      cornerConnectors: 2
    };

    const result = packPanels(counts);
      expect(result).toEqual({
        fourPackRegular: 2,     // Uses 4 side + 2 left + 2 right
        fourPackExtraTall: 0,
        twoPackRegular: 2,      // Uses remaining 4 side panels
        twoPackExtraTall: 0,
        leftPanels: 0,         
        rightPanels: 0,      
        sidePanels: 0,
        straightCouplings: 2,    // Two straight couplings
        cornerConnectors: 2      // Two corner connectors
      });
  });
});
