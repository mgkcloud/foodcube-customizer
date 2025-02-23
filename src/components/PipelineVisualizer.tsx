import React, { useEffect } from 'react';
import { GridCell } from './types';
import { validateIrrigationPath, findConnectedCubes } from '@/utils/validation/flowValidator';
import { getVisualConnections } from '../utils/flowHelpers';
import { calculatePipeConfiguration } from '@/utils/visualization/pipeConfigurator';
import { PipeRenderer } from './PipeRenderer';
import { visualizeFlow } from '@/utils/core/flowVisualizer';

interface PipelineVisualizerProps {
  cell: GridCell;
  row: number;
  col: number;
  grid: GridCell[][];
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  cell,
  row,
  col,
  grid,
}) => {
  useEffect(() => {
    // Visualize flow whenever the grid changes
    visualizeFlow(grid);
  }, [grid]);

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
  
  if (!isCubeInPath || !cell.hasCube) {
    return null;
  }

  // Get visual connections
  const { visualEntry, visualExit } = getVisualConnections(grid, row, col, cell);

  // Calculate pipe configuration
  const { subgrid } = calculatePipeConfiguration(
    grid,
    row,
    col,
    cell,
    connectedCubes,
    visualEntry,
    visualExit
  );

  // Log the subgrid state for debugging
  console.group(`Subgrid State [${row},${col}]`);
  console.log('Entry:', visualEntry);
  console.log('Exit:', visualExit);
  console.log('Block Count:', subgrid.flat().filter(Boolean).length);
  console.log('Subgrid:\n' + subgrid.map(row => row.map(cell => cell ? 'R' : '.')).join('\n'));
  console.groupEnd();

  return <PipeRenderer subgrid={subgrid} />;
};
