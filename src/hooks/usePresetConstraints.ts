import { useState, useRef, useCallback, useEffect } from 'react';
import { GridCell } from '@/components/types';
import {
  PresetConstraintState,
  ValidationResult,
  VALIDATION_TIMING,
  countFilledCells,
  cloneGrid,
  shouldSkipValidation,
  canToggleCubeInPreset,
  validatePresetConstraints
} from '@/utils/validation/presetConstraintsValidator';

interface UsePresetConstraintsProps {
  grid: GridCell[][];
  error: string | null;
}

interface UsePresetConstraintsResult {
  presetSelected: boolean;
  isApplyingPreset: boolean;
  originalPresetGrid: GridCell[][] | null;
  removedCubesCount: number;
  localError: string | null;
  showErrorOverlay: boolean;
  dismissErrorOverlay: () => void;
  updateLastInteraction: () => void;
  handlePresetApply: (preset: string, applyPresetFn: (preset: string) => void) => void;
  handleToggleCubeInPreset: (
    rowIndex: number, 
    colIndex: number, 
    toggleCellFn: (row: number, col: number) => void
  ) => boolean;
  resetPresetState: () => void;
}

/**
 * Custom hook to manage preset constraints and validation logic
 */
export function usePresetConstraints({
  grid,
  error
}: UsePresetConstraintsProps): UsePresetConstraintsResult {
  // State for preset management
  const [presetSelected, setPresetSelected] = useState(false);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);
  const [originalPresetGrid, setOriginalPresetGrid] = useState<GridCell[][] | null>(null);
  const [removedCubesCount, setRemovedCubesCount] = useState(0);
  
  // Error state - rename to make it clearer these are guidance messages
  const [localError, setLocalError] = useState<string | null>(null);
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  
  // Timing references
  const lastPresetTimestampRef = useRef<number>(0);
  const lastInteractionRef = useRef<number>(Date.now());
  const validationScheduledRef = useRef<NodeJS.Timeout | null>(null);
  const isStableRef = useRef<boolean>(true);
  
  // Timer refs to track and manage setTimeout calls
  const captureGridTimerRef = useRef<NodeJS.Timeout | null>(null);
  const completePresetTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Keep a ref to the latest grid for capturing in async operations
  const latestGridRef = useRef<GridCell[][]>(grid);
  
  // Update our grid reference whenever the prop changes
  useEffect(() => {
    latestGridRef.current = grid;
  }, [grid]);
  
  // Function to update the last interaction timestamp
  const updateLastInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    isStableRef.current = false;
    
    // Clear any pending validation
    if (validationScheduledRef.current) {
      clearTimeout(validationScheduledRef.current);
      validationScheduledRef.current = null;
    }
    
    // Schedule state to be considered stable after the interaction debounce time
    validationScheduledRef.current = setTimeout(() => {
      console.log("State considered stable - validation can proceed");
      isStableRef.current = true;
      validationScheduledRef.current = null;
    }, VALIDATION_TIMING.INTERACTION_DEBOUNCE_MS);
  }, []);
  
  // Function to dismiss the error overlay
  const dismissErrorOverlay = useCallback(() => {
    setShowErrorOverlay(false);
  }, []);
  
  // Add auto-dismiss functionality for error notifications
  useEffect(() => {
    if (showErrorOverlay && (localError || error)) {
      // Auto-dismiss after 3 seconds
      const autoDismissTimer = setTimeout(() => {
        setShowErrorOverlay(false);
      }, 3000);
      
      // Cleanup timer if component unmounts or if error changes
      return () => clearTimeout(autoDismissTimer);
    }
  }, [showErrorOverlay, localError, error]);
  
  // Reset preset state
  const resetPresetState = useCallback(() => {
    setPresetSelected(false);
    setIsApplyingPreset(false);
    setOriginalPresetGrid(null);
    setRemovedCubesCount(0);
    setLocalError(null);
    setShowErrorOverlay(false);
  }, []);
  
  // Validate the grid against preset constraints when the grid changes
  useEffect(() => {
    // Create state object for validation
    const state: PresetConstraintState = {
      presetSelected,
      originalPresetGrid,
      isApplyingPreset,
      lastPresetTimestamp: lastPresetTimestampRef.current,
      lastInteractionTimestamp: lastInteractionRef.current,
      isStable: isStableRef.current
    };
    
    // Skip validation if conditions aren't met
    if (shouldSkipValidation(state)) {
      return;
    }
    
    // Validate constraints
    const result = validatePresetConstraints(grid, originalPresetGrid);
    setRemovedCubesCount(result.removedCubesCount);
    
    if (!result.valid) {
      setLocalError(result.error);
      setShowErrorOverlay(true);
    } else {
      setLocalError(null);
      // Only hide the overlay if there's no other error
      if (!error) {
        setShowErrorOverlay(false);
      }
    }
  }, [grid, originalPresetGrid, presetSelected, isApplyingPreset, error]);
  
  // Show error overlay when an error is present, but only after state has settled
  useEffect(() => {
    // Don't show errors during or shortly after preset application
    const now = Date.now();
    const timeSinceLastPreset = now - lastPresetTimestampRef.current;
    const timeSinceLastInteraction = now - lastInteractionRef.current;
    
    // Only show errors if:
    // 1. We have an error to show
    // 2. We're not in the middle of applying a preset
    // 3. It's been at least the preset debounce time since the last preset was applied
    // 4. It's been at least the interaction debounce time since the last user interaction
    // 5. The state is considered stable (no pending updates)
    if ((localError || error) && 
        !isApplyingPreset && 
        timeSinceLastPreset > VALIDATION_TIMING.PRESET_DEBOUNCE_MS && 
        timeSinceLastInteraction > VALIDATION_TIMING.INTERACTION_DEBOUNCE_MS &&
        isStableRef.current) {
      
      // Only show preset constraint errors when they're important to the user
      // Don't show "You can only use the cubes that came with the preset" during normal preset use
      const currentError = localError || error;
      const isPresetAdditionError = currentError?.includes("cubes that came with the preset") || 
                                   currentError?.includes("original cubes");
      
      // Only show the error overlay if it's not a preset addition error during normal usage
      if (!isPresetAdditionError || presetSelected) {
        console.log("Showing guidance note - state has settled", { 
          message: currentError,
          timeSinceLastPreset,
          timeSinceLastInteraction
        });
        
        setShowErrorOverlay(true);
      } else {
        console.log("Suppressing preset guidance during normal usage:", currentError);
      }
    }
  }, [localError, error, isApplyingPreset, presetSelected]);
  
  // Reset error states when changing presets
  useEffect(() => {
    if (isApplyingPreset) {
      setLocalError(null);
      setShowErrorOverlay(false);
    }
  }, [isApplyingPreset]);
  
  // Handle preset application
  const handlePresetApply = useCallback((preset: string, applyPresetFn: (preset: string) => void) => {
    console.log(`Applying preset type: ${preset} at ${new Date().toISOString()}`);
    
    // Mark this as a user interaction
    updateLastInteraction();
    
    // Clear any existing errors and flags
    setLocalError(null);
    setShowErrorOverlay(false);
    
    // Cancel any pending timers to prevent race conditions
    if (captureGridTimerRef.current) {
      clearTimeout(captureGridTimerRef.current);
      captureGridTimerRef.current = null;
      console.log("Cancelled previous grid capture timer");
    }
    if (completePresetTimerRef.current) {
      clearTimeout(completePresetTimerRef.current);
      completePresetTimerRef.current = null;
      console.log("Cancelled previous completion timer");
    }
    
    // Reset any previous preset state
    setOriginalPresetGrid(null);
    setRemovedCubesCount(0);
    
    // Set flags to indicate we're applying a preset
    setIsApplyingPreset(true);
    lastPresetTimestampRef.current = Date.now();
    
    // Apply the preset first
    console.log(`About to call applyPresetFn for preset: ${preset}`);
    applyPresetFn(preset);
    console.log(`After applyPresetFn call for preset: ${preset}`);
    setPresetSelected(true);
    
    // Multi-stage preset application process to ensure state settles properly
    // Stage 1: Apply preset and wait for initial state updates
    console.log(`Starting multi-stage preset application process for ${preset} at ${new Date().toISOString()}`);
    captureGridTimerRef.current = setTimeout(() => {
      console.log(`Stage 1: Storing original preset grid for ${preset} at ${new Date().toISOString()}`);
      
      try {
        // Use the latest grid from the ref to ensure we have the most up-to-date state
        const currentGrid = latestGridRef.current;
        
        // Log the grid state before capturing
        console.log("Grid state before capture:");
        console.log(currentGrid.map(row => row.map(cell => cell.hasCube ? "■" : "□").join(" ")).join("\n"));
        
        // Store a copy of the original preset grid for future comparison
        const gridCopy = cloneGrid(currentGrid);
        
        // Log the captured grid state for debugging
        console.log(`Captured original preset grid for ${preset}:`);
        console.log(gridCopy.map(row => row.map(cell => cell.hasCube ? "■" : "□").join(" ")).join("\n"));
        
        // Store the grid state after preset application
        setOriginalPresetGrid(gridCopy);
        setRemovedCubesCount(0);
        
        const filledCount = countFilledCells(gridCopy);
        console.log(`Original preset grid captured with cube count: ${filledCount} for ${preset}`);
        console.log(`Grid captured at: ${new Date().toISOString()}`);
        
        // Extra debugging to check if this is a valid preset grid
        if (filledCount === 0) {
          console.error(`ERROR: Captured empty grid for ${preset}! This will cause constraints to fail.`);
        } else if (preset === 'line' && filledCount !== 3) {
          console.warn(`WARNING: Straight line preset should have 3 cubes, but captured ${filledCount}`);
        }
      } catch (err) {
        console.error(`Error during preset grid storage for ${preset}:`, err);
      }
      
      // Stage 2: After another delay, mark preset application as complete
      completePresetTimerRef.current = setTimeout(() => {
        setIsApplyingPreset(false);
        // Force state to be considered stable
        isStableRef.current = true;
        console.log(`Stage 2: Preset application for ${preset} fully complete, validation enabled at: ${new Date().toISOString()}`);
      }, VALIDATION_TIMING.PRESET_COMPLETION_DELAY_MS);
      
    }, VALIDATION_TIMING.GRID_CAPTURE_DELAY_MS);
  }, [updateLastInteraction]);
  
  // Handle toggling a cell in preset mode
  const handleToggleCubeInPreset = useCallback((
    rowIndex: number, 
    colIndex: number, 
    toggleCellFn: (row: number, col: number) => void
  ): boolean => {
    // Mark this as a user interaction
    updateLastInteraction();
    
    // Log more details about the action being attempted
    console.log(`Toggle cube at [${rowIndex}, ${colIndex}] requested. Current state: hasCube=${grid[rowIndex][colIndex]?.hasCube}, presetSelected=${presetSelected}, isApplyingPreset=${isApplyingPreset}`);
    console.log(`  Original preset grid exists: ${!!originalPresetGrid}, Grid dimensions: ${grid.length}x${grid[0].length}`);
    
    if (originalPresetGrid) {
      console.log(`  Original grid has cube at [${rowIndex}, ${colIndex}]: ${originalPresetGrid[rowIndex][colIndex]?.hasCube}`);
      console.log(`  Original preset grid cube count: ${countFilledCells(originalPresetGrid)}`);
    }
    
    // Don't validate during or just after preset application
    const now = Date.now();
    const timeSinceLastPreset = now - lastPresetTimestampRef.current;
    const isInPresetCooldown = isApplyingPreset || timeSinceLastPreset < VALIDATION_TIMING.PRESET_DEBOUNCE_MS;
    
    console.log(`  Time since last preset: ${timeSinceLastPreset}ms, PRESET_DEBOUNCE_MS: ${VALIDATION_TIMING.PRESET_DEBOUNCE_MS}ms`);
    console.log(`  In preset cooldown: ${isInPresetCooldown}, isApplyingPreset: ${isApplyingPreset}`);
    
    // If we're trying to add a cube in preset mode (even during cooldown),
    // we need to check if it was in the original preset
    if (presetSelected && originalPresetGrid && 
        !grid[rowIndex][colIndex].hasCube && 
        !originalPresetGrid[rowIndex][colIndex].hasCube) {
      console.log(`Blocking addition attempt - cube at [${rowIndex}, ${colIndex}] was not in original preset`);
      setLocalError("You can only use the cubes that came with the preset. Adding new cubes isn't allowed.");
      setShowErrorOverlay(true);
      return false;
    }
    
    // If we're in preset cooldown or not in preset mode, allow the toggle
    if (isInPresetCooldown || !presetSelected) {
      console.log(`Toggle allowed - ${isInPresetCooldown ? 'in preset cooldown' : 'not in preset mode'}`);
      toggleCellFn(rowIndex, colIndex);
      return true;
    }
    
    // Only apply constraints if we're in preset mode and outside the cooldown period
    if (presetSelected) {
      // Calculate how many cubes have been removed so far
      const originalCount = originalPresetGrid ? countFilledCells(originalPresetGrid) : 0;
      const currentCount = countFilledCells(grid);
      const removed = originalCount - currentCount;
      
      console.log(`Preset constraint check at [${rowIndex}, ${colIndex}], removed: ${removed}, original count: ${originalCount}, current count: ${currentCount}`);
      
      // Check if this toggle operation is allowed according to preset constraints
      const { allowed, error } = canToggleCubeInPreset(
        grid, 
        originalPresetGrid, 
        rowIndex, 
        colIndex, 
        removed
      );
      
      if (!allowed) {
        // For all constraint violations, show error and block the action
        const isAddingCubeError = error?.includes("Adding new cubes isn't allowed") || 
                                 error?.includes("original cubes");
        const isRemovingTooManyError = error?.includes("Only 2 cubes can be removed") || 
                                      error?.includes("remove up to 2");
        
        // For all errors, set the error message
        setLocalError(error);
        
        // Always show error overlay for constraint violations
        setShowErrorOverlay(true);
        
        if (isAddingCubeError) {
          console.log(`Blocking addition of cube outside preset: ${error}`);
        } else if (isRemovingTooManyError) {
          console.log(`Blocking removal beyond limit: ${error}`);
        } else {
          console.log(`Blocking operation due to constraint: ${error}`);
        }
        
        // Return false to prevent the action
        return false;
      }
    }
    
    // If we got here, the action is allowed
    console.log(`Toggle operation allowed at [${rowIndex}, ${colIndex}]`);
    toggleCellFn(rowIndex, colIndex);
    setLocalError(null);
    return true;
  }, [grid, originalPresetGrid, presetSelected, isApplyingPreset, updateLastInteraction]);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      // Clean up any pending timers
      if (validationScheduledRef.current) {
        clearTimeout(validationScheduledRef.current);
      }
      if (captureGridTimerRef.current) {
        clearTimeout(captureGridTimerRef.current);
      }
      if (completePresetTimerRef.current) {
        clearTimeout(completePresetTimerRef.current);
      }
    };
  }, []);
  
  return {
    presetSelected,
    isApplyingPreset,
    originalPresetGrid,
    removedCubesCount,
    localError,
    showErrorOverlay,
    dismissErrorOverlay,
    updateLastInteraction,
    handlePresetApply,
    handleToggleCubeInPreset,
    resetPresetState
  };
} 