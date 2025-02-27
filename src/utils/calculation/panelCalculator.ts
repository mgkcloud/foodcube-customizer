import { Requirements, CompassDirection } from '@/components/types';
import { PathCube } from './flowAnalyzer';
import { STRAIGHT_PATHS, VALID_TURNS } from '../core/irrigationRules';

/**
 * Calculate panel requirements based on flow path through cubes
 * This function applies consistent rules regardless of configuration:
 * 1. Each cube has 4 edges, some of which may be exposed
 * 2. Exposed edges need panels (side, left, or right)
 * 3. Panel type is determined by flow direction:
 *    - Entry point gets left panel
 *    - Exit point gets right panel
 *    - Other exposed edges get side panels
 * 4. Connectors are determined by flow between cubes:
 *    - Straight flow = straight coupling
 *    - 90-degree turn = corner connector
 */
export const calculateFlowPathPanels = (cubes: PathCube[]): Requirements => {
  console.log("Analyzing path:", cubes);
  
  if (!cubes || cubes.length === 0) {
    return {
      fourPackRegular: 0,
      fourPackExtraTall: 0,
      twoPackRegular: 0,
      twoPackExtraTall: 0,
      sidePanels: 0,
      leftPanels: 0,
      rightPanels: 0,
      straightCouplings: 0,
      cornerConnectors: 0
    };
  }

  // Count raw panel requirements
  let sidePanels = 0;
  let leftPanels = 0;
  let rightPanels = 0;
  let straightCouplings = 0;
  let cornerConnectors = 0;

  // Process each cube to determine panel types
  cubes.forEach((cube, index) => {
    const { entry, exit } = cube;
    
    // Determine exposed edges that need panels
    const exposedEdges = getExposedEdges(cube, cubes);
    
    // Count panel types based on flow direction
    exposedEdges.forEach(edge => {
      if (edge === entry) {
        leftPanels++;
      } else if (edge === exit) {
        rightPanels++;
      } else {
        sidePanels++;
      }
    });
    
    // Determine connector type if this isn't the last cube
    if (index < cubes.length - 1) {
      const nextCube = cubes[index + 1];
      const flowPath = `${exit}→${nextCube.entry}`;
      
      if (STRAIGHT_PATHS.has(flowPath)) {
        straightCouplings++;
      } else if (VALID_TURNS.has(flowPath)) {
        cornerConnectors++;
      }
    }
  });

  // Pack panels into standard packs
  const rawRequirements = {
    sidePanels,
    leftPanels,
    rightPanels,
    straightCouplings,
    cornerConnectors
  };
  
  console.log("Raw panel requirements:", rawRequirements);
  
  // Pack panels optimally
  return packPanels(rawRequirements);
};

/**
 * Determine which edges of a cube are exposed and need panels
 */
function getExposedEdges(cube: PathCube, allCubes: PathCube[]): CompassDirection[] {
  const { row, col } = cube;
  const exposedEdges: CompassDirection[] = [];
  
  // Check each direction
  const directions: CompassDirection[] = ['N', 'S', 'E', 'W'];
  
  directions.forEach(dir => {
    let adjacentRow = row;
    let adjacentCol = col;
    
    switch (dir) {
      case 'N': adjacentRow--; break;
      case 'S': adjacentRow++; break;
      case 'E': adjacentCol++; break;
      case 'W': adjacentCol--; break;
    }
    
    // If there's no adjacent cube in this direction, the edge is exposed
    const hasAdjacentCube = allCubes.some(c => 
      c.row === adjacentRow && c.col === adjacentCol
    );
    
    if (!hasAdjacentCube) {
      exposedEdges.push(dir);
    }
  });
  
  return exposedEdges;
}

/**
 * Pack panels according to flow-based rules.
 * This function takes raw panel counts and optimizes them into standard packs.
 */
function packPanels(requirements: { 
  sidePanels: number, 
  leftPanels: number, 
  rightPanels: number,
  straightCouplings: number,
  cornerConnectors: number 
}): Requirements {
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
}
