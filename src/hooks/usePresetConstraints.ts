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
    console.log(`Applying preset type: ${preset}`);
    
    // Mark this as a user interaction
    updateLastInteraction();
    
    // Clear any existing errors and flags
    setLocalError(null);
    setShowErrorOverlay(false);
    
    // Reset any previous preset state
    setOriginalPresetGrid(null);
    setRemovedCubesCount(0);
    
    // Set flags to indicate we're applying a preset
    setIsApplyingPreset(true);
    lastPresetTimestampRef.current = Date.now();
    
    // Apply the preset
    applyPresetFn(preset);
    setPresetSelected(true);
    
    // Multi-stage preset application process to ensure state settles properly
    // Stage 1: Apply preset and wait for initial state updates
    console.log("Starting multi-stage preset application process");
    setTimeout(() => {
      console.log("Stage 1: Storing original preset grid for comparison");
      
      try {
        // Store a copy of the original preset grid for future comparison
        const gridCopy = cloneGrid(grid);
        setOriginalPresetGrid(gridCopy);
        setRemovedCubesCount(0);
        
        console.log("Original preset grid captured with cube count:", countFilledCells(gridCopy));
        console.log("Grid captured at:", new Date().toISOString());
      } catch (err) {
        console.error("Error during preset grid storage:", err);
      }
      
      // Stage 2: After another delay, mark preset application as complete
      setTimeout(() => {
        setIsApplyingPreset(false);
        // Force state to be considered stable
        isStableRef.current = true;
        console.log("Stage 2: Preset application fully complete, validation enabled at:", new Date().toISOString());
      }, VALIDATION_TIMING.PRESET_COMPLETION_DELAY_MS);
      
    }, VALIDATION_TIMING.GRID_CAPTURE_DELAY_MS);
  }, [grid, updateLastInteraction]);
  
  // Handle toggling a cell in preset mode
  const handleToggleCubeInPreset = useCallback((
    rowIndex: number, 
    colIndex: number, 
    toggleCellFn: (row: number, col: number) => void
  ): boolean => {
    // Mark this as a user interaction
    updateLastInteraction();
    
    // Don't validate during or just after preset application
    const now = Date.now();
    const timeSinceLastPreset = now - lastPresetTimestampRef.current;
    const isInPresetCooldown = isApplyingPreset || timeSinceLastPreset < VALIDATION_TIMING.PRESET_DEBOUNCE_MS;
    
    // If we're in preset cooldown or not in preset mode, allow the toggle
    if (isInPresetCooldown || !presetSelected) {
      toggleCellFn(rowIndex, colIndex);
      return true;
    }
    
    // Only apply suggestions if we're in preset mode and outside the cooldown period
    if (presetSelected) {
      // Calculate how many cubes have been removed so far
      const originalCount = originalPresetGrid ? countFilledCells(originalPresetGrid) : 0;
      const currentCount = countFilledCells(grid);
      const removed = originalCount - currentCount;
      
      console.log(`Toggle request at [${rowIndex}, ${colIndex}], removed: ${removed}`);
      
      // Check if this toggle operation is recommended
      const { allowed, error } = canToggleCubeInPreset(
        grid, 
        originalPresetGrid, 
        rowIndex, 
        colIndex, 
        removed
      );
      
      if (!allowed) {
        // Only block and show guidance for important issues
        const isAddingCubeError = error?.includes("Adding new cubes isn't allowed") || 
                                 error?.includes("original cubes");
        const isRemovingTooManyError = error?.includes("Only 2 cubes can be removed") || 
                                      error?.includes("remove up to 2");
        
        if (isRemovingTooManyError) {
          // Always provide guidance on the cube removal limit
          setLocalError(error);
          setShowErrorOverlay(true);
          console.log(`Toggle suggestion provided: ${error}`);
          return false;
        }
        
        if (isAddingCubeError) {
          // Just log the suggestion but don't necessarily block the action
          console.log(`Suggestion about adding cube outside preset: ${error}`);
          // We'll still set the message, but validation will decide whether to show it
          setLocalError(error);
          return false;
        }
        
        // For any other suggestions, provide guidance
        setLocalError(error);
        setShowErrorOverlay(true);
        return false;
      }
    }
    
    // If we got here, the action is allowed
    console.log(`Toggle operation allowed at [${rowIndex}, ${colIndex}]`);
    toggleCellFn(rowIndex, colIndex);
    setLocalError(null);
    return true;
  }, [grid, originalPresetGrid, presetSelected, isApplyingPreset, updateLastInteraction]);
  
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