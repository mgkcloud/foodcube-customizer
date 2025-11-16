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
        }
      };
      
      debug.debug(`Cube [${row},${col}] in path`, cubeInfo);

      // TEMP DEBUG for bottom-right corner
      if (row === 2 && col === 2) {
        console.log('🔍 DEBUG PipelineVisualizer [2,2]:', {
          rawConnections: cell.connections,
          visualEntry,
          visualExit,
          isCorner,
          pathPosition,
          isInPath: isCubeInPath,
          turn: `${visualEntry}→${visualExit}`
        });
      }

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

  const { subgrid } = pipeConfig;
  const connectorLabel = formatConnectorLabel(visualEntry, visualExit);

  // Log the subgrid state for debugging - moved to effect to prevent re-renders
  useEffect(() => {
    if (showDebug) {
      debug.debug(`Subgrid for [${row},${col}]`, {
        entry: visualEntry,
        exit: visualExit,
        type: isCorner ? 'Corner' : 'Straight',
        blockCount: subgrid.flat().filter(Boolean).length
      });
      
      // Only show full subgrid at trace level
      debug.trace(`Subgrid matrix for [${row},${col}]`, {
        grid: subgrid.map(row => row.map(cell => cell ? 'R' : '.'))
      });
    }
  }, [showDebug, row, col, visualEntry, visualExit, subgrid, isCorner, gridKey]);

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
  if (isCorner) {
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
  const shouldShowEntryArrow = Boolean(visualEntry) && isCorner && !isStartCube;
  
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
    <div className={`pipe-container ${flowClasses.join(' ')}`}>
      <PipeRenderer subgrid={subgrid} />
      
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
          title={isCorner ? 
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
            isCorner ? 'corner' : 'straight',
            !isCorner ? `straight-${getStraightOrientation(visualEntry, visualExit)}` : '',
          ].filter(Boolean).join(' ')}
          title={isCorner ? 'Corner Connector' : 'Straight Coupling'}
          aria-hidden="true"
        />
      
      {/* Position indicator */}
      {showDebug && (
        <div className="position-indicator">
          {pathPosition + 1}/{connectedCubes.length}
        </div>
      )}
      
      {/* Debug flow labels */}
      {showDebug && (
        <div className="debug-labels">
          <div className="debug-label cube-type">
            {cubeType.toUpperCase()}
          </div>
          <div className="debug-label position">
            [{row},{col}]
          </div>
        </div>
      )}
    </div>
  );
};
