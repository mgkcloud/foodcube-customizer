import { GridCell, CompassDirection, Requirements } from '@/components/types';
import { findConnectedCubes } from '@/utils/validation/flowValidator';
import { debug } from '../shared/debugUtils';
import { countCornerConnectors, countStraightConnectors } from './configurationDetector';
import { getPanelType } from '@/utils/core/rules';

// Define a local interface for Path Cube to match configurationDetector.ts
interface PathCube {
  row: number;
  col: number;
  entry: CompassDirection | null;
  exit: CompassDirection | null;
  [key: string]: any; // Allow for any additional properties
}

/**
 * Determines the turn direction when there is a change in flow direction
 */
const determineTurnDirection = (fromDir: CompassDirection, toDir: CompassDirection): 'clockwise' | 'counterclockwise' | 'invalid' => {
  const turns = {
    'N': { 'E': 'clockwise', 'W': 'counterclockwise' },
    'E': { 'S': 'clockwise', 'N': 'counterclockwise' },
    'S': { 'W': 'clockwise', 'E': 'counterclockwise' },
    'W': { 'N': 'clockwise', 'S': 'counterclockwise' }
  };
  
  return turns[fromDir]?.[toDir] || 'invalid';
};

/**
 * Analyze a path for potential U-shape configuration
 */
const analyzePathForUShape = (
  path: PathCube[], 
  grid: GridCell[][]
): { isUShape: boolean, turns: {row: number, col: number, turnDir: string }[] } => {
  // Need at least 5 cubes for a U-shape
  if (path.length < 5) {
    console.log("Path too short for U-shape analysis");
    return { isUShape: false, turns: [] };
  }
  
  console.log("U-SHAPE ANALYSIS: Analyzing path for U-shape pattern");
  
  // Find all turns in the path
  const turns: {row: number, col: number, turnDir: string}[] = [];
  
  for (let i = 1; i < path.length - 1; i++) {
    const prevCube = path[i-1];
    const cube = path[i];
    const nextCube = path[i+1];
    
    // Determine entry and exit directions
    const entry = cube.entry;
    const exit = cube.exit;
    
    // Determine natural direction to next cube
    let naturalDir: CompassDirection | null = null;
    if (nextCube.row < cube.row) naturalDir = 'N';
    else if (nextCube.row > cube.row) naturalDir = 'S';
    else if (nextCube.col < cube.col) naturalDir = 'W';
    else if (nextCube.col > cube.col) naturalDir = 'E';
    
    // Check if this is a turn
    if (naturalDir !== exit) {
      const turnDir = determineTurnDirection(entry!, exit!);
      turns.push({ row: cube.row, col: cube.col, turnDir });
      console.log(`TURN at [${cube.row},${cube.col}]: ${entry} → ${exit}, natural to next: ${naturalDir}, turn direction: ${turnDir}`);
    }
  }
  
  console.log(`Found ${turns.length} turns in the path`);
  
  // For a U-shape, we need exactly 2 turns
  if (turns.length !== 2) {
    console.log(`Not a U-shape: has ${turns.length} turns instead of 2`);
    return { isUShape: false, turns };
  }
  
  // U-shape requires two turns in sequence, not separated by more than 2 cubes
  const [firstTurn, secondTurn] = turns;
  const turnDistance = Math.abs(
    path.findIndex(c => c.row === firstTurn.row && c.col === firstTurn.col) - 
    path.findIndex(c => c.row === secondTurn.row && c.col === secondTurn.col)
  );
  
  console.log(`Distance between turns: ${turnDistance} cubes`);
  
  if (turnDistance > 3) {
    console.log("Not a U-shape: turns are too far apart");
    return { isUShape: false, turns };
  }
  
  // Check if the middle cube is positioned outside the turn (key rule!)
  // For a U-shape, the middle cube should be on the outside of the curve
  const middleIndex = Math.floor(path.length / 2);
  const middleCube = path[middleIndex];
  console.log(`Middle cube is at [${middleCube.row},${middleCube.col}]`);
  
  // Analyze if the middle cube position is correct for a U-shape
  // Typically in a U-shape the middle cube should have a straight flow through
  if (middleCube.entry && middleCube.exit) {
    const isMiddleStraight = middleCube.entry === getOppositeDirection(middleCube.exit);
    console.log(`Middle cube has entry=${middleCube.entry}, exit=${middleCube.exit}, straight flow: ${isMiddleStraight}`);
  }
  
  // A true U-shape has endpoints in the same row or column
  const firstCube = path[0];
  const lastCube = path[path.length - 1];
  const sameRow = firstCube.row === lastCube.row;
  const sameCol = firstCube.col === lastCube.col;
  
  console.log(`Endpoints at [${firstCube.row},${firstCube.col}] and [${lastCube.row},${lastCube.col}]`);
  console.log(`Same row: ${sameRow}, same column: ${sameCol}`);
  
  const isUShape = (sameRow || sameCol) && turns.length === 2;
  
  if (isUShape) {
    console.log("U-SHAPE CONFIRMED based on endpoint positions and turn count");
  } else {
    console.log("Not a U-shape: endpoints or turn count doesn't match pattern");
  }
  
  return { isUShape, turns };
};

/**
 * Get the opposite direction
 */
const getOppositeDirection = (dir: CompassDirection): CompassDirection => {
  switch (dir) {
    case 'N': return 'S';
    case 'S': return 'N';
    case 'E': return 'W';
    case 'W': return 'E';
  }
};

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
  
  console.log("PANEL CALCULATION DEBUG: Found path through cubes:", connectedCubes);
  
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
  
  // Analyze the path for U-shape configuration
  const { isUShape, turns } = analyzePathForUShape(path, grid);
  
  if (isUShape) {
    console.log("U-SHAPE DETECTED: This configuration should follow U-shape rules");
    console.log("In U-shape, middle cube should be on the outside of the curve");
    console.log("U-shape should have 2 left and 2 right panels, balanced on both sides");
  }
  
  // Count connectors by analyzing relationships between adjacent cubes
  let cornerCount = 0;
  let straightCount = 0;
  
  // Track panels for each edge type
  let sidePanels = 0;
  let leftPanels = 0;
  let rightPanels = 0;
  
  // Track panel types for each cube
  console.log("PANEL CALCULATION DEBUG: Analyzing panel types by cube:");
  
  let sidePanelCount = 0;
  let leftPanelCount = 0;
  let rightPanelCount = 0;
  
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
        leftPanelCount++;
      } 
      // If this edge is an exit point, it's a right panel
      else if (edge === exit) {
        panelType = 'right';
        rightPanels++;
        rightPanelCount++;
      }
      // Otherwise it's a side panel 
      else {
        sidePanels++;
        sidePanelCount++;
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
    
    // Enhanced logging for L-shape analysis
    console.log("RAW COUNTS BEFORE L-SHAPE PACKAGING:", {
      sidePanels,
      leftPanels,
      rightPanels,
      straightCouplings: straightCount,
      cornerConnectors: cornerCount,
      totalPanels: sidePanels + leftPanels + rightPanels
    });
    
    // Log visual panel counts from the actual grid
    const visualPanelCounts = { side: 0, left: 0, right: 0 };
    path.forEach(({ row, col }) => {
      const cell = grid[row][col];
      const entry = cell.connections?.entry;
      const exit = cell.connections?.exit;
      
      ['N', 'E', 'S', 'W'].forEach(dir => {
        // Only count edges that would be exposed
        let isExposed = false;
        switch (dir) {
          case 'N': isExposed = row === 0 || !grid[row - 1][col].hasCube; break;
          case 'S': isExposed = row === grid.length - 1 || !grid[row + 1][col].hasCube; break;
          case 'E': isExposed = col === grid[0].length - 1 || !grid[row][col + 1].hasCube; break;
          case 'W': isExposed = col === 0 || !grid[row][col - 1].hasCube; break;
        }
        
        if (isExposed) {
          if (dir === entry) {
            visualPanelCounts.left++;
          } else if (dir === exit) {
            visualPanelCounts.right++;
          } else {
            visualPanelCounts.side++;
          }
        }
      });
    });
    
    console.log("VISUAL PANEL COUNTS IN L-SHAPE:", visualPanelCounts);
    
    // Instead of hardcoding, use the actual visual panel counts
    // This ensures the packages reflect what is shown on screen
    console.log("Using actual visual panel counts instead of hardcoded values");
    
    // Pack the panels according to the actual counts
    // This ensures we still get optimized packaging while reflecting actual panel needs
    const result = packPanelsByCount(
      visualPanelCounts.side,
      visualPanelCounts.left,
      visualPanelCounts.right,
      straightCount,
      cornerCount
    );
    
    console.log("L-SHAPE CALCULATED REQUIREMENTS:", result);
    return result;
  }
  
  // Special case for U-shaped configuration
  if (isUShape && path.length === 5 && cornerCount === 2) {
    console.log("U-SHAPE CONFIGURATION CONFIRMED with 5 cubes and 2 corners");
    
    // Similar to how we handled L-shape, let's log the actual visual panel counts
    const visualPanelCounts = { side: 0, left: 0, right: 0 };
    const pathWithConnections = path.map(({ row, col }) => {
      const cell = grid[row][col];
      const entry = cell.connections?.entry;
      const exit = cell.connections?.exit;
      
      // Count exposed edges by panel type
      let cubeSidePanels = 0;
      let cubeLeftPanels = 0;
      let cubeRightPanels = 0;
      
      ['N', 'S', 'E', 'W'].forEach(dir => {
        // Check if edge is exposed
        let isExposed = false;
        
        switch (dir) {
          case 'N': isExposed = row === 0 || !grid[row - 1][col].hasCube; break;
          case 'S': isExposed = row === grid.length - 1 || !grid[row + 1][col].hasCube; break;
          case 'E': isExposed = col === grid[0].length - 1 || !grid[row][col + 1].hasCube; break;
          case 'W': isExposed = col === 0 || !grid[row][col - 1].hasCube; break;
        }
        
        if (isExposed) {
          if (dir === entry) {
            visualPanelCounts.left++;
            cubeLeftPanels++;
          } else if (dir === exit) {
            visualPanelCounts.right++;
            cubeRightPanels++;
          } else {
            visualPanelCounts.side++;
            cubeSidePanels++;
          }
        }
      });
      
      console.log(`Cube [${row},${col}]: ${cubeSidePanels} side, ${cubeLeftPanels} left, ${cubeRightPanels} right panels`);
      
      return {
        row,
        col,
        entry,
        exit,
        sidePanels: cubeSidePanels,
        leftPanels: cubeLeftPanels,
        rightPanels: cubeRightPanels
      };
    });
    
    console.log("VISUAL PANEL COUNTS IN U-SHAPE:", visualPanelCounts);
    console.log("Detailed cube analysis:", pathWithConnections);
    
    // For U-shape, we should have balanced 2 left and 2 right panels
    // If we don't, this suggests an issue with cube orientation
    if (visualPanelCounts.left !== 2 || visualPanelCounts.right !== 2) {
      console.log("WARNING: U-shape should have 2 left and 2 right panels, but found " +
                 `${visualPanelCounts.left} left and ${visualPanelCounts.right} right`);
      console.log("This suggests an issue with cube orientation or flow direction");
    }
    
    // Use the expected U-shape counts while logging the actual visual counts
    console.log("Using U-shape standard packaging while preserving correct visual counts");
    return packPanelsByCount(
      visualPanelCounts.side,
      visualPanelCounts.left,
      visualPanelCounts.right,
      straightCount,
      cornerCount
    );
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
  
  // After determining panel types for a cube
  connectedCubes.forEach((cube, index) => {
    const cell = grid[cube[0]][cube[1]];
    const { entry, exit } = cell.connections;
    
    console.log(`PANEL CALCULATION: Cube [${cube[0]},${cube[1]}] panel analysis:`, {
      entry,
      exit,
      isFirstCube: index === 0,
      isLastCube: index === connectedCubes.length - 1,
      exposedEdges: Array.from(cell.claddingEdges)
    });
    
    // Count panel types
    let cubeRightPanels = 0;
    let cubeLeftPanels = 0;
    let cubeSidePanels = 0;
    
    ['N', 'E', 'S', 'W'].forEach(edge => {
      if (cell.claddingEdges.has(edge as CompassDirection)) {
        const panelType = getPanelType(edge as CompassDirection, entry, exit);
        
        if (panelType === 'right') {
          cubeRightPanels++;
          rightPanelCount++;
        } else if (panelType === 'left') {
          cubeLeftPanels++;
          leftPanelCount++;
        } else {
          cubeSidePanels++;
          sidePanelCount++;
        }
        
        console.log(`  - Edge ${edge}: ${panelType} panel`);
      }
    });
    
    console.log(`  - Summary for cube [${cube[0]},${cube[1]}]: ${cubeSidePanels} side, ${cubeLeftPanels} left, ${cubeRightPanels} right panels`);
  });
  
  console.log("PANEL CALCULATION DEBUG: Total counts before packaging:", {
    sidePanels: sidePanelCount,
    leftPanels: leftPanelCount,
    rightPanels: rightPanelCount
  });
  
  // Before returning final requirements
  console.log("PANEL CALCULATION DEBUG: Final packaged requirements:", requirements);
  
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
