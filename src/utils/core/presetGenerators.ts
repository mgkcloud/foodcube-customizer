import { GridCell, CompassDirection } from '@/components/types';
import { createEmptyCell, createCubeCell } from './gridCell';

const createEmptyGrid = (): GridCell[][] => {
  return Array(3).fill(null).map(() => Array(3).fill(null).map(() => createEmptyCell()));
};


export const generateStraightPreset = (): GridCell[][] => {
  const grid = createEmptyGrid();
  grid[1][0] = createCubeCell(['N', 'S', 'W']);
  grid[1][1] = createCubeCell(['N', 'S']);
  grid[1][2] = createCubeCell(['N', 'S', 'E']);
  return grid;
};

export const generateLShapePreset = (): GridCell[][] => {
  const grid = createEmptyGrid();
  grid[1][0] = createCubeCell(['N', 'S', 'W']);
  grid[1][1] = createCubeCell(['N']);
  grid[2][1] = createCubeCell(['E', 'S']);
  return grid;
};

export const generateUShapePreset = (): GridCell[][] => {
  const grid = createEmptyGrid();
  grid[1][0] = createCubeCell(['N', 'W']);
  grid[1][2] = createCubeCell(['N', 'E']);
  grid[2][0] = createCubeCell(['S', 'W']);
  grid[2][1] = createCubeCell(['S']);
  grid[2][2] = createCubeCell(['S', 'E']);
  return grid;
};
