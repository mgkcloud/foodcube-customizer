import React from 'react';
import { PANEL_COLORS } from '@/constants/colors';

interface KeyItemProps {
  color?: string;
  label: string;
  count?: number;
  icon?: string;
  description?: string;
  testId?: string;
}

const KeyItem: React.FC<KeyItemProps> = ({ color, label, count, icon, description, testId }) => (
  <div className="flex items-center gap-1 text-xs sm:text-sm group relative" data-testid={testId || `key-item-${label.toLowerCase()}`}>
    {color ? (
      <div 
        className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm flex-shrink-0" 
        style={{ backgroundColor: color }}
        data-testid={`color-indicator-${label.toLowerCase()}`}
      />
    ) : icon ? (
      <div 
        className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center font-mono flex-shrink-0"
        data-testid={`icon-indicator-${label.toLowerCase()}`}
      >
        {icon}
      </div>
    ) : null}
    <span className="text-gray-700 truncate" data-testid={`label-${label.toLowerCase()}`}>{label}</span>
    {count !== undefined && (
      <span className="text-gray-500 ml-auto" data-testid={`count-${label.toLowerCase()}`}>({count})</span>
    )}
    {description && (
      <div 
        className="hidden group-hover:block absolute left-0 sm:left-full top-full sm:top-auto sm:ml-2 bg-gray-800 text-white text-xs p-2 rounded whitespace-nowrap z-10 max-w-[200px]"
        data-testid={`description-${label.toLowerCase()}`}
      >
        {description}
      </div>
    )}
  </div>
);

interface PackageItemProps {
  label: string;
  count: number;
  description: string;
  testId?: string;
}

const PackageItem: React.FC<PackageItemProps> = ({ label, count, description, testId }) => (
  <div 
    className="grid grid-cols-[auto_auto_1fr] gap-2 items-center text-xs sm:text-sm py-1 border-b border-gray-100 last:border-0"
    data-testid={testId || `package-${label.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <span className="text-gray-700 font-medium" data-testid={`package-label-${label.toLowerCase().replace(/\s+/g, '-')}`}>{label}</span>
    <span className="text-gray-500 font-semibold" data-testid={`package-count-${label.toLowerCase().replace(/\s+/g, '-')}`}>{count > 0 ? count + 'x' : '-'}</span>
    <span className="text-xs text-gray-400 truncate hidden sm:inline-block" data-testid={`package-description-${label.toLowerCase().replace(/\s+/g, '-')}`}>{description}</span>
    <span className="text-[10px] text-gray-400 truncate col-span-3 sm:hidden">{description}</span>
  </div>
);

interface CladdingKeyProps {
  requirements: {
    fourPackRegular: number;
    twoPackRegular: number;
    sidePanels: number;
    leftPanels: number;
    rightPanels: number;
    straightCouplings: number;
    cornerConnectors: number;
  };
}

export const CladdingKey: React.FC<CladdingKeyProps> = ({ requirements }) => {
  return (
    <div className="bg-white p-2 sm:p-4 rounded-lg shadow-sm text-xs sm:text-sm" data-testid="cladding-key">
      <h3 className="text-base sm:text-lg font-semibold mb-2" data-testid="packages-heading">Required Packages</h3>
      <div className="space-y-1 mb-3" data-testid="packages-container">
        <PackageItem 
          label="4-Pack" 
          count={requirements.fourPackRegular}
          description="2 side + 1 left + 1 right"
          testId="package-four-pack"
        />
        <PackageItem 
          label="2-Pack" 
          count={requirements.twoPackRegular}
          description="2 side panels"
          testId="package-two-pack"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        <div data-testid="panel-types-section">
          <h3 className="text-base sm:text-lg font-semibold mb-2" data-testid="panel-types-heading">Panel Types</h3>
          <div className="space-y-1 mb-3">
            <KeyItem 
              color={PANEL_COLORS.side} 
              label="Side"
              count={requirements.sidePanels}
              description="Blue - Standard side panels"
              testId="panel-side"
            />
            <KeyItem 
              color={PANEL_COLORS.left} 
              label="Left"
              count={requirements.leftPanels}
              description="Green - Left-facing panels"
              testId="panel-left"
            />
            <KeyItem 
              color={PANEL_COLORS.right} 
              label="Right"
              count={requirements.rightPanels}
              description="Purple - Right-facing panels"
              testId="panel-right"
            />
          </div>
        </div>
        
        <div data-testid="connectors-section">
          <h3 className="text-base sm:text-lg font-semibold mb-2" data-testid="connectors-heading">Connectors</h3>
          <div className="space-y-1">
            <KeyItem 
              icon="⌟"
              label="Corner"
              count={requirements.cornerConnectors}
              description="Connects panels at 90° angles"
              testId="connector-corner"
            />
            <KeyItem 
              icon="━"
              label="Straight"
              count={requirements.straightCouplings}
              description="Connects panels in a straight line"
              testId="connector-straight"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-100" data-testid="cladding-key-footer">
        <div className="text-[10px] sm:text-xs text-gray-500">
          <p>* Hover over items for details • Colors match visual configuration</p>
        </div>
      </div>
    </div>
  );
};
