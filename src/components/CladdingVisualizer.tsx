import { cn } from '@/lib/utils';
import { PANEL_COLORS } from '@/constants/colors';
import { GridCell } from './types';
import { CompassDirection } from '@/utils/core/types';
import { getPanelType } from '@/utils/core/rules';

type EdgeType = 'N' | 'E' | 'S' | 'W';

type CladdingVisualizerProps = {
  cell: GridCell;
  row: number;
  col: number;
  grid: GridCell[][];
  onToggle: (edge: EdgeType) => void;
  isEdgeExposed: Record<EdgeType, boolean>;
};

export const CladdingVisualizer = ({ cell, row, col, grid, onToggle, isEdgeExposed }: CladdingVisualizerProps) => {
  // Only show cladding options for cells that have cubes
  if (!cell?.hasCube) {
    return null;
  }

  // Get entry/exit from cell's connections
  const { entry, exit } = cell.connections;
  
  const getEdgeStyle = (edge: EdgeType): React.CSSProperties => {
    const isSelected = cell.claddingEdges.has(edge);
    // Use the flow-based panel type determination
    const panelType = getPanelType(edge as CompassDirection, entry, exit);
    const baseColor = PANEL_COLORS[panelType];
    
    return {
      backgroundColor: isSelected 
        ? baseColor 
        : `${baseColor}40`, // 40 = 25% opacity for unselected edges
      transition: 'background-color 0.2s ease-in-out',
      // Hover handled by CSS classes
    };
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 flex items-center justify-center">
        {(['N', 'E', 'S', 'W'] as const).map((edge) => isEdgeExposed[edge] && (
          <div
            key={edge}
            data-testid="cladding-edge"
            data-edge={edge}
            style={getEdgeStyle(edge)}
            className={cn(
              'absolute pointer-events-auto cursor-pointer',
              {
                'w-2/3 h-2': ['N', 'S'].includes(edge),
                'h-2/3 w-2': ['W', 'E'].includes(edge),
                'top-0': edge === 'N',
                'bottom-0': edge === 'S',
                'left-0': edge === 'W',
                'right-0': edge === 'E'
              }
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(edge);
            }}
          />
        ))}
      </div>
    </div>
  );
};
