import { Requirements } from '@/components/types';
import { CONFIGURATION_RULES, getPanelType, optimizePanelPacking } from '../core/rules';
import { PathCube } from '../calculation/configurationDetector';
import { CompassDirection } from '../core/types';
import { debug } from '../shared/debugUtils';

/**
 * Analyzes path cubes to ensure proper flow
 * This is a simple placeholder if the real analyzePath is not easily found
 */
const analyzePath = (path: PathCube[]): PathCube[] => {
  console.log("Using local analyzePath function with path length:", path.length);
  console.log("PATH DEBUG: Full path details:", path.map(cube => ({
    position: `[${cube.row},${cube.col}]`,
    entry: cube.entry,
    exit: cube.exit
  })));
  return path;
};

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

  // Use the local analyzePath function instead of an imported one
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
  
  console.log(`\n====== CORNER CONNECTION DETECTION ======`);
  console.log(`Checking [${cube1.row},${cube1.col}] → [${cube2.row},${cube2.col}]`);
  console.log(`Row change: ${rowChange}, Column change: ${colChange}`);
  console.log(`cube1 exit: ${cube1.exit}, cube2 entry: ${cube2.entry}`);
  
  // If both row and column change, it's a corner (diagonal not allowed)
  // This shouldn't happen in valid configurations, but we'll check anyway
  if (rowChange !== 0 && colChange !== 0) {
    console.warn('Invalid diagonal connection detected');
    return false;
  }
  
  // STEP 1: Check if entry and exit directions exist
  if (!cube1.exit || !cube2.entry) {
    console.log(`Missing direction data: cube1.exit=${cube1.exit}, cube2.entry=${cube2.entry}`);
    return false;
  }
  
  // STEP 2: Determine the natural direction from cube1 to cube2
  let naturalDirection: CompassDirection | null = null;
  if (rowChange < 0) naturalDirection = 'N';
  else if (rowChange > 0) naturalDirection = 'S';
  else if (colChange < 0) naturalDirection = 'W';
  else if (colChange > 0) naturalDirection = 'E';
  
  console.log(`Natural direction from cube1 to cube2: ${naturalDirection}`);
  
  // STEP 3: Check if the exit direction of cube1 doesn't match the natural direction
  // This is a key indicator of a corner
  const exitMatchesNatural = cube1.exit === naturalDirection;
  console.log(`Exit direction (${cube1.exit}) matches natural direction: ${exitMatchesNatural}`);
  
  // STEP 4: Check if the entry/exit directions form a straight line
  // In a straight line, entry would be opposite of exit (N→S, E→W, etc.)
  const isOppositeFlow = (
    (cube1.exit === 'N' && cube2.entry === 'S') ||
    (cube1.exit === 'S' && cube2.entry === 'N') ||
    (cube1.exit === 'E' && cube2.entry === 'W') ||
    (cube1.exit === 'W' && cube2.entry === 'E')
  );
  
  console.log(`Is opposite flow: ${isOppositeFlow}`);
  
  // STEP 5: Check if the exit from cube1 would naturally lead to an entry to cube2
  // For properly connected cubes without corners, cube1's exit should match natural direction
  // and cube2's entry should be opposite of natural direction
  let naturalEntryToCube2: CompassDirection | null = null;
  if (naturalDirection === 'N') naturalEntryToCube2 = 'S';
  else if (naturalDirection === 'S') naturalEntryToCube2 = 'N';
  else if (naturalDirection === 'E') naturalEntryToCube2 = 'W';
  else if (naturalDirection === 'W') naturalEntryToCube2 = 'E';
  
  console.log(`Natural entry to cube2 should be: ${naturalEntryToCube2}`);
  console.log(`Actual entry to cube2 is: ${cube2.entry}`);
  
  const entryMatchesNatural = cube2.entry === naturalEntryToCube2;
  console.log(`Entry direction (${cube2.entry}) matches expected natural entry: ${entryMatchesNatural}`);
  
  // A corner is needed when:
  // 1. The exit direction doesn't match the natural direction to the next cube
  // OR
  // 2. The entry to the next cube doesn't match what would be expected from natural direction
  const isCorner = !exitMatchesNatural || !entryMatchesNatural;
  
  console.log(`FINAL DETERMINATION: Is corner connection: ${isCorner}\n`);
  
  return isCorner;
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
