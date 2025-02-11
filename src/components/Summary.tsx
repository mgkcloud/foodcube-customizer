import React from 'react';
import { Button } from '@/components/ui/button';
import { Requirements } from './types';

interface SummaryProps {
  requirements: Requirements;

  variants?: Record<string, any>;
}

export const Summary: React.FC<SummaryProps> = ({ requirements, variants }) => {
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
      <h3 className="text-sm font-semibold mb-4">Required Components</h3>
      
      <div className="space-y-2 mb-6" data-testid="requirements-list">
        {/* Always show four-pack if we have any panels */}
        {(requirements.fourPackRegular > 0 || requirements.sidePanels > 0 || requirements.leftPanels > 0 || requirements.rightPanels > 0) && (
          <div className="text-xs" data-testid="four-pack-regular">4 Pack Regular (2 side + 1 left + 1 right) x {requirements.fourPackRegular}</div>
        )}
        {/* Show two-packs if we have them */}
        {requirements.twoPackRegular > 0 && (
          <div className="text-xs" data-testid="two-pack-regular">2 Pack Regular (2 side panels) x {requirements.twoPackRegular}</div>
        )}
        {/* Show individual panels if any remain after packing */}
        {requirements.leftPanels > 0 && (
          <div className="text-xs" data-testid="left-panels">Left End Panels x {requirements.leftPanels}</div>
        )}
        {requirements.rightPanels > 0 && (
          <div className="text-xs" data-testid="right-panels">Right End Panels x {requirements.rightPanels}</div>
        )}
        {requirements.sidePanels > 0 && (
          <div className="text-xs" data-testid="side-panels">Side Panels x {requirements.sidePanels}</div>
        )}
        {/* Always show connectors if present */}
        {requirements.cornerConnectors > 0 && (
          <div className="text-xs" data-testid="corner-connectors">Corner Connectors x {requirements.cornerConnectors}</div>
        )}
        {requirements.straightCouplings > 0 && (
          <div className="text-xs" data-testid="straight-couplings">Straight Couplings x {requirements.straightCouplings}</div>
        )}
      </div>


    </div>
  );
};
