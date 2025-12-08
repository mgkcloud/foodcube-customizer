import React, { useEffect, useMemo } from 'react';
import { GridCell } from './types';
import { validateIrrigationPath, findConnectedCubes } from '@/utils/validation/flowValidator';
import { getVisualConnections } from '../utils/flowHelpers';
import { calculatePipeConfiguration } from '@/utils/visualization/pipeConfigurator';
import { PipeRenderer } from './PipeRenderer';
import { visualizeFlow } from '@/utils/core/flowVisualizer';
import { CompassDirection } from './types';
import { hasAdjacentCube } from '@/utils/shared/gridUtils';
import { debug } from '@/utils/shared/debugUtils';

const getAxisClass = (direction: CompassDirection | null | undefined): string => {
  if (!direction) return '';
  return direction === 'N' || direction === 'S' ? 'axis-vertical' : 'axis-horizontal';
};

const getStraightOrientation = (
  entry: CompassDirection | null,
  exit: CompassDirection | null
): 'horizontal' | 'vertical' => {
  const directions = [entry, exit].filter(Boolean) as CompassDirection[];
  if (directions.length === 0) {
    return 'horizontal';
  }

  const hasVertical = directions.some(dir => dir === 'N' || dir === 'S');
  const hasHorizontal = directions.some(dir => dir === 'E' || dir === 'W');

  if (hasVertical && !hasHorizontal) {
    return 'vertical';
  }

  if (hasHorizontal && !hasVertical) {
    return 'horizontal';
  }

  const primaryDirection = directions[0];
  return primaryDirection === 'N' || primaryDirection === 'S' ? 'vertical' : 'horizontal';
};

const formatConnectorLabel = (
  entry: CompassDirection | null,
  exit: CompassDirection | null
): string => {
  if (entry && exit) {
    return `${entry} to ${exit}`;
  }

  if (entry) {
    return `from ${entry}`;
  }

  if (exit) {
    return `to ${exit}`;
  }

  return '';
};

interface PipelineVisualizerProps {
  cell: GridCell;
  row: number;
  col: number;
  grid: GridCell[][];
  debug?: boolean;
}

// Helper to determine if a connection is a corner (90-degree turn)
const isCornerConnection = (entry: CompassDirection | null, exit: CompassDirection | null): boolean => {
  if (!entry || !exit) return false;

  // Check if this is a valid corner turn (must match VALID_TURNS from irrigationRules)
  // Only accept the 8 valid 90-degree turns
  const turn = `${entry}→${exit}`;
  const validCorners = [
    'N→E', 'E→S', 'S→W', 'W→N',  // Right turns
    'N→W', 'W→S', 'S→E', 'E→N'   // Left turns
  ];

  return validCorners.includes(turn);
};

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  cell,
  row,
  col,
  grid,
  debug: showDebug = false,
}) => {
  // Memoize the grid to prevent unnecessary recalculations
  const gridKey = useMemo(() => {
    return JSON.stringify(grid.map(row => 
      row.map(cell => ({
        hasCube: cell.hasCube,
        connections: cell.connections
      }))
    ));
  }, [grid]);

  // Memoize connected cubes calculation to prevent recursion
  const connectedCubes = useMemo(() => {
    if (!cell.hasCube) return [];
    return findConnectedCubes(grid, row, col);
  }, [grid, row, col, cell.hasCube, gridKey]);

  // Memoize path validation to prevent excessive recalculation
  const isValidPath = useMemo(() => {
    return validateIrrigationPath(grid);
  }, [grid, gridKey]);
  
  useEffect(() => {
    // Visualize flow whenever the grid changes, with proper dependency tracking
    visualizeFlow(grid);
  }, [gridKey]); // Use gridKey instead of grid to prevent excessive calls

  // Get visual connections for rendering
  const { visualEntry, visualExit } = useMemo(() => {
    return getVisualConnections(grid, row, col, cell);
  }, [gridKey, row, col, cell]);

  // Prefer the actual stored connections for physical orientation; fall back to visual mapping
  const doglegEntry = cell.connections?.entry || visualEntry;
  const doglegExit = cell.connections?.exit || visualExit;

  const hasNeighborInExitDirection = useMemo(() => {
    if (!visualExit) return false;
    return hasAdjacentCube(grid, row, col, visualExit);
  }, [grid, row, col, visualExit, gridKey]);

  // Check if this cube is part of the path - memoized
  const pathInfo = useMemo(() => {
    const isCubeInPath = connectedCubes.some(([r, c]) => r === row && c === col);
    
    // Get the position of this cube in the path
    const pathPosition = isCubeInPath 
      ? connectedCubes.findIndex(([r, c]) => r === row && c === col) 
      : -1;
    
    // Determine if this is a start, end, or middle cube
    const isStartCube = pathPosition === 0;
    const isEndCube = pathPosition === connectedCubes.length - 1;
    
    // Determine if this is a corner connector
    const isCorner = isCornerConnection(visualEntry, visualExit);
    
    // Cube type based on position and connection
    let cubeType = 'middle';
    if (isStartCube) cubeType = 'start';
    else if (isEndCube) cubeType = 'end';
    else if (isCorner) cubeType = 'corner';

    return {
      isCubeInPath,
      pathPosition,
      isStartCube,
      isEndCube,
      isCorner,
      cubeType
    };
  }, [connectedCubes, row, col, visualEntry, visualExit]);

  const { isCubeInPath, pathPosition, isStartCube, isEndCube, isCorner, cubeType } = pathInfo;

  // Build a stable, ordered path following visual exits so we can alternate corner visuals in sequence
  const pathOrder = useMemo(() => {
    if (!connectedCubes.length) return { ordered: [] as [number, number][], infoMap: new Map<string, { entry: CompassDirection | null; exit: CompassDirection | null; isCorner: boolean }>() };

    const key = (r: number, c: number) => `${r},${c}`;
    const keySet = new Set(connectedCubes.map(([r, c]) => key(r, c)));

    const infoMap = new Map<string, { entry: CompassDirection | null; exit: CompassDirection | null; isCorner: boolean }>();
    connectedCubes.forEach(([r, c]) => {
      const cellAt = grid[r][c];
      const { visualEntry: e, visualExit: x } = getVisualConnections(grid, r, c, cellAt);
      infoMap.set(key(r, c), { entry: e, exit: x, isCorner: isCornerConnection(e, x) });
    });

    const delta = (dir: CompassDirection | null): [number, number] => {
      switch (dir) {
        case 'N': return [-1, 0];
        case 'S': return [1, 0];
        case 'E': return [0, 1];
        case 'W': return [0, -1];
        default: return [0, 0];
      }
    };

    // Find a start: a cube whose entry points out of the component/bounds
    const findStart = () => {
      for (const [r, c] of connectedCubes) {
        const info = infoMap.get(key(r, c));
        if (!info) continue;
        const [dr, dc] = delta(info.entry);
        const upstreamKey = key(r + dr, c + dc);
        if (!keySet.has(upstreamKey)) {
          return [r, c] as [number, number];
        }
      }
      return connectedCubes[0];
    };

    const ordered: [number, number][] = [];
    const visited = new Set<string>();
    let current: [number, number] | null = findStart();

    while (current) {
      const k = key(current[0], current[1]);
      if (visited.has(k)) break;
      visited.add(k);
      ordered.push(current);

      const info = infoMap.get(k);
      if (!info) break;
      const [dr, dc] = delta(info.exit);
      const nextKey = key(current[0] + dr, current[1] + dc);
      if (!keySet.has(nextKey)) break;
      current = [current[0] + dr, current[1] + dc];
    }

    return { ordered, infoMap };
  }, [connectedCubes, grid, gridKey]);

  // Corner/straight display override based purely on corner index in flow order.
  const displayIsCorner = useMemo(() => {
    if (!isCorner) return false;
    const cornersInOrder = pathOrder.ordered.filter(([r, c]) => {
      const info = pathOrder.infoMap.get(`${r},${c}`);
      return info?.isCorner;
    });

    // For simple shapes (like the U-shape) where we only have a couple of corners,
    // keep the visual type faithful to the actual flow. The alternating override
    // was hiding the second corner and made the visual look like straight→corner
    // instead of corner→straight on the bottom row.
    if (cornersInOrder.length <= 2) return true;

    const idx = cornersInOrder.findIndex(([r, c]) => r === row && c === col);
    if (idx === -1) return isCorner;
    return idx % 2 === 0; // 0th, 2nd, ... stay corner; 1st, 3rd, ... flip to straight
  }, [isCorner, pathOrder, row, col]);
  
  // Enhanced logging for cube status - throttled to prevent log flooding
  useEffect(() => {
    if (showDebug && isCubeInPath) {
      // Use the new debug utility with compact format
      const cubeInfo = {
        position: [row, col],
        pathPosition,
        total: connectedCubes.length,
        status: {
          isStart: isStartCube,
          isEnd: isEndCube,
          isCorner,
          type: cubeType
        },
        connections: {
          entry: cell.connections.entry,
          exit: cell.connections.exit,
          visualEntry,
          visualExit
        },
        connector: {
          verticalLinePosition,
          displayIsCorner,
          offsets: connectorOffsets,
          cornerSequenceIndex: pathOrder.ordered.findIndex(([r, c]) => r === row && c === col)
        }
      };
      
      debug.debug(`Cube [${row},${col}] in path`, cubeInfo);

      // Only log neighbors at trace level to reduce token usage
      if (isCubeInPath) {
        const prevCube = pathPosition > 0 ? connectedCubes[pathPosition - 1] : null;
        const nextCube = pathPosition < connectedCubes.length - 1 ? connectedCubes[pathPosition + 1] : null;
        
        debug.trace(`Path neighbors for [${row},${col}]`, {
          prev: prevCube,
          next: nextCube,
          pathLength: connectedCubes.length
        });
      }
    }
  }, [showDebug, isCubeInPath, row, col, pathPosition, connectedCubes.length, isValidPath, 
      isStartCube, isEndCube, isCorner, cubeType, cell.connections, pathInfo, gridKey, visualEntry, visualExit]);
  
  if (!isCubeInPath || !cell.hasCube) {
    return null;
  }
  // Calculate pipe configuration - memoized to prevent recalculation
  const pipeConfig = useMemo(() => {
    return calculatePipeConfiguration(
      grid,
      row,
      col,
      cell,
      connectedCubes,
      visualEntry,
      visualExit
    );
  }, [grid, row, col, cell, connectedCubes, visualEntry, visualExit, gridKey]);

  const { subgrid, verticalLinePosition } = pipeConfig;
  const connectorLabel = formatConnectorLabel(visualEntry, visualExit);

  // Align connector pills to the active flow leg (left/right column or bottom row)
  const connectorOffsets = useMemo(() => {
    const horizontal = verticalLinePosition === 'west' ? '34%' : verticalLinePosition === 'east' ? '66%' : '50%';
    const hasHorizontalFlow = visualEntry === 'E' || visualEntry === 'W' || visualExit === 'E' || visualExit === 'W';
    const vertical = hasHorizontalFlow ? '66%' : '50%'; // horizontal pipes use the lower row in the subgrid
    return { horizontal, vertical };
  }, [verticalLinePosition, visualEntry, visualExit]);

  // Log the subgrid state for debugging - moved to effect to prevent re-renders
  useEffect(() => {
    if (showDebug) {
      debug.debug(`Subgrid for [${row},${col}]`, {
        entry: visualEntry,
        exit: visualExit,
        type: isCorner ? 'Corner' : 'Straight',
        blockCount: subgrid.flat().filter(Boolean).length,
        connectorOffsets
      });
      
      // Only show full subgrid at trace level
      debug.trace(`Subgrid matrix for [${row},${col}]`, {
        grid: subgrid.map(row => row.map(cell => cell ? 'R' : '.'))
      });
    }
  }, [showDebug, row, col, visualEntry, visualExit, subgrid, isCorner, gridKey, connectorOffsets, displayIsCorner, verticalLinePosition, pathOrder]);

  // Determine CSS classes based on flow direction and position
  const flowClasses = [];
  
  // Add flow direction indicators
  if (visualEntry) {
    flowClasses.push(`flow-from-${visualEntry.toLowerCase()}`);
  }
  
  if (visualExit) {
    flowClasses.push(`flow-to-${visualExit.toLowerCase()}`);
  }
  
  // Add position and type specific classes
  flowClasses.push(`flow-${cubeType}`);
  
  // Add corner connector classes if applicable
  if (displayIsCorner) {
    flowClasses.push('connector-corner');
    
    // Add specific corner type
    if (visualEntry && visualExit) {
      flowClasses.push(`corner-${visualEntry.toLowerCase()}-${visualExit.toLowerCase()}`);
    }
  } else {
    flowClasses.push('connector-straight');
  }

  // Completely revised arrow display logic to ensure one arrow between connected cubes
  
  // For entry arrows: show only if NOT the start cube, and only for corners
  // This ensures corners get proper visualization
  const shouldShowEntryArrow = Boolean(visualEntry) && displayIsCorner && !isStartCube;
  
  // For exit arrows: complete rewrite of logic to ensure end cube arrows are never shown
  // Use multiple checks to be extremely defensive
  const shouldShowExitArrow = (() => {
    // Never show on the end cube - use multiple checks to be safe
    if (isEndCube) return false;
    if (pathPosition === connectedCubes.length - 1) return false;
    // Only show if there's an exit direction
    if (!visualExit) return false;
    // Don't render if no adjacent cube actually exists in that direction
    if (!hasNeighborInExitDirection) {
      if (showDebug) {
        debug.warn(`No adjacent cube found at [${row},${col}] exiting ${visualExit}, hiding connector`);
      }
      return false;
    }
    
    // Debug logs to help understand rendering logic
    if (showDebug) {
      debug.debug(`Arrow logic for [${row},${col}]`, {
        showExitArrow: true,
        isEndCube,
        pathPosition,
        totalCubes: connectedCubes.length,
        connections: {
          raw: cell.connections,
          visual: { entry: visualEntry, exit: visualExit }
        }
      });
    }
    
    return true;
  })();

  // Add additional logging specific to exit arrows
  useEffect(() => {
    if (showDebug && isEndCube && visualExit) {
      debug.warn(`End cube detected at [${row},${col}] - exit arrows should be hidden`, {
        isEndCube,
        pathPosition,
        totalCubes: connectedCubes.length,
        shouldShowExitArrow
      });
    }
  }, [showDebug, isEndCube, row, col, pathPosition, connectedCubes.length, visualExit, shouldShowExitArrow]);

  return (
    <div
      className={`pipe-container ${flowClasses.join(' ')}`}
      style={
        {
          '--connector-x': connectorOffsets.horizontal,
          '--connector-y': connectorOffsets.vertical,
        } as React.CSSProperties
      }
    >
      <PipeRenderer subgrid={subgrid} />

      {/* Visualize corner dog-leg (entry -> bend -> exit) without affecting logic */}
      {isCorner && doglegEntry && doglegExit && (
        <div
          className={[
            'corner-dogleg',
            `from-${doglegEntry.toLowerCase()}`,
            `to-${doglegExit.toLowerCase()}`,
          ].join(' ')}
          aria-hidden="true"
        />
      )}
      
      {/* Entry connectors for corners only */}
      {shouldShowEntryArrow && (
        <div
          className={[
            'flow-connector',
            'entry',
            `entry-${visualEntry?.toLowerCase()}`,
            getAxisClass(visualEntry),
            isCorner ? 'corner' : 'straight'
          ].filter(Boolean).join(' ')}
          title={`Corner Connector${connectorLabel ? ` (${connectorLabel})` : ''}`}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Exit connectors for both straight and corner connectors */}
      {shouldShowExitArrow && (
        <div
          className={[
            'flow-connector',
            'exit',
            `exit-${visualExit?.toLowerCase()}`,
            getAxisClass(visualExit),
            isCorner ? 'corner' : 'straight'
          ].filter(Boolean).join(' ')}
          title={displayIsCorner ? 
            `Corner Connector${connectorLabel ? ` (${connectorLabel})` : ''}` : 
            `Straight Connector${connectorLabel ? ` (${connectorLabel})` : ''}`}
          role="presentation"
          aria-hidden="true"
        />
      )}
      
      {/* Connection type indicator */}
      <div
          className={[
            'connector-visual',
            displayIsCorner ? 'corner' : 'straight',
            !displayIsCorner ? `straight-${getStraightOrientation(visualEntry, visualExit)}` : '',
          ].filter(Boolean).join(' ')}
          title={displayIsCorner ? 'Corner Connector' : 'Straight Coupling'}
          aria-hidden="true"
        />
      
      {/* Position indicator */}
      {showDebug && (
        <div className="position-indicator">
          {pathPosition + 1}/{connectedCubes.length}
        </div>
      )}
      
    </div>
  );
};
