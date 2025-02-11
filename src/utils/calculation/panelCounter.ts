import { GridCell, Requirements } from '@/components/types';
import { findConnectedCubes } from '../validation/flowValidator';
import { PathCube } from './flowAnalyzer';
import { isCorner, isStraightFlow, isLShapedConfiguration, isUShapedConfiguration } from './configurationDetector';
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

  // If no cube found with connections, look for any cube
  if (!startCube) {
    for (let i = 0; i < grid.length && !startCube; i++) {
      for (let j = 0; j < grid[0].length && !startCube; j++) {
        if (grid[i][j].hasCube) {
          startCube = [i, j];
          break;
        }
      }
    }
  }

  if (!startCube) {
    return {
      fourPackRegular: 0,
      fourPackExtraTall: 0,
      twoPackRegular: 0,
      twoPackExtraTall: 0,
      sidePanels: 0,
      leftPanels: 0,
      rightPanels: 0,
      straightCouplings: 0,
      cornerConnectors: 0
    };
  }

  // Get connected cubes and create path
  const connectedCubes = findConnectedCubes(grid, startCube[0], startCube[1]);
  const path = {
    cubes: connectedCubes.map(([row, col]) => ({
      row,
      col,
      entry: grid[row][col].connections.entry,
      exit: grid[row][col].connections.exit
    }))
  };

  // Calculate panels based on flow path and configuration
  return calculateFlowPathPanels(path.cubes);
};
