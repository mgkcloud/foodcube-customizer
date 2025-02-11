import { GridCell } from '@/components/types';
import { CompassDirection } from './types';
import { findConnectedCubes } from '../validation/flowValidator';

export type PanelType = 'side' | 'left' | 'right';

interface PanelConfiguration {
  type: PanelType;
  direction: CompassDirection;
}

/**
 * Determines the panel configuration for a cube based on its position in the irrigation path
 * Rules:
 * 1. Side panels are always perpendicular to the flow direction
 * 2. Left/right panels are determined by the flow direction, like a pipeline:
 *    - Left panel is always on the left side when facing the flow direction
 *    - Right panel is always on the right side when facing the flow direction
 * 3. Corner pieces maintain flow direction rules (left remains on left of flow)
 */
export function determinePanelConfiguration(
  grid: GridCell[][],
  row: number,
  col: number
): PanelConfiguration[] {
  const connectedCubes = findConnectedCubes(grid, row, col);
  const currentIndex = connectedCubes.findIndex(([r, c]) => r === row && c === col);
  
  if (currentIndex === -1) return [];
  
  const prevCube = currentIndex > 0 ? connectedCubes[currentIndex - 1] : null;
  const nextCube = currentIndex < connectedCubes.length - 1 ? connectedCubes[currentIndex + 1] : null;
  
  // Determine flow direction
  const getDirection = (from: [number, number], to: [number, number]): CompassDirection => {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    if (toRow < fromRow) return 'N';
    if (toRow > fromRow) return 'S';
    if (toCol < fromCol) return 'W';
    return 'E';
  };

  const configurations: PanelConfiguration[] = [];
  
  // Handle entry point
  if (prevCube) {
    const entryDir = getDirection([row, col], prevCube);
    const [leftDir, rightDir] = getPerpendicularDirections(entryDir);
    configurations.push(
      { type: 'left', direction: leftDir },
      { type: 'right', direction: rightDir }
    );
  }

  // Handle exit point
  if (nextCube) {
    const exitDir = getDirection([row, col], nextCube);
    // Only add side panels for straight sections or endpoints
    if (!prevCube || isOppositeDirection(exitDir, getDirection([row, col], prevCube))) {
      configurations.push({ type: 'side', direction: getSideDirection(exitDir) });
    }
  } else if (!prevCube) {
    // Isolated cube - default configuration
    configurations.push(
      { type: 'side', direction: 'N' },
      { type: 'side', direction: 'S' }
    );
  }

  return configurations;
}

// Helper functions
function getPerpendicularDirections(dir: CompassDirection): [CompassDirection, CompassDirection] {
  const dirMap: Record<CompassDirection, [CompassDirection, CompassDirection]> = {
    'N': ['W', 'E'],
    'S': ['W', 'E'],
    'E': ['N', 'S'],
    'W': ['N', 'S']
  };
  return dirMap[dir];
}

function isOppositeDirection(dir1: CompassDirection, dir2: CompassDirection): boolean {
  return (dir1 === 'N' && dir2 === 'S') ||
         (dir1 === 'S' && dir2 === 'N') ||
         (dir1 === 'E' && dir2 === 'W') ||
         (dir1 === 'W' && dir2 === 'E');
}

function getSideDirection(flowDir: CompassDirection): CompassDirection {
  const dirMap: Record<CompassDirection, CompassDirection> = {
    'N': 'E',
    'S': 'E',
    'E': 'N',
    'W': 'N'
  };
  return dirMap[flowDir];
}
