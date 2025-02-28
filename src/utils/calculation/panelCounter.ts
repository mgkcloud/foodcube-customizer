import { GridCell, Requirements } from '@/components/types';
import { findConnectedCubes } from '../validation/flowValidator';
import { isCorner, isStraightFlow, detectConfigurationType } from './configurationDetector';
import { calculateFlowPathPanels } from './panelCalculator';

/**
 * Counts required panels for a grid configuration by analyzing the flow path
 */
export const countPanels = (grid: GridCell[][]): Requirements => {
  // Find all cubes and their flow paths
  let startCube: [number, number] | null = null;
  
  // Find the first cube with a connection
  for (let i = 0; i < grid.length && !startCube; i++) {
    for (let j = 0; j < grid[0].length && !startCube; j++) {
      if (grid[i][j].hasCube && 
          (grid[i][j].connections.entry || grid[i][j].connections.exit)) {
        startCube = [i, j];
        break;
      }
    }
  }
  
  if (!startCube) {
    return {
      sidePanels: 0,
      leftPanels: 0,
      rightPanels: 0,
      fourPackRegular: 0,
      fourPackExtraTall: 0,
      twoPackRegular: 0,
      twoPackExtraTall: 0,
      straightCouplings: 0,
      cornerConnectors: 0
    };
  }
  
  // Build the flow path
  const connectedCubes = findConnectedCubes(grid, startCube[0], startCube[1]);
  
  // Convert to path cubes
  const pathCubes = connectedCubes.map(([row, col]) => ({
    row,
    col,
    subgrid: [] as { subgridRow: number; subgridCol: number }[],
    entry: grid[row][col].connections.entry,
    exit: grid[row][col].connections.exit,
    flowDirection: 
      grid[row][col].connections.entry === 'W' || 
      grid[row][col].connections.entry === 'E' || 
      grid[row][col].connections.exit === 'W' || 
      grid[row][col].connections.exit === 'E' 
        ? 'horizontal' as const 
        : 'vertical' as const,
    rotation: grid[row][col].rotation as 0 | 90 | 180 | 270
  }));

  // Detect configuration type
  const configurationType = detectConfigurationType(pathCubes);
  console.log("Detected configuration type:", configurationType);

  // Calculate panels based on flow path
  return calculateFlowPathPanels(pathCubes);
};
