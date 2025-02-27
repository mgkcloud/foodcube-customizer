import { useState, useCallback, useEffect } from 'react';
import { GridCell, Requirements, CompassDirection } from '@/components/types';
import { hasAdjacentCube } from '@/utils/shared/gridUtils';
import { calculateRequirements as calculateFlowRequirements } from '@/utils/calculation/requirementsCalculator';
import { createEmptyCell } from '@/utils/core/gridCell';
import { validateIrrigationPath, clearConnectedCubesCache, findConnectedCubes } from '@/utils/validation/flowValidator';
import { analyzePath, PathCube } from '@/utils/calculation/flowAnalyzer';

const GRID_SIZE = 3;

// Initialize grid with proper cell structure
const initializeGrid = (): GridCell[][] => {
  return Array(GRID_SIZE).fill(null).map((_, rowIndex) =>
    Array(GRID_SIZE).fill(null).map((_, colIndex) => ({
      ...createEmptyCell(),
      id: `cell-${rowIndex}-${colIndex}`,
      row: rowIndex,
      col: colIndex,
      type: 'standard'
    }))
  );
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

  // Debug logging helper
  const logGridState = (grid: GridCell[][], requirements: Requirements) => {
    const gridState = grid.map((row, rowIndex) => 
      row.map((cell, colIndex) => ({
        position: `[${rowIndex},${colIndex}]`,
        hasCube: cell.hasCube,
        connections: cell.connections,
        claddingEdges: Array.from(cell.claddingEdges),
        rotation: cell.rotation,
        adjacentCubes: {
          north: hasAdjacentCube(grid, rowIndex, colIndex, 'N'),
          east: hasAdjacentCube(grid, rowIndex, colIndex, 'E'),
          south: hasAdjacentCube(grid, rowIndex, colIndex, 'S'),
          west: hasAdjacentCube(grid, rowIndex, colIndex, 'W')
        }
      }))
    );

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
      
      // Find connected cubes
      const connectedCubes = findConnectedCubes(grid, allCubes[0][0], allCubes[0][1]);
      
      // Convert to PathCube format for flow analysis
      const pathCubes: PathCube[] = connectedCubes.map(([row, col]) => {
        const entry = grid[row][col].connections.entry;
        const exit = grid[row][col].connections.exit;
        
        // Determine flow direction based on entry/exit
        let flowDirection: 'horizontal' | 'vertical' = 'horizontal';
        if (entry === 'N' || entry === 'S' || exit === 'N' || exit === 'S') {
          flowDirection = 'vertical';
        }
        
        return {
          row,
          col,
          subgrid: [{ subgridRow: 0, subgridCol: 0 }],
          entry,
          exit,
          flowDirection,
          rotation: 0
        };
      });
      
      // Calculate requirements using our simplified flow-based approach
      const packedRequirements = calculateFlowRequirements(pathCubes);
      console.log("Flow-based requirements:", packedRequirements);
      
      return packedRequirements;
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
      const cell = newGrid[row][col];
      cell.hasCube = !cell.hasCube;
      
      // Reset connections and cladding edges when toggling
      cell.connections = { entry: null, exit: null };
      cell.claddingEdges = new Set();
      
      // If removing a cube, we need to validate the remaining path
      // Otherwise the validation will happen after calculating panels
      if (!cell.hasCube) {
        const isValidPath = validateIrrigationPath(newGrid);
        if (!isValidPath) {
          setError('Invalid irrigation path. Cubes must form a continuous line.');
        } else {
          setError(null);
        }
      }
      
      // Recalculate panel requirements
      const newRequirements = calculateRequirements(newGrid);
      setRequirements(newRequirements);
      
      // Log the updated state (for debugging)
      logGridState(newGrid, newRequirements);
      
      return newGrid;
    });
  }, [calculateRequirements]);

  const toggleCladding = useCallback((row: number, col: number, edge: 'N' | 'E' | 'S' | 'W') => {
    setGrid(prev => {
      // Only allow toggling if the edge is exposed (no adjacent cube)
      if (hasAdjacentCube(prev, row, col, edge)) {
        return prev;
      }

      const newGrid = [...prev];
      newGrid[row] = [...prev[row]];
      const cell = { ...prev[row][col] };
      const newEdges = new Set(cell.claddingEdges);
      
      if (newEdges.has(edge)) {
        newEdges.delete(edge);
      } else {
        newEdges.add(edge);
      }
      
      cell.claddingEdges = newEdges;
      newGrid[row][col] = cell;
 
      // Recalculate requirements immediately after updating the grid
      const newRequirements = calculateRequirements(newGrid);
      setRequirements(newRequirements);
      
      // Log the updated state (for debugging)
      logGridState(newGrid, newRequirements);
      
      return newGrid;
    });
  }, [calculateRequirements]);

  const applyPreset = useCallback((preset: GridCell[][]) => {
    // Clear caches to ensure fresh calculation
    clearConnectedCubesCache();
    
    if (!Array.isArray(preset) || !preset.every(row => Array.isArray(row))) {
      console.error('Invalid preset format:', preset);
      return;
    }

    // Create a deep copy of the preset grid
    const ROTATION_MAP = {
      N: 0,   // Flow from North to South
      E: 90,  // Flow from East to West
      S: 180, // Flow from South to North
      W: 270  // Flow from West to East
    } as const;

    // Create a new grid with all required properties
    const newGrid: GridCell[][] = preset.map((row, rowIndex) => 
      row.map((cell, colIndex) => ({
        id: `cell-${rowIndex}-${colIndex}`,
        row: rowIndex,
        col: colIndex,
        type: 'standard',
        hasCube: cell.hasCube,
        claddingEdges: new Set(cell.claddingEdges),
        connections: {
          entry: cell.connections?.entry || null,
          exit: cell.connections?.exit || null
        },
        rotation: cell.connections?.entry ? ROTATION_MAP[cell.connections.entry] : 0
      }))
    );

    // Validate the irrigation path
    const isValidPath = validateIrrigationPath(newGrid);
    if (!isValidPath) {
      console.error('Invalid preset configuration: Invalid irrigation path');
      setError('Invalid preset configuration: Invalid irrigation path');
      return;
    }

    // Update the grid
    setGrid(newGrid);

    // Calculate requirements for the new grid
    const newRequirements = calculateRequirements(newGrid);
    setRequirements(newRequirements);

    // Log the updated state (for debugging)
    logGridState(newGrid, newRequirements);
  }, [calculateRequirements]);

  // Recalculate requirements whenever the grid changes
  useEffect(() => {
    const newRequirements = calculateRequirements(grid);
    setRequirements(newRequirements);
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
