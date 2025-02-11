import { CompassDirection } from '@/components/types';

export interface PathCube {
  row: number;
  col: number;
  entry: CompassDirection | null;
  exit: CompassDirection | null;
  isCorner?: boolean;
  flowDirection?: 'horizontal' | 'vertical';
}

const VALID_FLOWS: Record<CompassDirection, CompassDirection> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E'
} as const;

/**
 * Normalizes flow through a cube to ensure it follows straight-line rules
 */
export const normalizeFlow = (cube: PathCube): PathCube => {
  if (!cube.entry || !cube.exit) return cube;
  
  // Set flow direction
  cube.flowDirection = (cube.entry === 'N' || cube.entry === 'S') ? 'vertical' : 'horizontal';
  
  // Ensure exit is opposite of entry
  cube.exit = VALID_FLOWS[cube.entry];
  
  return cube;
};

/**
 * Analyzes a path of cubes to identify corners and validate flow
 */
export const analyzePath = (path: PathCube[]): PathCube[] => {
  const normalizedPath = path.map(normalizeFlow);
  
  // Identify corners by checking adjacent cubes
  for (let i = 0; i < normalizedPath.length - 1; i++) {
    const current = normalizedPath[i];
    const next = normalizedPath[i + 1];
    
    if (current.flowDirection !== next.flowDirection) {
      current.isCorner = true;
      next.isCorner = true;
    }
  }
  
  return normalizedPath;
};

/**
 * Counts corners in a path
 */
export const getCornerCount = (path: PathCube[]): number => {
  return path.filter(cube => cube.isCorner).length / 2; // Divide by 2 as corners involve 2 cubes
};

/**
 * Determines if a path forms a U-shape
 */
export const isUShape = (path: PathCube[]): boolean => {
  return path.length === 5 && getCornerCount(path) === 2;
};

/**
 * Determines if a path forms an L-shape
 */
export const isLShape = (path: PathCube[]): boolean => {
  return path.length === 3 && getCornerCount(path) === 1;
};

/**
 * Determines if a path forms a straight line
 */
export const isStraightLine = (path: PathCube[]): boolean => {
  return path.length === 3 && getCornerCount(path) === 0;
};
