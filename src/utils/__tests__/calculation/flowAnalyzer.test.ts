import { analyzePath, PathCube } from '@/utils/calculation/flowAnalyzer';
import { TEST_CONFIGURATIONS } from '@/utils/testing/testHelpers';
import { findConnectedCubes } from '@/utils/validation/flowValidator';

describe('Flow Analyzer', () => {
  it('should enforce horizontal flow for W→E connections', () => {
    const path: PathCube[] = [
      { row: 1, col: 1, subgrid: [], entry: null, exit: null, flowDirection: 'horizontal', rotation: 90 },
      { row: 1, col: 2, subgrid: [], entry: 'W', exit: 'E', flowDirection: 'horizontal', rotation: 90 }
    ];
    const result = analyzePath(path);
    
    // First cube should align with second cube's horizontal flow
    expect(result[0].flowDirection).toBe('horizontal');
    expect(result[0].rotation).toBe(90);
    expect(result[0].entry).toBe('W');
    expect(result[0].exit).toBe('E');

    // Second cube should maintain its horizontal flow
    expect(result[1].flowDirection).toBe('horizontal');
    expect(result[1].rotation).toBe(90);
    expect(result[1].entry).toBe('W');
    expect(result[1].exit).toBe('E');
  });

  it('should enforce vertical flow for N→S connections', () => {
    const path: PathCube[] = [
      { row: 1, col: 1, subgrid: [], entry: null, exit: null, flowDirection: 'vertical', rotation: 0 },
      { row: 2, col: 1, subgrid: [], entry: 'N', exit: 'S', flowDirection: 'vertical', rotation: 0 }
    ];
    const result = analyzePath(path);
    
    // First cube should align with second cube's vertical flow
    expect(result[0].flowDirection).toBe('vertical');
    expect(result[0].rotation).toBe(0);
    expect(result[0].entry).toBe('N');
    expect(result[0].exit).toBe('S');

    // Second cube should maintain its vertical flow
    expect(result[1].flowDirection).toBe('vertical');
    expect(result[1].rotation).toBe(0);
    expect(result[1].entry).toBe('N');
    expect(result[1].exit).toBe('S');
  });

  it('should handle L-shape with corner connector between horizontal and vertical flows', () => {
    const path: PathCube[] = [
      // First cube: horizontal flow W→E
      { row: 1, col: 1, subgrid: [], entry: 'W', exit: 'E', flowDirection: 'horizontal', rotation: 90 },
      // Second cube: horizontal flow W→E (will connect to vertical via corner connector)
      { row: 1, col: 2, subgrid: [], entry: 'W', exit: 'S', flowDirection: 'vertical', rotation: 0 },
      // Third cube: vertical flow N→S
      { row: 2, col: 2, subgrid: [], entry: 'N', exit: 'S', flowDirection: 'vertical', rotation: 0 }
    ];
    const result = analyzePath(path);
    
    // Check first cube (horizontal)
    expect(result[0].flowDirection).toBe('horizontal');
    expect(result[0].rotation).toBe(90);
    expect(result[0].entry).toBe('W');
    expect(result[0].exit).toBe('E');
    
    // Check second cube (corner transition)
    expect(result[1].flowDirection).toBe('vertical');
    expect(result[1].rotation).toBe(0);
    expect(result[1].entry).toBe('W');
    expect(result[1].exit).toBe('S');
    
    // Check third cube (vertical)
    expect(result[2].flowDirection).toBe('vertical');
    expect(result[2].rotation).toBe(0);
    expect(result[2].entry).toBe('N');
    expect(result[2].exit).toBe('S');
  });
  
  describe('U-Shape Configuration', () => {
    it('should properly analyze U-shape flow paths', () => {
      // Create a U-shaped configuration from our test helpers
      const grid = TEST_CONFIGURATIONS.createUShape();
      
      // Find the first cube to use as starting point
      let startCube: [number, number] | null = null;
      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
          if (grid[i][j].hasCube) {
            startCube = [i, j];
            break;
          }
        }
        if (startCube) break;
      }
      
      expect(startCube).not.toBeNull();
      
      if (startCube) {
        const connectedCubes = findConnectedCubes(grid, startCube[0], startCube[1]);
        
        // Transform to PathCube format for analyzer
        const pathCubes: PathCube[] = connectedCubes.map(([row, col]) => ({
          row,
          col,
          subgrid: grid[row][col].subgrid || [],
          entry: grid[row][col].connections.entry,
          exit: grid[row][col].connections.exit,
          flowDirection: grid[row][col].rotation === 0 || grid[row][col].rotation === 180 ? 'vertical' : 'horizontal',
          rotation: grid[row][col].rotation
        }));
        
        console.log('U-Shape Test Path:', JSON.stringify(pathCubes.map(cube => ({
          position: `[${cube.row},${cube.col}]`,
          entry: cube.entry,
          exit: cube.exit
        })), null, 2));
        
        const result = analyzePath(pathCubes);
        
        // Ensure we have 5 cubes for U-shape (0,0), (1,0), (1,1), (1,2), (0,2)
        expect(result.length).toBe(5);
        
        // Check for two corner connectors - each corner should have a 90-degree turn
        let cornerCount = 0;
        for (let i = 1; i < result.length; i++) {
          const prevCube = result[i-1];
          const currCube = result[i];
          
          // If exit of previous cube doesn't match entry of current cube in expected way,
          // it must require a corner connector
          if (
            (prevCube.exit === 'E' && currCube.entry !== 'W') ||
            (prevCube.exit === 'W' && currCube.entry !== 'E') ||
            (prevCube.exit === 'N' && currCube.entry !== 'S') ||
            (prevCube.exit === 'S' && currCube.entry !== 'N')
          ) {
            cornerCount++;
          }
        }
        
        // U-shape should have exactly 2 corners
        expect(cornerCount).toBe(2);
        
        // Print the full path to help with debugging
        console.log('Analyzed U-Shape Path:', JSON.stringify(result.map(cube => ({
          position: `[${cube.row},${cube.col}]`,
          entry: cube.entry,
          exit: cube.exit,
          flowDirection: cube.flowDirection,
          rotation: cube.rotation
        })), null, 2));
      }
    });
    
    it('should correctly identify corner connectors in U-shape', () => {
      // Specific test for the U-shape flow with correct entry/exit points
      const path: PathCube[] = [
        { row: 1, col: 0, subgrid: [], entry: 'N', exit: 'S', flowDirection: 'vertical', rotation: 0 },
        { row: 0, col: 0, subgrid: [], entry: 'N', exit: 'E', flowDirection: 'horizontal', rotation: 90 },
        { row: 0, col: 1, subgrid: [], entry: 'W', exit: 'E', flowDirection: 'horizontal', rotation: 90 },
        { row: 0, col: 2, subgrid: [], entry: 'W', exit: 'S', flowDirection: 'vertical', rotation: 0 },
        { row: 1, col: 2, subgrid: [], entry: 'N', exit: 'S', flowDirection: 'vertical', rotation: 0 }
      ];
      
      // This should correct or validate the flow to follow a valid U-shape pattern
      const result = analyzePath(path);
      
      // Compare the result with the expected correct flow
      const expectedCorrectedFlow = [
        { row: 1, col: 0, entry: 'N', exit: 'S' },
        { row: 0, col: 0, entry: 'N', exit: 'E' },
        { row: 0, col: 1, entry: 'W', exit: 'E' },
        { row: 0, col: 2, entry: 'W', exit: 'S' },
        { row: 1, col: 2, entry: 'N', exit: 'S' }
      ];
      
      expect(result.length).toBe(expectedCorrectedFlow.length);
      
      // Verify each cube in the path has the correct flow direction
      for (let i = 0; i < result.length; i++) {
        expect(result[i].entry).toBe(expectedCorrectedFlow[i].entry);
        expect(result[i].exit).toBe(expectedCorrectedFlow[i].exit);
      }
    });
  });
});
