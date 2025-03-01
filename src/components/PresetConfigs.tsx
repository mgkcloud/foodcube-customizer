import React from 'react';
import { Button } from '@/components/ui/button';

interface PresetConfigsProps {
  onApply: (preset: string) => void;
}

export const PresetConfigs: React.FC<PresetConfigsProps> = ({ onApply }) => {
  return (
    <div className="flex flex-wrap gap-4" data-testid="preset-configs">
      <Button 
        variant="outline"
        className='text-xs md:text-sm font-semibold bg-white '
        onClick={() => onApply('line')}
        data-testid="preset-straight"
        aria-label="Apply straight 3x1 configuration"
      >
        Straight (3x1)
      </Button>
      <Button 
        variant="outline"
        className='text-xs md:text-sm font-semibold bg-white'
        onClick={() => onApply('l-shape')}
        data-testid="preset-l-shape"
        aria-label="Apply L-shaped configuration"
      >
        L-Shape
      </Button>
      <Button 
        variant="outline"
        className='text-xs md:text-sm font-semibold bg-white'
        onClick={() => onApply('u-shape')}
        data-testid="preset-u-shape"
        aria-label="Apply U-shaped configuration"
      >
        U-Shape
      </Button>
      <Button 
        variant="outline"
        className='text-xs md:text-sm font-semibold bg-white'
        onClick={() => onApply('dual-lines')}
        data-testid="preset-dual-lines"
        aria-label="Apply dual horizontal lines configuration"
      >
        Dual Lines
      </Button>
    </div>
  );
};