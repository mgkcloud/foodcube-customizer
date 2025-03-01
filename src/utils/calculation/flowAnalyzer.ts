import { PathCube } from './configurationDetector';

/**
 * Check if the configuration forms an L-shape
 * Supports both 3-cube L-shapes from tests and 5-cube L-shapes from presets
 */
function isLShapedConfiguration(
  cubes: PathCube[], 
  minRow: number, 
  maxRow: number, 
  minCol: number, 
  maxCol: number
): boolean {
  // An L-shape typically has width and height >= 2 and a single corner
  if ((maxRow - minRow < 1 && maxCol - minCol < 1) || cubes.length < 3) {
    return false;
  }

  // Special handling for 5-cube L-shape preset
  if (cubes.length >= 5) {
    // Extract the rows and columns to analyze the shape
    const rows = cubes.map(cube => cube.row);
    const cols = cubes.map(cube => cube.col);
    
    // Check if there's a continuous vertical section and a continuous horizontal section
    // which is the characteristic of an L-shape
    const uniqueRows = [...new Set(rows)];
    const uniqueCols = [...new Set(cols)];
    
    // Get counts of cubes in each row and column
    const rowCounts = uniqueRows.map(row => 
      rows.filter(r => r === row).length
    );
    
    const colCounts = uniqueCols.map(col => 
      cols.filter(c => c === col).length
    );
    
    // For a 5-cube L-shape preset, we expect to see:
    // - One column with 3 cubes (the vertical part)
    // - One row with 3 cubes (the horizontal part)
    const hasVerticalSection = colCounts.some(count => count >= 3);
    const hasHorizontalSection = rowCounts.some(count => count >= 3);
    
    console.log(`L-shape preset analysis in flowAnalyzer: vertical section=${hasVerticalSection}, horizontal section=${hasHorizontalSection}`);
    
    if (hasVerticalSection && hasHorizontalSection) {
      console.log("Detected 5-cube L-shape from preset in flowAnalyzer");
      return true;
    }
  }
  
  // For standard 3-cube L-shape detection, continue with the existing algorithm
  // Create a grid representation to analyze shape
  const grid: boolean[][] = [];
  for (let r = minRow; r <= maxRow; r++) {
    grid[r - minRow] = [];
    for (let c = minCol; c <= maxCol; c++) {
      grid[r - minRow][c - minCol] = false;
    }
  }
  
  // Mark occupied cells
  cubes.forEach(cube => {
    grid[cube.row - minRow][cube.col - minCol] = true;
  });
  
  // Check for L-shape pattern
  // For an L-shape, we should have exactly one corner where two perpendicular lines meet
  let cornerCount = 0;
  for (let r = 1; r < grid.length; r++) {
    for (let c = 1; c < grid[r].length; c++) {
      // Check if this position and its diagonal neighbor are empty
      // while its horizontal and vertical neighbors are filled
      if (!grid[r][c] && !grid[r-1][c-1] && grid[r-1][c] && grid[r][c-1]) {
        cornerCount++;
      }
      // Check the opposite pattern too
      if (grid[r][c] && grid[r-1][c-1] && !grid[r-1][c] && !grid[r][c-1]) {
        cornerCount++;
      }
    }
  }
  
  return cornerCount === 1;
}
