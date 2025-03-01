import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HelpTooltip } from './HelpTooltip';
import { Grid } from './Grid';
import { PresetConfigs } from './PresetConfigs';
import { Summary } from './Summary';
import { CladdingKey } from './CladdingKey';
import useGridState from '@/hooks/useGridState';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { debugConfiguration } from '@/utils/validation/configDebugger';
import { createPortal } from 'react-dom';
import { GridCell } from './types';

// Floating Action Button component that will be rendered in a portal
const FloatingActionButtons = ({ 
  requirementsSum,
  onApply, 
  onClear 
}: { 
  requirementsSum: number,
  onApply: () => void, 
  onClear: () => void 
}) => {
  return createPortal(
    <div className="lg:hidden fixed z-[9999] bottom-6 right-6 flex flex-col items-end gap-4" style={{ position: 'fixed', pointerEvents: 'auto' }}>
      {/* Apply button */}
      <button
        onClick={onApply}
        className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white font-bold shadow-2xl border-2 border-white hover:bg-blue-700 transition-all transform hover:scale-105"
        data-testid="mobile-apply-button"
        aria-label="Apply configuration"
      >
        <div className="flex flex-col items-center justify-center leading-none">
          <span className="text-xs font-normal">Apply</span>
          <span className="text-base font-bold">{requirementsSum}</span>
          <span className="text-[8px] mt-0.5">packs</span>
        </div>
      </button>
      
      {/* Clear button */}
      <button
        onClick={onClear}
        className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-2xl border-2 border-gray-200 text-gray-500 hover:text-red-500 transition-all transform hover:scale-105"
        data-testid="mobile-clear-button"
        aria-label="Clear configuration"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18"></path>
          <path d="M6 6l12 12"></path>
        </svg>
      </button>
    </div>,
    document.body
  );
};

// Error Overlay component for grid
const ErrorOverlay = ({ 
  message, 
  isVisible,
  onDismiss
}: { 
  message: string | null;
  isVisible: boolean;
  onDismiss: () => void;
}) => {
  if (!message || !isVisible) return null;
  
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 backdrop-blur-sm rounded-xl"
    >
      <div 
        className="bg-white m-4 p-4 rounded-xl shadow-lg border border-gray-200 max-w-md"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-2">Can't do that</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

interface FoodcubeConfiguratorProps {
  variants: Record<string, any>;
  onUpdate: (selections: Record<string, number>) => void;
  onApply?: (selections: Record<string, number>) => void;
  onClose?: () => void;
}

export const FoodcubeConfigurator: React.FC<FoodcubeConfiguratorProps> = ({ variants, onUpdate, onApply, onClose }) => {
  console.log('FoodcubeConfigurator received variants:', variants);
  const { grid, requirements, toggleCell, toggleCladding, applyPreset, error, clearGrid } = useGridState();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [debugMode, setDebugMode] = useState(false); // Default to false for production
  const [presetSelected, setPresetSelected] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false); // State to track preset application
  const lastPresetTimestampRef = useRef<number>(0); // Ref to track when preset was last applied
  
  // Track the original preset configuration and removed cube count
  const [originalPresetGrid, setOriginalPresetGrid] = useState<GridCell[][] | null>(null);
  const [removedCubesCount, setRemovedCubesCount] = useState(0);
  
  // Add a new ref to track when the last user interaction happened
  const lastInteractionRef = useRef<number>(Date.now());
  // Add a ref to track if validation is scheduled
  const validationScheduledRef = useRef<NodeJS.Timeout | null>(null);
  // Add a ref to track if we're in a stable state (no pending updates)
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
    
    // Schedule state to be considered stable after 500ms of no interactions
    validationScheduledRef.current = setTimeout(() => {
      console.log("State considered stable - validation can proceed");
      isStableRef.current = true;
      validationScheduledRef.current = null;
    }, 500);
  }, []);

  // Show error overlay when an error is present, but only after state has settled
  useEffect(() => {
    // Don't show errors during or shortly after preset application
    const now = Date.now();
    const timeSinceLastPreset = now - lastPresetTimestampRef.current;
    const timeSinceLastInteraction = now - lastInteractionRef.current;
    
    // Only show errors if:
    // 1. We have an error to show
    // 2. We're not in the middle of applying a preset
    // 3. It's been at least 500ms since the last preset was applied
    // 4. It's been at least 300ms since the last user interaction
    // 5. The state is considered stable (no pending updates)
    if ((localError || error) && 
        !isApplyingPreset && 
        timeSinceLastPreset > 500 && 
        timeSinceLastInteraction > 300 &&
        isStableRef.current) {
      
      console.log("Showing error overlay - state has settled", { 
        error: error || localError,
        timeSinceLastPreset,
        timeSinceLastInteraction
      });
      
      setShowErrorOverlay(true);
    }
  }, [localError, error, isApplyingPreset]);

  // Reset error states when changing presets
  useEffect(() => {
    if (isApplyingPreset) {
      setLocalError(null);
      setShowErrorOverlay(false);
    }
  }, [isApplyingPreset]);

  // Function to dismiss the error overlay
  const dismissErrorOverlay = () => {
    setShowErrorOverlay(false);
  };

  // Make error messages more user-friendly
  const getUserFriendlyErrorMessage = (errorMessage: string | null): string | null => {
    if (!errorMessage) return null;
    
    // Map technical error messages to more user-friendly ones
    const errorMap: Record<string, string> = {
      "Preset configurations cannot be modified with new cubes.": 
        "You can only use the cubes that came with the preset. Adding new cubes isn't allowed.",
      
      "Preset limit reached: Only 2 cubes can be removed from any preset.": 
        "You've already removed 2 cubes from this preset, which is the maximum allowed.",
      
      "Invalid configuration. Cubes must form a continuous path.": 
        "All food cubes need to connect to each other in a continuous line.",
      
      "No cubes detected. Please add at least one cube.": 
        "Please add at least one food cube to create a configuration."
    };
    
    return errorMap[errorMessage] || errorMessage;
  };

  // Debug the current configuration when in debug mode
  useEffect(() => {
    if (debugMode) {
      console.log("===== DEBUG MODE ENABLED =====");
      console.log("Current Requirements:", requirements);
      debugConfiguration(grid, requirements);
    }
  }, [grid, requirements, debugMode]);

  // Count filled cells in a grid
  const countFilledCells = (grid: GridCell[][]) => {
    let count = 0;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col].hasCube) count++;
      }
    }
    return count;
  };

  // Deep clone grid for comparison
  const cloneGrid = (grid: GridCell[][]) => {
    return JSON.parse(JSON.stringify(grid));
  };

  // Track changes after preset is applied - improve to wait for stable state
  useEffect(() => {
    // Skip validation in these cases:
    // 1. No original preset grid to compare against
    // 2. Not in preset mode
    // 3. Currently applying a preset
    // 4. Less than 500ms since preset application (debounce period)
    // 5. Less than 300ms since last user interaction
    // 6. State is not considered stable yet
    const now = Date.now();
    const timeSinceLastPreset = now - lastPresetTimestampRef.current;
    const timeSinceLastInteraction = now - lastInteractionRef.current;
    
    if (!originalPresetGrid || 
        !presetSelected || 
        isApplyingPreset || 
        timeSinceLastPreset < 500 ||
        timeSinceLastInteraction < 300 ||
        !isStableRef.current) {
      
      console.log("Skipping validation - state not settled", {
        hasOriginalGrid: !!originalPresetGrid,
        presetSelected,
        isApplyingPreset,
        timeSinceLastPreset,
        timeSinceLastInteraction,
        isStable: isStableRef.current
      });
      return;
    }
    
    console.log("Running validation - state has settled");
    
    const originalCount = countFilledCells(originalPresetGrid);
    const currentCount = countFilledCells(grid);
    
    // Calculate how many cubes were removed
    const removed = originalCount - currentCount;
    setRemovedCubesCount(removed);
    
    console.log(`Validating grid: ${removed} cubes removed from preset`);
    
    // Check if more than 2 cubes were removed
    if (removed > 2) {
      setLocalError("Preset limit reached: Only 2 cubes can be removed from any preset.");
      setShowErrorOverlay(true);
    } else {
      setLocalError(null);
      
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
        setLocalError("Preset configurations cannot be modified with new cubes.");
        setShowErrorOverlay(true);
      } else {
        // Only explicitly hide the overlay if there's no other error
        if (!error) {
          setShowErrorOverlay(false);
        }
      }
    }
  }, [grid, originalPresetGrid, presetSelected, isApplyingPreset, error]);

  // Update the parent component with the current requirements
  React.useEffect(() => {
    console.log("Calling onUpdate with requirements:", JSON.stringify(requirements, null, 2));
    const selections = {
      fourPackRegular: requirements.fourPackRegular,
      fourPackExtraTall: requirements.fourPackExtraTall,
      twoPackRegular: requirements.twoPackRegular,
      twoPackExtraTall: requirements.twoPackExtraTall,
      leftPanels: requirements.leftPanels,
      rightPanels: requirements.rightPanels,
      sidePanels: requirements.sidePanels,
      cornerConnectors: requirements.cornerConnectors,
      straightCouplings: requirements.straightCouplings
    };

    // Log the actual values for debugging
    console.log("Selections for CladdingKey:", JSON.stringify(selections, null, 2));

    // Add a data attribute to the document body with the current requirements for testing
    document.body.setAttribute('data-requirements', JSON.stringify(selections));

    onUpdate(selections);
  }, [requirements, onUpdate]);

  // Handle toggling a cell in the grid with improved debounce protection
  const handleToggleCell = useCallback((rowIndex: number, colIndex: number) => {
    // Mark this as a user interaction
    updateLastInteraction();
    
    // Don't validate during or just after preset application
    const now = Date.now();
    const timeSinceLastPreset = now - lastPresetTimestampRef.current;
    const isInPresetCooldown = isApplyingPreset || timeSinceLastPreset < 500;
    
    if (presetSelected && !isInPresetCooldown) {
      // If a preset is selected, verify whether the action is allowed
      const originalCount = countFilledCells(originalPresetGrid!);
      const currentCount = countFilledCells(grid);
      const removed = originalCount - currentCount;
      
      // Case 1: Adding a cube
      if (!grid[rowIndex][colIndex].hasCube) {
        // Allow adding ONLY if it was part of the original preset (adding back a removed cube)
        if (originalPresetGrid![rowIndex][colIndex].hasCube) {
          // This is fine - we're adding back an original cube
          console.log(`Adding back original cube at [${rowIndex}, ${colIndex}]`);
        } else {
          // Not allowed - trying to add a cube that wasn't in the original preset
          console.log(`Preventing addition of new cube at [${rowIndex}, ${colIndex}]`);
          setLocalError("Preset configurations cannot be modified with new cubes.");
          // Don't show error overlay immediately - let the state settle first
          return;
        }
      } 
      // Case 2: Removing a cube
      else if (grid[rowIndex][colIndex].hasCube && removed >= 2) {
        // Not allowed - already reached the limit of removing 2 cubes
        console.log(`Preventing removal of cube at [${rowIndex}, ${colIndex}] - limit reached`);
        setLocalError("Preset limit reached: Only 2 cubes can be removed from any preset.");
        // Don't show error overlay immediately - let the state settle first
        return;
      }
    }
    
    toggleCell(rowIndex, colIndex);
    setLocalError(null);
    // Don't hide the error overlay immediately - wait for state to settle
  }, [grid, originalPresetGrid, presetSelected, toggleCell, error, isApplyingPreset, updateLastInteraction]);

  // Enhanced preset application function with better state management
  const handlePresetApply = (preset: string) => {
    console.log(`Applying preset type: ${preset}`);
    
    // Mark this as a user interaction
    updateLastInteraction();
    
    // Clear any existing errors and flags
    setLocalError(null);
    setShowErrorOverlay(false);
    setIsApplyingPreset(true); // Set flag to indicate we're applying a preset
    lastPresetTimestampRef.current = Date.now(); // Record timestamp of preset application
    
    // Apply the preset
    applyPreset(preset);
    setHasInteracted(true);
    setPresetSelected(true);
    
    // Multi-stage preset application process to ensure state settles properly
    // Stage 1: Apply preset and wait for initial state updates (200ms)
    setTimeout(() => {
      console.log("Stage 1: Storing original preset grid for comparison");
      
      try {
        // Store a copy of the original preset grid for future comparison
        const gridCopy = cloneGrid(grid);
        setOriginalPresetGrid(gridCopy);
        setRemovedCubesCount(0);
        
        console.log("Original cube count:", countFilledCells(gridCopy));
      } catch (err) {
        console.error("Error during preset grid storage:", err);
      }
      
      // Stage 2: After another delay, mark preset application as complete (300ms more)
      setTimeout(() => {
        setIsApplyingPreset(false);
        console.log("Stage 2: Preset application fully complete, validation enabled");
      }, 300);
      
    }, 200);
    
    // Debug the configuration after applying preset
    if (debugMode) {
      console.group(`Applied Preset: ${preset}`);
      console.log(`Preset applied: ${preset}`);
      setTimeout(() => {
        debugConfiguration(grid, requirements);
        // Log for Playwright tests
        console.log("TEST_INFO: Preset applied and requirements calculated");
      }, 500); // Adjusted to run after the full process is complete
      console.groupEnd();
    }
  };

  // Function to handle starting manual configuration
  const handleStartManualConfig = () => {
    // Mark this as a user interaction
    updateLastInteraction();
    
    setHasInteracted(true);
    // Place a cube in the center (1,1) to get started
    toggleCell(1, 1);
  };

  // Function to handle applying configuration
  const handleApplyConfiguration = () => {
    // Mark this as a user interaction
    updateLastInteraction();
    
    console.log("Applying configuration to data layer");
    const selections = {
      fourPackRegular: requirements.fourPackRegular,
      fourPackExtraTall: requirements.fourPackExtraTall,
      twoPackRegular: requirements.twoPackRegular,
      twoPackExtraTall: requirements.twoPackExtraTall,
      leftPanels: requirements.leftPanels,
      rightPanels: requirements.rightPanels,
      sidePanels: requirements.sidePanels,
      cornerConnectors: requirements.cornerConnectors,
      straightCouplings: requirements.straightCouplings
    };
    
    // If onApply callback is provided, call it
    if (onApply) {
      onApply(selections);
    }
    
    // If onClose callback is provided, call it to close the modal
    if (onClose) {
      onClose();
    }
  };

  // Function to handle clearing the grid
  const handleClearGrid = () => {
    // Mark this as a user interaction
    updateLastInteraction();
    
    console.log("Clearing grid configuration");
    setLocalError(null);
    setShowErrorOverlay(false);
    clearGrid();
    // Reset state
    setHasInteracted(false);
    setPresetSelected(false);
    setOriginalPresetGrid(null);
    setRemovedCubesCount(0);
  };

  // Calculate total packs for the floating action button
  const totalPacks = requirements.fourPackRegular + requirements.twoPackRegular;

  // Determine which error message to display
  const displayError = localError || error;
  const friendlyErrorMessage = getUserFriendlyErrorMessage(displayError);

  return (
    <div className="relative w-full max-w-5xl mx-auto bg-transparent rounded-xl overflow-hidden backdrop-blur-sm" data-testid="foodcube-configurator">
      {/* Debug toggle - only visible when debug is enabled */}
      <div className="absolute top-4 right-4 z-50">
        {debugMode && (
          <div className="flex items-center space-x-2 bg-white/90 p-1 rounded-full shadow-sm border border-gray-100">
            <Switch
              id="debug-mode"
              checked={debugMode}
              onCheckedChange={(checked) => {
                setDebugMode(checked);
                console.log(`Debug mode ${checked ? 'enabled' : 'disabled'}`);
              }}
              data-testid="debug-toggle"
            />
            <Label htmlFor="debug-mode" className="text-xs mr-1" data-testid="debug-label">Debug</Label>
          </div>
        )}
      </div>
      
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-4 sm:mb-6" data-testid="configurator-title">
            Cladding Configurator
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Grid takes up more space */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 relative" data-testid="grid-wrapper">
              {/* Error message overlay */}
              <ErrorOverlay 
                message={friendlyErrorMessage} 
                isVisible={showErrorOverlay && !!displayError}
                onDismiss={dismissErrorOverlay}
              />
              
              {/* Overlay for preset selection - positioned directly over the grid */}
              {!hasInteracted && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 rounded-xl" data-testid="config-overlay">
                  {/* Semi-transparent animated background */}
                  <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm animate-pulse rounded-xl"></div>
                  
                  {/* Content card with full opacity */}
                  <div className="relative bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 max-w-md w-full mx-auto text-center transition-transform hover:scale-[1.01] duration-200 z-10">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Select a Configuration</h3>
                    <div className="mb-4 sm:mb-6">
                      <PresetConfigs onApply={handlePresetApply} />
                    </div>
                    
                    <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-3">Manual Configuration</h4>
                      <button 
                        onClick={handleStartManualConfig}
                        className="w-full flex items-center justify-center gap-2 bg-white px-4 py-2 sm:py-3 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-all hover:shadow-md"
                        data-testid="manual-config-button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="8" y1="12" x2="16" y2="12"></line>
                          <line x1="12" y1="8" x2="12" y2="16"></line>
                        </svg>
                        <span className="font-medium">Tap to place foodcubes one by one</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <Grid 
                grid={grid} 
                onToggleCell={(row, col) => {
                  console.log(`Toggling cell at [${row}, ${col}]`);
                  handleToggleCell(row, col);
                }}
                onToggleCladding={(row, col, edge) => {
                  console.log(`Toggling cladding at [${row}, ${col}], edge: ${edge}`);
                  updateLastInteraction(); // Mark cladding toggle as an interaction
                  toggleCladding(row, col, edge);
                }}
                setHasInteracted={setHasInteracted}
                debug={debugMode}
              />
            </div>
            
            {/* Requirements panel */}
            <div className="lg:col-span-2 space-y-3" data-testid="requirements-panel">
              {/* Cladding Key */}
              <div className="transition-all duration-300 ease-in-out">
                <CladdingKey requirements={requirements} showDebug={debugMode} />
              </div>
              
              {/* Preset configurations - moved here */}
              {hasInteracted && (
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100" data-testid="side-presets">
                  <div className="mb-1">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center" data-testid="presets-heading">
                      <span className="bg-gray-100 w-5 h-5 rounded-full flex items-center justify-center mr-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="8" y1="12" x2="16" y2="12"></line>
                          <line x1="12" y1="8" x2="12" y2="16"></line>
                        </svg>
                      </span>
                      Preset Configurations
                    </h3>
                  </div>
                  <div className="bg-gray-50/70 rounded-lg p-1.5 flex flex-col gap-1.5">
                    <PresetConfigs onApply={handlePresetApply} />
                  </div>
                </div>
              )}
              
              {/* Action buttons for desktop view */}
              {hasInteracted && (
                <div className="hidden lg:flex gap-2 mt-4">
                  <button
                    onClick={handleClearGrid}
                    className="flex-1 flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-all hover:text-red-500"
                    data-testid="clear-grid-button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18"></path>
                      <path d="M6 6l12 12"></path>
                    </svg>
                    <span className="font-medium">Clear</span>
                  </button>
                  <button
                    onClick={handleApplyConfiguration}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 px-4 py-2 rounded-lg shadow-sm border border-blue-500 text-white hover:bg-blue-700 transition-all"
                    data-testid="apply-config-button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    <span className="font-medium">Apply</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Hidden element for testing that contains all requirements as data attributes */}
          <div 
            data-testid="requirements-data"
            data-four-pack-regular={requirements.fourPackRegular}
            data-four-pack-extra-tall={requirements.fourPackExtraTall}
            data-two-pack-regular={requirements.twoPackRegular}
            data-two-pack-extra-tall={requirements.twoPackExtraTall}
            data-side-panels={requirements.sidePanels}
            data-left-panels={requirements.leftPanels}
            data-right-panels={requirements.rightPanels}
            data-straight-couplings={requirements.straightCouplings}
            data-corner-connectors={requirements.cornerConnectors}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      {/* Render the floating action buttons using React Portal */}
      {hasInteracted && (
        <FloatingActionButtons 
          requirementsSum={totalPacks}
          onApply={handleApplyConfiguration}
          onClear={handleClearGrid}
        />
      )}
    </div>
  );
};

export default FoodcubeConfigurator;
