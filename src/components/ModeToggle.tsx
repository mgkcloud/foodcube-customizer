import React from 'react';
import { cn } from '@/lib/utils';

export type InteractionMode = 'cube' | 'cladding';

interface ModeToggleProps {
  mode: InteractionMode;
  onChange: (mode: InteractionMode) => void;
  className?: string;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange, className }) => {
  const baseBtn =
    'flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
  return (
    <div
      className={cn(
        'inline-flex rounded-full border border-gray-200 bg-white shadow-sm overflow-hidden',
        className
      )}
    >
      <button
        onClick={() => onChange('cube')}
        className={cn(
          baseBtn,
          mode === 'cube'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-50'
        )}
        data-testid="mode-toggle-cube"
        aria-pressed={mode === 'cube'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <span>Place Cubes</span>
      </button>

      <button
        onClick={() => onChange('cladding')}
        className={cn(
          baseBtn,
          mode === 'cladding'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-50'
        )}
        data-testid="mode-toggle-cladding"
        aria-pressed={mode === 'cladding'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        <span>Add Panels</span>
      </button>
    </div>
  );
};
