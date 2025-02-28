import React from 'react';
import { PANEL_COLORS } from '@/constants/colors';

const CONNECTOR_COLORS = {
  corner: '#D97706', // Amber
  straight: '#4B5563' // Gray
};

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
  console.log("CladdingKey received requirements:", JSON.stringify(requirements, null, 2));
  
  // Calculate total panels of each type (including those in packages)
  const totalSidePanels = requirements.sidePanels + (requirements.fourPackRegular * 2) + (requirements.twoPackRegular * 2);
  const totalLeftPanels = requirements.leftPanels + requirements.fourPackRegular;
  const totalRightPanels = requirements.rightPanels + requirements.fourPackRegular;
  
  // Create a debug element with all the requirements values
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const debugElement = document.createElement('div');
      debugElement.id = 'debug-requirements';
      debugElement.style.display = 'none';
      debugElement.setAttribute('data-requirements', JSON.stringify(requirements));
      debugElement.setAttribute('data-total-panels', JSON.stringify({
        side: totalSidePanels,
        left: totalLeftPanels,
        right: totalRightPanels
      }));
      
      // Remove any existing debug element
      const existingDebug = document.getElementById('debug-requirements');
      if (existingDebug) {
        existingDebug.remove();
      }
      
      document.body.appendChild(debugElement);
    }
  }, [requirements, totalSidePanels, totalLeftPanels, totalRightPanels]);
  
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
              count={totalSidePanels}
              description="Blue - Standard side panels"
              testId="panel-side"
            />
            <KeyItem 
              color={PANEL_COLORS.left} 
              label="Left"
              count={totalLeftPanels}
              description="Green - Left-facing panels"
              testId="panel-left"
            />
            <KeyItem 
              color={PANEL_COLORS.right} 
              label="Right"
              count={totalRightPanels}
              description="Purple - Right-facing panels"
              testId="panel-right"
            />
          </div>
        </div>
        
        <div data-testid="connectors-section">
          <h3 className="text-base sm:text-lg font-semibold mb-2" data-testid="connectors-heading">Connectors</h3>
          <div className="space-y-1 mb-3">
            <KeyItem 
              color={CONNECTOR_COLORS.corner} 
              label="Corner" 
              count={requirements.cornerConnectors}
              description="L-shaped connector"
              testId="connector-corner"
            />
            <KeyItem 
              color={CONNECTOR_COLORS.straight} 
              label="Straight" 
              count={requirements.straightCouplings}
              description="Straight connector"
              testId="connector-straight"
            />
          </div>
        </div>
      </div>
      
      {/* Debug Info */}
      <details className="mt-4 border-t pt-2 text-xs">
        <summary className="font-semibold cursor-pointer">▾ Debug Info</summary>
        <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
          {JSON.stringify(requirements, null, 2)}
        </pre>
      </details>
    </div>
  );
};
