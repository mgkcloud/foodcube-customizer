import { GridCell, CompassDirection } from '@/components/types';
import { createEmptyCell, createFlowCell } from './gridCell';
import { visualizeFlow } from './flowVisualizer';

const createEmptyGrid = (): GridCell[][] => {
  return Array(3).fill(null).map(() => Array(3).fill(null).map(() => createEmptyCell()));
};

export const generateStraightPreset = (): GridCell[][] => {
  const grid = createEmptyGrid();
  
  // Flow direction: West to East in a straight line
  grid[1][0] = createFlowCell('W', 'E'); // Entry endpoint - flow starts from West
  grid[1][1] = createFlowCell('W', 'E'); // Middle flow
  grid[1][2] = createFlowCell('W', 'E'); // Exit endpoint - flow exits East
  
  // Set hasCube for the path
  grid[1][0].hasCube = true;
  grid[1][1].hasCube = true;
  grid[1][2].hasCube = true;

  console.group('Straight Preset Generation');
  console.log('Generated Grid:', grid);
  visualizeFlow(grid);
  console.groupEnd();
  
  return grid;
};

export const generateLShapePreset = (): GridCell[][] => {
  const grid = createEmptyGrid();
  
  // Flow direction: West to South in an L-shape
  grid[1][0] = createFlowCell('W', 'E'); // Start - flow from West
  grid[1][1] = createFlowCell('W', 'S'); // Corner - flow turns South
  grid[2][1] = createFlowCell('N', 'S'); // End - flow exits South
  
  // Set hasCube for the path
  grid[1][0].hasCube = true;
  grid[1][1].hasCube = true;
  grid[2][1].hasCube = true;

  console.group('L-Shape Preset Generation');
  console.log('Generated Grid:', grid);
  visualizeFlow(grid);
  console.groupEnd();
  
  return grid;
};

export const generateUShapePreset = (): GridCell[][] => {
  const grid = createEmptyGrid();
  
  // Flow direction: West to East through bottom in a U-shape
  grid[1][0] = createFlowCell('N', 'S'); // Start - flow from North to South
  grid[2][0] = createFlowCell('N', 'E'); // Bottom left - flow from North to East
  grid[2][1] = createFlowCell('W', 'E'); // Bottom middle - straight flow West to East
  grid[2][2] = createFlowCell('W', 'N'); // Bottom right - flow from West to North
  grid[1][2] = createFlowCell('S', 'N'); // End - flow from South to North
  
  // Set hasCube for the path
  grid[1][0].hasCube = true;
  grid[2][0].hasCube = true;
  grid[2][1].hasCube = true;
  grid[2][2].hasCube = true;
  grid[1][2].hasCube = true;

  console.group('U-Shape Preset Generation');
  console.log('Generated Grid:', grid);
  visualizeFlow(grid);
  console.groupEnd();
  
  return grid;
};
