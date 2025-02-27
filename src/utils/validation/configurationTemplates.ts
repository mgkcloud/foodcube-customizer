import { Requirements } from '@/components/types';
import { CONFIGURATION_RULES } from '../core/rules';

/**
 * Configuration templates based on PRD requirements
 */
export const ConfigurationTemplates = {
  SINGLE_CUBE: {
    edges: 4,
    panels: {
      fourPack: 1,
      twoPack: 0,
      side: 2,
      left: 1,
      right: 1
    },
    connectors: {
      straight: 0,
      corner: 0
    }
  },
  STRAIGHT_LINE: {
    edges: 8,
    panels: {
      fourPack: 1,
      twoPack: 2,
      side: 6,
      left: 1,
      right: 1
    },
    connectors: {
      straight: 2,
      corner: 0
    }
  },
  L_SHAPE: {
    edges: 8,
    panels: {
      fourPack: 1,
      twoPack: 2,
      side: 5,
      left: 2,
      right: 1
    },
    connectors: {
      straight: 1,
      corner: 1
    }
  },
  U_SHAPE: {
    edges: 12,
    panels: {
      fourPack: 1,
      twoPack: 2,
      side: 8,
      left: 2,
      right: 2
    },
    connectors: {
      straight: 2,
      corner: 2
    }
  }
};

/**
 * Detects the configuration type based on connectors and cubes
 */
export function detectConfigurationType(requirements: Requirements): 'SINGLE_CUBE' | 'STRAIGHT_LINE' | 'L_SHAPE' | 'U_SHAPE' | 'CUSTOM' {
  const { cornerConnectors, straightCouplings } = requirements;
  
  // Detect configuration based on connector combinations
  if (cornerConnectors === 0 && straightCouplings === 0) {
    return 'SINGLE_CUBE';
  } else if (cornerConnectors === 0 && straightCouplings === 2) {
    return 'STRAIGHT_LINE';
  } else if (cornerConnectors === 1 && straightCouplings === 1) {
    return 'L_SHAPE';
  } else if (cornerConnectors === 2 && straightCouplings === 2) {
    return 'U_SHAPE';
  }
  
  return 'CUSTOM';
}

/**
 * Validates if the requirements match the expected configuration
 */
export function validateAgainstTemplate(requirements: Requirements): { 
  isValid: boolean; 
  configurationType: string;
  discrepancies: string[] 
} {
  const configurationType = detectConfigurationType(requirements);
  const discrepancies: string[] = [];
  
  // For custom configurations, we don't have a template to validate against
  if (configurationType === 'CUSTOM') {
    return { 
      isValid: true, 
      configurationType, 
      discrepancies: ['Custom configuration - no template available']
    };
  }
  
  // Get the template for detected configuration
  const template = ConfigurationTemplates[configurationType];
  
  // Check four-pack count
  if (requirements.fourPackRegular !== template.panels.fourPack) {
    discrepancies.push(`Four-pack: expected ${template.panels.fourPack}, got ${requirements.fourPackRegular}`);
  }
  
  // Check two-pack count
  if (requirements.twoPackRegular !== template.panels.twoPack) {
    discrepancies.push(`Two-pack: expected ${template.panels.twoPack}, got ${requirements.twoPackRegular}`);
  }
  
  // Check connector counts
  if (requirements.straightCouplings !== template.connectors.straight) {
    discrepancies.push(`Straight couplings: expected ${template.connectors.straight}, got ${requirements.straightCouplings}`);
  }
  
  if (requirements.cornerConnectors !== template.connectors.corner) {
    discrepancies.push(`Corner connectors: expected ${template.connectors.corner}, got ${requirements.cornerConnectors}`);
  }
  
  // Calculate total panels
  const calculatedPanels = 
    requirements.sidePanels + 
    requirements.leftPanels + 
    requirements.rightPanels +
    (requirements.fourPackRegular * 4) +
    (requirements.twoPackRegular * 2);
  
  const expectedTotalPanels = template.edges;
  
  if (calculatedPanels !== expectedTotalPanels) {
    discrepancies.push(`Total panels: expected ${expectedTotalPanels}, got ${calculatedPanels}`);
  }
  
  return {
    isValid: discrepancies.length === 0,
    configurationType,
    discrepancies
  };
}

/**
 * Get the expected requirements for a configuration based on the PRD
 */
export function getExpectedRequirements(configurationType: string): Requirements | null {
  switch (configurationType) {
    case 'SINGLE_CUBE':
      return CONFIGURATION_RULES.SINGLE_CUBE;
    case 'STRAIGHT_LINE':
      return CONFIGURATION_RULES.THREE_LINE;
    case 'L_SHAPE':
      return CONFIGURATION_RULES.L_SHAPE;
    case 'U_SHAPE':
      return CONFIGURATION_RULES.U_SHAPE;
    default:
      return null;
  }
} 