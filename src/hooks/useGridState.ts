import { useState, useCallback, useEffect } from 'react';
import { GridCell, Requirements, CompassDirection } from '@/components/types';
import { calculateRequirements as calculateFlowRequirements } from '@/utils/calculation/requirementsCalculator';
import { calculateFlowPathPanels } from '@/utils/calculation/panelCalculator';
import { validateIrrigationPath, findConnectedCubes } from '@/utils/validation/flowValidator';
import { hasAdjacentCube } from '@/utils/shared/gridUtils';
import { clearConnectedCubesCache } from '@/utils/validation/flowValidator';
import { debug, setCompactMode, setUltraCompactMode, debugFlags } from '@/utils/shared/debugUtils';
import { logConfigurationDebug } from '@/utils/validation/configDebugger';

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
      excludedCladdingEdges: new Set<CompassDirection>(),
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

// Helper functions for grid operations
const getOppositeDirection = (direction: CompassDirection): CompassDirection => {
  switch(direction) {
    case 'N': return 'S';
    case 'E': return 'W';
    case 'S': return 'N';
    case 'W': return 'E';
  }
};

const getNextPosition = (row: number, col: number, direction: CompassDirection): [number, number] => {
  switch(direction) {
    case 'N': return [row - 1, col];
    case 'E': return [row, col + 1];
    case 'S': return [row + 1, col];
    case 'W': return [row, col - 1];
  }
};

const isValidPosition = (grid: GridCell[][], row: number, col: number): boolean => {
  return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length;
};

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
    // Clear console before logging new state
    console.clear();
    
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
      // Clear console before calculating new requirements
      console.clear();
      
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
    // Clear console before toggling cell
    console.clear();
    
    // Clear caches to ensure fresh calculation
    clearConnectedCubesCache();
    
    // Check if we're removing a cube (for debugging purposes)
    const isRemoving = grid[row][col].hasCube;
    if (isRemoving) {
      console.log(`REMOVING cube at [${row}, ${col}] - expecting connector counts to update`);
    }
    
    setGrid(prevGrid => {
      // Create a deep copy of the grid that preserves the GridCell structure
      const newGrid = prevGrid.map((gridRow, rowIndex) => 
        gridRow.map((cell, colIndex) => {
          // Convert Set to array and back to handle JSON serialization
          const claddingEdges = new Set([...cell.claddingEdges]);
          // Also preserve the excludedCladdingEdges set
          const excludedCladdingEdges = new Set([...cell.excludedCladdingEdges || []]);
          return {
            ...cell,
            claddingEdges, // Use the converted Set
            excludedCladdingEdges, // Include the excludedCladdingEdges
            row: rowIndex,
            col: colIndex
          };
        })
      );
      
      // Toggle the cube state
      const targetCell = newGrid[row][col];
      const isAddingCube = !targetCell.hasCube;
      targetCell.hasCube = !targetCell.hasCube;
      
      // Clear cladding edges if cube is removed
      if (!targetCell.hasCube) {
        targetCell.claddingEdges.clear();
        targetCell.connections = { entry: null, exit: null };
        console.log(`Removed cube at [${row}, ${col}]`);
        
        // Recalculate cladding for adjacent cells since removing a cube may expose new edges
        const directions: CompassDirection[] = ['N', 'E', 'S', 'W'];
        directions.forEach(dir => {
          const [adjRow, adjCol] = getNextPosition(row, col, dir);
          // Check if position is valid and has a cube
          if (isValidPosition(newGrid, adjRow, adjCol) && newGrid[adjRow][adjCol].hasCube) {
            // The opposite edge of this adjacent cube is now exposed
            const oppositeDir = getOppositeDirection(dir);
            newGrid[adjRow][adjCol].claddingEdges.add(oppositeDir);
          }
        });
        
        // Calculate requirements immediately with the new grid for removal operations
        const updatedRequirements = calculateRequirements(newGrid);
        
        // Schedule the requirements update after the grid update is complete
        requestAnimationFrame(() => {
          setRequirements(updatedRequirements);
          // Log the updated state for debugging
          console.log("After removal - updated requirements:", updatedRequirements);
          logGridState(newGrid, updatedRequirements);
        });
        
        // For cube removal, no validation needed - just return the updated grid
        return newGrid;
      }
      
      // If we're adding a cube, validate the new configuration
      if (isAddingCube && !validateAndUpdateGrid(newGrid)) {
        console.log(`Invalid configuration when adding cube at [${row}, ${col}]`);
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
              // Only add cladding if the edge is exposed AND not in the excluded list
              if (!hasAdjacentCube(newGrid, r, c, edge) && !newGrid[r][c].excludedCladdingEdges?.has(edge)) {
                newGrid[r][c].claddingEdges.add(edge);
              } else {
                // Only delete if not excluded, to avoid removing manually toggled edges
                if (!newGrid[r][c].excludedCladdingEdges?.has(edge)) {
                  newGrid[r][c].claddingEdges.delete(edge);
                }
              }
            });
          }
        }
      }
      
      // Calculate requirements immediately with the new grid for add operations
      const updatedRequirements = calculateRequirements(newGrid);
      
      // Schedule the requirements update after the grid update is complete
      requestAnimationFrame(() => {
        setRequirements(updatedRequirements);
        // Log the updated state for debugging
        console.log("After cube addition - updated requirements:", updatedRequirements);
        logGridState(newGrid, updatedRequirements);
      });
      
      return newGrid;
    });
  }, [grid, validateAndUpdateGrid, calculateRequirements, logGridState]);

  // Toggle cladding at a specific edge
  const toggleCladding = useCallback((row: number, col: number, edge: CompassDirection) => {
    // Clear console before toggling cladding
    console.clear();
    
    console.log(`Starting toggleCladding at [${row},${col}], edge: ${edge}`);
    console.log(`Initial cell state:`, {
      hasCube: grid[row][col].hasCube,
      claddingEdges: [...grid[row][col].claddingEdges],
      excludedCladdingEdges: [...(grid[row][col].excludedCladdingEdges || [])]
    });
    
    // First create a deep copy of the current grid with the toggle applied
    const updatedGrid = grid.map(gridRow => 
      gridRow.map(cell => ({
        ...cell,
        claddingEdges: new Set([...cell.claddingEdges]),
        excludedCladdingEdges: new Set([...cell.excludedCladdingEdges || []])
      }))
    );
    
    // Apply the toggle to our copy
    if (updatedGrid[row][col].claddingEdges.has(edge)) {
      console.log(`Removing cladding at edge ${edge}`);
      updatedGrid[row][col].claddingEdges.delete(edge);
      
      // If this is an exposed edge, add it to excluded edges to prevent auto-cladding
      if (!hasAdjacentCube(updatedGrid, row, col, edge)) {
        console.log(`This is an exposed edge with no adjacent cube`);
        updatedGrid[row][col].excludedCladdingEdges.add(edge);
        console.log(`Added edge ${edge} to excludedCladdingEdges to prevent auto-cladding`);
      } else {
        console.log(`This edge has an adjacent cube, not adding to excludedCladdingEdges`);
      }
    } else {
      console.log(`Adding cladding at edge ${edge}`);
      updatedGrid[row][col].claddingEdges.add(edge);
      
      // If this was a previously excluded edge, remove it from excluded list
      if (updatedGrid[row][col].excludedCladdingEdges.has(edge)) {
        updatedGrid[row][col].excludedCladdingEdges.delete(edge);
        console.log(`Removed edge ${edge} from excludedCladdingEdges`);
      }
    }
    
    console.log(`Updated cell state:`, {
      hasCube: updatedGrid[row][col].hasCube,
      claddingEdges: [...updatedGrid[row][col].claddingEdges],
      excludedCladdingEdges: [...updatedGrid[row][col].excludedCladdingEdges]
    });
    
    // Update the grid
    setGrid(updatedGrid);
    
    // Immediately recalculate requirements with the same updated grid
    const newRequirements = calculateRequirements(updatedGrid);
    setRequirements(newRequirements);
    
    // Log the changes
    console.log(`Completed toggleCladding at [${row},${col}], edge: ${edge}`);
    console.log("Updated requirements:", newRequirements);
    logGridState(updatedGrid, newRequirements);
  }, [grid, calculateRequirements, hasAdjacentCube]);

  // Apply a preset configuration
  const applyPreset = useCallback((preset: string) => {
    // Clear console before applying preset
    console.clear();
    
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
        newGrid[0][0].hasCube = true;
        newGrid[1][0].hasCube = true;
        newGrid[2][0].hasCube = true;
        newGrid[2][1].hasCube = true;
        newGrid[2][2].hasCube = true;
        break;
      case 'u-shape':
        // U-shaped configuration
        console.log("Applying U-shape preset");
        newGrid[0][0].hasCube = true;
        newGrid[1][0].hasCube = true;
        newGrid[2][0].hasCube = true;
        newGrid[2][1].hasCube = true;
        newGrid[2][2].hasCube = true;
        newGrid[1][2].hasCube = true;
        newGrid[0][2].hasCube = true;
        break;
      case 'dual-lines':
        // Two separate lines configuration
        console.log("Applying dual lines preset");
        // Top row - flow from left to right
        newGrid[0][0].hasCube = true;
        newGrid[0][0].connections = { entry: 'W', exit: 'E' };
        
        newGrid[0][1].hasCube = true;
        newGrid[0][1].connections = { entry: 'W', exit: 'E' };
        
        newGrid[0][2].hasCube = true;
        newGrid[0][2].connections = { entry: 'W', exit: 'E' };
        
        // Bottom row - flow from left to right
        newGrid[2][0].hasCube = true;
        newGrid[2][0].connections = { entry: 'W', exit: 'E' };
        
        newGrid[2][1].hasCube = true;
        newGrid[2][1].connections = { entry: 'W', exit: 'E' };
        
        newGrid[2][2].hasCube = true;
        newGrid[2][2].connections = { entry: 'W', exit: 'E' };
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
    // Clear console before updating requirements on grid change
    console.clear();
    
    const newRequirements = calculateRequirements(grid);
    setRequirements(newRequirements);
    logGridState(grid, newRequirements);
  }, [grid, calculateRequirements]);

  // Function to clear the grid and reset to initial state
  const clearGrid = useCallback(() => {
    console.log("Clearing grid configuration");
    // Clear error state
    setError(null);
    // Reset grid to empty state
    setGrid(initializeGrid());
    // Reset requirements
    setRequirements({
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
    // Clear any cached data
    clearConnectedCubesCache();
  }, []);

  return {
    grid,
    requirements,
    toggleCell,
    toggleCladding,
    applyPreset,
    error,
    clearGrid
  };
};

export default useGridState;
