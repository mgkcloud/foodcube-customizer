import { countCornerConnectors, PathCube } from '../../calculation/configurationDetector';
import { CompassDirection } from '@/components/types';

// Helper to create a test PathCube with required properties
const createTestCube = (
  row: number, 
  col: number, 
  entry: CompassDirection | null, 
  exit: CompassDirection | null
): PathCube => ({
  row,
  col,
  entry,
  exit,
  subgrid: [{ subgridRow: 0, subgridCol: 0 }],
  flowDirection: entry && (entry === 'W' || entry === 'E') ? 'horizontal' : 'vertical',
  rotation: entry === 'W' || exit === 'E' ? 90 : 0
});

describe('cornerDetection', () => {
  test('L-shape should have exactly one corner', () => {
    // Create an L-shape path with one corner
    // The key for a corner is that the exit direction doesn't match the natural direction
    // to the next cube or the entry direction of the next cube doesn't match what would be expected
    const path: PathCube[] = [
      createTestCube(1, 0, 'W', 'S'), // First cube - Entry from West, Exit South (corner)
      createTestCube(2, 0, 'N', 'E'), // Second cube - Entry from North, Exit East
      createTestCube(2, 1, 'W', 'E')  // Third cube - Entry from West, Exit East
    ];
    
    const cornerCount = countCornerConnectors(path);
    
    expect(cornerCount).toBe(1);
  });
  
  test('U-shape should have exactly 2 corner connectors', () => {
    // Create a U-shape path with two corners
    // According to our ground truths, a U-shape configuration should have 2 corner connectors
    const path: PathCube[] = [
      createTestCube(1, 0, 'W', 'S'), // First corner - Turn South
      createTestCube(2, 0, 'N', 'E'), // Second cube - Continue East
      createTestCube(2, 1, 'W', 'E'), // Third cube - Continue East
      createTestCube(2, 2, 'W', 'N'), // Second corner - Turn North
      createTestCube(1, 2, 'S', 'E')  // Fifth cube - Continue East
    ];
    
    const cornerCount = countCornerConnectors(path);
    
    // According to our ground truths, a U-shape should have 2 corner connectors
    expect(cornerCount).toBe(2);
  });
  
  test('Straight line should have zero corners', () => {
    // Create a straight line path with no corners
    const path: PathCube[] = [
      createTestCube(1, 0, 'W', 'E'), // Entry from West
      createTestCube(1, 1, 'W', 'E'), // Middle - Straight
      createTestCube(1, 2, 'W', 'E')  // Exit to East
    ];
    
    const cornerCount = countCornerConnectors(path);
    
    expect(cornerCount).toBe(0);
  });
}); 