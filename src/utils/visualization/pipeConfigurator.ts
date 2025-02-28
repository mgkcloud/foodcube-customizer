import { CompassDirection } from '@/utils/core/types';
import { GridCell } from '@/components/types';

export type SubgridState = boolean[][];

interface PipeConfiguration {
  subgrid: SubgridState;
  entry: CompassDirection | null;
  exit: CompassDirection | null;
  verticalLinePosition: 'east' | 'west';
}

// Helper functions to determine flow type
const isHorizontalDirection = (dir: CompassDirection | null) => dir === 'W' || dir === 'E';
const isVerticalDirection = (dir: CompassDirection | null) => dir === 'N' || dir === 'S';

const createEmptySubgrid = (): SubgridState => [
  [false, false],
  [false, false]
];

const calculateVerticalLinePosition = (
  grid: GridCell[][],
  row: number,
  col: number,
  connectedCubes: [number, number][],
  cell: GridCell
): 'east' | 'west' => {
  // Log for N-turn detection
  const isNTurn = cell.connections?.entry === 'N' && 
                 (cell.connections?.exit === 'W' || cell.connections?.exit === 'E');
  
  if (isNTurn) {
    console.log(`N-TURN LINE POSITION: Analyzing vertical line position for cube [${row},${col}]`);
    console.log(`- Entry: ${cell.connections?.entry}, Exit: ${cell.connections?.exit}`);
    console.log(`- Is left turn: ${cell.connections?.exit === 'W'}`);
  }

  // For U-shape, place vertical lines on the inner side
  const isUShape = connectedCubes.length >= 3 && 
    connectedCubes.some(([r, c]) => Math.abs(r - row) > 1 || Math.abs(c - col) > 1);
  
  if (isUShape) {
    // Find the center column of the U-shape
    const cols = connectedCubes.map(([_, c]) => c);
    const centerCol = Math.floor((Math.min(...cols) + Math.max(...cols)) / 2);
    
    if (isNTurn) {
      console.log(`- U-shape detected, center column: ${centerCol}`);
      console.log(`- Current column: ${col}`);
    }
    
    // For vertical pieces (entry === 'N' || entry === 'S'), position based on side of U
    if (cell.connections?.entry === 'N' || cell.connections?.entry === 'S' ||
        cell.connections?.exit === 'N' || cell.connections?.exit === 'S') {
      const position = col <= centerCol ? 'east' : 'west';
      
      if (isNTurn) {
        console.log(`- U-shape vertical position: ${position} (col ${col} is ${col <= centerCol ? '<=' : '>'} center ${centerCol})`);
      }
      
      return position;
    }
    
    // For horizontal pieces, check if we're at the bottom of the U
    const isBottom = row === Math.max(...connectedCubes.map(([r]) => r));
    if (isBottom) {
      // For bottom pieces, vertical line should be on the opposite side of the nearest vertical piece
      const position = col < centerCol ? 'east' : 'west';
      
      if (isNTurn) {
        console.log(`- Bottom of U-shape position: ${position}`);
      }
      
      return position;
    }
  }

  // For regular vertical lines, check adjacent cubes
  let shouldSwitchSide = false;
  
  // Check if the current cube is turning from N to S or S to N
  if ((cell.connections?.entry === 'N' && cell.connections?.exit === 'S') ||
      (cell.connections?.entry === 'S' && cell.connections?.exit === 'N')) {
    shouldSwitchSide = true;
    
    if (isNTurn) {
      console.log(`- Vertical flow detected, switching side`);
    }
  }
  
  // Check vertical neighbors
  if (row > 0 && grid[row - 1][col].hasCube) {
    const aboveCube = grid[row - 1][col];
    if (aboveCube.connections?.entry === 'E' || aboveCube.connections?.exit === 'E') {
      shouldSwitchSide = true;
      
      if (isNTurn) {
        console.log(`- Above cube has E connection, switching side`);
      }
    }
  }
  
  if (row < grid.length - 1 && grid[row + 1][col].hasCube) {
    const belowCube = grid[row + 1][col];
    if (belowCube.connections?.entry === 'E' || belowCube.connections?.exit === 'E') {
      shouldSwitchSide = true;
      
      if (isNTurn) {
        console.log(`- Below cube has E connection, switching side`);
      }
    }
  }

  // Check horizontal neighbors for corner turns
  if (col > 0 && grid[row][col - 1].hasCube) {
    const westCube = grid[row][col - 1];
    // If west neighbor is turning from S to E or E to S, we should be on east side
    if ((westCube.connections?.entry === 'S' && westCube.connections?.exit === 'E') ||
        (westCube.connections?.entry === 'E' && westCube.connections?.exit === 'S')) {
      shouldSwitchSide = true;
      
      if (isNTurn) {
        console.log(`- West neighbor has S-E turn, switching side`);
      }
    }
    // If west neighbor is turning from N to E or E to N, we should be on east side
    if ((westCube.connections?.entry === 'N' && westCube.connections?.exit === 'E') ||
        (westCube.connections?.entry === 'E' && westCube.connections?.exit === 'N')) {
      shouldSwitchSide = true;
      
      if (isNTurn) {
        console.log(`- West neighbor has N-E turn, switching side`);
      }
    }
  }
  
  if (col < grid[0].length - 1 && grid[row][col + 1].hasCube) {
    const eastCube = grid[row][col + 1];
    // If east neighbor is turning from S to W or W to S, we should be on east side
    if ((eastCube.connections?.entry === 'S' && eastCube.connections?.exit === 'W') ||
        (eastCube.connections?.entry === 'W' && eastCube.connections?.exit === 'S')) {
      shouldSwitchSide = true;
      
      if (isNTurn) {
        console.log(`- East neighbor has S-W turn, switching side`);
      }
    }
    // If east neighbor is turning from N to W or W to N, we should be on east side
    if ((eastCube.connections?.entry === 'N' && eastCube.connections?.exit === 'W') ||
        (eastCube.connections?.entry === 'W' && eastCube.connections?.exit === 'N')) {
      shouldSwitchSide = true;
      
      if (isNTurn) {
        console.log(`- East neighbor has N-W turn, switching side`);
      }
    }
  }

  // N-turn specific logic
  if (isNTurn) {
    console.log(`N-TURN PANEL ASSIGNMENT: Analyzing panel assignment for cube [${row},${col}]`);
    
    // For N-turns, we need to ensure consistent panel assignments:
    // - North side should always be 'left' (entry point)
    // - West side should be 'right' for left turns (N→W)
    // - East side should be 'right' for right turns (N→E)
    
    if (cell.connections?.exit === 'W') {
      console.log(`- N→W LEFT TURN detected - requires special panel assignments`);
      console.log(`- Need: north=left, west=right, east=side, south=side`);
      
      // For left turns (N→W), we want the red blocks on the west side
      // This creates a vertical pipe along the left side of the subgrid
      shouldSwitchSide = false; // west side = false
      console.log(`- Forcing west side for LEFT turn to ensure correct panel assignments`);
    } else if (cell.connections?.exit === 'E') {
      console.log(`- N→E RIGHT TURN detected - requires standard alignment`);
      console.log(`- Need: north=left, east=right, west=side, south=side`);
      
      // For right turns (N→E), we want the red blocks on the east side
      // This creates a vertical pipe along the right side of the subgrid
      shouldSwitchSide = true; // east side = true
      console.log(`- Forcing east side for RIGHT turn to ensure correct panel assignments`);
    }
  }

  const result = shouldSwitchSide ? 'east' : 'west';
  
  if (isNTurn) {
    console.log(`- Final vertical line position: ${result}`);
  }
  
  return result;
};

const configureStraightPipe = (
  entry: CompassDirection,
  exit: CompassDirection,
  verticalLinePosition: 'east' | 'west',
  isInLShape: boolean = false,
  lShapeCornerDirection: 'west' | 'east' | null = null
): SubgridState => {
  const subgrid = createEmptySubgrid();
  
  if ((entry === 'N' && exit === 'S') || (entry === 'S' && exit === 'N')) {
    // Vertical line
    // For L-shapes, force consistent vertical line position based on the L-shape corner direction
    let col: number;
    
    if (isInLShape && lShapeCornerDirection) {
      // Force consistency with the L-shape corner
      col = lShapeCornerDirection === 'west' ? 0 : 1;
      console.log(`STRAIGHT PIPE: Forcing ${lShapeCornerDirection} side for vertical pipe in L-shape`);
    } else {
      // Use calculated position
      col = verticalLinePosition === 'east' ? 1 : 0;
    }
    
    subgrid[0][col] = true;
    subgrid[1][col] = true;
    
    console.log(`STRAIGHT PIPE CONFIG: Vertical line at col=${col} (${col === 0 ? 'west' : 'east'} side)`);
  } else if ((entry === 'E' && exit === 'W') || (entry === 'W' && exit === 'E')) {
    // Horizontal line - always use bottom row
    subgrid[1][0] = true;
    subgrid[1][1] = true;
  }
  
  return subgrid;
};

const configureCornerPipe = (
  entry: CompassDirection, 
  exit: CompassDirection,
  verticalLinePosition: 'east' | 'west'
): SubgridState => {
  const subgrid = createEmptySubgrid();
  const verticalCol = verticalLinePosition === 'east' ? 1 : 0;
  
  // Debug log for N-turn detection
  if (entry === 'N' && (exit === 'W' || exit === 'E')) {
    console.log(`N-TURN VISUALIZATION: Configuring corner pipe for N→${exit} turn`);
    console.log(`- Using vertical line position: ${verticalLinePosition}`);
    console.log(`- Vertical column index: ${verticalCol}`);
    console.log(`- This is a LEFT turn: ${exit === 'W'}`);
  }

  // Special handling for N-W turn (left turn) - we need to flip the visualization
  // to maintain consistent left/right orientation
  if (entry === 'N' && exit === 'W') {
    console.log(`MIRRORING: Special handling for N→W left turn`);
    
    // LEFT TURN: For N→W, place both red blocks on the west side
    // This creates a vertical line along the left side of the subgrid
    subgrid[0][0] = true;  // Put vertical part on west side (top-left)
    subgrid[1][0] = true;  // Put vertical part on west side (bottom-left)
    
    console.log(`MIRRORED SUBGRID: 
    [${subgrid[0][0] ? 'X' : '.'}, ${subgrid[0][1] ? 'X' : '.'}]
    [${subgrid[1][0] ? 'X' : '.'}, ${subgrid[1][1] ? 'X' : '.'}]`);
    
    return subgrid;
  }
  // Special handling for N-E turn (right turn)
  else if (entry === 'N' && exit === 'E') {
    console.log(`MIRRORING: Special handling for N→E right turn`);
    
    // RIGHT TURN: For N→E, place both red blocks on the east side
    subgrid[0][1] = true;  // Put vertical part on east side (top-right)
    subgrid[1][1] = true;  // Put vertical part on east side (bottom-right)
    
    console.log(`STANDARD SUBGRID: 
    [${subgrid[0][0] ? 'X' : '.'}, ${subgrid[0][1] ? 'X' : '.'}]
    [${subgrid[1][0] ? 'X' : '.'}, ${subgrid[1][1] ? 'X' : '.'}]`);
    
    return subgrid;
  }

  // Standard corner configurations for other directions
  if (entry === 'W' && exit === 'N') {
    subgrid[1][0] = true; // Horizontal part (always from west)
    subgrid[0][verticalCol] = true; // Vertical part (position based on parameter)
  } else if (entry === 'W' && exit === 'S') {
    subgrid[1][0] = true; // Horizontal part (always from west)
    subgrid[1][verticalCol] = true; // Vertical part (position based on parameter)
  } else if (entry === 'E' && exit === 'N') {
    subgrid[1][1] = true; // Horizontal part (always from east)
    subgrid[0][verticalCol] = true; // Vertical part (position based on parameter)
  } else if (entry === 'E' && exit === 'S') {
    subgrid[1][1] = true; // Horizontal part (always from east)
    subgrid[1][verticalCol] = true; // Vertical part (position based on parameter)
  } else if (entry === 'N' && exit === 'E') {
    // This case is now handled above
    console.log(`N→E: Using standard handling as backup`);
    subgrid[0][verticalCol] = true; // Vertical part (position based on parameter)
    subgrid[1][1] = true; // Horizontal part (always to east)
  } else if (entry === 'N' && exit === 'W') {
    // This case is now handled above
    console.log(`N→W: Using standard handling as backup`);
    subgrid[0][verticalCol] = true; // Vertical part (position based on parameter)
    subgrid[1][0] = true; // Horizontal part (always to west)
  } else if (entry === 'S' && exit === 'E') {
    subgrid[1][verticalCol] = true; // Vertical part (position based on parameter)
    subgrid[1][1] = true; // Horizontal part (always to east)
  } else if (entry === 'S' && exit === 'W') {
    subgrid[1][verticalCol] = true; // Vertical part (position based on parameter)
    subgrid[1][0] = true; // Horizontal part (always to west)
  }
  
  // Log the resulting subgrid
  if (entry === 'N' && (exit === 'W' || exit === 'E')) {
    console.log(`N-TURN SUBGRID (STANDARD): 
    [${subgrid[0][0] ? 'X' : '.'}, ${subgrid[0][1] ? 'X' : '.'}]
    [${subgrid[1][0] ? 'X' : '.'}, ${subgrid[1][1] ? 'X' : '.'}]`);
  }

  return subgrid;
};

export const calculatePipeConfiguration = (
  grid: GridCell[][],
  row: number,
  col: number,
  cell: GridCell,
  connectedCubes: [number, number][],
  entry: CompassDirection | null,
  exit: CompassDirection | null
): PipeConfiguration => {
  console.log(`PIPE CONFIG: Processing cube [${row},${col}] with entry=${entry}, exit=${exit}`);
  
  // -------------------------------------------------------------------------
  // IMPROVED STATE SHARING: Detect L-shape and SW corners before anything else
  // -------------------------------------------------------------------------
  
  // Pre-analyze if this is an L-shape configuration
  const isLShape = connectedCubes.length === 3 && 
    connectedCubes.some(([r, c], i) => {
      if (i < connectedCubes.length - 1) {
        const [nextR, nextC] = connectedCubes[i + 1];
        // Check for a 90-degree turn
        return Math.abs(r - nextR) === 1 && Math.abs(c - nextC) === 1;
      }
      return false;
    });
  
  // If it's an L-shape, pre-determine if it has an S→W corner
  let hasSWCorner = false;
  let hasLeftTurn = false;
  
  if (isLShape) {
    // Check all cubes for evidence of west corners or left turns
    for (const [cubeRow, cubeCol] of connectedCubes) {
      const currentCube = grid[cubeRow][cubeCol];
      
      // Check explicitly for the S→W corner pattern
      if (currentCube.connections?.entry === 'N' && currentCube.connections?.exit === 'S') {
        // Find if there's another cube to the west in our configuration
        const hasWestNeighbor = connectedCubes.some(([r, c]) => r === cubeRow && c === cubeCol - 1);
        if (hasWestNeighbor) {
          hasSWCorner = true;
          console.log(`- L-SHAPE PRECHECK: S→W corner found at [${cubeRow},${cubeCol}]`);
        }
      }
      
      // Check for direct N→W turn
      if (currentCube.connections?.entry === 'N' && currentCube.connections?.exit === 'W') {
        hasLeftTurn = true;
        console.log(`- L-SHAPE PRECHECK: N→W left turn found at [${cubeRow},${cubeCol}]`);
      }
    }
  }
  
  // CRITICAL FIX: Aggressive pre-decision for ALL cubes in an L-shape with a west corner
  // This is the key to ensure the top cube is mirrored correctly
  if (isLShape && (hasSWCorner || hasLeftTurn)) {
    console.log(`🔥 CRITICAL L-SHAPE FIX: Detected L-shape with west corner for cube [${row},${col}]`);
    console.log(`🔥 FORCING west side vertical position for ALL vertical pipes in this cube`);
    
    // Force west side for vertical pipes
    if ((entry === 'N' && exit === 'S') || (entry === 'S' && exit === 'N')) {
      console.log(`🔥 THIS IS A VERTICAL PIPE IN L-SHAPE: Creating forced west-side configuration`);
      
      // Create a vertical pipe on the west side
      const subgrid = createEmptySubgrid();
      subgrid[0][0] = true;  // Top-left cell
      subgrid[1][0] = true;  // Bottom-left cell
      
      console.log(`🔥 FORCED WEST SIDE SUBGRID (L-SHAPE VERTICAL PIPE): 
      [${subgrid[0][0] ? 'X' : '.'}, ${subgrid[0][1] ? 'X' : '.'}]
      [${subgrid[1][0] ? 'X' : '.'}, ${subgrid[1][1] ? 'X' : '.'}]`);
      
      // Return immediately with the forced configuration
      return {
        subgrid,
        entry,
        exit,
        verticalLinePosition: 'west'
      };
    }
  }
  
  // Standard N-turn detection (direct N→W or N→E)
  const isNTurn = entry === 'N' && (exit === 'W' || exit === 'E');
  
  // Corner connector with N-turn detection - when entry is N, exit is S, but next cube is to the west/east
  // This is for the case where we have N→S flow but need S→W or S→E corner connector
  const hasCornerConnector = entry === 'N' && exit === 'S' && connectedCubes.length > 1;
  let cornerDirection: 'W' | 'E' | null = null;
  
  if (hasCornerConnector) {
    // Find which direction the next cube is in
    const currentIndex = connectedCubes.findIndex(([r, c]) => r === row && c === col);
    if (currentIndex !== -1 && currentIndex < connectedCubes.length - 1) {
      const [nextRow, nextCol] = connectedCubes[currentIndex + 1];
      
      // If next cube is to the west
      if (nextCol < col) {
        cornerDirection = 'W';
        console.log(`CORNER CONNECTOR DETECTION: N→S flow with S→W corner connector to [${nextRow},${nextCol}]`);
      } 
      // If next cube is to the east
      else if (nextCol > col) {
        cornerDirection = 'E';
        console.log(`CORNER CONNECTOR DETECTION: N→S flow with S→E corner connector to [${nextRow},${nextCol}]`);
      }
    }
  }
  
  // Use either direct N-turn or N-turn via corner connector
  const isEffectiveNTurn = isNTurn || (hasCornerConnector && cornerDirection !== null);
  const isLeftTurn = entry === 'N' && exit === 'W' || (entry === 'N' && exit === 'S' && cornerDirection === 'W');
  const isRightTurn = entry === 'N' && exit === 'E' || (entry === 'N' && exit === 'S' && cornerDirection === 'E');
  
  // Enhanced L-shape detection - check the entire connected configuration
  let lShapeCornerDirection: 'W' | 'E' | null = null;
  
  // If it's an L-shape, analyze ALL cubes in the configuration to determine corner direction
  if (isLShape) {
    console.log(`L-SHAPE GLOBAL ANALYSIS: Found L-shape configuration with ${connectedCubes.length} cubes`);
    
    // Set global corner direction for the entire L-shape configuration
    if (hasSWCorner || hasLeftTurn || isLeftTurn) {
      lShapeCornerDirection = 'W';
      console.log(`- L-SHAPE: Dominant corner direction: WEST`);
    } else if (isRightTurn) {
      lShapeCornerDirection = 'E';
      console.log(`- L-SHAPE: Dominant corner direction: EAST`);
    }
    
    console.log(`- L-SHAPE CONFIG SUMMARY: Has S→W corner: ${hasSWCorner}, Has left turn: ${hasLeftTurn}`);
    console.log(`- Global corner direction for ALL cubes: ${lShapeCornerDirection || 'not determined'}`);
  }
  
  // Determine if this is a vertical pipe in an L-shape configuration
  const isVerticalPipeInLShape = isLShape && ((entry === 'N' && exit === 'S') || (entry === 'S' && exit === 'N'));
  
  // Enhanced debugging for L-shape detection
  console.log(`L-SHAPE ANALYSIS for cube [${row},${col}]:`);
  console.log(`- Connected cubes: ${JSON.stringify(connectedCubes)}`);
  console.log(`- Is L-shape: ${isLShape}`);
  console.log(`- Is vertical pipe in L-shape: ${isVerticalPipeInLShape}`);
  console.log(`- Global L-shape corner direction: ${lShapeCornerDirection}`);
  
  if (isEffectiveNTurn) {
    console.log(`PIPE CONFIG: Detected ${isNTurn ? 'direct' : 'corner connector'} N-turn for cube [${row},${col}]`);
    console.log(`- Entry: ${entry}, Exit: ${exit}${cornerDirection ? `, Corner to: ${cornerDirection}` : ''}`);
    console.log(`- Is left turn: ${isLeftTurn}`);
    console.log(`- Is right turn: ${isRightTurn}`);
    console.log(`- This turn requires special handling for correct panel assignment`);
  }
  
  // Get vertical line position from standard calculation
  const verticalLinePosition = calculateVerticalLinePosition(grid, row, col, connectedCubes, cell);
  
  // Force consistent vertical line position for all cubes in L-shapes
  // This is the key to ensuring that all cubes in the L-shape are mirrored consistently
  let forcedVerticalSide = verticalLinePosition;
  
  if (isLShape) {
    // If ANY cube in the L-shape has a west corner or left turn, ALL cubes should use west side
    if (lShapeCornerDirection === 'W' || cornerDirection === 'W' || isLeftTurn || hasSWCorner || hasLeftTurn) {
      forcedVerticalSide = 'west';
      console.log(`- GLOBAL L-SHAPE CONSISTENCY: Forcing WEST side for ALL cubes in the configuration`);
    } else if (lShapeCornerDirection === 'E' || cornerDirection === 'E' || isRightTurn) {
      forcedVerticalSide = 'east';
      console.log(`- GLOBAL L-SHAPE CONSISTENCY: Forcing EAST side for ALL cubes in the configuration`);
    }
  }
  
  console.log(`VERTICAL LINE POSITION for cube [${row},${col}]:`);
  console.log(`- Original position: ${verticalLinePosition}`);
  console.log(`- Forced position for L-shape: ${forcedVerticalSide}`);
  console.log(`- Using: ${forcedVerticalSide}`);
  
  if (isEffectiveNTurn) {
    console.log(`- Calculated vertical line position: ${verticalLinePosition}`);
    console.log(`- Final used position: ${forcedVerticalSide}`);
  }
  
  // Log L-shape detection
  if (isLShape) {
    console.log(`L-SHAPE DETECTION: Configuration detected for cube [${row},${col}]`);
    console.log(`- In L-shape with global corner direction: ${lShapeCornerDirection}`);
    console.log(`- Forcing vertical line position: ${forcedVerticalSide}`);
  }
  
  let subgrid = createEmptySubgrid();

  if (entry && exit) {
    // Special case for vertical pipes in L-shape configurations
    if (isVerticalPipeInLShape) {
      console.log(`L-SHAPE VERTICAL PIPE: Processing ${entry}→${exit} pipe in cube [${row},${col}]`);
      
      // ALWAYS FORCE THE SAME SIDE for ALL vertical pipes in an L-shape based on the global corner direction
      const verticalCol = forcedVerticalSide === 'east' ? 1 : 0;
      console.log(`- FORCING ${forcedVerticalSide.toUpperCase()} side (col=${verticalCol}) for vertical pipe in L-shape`);
      
      // Create a vertical pipe on the chosen side
      subgrid[0][verticalCol] = true;  // Top cell
      subgrid[1][verticalCol] = true;  // Bottom cell
      
      console.log(`VERTICAL PIPE SUBGRID (FORCED ${forcedVerticalSide.toUpperCase()}): 
      [${subgrid[0][0] ? 'X' : '.'}, ${subgrid[0][1] ? 'X' : '.'}]
      [${subgrid[1][0] ? 'X' : '.'}, ${subgrid[1][1] ? 'X' : '.'}]`);
    }
    // For N→S flow with corner connector to West or East, we need special mirroring
    else if (hasCornerConnector && cornerDirection) {
      console.log(`- Special case: N→S flow with S→${cornerDirection} corner connector`);
      console.log(`- Applying same mirroring as N→${cornerDirection} turn`);
      
      // Create a modified copy of the cell for visualization purposes only
      const modifiedCell = { ...cell, connections: { ...cell.connections } };
      
      if (cornerDirection === 'W') {
        // LEFT TURN: For N→S flow with S→W corner connector, place both red blocks on the west side
        // This creates a vertical line along the left side of the subgrid
        subgrid[0][0] = true;  // Put vertical part on west side (top-left)
        subgrid[1][0] = true;  // Put vertical part on west side (bottom-left)
        
        console.log(`MIRRORED SUBGRID FOR CORNER CONNECTOR (N→S→W): 
        [${subgrid[0][0] ? 'X' : '.'}, ${subgrid[0][1] ? 'X' : '.'}]
        [${subgrid[1][0] ? 'X' : '.'}, ${subgrid[1][1] ? 'X' : '.'}]`);
      } else if (cornerDirection === 'E') {
        // RIGHT TURN: For N→S flow with S→E corner connector, place both red blocks on the east side
        subgrid[0][1] = true;  // Put vertical part on east side (top-right)
        subgrid[1][1] = true;  // Put vertical part on east side (bottom-right)
        
        console.log(`STANDARD SUBGRID FOR CORNER CONNECTOR (N→S→E): 
        [${subgrid[0][0] ? 'X' : '.'}, ${subgrid[0][1] ? 'X' : '.'}]
        [${subgrid[1][0] ? 'X' : '.'}, ${subgrid[1][1] ? 'X' : '.'}]`);
      }
    } else if ((isHorizontalDirection(entry) && isHorizontalDirection(exit)) ||
        (isVerticalDirection(entry) && isVerticalDirection(exit) && entry !== exit)) {
      if (isNTurn) {
        console.log(`- Detected as straight pipe even though it's an N-turn`);
      }
      
      // Pass L-shape information to the straight pipe configuration
      subgrid = configureStraightPipe(
        entry, 
        exit, 
        forcedVerticalSide, 
        isLShape, 
        lShapeCornerDirection === 'W' ? 'west' : lShapeCornerDirection === 'E' ? 'east' : null
      );
    } else {
      if (isNTurn) {
        console.log(`- Detected as corner pipe with N-turn, using special handling`);
        console.log(`- For N→W turns: This ensures left panel at North and right panel at West`);
        console.log(`- Panel assignments depend on red block positions in the subgrid`);
      }
      subgrid = configureCornerPipe(entry, exit, forcedVerticalSide);
    }
  }

  // Log the final configuration
  if (isEffectiveNTurn) {
    console.log(`- Final subgrid for N-turn (${isLeftTurn ? 'LEFT' : isRightTurn ? 'RIGHT' : 'UNKNOWN'} turn):
    [${subgrid[0][0] ? 'X' : '.'}, ${subgrid[0][1] ? 'X' : '.'}]
    [${subgrid[1][0] ? 'X' : '.'}, ${subgrid[1][1] ? 'X' : '.'}]`);
    console.log(`- This should result in: north=left, ${isLeftTurn ? 'west' : 'east'}=right`);
  }
  
  console.log(`FINAL SUBGRID for cube [${row},${col}]:
  [${subgrid[0][0] ? 'X' : '.'}, ${subgrid[0][1] ? 'X' : '.'}]
  [${subgrid[1][0] ? 'X' : '.'}, ${subgrid[1][1] ? 'X' : '.'}]`);
  
  return {
    subgrid,
    entry,
    exit,
    verticalLinePosition: forcedVerticalSide
  };
}; 