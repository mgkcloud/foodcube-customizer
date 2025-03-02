import { cn } from '@/lib/utils';
import { PANEL_COLORS } from '@/constants/colors';
import { GridCell } from './types';
import { CompassDirection } from '@/utils/core/types';
import { getPanelType } from '@/utils/core/rules';
import { calculatePipeConfiguration } from '@/utils/visualization/pipeConfigurator';
import { findConnectedCubes } from '@/utils/validation/flowValidator';
import { getVisualConnections } from '@/utils/flowHelpers';
import { useMemo } from 'react';

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

  // Calculate pipe configuration to get subgrid
  const connectedCubes = useMemo(() => {
    if (!cell.hasCube) return [];
    return findConnectedCubes(grid, row, col);
  }, [grid, row, col, cell.hasCube]);

  // Get visual connections
  const { visualEntry, visualExit } = useMemo(() => {
    if (!cell.hasCube) return { visualEntry: null, visualExit: null };
    return getVisualConnections(grid, row, col, cell);
  }, [grid, row, col, cell]);

  // Calculate pipe configuration to get the subgrid
  const pipeConfig = useMemo(() => {
    if (!cell.hasCube) return { subgrid: [[false, false], [false, false]] };
    return calculatePipeConfiguration(
      grid,
      row,
      col,
      cell,
      connectedCubes,
      visualEntry,
      visualExit
    );
  }, [grid, row, col, cell, connectedCubes, visualEntry, visualExit]);

  const { subgrid } = pipeConfig;

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
    rotation: cell.rotation,
    subgrid: subgrid.map(row => row.map(cell => cell ? 'RED' : 'EMPTY'))
  }, null, 2));
  
  const getEdgeStyle = (edge: EdgeType): React.CSSProperties => {
    const isSelected = cell.claddingEdges.has(edge);
    // Use the subgrid-based panel type determination
    const panelType = getPanelType(edge as CompassDirection, entry, exit, subgrid.map(row => row.map(cell => Boolean(cell))));
    const baseColor = PANEL_COLORS[panelType];
    
    // Enhanced panel logging
    console.log(`VISUALIZATION: Panel [${row},${col}:${edge}]:`, JSON.stringify({
      type: panelType,
      isSelected,
      color: baseColor,
      isExposed: isEdgeExposed[edge],
      flowContext: {
        edge,
        entry,
        exit,
        subgrid: subgrid.map(row => row.map(cell => cell ? 'RED' : 'EMPTY'))
      }
    }, null, 2));
    
    return {
      backgroundColor: isSelected 
        ? baseColor 
        : `${baseColor}40`, // 40 = 25% opacity for unselected edges
      transition: 'background-color 0.2s ease-in-out',
      // Hover handled by CSS classes
    };
  };

  // Log all edges' panel types with a special note for right panels
  console.log(`VISUALIZATION: All panels for cube [${row},${col}]:`, JSON.stringify({
    north: getPanelType('N', entry, exit, subgrid.map(row => row.map(cell => Boolean(cell)))) + (getPanelType('N', entry, exit, subgrid.map(row => row.map(cell => Boolean(cell)))) === 'right' ? ' (RIGHT PANEL)' : ''),
    east: getPanelType('E', entry, exit, subgrid.map(row => row.map(cell => Boolean(cell)))) + (getPanelType('E', entry, exit, subgrid.map(row => row.map(cell => Boolean(cell)))) === 'right' ? ' (RIGHT PANEL)' : ''),
    south: getPanelType('S', entry, exit, subgrid.map(row => row.map(cell => Boolean(cell)))) + (getPanelType('S', entry, exit, subgrid.map(row => row.map(cell => Boolean(cell)))) === 'right' ? ' (RIGHT PANEL)' : ''),
    west: getPanelType('W', entry, exit, subgrid.map(row => row.map(cell => Boolean(cell)))) + (getPanelType('W', entry, exit, subgrid.map(row => row.map(cell => Boolean(cell)))) === 'right' ? ' (RIGHT PANEL)' : '')
  }, null, 2));

  console.groupEnd();

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
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
                'w-2/3 h-4': ['N', 'S'].includes(edge),
                'h-2/3 w-4': ['W', 'E'].includes(edge),
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
                type: getPanelType(edge as CompassDirection, entry, exit, subgrid.map(row => row.map(cell => Boolean(cell))))
              }, null, 2));
              onToggle(edge);
            }}
          />
        ))}
      </div>
    </div>
  );
};
