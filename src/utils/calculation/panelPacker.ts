import { Requirements } from '@/components/types';

/**
 * Pack panels according to flow-based rules.
 * This function takes raw panel counts and optimizes them into standard packs
 * based on the following rules:
 * 
 * 1. Four-packs contain 2 side panels, 1 left panel, and 1 right panel
 * 2. Two-packs contain 2 side panels
 * 3. Prioritize using four-packs first, then two-packs
 * 4. Any remaining panels are kept as individual panels
 */
export const packPanels = (requirements: Requirements): Requirements => {
  console.log("Packing panels for raw requirements:", requirements);

  // Start with empty requirements
  const packedRequirements: Requirements = {
    fourPackRegular: 0,
    fourPackExtraTall: 0,
    twoPackRegular: 0,
    twoPackExtraTall: 0,
    leftPanels: 0,
    rightPanels: 0,
    sidePanels: 0,
    cornerConnectors: requirements.cornerConnectors,
    straightCouplings: requirements.straightCouplings
  };
  
  // Temporary counters for remaining panels
  let remainingSidePanels = requirements.sidePanels;
  let remainingLeftPanels = requirements.leftPanels;
  let remainingRightPanels = requirements.rightPanels;
  
  // Step 1: Always use four-packs first (combination of 2 side, 1 left, 1 right)
  // Calculate how many full four-packs we can create
  const maxFourPacks = Math.min(
    Math.floor(remainingSidePanels / 2),
    remainingLeftPanels,
    remainingRightPanels
  );
  
  packedRequirements.fourPackRegular = maxFourPacks;
  remainingSidePanels -= maxFourPacks * 2;
  remainingLeftPanels -= maxFourPacks;
  remainingRightPanels -= maxFourPacks;
  
  // Step 2: Pack remaining side panels into two-packs
  const maxTwoPacks = Math.ceil(remainingSidePanels / 2);
  packedRequirements.twoPackRegular = maxTwoPacks;
  remainingSidePanels -= maxTwoPacks * 2;
  
  // Step 3: Any remaining panels are kept as individual panels
  packedRequirements.sidePanels = Math.max(0, remainingSidePanels);
  packedRequirements.leftPanels = remainingLeftPanels;
  packedRequirements.rightPanels = remainingRightPanels;
  
  console.log("Packed panel requirements:", packedRequirements);
  return packedRequirements;
};

/**
 * Validate the panel packing against known configurations
 * This helps ensure our packing logic matches the expected outcomes
 */
export const validateConfiguration = (requirements: Requirements): boolean => {
  // Count total panels across all pack types
  const totalPanels = 
    requirements.sidePanels +
    requirements.leftPanels +
    requirements.rightPanels +
    (requirements.fourPackRegular * 4) +
    (requirements.twoPackRegular * 2);
  
  console.log("Validating configuration with total panels:", totalPanels);

  // Validate that we have the correct number of panels for the connectors
  const totalConnectors = requirements.cornerConnectors + requirements.straightCouplings;
  
  // For a valid configuration, the number of connectors should be one less than the number of cubes
  // Each cube has 4 edges, and each connection between cubes reduces the total exposed edges by 2
  const estimatedCubeCount = totalConnectors + 1;
  const expectedTotalPanels = estimatedCubeCount * 4 - (totalConnectors * 2);
  
  // Allow for some flexibility in the validation
  const isValidPanelCount = Math.abs(totalPanels - expectedTotalPanels) <= 2;
  
  if (!isValidPanelCount) {
    console.warn(`Panel count validation failed: Expected ~${expectedTotalPanels} panels, got ${totalPanels}`);
  }
  
  return isValidPanelCount;
};
