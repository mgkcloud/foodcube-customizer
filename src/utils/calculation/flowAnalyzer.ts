import { CompassDirection } from '@/components/types';

export interface PathCube {
  row: number;
  col: number;
  subgrid: { subgridRow: number; subgridCol: number }[];
  entry: CompassDirection | null;
  exit: CompassDirection | null;
  flowDirection: 'horizontal' | 'vertical';
  rotation: 0 | 90 | 180 | 270;
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
 * Gets the opposite direction
 */
function getOppositeDirection(dir: CompassDirection | null): CompassDirection | null {
  if (!dir) return null;
  return VALID_FLOWS[dir];
}

/**
 * Analyze the path through connected cubes and determine flow directions
 * This is the main entry point for flow analysis
 */
export const analyzePath = (cubes: PathCube[]): PathCube[] => {
  if (!cubes || cubes.length === 0) {
    return [];
  }

  console.log(`Analyzing path for ${cubes.length} cubes`);
  
  // Create a map for quick lookup
  const cubeMap = new Map<string, PathCube>();
  cubes.forEach(cube => {
    cubeMap.set(`${cube.row},${cube.col}`, cube);
  });
  
  // Find endpoints (cubes with only one connection)
  const endpoints = findEndpoints(cubes);
  
  if (endpoints.length !== 2 && cubes.length > 1) {
    console.warn(`Warning: Found ${endpoints.length} endpoints, expected 2 for a valid path`);
    // If we don't have exactly 2 endpoints, try to make the best guess
    if (endpoints.length > 2) {
      // Take the two furthest endpoints
      endpoints.splice(0, endpoints.length - 2);
    } else if (endpoints.length < 2) {
      // If we have a loop or no endpoints, pick any cube as start
      endpoints.push(cubes[0]);
      
      // Find the furthest cube from the start
      let furthestCube = cubes[0];
      let maxDistance = 0;
      
      cubes.forEach(cube => {
        const distance = Math.abs(cube.row - cubes[0].row) + Math.abs(cube.col - cubes[0].col);
        if (distance > maxDistance) {
          maxDistance = distance;
          furthestCube = cube;
        }
      });
      
      endpoints.push(furthestCube);
    }
  }
  
  // Trace the path from one endpoint to the other
  const startCube = endpoints[0];
  const tracedPath = tracePath(cubes, cubeMap, startCube);
  
  // Validate the traced path
  validateFlow(tracedPath);
  
  return tracedPath;
};

/**
 * Find the endpoints of the path (cubes with only one connection)
 */
function findEndpoints(cubes: PathCube[]): PathCube[] {
  const endpoints: PathCube[] = [];
  
  cubes.forEach(cube => {
    let connectionCount = 0;
    const { row, col } = cube;
    
    // Check each direction for connections
    ['N', 'S', 'E', 'W'].forEach(dir => {
      let adjacentRow = row;
      let adjacentCol = col;
      
      switch (dir) {
        case 'N': adjacentRow--; break;
        case 'S': adjacentRow++; break;
        case 'E': adjacentCol++; break;
        case 'W': adjacentCol--; break;
      }
      
      // Check if there's a cube in this direction
      const hasConnection = cubes.some(c => 
        c.row === adjacentRow && c.col === adjacentCol
      );
      
      if (hasConnection) {
        connectionCount++;
      }
    });
    
    // Endpoints have exactly one connection
    if (connectionCount === 1) {
      endpoints.push(cube);
    }
  });
  
  return endpoints;
}

/**
 * Trace a path through connected cubes starting from a given cube
 */
function tracePath(
  cubes: PathCube[],
  cubeMap: Map<string, PathCube>,
  startCube: PathCube
): PathCube[] {
  const visited = new Set<string>();
  const path: PathCube[] = [];
  const id = (cube: PathCube) => `${cube.row},${cube.col}`;
  
  // Start with the first cube
  let currentCube = startCube;
  visited.add(id(currentCube));
  path.push(currentCube);
  
  // Find the initial direction
  const directions: CompassDirection[] = ['N', 'S', 'E', 'W'];
  let nextDirection: CompassDirection | null = null;
  
  for (const dir of directions) {
    let adjacentRow = currentCube.row;
    let adjacentCol = currentCube.col;
    
    switch (dir) {
      case 'N': adjacentRow--; break;
      case 'S': adjacentRow++; break;
      case 'E': adjacentCol++; break;
      case 'W': adjacentCol--; break;
    }
    
    const nextCubeId = `${adjacentRow},${adjacentCol}`;
    if (cubeMap.has(nextCubeId) && !visited.has(nextCubeId)) {
      nextDirection = dir;
      break;
    }
  }
  
  // Set the exit direction for the first cube
  currentCube.exit = nextDirection;
  currentCube.entry = null; // First cube has no entry
  currentCube.flowDirection = isHorizontalFlow(nextDirection) ? 'horizontal' : 'vertical';
  
  // Continue tracing the path
  while (nextDirection) {
    let adjacentRow = currentCube.row;
    let adjacentCol = currentCube.col;
    
    switch (nextDirection) {
      case 'N': adjacentRow--; break;
      case 'S': adjacentRow++; break;
      case 'E': adjacentCol++; break;
      case 'W': adjacentCol--; break;
    }
    
    const nextCubeId = `${adjacentRow},${adjacentCol}`;
    if (!cubeMap.has(nextCubeId) || visited.has(nextCubeId)) {
      break;
    }
    
    // Move to the next cube
    currentCube = cubeMap.get(nextCubeId)!;
    visited.add(nextCubeId);
    path.push(currentCube);
    
    // Set the entry direction for this cube (opposite of previous exit)
    currentCube.entry = getOppositeDirection(nextDirection);
    
    // Find the next direction (excluding the entry direction)
    nextDirection = null;
    
    for (const dir of directions) {
      if (dir === currentCube.entry) continue; // Skip the entry direction
      
      let nextRow = currentCube.row;
      let nextCol = currentCube.col;
      
      switch (dir) {
        case 'N': nextRow--; break;
        case 'S': nextRow++; break;
        case 'E': nextCol++; break;
        case 'W': nextCol--; break;
      }
      
      const potentialNextId = `${nextRow},${nextCol}`;
      if (cubeMap.has(potentialNextId) && !visited.has(potentialNextId)) {
        nextDirection = dir;
        break;
      }
    }
    
    // Set the exit direction for this cube
    currentCube.exit = nextDirection;
    
    // Determine flow direction based on entry and exit
    if (currentCube.entry && currentCube.exit) {
      if (
        (currentCube.entry === 'N' && currentCube.exit === 'S') ||
        (currentCube.entry === 'S' && currentCube.exit === 'N')
      ) {
        currentCube.flowDirection = 'vertical';
        currentCube.rotation = 0;
      } else if (
        (currentCube.entry === 'E' && currentCube.exit === 'W') ||
        (currentCube.entry === 'W' && currentCube.exit === 'E')
      ) {
        currentCube.flowDirection = 'horizontal';
        currentCube.rotation = 0;
      } else {
        // Corner piece - determine rotation based on entry/exit
        currentCube.flowDirection = 'horizontal'; // Default, will be adjusted
        
        if (
          (currentCube.entry === 'N' && currentCube.exit === 'E') ||
          (currentCube.entry === 'E' && currentCube.exit === 'N')
        ) {
          currentCube.rotation = 90;
        } else if (
          (currentCube.entry === 'E' && currentCube.exit === 'S') ||
          (currentCube.entry === 'S' && currentCube.exit === 'E')
        ) {
          currentCube.rotation = 180;
        } else if (
          (currentCube.entry === 'S' && currentCube.exit === 'W') ||
          (currentCube.entry === 'W' && currentCube.exit === 'S')
        ) {
          currentCube.rotation = 270;
        } else {
          currentCube.rotation = 0;
        }
      }
    } else if (currentCube.entry) {
      // Last cube - only has entry
      currentCube.flowDirection = isHorizontalFlow(currentCube.entry) ? 'horizontal' : 'vertical';
      currentCube.rotation = 0;
    }
  }
  
  // Last cube has no exit
  if (path.length > 0) {
    const lastCube = path[path.length - 1];
    if (lastCube.exit === null) {
      // This is expected for the end of the path
    }
  }
  
  return path;
}

/**
 * Validate the flow path to ensure it's continuous and valid
 */
function validateFlow(cubes: PathCube[]): void {
  if (cubes.length <= 1) return;
  
  for (let i = 0; i < cubes.length - 1; i++) {
    const currentCube = cubes[i];
    const nextCube = cubes[i + 1];
    
    // Check if exit of current cube connects to entry of next cube
    if (currentCube.exit !== getOppositeDirection(nextCube.entry)) {
      console.warn(`Flow validation error: Cube at [${currentCube.row},${currentCube.col}] has exit=${currentCube.exit} but next cube at [${nextCube.row},${nextCube.col}] has entry=${nextCube.entry}`);
    }
  }
}
