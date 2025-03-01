import React, { useState, useEffect } from 'react';
import { GridCell } from './types';
import { CladdingVisualizer } from './CladdingVisualizer';
import { PipelineVisualizer } from './PipelineVisualizer';
import { hasAdjacentCube } from '@/utils/shared/gridUtils';

interface GridProps {
  grid: GridCell[][];
  onToggleCell: (row: number, col: number) => void;
  onToggleCladding: (row: number, col: number, edge: 'N' | 'E' | 'S' | 'W') => void;
  setHasInteracted?: (value: boolean) => void;
  debug?: boolean;
}

export const Grid: React.FC<GridProps> = ({ 
  grid, 
  onToggleCell, 
  onToggleCladding, 
  setHasInteracted,
  debug = false
}) => {
  const [hasInteractedLocal, setHasInteractedLocal] = useState(false);

  // Effect to sync hasInteractedLocal with parent's hasInteracted state
  useEffect(() => {
    if (setHasInteracted && !hasInteractedLocal) {
      // Check if any cube exists in the grid, which would indicate a preset was applied
      const hasCubeInGrid = grid.some(row => row.some(cell => cell.hasCube));
      if (hasCubeInGrid) {
        setHasInteractedLocal(true);
      }
    }
  }, [grid, hasInteractedLocal, setHasInteracted]);

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setHasInteractedLocal(true);
    if (setHasInteracted) setHasInteracted(true);
    onToggleCell(rowIndex, colIndex);
  };

  const handleCladdingToggle = (row: number, col: number, edge: 'N' | 'E' | 'S' | 'W') => {
    onToggleCladding(row, col, edge);
  };

  // Render subgrid within each cell
  const renderSubgrid = (rowIndex: number, colIndex: number) => {
    const subgrid = [
      { subgridRow: rowIndex * 2, subgridCol: colIndex * 2 },
      { subgridRow: rowIndex * 2, subgridCol: colIndex * 2 + 1 },
      { subgridRow: rowIndex * 2 + 1, subgridCol: colIndex * 2 },
      { subgridRow: rowIndex * 2 + 1, subgridCol: colIndex * 2 + 1 }
    ];

    return (
      <div className="grid grid-cols-2 gap-0.5 absolute inset-0">
        {subgrid.map(({ subgridRow, subgridCol }) => (
          <div
            key={`${subgridRow}-${subgridCol}`}
            className="bg-gray-200 hover:bg-gray-300 cursor-pointer"
            onClick={() => console.log(`Subgrid selected: ${subgridRow}, ${subgridCol}`)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative grid grid-cols-3 gap-1 bg-gray-100 p-4 rounded-lg">
      {grid.map((row, rowIndex) => (
        row.map((cell, colIndex) => (
          <div 
            key={`${rowIndex}-${colIndex}`}
            data-testid={`grid-cell-${rowIndex}-${colIndex}`}
            data-has-cube={cell.hasCube.toString()}
            className={`
              relative aspect-square cursor-pointer
              ${cell.hasCube 
                ? 'bg-cover bg-center bg-no-repeat hover:brightness-90 z-1' 
                : 'bg-white hover:bg-gray-200'
              }
              border-2 border-gray-300 rounded
              transition-all duration-200
            `}
            style={{
              backgroundImage: cell.hasCube 
                ? 'url("https://foodcube.myshopify.com/cdn/shop/files/1_Top_View_-_Foodcube.png?v=1736309048&width=1206")'
                : 'none'
            }}
            onClick={() => handleCellClick(rowIndex, colIndex)}
          >
            {cell.hasCube && (
              <>
                <PipelineVisualizer
                  cell={cell}
                  row={rowIndex}
                  col={colIndex}
                  grid={grid}
                  debug={debug}
                />
                <CladdingVisualizer
                  cell={cell}
                  row={rowIndex}
                  col={colIndex}
                  grid={grid}
                  onToggle={(edge) => handleCladdingToggle(rowIndex, colIndex, edge)}
                  isEdgeExposed={{
                    N: !hasAdjacentCube(grid, rowIndex, colIndex, 'N'),
                    E: !hasAdjacentCube(grid, rowIndex, colIndex, 'E'),
                    S: !hasAdjacentCube(grid, rowIndex, colIndex, 'S'),
                    W: !hasAdjacentCube(grid, rowIndex, colIndex, 'W')
                  }}
                />
              </>
            )}
          </div>
        ))
      ))}
    </div>
  );
};
