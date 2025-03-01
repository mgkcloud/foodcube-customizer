import { GridCell } from '@/components/types';

/**
 * Interface for preset constraint validation state
 */
export interface PresetConstraintState {
  presetSelected: boolean;
  originalPresetGrid: GridCell[][] | null;
  isApplyingPreset: boolean;
  lastPresetTimestamp: number;
  lastInteractionTimestamp: number;
  isStable: boolean;
}

/**
 * Interface for preset constraint validation result
 */
export interface ValidationResult {
  valid: boolean;
  error: string | null;
  removedCubesCount: number;
}

/**
 * Longer debounce times for certain configuration shapes
 * U-shapes tend to need more time to settle than L-shapes
 */
export const VALIDATION_TIMING = {
  // Time to wait after a preset is applied before validating
  PRESET_DEBOUNCE_MS: 800,
  // Time to wait after any user interaction before validating
  INTERACTION_DEBOUNCE_MS: 300,
  // Time to wait after applying a preset to capture the original grid
  GRID_CAPTURE_DELAY_MS: 300,
  // Time to wait after capturing the grid to mark preset application as complete
  PRESET_COMPLETION_DELAY_MS: 500,
};

/**
 * Count filled cells in a grid
 */
export const countFilledCells = (grid: GridCell[][]): number => {
  let count = 0;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col].hasCube) count++;
    }
  }
  return count;
};

/**
 * Deep clone grid for comparison
 */
export const cloneGrid = (grid: GridCell[][]): GridCell[][] => {
  return JSON.parse(JSON.stringify(grid));
};

/**
 * Returns friendly error messages for technical errors
 */
export function getUserFriendlyErrorMessage(error: string | null): string {
  if (!error) return '';
  
  // Map technical error messages to user-friendly messages
  const errorMap: Record<string, string> = {
    "Preset configurations cannot be modified with new cubes.": 
      "Please use only the preset cubes",
    
    "You can only use the cubes that came with the preset. Adding new cubes isn't allowed.":
      "Please use only the preset cubes",
    
    "Preset limit reached: Only 2 cubes can be removed from any preset.":
      "You can remove up to 2 preset cubes",
    
    "You've already removed 2 cubes from this preset, which is the maximum allowed.":
      "You can remove up to 2 preset cubes",
    
    "You can only remove cubes from the ends of the configuration.":
      "Remove only from the ends of the shape",
    
    "Invalid configuration. Cubes must form a continuous path.":
      "Cubes must connect in a continuous line",
    
    "All food cubes need to connect to each other in a continuous line.":
      "Cubes must connect in a continuous line",
    
    "No cubes detected. Please add at least one cube.":
      "Add at least one cube to start",
    
    "Please add at least one food cube to create a configuration.":
      "Add at least one cube to start"
  };

  // Look for the error message in our map
  for (const [technicalMsg, friendlyMsg] of Object.entries(errorMap)) {
    if (error.includes(technicalMsg)) {
      return friendlyMsg;
    }
  }
  
  // If we don't have a specific mapping, return the original error
  return error;
}

/**
 * Check if validation should be skipped based on timing and state
 */
export const shouldSkipValidation = (state: PresetConstraintState): boolean => {
  const now = Date.now();
  const timeSinceLastPreset = now - state.lastPresetTimestamp;
  const timeSinceLastInteraction = now - state.lastInteractionTimestamp;
  
  // Always skip if we're not in preset mode or don't have a reference grid
  if (!state.originalPresetGrid || !state.presetSelected) {
    console.log("Skipping validation - not in preset mode or no reference grid");
    return true;
  }
  
  // Skip validation in these cases:
  // 1. Currently applying a preset
  // 2. Less than debounce time since preset application
  // 3. Less than debounce time since last user interaction
  // 4. State is not considered stable yet
  const shouldSkip = state.isApplyingPreset || 
    timeSinceLastPreset < VALIDATION_TIMING.PRESET_DEBOUNCE_MS ||
    timeSinceLastInteraction < VALIDATION_TIMING.INTERACTION_DEBOUNCE_MS ||
    !state.isStable;
  
  if (shouldSkip) {
    console.log("Skipping validation - state not settled", {
      isApplyingPreset: state.isApplyingPreset,
      timeSinceLastPreset,
      timeSinceLastInteraction,
      isStable: state.isStable
    });
  } else {
    console.log("Running validation - state has settled");
  }
  
  return shouldSkip;
};

/**
 * Counts how many adjacent cubes a cell has in the grid
 */
const countAdjacentCubes = (grid: GridCell[][], row: number, col: number): number => {
  const directions = [
    [-1, 0], // North
    [0, 1],  // East
    [1, 0],  // South
    [0, -1]  // West
  ];
  
  let adjacentCount = 0;
  
  for (const [dx, dy] of directions) {
    const newRow = row + dx;
    const newCol = col + dy;
    
    // Check if the position is valid and has a cube
    if (
      newRow >= 0 && newRow < grid.length &&
      newCol >= 0 && newCol < grid[0].length &&
      grid[newRow][newCol].hasCube
    ) {
      adjacentCount++;
    }
  }
  
  return adjacentCount;
};

/**
 * Checks if a cube is at the end of a configuration (has at most one adjacent cube)
 */
const isEndPiece = (grid: GridCell[][], row: number, col: number): boolean => {
  return countAdjacentCubes(grid, row, col) <= 1;
};

/**
 * Checks if a preset configuration allows removing a cube or adding a cube back
 */
export const canToggleCubeInPreset = (
  grid: GridCell[][],
  originalPresetGrid: GridCell[][] | null,
  rowIndex: number,
  colIndex: number,
  removed: number
): { allowed: boolean; error: string | null } => {
  if (!originalPresetGrid) {
    return { allowed: true, error: null };
  }
  
  // Case 1: Adding a cube
  if (!grid[rowIndex][colIndex].hasCube) {
    // Check if this cube was part of the original preset
    if (originalPresetGrid[rowIndex][colIndex].hasCube) {
      // This is fine - we're adding back an original cube
      console.log(`Adding back original cube at [${rowIndex}, ${colIndex}]`);
      return { allowed: true, error: null };
    } else {
      // Not allowed - we don't allow adding new cubes that weren't in the original preset
      console.log(`Preventing addition of new cube at [${rowIndex}, ${colIndex}]`);
      return { 
        allowed: false, 
        error: "You can only use the cubes that came with the preset. Adding new cubes isn't allowed." 
      };
    }
  } 
  // Case 2: Removing a cube
  else if (grid[rowIndex][colIndex].hasCube) {
    // Check if we've already reached the removal limit
    if (removed >= 2) {
      // Not allowed - already reached the limit of removing 2 cubes
      console.log(`Preventing removal of cube at [${rowIndex}, ${colIndex}] - limit reached`);
      return { 
        allowed: false, 
        error: "Preset limit reached: Only 2 cubes can be removed from any preset." 
      };
    }
    
    // Check if the cube is an end piece (has at most one adjacent cube)
    if (!isEndPiece(grid, rowIndex, colIndex)) {
      console.log(`Preventing removal of non-end cube at [${rowIndex}, ${colIndex}]`);
      return {
        allowed: false,
        error: "You can only remove cubes from the ends of the configuration."
      };
    }
  }
  
  // Default - action is allowed
  return { allowed: true, error: null };
};

/**
 * Validates the current grid against the original preset constraints
 */
export const validatePresetConstraints = (
  grid: GridCell[][],
  originalPresetGrid: GridCell[][] | null
): ValidationResult => {
  if (!originalPresetGrid) {
    return { valid: true, error: null, removedCubesCount: 0 };
  }
  
  const originalCount = countFilledCells(originalPresetGrid);
  const currentCount = countFilledCells(grid);
  
  // Calculate how many cubes were removed
  const removed = originalCount - currentCount;
  
  console.log(`Validating grid: ${removed} cubes removed from preset`);
  
  // Check if more than 2 cubes were removed
  if (removed > 2) {
    return {
      valid: false,
      error: "Preset limit reached: Only 2 cubes can be removed from any preset.",
      removedCubesCount: removed
    };
  }
  
  // Check for any additions that weren't in the original preset
  let hasInvalidAdditions = false;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      // If a cube exists now but wasn't in the original preset, that's not allowed
      if (grid[row][col].hasCube && !originalPresetGrid[row][col].hasCube) {
        hasInvalidAdditions = true;
        console.log(`Invalid addition detected at [${row}, ${col}]`);
        break;
      }
    }
    if (hasInvalidAdditions) break;
  }
  
  if (hasInvalidAdditions) {
    return {
      valid: false,
      error: "You can only use the cubes that came with the preset. Adding new cubes isn't allowed.",
      removedCubesCount: removed
    };
  }
  
  // No constraints violated
  return { 
    valid: true, 
    error: null,
    removedCubesCount: removed
  };
}; 