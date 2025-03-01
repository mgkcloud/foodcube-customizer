import { GridCell, CompassDirection } from '@/components/types';
import { hasAdjacentCube } from '../shared/gridUtils';

export const addCladdingToExposedEdges = (grid: GridCell[][]): GridCell[][] => {
  console.log("Starting addCladdingToExposedEdges...");
  
  const result: GridCell[][] = grid.map(row => 
    row.map(cell => ({ 
      ...cell, 
      claddingEdges: new Set<CompassDirection>(),
      excludedCladdingEdges: new Set(cell.excludedCladdingEdges || [])
    }))
  );
  
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col].hasCube) {
        const exposedEdges = new Set<CompassDirection>();
        const edges: CompassDirection[] = ['N', 'E', 'S', 'W'];
        
        console.log(`Checking cube at [${row},${col}]`);
        if (grid[row][col].excludedCladdingEdges?.size > 0) {
          console.log(`  Found excluded edges: ${[...grid[row][col].excludedCladdingEdges || []].join(', ')}`);
        }
        
        edges.forEach(edge => {
          const isAdjacent = hasAdjacentCube(grid, row, col, edge);
          const isExcluded = grid[row][col].excludedCladdingEdges?.has(edge);
          
          console.log(`  Edge ${edge}: Adjacent=${isAdjacent}, Excluded=${isExcluded}`);
          
          if (!isAdjacent && !isExcluded) {
            exposedEdges.add(edge);
            console.log(`    Added to exposed edges`);
          } else if (isExcluded) {
            console.log(`    Skipped due to being in excludedCladdingEdges`);
          }
        });
        
        result[row][col].claddingEdges = exposedEdges;
        console.log(`  Final cladding edges: ${[...exposedEdges].join(', ')}`);
      }
    }
  }
  
  return result;
};
