import React from 'react';
import { SubgridState } from '@/utils/visualization/pipeConfigurator';

interface PipeRendererProps {
  subgrid: SubgridState;
}

export const PipeRenderer: React.FC<PipeRendererProps> = ({ subgrid }) => {
  return (
    <div 
      className="pipe-subgrid absolute inset-0 grid grid-cols-2 gap-0.5 pointer-events-none z-10" 
      data-testid="pipe-subgrid"
    >
      {subgrid.map((row, rowIndex) =>
        row.map((isActive, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`
              relative
              ${isActive ? 'bg-red-500' : 'bg-transparent'}
              transition-colors duration-200
            `}
            data-active={isActive ? 'true' : 'false'}
            data-position={`${rowIndex}-${colIndex}`}
            data-testid={`pipeline-cell-${rowIndex}-${colIndex}`}
          />
        ))
      )}
    </div>
  );
}; 