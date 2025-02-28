import { useState, useCallback, useEffect } from 'react';
import { GridCell, Requirements, CompassDirection } from '@/components/types';
import { calculateRequirements as calculateFlowRequirements } from '@/utils/calculation/requirementsCalculator';
import { calculateFlowPathPanels } from '@/utils/calculation/panelCalculator';
import { validateIrrigationPath, findConnectedCubes } from '@/utils/validation/flowValidator';
import { hasAdjacentCube } from '@/utils/shared/gridUtils';
import { clearConnectedCubesCache } from '@/utils/validation/flowValidator';
import { debug } from '@/utils/shared/debugUtils';

// Constant for the grid size
const GRID_SIZE = 3;

// Initialize a grid with empty cells
const initializeGrid = (): GridCell[][] => {
  return Array(GRID_SIZE).fill(null).map((_, rowIndex) => 
    Array(GRID_SIZE).fill(null).map((_, colIndex) => ({
      hasCube: false,
      row: rowIndex,
      col: colIndex,
      claddingEdges: new Set<CompassDirection>(),
      connections: { entry: null, exit: null },
      id: `cell-${rowIndex}-${colIndex}`,
      type: 'standard',
      rotation: 0
    }))
  );
};

// Define a local interface for Path Cube to match other files
interface PathCube {
  row: number;
  col: number;
  entry: CompassDirection | null;
  exit: CompassDirection | null;
  subgrid?: { subgridRow: number; subgridCol: number }[];
  flowDirection?: 'horizontal' | 'vertical';
  rotation?: number;
  [key: string]: any;
}

const useGridState = () => {
  const [grid, setGrid] = useState<GridCell[][]>(initializeGrid);
  const [error, setError] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<Requirements>({
    fourPackRegular: 0,
    fourPackExtraTall: 0,
    twoPackRegular: 0,
    twoPackExtraTall: 0,
    leftPanels: 0,
    rightPanels: 0,
    sidePanels: 0,
    cornerConnectors: 0,
    straightCouplings: 0
  });

  const logGridState = (grid: GridCell[][], requirements: Requirements) => {
    const gridState = grid.map(row => row.map(cell => {
      return {
        hasCube: cell.hasCube,
        claddingEdges: [...cell.claddingEdges],
        connections: cell.connections,
        adjacentCubes: {
          north: hasAdjacentCube(grid, cell.row, cell.col, 'N'),
          east: hasAdjacentCube(grid, cell.row, cell.col, 'E'),
          south: hasAdjacentCube(grid, cell.row, cell.col, 'S'),
          west: hasAdjacentCube(grid, cell.row, cell.col, 'W')
        }
      };
    }));

    console.group('Grid State Update');
    console.log('Grid:', gridState);
    console.log('Requirements:', requirements);
    console.groupEnd();
  };

  const validateAndUpdateGrid = useCallback((newGrid: GridCell[][]) => {
    // Clear previous errors
    setError(null);

    // Clear caches to ensure fresh calculation
    clearConnectedCubesCache();

    // Check if adding this cube would create an invalid configuration
    const isValid = validateIrrigationPath(newGrid);
    if (!isValid) {
      console.warn('Invalid Configuration:', 'T-shaped configurations are not allowed');
      setError('Invalid cube placement: T-shaped configurations are not allowed');
      return false;
    }

    return true;
  }, []);

  // Calculate panel requirements based on the current grid
  const calculateRequirements = useCallback((grid: GridCell[][]) => {
    try {
      // Clear caches to ensure fresh calculation
      clearConnectedCubesCache();
      
      // Validate the irrigation path
      const isValidPath = validateIrrigationPath(grid);
      
      if (!isValidPath) {
        setError('Invalid irrigation path. Cubes must form a continuous line.');
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
      
      setError(null);
      
      // Use the new universal rule-based approach from panelCalculator
      console.log("Using universal rule-based approach from panelCalculator");
      const panelRequirements = calculateFlowPathPanels(grid);
      console.log("Panel requirements from universal approach:", JSON.stringify(panelRequirements, null, 2));
      
      return panelRequirements;
    } catch (err) {
      console.error('Error calculating requirements:', err);
      setError('An error occurred while calculating requirements.');
      
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
  }, []);

  // Toggle a cell's cube state
  const toggleCell = useCallback((row: number, col: number) => {
    // Clear caches to ensure fresh calculation
    clearConnectedCubesCache();
    
    setGrid(prevGrid => {
      // Create a deep copy of the grid that preserves the GridCell structure
      const newGrid = prevGrid.map((gridRow, rowIndex) => 
        gridRow.map((cell, colIndex) => {
          // Convert Set to array and back to handle JSON serialization
          const claddingEdges = new Set([...cell.claddingEdges]);
          return {
            ...cell,
            claddingEdges, // Use the converted Set
            row: rowIndex,
            col: colIndex
          };
        })
      );
      
      // Toggle the cube state
      const targetCell = newGrid[row][col];
      targetCell.hasCube = !targetCell.hasCube;
      
      // Clear cladding edges if cube is removed
      if (!targetCell.hasCube) {
        targetCell.claddingEdges.clear();
        targetCell.connections = { entry: null, exit: null };
      }
      
      // If we don't want to add a cube or validation fails, return previous grid
      if (!targetCell.hasCube || !validateAndUpdateGrid(newGrid)) {
        return prevGrid;
      }
      
      // Validate the updated grid configuration and update connections
      const updatedCubes = validateIrrigationPath(newGrid);
      if (!updatedCubes) {
        console.warn('Invalid configuration detected after adding cube');
        // Revert the change
        return prevGrid;
      }
      
      // Add cladding to all exposed edges automatically
      for (let r = 0; r < newGrid.length; r++) {
        for (let c = 0; c < newGrid[0].length; c++) {
          if (newGrid[r][c].hasCube) {
            const edges: CompassDirection[] = ['N', 'E', 'S', 'W'];
            edges.forEach(edge => {
              if (!hasAdjacentCube(newGrid, r, c, edge)) {
                newGrid[r][c].claddingEdges.add(edge);
              } else {
                newGrid[r][c].claddingEdges.delete(edge);
              }
            });
          }
        }
      }
      
      return newGrid;
    });
    
    // Recalculate requirements after grid update
    setRequirements(prevReqs => {
      // Get updated grid with any cladding changes
      const updatedGrid = grid.map(row => row.map(cell => ({ ...cell, claddingEdges: new Set([...cell.claddingEdges]) })));
      updatedGrid[row][col].hasCube = !grid[row][col].hasCube;
      
      // Add cladding to all exposed edges automatically
      for (let r = 0; r < updatedGrid.length; r++) {
        for (let c = 0; c < updatedGrid[0].length; c++) {
          if (updatedGrid[r][c].hasCube) {
            const edges: CompassDirection[] = ['N', 'E', 'S', 'W'];
            edges.forEach(edge => {
              if (!hasAdjacentCube(updatedGrid, r, c, edge)) {
                updatedGrid[r][c].claddingEdges.add(edge);
              } else {
                updatedGrid[r][c].claddingEdges.delete(edge);
              }
            });
          }
        }
      }
      
      // Calculate new requirements based on updated grid
      const newRequirements = calculateRequirements(updatedGrid);
      
      // Update the grid state visualization
      logGridState(updatedGrid, newRequirements);
      
      return newRequirements;
    });
  }, [grid, calculateRequirements, validateAndUpdateGrid]);

  // Toggle cladding at a specific edge
  const toggleCladding = useCallback((row: number, col: number, edge: CompassDirection) => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(gridRow => 
        gridRow.map(cell => ({
          ...cell,
          claddingEdges: new Set([...cell.claddingEdges])
        }))
      );
      
      const targetCell = newGrid[row][col];
      
      // Toggle cladding edge
      if (targetCell.claddingEdges.has(edge)) {
        targetCell.claddingEdges.delete(edge);
      } else {
        targetCell.claddingEdges.add(edge);
      }
      
      return newGrid;
    });
    
    // No need to recalculate requirements as cladding doesn't affect them
  }, []);

  // Apply a preset configuration
  const applyPreset = useCallback((preset: string) => {
    console.log(`Applying preset: ${preset}`);
    // Initialize a fresh grid with no cubes
    const newGrid = initializeGrid();
    
    switch (preset) {
      case 'single':
        // Single cube in the center
        console.log("Applying single cube preset");
        newGrid[1][1].hasCube = true;
        break;
      case 'line':
        // Three cubes in a line
        console.log("Applying line preset");
        newGrid[1][0].hasCube = true;
        newGrid[1][1].hasCube = true;
        newGrid[1][2].hasCube = true;
        break;
      case 'l-shape':
        // L-shaped configuration
        console.log("Applying L-shape preset");
        newGrid[1][0].hasCube = true;
        newGrid[1][1].hasCube = true;
        newGrid[2][1].hasCube = true;
        break;
      case 'u-shape':
        // U-shaped configuration
        console.log("Applying U-shape preset");
        newGrid[2][0].hasCube = true;
        newGrid[1][0].hasCube = true;
        newGrid[1][1].hasCube = true;
        newGrid[1][2].hasCube = true;
        newGrid[2][2].hasCube = true;
        break;
      default:
        // Do nothing for unknown presets
        console.warn(`Unknown preset: ${preset}`);
        return;
    }
    
    console.log("Preset grid prepared:", newGrid.map(row => row.map(cell => cell.hasCube ? "■" : "□").join(" ")).join("\n"));
    
    // Add cladding to all exposed edges automatically
    for (let r = 0; r < newGrid.length; r++) {
      for (let c = 0; c < newGrid[0].length; c++) {
        if (newGrid[r][c].hasCube) {
          const edges: CompassDirection[] = ['N', 'E', 'S', 'W'];
          edges.forEach(edge => {
            if (!hasAdjacentCube(newGrid, r, c, edge)) {
              newGrid[r][c].claddingEdges.add(edge);
            } else {
              newGrid[r][c].claddingEdges.delete(edge);
            }
          });
        }
      }
    }
    
    // Update the grid and validate the new configuration
    if (validateAndUpdateGrid(newGrid)) {
      console.log("Grid validated, updating with flow path");
      // Validate again with connection tracing enabled
      validateIrrigationPath(newGrid);
      
      // Ensure we're setting a completely new grid object to trigger state updates
      setGrid(newGrid);
      
      // Calculate requirements for the new grid
      const newRequirements = calculateRequirements(newGrid);
      setRequirements(newRequirements);
      
      // Update the grid state visualization
      logGridState(newGrid, newRequirements);
      console.log("Preset application completed");
    } else {
      console.error("Preset validation failed");
    }
  }, [calculateRequirements, validateAndUpdateGrid]);

  // Update requirements whenever the grid changes
  useEffect(() => {
    const newRequirements = calculateRequirements(grid);
    setRequirements(newRequirements);
    logGridState(grid, newRequirements);
  }, [grid, calculateRequirements]);

  return {
    grid,
    requirements,
    toggleCell,
    toggleCladding,
    applyPreset,
    error
  };
};

export default useGridState;
