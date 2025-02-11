import { useState, useCallback, useEffect } from 'react';
import { GridCell, Requirements } from '@/components/types';
import { hasAdjacentCube } from '@/utils/shared/gridUtils';
import { countPanels } from '@/utils/calculation/panelCounter';
import { packPanels } from '@/utils/calculation/panelPacker';
import { createEmptyCell } from '@/utils/core/gridCell';
import { validateIrrigationPath } from '@/utils/validation/flowValidator';


const GRID_SIZE = 3;

const initializeGrid = (): GridCell[][] => {
  return Array(GRID_SIZE).fill(null).map(() =>
    Array(GRID_SIZE).fill(null).map(() => createEmptyCell())
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
    const gridState = grid.map(row => 
      row.map(cell => ({
        hasCube: cell.hasCube,
        connections: cell.connections,
        claddingEdges: Array.from(cell.claddingEdges)
      }))
    );

    console.group('Grid State Update');
    console.log('Current Grid Layout:', gridState);
    console.log('Panel Requirements:', {
      ...requirements,
      totalPanels: requirements.sidePanels + requirements.leftPanels + requirements.rightPanels,
      totalConnectors: requirements.cornerConnectors + requirements.straightCouplings
    });
    
    // Log panel distribution
    const panelDistribution = {
      sides: requirements.sidePanels > 0 ? `${requirements.sidePanels} panels (blue)` : 'None',
      left: requirements.leftPanels > 0 ? `${requirements.leftPanels} panels (green)` : 'None',
      right: requirements.rightPanels > 0 ? `${requirements.rightPanels} panels (purple)` : 'None'
    };
    console.log('Panel Distribution:', panelDistribution);
    console.groupEnd();
  };

  const validateAndUpdateGrid = useCallback((newGrid: GridCell[][]) => {
    // Clear previous errors
    setError(null);

    // Check if adding this cube would create an invalid configuration
    const isValid = validateIrrigationPath(newGrid);
    if (!isValid) {
      console.warn('Invalid Configuration:', 'T-shaped configurations are not allowed');
      setError('Invalid cube placement: T-shaped configurations are not allowed');
      return false;
    }

    return true;
  }, []);

  const toggleCell = useCallback((row: number, col: number) => {
    setGrid(prev => {
      const newGrid = prev.map(r => r.map(cell => ({ 
        ...cell, 
        claddingEdges: new Set(cell.claddingEdges),
        connections: { ...cell.connections }
      })));
      
      // If we're adding a cube
      if (!prev[row][col].hasCube) {
        // Add cladding to all exposed edges
        const exposedEdges = new Set<'N' | 'E' | 'S' | 'W'>();
        (['N', 'E', 'S', 'W'] as const).forEach(edge => {
          if (!hasAdjacentCube(prev, row, col, edge)) {
            exposedEdges.add(edge);
          }
        });
        
        newGrid[row][col] = {
          hasCube: true,
          claddingEdges: exposedEdges,
          connections: {
            entry: null,
            exit: null
          }
        };

        // Update connections for adjacent cubes
        const adjacentPositions = [
          { r: row-1, c: col, direction: 'S' as const },
          { r: row+1, c: col, direction: 'N' as const },
          { r: row, c: col-1, direction: 'E' as const },
          { r: row, c: col+1, direction: 'W' as const }
        ];

        let connectedCubes = adjacentPositions.filter(({ r, c }) => 
          r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && newGrid[r][c].hasCube
        );

        // If exactly two adjacent cubes, set up connections
        if (connectedCubes.length === 2) {
          const [first, second] = connectedCubes;
          newGrid[row][col].connections = {
            entry: first.direction,
            exit: second.direction
          };
        }
      } else {
        // If removing a cube, update adjacent cubes' cladding and connections
        newGrid[row][col] = {
          hasCube: false,
          claddingEdges: new Set(),
          connections: {
            entry: null,
            exit: null
          }
        };

        // Update adjacent cubes to add cladding on the newly exposed sides
        const adjacentPositions = [
          { r: row-1, c: col, edge: 'S' as const },
          { r: row+1, c: col, edge: 'N' as const },
          { r: row, c: col-1, edge: 'E' as const },
          { r: row, c: col+1, edge: 'W' as const }
        ];

        adjacentPositions.forEach(({ r, c, edge }) => {
          if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && newGrid[r][c].hasCube) {
            newGrid[r][c].claddingEdges.add(edge);
            // Clear connections when a cube is removed
            newGrid[r][c].connections = {
              entry: null,
              exit: null
            };
          }
        });
      }
      // Validate the new configuration before applying it
      if (!validateAndUpdateGrid(newGrid)) {
        return prev; // Return previous grid if invalid
      }
      return newGrid;
    });
  }, []);

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
      return newGrid;
    });
  }, []);

  const applyPreset = useCallback((preset: GridCell[][]) => {
    if (!Array.isArray(preset) || !preset.every(row => Array.isArray(row))) {
      console.error('Invalid preset format:', preset);
      return;
    }

    // Create a deep copy of the preset grid
    const newGrid: GridCell[][] = preset.map(row => 
      row.map(cell => ({
        hasCube: cell.hasCube,
        claddingEdges: new Set(cell.claddingEdges),
        connections: {
          entry: cell.connections?.entry || null,
          exit: cell.connections?.exit || null
        }
      }))
    );

    setGrid(newGrid);
  }, []);

  // Update requirements whenever grid changes
  useEffect(() => {
    // Count panels and get requirements
    const requirements = countPanels(grid);
    // Pass through panel packer (which now just validates and returns requirements)
    const newRequirements = packPanels(requirements);
    setRequirements(newRequirements);

    // Log the updated state with enhanced information
    logGridState(grid, newRequirements);
  }, [grid]);

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
