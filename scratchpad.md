# Lessons

- For website image paths, always use the correct relative path (e.g., 'images/filename.png') and ensure the images directory exists
- For search results, ensure proper handling of different character encodings (UTF-8) for international queries
- Add debug information to stderr while keeping the main output clean in stdout for better pipeline integration
- When using seaborn styles in matplotlib, use 'seaborn-v0_8' instead of 'seaborn' as the style name due to recent seaborn version changes
- When using Jest, a test suite can fail even if all individual tests pass, typically due to issues in suite-level setup code or lifecycle hooks
- In cladding calculator, ensure panel counts match the configuration rules exactly:
  - Single cube: 1 four-pack (2 side + 1 left + 1 right)
  - Line of three: 1 four-pack + 2 two-packs + 2 straight couplings
  - L-shape: 1 four-pack + 1 extra left + 2 two-packs + 1 corner + 1 straight
  - U-shape: 1 four-pack + 2 two-packs + 2 corners + 2 straight

# Scratchpad

## Current Task: Prepare Cladding Calculator for Deployment

### Project Overview
The Cladding Cube Customizer is a tool that calculates and visualizes the required panels and couplings for food cube configurations. The tool analyzes irrigation flow paths to determine the correct panel types and quantities needed for valid cube arrangements.

### Key Issues to Address
1. Ensure flow path calculation is correct in all configurations
2. Fix U-shaped connector calculation
3. Validate panel count calculations against PRD rules
4. Fix front-end visualization
5. Ensure tests cover all edge cases
6. Optimize performance

### Step-by-Step Plan

#### 1. Fix Flow Path Calculation Issues
[X] Create single source of truth for rules (irrigationRules.ts)
[X] Create validation utilities (validationUtils.ts)
[X] Create comprehensive test cases (irrigationValidator.test.ts)
[ ] Fix the entry/exit direction issues in U-shaped configurations
[ ] Ensure left/right panel assignment is consistent with flow direction

#### 2. Verify Panel Calculation Logic
[ ] Validate calculation logic against the PRD requirements
[ ] Fix the panel counter for special configurations (L, U shapes)
[ ] Ensure consistency between visualization and calculation

#### 3. Front-End Testing & Validation
[ ] Test all preset configurations via UI
[ ] Verify calculations against PRD requirements
[ ] Check for visual anomalies in flow path display
[ ] Ensure coupling connectors are visualized correctly

#### 4. Performance Optimization
[ ] Profile app performance with larger grid configurations
[ ] Implement caching for expensive calculations
[ ] Optimize render cycles for React components
[ ] Add error boundaries for better error handling

#### 5. Final Deployment Preparation
[ ] Run comprehensive test suite
[ ] Fix any remaining bugs
[ ] Optimize bundle size
[ ] Update documentation
[ ] Create deployment pipeline

### Testing Against Ground Truths
We need to verify all calculations against these core rules:

1. **Single Cube (4 edges)**: 
   - 1 four-pack (2 side + 1 left + 1 right)

2. **Three Cubes in Line (8 edges)**: 
   - 1 four-pack (2 side + 1 left + 1 right)
   - 2 two-packs (4 side panels)
   - 2 straight couplings

3. **L-Shape (8 edges)**: 
   - 1 four-pack (2 side + 1 left + 1 right)
   - 1 two-pack (2 side panels)
   - 1 extra left panel
   - 1 corner connector
   - 1 straight coupling

4. **U-Shape (12 edges)**: 
   - 1 four-pack (2 side + 1 left + 1 right)
   - 2 two-packs (4 side panels)
   - 2 corner connectors
   - 2 straight couplings

### Flow Path Visualization
Confirm that the visualization properly shows:
- Entry/exit points are clear
- Flow direction is consistent
- Connection points visualized correctly
- Couplings shown at the right locations

### Test Refactoring Plan

The project needs test optimization and refactoring to ensure calculations match the established rules in the PRD. We've identified issues specifically with U-shaped configurations where the entry and exit points are incorrectly determined.

## Goals
- Create a single source of truth for irrigation rules and panel calculations
- Fix the U-shaped configuration path analysis
- Refactor tests to be more clear and maintainable
- Ensure all tests reference the same ground truths
- Make tests consistent with the panel counting requirements specified in the PRD

## Progress
[X] Created a new consolidated test utilities file (`testHelpers.ts`) that defines standard test configurations and expected results
[X] Created a new irrigation rules test (`irrigation.test.ts`) that verifies the core rules match the specifications
[X] Updated flow analyzer test to specifically test U-shape configurations
[X] Fixed type compatibility issues in test utility code
[ ] Update all test files to use the new test utilities for consistency
[ ] Update or refactor the flowAnalyzer.ts to fix the U-shaped configuration issue
[ ] Update the panel calculator to ensure results match the ground truths
[ ] Consolidate any redundant code and tests
[ ] Verify front-end calculations match the expected results

## Fixing Issues
1. Fixed type compatibility issues between `/src/utils/core/types.ts` and `/src/components/types.ts`
   - Updated `GridCell` in utility functions to include required properties: `id`, `row`, `col`, `type`
   - Ensured `PathCube` objects always have the required `subgrid` property
   
2. Addressing U-shape configuration issues:
   - Added test case with correct entry/exit points for U-shape
   - In a U-shaped configuration, we need exactly 5 cubes with 2 corner connectors
   - Each corner connector needs to handle a 90-degree turn in the flow

## Issues Identified
1. In the U-shaped configuration, the entry/exit points are incorrectly analyzed. The actual flow:
```
{ row: 1, col: 0, entry: 'N', exit: 'N' },
{ row: 0, col: 0, entry: 'W', exit: 'S' },
{ row: 0, col: 1, entry: null, exit: null },
{ row: 0, col: 2, entry: 'S', exit: 'E' },
{ row: 1, col: 2, entry: 'N', exit: 'N' }
```

The correct flow should be:
```
{ row: 1, col: 0, entry: 'N', exit: 'S' },
{ row: 0, col: 0, entry: 'N', exit: 'E' },
{ row: 0, col: 1, entry: 'W', exit: 'E' },
{ row: 0, col: 2, entry: 'W', exit: 'S' },
{ row: 1, col: 2, entry: 'N', exit: 'S' }
```

2. The entry and exit points of each foodcube should always form a straight line through the cube, and corner connectors are used at the turns.

## Next Steps
1. Complete the test refactoring to ensure all tests use the updated utility files
2. Fix the flow analyzer to correctly handle U-shaped configurations
3. Update panel calculation logic to match PRD requirements
4. Test the front-end visualization to ensure it displays correctly

## Lessons
- Using consistent test data is crucial for maintaining a single source of truth
- Complex configurations like U-shapes need specialized test cases
- The flow analyzer is the key component that determines panel calculation accuracy