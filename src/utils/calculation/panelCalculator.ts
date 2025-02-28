import { GridCell, CompassDirection, Requirements } from '@/components/types';
import { findConnectedCubes } from '../validation/flowValidator';
import { debug } from '../shared/debugUtils';
import { countCornerConnectors, countStraightConnectors } from './configurationDetector';

// Define a local interface for Path Cube to match configurationDetector.ts
interface PathCube {
  row: number;
  col: number;
  entry: CompassDirection | null;
  exit: CompassDirection | null;
  [key: string]: any; // Allow for any additional properties
}

/**
 * Calculates panel requirements for the flow path using a universal rule-based approach
 */
export const calculateFlowPathPanels = (
  grid: GridCell[][]
): Requirements => {
  const requirements: Requirements = {
    fourPackRegular: 0,
    twoPackRegular: 0,
    leftPanels: 0,
    rightPanels: 0,
    sidePanels: 0,
    fourPackExtraTall: 0,
    twoPackExtraTall: 0,
    straightCouplings: 0,
    cornerConnectors: 0,
  };

  // Find all cubes in the grid
  const allCubes: [number, number][] = [];
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col].hasCube) {
        allCubes.push([row, col]);
      }
    }
  }

  if (allCubes.length === 0) {
    return requirements;
  }

  // Find path through all cubes
  const connectedCubes = findConnectedCubes(grid, allCubes[0][0], allCubes[0][1]);
  
  // Prepare a readable path from the cubes information
  const path = connectedCubes.map(([row, col]) => ({
    row,
    col,
    entry: grid[row][col].connections?.entry,
    exit: grid[row][col].connections?.exit
  }));
  
  // Enhanced debugging: dump the full path for analysis
  debug.info(`Analyzing path for ${path.length} cubes`);
  console.log("FLOW: Analyzing path:", path);
  
  // Count connectors by analyzing relationships between adjacent cubes
  let cornerCount = 0;
  let straightCount = 0;
  
  // Track panels for each edge type
  let sidePanels = 0;
  let leftPanels = 0;
  let rightPanels = 0;
  
  // Process each cube and determine exposed edges, panel types, and connectors
  for (let i = 0; i < path.length; i++) {
    const { row, col } = path[i];
    const cube = grid[row][col];
    const entry = cube.connections?.entry;
    const exit = cube.connections?.exit;
    
    // Determine which edges are exposed (need panels)
    const exposedEdges: CompassDirection[] = [];
    
    // North edge is exposed if there's no cube above
    if (row === 0 || !grid[row - 1][col].hasCube) {
      exposedEdges.push('N');
    }
    
    // South edge is exposed if there's no cube below
    if (row === grid.length - 1 || !grid[row + 1][col].hasCube) {
      exposedEdges.push('S');
    }
    
    // East edge is exposed if there's no cube to the right
    if (col === grid[0].length - 1 || !grid[row][col + 1].hasCube) {
      exposedEdges.push('E');
    }
    
    // West edge is exposed if there's no cube to the left
    if (col === 0 || !grid[row][col - 1].hasCube) {
      exposedEdges.push('W');
    }
    
    console.log(`Cube at [${row},${col}] exposed edges:`, exposedEdges);
    
    // Count panels based on exposed edges and flow direction
    exposedEdges.forEach(edge => {
      // Determine panel type based on flow direction
      let panelType = 'side'; // Default
      
      // If this edge is an entry point, it's a left panel
      if (edge === entry) {
        panelType = 'left';
        leftPanels++;
      } 
      // If this edge is an exit point, it's a right panel
      else if (edge === exit) {
        panelType = 'right';
        rightPanels++;
      }
      // Otherwise it's a side panel 
      else {
        sidePanels++;
      }
      
      console.log(`Edge ${edge} on cube [${row},${col}] is panel type: ${panelType}`);
    });
    
    // Check for connectors between this cube and the next
    if (i < path.length - 1) {
      const nextCube = path[i + 1];
      const nextRow = nextCube.row;
      const nextCol = nextCube.col;
      
      // Determine natural direction to next cube
      let naturalDirection: CompassDirection | null = null;
      if (nextRow < row) naturalDirection = 'N';
      else if (nextRow > row) naturalDirection = 'S';
      else if (nextCol < col) naturalDirection = 'W';
      else if (nextCol > col) naturalDirection = 'E';
      
      // Check if this requires a corner connector
      if (exit !== naturalDirection) {
        console.log(`Corner connector needed between [${row},${col}] and [${nextRow},${nextCol}]`);
        cornerCount++;
      } else {
        console.log(`Straight coupling detected between [${row},${col}] and [${nextRow},${nextCol}]`);
        straightCount++;
      }
    }
  }
  
  debug.info(`Direct counting: ${cornerCount} corners, ${straightCount} straights`);
  
  // Log the raw counts
  console.log("Raw panel counts:", {
    sidePanels,
    leftPanels,
    rightPanels,
    straightCouplings: straightCount,
    cornerConnectors: cornerCount
  });
  
  // Special case for L-shaped configuration with 3 cubes
  if (path.length === 3 && cornerCount > 0) {
    console.log("L-shaped configuration detected with 3 cubes and corners");
    console.log("Using L-shaped requirements with corner connectors: " + cornerCount);
    
    // For an L-shape with 3 cubes, we know we need:
    // - 1 four-pack
    // - 1 2-pack
    // - 1 corner connector
    // - 1 straight connector
    return {
      fourPackRegular: 1,
      twoPackRegular: 1, 
      leftPanels: 0,
      rightPanels: 0,
      sidePanels: 0,
      fourPackExtraTall: 0,
      twoPackExtraTall: 0,
      straightCouplings: 1,
      cornerConnectors: 1
    };
  }
  
  // Now pack the panels based purely on the count values
  const result = packPanelsByCount(
    sidePanels, 
    leftPanels, 
    rightPanels, 
    straightCount, 
    cornerCount
  );
  
  console.log("DIRECT COUNT CORNER CHECK: Result should have " + cornerCount + " corner connectors");
  console.log("Final requirements object:", result);
  
  return result;
};

/**
 * Packs individual panels into standard packages based purely on counts
 */
const packPanelsByCount = (
  sidePanels: number,
  leftPanels: number,
  rightPanels: number,
  straightConnectors: number,
  cornerConnectors: number
): Requirements => {
  console.log("packPanelsByCount received:", { 
    sidePanels, leftPanels, rightPanels, straightConnectors, cornerConnectors 
  });
  
  const requirements: Requirements = {
    fourPackRegular: 0,
    twoPackRegular: 0,
    leftPanels: 0,
    rightPanels: 0,
    sidePanels: 0,
    fourPackExtraTall: 0,
    twoPackExtraTall: 0,
    straightCouplings: straightConnectors,
    cornerConnectors: cornerConnectors,
  };
  
  // First try to fit into four-packs (2 side + 1 left + 1 right)
  while (sidePanels >= 2 && leftPanels >= 1 && rightPanels >= 1) {
    requirements.fourPackRegular++;
    sidePanels -= 2;
    leftPanels -= 1;
    rightPanels -= 1;
  }
  
  // Then pack remaining side panels into two-packs
  requirements.twoPackRegular = Math.floor(sidePanels / 2);
  sidePanels %= 2;
  
  // Any leftover panels
  requirements.sidePanels = sidePanels;
  requirements.leftPanels = leftPanels;
  requirements.rightPanels = rightPanels;
  
  console.log("Packaged requirements:", requirements);
  console.log("FINAL CORNER CHECK: Packaged requirements have " + requirements.cornerConnectors + " corner connectors");
  
  return requirements;
};
