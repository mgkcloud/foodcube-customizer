import React, { useState } from 'react';
import { GridCell } from './types';
import { CladdingVisualizer } from './CladdingVisualizer';
import { PipelineVisualizer } from './PipelineVisualizer';
import { hasAdjacentCube } from '@/utils/shared/gridUtils';

interface GridProps {
  grid: GridCell[][];
  onToggleCell: (row: number, col: number) => void;
  onToggleCladding: (row: number, col: number, edge: 'N' | 'E' | 'S' | 'W') => void;
  setHasInteracted?: (value: boolean) => void;
}

export const Grid: React.FC<GridProps> = ({ grid, onToggleCell, onToggleCladding, setHasInteracted }) => {
  const [hasInteractedLocal, setHasInteractedLocal] = useState(false);

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setHasInteractedLocal(true);
    if (setHasInteracted) setHasInteracted(true);
    onToggleCell(rowIndex, colIndex);
  };

  const handleOverlayClick = () => {
    setHasInteractedLocal(true);
    if (setHasInteracted) setHasInteracted(true);
    // Place a cube in the middle cell (1,1) of the 3x3 grid
    onToggleCell(1, 1);
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
      {!hasInteractedLocal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 rounded-lg cursor-pointer"
             onClick={handleOverlayClick}>
          <div className="bg-white px-6 py-3 rounded-full shadow-lg text-sm font-semibold">
            Tap grid to place Foodcube
          </div>
        </div>
      )}
      {grid.map((row, rowIndex) => (
        row.map((cell, colIndex) => (
          <div 
            key={`${rowIndex}-${colIndex}`}
            data-testid={`grid-cell-${rowIndex}-${colIndex}`}
            data-has-cube={cell.hasCube.toString()}
            className={`
              relative aspect-square cursor-pointer
              ${cell.hasCube 
                ? 'bg-cover bg-center bg-no-repeat hover:brightness-90' 
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
                {renderSubgrid(rowIndex, colIndex)}
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
                <PipelineVisualizer
                  cell={cell}
                  row={rowIndex}
                  col={colIndex}
                  grid={grid}
                />
              </>
            )}
          </div>
        ))
      ))}
    </div>
  );
};
