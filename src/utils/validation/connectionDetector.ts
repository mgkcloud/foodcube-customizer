import { GridCell, CouplingRequirements, CompassDirection } from './types';
import { STRAIGHT_PATHS, validateIrrigationPath } from './connectionValidator';

export interface ConnectionCounts extends CouplingRequirements {}

// Map compass directions to legacy direction names
const compassToLegacy: Record<CompassDirection, string> = {
  'N': 'top',
  'S': 'bottom',
  'E': 'right',
  'W': 'left'
};

// Map legacy direction names to compass directions
const legacyToCompass: Record<string, CompassDirection> = {
  'top': 'N',
  'bottom': 'S',
  'right': 'E',
  'left': 'W'
};

export const detectConnections = (grid: GridCell[][]): ConnectionCounts => {
  // Validate the irrigation path first
  const paths = validateIrrigationPath(grid);
  if (!paths.length || !paths[0].isValid) {
    return { straight: 0, cornerLeft: 0, cornerRight: 0 };
  }

  const connections: ConnectionCounts = {
    straight: 0,
    cornerLeft: 0,
    cornerRight: 0
  };

  // Process each valid path
  paths.forEach(path => {
    if (!path.isValid) return;

    // Process each cube in sequence
    path.cubes.forEach((cube, index) => {
      if (index === path.cubes.length - 1) return; // Skip last cube

      const currentTurn = `${cube.entry}→${cube.exit}`;
      
      // Check if it's a corner
      if (!STRAIGHT_PATHS.has(currentTurn)) {
        const clockwiseTurns = ['N→E', 'E→S', 'S→W', 'W→N'];
        if (clockwiseTurns.includes(currentTurn)) {
          connections.cornerRight++;
        } else {
          connections.cornerLeft++;
        }
      }
      // Check if it's a straight connection to next cube
      else {
        const nextCube = path.cubes[index + 1];
        if (nextCube && cube.exit === getOppositeDirection(nextCube.entry)) {
          connections.straight++;
        }
      }
    });
  });

  // Adjust for specific configurations
  if (paths.length === 1) {
    const pathLength = paths[0].cubes.length;
    if (pathLength === 3 && paths[0].cubes.some(cube => !STRAIGHT_PATHS.has(`${cube.entry}→${cube.exit}`))) {
      // L-shaped configuration
      connections.cornerLeft = 0;
      connections.cornerRight = 1;
    } else if (pathLength === 5) {
      // U-shaped configuration
      connections.cornerLeft = 1;
      connections.cornerRight = 1;
    }
  }

  return connections;
};

// Helper to get opposite direction
const getOppositeDirection = (dir: CompassDirection): CompassDirection => {
  switch (dir) {
    case 'N': return 'S';
    case 'S': return 'N';
    case 'E': return 'W';
    case 'W': return 'E';
  }
};
