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
  // Get irrigation path for visualization
  const connectedCubes = findConnectedCubes(grid, row, col);
  const isValidPath = validateIrrigationPath(grid);
  
  // Check if this cube is part of the path
  const isCubeInPath = connectedCubes.some(([r, c]) => r === row && c === col);
  
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

  // Set entry/exit based on path position
  const actualEntry = prevCube ? getConnectionDirection(row, col, prevCube[0], prevCube[1]) : null;
  const actualExit = nextCube ? getConnectionDirection(row, col, nextCube[0], nextCube[1]) : null;

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

  // Helper function to get the angle between two directions
  const getAngleBetweenDirections = (dir1: CompassDirection, dir2: CompassDirection) => {
    const dirToAngle = { N: 0, E: 90, S: 180, W: 270 };
    const angle1 = dirToAngle[dir1];
    const angle2 = dirToAngle[dir2];
    return ((angle2 - angle1 + 360) % 360);
  };

  // Get the pipe elements
  const getPipeElements = () => {
    const elements: JSX.Element[] = [];
    const PIPE_WIDTH = 5;
    const CORNER_SIZE = 24;

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

    // Helper to create a corner piece
    const createCornerPiece = (entry: CompassDirection, exit: CompassDirection) => {
      const angle = getAngleBetweenDirections(entry, exit);
      const entryColor = getPanelColor(entry);
      const exitColor = getPanelColor(exit);

      // Create two quarter-circle elements for the corner
      const baseStyle: React.CSSProperties = {
        position: 'absolute',
        width: `${CORNER_SIZE}px`,
        height: `${CORNER_SIZE}px`,
        borderRadius: '50%',
      };

      // Position the corner piece
      if (entry === 'N' || exit === 'N') {
        baseStyle.top = '0';
      } else {
        baseStyle.bottom = '0';
      }
      if (entry === 'W' || exit === 'W') {
        baseStyle.left = '0';
      } else {
        baseStyle.right = '0';
      }

      // Create styles for entry and exit parts
      const entryStyle: React.CSSProperties = {
        ...baseStyle,
        border: `${PIPE_WIDTH}px solid ${entryColor}`,
        clipPath: angle === 90
          ? 'polygon(0 0, 100% 0, 100% 50%, 50% 50%, 50% 100%, 0 100%)'
          : 'polygon(0 0, 50% 0, 50% 50%, 100% 50%, 100% 100%, 0 100%)',
      };

      const exitStyle: React.CSSProperties = {
        ...baseStyle,
        ...getPanelStyle(exit),
        borderWidth: `${PIPE_WIDTH}px`,
        borderStyle: 'solid',
        clipPath: angle === 90
          ? 'polygon(100% 0, 100% 100%, 0 100%, 0 50%, 50% 50%, 50% 0)'
          : 'polygon(50% 0, 100% 0, 100% 100%, 0 100%, 0 50%, 50% 50%)',
      };

      // Remove appropriate borders
      if (angle === 90) {
        entryStyle.borderTop = 'none';
        entryStyle.borderRight = 'none';
        exitStyle.borderBottom = 'none';
        exitStyle.borderLeft = 'none';
      } else if (angle === -90) {
        entryStyle.borderTop = 'none';
        entryStyle.borderLeft = 'none';
        exitStyle.borderBottom = 'none';
        exitStyle.borderRight = 'none';
      } else if (angle === 180) {
        entryStyle.borderLeft = 'none';
        entryStyle.borderRight = 'none';
        exitStyle.borderLeft = 'none';
        exitStyle.borderRight = 'none';
      }

      return [entryStyle, exitStyle];
    };

    // Add pipes based on entry/exit configuration
    if (actualEntry && actualExit) {
      if (Math.abs(getAngleBetweenDirections(actualEntry, actualExit)) === 90) {
        // Corner configuration
        const [entryStyle, exitStyle] = createCornerPiece(actualEntry, actualExit);
        elements.push(
          <>
            <div key="corner-entry" style={entryStyle} />
            <div key="corner-exit" style={exitStyle} />
          </>
        );
      } else {
        // Straight through configuration
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
      {getPipeElements()}
    </div>
  );
};
