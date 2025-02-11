import { GridCell, CompassDirection, CubeConnection } from './types';

/**
 * Creates an empty grid cell without a cube
 */
export const createEmptyCell = (): GridCell => ({
  hasCube: false,
  claddingEdges: new Set<CompassDirection>(),
  connections: { entry: null, exit: null }
});

/**
 * Creates a grid cell with a cube and optional edges and connections
 */
export const createCubeCell = (
  edges: CompassDirection[] = [],
  connections: CubeConnection = { entry: null, exit: null }
): GridCell => ({
  hasCube: true,
  claddingEdges: new Set(edges),
  connections
});

/**
 * Creates a cell with irrigation flow
 */
export const createFlowCell = (entry: CompassDirection, exit: CompassDirection): GridCell => ({
  hasCube: true,
  claddingEdges: new Set<CompassDirection>(),
  connections: { entry, exit }
});
