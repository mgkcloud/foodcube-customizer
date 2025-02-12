import { GridCell, CompassDirection } from '@/components/types';
import { createEmptyCell, createFlowCell } from './gridCell';

const createEmptyGrid = (): GridCell[][] => {
  return Array(3).fill(null).map(() => Array(3).fill(null).map(() => createEmptyCell()));
};

export const generateStraightPreset = (): GridCell[][] => {
  const grid = createEmptyGrid();
  
  // Flow direction: West to East
  grid[1][0] = createFlowCell('W', 'E'); // Entry endpoint - flow starts from West
  grid[1][1] = createFlowCell('W', 'E'); // Middle flow
  grid[1][2] = createFlowCell('W', 'E'); // Exit endpoint - flow exits East
  
  return grid;
};

export const generateLShapePreset = (): GridCell[][] => {
  const grid = createEmptyGrid();
  
  // Flow direction: West to South
  grid[1][0] = createFlowCell('W', 'E'); // Entry endpoint - flow starts from West
  grid[1][1] = createFlowCell('W', 'S'); // Corner - flow turns South
  grid[2][1] = createFlowCell('N', 'S'); // Exit endpoint - flow exits South
  
  return grid;
};

export const generateUShapePreset = (): GridCell[][] => {
  const grid = createEmptyGrid();
  
  // Flow direction: West to East through bottom
  grid[1][0] = createFlowCell('W', 'S'); // Entry endpoint - flow starts from West
  grid[2][0] = createFlowCell('N', 'E'); // First corner - flow turns East
  grid[2][1] = createFlowCell('W', 'E'); // Middle flow
  grid[2][2] = createFlowCell('W', 'N'); // Second corner - flow turns North
  grid[1][2] = createFlowCell('S', 'E'); // Exit endpoint - flow exits East
  
  return grid;
};
