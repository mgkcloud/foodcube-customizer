import { analyzePath, PathCube } from '../../calculation/flowAnalyzer';

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
      { row: 1, col: 2, subgrid: [], entry: 'W', exit: 'E', flowDirection: 'horizontal', rotation: 90 },
      // Third cube: vertical flow N→S
      { row: 2, col: 2, subgrid: [], entry: 'N', exit: 'S', flowDirection: 'vertical', rotation: 0 }
    ];
    const result = analyzePath(path);
    
    // First cube: maintains horizontal flow
    expect(result[0].flowDirection).toBe('horizontal');
    expect(result[0].rotation).toBe(90);
    expect(result[0].entry).toBe('W');
    expect(result[0].exit).toBe('E');

    // Second cube: horizontal flow with exit towards corner connector
    expect(result[1].flowDirection).toBe('horizontal');
    expect(result[1].rotation).toBe(90);
    expect(result[1].entry).toBe('W');
    expect(result[1].exit).toBe('E');

    // Third cube: vertical flow from corner connector
    expect(result[2].flowDirection).toBe('vertical');
    expect(result[2].rotation).toBe(0);
    expect(result[2].entry).toBe('N');
    expect(result[2].exit).toBe('S');
  });

  it('should normalize flow to be straight through cubes', () => {
    const path: PathCube[] = [
      // Attempt diagonal flow (should be normalized to horizontal)
      { row: 1, col: 1, subgrid: [], entry: 'W', exit: 'S', flowDirection: 'horizontal', rotation: 90 }
    ];
    const result = analyzePath(path);
    
    // Should normalize to horizontal W→E flow
    expect(result[0].flowDirection).toBe('horizontal');
    expect(result[0].rotation).toBe(90);
    expect(result[0].entry).toBe('W');
    expect(result[0].exit).toBe('E');
  });
});
