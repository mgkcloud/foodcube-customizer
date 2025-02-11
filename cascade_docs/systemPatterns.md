# System Architecture

## Key Components
1. Core Components
   - FoodcubeConfigurator: Main application container
   - Grid: Interactive cube placement interface
   - CladdingVisualizer: Edge interaction management
   - Summary: Requirements display

2. State Management
   - useGridState: Custom hook for grid state
   - GridCell interface: Core data structure

3. Utility Modules
   - calculationUtils: Requirements calculation
   - types: Shared type definitions

## Component Architecture

### FoodcubeConfigurator (TSX)
- Manages application state and layout
- Integrates grid, cladding, and summary components
- Handles Shopify cart integration:
  ```tsx
  interface ConfiguratorProps {
    variants: ShopifyVariants;
    onUpdate: (selections: ProductSelections) => void;
  }
  ```

### Grid (TSX)
- Renders interactive 3x3 cube grid
- Manages cube placement and cladding interaction
- Integrates CladdingVisualizer for edge management
- Props:
  ```tsx
  interface GridProps {
    grid: GridCell[][];
    onToggleCell: (row: number, col: number) => void;
    onToggleCladding: (row: number, col: number, edge: EdgeType) => void;
  }
  ```

### CladdingVisualizer (TSX)
- Handles edge visualization and interaction
- Smart edge exposure detection
- Props:
  ```tsx
  interface CladdingVisualizerProps {
    cell: GridCell;
    onToggle: (edge: EdgeType) => void;
    isEdgeExposed: Record<EdgeType, boolean>;
  }
  ```

### CalculationUtils (TS)
- Calculates required components based on configuration
- Handles edge exposure and connection analysis
- Core functions:
  - calculateRequirements: Main calculation entry point
  - calculateExposedSides: Edge analysis
  - hasAdjacentCube: Adjacency detection

## Data Flow
1. User Interaction Flow
   - Grid click → toggleCell → state update → recalculate
   - Edge click → toggleCladding → state update → recalculate

2. State Management
   - useGridState manages grid configuration
   - Changes trigger requirement recalculation
   - Updates flow to Shopify cart

3. Calculation Pipeline
   - Grid state changes
   - Edge exposure calculation
   - Component requirements update
   - Summary display refresh

## Design Decisions
1. Component Isolation
   - CladdingVisualizer separated for reusability
   - Grid component handles layout and interaction
   - Calculation logic isolated in utilities

2. State Management
   - Custom hook for centralized state
   - Immutable updates for reliability
   - Event propagation control for clean interaction

3. Performance Optimization
   - Edge exposure pre-calculation
   - Efficient grid updates
   - Minimal re-renders
