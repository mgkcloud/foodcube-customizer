import React, { useEffect, useMemo, useCallback } from 'react';
import { GridCell } from './types';
import { validateIrrigationPath, findConnectedCubes } from '@/utils/validation/flowValidator';
import { getVisualConnections } from '../utils/flowHelpers';
import { calculatePipeConfiguration } from '@/utils/visualization/pipeConfigurator';
import { PipeRenderer } from './PipeRenderer';
import { visualizeFlow } from '@/utils/core/flowVisualizer';
import { CompassDirection } from './types';

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
  debug = false,
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
    if (debug && isCubeInPath) {
      console.group(`PipelineVisualizer [${row},${col}]`);
      console.log('Cube Status:', JSON.stringify({
        isInPath: isCubeInPath,
        pathPosition,
        totalConnectedCubes: connectedCubes.length,
        isValidPath,
        isStartCube,
        isEndCube,
        isCorner,
        cubeType,
        connections: cell.connections,
        connectedCubes: connectedCubes.map(([r, c]) => `[${r},${c}]`)
      }, null, 2));
      
      if (isCubeInPath) {
        const prevCube = pathPosition > 0 ? connectedCubes[pathPosition - 1] : null;
        const nextCube = pathPosition < connectedCubes.length - 1 ? connectedCubes[pathPosition + 1] : null;
        
        console.log('Path Details:', JSON.stringify({
          position: pathPosition,
          totalCubes: connectedCubes.length,
          previousCube: prevCube ? `[${prevCube[0]},${prevCube[1]}]` : 'none',
          nextCube: nextCube ? `[${nextCube[0]},${nextCube[1]}]` : 'none',
          isFirstCube: isStartCube,
          isLastCube: isEndCube,
          entry: cell.connections.entry,
          exit: cell.connections.exit,
          fullPath: connectedCubes.map(([r, c]) => `[${r},${c}]`).join(' → ')
        }, null, 2));
      }
      console.groupEnd();
    }
  }, [debug, isCubeInPath, row, col, pathPosition, connectedCubes.length, isValidPath, 
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
    if (debug) {
      console.group(`Subgrid State [${row},${col}]`);
      console.log('Entry:', visualEntry);
      console.log('Exit:', visualExit);
      console.log('Connector Type:', isCorner ? 'Corner Connector' : 'Straight Coupling');
      console.log('Block Count:', subgrid.flat().filter(Boolean).length);
      console.log('Subgrid:\n' + subgrid.map(row => row.map(cell => cell ? 'R' : '.')).join('\n'));
      console.groupEnd();
    }
  }, [debug, row, col, visualEntry, visualExit, subgrid, isCorner, gridKey]);

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

  return (
    <div className={`pipe-container ${flowClasses.join(' ')}`}>
      <PipeRenderer subgrid={subgrid} />
      
      {/* Flow direction arrows - always visible */}
      {cell.connections.entry && (
        <div 
          className={`flow-arrow entry entry-${cell.connections.entry.toLowerCase()} z-5`}
          style={{ 
            transform: `rotate(${getArrowRotation(cell.connections.entry)}deg)`,
            backgroundColor: isStartCube ? '#4CAF50' : isCorner ? '#FF9800' : '#2196F3'
          }}
          title={`Entry: ${cell.connections.entry}`}
        >
          ↑
        </div>
      )}
      
      {cell.connections.exit && (
        <div 
          className={`flow-arrow exit exit-${cell.connections.exit.toLowerCase()} z-5`}
          style={{ 
            transform: `rotate(${getArrowRotation(cell.connections.exit)}deg)`,
            backgroundColor: isEndCube ? '#F44336' : isCorner ? '#FF9800' : '#2196F3'
          }}
          title={`Exit: ${cell.connections.exit}`}
        >
          ↑
        </div>
      )}
      
      {/* Connection type indicator */}
      <div 
        className={`connector-type ${isCorner ? 'corner' : 'straight'} z-5`}
        title={isCorner ? 'Corner Connector' : 'Straight Coupling'}
      >
        {isCorner ? 'C' : 'S'}
      </div>
      
      {/* Position indicator */}
      {debug && (
        <div className="position-indicator">
          {pathPosition + 1}/{connectedCubes.length}
        </div>
      )}
      
      {/* Debug flow labels */}
      {debug && (
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
