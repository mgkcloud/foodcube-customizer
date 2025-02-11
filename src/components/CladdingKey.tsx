import React from 'react';
import { PANEL_COLORS } from '@/constants/colors';

interface KeyItemProps {
  color?: string;
  label: string;
  count?: number;
  icon?: string;
  description?: string;
}

const KeyItem: React.FC<KeyItemProps> = ({ color, label, count, icon, description }) => (
  <div className="flex items-center gap-2 text-sm group relative">
    {color ? (
      <div 
        className="w-4 h-4 rounded-sm" 
        style={{ backgroundColor: color }}
      />
    ) : icon ? (
      <div className="w-4 h-4 flex items-center justify-center font-mono">{icon}</div>
    ) : null}
    <span className="text-gray-700">{label}</span>
    {count !== undefined && (
      <span className="text-gray-500">({count})</span>
    )}
    {description && (
      <div className="hidden group-hover:block absolute left-full ml-2 bg-gray-800 text-white text-xs p-2 rounded whitespace-nowrap z-10">
        {description}
      </div>
    )}
  </div>
);

interface PackageItemProps {
  label: string;
  count: number;
  description: string;
}

const PackageItem: React.FC<PackageItemProps> = ({ label, count, description }) => (
  <div className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
    <span className="text-gray-700">{label}</span>
    <span className="text-gray-500">{count}x</span>
    <span className="text-xs text-gray-400 ml-2">{description}</span>
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
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Required Packages</h3>
      <div className="space-y-1 mb-4">
        <PackageItem 
          label="4-Pack Regular" 
          count={requirements.fourPackRegular}
          description="2 side + 1 left + 1 right"
        />
        <PackageItem 
          label="2-Pack Regular" 
          count={requirements.twoPackRegular}
          description="2 side panels"
        />
      </div>

      <h3 className="text-lg font-semibold mb-3">Panel Types</h3>
      <div className="space-y-2 mb-4">
        <KeyItem 
          color={PANEL_COLORS.side} 
          label="Side Panel"
          count={requirements.sidePanels}
          description="Blue - Standard side panels"
        />
        <KeyItem 
          color={PANEL_COLORS.left} 
          label="Left Panel"
          count={requirements.leftPanels}
          description="Green - Left-facing panels"
        />
        <KeyItem 
          color={PANEL_COLORS.right} 
          label="Right Panel"
          count={requirements.rightPanels}
          description="Purple - Right-facing panels"
        />
      </div>
      
      <h3 className="text-lg font-semibold mb-3">Connectors</h3>
      <div className="space-y-2">
        <KeyItem 
          icon="⌟"
          label="Corner Connector"
          count={requirements.cornerConnectors}
          description="Connects panels at 90° angles"
        />
        <KeyItem 
          icon="━"
          label="Straight Coupling"
          count={requirements.straightCouplings}
          description="Connects panels in a straight line"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 space-y-1">
          <p>* Hover over items for more details</p>
          <p>* Colors match the visual configuration</p>
        </div>
      </div>
    </div>
  );
};
