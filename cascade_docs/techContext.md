# Technical Context

## Core Stack
1. Frontend Framework
   - React 18.2+
   - TypeScript 5.0+
   - Vite for development

2. UI Components
   - TailwindCSS for styling
   - Radix UI for accessibility
   - Custom components for grid and cladding

3. State Management
   - React hooks for local state
   - Custom hooks for grid management
   - Immutable updates for reliability

## Core Implementation

### Grid System
```typescript
// types.ts
export interface GridCell {
  hasCube: boolean;
  claddingEdges: Set<'top' | 'right' | 'bottom' | 'left'>;
}

// Preset System
const PRESETS = {
  straight: GridCell[][]; // Linear configuration
  L: GridCell[][]; // L-shaped configuration
  U: GridCell[][]; // U-shaped configuration
};
```

### State Management
```typescript
// useGridState.ts
const useGridState = () => {
  const [grid, setGrid] = useState<GridCell[][]>(initializeGrid);
  const [requirements, setRequirements] = useState<Requirements>(...);
  // State management and calculations
};
```

### Calculation Logic
```typescript
// calculationUtils.ts
export function calculateRequirements(grid: GridCell[][]): Requirements {
  // Calculate component requirements based on grid state
}

function calculateExposedSides(grid: GridCell[][], row: number, col: number): number {
  // Calculate exposed sides considering cladding and adjacency
}
```

## Development Setup
1. Environment
   ```bash
   node >= 18.0.0
   npm >= 9.0.0
   ```

2. Dependencies
   ```json
   {
     "react": "^18.2.0",
     "typescript": "^5.0.0",
     "tailwindcss": "^3.0.0",
     "@radix-ui/react-tooltip": "^1.0.0"
   }
   ```

3. Development Commands
   ```bash
   npm install     # Install dependencies
   npm run dev     # Start development server
   npm test       # Run test suite
   ```

## Constraints
1. Technical Requirements
   - Modern browser support (Chrome, Firefox, Safari)
   - Mobile-responsive design
   - Shopify integration compatibility

2. Performance Considerations
   - Efficient grid updates
   - Minimal re-renders
   - Optimized calculation logic

3. Code Organization
   - Component-based architecture
   - Clear separation of concerns
   - Type safety with TypeScript

4. Testing Requirements
   - Unit tests for calculation logic
   - Component testing with React Testing Library
   - Integration tests for key workflows
