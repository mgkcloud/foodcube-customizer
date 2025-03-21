import React, { useState, useEffect, useRef } from 'react';
import { GridCell } from './types';
import { CladdingVisualizer } from './CladdingVisualizer';
// Temporarily hidden
// import { PipelineVisualizer } from './PipelineVisualizer';
import { hasAdjacentCube } from '@/utils/shared/gridUtils';
import { useTutorial } from '@/contexts/TutorialContext';

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
  const { notifyTutorial } = useTutorial();
  
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
    
    // Log for tutorial debugging
    console.log(`Grid cell clicked: [${rowIndex}, ${colIndex}], currently has cube: ${grid[rowIndex][colIndex].hasCube}`);
    
    onToggleCell(rowIndex, colIndex);
    
    // Notify tutorial system directly
    notifyTutorial({
      type: 'CUBE_TOGGLED',
      payload: {
        row: rowIndex,
        col: colIndex,
        hasCube: !grid[rowIndex][colIndex].hasCube, // The new state will be the opposite
        action: grid[rowIndex][colIndex].hasCube ? 'removed' : 'added'
      }
    });
  };

  const handleCladdingToggle = (row: number, col: number, edge: 'N' | 'E' | 'S' | 'W') => {
    onToggleCladding(row, col, edge);
    
    // Get the current state of the cladding
    const isActive = grid[row][col].claddingEdges.has(edge);
    
    // Notify tutorial system directly
    notifyTutorial({
      type: 'CLADDING_TOGGLED',
      payload: {
        row,
        col,
        edge,
        isActive: !isActive // The new state will be the opposite
      }
    });
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

  // Simple callback for edges - no longer registers them
  const registerEdgeRef = (row: number, col: number, edge: 'N' | 'E' | 'S' | 'W', element: HTMLDivElement | null) => {
    // We're not registering elements anymore
  };

  return (
    <div className="relative grid grid-cols-3 gap-1.5 sm:gap-3 md:gap-4 bg-gray-100 p-4 sm:p-5 md:p-6 rounded-xl shadow-md z-10">
      {!hasInteractedLocal && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/5 backdrop-blur-[1px] rounded-xl">
          <div className="bg-blue-600/90 px-5 py-3 rounded-lg text-white text-center font-medium shadow-lg animate-pulse">
            <span className="text-sm sm:text-base">Tap grid to place foodcube</span>
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
                ? 'bg-cover bg-center bg-no-repeat hover:brightness-95 active:brightness-90 z-1' 
                : 'bg-white hover:bg-gray-100 active:bg-gray-200'
              }
              border-2 sm:border-3 border-gray-300 sm:border-gray-200 rounded-lg
              transition-all duration-200 shadow-sm hover:shadow-md
              transform active:scale-[0.98]
            `}
            style={{
              backgroundImage: cell.hasCube 
                ? 'url("https://foodcube.myshopify.com/cdn/shop/files/1_Top_View_-_Foodcube.png?v=1736309048&width=1206")'
                : 'none'
            }}
            onClick={() => handleCellClick(rowIndex, colIndex)}
            // No longer using refs for tutorial targeting
            data-cell-id={`grid-cell-${rowIndex}-${colIndex}`}
          >
            {cell.hasCube && (
              <>
                {/* PipelineVisualizer temporarily hidden
                <PipelineVisualizer
                  cell={cell}
                  row={rowIndex}
                  col={colIndex}
                  grid={grid}
                  debug={debug}
                />
                */}
                
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
                  registerEdgeRef={registerEdgeRef}
                />
                
                {/* Debug info */}
                {debug && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/70 text-white text-[8px] sm:text-xs p-1 rounded">
                      [{rowIndex},{colIndex}]
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))
      ))}
    </div>
  );
};
