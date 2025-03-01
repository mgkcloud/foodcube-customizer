import React from 'react';
import { Button } from '@/components/ui/button';

interface PresetConfigsProps {
  onApply: (preset: string) => void;
}

export const PresetConfigs: React.FC<PresetConfigsProps> = ({ onApply }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2" data-testid="preset-configs">
      <Button 
        variant="outline"
        className="text-xs md:text-sm font-medium px-4 py-2 rounded-lg bg-white/90 hover:bg-blue-50 transition-colors border-blue-100 hover:border-blue-300 shadow-sm hover:shadow-md text-blue-900 min-w-[90px]"
        onClick={() => onApply('line')}
        data-testid="preset-straight"
        aria-label="Apply straight 3x1 configuration"
      >
        <span className="flex flex-col items-center gap-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
            <rect x="2" y="9" width="6" height="6" rx="1" fill="#3B82F6" />
            <rect x="9" y="9" width="6" height="6" rx="1" fill="#3B82F6" />
            <rect x="16" y="9" width="6" height="6" rx="1" fill="#3B82F6" />
          </svg>
          <span>Straight (3x1)</span>
        </span>
      </Button>
      
      <Button 
        variant="outline"
        className="text-xs md:text-sm font-medium px-4 py-2 rounded-lg bg-white/90 hover:bg-blue-50 transition-colors border-blue-100 hover:border-blue-300 shadow-sm hover:shadow-md text-blue-900 min-w-[90px]"
        onClick={() => onApply('l-shape')}
        data-testid="preset-l-shape"
        aria-label="Apply L-shaped configuration"
      >
        <span className="flex flex-col items-center gap-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
            <rect x="2" y="9" width="6" height="6" rx="1" fill="#3B82F6" />
            <rect x="9" y="9" width="6" height="6" rx="1" fill="#3B82F6" />
            <rect x="9" y="16" width="6" height="6" rx="1" fill="#3B82F6" />
          </svg>
          <span>L-Shape</span>
        </span>
      </Button>
      
      <Button 
        variant="outline"
        className="text-xs md:text-sm font-medium px-4 py-2 rounded-lg bg-white/90 hover:bg-blue-50 transition-colors border-blue-100 hover:border-blue-300 shadow-sm hover:shadow-md text-blue-900 min-w-[90px]"
        onClick={() => onApply('u-shape')}
        data-testid="preset-u-shape"
        aria-label="Apply U-shaped configuration"
      >
        <span className="flex flex-col items-center gap-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
            <rect x="2" y="9" width="6" height="6" rx="1" fill="#3B82F6" />
            <rect x="2" y="16" width="6" height="6" rx="1" fill="#3B82F6" />
            <rect x="9" y="16" width="6" height="6" rx="1" fill="#3B82F6" />
            <rect x="16" y="16" width="6" height="6" rx="1" fill="#3B82F6" />
            <rect x="16" y="9" width="6" height="6" rx="1" fill="#3B82F6" />
          </svg>
          <span>U-Shape</span>
        </span>
      </Button>
      
      <Button 
        variant="outline"
        className="text-xs md:text-sm font-medium px-4 py-2 rounded-lg bg-white/90 hover:bg-blue-50 transition-colors border-blue-100 hover:border-blue-300 shadow-sm hover:shadow-md text-blue-900 min-w-[90px]"
        onClick={() => onApply('dual-lines')}
        data-testid="preset-dual-lines"
        aria-label="Apply dual horizontal lines configuration"
      >
        <span className="flex flex-col items-center gap-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
            <rect x="2" y="6" width="6" height="5" rx="1" fill="#3B82F6" />
            <rect x="9" y="6" width="6" height="5" rx="1" fill="#3B82F6" />
            <rect x="16" y="6" width="6" height="5" rx="1" fill="#3B82F6" />
            <rect x="2" y="13" width="6" height="5" rx="1" fill="#3B82F6" />
            <rect x="9" y="13" width="6" height="5" rx="1" fill="#3B82F6" />
            <rect x="16" y="13" width="6" height="5" rx="1" fill="#3B82F6" />
          </svg>
          <span>Two Rows</span>
        </span>
      </Button>
    </div>
  );
};