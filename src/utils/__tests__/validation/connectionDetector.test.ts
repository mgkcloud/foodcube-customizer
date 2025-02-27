import { detectConnections } from '@/utils/validation/connectionDetector';
import { createTestGrid } from '@/utils/testing/testHelpers';

describe('detectConnections', () => {
  /**
   * Truth: For a single cube with all edges(4 edges) cladded, we should get:
   * - 1 four-pack (2 side + 1 left + 1 right)
   * - No connectors needed (standalone cube)
   */
  test('single cube with all edges cladded', () => {
    const grid = createTestGrid([
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0]
    ], {
      '1,1': ['top', 'right', 'bottom', 'left'] // All edges cladded
    });

    const result = detectConnections(grid);
    expect(result).toEqual({
      straightCouplings: 0,  // No adjacent cubes
      cornerConnectors: 0    // No adjacent cubes
    });
  });

  /**
   * Truth: For three cubes in a line(8 edges), we should get:
   * - 1 four-pack (2 side + 1 left + 1 right)
   * - 1 2-pack (2 sides)
   * - 1 2-pack (2 sides)
   * - 2 straight couplings
   */
  test('three cubes in a line with cladding', () => {
    const grid = createTestGrid([
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0]
    ], {
      '1,1': ['top', 'bottom', 'left'],  // Left cube
      '1,2': ['top', 'bottom'],          // Middle cube
      '1,3': ['top', 'bottom', 'right']  // Right cube
    });

    const result = detectConnections(grid);
    expect(result).toEqual({
      straightCouplings: 2,  // Two connections between three cubes
      cornerConnectors: 0    // No corners in a straight line
    });
  });

  /**
   * Truth: For L-shaped configuration(8 edges), we should get:
   * - 1 four-pack (2 side + 1 right + 1 left)
   * - 1 left (1 side)
   * - 1 2-pack (2 sides)
   * - 1 2-pack (2 sides)
   * - 1 corner connector
   * - 1 straight coupling
   */
  test('L-shaped configuration with cladding', () => {
    const grid = createTestGrid([
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0]
    ], {
      '1,1': ['top', 'left'],           // Top-left of L
      '1,2': ['top', 'right'],          // Top-right of L
      '2,1': ['bottom', 'left']         // Bottom of L
    });

    const result = detectConnections(grid);
    expect(result).toEqual({
      straightCouplings: 1,  // One straight connection in vertical part
      cornerConnectors: 1    // One corner where the L meets
    });
    expect(result).toMatchObject({
      cornerConnectors: 1
    });
    // Verify corner comes from 90-degree turn
    expect(grid[1][2].claddingEdges).toContain('right');
    expect(grid[2][1].claddingEdges).toContain('bottom');
  });

  /**
   * Truth: For U-shaped configuration(12 edges), we should get:
   * - 1 four-pack (2 side + 1 right + 1 left)
   * - 1 2-pack (2 sides)
   * - 1 2-pack (2 sides)
   * - 2 corner connectors
   * - 2 straight couplings
   */
  test('U-shaped configuration with cladding', () => {
    const grid = createTestGrid([
      [0, 0, 0, 0, 0],
      [0, 1, 0, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0]
    ], {
      '1,1': ['top', 'left'],           // Top-left of U
      '1,3': ['top', 'right'],          // Top-right of U
      '2,1': ['bottom', 'left'],        // Bottom-left of U
      '2,2': ['bottom'],                // Bottom-middle of U
      '2,3': ['bottom', 'right']        // Bottom-right of U
    });

    const result = detectConnections(grid);
    expect(result).toEqual({
      straightCouplings: 2,  // Two straight connections in bottom row
      cornerConnectors: 2    // Two corners where vertical meets horizontal
    });
  });
});
