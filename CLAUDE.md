# Cladding Cube Customizer - Developer Reference

## Build Commands
- `npm run dev` - Run development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Test Commands
- `npm run test` - Run all Jest tests
- `npm run test:components` - Run component tests only
- `npx jest path/to/test.test.tsx` - Run single Jest test
- `npm run test:e2e` - Run all Playwright E2E tests
- `npx playwright test path/to/test.spec.ts` - Run single E2E test

## Code Style
- TypeScript with React + Vite
- 2-space indentation
- PascalCase for components, camelCase for functions/variables
- Path aliases (import from `@/*` instead of relative paths)
- Use Shadcn UI components from `src/components/ui/`
- Prefer hooks for shared logic
- Organize related functionality in directories with `index.ts` exports

## Type Guidelines
- Define types in `types.ts` files
- Use TypeScript interfaces for component props
- Non-strict TypeScript (noImplicitAny: false, strictNullChecks: false)

## Error Handling
- Use validation functions that return booleans rather than throwing
- Log validation failures with actionable error messages
- Validate input configurations before calculations

## Testing Best Practices
- Place tests in `__tests__` directories
- Organize tests with describe/test blocks and descriptive names
- Test against ground truth configurations (reference test fixtures)
- Validate debug logs for flow and calculation correctness
- Use snapshot tests for UI components when appropriate