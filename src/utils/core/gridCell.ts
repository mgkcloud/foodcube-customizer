import { GridCell, CompassDirection, CubeConnection } from '@/components/types';

/**
 * Creates an empty grid cell without a cube
 */
export const createEmptyCell = (): GridCell => ({
  hasCube: false,
  connections: { entry: null, exit: null },
  claddingEdges: new Set<CompassDirection>()
});

/**
 * Creates a grid cell with a cube and optional edges and connections
 */
export const createCubeCell = (
  edges: CompassDirection[] = [],
  connections: CubeConnection = { entry: null, exit: null }
): GridCell => ({
  hasCube: true,
  connections,
  claddingEdges: new Set(edges)
});

/**
 * Creates a cell with irrigation flow
 */
export const createFlowCell = (entry: CompassDirection, exit: CompassDirection): GridCell => {
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
    claddingEdges
  };
};
