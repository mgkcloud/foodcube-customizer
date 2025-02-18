import { CompassDirection } from '@/components/types';

export interface PathCube {
  row: number;
  col: number;
  subgrid: { subgridRow: number; subgridCol: number }[];
  entry: CompassDirection | null;
  exit: CompassDirection | null;
  flowDirection: 'horizontal' | 'vertical';
  rotation: 0 | 90 | 180;  // 0 for N→S, 90 for W→E, 180 for rotated end blocks
}

const VALID_FLOWS: Record<CompassDirection, CompassDirection> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E'
} as const;

/**
 * Determines if a flow is horizontal (W→E or E→W)
 */
const isHorizontalFlow = (direction: CompassDirection | null): boolean => {
  return direction === 'W' || direction === 'E';
};

/**
 * Determines if a flow is vertical (N→S or S→N)
 */
const isVerticalFlow = (direction: CompassDirection | null): boolean => {
  return direction === 'N' || direction === 'S';
};

/**
 * Gets all valid neighbors for a cube
 */
const getNeighbors = (cube: PathCube, path: PathCube[]): { [key in CompassDirection]?: PathCube } => {
  const { row, col } = cube;
  return {
    N: path.find(c => c.row === row - 1 && c.col === col),
    E: path.find(c => c.row === row && c.col === col + 1),
    S: path.find(c => c.row === row + 1 && c.col === col),
    W: path.find(c => c.row === row && c.col === col - 1)
  };
};

/**
 * Normalizes flow through a cube to ensure it follows straight-line rules
 */
export const normalizeFlow = (cube: PathCube): PathCube => {
  if (!cube.entry && !cube.exit) return cube;
  
  // Set subgrid structure
  cube.subgrid = [
    { subgridRow: cube.row * 2, subgridCol: cube.col * 2 },
    { subgridRow: cube.row * 2, subgridCol: cube.col * 2 + 1 },
    { subgridRow: cube.row * 2 + 1, subgridCol: cube.col * 2 },
    { subgridRow: cube.row * 2 + 1, subgridCol: cube.col * 2 + 1 }
  ];

  // Normal flow handling
  const direction = cube.entry || cube.exit;
  if (!direction) return cube;

  if (isHorizontalFlow(direction)) {
    cube.flowDirection = 'horizontal';
  // For horizontal flow, rotate based on entry direction
  cube.rotation = direction === 'W' ? 90 : 180;  // 180° is equivalent to 270° for our purposes
    cube.entry = direction === 'W' ? 'W' : 'E';
    cube.exit = direction === 'W' ? 'E' : 'W';
  } else {
    cube.flowDirection = 'vertical';
    // For vertical flow, rotate based on entry direction
  cube.rotation = direction === 'N' ? 0 : 180;
    cube.entry = direction === 'N' ? 'N' : 'S';
    cube.exit = direction === 'N' ? 'S' : 'N';
  }
  
  return cube;
};

/**
 * Analyzes a path of cubes to validate flow and identify where connectors are needed
 */
export const analyzePath = (path: PathCube[]): PathCube[] => {
  // First pass: normalize flow to ensure straight paths
  const normalizedPath = path.map(normalizeFlow);
  
  // Second pass: validate connections between cubes
  for (let i = 0; i < normalizedPath.length - 1; i++) {
    const current = normalizedPath[i];
    const next = normalizedPath[i + 1];
    
    // If flow direction changes between cubes, a corner connector is needed
    // The visualization of the corner will be handled by the connector, not the cubes
    if (current.flowDirection !== next.flowDirection) {
      // Ensure the exit of current cube aligns with the connector
      // and the entry of next cube aligns with the connector
      if (current.flowDirection === 'horizontal') {
        current.exit = 'E';
        next.entry = 'N';
      } else {
        current.exit = 'S';
        next.entry = 'W';
      }
    }
  }
  
  return normalizedPath;
};
