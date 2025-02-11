import { CompassDirection } from './types';
import { getOppositeDirection } from '../shared/gridUtils';

// Define valid turns and their coupling types
export const VALID_TURNS = new Map<string, 'corner-left' | 'corner-right'>([
  ['N→E', 'corner-right'],
  ['E→S', 'corner-right'],
  ['S→W', 'corner-right'],
  ['W→N', 'corner-right'],
  ['N→W', 'corner-left'],
  ['W→S', 'corner-left'],
  ['S→E', 'corner-left'],
  ['E→N', 'corner-left'],
]);

export const STRAIGHT_PATHS = new Set(['N→S', 'S→N', 'E→W', 'W→E']);

export const IRRIGATION_RULES = {
  SINGLE_CUBE: {
    EDGES: 4,
    PANELS: {
      FOUR_PACK: { SIDES: 2, LEFT: 1, RIGHT: 1 },
      COUPLINGS: { STRAIGHT: 0, CORNER: 0 }
    }
  },
  LINE_THREE: {
    EDGES: 8,
    PANELS: {
      FOUR_PACK: { SIDES: 2, LEFT: 1, RIGHT: 1 },
      TWO_PACKS: 2, // 2 two-packs with 2 sides each
      COUPLINGS: { STRAIGHT: 2, CORNER: 0 }
    }
  },
  L_SHAPE: {
    EDGES: 8,
    PANELS: {
      FOUR_PACK: { SIDES: 2, LEFT: 1, RIGHT: 1 },
      EXTRA: { SIDES: 1, LEFT: 1 },
      TWO_PACKS: 2,
      COUPLINGS: { STRAIGHT: 1, CORNER: 1 }
    }
  },
  U_SHAPE: {
    EDGES: 12,
    PANELS: {
      FOUR_PACK: { SIDES: 2, LEFT: 1, RIGHT: 1 },
      TWO_PACKS: 2,
      COUPLINGS: { STRAIGHT: 2, CORNER: 2 }
    }
  }
} as const;
