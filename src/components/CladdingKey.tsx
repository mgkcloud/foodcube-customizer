import React, { useEffect } from 'react';
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
  <div className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-gray-50/80 transition-colors" data-testid={testId || `key-item-${label.toLowerCase()}`}>
    {color ? (
      <div 
        className="w-3 h-3 rounded-md flex-shrink-0 shadow-sm border border-gray-100" 
        style={{ backgroundColor: color }}
        data-testid={`color-indicator-${label.toLowerCase()}`}
      />
    ) : icon ? (
      <div 
        className="w-3 h-3 flex items-center justify-center font-mono flex-shrink-0"
        data-testid={`icon-indicator-${label.toLowerCase()}`}
      >
        {icon}
      </div>
    ) : null}
    <span className="text-gray-800 font-medium text-sm" data-testid={`label-${label.toLowerCase()}`}>{label}</span>
    {count !== undefined && (
      <span className="ml-auto text-xs font-medium px-2 py-0.5 bg-gray-100 rounded-full text-gray-700" data-testid={`count-${label.toLowerCase()}`}>{count}</span>
    )}
    {description && (
      <div 
        className="hidden group-hover:block absolute left-0 sm:left-full top-full sm:top-auto sm:ml-2 bg-gray-800 text-white text-xs p-2 rounded-md whitespace-nowrap z-10 max-w-[200px] shadow-lg"
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
    className="flex items-center py-1.5 px-2 hover:bg-gray-50/80 rounded-md transition-colors"
    data-testid={testId || `package-${label.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <div className="flex flex-col">
      <span className="text-gray-800 font-semibold text-sm" data-testid={`package-label-${label.toLowerCase().replace(/\s+/g, '-')}`}>{label}</span>
      <span className="text-xs text-gray-500 leading-tight" data-testid={`package-description-${label.toLowerCase().replace(/\s+/g, '-')}`}>{description}</span>
    </div>
    <span className="ml-auto text-sm font-semibold px-2 py-0.5 bg-blue-50 rounded-full text-blue-700 min-w-[2.5rem] text-center" data-testid={`package-count-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      {count > 0 ? count + 'x' : '0'}
    </span>
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
  showDebug?: boolean;
}

export const CladdingKey: React.FC<CladdingKeyProps> = ({ requirements, showDebug = false }) => {
  console.log("CladdingKey received requirements:", JSON.stringify(requirements, null, 2));
  
  // Enhanced logging to track requirements updates
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] CladdingKey requirements UPDATED:`, JSON.stringify(requirements, null, 2));
    
    // Store the previous requirements in a data attribute for debugging
    if (typeof document !== 'undefined') {
      const prevReqs = document.getElementById('cladding-key-requirements-history');
      if (!prevReqs) {
        const historyElement = document.createElement('div');
        historyElement.id = 'cladding-key-requirements-history';
        historyElement.style.display = 'none';
        document.body.appendChild(historyElement);
      }
      
      // Add the current requirements to the history
      const historyElement = document.getElementById('cladding-key-requirements-history');
      if (historyElement) {
        const history = historyElement.getAttribute('data-history') || '[]';
        try {
          const historyArray = JSON.parse(history);
          historyArray.push({ timestamp, requirements });
          // Keep only the last 10 updates
          const trimmedHistory = historyArray.slice(-10);
          historyElement.setAttribute('data-history', JSON.stringify(trimmedHistory));
        } catch (e) {
          console.error('Error updating requirements history:', e);
        }
      }
    }
  }, [
    requirements.fourPackRegular,
    requirements.twoPackRegular,
    requirements.sidePanels,
    requirements.leftPanels,
    requirements.rightPanels,
    requirements.straightCouplings,
    requirements.cornerConnectors
  ]);
  
  // Calculate total panels of each type (including those in packages)
  const totalSidePanels = requirements.sidePanels + (requirements.fourPackRegular * 2) + (requirements.twoPackRegular * 2);
  const totalLeftPanels = requirements.leftPanels + requirements.fourPackRegular;
  const totalRightPanels = requirements.rightPanels + requirements.fourPackRegular;
  
  console.log("PANEL COUNT DEBUG:");
  console.log("- Raw panel counts from requirements:", {
    sidePanels: requirements.sidePanels,
    leftPanels: requirements.leftPanels,
    rightPanels: requirements.rightPanels
  });
  console.log("- Package counts:", {
    fourPackRegular: requirements.fourPackRegular,
    twoPackRegular: requirements.twoPackRegular
  });
  console.log("- Panels contributed by packages:", {
    sideFromFourPack: requirements.fourPackRegular * 2,
    sideFromTwoPack: requirements.twoPackRegular * 2,
    leftFromFourPack: requirements.fourPackRegular,
    rightFromFourPack: requirements.fourPackRegular
  });
  console.log("- Total calculated panel counts:", {
    totalSidePanels,
    totalLeftPanels,
    totalRightPanels
  });
  
  // Determine the configuration type based on the requirements
  let configurationType = "unknown";
  
  // Single cube (4 edges): 1 four-pack (2 side + 1 left + 1 right)
  if (requirements.fourPackRegular === 1 && 
      requirements.twoPackRegular === 0 && 
      requirements.straightCouplings === 0 && 
      requirements.cornerConnectors === 0) {
    configurationType = "single";
  }
  // Three cubes in line (8 edges): 1 four-pack, 2 two-packs, 2 straight couplings
  else if (requirements.fourPackRegular === 1 && 
      requirements.twoPackRegular === 2 && 
      requirements.straightCouplings === 2 && 
      requirements.cornerConnectors === 0) {
    configurationType = "line";
  }
  // L-shaped (8 edges): 1 four-pack, 1 left, 2 two-packs, 1 corner connector, 1 straight coupling
  else if (requirements.cornerConnectors === 1 && 
      requirements.straightCouplings === 1) {
    configurationType = "l-shape";
    console.log("L-SHAPE CONFIGURATION DETECTED - Special panel distribution may apply");
  }
  // U-shaped (12 edges): 1 four-pack, 2 two-packs, 2 corner connectors, 2 straight couplings
  else if (requirements.cornerConnectors === 2 && 
      requirements.straightCouplings === 2) {
    configurationType = "u-shape";
  }
  // Dual-lines: 2 four-packs, 2 two-packs, 0 corner connectors, 2 straight couplings
  else if (requirements.straightCouplings === 2 && 
      requirements.cornerConnectors === 0 && 
      requirements.fourPackRegular === 2) {
    configurationType = "dual-lines";
    console.log("DUAL-LINES CONFIGURATION DETECTED - Multiple independent irrigation paths");
  }
  
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
      debugElement.setAttribute('data-configuration-type', configurationType);
      
      // Remove any existing debug element
      const existingDebug = document.getElementById('debug-requirements');
      if (existingDebug) {
        existingDebug.remove();
      }
      
      document.body.appendChild(debugElement);
    }
  }, [requirements, totalSidePanels, totalLeftPanels, totalRightPanels, configurationType]);
  
  const hasRequirements = Object.values(requirements).some(val => val > 0);
  
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm" data-testid="cladding-key">
      {/* Header with title and status badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h3 className="text-base font-bold text-gray-800" data-testid="packages-heading">Required Packages</h3>
          {hasRequirements && (
            <div className="ml-2 inline-flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              <span className="text-xs text-blue-700">Ready</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Package items */}
      <div className="space-y-0.5 mb-3 bg-gray-50/70 rounded-lg p-1.5" data-testid="packages-container">
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

      {/* Panel types and connectors in grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {/* Panel types */}
        <div data-testid="panel-types-section">
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
            </div>
            <h3 className="text-xs font-bold text-gray-700" data-testid="panel-types-heading">Panel Types</h3>
          </div>
          <div className="bg-gray-50/70 rounded-lg p-1">
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
        
        {/* Connectors */}
        <div data-testid="connectors-section">
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </div>
            <h3 className="text-xs font-bold text-gray-700" data-testid="connectors-heading">Connectors</h3>
          </div>
          <div className="bg-gray-50/70 rounded-lg p-1">
            <KeyItem 
              color={CONNECTOR_COLORS.corner} 
              label="Corner" 
              count={requirements.cornerConnectors}
              description="Amber - Corner connectors for L and U shapes"
              testId="connector-corner"
            />
            <KeyItem 
              color={CONNECTOR_COLORS.straight} 
              label="Straight" 
              count={requirements.straightCouplings}
              description="Gray - Straight couplings for linear connections"
              testId="connector-straight"
            />
          </div>
        </div>
      </div>
      
      {/* Debug Info - only shown when explicitly enabled */}
      {showDebug && (
        <details className="mt-3 text-xs border-t border-gray-100 pt-2">
          <summary className="font-semibold cursor-pointer flex items-center text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Debug Info
          </summary>
          <div className="mt-2 bg-gray-50 p-2 rounded-md text-xs overflow-auto">
            <h4 className="font-bold mb-1 text-gray-700">Raw Requirements (Packages)</h4>
            <pre className="mb-2 bg-white p-2 rounded border border-gray-200 overflow-auto max-h-[80px]">
              {JSON.stringify(requirements, null, 2)}
            </pre>
            
            <h4 className="font-bold mb-1 text-gray-700">Configuration Type</h4>
            <pre className="mb-2 bg-white p-2 rounded border border-gray-200">
              {configurationType}
            </pre>
            
            <h4 className="font-bold mb-1 text-gray-700">Total Panel Counts</h4>
            <pre className="bg-white p-2 rounded border border-gray-200 overflow-auto max-h-[80px]">
              {JSON.stringify({
                sidePanels: totalSidePanels,
                leftPanels: totalLeftPanels,
                rightPanels: totalRightPanels,
                straightCouplings: requirements.straightCouplings,
                cornerConnectors: requirements.cornerConnectors
              }, null, 2)}
            </pre>
            <div className="mt-2 text-xs text-gray-500">
              <p>Note: 4-Pack = 2 side + 1 left + 1 right | 2-Pack = 2 side</p>
            </div>
          </div>
        </details>
      )}
    </div>
  );
};
