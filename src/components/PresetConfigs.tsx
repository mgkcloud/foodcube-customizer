import React from 'react';
import { Button } from '@/components/ui/button';
import { PANEL_COLORS } from '@/constants/colors';
import { useTutorial } from '@/contexts/TutorialContext';

interface PresetConfigsProps {
  onApply: (preset: string) => void;
}

export const PresetConfigs: React.FC<PresetConfigsProps> = ({ onApply }) => {
  const { notifyTutorial } = useTutorial();
  
  // Wrapped handler to notify the tutorial system
  const handlePresetApply = (preset: string) => {
    onApply(preset);
    
    // Notify tutorial of the preset application
    notifyTutorial({
      type: 'PRESET_APPLIED',
      payload: {
        presetName: preset
      }
    });
  };
  return (
    <div className=" justify-center gap-3 sm:gap-4 preset-configs grid grid-cols-2 grid-rows-2" data-testid="preset-configs">
      <Button 
        variant="outline"
        className="text-xs sm:text-sm md:text-base font-semibold px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 border-blue-200 hover:border-blue-400 shadow-md hover:shadow-lg text-blue-900 min-w-[95px] sm:min-w-[120px] md:min-w-[140px] h-[80px] sm:h-[80px] transform hover:scale-105"
        style={{ 
          boxShadow: '0 4px 15px -2px rgba(18, 159, 206, 0.15), 0 2px 8px -2px rgba(18, 159, 206, 0.1)'
        }}
        onClick={() => handlePresetApply('line')}
        data-testid="preset-straight"
        aria-label="Apply straight 3x1 configuration"
      >
        <span className="flex flex-col items-center gap-1 sm:gap-2">
          <div className="p-1 rounded-lg bg-white/80 shadow-sm border border-blue-100" style={{ borderColor: `${PANEL_COLORS.side}33` }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
              <rect x="2" y="9" width="6" height="6" rx="1" fill={PANEL_COLORS.side} />
              <rect x="9" y="9" width="6" height="6" rx="1" fill={PANEL_COLORS.side} />
              <rect x="16" y="9" width="6" height="6" rx="1" fill={PANEL_COLORS.side} />
            </svg>
          </div>
          <span className="font-medium">Straight (3x1)</span>
        </span>
      </Button>
      
      <Button 
        variant="outline"
        className="text-xs sm:text-sm md:text-base font-semibold px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 border-blue-200 hover:border-blue-400 shadow-md hover:shadow-lg text-blue-900 min-w-[95px] sm:min-w-[120px] md:min-w-[140px] h-[80px] sm:h-[80px] transform hover:scale-105"
        style={{ 
          boxShadow: '0 4px 15px -2px rgba(18, 159, 206, 0.15), 0 2px 8px -2px rgba(18, 159, 206, 0.1)'
        }}
        onClick={() => handlePresetApply('l-shape')}
        data-testid="preset-l-shape"
        aria-label="Apply L-shaped configuration"
      >
        <span className="flex flex-col items-center gap-1 sm:gap-2">
          <div className="p-1 rounded-lg bg-white/80 shadow-sm border border-blue-100" style={{ borderColor: `${PANEL_COLORS.side}33` }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
              <rect x="2" y="9" width="6" height="6" rx="1" fill={PANEL_COLORS.side} />
              <rect x="9" y="9" width="6" height="6" rx="1" fill={PANEL_COLORS.side} />
              <rect x="9" y="16" width="6" height="6" rx="1" fill={PANEL_COLORS.side} />
            </svg>
          </div>
          <span className="font-medium">L-Shape</span>
        </span>
      </Button>
      
      <Button 
        variant="outline"
        className="text-xs sm:text-sm md:text-base font-semibold px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 border-blue-200 hover:border-blue-400 shadow-md hover:shadow-lg text-blue-900 min-w-[95px] sm:min-w-[120px] md:min-w-[140px] h-[80px] sm:h-[80px] transform hover:scale-105"
        style={{ 
          boxShadow: '0 4px 15px -2px rgba(18, 159, 206, 0.15), 0 2px 8px -2px rgba(18, 159, 206, 0.1)'
        }}
        onClick={() => handlePresetApply('u-shape')}
        data-testid="preset-u-shape"
        aria-label="Apply U-shaped configuration"
      >
        <span className="flex flex-col items-center gap-1 sm:gap-2">
          <div className="p-1 rounded-lg bg-white/80 shadow-sm border border-blue-100" style={{ borderColor: `${PANEL_COLORS.side}33` }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
              <rect x="2" y="9" width="6" height="6" rx="1" fill={PANEL_COLORS.side} />
              <rect x="2" y="16" width="6" height="6" rx="1" fill={PANEL_COLORS.side} />
              <rect x="9" y="16" width="6" height="6" rx="1" fill={PANEL_COLORS.side} />
              <rect x="16" y="16" width="6" height="6" rx="1" fill={PANEL_COLORS.side} />
              <rect x="16" y="9" width="6" height="6" rx="1" fill={PANEL_COLORS.side} />
            </svg>
          </div>
          <span className="font-medium">U-Shape</span>
        </span>
      </Button>
      
      <Button 
        variant="outline"
        className="text-xs sm:text-sm md:text-base font-semibold px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 transition-all duration-300 border-blue-200 hover:border-blue-400 shadow-md hover:shadow-lg text-blue-900 min-w-[95px] sm:min-w-[120px] md:min-w-[140px] h-[80px] sm:h-[80px] transform hover:scale-105"
        style={{ 
          boxShadow: '0 4px 15px -2px rgba(18, 159, 206, 0.15), 0 2px 8px -2px rgba(18, 159, 206, 0.1)'
        }}
        onClick={() => handlePresetApply('dual-lines')}
        data-testid="preset-dual-lines"
        aria-label="Apply dual horizontal lines configuration"
      >
        <span className="flex flex-col items-center gap-1 sm:gap-2">
          <div className="p-1 rounded-lg bg-white/80 shadow-sm border border-blue-100" style={{ borderColor: `${PANEL_COLORS.side}33` }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
              <rect x="2" y="6" width="6" height="5" rx="1" fill={PANEL_COLORS.side} />
              <rect x="9" y="6" width="6" height="5" rx="1" fill={PANEL_COLORS.side} />
              <rect x="16" y="6" width="6" height="5" rx="1" fill={PANEL_COLORS.side} />
              <rect x="2" y="13" width="6" height="5" rx="1" fill={PANEL_COLORS.side} />
              <rect x="9" y="13" width="6" height="5" rx="1" fill={PANEL_COLORS.side} />
              <rect x="16" y="13" width="6" height="5" rx="1" fill={PANEL_COLORS.side} />
            </svg>
          </div>
          <span className="font-medium">Two Rows</span>
        </span>
      </Button>
    </div>
  );
};