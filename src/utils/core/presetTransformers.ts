import { GridCell, CompassDirection } from '@/components/types';
import { hasAdjacentCube } from '../shared/gridUtils';

export const addCladdingToExposedEdges = (grid: GridCell[][]): GridCell[][] => {
  const result: GridCell[][] = grid.map(row => 
    row.map(cell => ({ 
      ...cell, 
      claddingEdges: new Set<CompassDirection>()
    }))
  );
  
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col].hasCube) {
        const exposedEdges = new Set<CompassDirection>();
        const edges: CompassDirection[] = ['N', 'E', 'S', 'W'];
        edges.forEach(edge => {
          if (!hasAdjacentCube(grid, row, col, edge)) {
            exposedEdges.add(edge);
          }
        });
        result[row][col].claddingEdges = exposedEdges;
      }
    }
  }
  
  return result;
};
