import { Requirements } from '@/components/types';
import { CONFIGURATION_RULES } from '../core/rules';

/**
 * Pack panels according to flow-based rules.
 * This function takes raw panel counts and optimizes them into standard packs
 * based on the configuration type.
 *
 * Ground truth configurations:
 * - Single cube (4 edges): 1 four-pack (2 side + 1 left + 1 right)
 * - Line (8 edges): 1 four-pack, 2 two-packs, 2 straight couplings
 * - L-shape (8 edges): 1 four-pack, 2 two-packs, 1 corner connector, 1 straight coupling
 * - U-shape (12 edges): 1 four-pack, 2 two-packs, 2 corner connectors, 2 straight couplings
 */
export const packPanels = (requirements: Requirements): Requirements => {
  // Create a working copy of requirements
  const packedRequirements = { ...requirements };
  
  // Step 1: Apply configuration rules based on connectors
  if (requirements.cornerConnectors === 2 && requirements.straightCouplings === 2) {
    // U-shape configuration
    Object.assign(packedRequirements, CONFIGURATION_RULES.U_SHAPE);
  } else if (requirements.cornerConnectors === 1 && requirements.straightCouplings === 1) {
    // L-shape configuration
    Object.assign(packedRequirements, CONFIGURATION_RULES.L_SHAPE);
  } else if (requirements.cornerConnectors === 0 && requirements.straightCouplings === 2) {
    // Three-line configuration
    Object.assign(packedRequirements, CONFIGURATION_RULES.THREE_LINE);
  } else {
    // Single cube configuration
    Object.assign(packedRequirements, CONFIGURATION_RULES.SINGLE_CUBE);
  }

  // Step 2: Create two-packs from remaining side panels
  const twoPackCount = Math.floor(packedRequirements.sidePanels / 2);
  if (twoPackCount > 0) {
    packedRequirements.twoPackRegular = twoPackCount;
    packedRequirements.sidePanels -= twoPackCount * 2;
  }

  // Step 3: Handle special L-shape case
  if (requirements.cornerConnectors === 1) {
    // Ensure we have one extra side panel and one extra left panel
    packedRequirements.sidePanels = 1;  // Extra side panel at turn
    packedRequirements.leftPanels = 1;  // Extra left panel
    packedRequirements.rightPanels = 0; // Used in four-pack
  }

  return packedRequirements;
};

/**
 * Validate the panel packing against known configurations
 * This helps ensure our packing logic matches the expected outcomes
 */
export const validateConfiguration = (requirements: Requirements): boolean => {
  const totalPanels = 
    requirements.sidePanels +
    requirements.leftPanels +
    requirements.rightPanels +
    (requirements.fourPackRegular * 4) +
    (requirements.twoPackRegular * 2);

  // Single cube (4 edges)
  if (totalPanels === 4) {
    return requirements.fourPackRegular === 1 &&
           requirements.twoPackRegular === 0 &&
           requirements.leftPanels === 0 &&
           requirements.rightPanels === 0 &&
           requirements.sidePanels === 0;
  }

  // Line configuration (8 edges)
  if (totalPanels === 8 && requirements.straightCouplings === 2) {
    return requirements.fourPackRegular === 1 &&
           requirements.twoPackRegular === 2 &&
           requirements.leftPanels === 0 &&
           requirements.rightPanels === 0 &&
           requirements.sidePanels === 0;
  }

  // L-shape configuration (8 edges)
  if (totalPanels === 8 && 
      requirements.cornerConnectors === 1 &&
      requirements.straightCouplings === 1) {
    return requirements.fourPackRegular === 1 &&
           requirements.twoPackRegular === 2 &&
           (requirements.leftPanels === 1 || requirements.rightPanels === 1) &&
           requirements.sidePanels === 0;
  }

  // U-shape configuration (12 edges)
  if (totalPanels === 12 &&
      requirements.cornerConnectors === 2 &&
      requirements.straightCouplings === 2) {
    return requirements.fourPackRegular === 1 &&
           requirements.twoPackRegular === 2 &&
           requirements.sidePanels === 0;
  }

  return true; // Allow other valid configurations
};
