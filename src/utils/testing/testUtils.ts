import { GridCell, CompassDirection } from '@/utils/core/types';
import { createEmptyCell } from '@/utils/core/gridCell';

interface FlowCell extends GridCell {
  connections: {
    entry: CompassDirection | null;
    exit: CompassDirection | null;
  };
}

function createFlowCell(entry: CompassDirection, exit: CompassDirection): FlowCell {
  return {
    ...createEmptyCell(),
    connections: { entry, exit }
  };
}

interface CellConnections {
  entry: CompassDirection;
  exit: CompassDirection;
}

export const createTestGrid = (
  layout: number[][],
  connections: Record<string, CellConnections> = {}
): GridCell[][] => {
  const grid: GridCell[][] = [];

  for (let row = 0; row < layout.length; row++) {
    grid[row] = [];
    for (let col = 0; col < layout[row].length; col++) {
      const key = `${row},${col}`;
      const cellConnections = connections[key];
      
      if (layout[row][col] === 1) {
        grid[row][col] = cellConnections 
          ? createFlowCell(cellConnections.entry, cellConnections.exit)
          : createEmptyCell();
        grid[row][col].hasCube = true;
      } else {
        grid[row][col] = createEmptyCell();
      }
    }
  }

  return grid;
};
