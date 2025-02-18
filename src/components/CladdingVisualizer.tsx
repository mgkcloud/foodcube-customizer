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
  // Log cell state when component renders
  console.group(`CladdingVisualizer [${row},${col}]`);
  console.log('Cell State:', JSON.stringify({
    hasCube: cell?.hasCube,
    connections: cell?.connections,
    claddingEdges: Array.from(cell?.claddingEdges || []),
    exposedEdges: isEdgeExposed
  }, null, 2));

  // Render subgrid highlighting for irrigation flow
  const renderSubgridHighlight = () => {
    return (
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        <div className="bg-blue-200 opacity-50" />
        <div className="bg-transparent" />
        <div className="bg-blue-200 opacity-50" />
        <div className="bg-transparent" />
      </div>
    );
  };

  if (!cell?.hasCube) {
    console.log('No cube present, skipping visualization');
    console.groupEnd();
    return null;
  }

  // Get entry/exit from cell's connections
  const { entry, exit } = cell.connections;
  
  // Log flow configuration
  console.log('Flow Configuration:', JSON.stringify({
    entry,
    exit,
    rotation: cell.rotation
  }, null, 2));
  
  const getEdgeStyle = (edge: EdgeType): React.CSSProperties => {
    const isSelected = cell.claddingEdges.has(edge);
    // Use the flow-based panel type determination
    const panelType = getPanelType(edge as CompassDirection, entry, exit);
    const baseColor = PANEL_COLORS[panelType];
    
    // Log panel details
    console.log(`Panel [${edge}]:`, JSON.stringify({
      type: panelType,
      isSelected,
      color: baseColor,
      isExposed: isEdgeExposed[edge]
    }, null, 2));
    
    return {
      backgroundColor: isSelected 
        ? baseColor 
        : `${baseColor}40`, // 40 = 25% opacity for unselected edges
      transition: 'background-color 0.2s ease-in-out',
      // Hover handled by CSS classes
    };
  };

  // Log all edges' panel types
  console.log('Panel Configuration:', JSON.stringify({
    north: getPanelType('N', entry, exit),
    east: getPanelType('E', entry, exit),
    south: getPanelType('S', entry, exit),
    west: getPanelType('W', entry, exit)
  }, null, 2));

  console.groupEnd();

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
              // Log panel toggle
              console.log(`Toggling panel [${row},${col}] ${edge}:`, JSON.stringify({
                wasSelected: cell.claddingEdges.has(edge),
                type: getPanelType(edge as CompassDirection, entry, exit)
              }, null, 2));
              onToggle(edge);
            }}
          />
        ))}
      </div>
    </div>
  );
};
