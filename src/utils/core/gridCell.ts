import { GridCell, CompassDirection, CubeConnection } from '@/components/types';

/**
 * Creates an empty grid cell without a cube
 */
export const createEmptyCell = (): GridCell => ({
  hasCube: false,
  connections: { entry: null, exit: null },
  claddingEdges: new Set<CompassDirection>(),
  rotation: 0
});

/**
 * Creates a grid cell with a cube and optional edges and connections
 */
const ROTATION_MAP: Record<CompassDirection, 0 | 90 | 180 | 270> = {
  N: 0,   // Flow from North to South
  E: 90,  // Flow from East to West
  S: 180, // Flow from South to North
  W: 270  // Flow from West to East
} as const;

export const createCubeCell = (
  edges: CompassDirection[] = [],
  connections: CubeConnection = { entry: null, exit: null }
): GridCell => ({
  hasCube: true,
  connections,
  claddingEdges: new Set(edges),
  rotation: connections.entry ? ROTATION_MAP[connections.entry] : 0
});

/**
 * Creates a cell with irrigation flow
 */
export const createFlowCell = (entry: CompassDirection, exit: CompassDirection): GridCell => {
  // Calculate rotation based on entry direction
  const rotation = ROTATION_MAP[entry];
  const opposites = { N: 'S', S: 'N', E: 'W', W: 'E' } as const;
  const edges: CompassDirection[] = ['N', 'S', 'E', 'W'];
  
  // Remove entry and exit directions from edges as they'll have connectors
  const claddingEdges = new Set(
    edges.filter(edge => 
      edge !== entry && 
      edge !== exit && 
      edge !== opposites[entry] && 
      edge !== opposites[exit]
    )
  );

  return {
    hasCube: true,
    connections: { entry, exit },
    claddingEdges,
    rotation
  };
};
