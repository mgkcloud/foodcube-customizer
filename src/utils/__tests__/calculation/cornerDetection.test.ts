import { countCornerConnectors } from '../../calculation/configurationDetector';
import { PathCube } from '../../calculation/flowAnalyzer';
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
    const path: PathCube[] = [
      createTestCube(1, 0, 'W', 'E'), // Entry from West
      createTestCube(1, 1, 'W', 'S'), // Corner - Turn South
      createTestCube(2, 1, 'N', 'S')  // Exit to South
    ];
    
    const cornerCount = countCornerConnectors(path);
    
    expect(cornerCount).toBe(1);
  });
  
  test('U-shape should have exactly four corners based on current implementation', () => {
    // Create a U-shape path with four corners
    const path: PathCube[] = [
      createTestCube(1, 0, 'W', 'S'), // First corner - Entry from West, turn South
      createTestCube(2, 0, 'N', 'E'), // Second corner - Turn East
      createTestCube(2, 1, 'W', 'E'), // Straight - West to East
      createTestCube(2, 2, 'W', 'N'), // Third corner - Turn North
      createTestCube(1, 2, 'S', 'E')  // Fourth corner - Exit to East
    ];
    
    const cornerCount = countCornerConnectors(path);
    
    // In the current implementation, each direction change is counted as a corner
    expect(cornerCount).toBe(4);
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