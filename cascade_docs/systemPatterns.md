# System Architecture

## Key Components
1. Core Components
   - FoodcubeConfigurator: Main application container
   - Grid: Interactive cube placement interface with subgrid support
   - CladdingVisualizer: Edge interaction management
   - PipelineVisualizer: Irrigation flow visualization
   - Summary: Requirements display

2. State Management
   - useGridState: Custom hook for grid and subgrid state
   - GridCell interface: Core data structure, extended with subgrid information

3. Utility Modules
   - calculation/: Contains modules for flow analysis, panel counting, and packing
   - validation/: Includes validators for flow and configuration
   - core/: Defines fundamental rules and types
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
- Renders interactive 3x3 cube grid with 2x2 subgrids for each cell
- Manages cube placement and subgrid interaction
- Integrates `CladdingVisualizer` and `PipelineVisualizer` for enhanced visualization
- Props:
  ```tsx
  interface GridProps {
    grid: GridCell[][];
    onToggleCell: (row: number, col: number) => void;
    onToggleCladding: (row: number, col: number, edge: 'N' | 'E' | 'S' | 'W') => void;
  }
  ```

### CladdingVisualizer (TSX)
- Handles edge visualization and interaction
- Highlights subgrid for irrigation flow
- Props:
  ```tsx
  interface CladdingVisualizerProps {
    cell: GridCell;
    row: number;
    col: number;
    grid: GridCell[][];
    onToggle: (edge: EdgeType) => void;
    isEdgeExposed: Record<EdgeType, boolean>;
  }
  ```

### PipelineVisualizer (TSX)
- Visualizes irrigation flow within the subgrid
- Shows connections and flow direction
- Props:
    ```tsx
    interface PipelineVisualizerProps {
      cell: GridCell;
      row: number;
      col: number;
      grid: GridCell[][];
    }
    ```

### Calculation Layer
- `flowAnalyzer.ts`: Analyzes flow, including subgrid logic and rotation
- `requirementsCalculator.ts`: Calculates panel requirements based on analyzed flow

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
