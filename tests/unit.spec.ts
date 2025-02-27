import { test, expect } from '@playwright/test';
import { countPanels } from '../src/utils/calculation/panelCounter';
import { packPanels } from '../src/utils/calculation/panelPacker';
import { validateIrrigationPath } from '../src/utils/validation/flowValidator';

// Mock the GridCell type
interface MockGridCell {
  hasCube: boolean;
  claddingEdges: Set<string>;
  connections: {
    entry: string | null;
    exit: string | null;
  };
}

test('Verify panel counting and packing for single cube', () => {
  // Create a mock grid with a single cube
  const grid = [
    [
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } },
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } },
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } }
    ],
    [
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } },
      { 
        hasCube: true, 
        claddingEdges: new Set(['N', 'E', 'S', 'W']), 
        connections: { entry: 'N', exit: 'S' } 
      },
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } }
    ],
    [
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } },
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } },
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } }
    ]
  ];

  // Count panels
  const panelRequirements = countPanels(grid);
  console.log('Raw panel requirements:', panelRequirements);

  // Pack panels
  const packedRequirements = packPanels(panelRequirements);
  console.log('Packed panel requirements:', packedRequirements);

  // Verify against known truth for single cube
  expect(packedRequirements.fourPackRegular).toBe(1);
  expect(packedRequirements.twoPackRegular).toBe(0);
  expect(packedRequirements.leftPanels).toBe(0);
  expect(packedRequirements.rightPanels).toBe(0);
  expect(packedRequirements.sidePanels).toBe(0);
});

test('Verify panel counting and packing for L-shaped configuration', () => {
  // Create a mock grid with an L-shaped configuration
  const grid = [
    [
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } },
      { 
        hasCube: true, 
        claddingEdges: new Set(['N', 'W']), 
        connections: { entry: 'N', exit: 'S' } 
      },
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } }
    ],
    [
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } },
      { 
        hasCube: true, 
        claddingEdges: new Set(['W']), 
        connections: { entry: 'N', exit: 'E' } 
      },
      { 
        hasCube: true, 
        claddingEdges: new Set(['N', 'E', 'S']), 
        connections: { entry: 'W', exit: 'S' } 
      }
    ],
    [
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } },
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } },
      { hasCube: false, claddingEdges: new Set(), connections: { entry: null, exit: null } }
    ]
  ];

  // Count panels
  const panelRequirements = countPanels(grid);
  console.log('Raw panel requirements for L-shape:', panelRequirements);

  // Pack panels
  const packedRequirements = packPanels(panelRequirements);
  console.log('Packed panel requirements for L-shape:', packedRequirements);

  // Verify against known truth for L-shaped configuration
  expect(packedRequirements.fourPackRegular).toBe(1);
  expect(packedRequirements.twoPackRegular).toBe(1);
  expect(packedRequirements.leftPanels).toBe(1);
  expect(packedRequirements.rightPanels).toBe(0);
  expect(packedRequirements.sidePanels).toBe(0);
  expect(packedRequirements.cornerConnectors).toBe(1);
  expect(packedRequirements.straightCouplings).toBe(1);
}); 