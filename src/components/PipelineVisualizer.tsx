import React from 'react';
import { GridCell } from './types';
import { validateIrrigationPath, findConnectedCubes } from '@/utils/validation/flowValidator';
import { hasAdjacentCube } from '@/utils/shared/gridUtils';
import { CompassDirection } from '@/utils/core/types';
import { PANEL_COLORS } from '@/constants/colors';

interface PipelineVisualizerProps {
  cell: GridCell;
  row: number;
  col: number;
  grid: GridCell[][];
}

type PanelType = 'side' | 'left' | 'right';

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  cell,
  row,
  col,
  grid,
}) => {
  // Helper functions to determine flow type
  const isHorizontalDirection = (dir: CompassDirection | null) => dir === 'W' || dir === 'E';
  const isVerticalDirection = (dir: CompassDirection | null) => dir === 'N' || dir === 'S';

  const isHorizontalFlow = (entry: CompassDirection | null, exit: CompassDirection | null) => {
    // If entry is horizontal, treat it as horizontal flow regardless of exit
    // This ensures W→S is treated as horizontal since the corner connector handles the turn
    if (entry && isHorizontalDirection(entry)) {
      return true;
    }
    
    // If entry is null but exit is horizontal, treat as horizontal flow
    if (!entry && exit && isHorizontalDirection(exit)) {
      return true;
    }
    
    // If both directions are the same and horizontal
    if (entry === exit && isHorizontalDirection(entry)) {
      return true;
    }
    
    return false;
  };

  const isVerticalFlow = (entry: CompassDirection | null, exit: CompassDirection | null) => {
    // If entry is vertical, treat it as vertical flow regardless of exit
    if (entry && isVerticalDirection(entry)) {
      return true;
    }
    
    // If entry is null but exit is vertical, treat as vertical flow
    if (!entry && exit && isVerticalDirection(exit)) {
      return true;
    }
    
    // If both directions are the same and vertical
    if (entry === exit && isVerticalDirection(entry)) {
      return true;
    }
    
    return false;
  };

  // Get connected cubes and validate path
  const connectedCubes = findConnectedCubes(grid, row, col);
  const isValidPath = validateIrrigationPath(grid);
  
  // Check if this cube is part of the path
  const isCubeInPath = connectedCubes.some(([r, c]) => r === row && c === col);

  // Enhanced logging for cube status
  console.group(`PipelineVisualizer [${row},${col}]`);
  console.log('Cube Status:', JSON.stringify({
    isInPath: isCubeInPath,
    pathPosition: connectedCubes.findIndex(([r, c]) => r === row && c === col),
    totalConnectedCubes: connectedCubes.length,
    isValidPath,
    connectedCubes: connectedCubes.map(([r, c]) => `[${r},${c}]`)
  }, null, 2));
  
  if (isCubeInPath) {
    const pathPosition = connectedCubes.findIndex(([r, c]) => r === row && c === col);
    const prevCube = pathPosition > 0 ? connectedCubes[pathPosition - 1] : null;
    const nextCube = pathPosition < connectedCubes.length - 1 ? connectedCubes[pathPosition + 1] : null;
    
    console.log('Path Details:', JSON.stringify({
      position: pathPosition,
      totalCubes: connectedCubes.length,
      previousCube: prevCube ? `[${prevCube[0]},${prevCube[1]}]` : 'none',
      nextCube: nextCube ? `[${nextCube[0]},${nextCube[1]}]` : 'none',
      isFirstCube: pathPosition === 0,
      isLastCube: pathPosition === connectedCubes.length - 1,
      fullPath: connectedCubes.map(([r, c]) => `[${r},${c}]`).join(' → ')
    }, null, 2));
  }
  console.groupEnd();
  
  if (!isCubeInPath) {
    return null;
  }
  
  // Find position in the path
  const pathPosition = connectedCubes.findIndex(([r, c]) => r === row && c === col);
  const isFirstCube = pathPosition === 0;
  const isLastCube = pathPosition === connectedCubes.length - 1;
  
  // Get next and previous cubes in the path
  const prevCube = pathPosition > 0 ? connectedCubes[pathPosition - 1] : null;
  const nextCube = pathPosition < connectedCubes.length - 1 ? connectedCubes[pathPosition + 1] : null;

  // Determine connection directions based on cube positions
  const getConnectionDirection = (fromRow: number, fromCol: number, toRow: number, toCol: number): CompassDirection => {
    if (toRow < fromRow) return 'N';
    if (toRow > fromRow) return 'S';
    if (toCol < fromCol) return 'W';
    return 'E';
  };

  // Set entry/exit based on cell's own connections first, then fall back to path connections
  const actualEntry = cell.connections.entry || (prevCube ? getConnectionDirection(row, col, prevCube[0], prevCube[1]) : null);
  const actualExit = cell.connections.exit || (nextCube ? getConnectionDirection(row, col, nextCube[0], nextCube[1]) : null);

  // Highlight the irrigation flow on the left side of each foodcube based on rotation
  const renderIrrigationFlow = () => {
    // Get flow pattern based on entry/exit points
    const getFlowPattern = () => {
      const flowSquareStyle = "bg-red-500 opacity-50";
      const emptySquareStyle = "bg-transparent";

      // For horizontal flow (W→E or E→E)
      if (isHorizontalFlow(actualEntry, actualExit)) {
        console.log(`[${row},${col}] Horizontal flow`);
        return {
          pattern: [flowSquareStyle, flowSquareStyle, emptySquareStyle, emptySquareStyle],
          rotation: 90  // Rotate 90 degrees for horizontal flow
        };
      }

      // For vertical flow (N→S or N→N)
      if (isVerticalFlow(actualEntry, actualExit)) {
        console.log(`[${row},${col}] Vertical flow`);
        return {
          pattern: [flowSquareStyle, emptySquareStyle, flowSquareStyle, emptySquareStyle],
          rotation: 0  // No rotation for vertical flow
        };
      }

      // Default to no flow pattern if no valid flow
      console.log(`[${row},${col}] No valid flow pattern`);
      return {
        pattern: [emptySquareStyle, emptySquareStyle, emptySquareStyle, emptySquareStyle],
        rotation: 0
      };
    };

    const { pattern, rotation } = getFlowPattern();

    // Log flow visualization details
    console.group(`Flow Visualization [${row},${col}]`);
    console.log('Pattern:', JSON.stringify(pattern.map((style, i) => ({
      square: i,
      type: style === "bg-red-500 opacity-50" ? "Flow" : "Empty",
      style
    })), null, 2));
    console.log('Flow Type:', isHorizontalFlow(actualEntry, actualExit) ? 'Horizontal' : isVerticalFlow(actualEntry, actualExit) ? 'Vertical' : 'None');
    console.log('Cell Details:', JSON.stringify({
      entry: actualEntry,
      exit: actualExit,
      cellRotation: cell.rotation,
      connections: cell.connections,
      flowRotation: rotation,
      pattern: pattern.map((style, i) => ({
        square: i,
        type: style === "bg-red-500 opacity-50" ? "Flow" : "Empty"
      }))
    }, null, 2));
    console.groupEnd();

    // Adjust pattern array based on rotation
    const rotatedPattern = rotation === 90 ? [
      pattern[2], pattern[0],  // Rotate left squares to top
      pattern[3], pattern[1]   // Rotate right squares to bottom
    ] : pattern;

    return (
      <div 
        className="absolute inset-0 grid grid-cols-2 grid-rows-2"
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center'
        }}
      >
        {rotatedPattern.map((style, index) => (
          <div key={index} className={style} />
        ))}
      </div>
    );
  };

  // Log connection details
  console.group(`Connection Details [${row},${col}]`);
  console.log('Connections:', JSON.stringify({
    entry: actualEntry,
    exit: actualExit,
    hasValidEntry: actualEntry && hasAdjacentCube(grid, row, col, actualEntry),
    hasValidExit: actualExit && hasAdjacentCube(grid, row, col, actualExit),
    adjacentCubes: {
      north: hasAdjacentCube(grid, row, col, 'N'),
      east: hasAdjacentCube(grid, row, col, 'E'),
      south: hasAdjacentCube(grid, row, col, 'S'),
      west: hasAdjacentCube(grid, row, col, 'W')
    }
  }, null, 2));
  console.groupEnd();

  // Determine if connections are valid
  const hasValidEntry = actualEntry && hasAdjacentCube(grid, row, col, actualEntry);
  const hasValidExit = actualExit && hasAdjacentCube(grid, row, col, actualExit);
  
  // Determine panel types based on direction
  const getPanelType = (direction: CompassDirection): PanelType => {
    if (direction === 'N' || direction === 'S') return 'side';
    return direction === 'W' ? 'left' : 'right';
  };

  // Get panel color based on type and path validity
  const getPanelColor = (direction: CompassDirection): string => {
    if (!isValidPath) return PANEL_COLORS.error;
    const type = getPanelType(direction);
    return PANEL_COLORS[type];
  };

  // Panel styling based on type
  const getPanelStyle = (direction: CompassDirection): React.CSSProperties => {
    return {
      backgroundColor: getPanelColor(direction),
      boxShadow: '0 0 4px rgba(0, 0, 0, 0.2)',
      transition: 'background-color 0.2s ease-in-out',
    };
  };

  // Get the pipe elements
  const getPipeElements = () => {
    const elements: JSX.Element[] = [];
    const PIPE_WIDTH = 5;

    // Helper to create a straight pipe
    const createStraightPipe = (direction: CompassDirection, isHalf: boolean = false) => {
      const style: React.CSSProperties = {
        position: 'absolute',
        ...getPanelStyle(direction),
      };

      const isVertical = direction === 'N' || direction === 'S';
      if (isVertical) {
        style.width = `${PIPE_WIDTH}px`;
        style.height = isHalf ? '50%' : '100%';
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        if (direction === 'N') {
          style.top = '0';
        } else {
          style.bottom = '0';
        }
      } else {
        style.height = `${PIPE_WIDTH}px`;
        style.width = isHalf ? '50%' : '100%';
        style.top = '50%';
        style.transform = 'translateY(-50%)';
        if (direction === 'W') {
          style.left = '0';
        } else {
          style.right = '0';
        }
      }

      return style;
    };

    // Only handle straight pipes
    if (actualEntry && actualExit) {
      // Only create pipe if it's a straight flow
      if (isHorizontalFlow(actualEntry, actualExit) || isVerticalFlow(actualEntry, actualExit)) {
        elements.push(
          <div key="straight" style={createStraightPipe(actualEntry)} />
        );
      }
    } else {
      // End pieces
      if (actualEntry) {
        elements.push(
          <div key="entry" style={createStraightPipe(actualEntry, true)} />
        );
      }
      if (actualExit) {
        elements.push(
          <div key="exit" style={createStraightPipe(actualExit, true)} />
        );
      }
    }

    return elements;
  };

  return (
    <div className="absolute inset-0">
      {renderIrrigationFlow()}
      {getPipeElements()} 
    </div>
  );
};
