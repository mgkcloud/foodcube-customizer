import React, { useEffect, useMemo, useCallback } from 'react';
import { GridCell } from './types';
import { validateIrrigationPath, findConnectedCubes } from '@/utils/validation/flowValidator';
import { getVisualConnections } from '../utils/flowHelpers';
import { calculatePipeConfiguration } from '@/utils/visualization/pipeConfigurator';
import { PipeRenderer } from './PipeRenderer';
import { visualizeFlow } from '@/utils/core/flowVisualizer';
import { CompassDirection } from './types';
import { debug } from '@/utils/shared/debugUtils';

// Define connector colors to match the key
const CONNECTOR_COLORS = {
  corner: '#FF9800', // Orange/Amber
  straight: '#4B5563' // Gray
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
  
  // Straight connections (opposite directions)
  const straightConnections = [
    ['N', 'S'],
    ['S', 'N'],
    ['E', 'W'],
    ['W', 'E']
  ];
  
  // Check if it's not a straight connection
  return !straightConnections.some(([e, x]) => e === entry && x === exit);
};

// Helper to get rotation angle based on entry and exit points
const getArrowRotation = (direction: CompassDirection): number => {
  switch (direction) {
    case 'N': return 0;    // Up
    case 'E': return 90;   // Right
    case 'S': return 180;  // Down
    case 'W': return 270;  // Left
    default: return 0;
  }
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
    const isCorner = isCornerConnection(cell.connections.entry, cell.connections.exit);
    
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
  }, [connectedCubes, row, col, cell.connections.entry, cell.connections.exit]);

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
          exit: cell.connections.exit
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
      isStartCube, isEndCube, isCorner, cubeType, cell.connections, pathInfo, gridKey]);
  
  if (!isCubeInPath || !cell.hasCube) {
    return null;
  }

  // Get visual connections
  const { visualEntry, visualExit } = getVisualConnections(grid, row, col, cell);

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
  if (cell.connections.entry) {
    flowClasses.push(`flow-from-${cell.connections.entry.toLowerCase()}`);
  }
  
  if (cell.connections.exit) {
    flowClasses.push(`flow-to-${cell.connections.exit.toLowerCase()}`);
  }
  
  // Add position and type specific classes
  flowClasses.push(`flow-${cubeType}`);
  
  // Add corner connector classes if applicable
  if (isCorner) {
    flowClasses.push('connector-corner');
    
    // Add specific corner type
    if (cell.connections.entry && cell.connections.exit) {
      flowClasses.push(`corner-${cell.connections.entry.toLowerCase()}-${cell.connections.exit.toLowerCase()}`);
    }
  } else {
    flowClasses.push('connector-straight');
  }

  // Completely revised arrow display logic to ensure one arrow between connected cubes
  
  // For entry arrows: show only if NOT the start cube, and only for corners
  // This ensures corners get proper visualization
  const shouldShowEntryArrow = cell.connections.entry && isCorner && !isStartCube;
  
  // For exit arrows: complete rewrite of logic to ensure end cube arrows are never shown
  // Use multiple checks to be extremely defensive
  const shouldShowExitArrow = (() => {
    // Never show on the end cube - use multiple checks to be safe
    if (isEndCube) return false;
    if (pathPosition === connectedCubes.length - 1) return false;
    // Only show if there's an exit direction
    if (!cell.connections.exit) return false;
    
    // Debug logs to help understand rendering logic
    if (showDebug) {
      debug.debug(`Arrow logic for [${row},${col}]`, {
        showExitArrow: true,
        isEndCube,
        pathPosition,
        totalCubes: connectedCubes.length,
        connections: cell.connections
      });
    }
    
    return true;
  })();

  // Add additional logging specific to exit arrows
  useEffect(() => {
    if (showDebug && isEndCube && cell.connections.exit) {
      debug.warn(`End cube detected at [${row},${col}] - exit arrows should be hidden`, {
        isEndCube,
        pathPosition,
        totalCubes: connectedCubes.length,
        shouldShowExitArrow
      });
    }
  }, [showDebug, isEndCube, row, col, pathPosition, connectedCubes.length, cell.connections.exit, shouldShowExitArrow]);

  return (
    <div className={`pipe-container ${flowClasses.join(' ')}`}>
      <PipeRenderer subgrid={subgrid} />
      
      {/* Entry arrows for corners only */}
      {shouldShowEntryArrow && (
        <div 
          className={`flow-arrow entry entry-${cell.connections.entry.toLowerCase()} z-20`}
          style={{ 
            transform: `rotate(${getArrowRotation(cell.connections.entry)}deg)`,
            backgroundColor: CONNECTOR_COLORS.corner, // Orange for corners
            width: '20px',
            height: '20px',
            fontSize: '14px'
          }}
          title={`Corner Connector (${cell.connections.entry} to ${cell.connections.exit})`}
        >
          ↑
        </div>
      )}
      
      {/* Exit arrows for both straight and corner connectors */}
      {shouldShowExitArrow && (
        <div 
          className={`flow-arrow exit exit-${cell.connections.exit.toLowerCase()} z-20`}
          style={{ 
            transform: `rotate(${getArrowRotation(cell.connections.exit)}deg)`,
            backgroundColor: isCorner ? CONNECTOR_COLORS.corner : CONNECTOR_COLORS.straight, // Orange for corners, Gray for straight
            width: '20px',
            height: '20px',
            fontSize: '14px'
          }}
          title={isCorner ? 
            `Corner Connector: ${cell.connections.entry} to ${cell.connections.exit}` : 
            `Straight Connector: ${cell.connections.entry} to ${cell.connections.exit}`}
        >
          ↑
        </div>
      )}
      
      {/* Connection type indicator */}
      <div 
        className={`connector-type ${isCorner ? 'corner' : 'straight'} z-15`}
        title={isCorner ? 'Corner Connector' : 'Straight Coupling'}
      >
        {isCorner ? '⌟' : '━'}
      </div>
      
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
