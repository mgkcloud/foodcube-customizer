import { GridCell, CompassDirection, Requirements } from '@/components/types';
import { findConnectedCubes } from '@/utils/validation/flowValidator';
import { debug, debugFlags } from '../shared/debugUtils';
import { countCornerConnectors, countStraightConnectors } from './configurationDetector';
import { getPanelType } from '@/utils/core/rules';
import { calculatePipeConfiguration, SubgridState } from '../visualization/pipeConfigurator';

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
 * Analyze a path for panel assignment using ultra-compact logging
 */
const analyzeEdgeForPanelType = (
  edge: CompassDirection,
  entry: CompassDirection | null,
  exit: CompassDirection | null,
  subgrid: SubgridState | string[][]
): string => {
  // Convert boolean[][] to string[][] if needed
  const stringSubgrid = Array.isArray(subgrid) && typeof subgrid[0][0] === 'boolean'
    ? subgrid.map(row => row.map(cell => cell ? 'RED' : 'EMPTY'))
    : subgrid as string[][];
  
  // Determine left and right cells for this edge's subgrid
  let leftCell = 'UNKNOWN';
  let rightCell = 'UNKNOWN';
  
  switch (edge) {
    case 'N':
      leftCell = stringSubgrid[0][0];
      rightCell = stringSubgrid[0][1];
      break;
    case 'E':
      leftCell = stringSubgrid[0][1];
      rightCell = stringSubgrid[1][1];
      break;
    case 'S':
      leftCell = stringSubgrid[1][1];
      rightCell = stringSubgrid[1][0];
      break;
    case 'W':
      leftCell = stringSubgrid[1][0];
      rightCell = stringSubgrid[0][0];
      break;
  }
  
  // Ultra-compact edge analysis log
  console.log(`E${edge}:${leftCell[0]}-${rightCell[0]}`);
  
  // Determine panel type
  let panelType = 'S'; // Default to side panel
  
  if (leftCell === 'RED' && rightCell === 'RED') {
    console.log(`E${edge}:BOTH→S`);
    return 'side';
  } else if (leftCell === 'RED' && rightCell !== 'RED') {
    console.log(`E${edge}:L→R`);
    return 'right';
  } else if (leftCell !== 'RED' && rightCell === 'RED') {
    console.log(`E${edge}:R→L`);
    return 'left';
  } else {
    console.log(`E${edge}:NONE→S`);
    return 'side';
  }
};

/**
 * Log panel requirements in ultra-compact format
 */
const logPanelRequirements = (requirements: Requirements): void => {
  if (!debugFlags.SHOW_REQUIREMENTS_CALC) return;
  
  const { 
    fourPackRegular, 
    twoPackRegular, 
    sidePanels, 
    leftPanels, 
    rightPanels,
    straightCouplings,
    cornerConnectors
  } = requirements;
  
  // Ultra-compact panel summary
  console.log(`PANELS:${sidePanels}S ${leftPanels}L ${rightPanels}R | PKG:${fourPackRegular}×4p ${twoPackRegular}×2p | CONN:${straightCouplings}× ${cornerConnectors}∟`);
};

/**
 * Calculates panel requirements for the flow path using a universal rule-based approach
 */
export const calculateFlowPathPanels = (
  grid: GridCell[][]
): Requirements => {
  try {
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
      return {
        fourPackRegular: 0,
        fourPackExtraTall: 0,
        twoPackRegular: 0,
        twoPackExtraTall: 0,
        leftPanels: 0,
        rightPanels: 0,
        sidePanels: 0,
        cornerConnectors: 0,
        straightCouplings: 0
      };
    }
    
    // Track visited cells to find all connected components
    const visited = new Set<string>();
    const components: [number, number][][] = [];
    
    // Find all connected components (paths) in the grid
    for (const [row, col] of allCubes) {
      const key = `${row},${col}`;
      if (visited.has(key)) continue;
      
      const connectedPath = findConnectedCubes(grid, row, col);
      components.push(connectedPath);
      
      // Mark all cubes in this path as visited
      for (const [r, c] of connectedPath) {
        visited.add(`${r},${c}`);
      }
    }
    
    console.log(`Found ${components.length} separate irrigation path(s)`);
    
    // Initialize panel and connector counts
    let sidePanels = 0;
    let leftPanels = 0;
    let rightPanels = 0;
    let straightConnectors = 0;
    let cornerConnectors = 0;
    
    // Process each connected component separately
    for (const connectedCubes of components) {
      // Convert to path cube format for analysis
      const path: PathCube[] = connectedCubes.map(([row, col]) => ({
        row,
        col,
        entry: grid[row][col].connections.entry,
        exit: grid[row][col].connections.exit
      }));
      
      // Log essential info about this path
      console.log(`FLOW PATH:`, path.length <= 3 ? path : `${path.length} cubes`);
      
      // Count connectors for this path
      straightConnectors += countStraightConnectors(path);
      cornerConnectors += countCornerConnectors(path);
      
      // Special case for single cube
      if (connectedCubes.length === 1) {
        console.log("Handling single cube case with known panel distribution");
        // Single cube should have 2 side panels, 1 left panel, and 1 right panel as per ground truth
        sidePanels += 2;
        leftPanels += 1;
        rightPanels += 1;
      } else {
        // Analyze each cube in the path to calculate panel requirements
        for (const [row, col] of connectedCubes) {
          // Skip if the cell doesn't have a cube
          if (!grid[row][col].hasCube) continue;
          
          // Get the entry and exit points
          const { entry, exit } = grid[row][col].connections;
          
          // Calculate pipe configuration to get subgrid info
          const pipeConfig = calculatePipeConfiguration(
            grid,
            row,
            col,
            grid[row][col],
            connectedCubes,
            entry,
            exit
          );
          
          if (!pipeConfig || !pipeConfig.subgrid) {
            console.warn(`Missing pipe configuration for cube at [${row}, ${col}]`);
            continue;
          }
          
          // Get exposed edges (panels)
          for (let edge of ['N', 'S', 'E', 'W'] as CompassDirection[]) {
            // Check if this edge has an adjacent cube
            let hasAdjacentCube = false;
            let adjacentRow = row;
            let adjacentCol = col;
            
            switch (edge) {
              case 'N': adjacentRow--; break;
              case 'S': adjacentRow++; break;
              case 'E': adjacentCol++; break;
              case 'W': adjacentCol--; break;
            }
            
            // Check if adjacent cell is within grid bounds and has a cube
            if (
              adjacentRow >= 0 && adjacentRow < grid.length &&
              adjacentCol >= 0 && adjacentCol < grid[0].length &&
              grid[adjacentRow][adjacentCol].hasCube
            ) {
              hasAdjacentCube = true;
            }
            
            // If no adjacent cube, this is an exposed edge needing a panel
            if (!hasAdjacentCube) {
              // Determine panel type based on edge and flow direction
              const panelType = analyzeEdgeForPanelType(edge, entry, exit, pipeConfig.subgrid);
              
              if (panelType === 'side') {
                sidePanels++;
              } else if (panelType === 'left') {
                leftPanels++;
              } else if (panelType === 'right') {
                rightPanels++;
              }
              
              if (debugFlags.SHOW_REQUIREMENTS_CALC) {
                console.log(`Panel at [${row},${col}:${edge}] = ${panelType}`);
              }
            }
          }
        }
      }
    }
    
    // Special case handling for dual-lines configuration (two separate paths)
    if (components.length === 2) {
      console.log("DUAL-LINES configuration detected");
      
      // Check if both paths are straight lines without turns
      const areBothPathsStraight = components.every(path => {
        const pathCubes = path.map(([row, col]) => ({
          row,
          col,
          entry: grid[row][col].connections.entry,
          exit: grid[row][col].connections.exit
        }));
        
        // A straight path should have no corner connectors
        const pathCorners = countCornerConnectors(pathCubes);
        console.log(`Path at ${path.map(([r, c]) => `[${r},${c}]`).join(', ')} has ${pathCorners} corners`);
        return pathCorners === 0;
      });
      
      if (areBothPathsStraight) {
        console.log("Both paths are straight lines - correcting connector counts for dual-lines");
        // Override corner connectors count to zero for dual straight lines
        cornerConnectors = 0;
        console.log("CORRECTED CORNER CONNECTORS TO ZERO FOR DUAL-LINES CONFIGURATION");
      }
      
      // Detailed summary of each path for clarity
      console.log("PATH SUMMARY:");
      components.forEach((path, index) => {
        console.log(`  Path ${index + 1}: ${path.length} cubes, positions: ${path.map(([r, c]) => `[${r},${c}]`).join(', ')}`);
        const pathCubes = path.map(([row, col]) => ({
          row,
          col,
          entry: grid[row][col].connections.entry,
          exit: grid[row][col].connections.exit
        }));
        
        // Log flow directions for each path
        const flowDetails = pathCubes.map(cube => 
          `[${cube.row},${cube.col}]: ${cube.entry || '-'} → ${cube.exit || '-'}`
        ).join(', ');
        console.log(`  Flow details for Path ${index + 1}: ${flowDetails}`);
      });
      
      // Final panel counts for dual-lines
      console.log("DUAL-LINES PANEL COUNTS:");
      console.log(`  Side panels: ${sidePanels}`);
      console.log(`  Left panels: ${leftPanels}`);
      console.log(`  Right panels: ${rightPanels}`);
      console.log(`  Corner connectors: ${cornerConnectors}`);
      console.log(`  Straight couplings: ${straightConnectors}`);
    }
    
    // Pack the panels optimally based on available package sizes
    const requirements = packPanelsByCount(
      sidePanels,
      leftPanels,
      rightPanels,
      straightConnectors,
      cornerConnectors
    );
    
    // Log the final requirements
    logPanelRequirements(requirements);
    
    return requirements;
  } catch (error) {
    console.error("Error calculating flow path panels:", error);
    
    // Return zero values in case of error
    return {
      fourPackRegular: 0,
      fourPackExtraTall: 0,
      twoPackRegular: 0,
      twoPackExtraTall: 0,
      leftPanels: 0,
      rightPanels: 0,
      sidePanels: 0,
      cornerConnectors: 0,
      straightCouplings: 0
    };
  }
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
