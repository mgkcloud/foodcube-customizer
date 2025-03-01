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
  <div className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-gray-50/80 transition-colors group relative" data-testid={testId || `key-item-${label.toLowerCase()}`}>
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

interface ProductItemProps {
  label: string;
  count: number;
  description?: string;
  color?: string;
  testId?: string;
}

const ProductItem: React.FC<ProductItemProps> = ({ label, count, description, color, testId }) => (
  <div 
    className="flex items-center py-1.5 px-2 hover:bg-gray-50/80 rounded-md transition-colors group relative"
    data-testid={testId || `product-${label.toLowerCase().replace(/\s+/g, '-')}`}
  >
    {color && (
      <div 
        className="w-3 h-3 rounded-md flex-shrink-0 shadow-sm border border-gray-100 mr-2" 
        style={{ backgroundColor: color }}
      />
    )}
    <div className="flex flex-col">
      <span className="text-gray-800 font-semibold text-sm" data-testid={`product-label-${label.toLowerCase().replace(/\s+/g, '-')}`}>{label}</span>
      {description && (
        <span className="text-xs text-gray-500 leading-tight" data-testid={`product-description-${label.toLowerCase().replace(/\s+/g, '-')}`}>{description}</span>
      )}
    </div>
    <span className="ml-auto text-sm font-semibold px-2 py-0.5 bg-blue-50 rounded-full text-blue-700 min-w-[2.5rem] text-center" data-testid={`product-count-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      {count > 0 ? count + 'x' : '0'}
    </span>
    {description && (
      <div 
        className="hidden group-hover:block absolute left-0 sm:left-full top-full sm:top-auto sm:ml-2 bg-gray-800 text-white text-xs p-2 rounded-md z-10 max-w-[200px] shadow-lg"
      >
        {description}
      </div>
    )}
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
        sidePanels: totalSidePanels,
        leftPanels: totalLeftPanels,
        rightPanels: totalRightPanels
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
  
  // Group all products (packages, panels, connectors) into a single list
  const allProducts = [
    // Packages first
    ...(requirements.fourPackRegular > 0 ? [{
      label: "4-Pack",
      count: requirements.fourPackRegular,
      description: "Contains: 2 side panels + 1 left panel + 1 right panel"
    }] : []),
    ...(requirements.twoPackRegular > 0 ? [{
      label: "2-Pack",
      count: requirements.twoPackRegular,
      description: "Contains: 2 side panels"
    }] : []),
    
    // Individual panels (only show if there are individual panels needed)
    ...(requirements.sidePanels > 0 ? [{
      label: "Side Panel",
      count: requirements.sidePanels,
      description: `Additional individual side panels (Blue) - ${totalSidePanels} total needed`,
      color: PANEL_COLORS.side
    }] : []),
    ...(requirements.leftPanels > 0 ? [{
      label: "Left Panel",
      count: requirements.leftPanels,
      description: `Additional individual left panels (Green) - ${totalLeftPanels} total needed`,
      color: PANEL_COLORS.left
    }] : []),
    ...(requirements.rightPanels > 0 ? [{
      label: "Right Panel",
      count: requirements.rightPanels,
      description: `Additional individual right panels (Orange) - ${totalRightPanels} total needed`,
      color: PANEL_COLORS.right
    }] : []),
    
    // Connectors
    ...(requirements.straightCouplings > 0 ? [{
      label: "Straight Connector",
      count: requirements.straightCouplings,
      description: "For connecting cubes in a straight line"
    }] : []),
    ...(requirements.cornerConnectors > 0 ? [{
      label: "Corner Connector",
      count: requirements.cornerConnectors,
      description: "For connecting cubes at 90° angles (L and U shapes)"
    }] : [])
  ];
  
  // Calculate total panel counts for the tooltip
  const totalPanelsTooltip = `Total panels needed: ${totalSidePanels} side, ${totalLeftPanels} left, ${totalRightPanels} right`;
  
  return (
    <div className="bg-white p-2 rounded-xl shadow-sm" data-testid="cladding-key">
      {/* Header with title and status badge */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <h3 className="text-base font-bold text-gray-800" data-testid="products-heading">Required Products</h3>
          {hasRequirements && (
            <div className="ml-2 inline-flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              <span className="text-xs text-blue-700">Ready</span>
            </div>
          )}
        </div>
        
        {/* Total panel counts info button with tooltip */}
        <div className="relative group">
          <button 
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full"
            title="View total panel counts"
            data-testid="total-panels-info"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
          <div 
            className="hidden group-hover:block absolute right-0 top-full mt-1 bg-gray-800 text-white text-xs p-2 rounded-md z-10 w-[220px] shadow-lg"
            data-testid="total-panels-tooltip"
          >
            <p className="mb-1 font-semibold">Total Panel Requirements</p>
            <ul className="space-y-1">
              <li className="flex justify-between">
                <span>Side Panels:</span>
                <span className="font-medium">{totalSidePanels}</span>
              </li>
              <li className="flex justify-between">
                <span>Left Panels:</span>
                <span className="font-medium">{totalLeftPanels}</span>
              </li>
              <li className="flex justify-between">
                <span>Right Panels:</span>
                <span className="font-medium">{totalRightPanels}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Improved product list with clear categorization - optimized for mobile */}
      <div className="space-y-2 bg-gray-50/70 rounded-lg p-1.5" data-testid="all-products-container">
        {allProducts.length > 0 ? (
          <>
            {/* Panel Packs Section - more compact */}
            {(requirements.fourPackRegular > 0 || requirements.twoPackRegular > 0) && (
              <div className="space-y-1">
                {/* 4-Pack with color indicators - more compact */}
                {requirements.fourPackRegular > 0 && (
                  <div className="bg-white rounded-md p-1.5 shadow-sm">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-gray-800">4-Pack</span>
                      <span className="text-sm font-semibold px-2 py-0.5 bg-blue-50 rounded-full text-blue-700 min-w-[2.5rem] text-center">
                        {requirements.fourPackRegular}x
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-gray-500">Contains:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PANEL_COLORS.side }}></div>
                          <span className="text-xs">2 side</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PANEL_COLORS.left }}></div>
                          <span className="text-xs">1 left</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PANEL_COLORS.right }}></div>
                          <span className="text-xs">1 right</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 2-Pack with color indicators - more compact */}
                {requirements.twoPackRegular > 0 && (
                  <div className="bg-white rounded-md p-1.5 shadow-sm">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-gray-800">2-Pack</span>
                      <span className="text-sm font-semibold px-2 py-0.5 bg-blue-50 rounded-full text-blue-700 min-w-[2.5rem] text-center">
                        {requirements.twoPackRegular}x
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Contains:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PANEL_COLORS.side }}></div>
                        <span className="text-xs">2 side panels</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Additional Individual Panels Section - more compact */}
            {(requirements.sidePanels > 0 || requirements.leftPanels > 0 || requirements.rightPanels > 0) && (
              <div>
                <div className="text-xs font-medium text-gray-500 px-1 mb-0.5">Additional Panels:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                  {requirements.sidePanels > 0 && (
                    <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center">
                      <div className="flex items-center gap-1.5 flex-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PANEL_COLORS.side }}></div>
                        <div className="text-xs">
                          <span className="font-medium">Side Panel</span>
                          <span className="text-gray-500 ml-1">({totalSidePanels} total)</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 rounded-full text-blue-700 min-w-[2rem] text-center">
                        {requirements.sidePanels}x
                      </span>
                    </div>
                  )}
                  {requirements.leftPanels > 0 && (
                    <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center">
                      <div className="flex items-center gap-1.5 flex-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PANEL_COLORS.left }}></div>
                        <div className="text-xs">
                          <span className="font-medium">Left Panel</span>
                          <span className="text-gray-500 ml-1">({totalLeftPanels} total)</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 rounded-full text-blue-700 min-w-[2rem] text-center">
                        {requirements.leftPanels}x
                      </span>
                    </div>
                  )}
                  {requirements.rightPanels > 0 && (
                    <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center">
                      <div className="flex items-center gap-1.5 flex-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PANEL_COLORS.right }}></div>
                        <div className="text-xs">
                          <span className="font-medium">Right Panel</span>
                          <span className="text-gray-500 ml-1">({totalRightPanels} total)</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 rounded-full text-blue-700 min-w-[2rem] text-center">
                        {requirements.rightPanels}x
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Connectors Section - more compact, no colors */}
            {(requirements.straightCouplings > 0 || requirements.cornerConnectors > 0) && (
              <div>
                <div className="text-xs font-medium text-gray-500 px-1 mb-0.5">Connectors:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {requirements.straightCouplings > 0 && (
                    <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">Straight Connector</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 rounded-full text-blue-700 min-w-[2rem] text-center">
                        {requirements.straightCouplings}x
                      </span>
                    </div>
                  )}
                  {requirements.cornerConnectors > 0 && (
                    <div className="bg-white rounded-md p-1.5 shadow-sm flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">Corner Connector</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 rounded-full text-blue-700 min-w-[2rem] text-center">
                        {requirements.cornerConnectors}x
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-4 text-center text-gray-500 text-sm">
            <p>No products needed yet</p>
            <p className="text-xs mt-1">Place food cubes on the grid</p>
          </div>
        )}
      </div>
      
      {/* Debug Info - only shown when explicitly enabled */}
      {showDebug && (
        <details className="mt-2 text-xs border-t border-gray-100 pt-1">
          <summary className="font-semibold cursor-pointer flex items-center text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Debug Info
          </summary>
          <div className="mt-1 bg-gray-50 p-1 rounded-md text-xs overflow-auto">
            <h4 className="font-bold mb-1 text-gray-700">Raw Requirements</h4>
            <pre className="mb-1 bg-white p-1 rounded border border-gray-200 overflow-auto max-h-[60px]">
              {JSON.stringify(requirements, null, 2)}
            </pre>
            
            <h4 className="font-bold mb-1 text-gray-700">Configuration Type</h4>
            <pre className="mb-1 bg-white p-1 rounded border border-gray-200">
              {configurationType}
            </pre>
            
            <h4 className="font-bold mb-1 text-gray-700">Total Panel Counts</h4>
            <pre className="bg-white p-1 rounded border border-gray-200 overflow-auto max-h-[60px]">
              {JSON.stringify({
                sidePanels: totalSidePanels,
                leftPanels: totalLeftPanels,
                rightPanels: totalRightPanels,
                straightCouplings: requirements.straightCouplings,
                cornerConnectors: requirements.cornerConnectors
              }, null, 2)}
            </pre>
            <div className="mt-1 text-xs text-gray-500">
              <p>4-Pack = 2 side + 1 left + 1 right | 2-Pack = 2 side</p>
            </div>
          </div>
        </details>
      )}
    </div>
  );
};
