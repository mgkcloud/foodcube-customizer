import React from 'react';
import { SubgridState } from '@/utils/visualization/pipeConfigurator';
import { cn } from '@/lib/utils';

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
            className={cn(
              'relative transition-all duration-200',
              isActive ? 'water-flow' : 'bg-transparent'
            )}
            data-active={isActive ? 'true' : 'false'}
            data-position={`${rowIndex}-${colIndex}`}
            data-testid={`pipeline-cell-${rowIndex}-${colIndex}`}
          >
            {isActive && (
              <>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}; 