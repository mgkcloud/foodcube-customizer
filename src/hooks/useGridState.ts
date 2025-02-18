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
    console.log('Current Grid Layout:', JSON.stringify(gridState, null, 2));
    console.log('Panel Requirements:', JSON.stringify({
      ...requirements,
      totalPanels: requirements.sidePanels + requirements.leftPanels + requirements.rightPanels,
      totalConnectors: requirements.cornerConnectors + requirements.straightCouplings,
      breakdown: {
        panels: {
          side: `${requirements.sidePanels} panels (blue)`,
          left: `${requirements.leftPanels} panels (green)`,
          right: `${requirements.rightPanels} panels (purple)`
        },
        connectors: {
          corner: `${requirements.cornerConnectors} connectors`,
          straight: `${requirements.straightCouplings} couplings`
        },
        packs: {
          fourPack: {
            regular: requirements.fourPackRegular,
            extraTall: requirements.fourPackExtraTall
          },
          twoPack: {
            regular: requirements.twoPackRegular,
            extraTall: requirements.twoPackExtraTall
          }
        }
      }
    }, null, 2));
    
    // Log panel distribution
    const panelDistribution = {
      sides: requirements.sidePanels > 0 ? `${requirements.sidePanels} panels (blue)` : 'None',
      left: requirements.leftPanels > 0 ? `${requirements.leftPanels} panels (green)` : 'None',
      right: requirements.rightPanels > 0 ? `${requirements.rightPanels} panels (purple)` : 'None',
      connectors: {
        corner: requirements.cornerConnectors > 0 ? `${requirements.cornerConnectors} connectors` : 'None',
        straight: requirements.straightCouplings > 0 ? `${requirements.straightCouplings} couplings` : 'None'
      }
    };
    console.log('Panel Distribution:', JSON.stringify(panelDistribution, null, 2));
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
        
        // Get adjacent cubes for determining rotation
        const adjacentCubes = [
          { r: row-1, c: col, direction: 'S' as const, opposite: 'N' as const },
          { r: row+1, c: col, direction: 'N' as const, opposite: 'S' as const },
          { r: row, c: col-1, direction: 'E' as const, opposite: 'W' as const },
          { r: row, c: col+1, direction: 'W' as const, opposite: 'E' as const }
        ].filter(({ r, c }) => 
          r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && prev[r][c].hasCube
        );

        // Initialize the new cell
        newGrid[row][col] = {
          hasCube: true,
          claddingEdges: exposedEdges,
          connections: {
            entry: null,
            exit: null
          },
          rotation: 0 // Default rotation
        };

        // If we have exactly one adjacent cube, align with it
        if (adjacentCubes.length === 1) {
          const [adjacent] = adjacentCubes;
          const existingCube = prev[adjacent.r][adjacent.c];
          
          // If the existing cube has a connection, align with it
          if (existingCube.connections.exit === adjacent.opposite) {
            newGrid[row][col].connections.entry = adjacent.direction;
            newGrid[row][col].rotation = existingCube.rotation;
          }
        }

        // If we have exactly two adjacent cubes, set up connections and rotation
        if (adjacentCubes.length === 2) {
          const [first, second] = adjacentCubes;
          newGrid[row][col].connections = {
            entry: first.direction,
            exit: second.direction
          };
          
          // Set rotation based on entry direction
          const ROTATION_MAP = {
            N: 0,   // Flow from North to South
            E: 90,  // Flow from East to West
            S: 180, // Flow from South to North
            W: 270  // Flow from West to East
          } as const;
          
          newGrid[row][col].rotation = ROTATION_MAP[first.direction];
        }
      } else {
        // If removing a cube, update adjacent cubes' cladding and connections
        newGrid[row][col] = {
          hasCube: false,
          claddingEdges: new Set(),
          connections: {
            entry: null,
            exit: null
          },
          rotation: 0
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
    const ROTATION_MAP = {
      N: 0,   // Flow from North to South
      E: 90,  // Flow from East to West
      S: 180, // Flow from South to North
      W: 270  // Flow from West to East
    } as const;

    const newGrid: GridCell[][] = preset.map(row => 
      row.map(cell => ({
        hasCube: cell.hasCube,
        claddingEdges: new Set(cell.claddingEdges),
        connections: {
          entry: cell.connections?.entry || null,
          exit: cell.connections?.exit || null
        },
        rotation: cell.connections?.entry ? ROTATION_MAP[cell.connections.entry] : 0
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
