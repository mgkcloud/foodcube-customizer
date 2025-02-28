import { Requirements } from '@/components/types';
import { CONFIGURATION_RULES, getPanelType, optimizePanelPacking } from '../core/rules';
import { PathCube, analyzePath } from './flowAnalyzer';
import { CompassDirection } from '../core/types';

/**
 * Calculates panel and connector requirements based on analyzed path
 */
export const calculateRequirements = (path: PathCube[]): Requirements => {
  // Handle empty path
  if (!path.length) {
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

  const analyzedPath = analyzePath(path);
  
  // Debug - output the analyzed path
  console.log("Analyzed path for requirements:", JSON.stringify(analyzedPath.map(cube => ({
    position: `[${cube.row},${cube.col}]`,
    entry: cube.entry,
    exit: cube.exit
  })), null, 2));
  
  // Count panel types based on flow direction
  let sidePanels = 0;
  let leftPanels = 0;
  let rightPanels = 0;
  let straightCouplings = 0;
  let cornerConnectors = 0;
  
  // Process each cube in the path
  analyzedPath.forEach((cube, index) => {
    // Count panel types for each exposed edge
    const exposedEdges = getExposedEdges(analyzedPath, index);
    
    console.log(`Cube at [${cube.row},${cube.col}] exposed edges:`, exposedEdges);
    
    exposedEdges.forEach(edge => {
      const panelType = getPanelType(edge, cube.entry, cube.exit);
      
      console.log(`Edge ${edge} on cube [${cube.row},${cube.col}] is panel type: ${panelType}`);
      
      switch (panelType) {
        case 'side':
          sidePanels++;
          break;
        case 'left':
          leftPanels++;
          break;
        case 'right':
          rightPanels++;
          break;
      }
    });
    
    // Count connector types between cubes
    if (index < analyzedPath.length - 1) {
      const currentCube = analyzedPath[index];
      const nextCube = analyzedPath[index + 1];
      
      // Determine if this is a corner connection or a straight connection
      const isCorner = isCornerConnection(currentCube, nextCube);
      
      if (isCorner) {
        cornerConnectors++;
        console.log(`Corner connector detected between [${currentCube.row},${currentCube.col}] and [${nextCube.row},${nextCube.col}]`);
      } else {
        straightCouplings++;
        console.log(`Straight coupling detected between [${currentCube.row},${currentCube.col}] and [${nextCube.row},${nextCube.col}]`);
      }
    }
  });
  
  // Log the raw counts
  console.log("Raw panel counts:", {
    sidePanels,
    leftPanels,
    rightPanels,
    straightCouplings,
    cornerConnectors
  });
  
  // Optimize panel packing
  const packedPanels = optimizePanelPacking(sidePanels, leftPanels, rightPanels);
  
  // Return final requirements
  return {
    ...packedPanels,
    fourPackExtraTall: 0,
    twoPackExtraTall: 0,
    straightCouplings,
    cornerConnectors
  };
};

/**
 * Determines if the connection between two cubes is a corner
 */
function isCornerConnection(cube1: PathCube, cube2: PathCube): boolean {
  // If the cubes are positioned in a way that requires a 90-degree turn, it's a corner
  const rowChange = cube2.row - cube1.row;
  const colChange = cube2.col - cube1.col;
  
  // If both row and column change, it's a corner (diagonal not allowed)
  // This shouldn't happen in valid configurations, but we'll check anyway
  if (rowChange !== 0 && colChange !== 0) {
    console.warn('Invalid diagonal connection detected');
    return false;
  }
  
  // Check if this is a corner based on the flow direction change
  if (cube1.exit && cube2.entry) {
    // Get the directions
    const exit = cube1.exit;
    const entry = cube2.entry;
    
    // In a straight line, they should be opposites (N→S, E→W, etc.)
    const isOpposite = (
      (exit === 'N' && entry === 'S') ||
      (exit === 'S' && entry === 'N') ||
      (exit === 'E' && entry === 'W') ||
      (exit === 'W' && entry === 'E')
    );
    
    return !isOpposite;
  }
  
  // Default: check if either the row or column changed, but not both (straight line)
  return (rowChange !== 0 && colChange !== 0);
}

/**
 * Determines which edges of a cube are exposed and need panels
 */
function getExposedEdges(path: PathCube[], cubeIndex: number): CompassDirection[] {
  const cube = path[cubeIndex];
  const allDirections: CompassDirection[] = ['N', 'S', 'E', 'W'];
  
  // Start with all directions
  const exposedEdges = new Set<CompassDirection>(allDirections);
  
  // Check each direction to see if there's a neighboring cube
  allDirections.forEach(dir => {
    let neighborRow = cube.row;
    let neighborCol = cube.col;
    
    switch (dir) {
      case 'N': neighborRow--; break;
      case 'S': neighborRow++; break;
      case 'E': neighborCol++; break;
      case 'W': neighborCol--; break;
    }
    
    // If there's a cube in this direction, remove it from exposed edges
    const hasNeighbor = path.some(c => c.row === neighborRow && c.col === neighborCol);
    if (hasNeighbor) {
      exposedEdges.delete(dir);
    }
  });
  
  return Array.from(exposedEdges);
}
