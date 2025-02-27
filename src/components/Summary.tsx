import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Requirements } from './types';
import { validateAgainstTemplate, detectConfigurationType } from '@/utils/validation/configurationTemplates';

interface SummaryProps {
  requirements: Requirements;

  variants?: Record<string, any>;
}

export const Summary: React.FC<SummaryProps> = ({ requirements, variants }) => {
  const [showValidation, setShowValidation] = useState(false);
  const validation = validateAgainstTemplate(requirements);
  const configurationType = detectConfigurationType(requirements);

  React.useEffect(() => {
    if (!variants) return;

    // Create separate objects for quantities and variant IDs
    const quantities = {
      fourPackRegular: requirements.fourPackRegular || 0,
      fourPackExtraTall: requirements.fourPackExtraTall || 0,
      twoPackRegular: requirements.twoPackRegular || 0,
      twoPackExtraTall: requirements.twoPackExtraTall || 0,
      leftPanels: requirements.leftPanels || 0,
      rightPanels: requirements.rightPanels || 0,
      sidePanels: requirements.sidePanels || 0,
      cornerConnectors: requirements.cornerConnectors || 0,
      straightCouplings: requirements.straightCouplings || 0
    };

    const variantIds: Record<string, string> = {
      fourPackRegular: '',
      fourPackExtraTall: '',
      twoPackRegular: '',
      twoPackExtraTall: '',
      leftPanels: '',
      rightPanels: '',
      sidePanels: '',
      cornerConnectors: '',
      straightCouplings: ''
    };

    // Map variant IDs from variants data
    if (variants['4_pack_cladding']?.variants) {
      const fourPackVariants = variants['4_pack_cladding'].variants;
      const regularVariant = fourPackVariants.find((v: any) => v.title?.toLowerCase().includes('regular'));
      const tallVariant = fourPackVariants.find((v: any) => v.title?.toLowerCase().includes('tall'));
      if (regularVariant?.id) variantIds.fourPackRegular = regularVariant.id;
      if (tallVariant?.id) variantIds.fourPackExtraTall = tallVariant.id;
    }

    if (variants['2_pack_cladding']?.variants) {
      const twoPackVariants = variants['2_pack_cladding'].variants;
      const regularVariant = twoPackVariants.find((v: any) => v.title?.toLowerCase().includes('regular'));
      const tallVariant = twoPackVariants.find((v: any) => v.title?.toLowerCase().includes('tall'));
      if (regularVariant?.id) variantIds.twoPackRegular = regularVariant.id;
      if (tallVariant?.id) variantIds.twoPackExtraTall = tallVariant.id;
    }

    if (variants['corner_connectors']?.variants?.[0]?.id) {
      variantIds.cornerConnectors = variants['corner_connectors'].variants[0].id;
    }

    if (variants['straight_couplings']?.variants?.[0]?.id) {
      variantIds.straightCouplings = variants['straight_couplings'].variants[0].id;
    }

    // Dispatch events with updated data
    window.dispatchEvent(new CustomEvent('selectionUpdate', {
      detail: quantities
    }));

    window.dispatchEvent(new CustomEvent('variantUpdate', {
      detail: variantIds
    }));
  }, [requirements, variants]);
  return (
    <div className="bg-white p-4 rounded-lg shadow" data-testid="requirements-summary">
      <h3 className="text-sm font-semibold mb-4">Required Packages</h3>
      
      <div className="space-y-2 mb-6" data-testid="requirements-list">
        {/* Always show four-pack if we have any panels */}
        {(requirements.fourPackRegular > 0 || requirements.sidePanels > 0 || requirements.leftPanels > 0 || requirements.rightPanels > 0) && (
          <div className="text-xs" data-testid="four-pack-regular">
            <span className="font-semibold">{requirements.fourPackRegular}x</span> 4-Pack Regular <span className="text-gray-500">2 side + 1 left + 1 right</span>
          </div>
        )}
        {/* Show two-packs if we have them */}
        {requirements.twoPackRegular > 0 && (
          <div className="text-xs" data-testid="two-pack-regular">
            <span className="font-semibold">{requirements.twoPackRegular}x</span> 2-Pack Regular <span className="text-gray-500">2 side panels</span>
          </div>
        )}
        
        <div className="border-t my-2 pt-2">
          <h4 className="text-xs font-semibold mb-1">Panel Types</h4>
          {/* Display individual panel counts */}
          <div className="text-xs flex items-center" data-testid="side-panels">
            <div className="w-3 h-3 bg-blue-600 mr-2"></div>
            Side Panel <span className="ml-auto">({requirements.sidePanels})</span>
          </div>
          <div className="text-xs flex items-center" data-testid="left-panels">
            <div className="w-3 h-3 bg-green-600 mr-2"></div>
            Left Panel <span className="ml-auto">({requirements.leftPanels})</span>
          </div>
          <div className="text-xs flex items-center" data-testid="right-panels">
            <div className="w-3 h-3 bg-purple-700 mr-2"></div>
            Right Panel <span className="ml-auto">({requirements.rightPanels})</span>
          </div>
        </div>
        
        <div className="border-t my-2 pt-2">
          <h4 className="text-xs font-semibold mb-1">Connectors</h4>
          {/* Always show connectors if present */}
          {requirements.cornerConnectors > 0 && (
            <div className="text-xs flex items-center" data-testid="corner-connectors">
              <div className="w-3 h-3 flex items-center justify-center mr-2">⌞</div>
              Corner Connector <span className="ml-auto">({requirements.cornerConnectors})</span>
            </div>
          )}
          {requirements.straightCouplings > 0 && (
            <div className="text-xs flex items-center" data-testid="straight-couplings">
              <div className="w-3 h-3 flex items-center justify-center mr-2">-</div>
              Straight Coupling <span className="ml-auto">({requirements.straightCouplings})</span>
            </div>
          )}
        </div>
        
        {/* Configuration validation section */}
        <div className="border-t mt-4 pt-2">
          <button 
            onClick={() => setShowValidation(!showValidation)}
            className="text-xs text-blue-600 flex items-center"
          >
            {showValidation ? '▾ Hide Validation' : '▸ Show Validation'}
          </button>
          
          {showValidation && (
            <div className="mt-2 text-xs">
              <div className="font-semibold mb-1">Configuration: {configurationType}</div>
              <div className={`px-2 py-1 rounded ${validation.isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {validation.isValid 
                  ? '✓ Matches PRD requirements' 
                  : '✗ Does not match PRD requirements'}
              </div>
              
              {!validation.isValid && (
                <div className="mt-2">
                  <div className="font-semibold">Discrepancies:</div>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    {validation.discrepancies.map((discrepancy, idx) => (
                      <li key={idx}>{discrepancy}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          * Hover over items for more details
          <br/>
          * Colors match the visual configuration
        </div>
      </div>
    </div>
  );
};
