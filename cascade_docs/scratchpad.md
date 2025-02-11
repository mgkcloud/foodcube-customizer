# Current Task: Enhance Cladding and Coupling Calculator

## Requirements Analysis

### Panel Counting Rules
- Left/right panels are determined by irrigation flow path
- Flow path must be continuous (like a snake/rail-line)
- No T-junctions allowed
- Must match specified configurations:
  1. Single cube: 1 four-pack (2 side + 1 left + 1 right)
  2. Line of 3: 1 four-pack + 2 two-packs + 2 straight couplings
  3. L-shape: 1 four-pack + 2 two-packs + 1 corner + 1 straight
  4. U-shape: 1 four-pack + 2 two-packs + 2 corners + 2 straight

## Implementation Plan

[X] Core data model (types.ts)
[X] Basic connection validation
[ ] Update panel counting logic
  [ ] Modify getPanelType to use flow direction
  [ ] Ensure left/right panels follow flow path
[ ] Enhance path validation
  [ ] Implement snake-like path finding
  [ ] Strengthen T-junction prevention
[ ] Add test cases
  [ ] Single cube configuration
  [ ] Line of 3 configuration
  [ ] L-shape configuration
  [ ] U-shape configuration
[ ] Add visualization helpers for debugging

## Next Steps

1. Update panelCounter.ts to fix panel type determination
2. Add the test cases
3. Enhance path validation
4. Add visualization helpers
