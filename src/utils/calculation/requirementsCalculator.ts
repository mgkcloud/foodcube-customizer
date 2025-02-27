import { Requirements } from '@/components/types';
import { CONFIGURATION_RULES, getPanelType, getConnectorType, optimizePanelPacking } from '../core/rules';
import { PathCube, analyzePath } from './flowAnalyzer';
import { CompassDirection } from '../core/types';

/**
 * Calculates panel and connector requirements based on analyzed path
 */
export const calculateRequirements = (path: PathCube[]): Requirements => {
  // Handle empty path
  if (!path.length) {
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

  const analyzedPath = analyzePath(path);
  
  // Count panel types based on flow direction
  let sidePanels = 0;
  let leftPanels = 0;
  let rightPanels = 0;
  let straightCouplings = 0;
  let cornerLeftConnectors = 0;
  let cornerRightConnectors = 0;
  
  // Process each cube in the path
  analyzedPath.forEach((cube, index) => {
    // Count panel types for each exposed edge
    const exposedEdges = getExposedEdges(analyzedPath, index);
    
    exposedEdges.forEach(edge => {
      const panelType = getPanelType(edge, cube.entry, cube.exit);
      
      switch (panelType) {
        case 'side':
          sidePanels++;
          break;
        case 'left':
          leftPanels++;
          break;
        case 'right':
          rightPanels++;
          break;
      }
    });
    
    // Count connector types between cubes
    if (index < analyzedPath.length - 1 && cube.exit && analyzedPath[index + 1].entry) {
      const connectorType = getConnectorType(cube.exit, analyzedPath[index + 1].entry);
      
      if (connectorType === 'straight') {
        straightCouplings++;
      } else if (connectorType === 'corner-left') {
        cornerLeftConnectors++;
      } else if (connectorType === 'corner-right') {
        cornerRightConnectors++;
      }
    }
  });
  
  // Optimize panel packing
  const packedPanels = optimizePanelPacking(sidePanels, leftPanels, rightPanels);
  
  // Return final requirements
  return {
    ...packedPanels,
    fourPackExtraTall: 0,
    twoPackExtraTall: 0,
    straightCouplings,
    cornerConnectors: cornerLeftConnectors + cornerRightConnectors
  };
};

/**
 * Determines which edges of a cube are exposed and need panels
 */
function getExposedEdges(path: PathCube[], cubeIndex: number): CompassDirection[] {
  const cube = path[cubeIndex];
  const allDirections: CompassDirection[] = ['N', 'S', 'E', 'W'];
  
  // Start with all directions
  const exposedEdges = new Set<CompassDirection>(allDirections);
  
  // Remove entry and exit directions (these connect to other cubes)
  if (cube.entry) exposedEdges.delete(cube.entry);
  if (cube.exit) exposedEdges.delete(cube.exit);
  
  return Array.from(exposedEdges);
}
