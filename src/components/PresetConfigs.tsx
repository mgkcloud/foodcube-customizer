import React from 'react';
import { Button } from '@/components/ui/button';
import { GridCell } from './types';
import { generateStraightPreset, generateLShapePreset, generateUShapePreset } from '@/utils/core/presetGenerators';
import { addCladdingToExposedEdges } from '@/utils/core/presetTransformers';

const PRESETS = {
  straight: addCladdingToExposedEdges(generateStraightPreset()),
  L: addCladdingToExposedEdges(generateLShapePreset()),
  U: addCladdingToExposedEdges(generateUShapePreset())
} as const;

interface PresetConfigsProps {
  onApply: (preset: GridCell[][]) => void;
}

export const PresetConfigs: React.FC<PresetConfigsProps> = ({ onApply }) => {
  return (
    <div className="flex flex-wrap gap-4">
      <Button 
        variant="outline"
        className='text-xs md:text-sm font-semibold bg-white '
        onClick={() => onApply(PRESETS.straight)}
      >
        Straight (3x1)
      </Button>
      <Button 
        variant="outline"
        className='text-xs md:text-sm font-semibold bg-white'
        onClick={() => onApply(PRESETS.L)}
      >
        L-Shape
      </Button>
      <Button 
        variant="outline"
        className='text-xs md:text-sm font-semibold bg-white'
        onClick={() => onApply(PRESETS.U)}
      >
        U-Shape
      </Button>
    </div>
  );
};