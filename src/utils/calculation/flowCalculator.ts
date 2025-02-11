import { GridCell, CompassDirection } from '../core/types';
import { STRAIGHT_PATHS, VALID_TURNS } from '../core/irrigationRules';
import { hasAdjacentCube } from '../shared/gridUtils';

/**
 * Determines if a direction is perpendicular to the flow
 */
export const isPerpendicularToFlow = (
  direction: CompassDirection,
  entry: CompassDirection | null,
  exit: CompassDirection | null
): boolean => {
  if (!entry || !exit) return true;
  
  const flow = `${entry}→${exit}`;
  if (STRAIGHT_PATHS.has(flow)) {
    return direction !== entry && direction !== exit;
  }
  
  return direction !== entry && direction !== exit;
};

/**
 * Gets the relative panel type based on flow direction
 */
export const getPanelType = (
  direction: CompassDirection,
  entry: CompassDirection | null,
  exit: CompassDirection | null
): 'side' | 'left' | 'right' => {
  if (!entry || !exit) return 'side';

  const flow = `${entry}→${exit}`;
  
  // For straight flow
  if (STRAIGHT_PATHS.has(flow)) {
    if (direction === entry || direction === exit) {
      return 'side';
    }
    return direction === getLeftSide(entry) ? 'left' : 'right';
  }
  
  // For corner flow
  if (VALID_TURNS.has(flow)) {
    if (direction === entry || direction === exit) {
      return 'side';
    }
    const turnType = VALID_TURNS.get(flow);
    const outsideDir = getOutsideOfTurn(entry, exit);
    return direction === outsideDir ? 
      (turnType === 'corner-right' ? 'right' : 'left') :
      (turnType === 'corner-right' ? 'left' : 'right');
  }
  
  return 'side';
};

/**
 * Gets the left side direction when looking in the direction of flow
 */
export const getLeftSide = (direction: CompassDirection): CompassDirection => {
  const leftSides: Record<CompassDirection, CompassDirection> = {
    N: 'W',
    S: 'E',
    E: 'N',
    W: 'S'
  };
  return leftSides[direction];
};

/**
 * Gets the outside direction of a turn
 */
export const getOutsideOfTurn = (entry: CompassDirection, exit: CompassDirection): CompassDirection => {
  const turnMap: Record<string, CompassDirection> = {
    'N→E': 'N',
    'E→S': 'E',
    'S→W': 'S',
    'W→N': 'W',
    'N→W': 'N',
    'W→S': 'W',
    'S→E': 'S',
    'E→N': 'E'
  };
  return turnMap[`${entry}→${exit}`] || entry;
};
