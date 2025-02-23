import { GridCell, CompassDirection } from '@/components/types';

interface FlowVisualization {
  redCubes: { row: number; col: number; subRow: number; subCol: number }[];
  flowPath: { row: number; col: number; subRow: number; subCol: number; direction: string }[];
}

export const visualizeFlow = (grid: GridCell[][]): FlowVisualization => {
  const redCubes: { row: number; col: number; subRow: number; subCol: number }[] = [];
  const flowPath: { row: number; col: number; subRow: number; subCol: number; direction: string }[] = [];

  // First pass: Find all cubes with flow (red cubes)
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.hasCube && cell.connections.entry && cell.connections.exit) {
        // Map the entry/exit points to subgrid positions
        const subgridMap = {
          'N': { entry: { subRow: 0, subCol: 1 }, exit: { subRow: 1, subCol: 1 } },
          'S': { entry: { subRow: 1, subCol: 1 }, exit: { subRow: 2, subCol: 1 } },
          'E': { entry: { subRow: 1, subCol: 1 }, exit: { subRow: 1, subCol: 2 } },
          'W': { entry: { subRow: 1, subCol: 0 }, exit: { subRow: 1, subCol: 1 } }
        };

        const entry = subgridMap[cell.connections.entry as CompassDirection];
        const exit = subgridMap[cell.connections.exit as CompassDirection];

        if (entry && exit) {
          redCubes.push({
            row: rowIndex,
            col: colIndex,
            subRow: entry.entry.subRow,
            subCol: entry.entry.subCol
          });
          redCubes.push({
            row: rowIndex,
            col: colIndex,
            subRow: exit.exit.subRow,
            subCol: exit.exit.subCol
          });
        }
      }
    });
  });

  // Second pass: Build the continuous flow path
  let currentCell: GridCell | null = null;
  let visited = new Set<string>();

  // Find the starting cell (one with only exit or where entry is 'W')
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.hasCube && cell.connections.entry === 'W') {
        currentCell = cell;
        visited.add(`${rowIndex},${colIndex}`);
        
        // Add starting point to flow path
        flowPath.push({
          row: rowIndex,
          col: colIndex,
          subRow: 1,
          subCol: 0,
          direction: 'start'
        });
      }
    });
  });

  // Follow the path through connected cubes
  while (currentCell) {
    const currentPos = grid.findIndex(row => 
      row.findIndex(cell => cell === currentCell) !== -1
    );
    const currentRow = Math.floor(currentPos / grid.length);
    const currentCol = currentPos % grid.length;

    // Add current cell's exit point to flow path
    flowPath.push({
      row: currentRow,
      col: currentCol,
      subRow: 1,
      subCol: 1,
      direction: currentCell.connections.exit || 'end'
    });

    // Find next cell based on current cell's exit direction
    let nextCell: GridCell | null = null;
    if (currentCell.connections.exit === 'N' && currentRow > 0) {
      nextCell = grid[currentRow - 1][currentCol];
    } else if (currentCell.connections.exit === 'S' && currentRow < grid.length - 1) {
      nextCell = grid[currentRow + 1][currentCol];
    } else if (currentCell.connections.exit === 'E' && currentCol < grid[0].length - 1) {
      nextCell = grid[currentRow][currentCol + 1];
    } else if (currentCell.connections.exit === 'W' && currentCol > 0) {
      nextCell = grid[currentRow][currentCol - 1];
    }

    // Move to next cell if it exists and hasn't been visited
    if (nextCell && nextCell.hasCube && !visited.has(`${currentRow},${currentCol}`)) {
      currentCell = nextCell;
      visited.add(`${currentRow},${currentCol}`);
    } else {
      currentCell = null;
    }
  }

  console.group('Flow Path Visualization');
  console.log('Red Cube Locations:', redCubes);
  console.log('Continuous Flow Path:', flowPath);
  
  // Visual representation in console
  const visualGrid = Array(grid.length * 2 + 1).fill('.').map(() => 
    Array(grid[0].length * 2 + 1).fill('.')
  );

  // Mark red cubes with 'R'
  redCubes.forEach(({row, col, subRow, subCol}) => {
    visualGrid[row * 2 + subRow][col * 2 + subCol] = 'R';
  });

  // Mark flow path with 'F'
  flowPath.forEach(({row, col, subRow, subCol}) => {
    visualGrid[row * 2 + subRow][col * 2 + subCol] = 'F';
  });

  console.log('Visual Grid (R=Red Cube, F=Flow Path, .=Empty):');
  visualGrid.forEach(row => console.log(row.join(' ')));
  console.groupEnd();

  return { redCubes, flowPath };
}; 