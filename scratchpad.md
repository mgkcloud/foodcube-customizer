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

## Current Task: Optimize Cladding Calculator

### Goals:
1. Fix syntax errors and performance issues
2. Ensure calculations match the rules exactly
3. Improve code organization and maintainability

### Progress:
[X] Create single source of truth for rules (irrigationRules.ts)
[X] Create validation utilities (validationUtils.ts)
[X] Create comprehensive test cases (irrigationValidator.test.ts)
[ ] Update panelCounter.ts to use new rules
[ ] Add performance optimizations
[ ] Add visual flow tracking

### Next Steps:
1. Fix the panelCounter.ts file to use the new rules
2. Add visual indicators for the flow path
3. Add performance monitoring
4. Run comprehensive tests