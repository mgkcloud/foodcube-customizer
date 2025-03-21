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
import { getUserFriendlyErrorMessage } from '@/utils/validation/presetConstraintsValidator';
import { usePresetConstraints } from '@/hooks/usePresetConstraints';
import { PANEL_COLORS } from '@/constants/colors';
import { useTutorial } from '@/contexts/TutorialContext';

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
    <div className="fixed z-[99999999999] bottom-6 right-6 flex flex-col items-end gap-4" style={{ position: 'fixed', pointerEvents: 'auto' }}>
      {/* Apply button */}
      <button
        onClick={onApply}
        className="flex flex-col items-center justify-center w-44 h-44 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-blue-700 text-white font-bold shadow-2xl border-4 border-white hover:bg-blue-700 transition-all transform hover:scale-105 relative"
        style={{ 
          background: `linear-gradient(135deg, ${PANEL_COLORS.left}DD, ${PANEL_COLORS.left}, ${PANEL_COLORS.left}99)`, 
          boxShadow: '0 10px 35px -5px rgba(18, 159, 206, 0.6), 0 10px 20px -6px rgba(18, 159, 206, 0.4)'
        }}
        data-testid="mobile-apply-button"
        aria-label="Select products"
      >
        {/* Arrow indicator */}
        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-blue-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-md animate-pulse flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
          TAP HERE
        </div>
        
        <div className="flex flex-col items-center justify-center leading-none">
          {/* <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
            <path d="M20 6L9 17l-5-5"></path>
          </svg> */}
          <span className="text-lg font-extrabold mb-2 uppercase tracking-wide text-white">SELECT<br />& CLOSE</span>
          <div className="bg-white/30 px-4 py-2 rounded-full">
            <span className="text-2xl font-black text-white">{requirementsSum}</span>
            <span className="text-base ml-1 text-white">packs</span>
          </div>
          {/* <span className="text-sm mt-3 opacity-90 font-medium text-white semibold">Tap to complete</span> */}
        </div>
      </button>
      
      {/* Clear button */}
      <button
        onClick={onClear}
        className="flex flex-wrap items-center justify-center w-24 h-24 rounded-full bg-white shadow-2xl border-2 border-gray-200 text-gray-500 hover:text-red-500 transition-all transform hover:scale-105"
        style={{ flexDirection: 'column', boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.15), 0 6px 10px -2px rgba(0, 0, 0, 0.1)' }}
        data-testid="mobile-clear-button"
        aria-label="Clear configuration"
      >
        {/* <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className='mx-auto'>
          <path d="M18 6L6 18"></path>
          <path d="M6 6l12 12"></path>
        </svg> */}
        <span className="text-lg w-full mx-auto font-extrabold mb-2 uppercase tracking-wide text-gray-500">CLEAR</span>

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
  // Don't show if no message or not visible
  if (!message || !isVisible) return null;
  
  return (
    <div 
      className="absolute top-0 left-0 right-0 z-[9999] flex justify-center transition-all duration-300"
      style={{ 
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-10px)'
      }}
      data-testid="in-grid-guide"
    >
      <div className="inline-flex items-center bg-white/95 rounded-b-lg shadow-md border border-blue-100 py-1.5 px-3 animate-fade-in">
        {/* Simple circular avatar */}
        <div className="flex-shrink-0 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold mr-2 animate-pulse">
          i
        </div>
        
        {/* Bold message with variable width */}
        <p className="text-xs font-bold text-gray-700 flex-grow">{message}</p>
        
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="ml-2 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
          aria-label="Dismiss"
        >
          <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
  // console.log('FoodcubeConfigurator received variants:', variants);
  const { grid, requirements, toggleCell, toggleCladding, applyPreset, error, clearGrid } = useGridState();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [debugMode, setDebugMode] = useState(false); // Default to false for production
  
  // Add tutorial context at component level
  const { showTutorial, setCurrentStep, resetTutorial } = useTutorial();
  
  // Use our new preset constraints hook
  const {
    presetSelected,
    isApplyingPreset,
    originalPresetGrid,
    removedCubesCount,
    localError,
    showErrorOverlay,
    dismissErrorOverlay,
    updateLastInteraction,
    handlePresetApply: handlePresetConstraintApply,
    handleToggleCubeInPreset,
    resetPresetState
  } = usePresetConstraints({
    grid,
    error
  });

  // Debug the current configuration when in debug mode
  useEffect(() => {
    if (debugMode) {
      console.log("===== DEBUG MODE ENABLED =====");
      console.log("Current Requirements:", requirements);
      debugConfiguration(grid, requirements);
    }
  }, [grid, requirements, debugMode]);

  // Update the parent component with the current requirements
  React.useEffect(() => {
    // console.log("Calling onUpdate with requirements:", JSON.stringify(requirements, null, 2));
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
    // console.log("Selections for CladdingKey:", JSON.stringify(selections, null, 2));

    // Add a data attribute to the document body with the current requirements for testing
    document.body.setAttribute('data-requirements', JSON.stringify(selections));

    onUpdate(selections);
  }, [requirements, onUpdate]);

  // Handle toggling a cell in the grid with improved debounce protection
  const handleToggleCell = useCallback((rowIndex: number, colIndex: number) => {
    // Get the current cube state BEFORE toggling
    const cellElement = document.querySelector(`[data-testid="grid-cell-${rowIndex}-${colIndex}"]`);
    const hasCubeBefore = cellElement?.getAttribute('data-has-cube') === 'true';
    
    // Use our preset constraint handler for toggle cell operations
    handleToggleCubeInPreset(rowIndex, colIndex, toggleCell);
    
    // Determine the actual action based on previous state
    const action = hasCubeBefore ? 'removed' : 'added';
    
    // Add more detailed debugging
    console.log(`Cube at [${rowIndex},${colIndex}] was ${action}`);
    
    // Use a small timeout to ensure DOM is updated before dispatching the event
    // This helps ensure the tutorial can properly detect the change
    setTimeout(() => {
      // Double-check the current state after the toggle to ensure accurate event data
      const updatedCellElement = document.querySelector(`[data-testid="grid-cell-${rowIndex}-${colIndex}"]`);
      const currentHasCube = updatedCellElement?.getAttribute('data-has-cube') === 'true';
      
      // Determine the actual action based on the current state compared to previous
      const confirmedAction = hasCubeBefore !== currentHasCube 
        ? action 
        : (currentHasCube ? 'added' : 'removed'); // Fallback determination
      
      console.log(`Verified cube state at [${rowIndex},${colIndex}]: was=${hasCubeBefore}, now=${currentHasCube}, action=${confirmedAction}`);
      
      // Trigger a custom event that the tutorial can listen for
      // Ensure we're sending primitive number types for row/col (not strings)
      const eventDetail = { 
        row: Number(rowIndex), 
        col: Number(colIndex), 
        hasCube: currentHasCube,
        action: confirmedAction
      };
      
      document.dispatchEvent(new CustomEvent('cube-toggled', { detail: eventDetail }));
      console.log(`Dispatched cube-toggled event:`, eventDetail);
      
      // Special handling for tutorial no longer needed - using notifyTutorial directly
    }, 50); // Small delay to ensure state is updated
  }, [handleToggleCubeInPreset, toggleCell]);

  // Handle preset application function
  const handlePresetApply = (preset: string) => {
    console.log(`Requesting preset application: ${preset}`);
    
    // Reset any previous error state
    clearGrid();
    
    // Mark this as a user interaction and set has interacted
    setHasInteracted(true);
    
    // Use our preset constraint handler to apply the preset
    handlePresetConstraintApply(preset, applyPreset);
    
    // Skip to step 3 (index 2) if tutorial is active
    if (showTutorial) {
      console.log('Preset selected during tutorial, skipping to step 3 (index 2)');
      setCurrentStep(2);
    }
    
    // Debug the configuration after applying preset
    if (debugMode) {
      console.group(`Applied Preset: ${preset}`);
      console.log(`Preset applied: ${preset}`);
      
      // Use longer timeout to ensure grid has fully settled
      setTimeout(() => {
        console.log("Debugging preset configuration after full settlement");
        debugConfiguration(grid, requirements);
        // Log for Playwright tests
        console.log("TEST_INFO: Preset applied and requirements calculated");
      }, 1500); // Extended timeout to ensure everything is settled
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
    
    // Clear the grid after applying - similar to handleClearGrid
    console.log("Clearing grid configuration after apply");
    clearGrid();
    
    // Reset state
    setHasInteracted(false);
    resetPresetState();
    
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
    clearGrid();
    
    // Reset state
    setHasInteracted(false);
    resetPresetState();
  };

  // Calculate total packs for the floating action button
  const totalPacks = requirements.fourPackRegular + requirements.twoPackRegular;

  // Determine which error message to display
  const displayError = localError || error;
  const friendlyErrorMessage = getUserFriendlyErrorMessage(displayError);

  return (
    <div className="relative w-full mx-auto bg-transparent rounded-xl overflow-hidden backdrop-blur-sm" data-testid="foodcube-configurator">
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
          <div className="flex flex-col items-center justify-center mb-4 sm:mb-5" data-testid="configurator-title">
            {/* Header with Foodcube logo and specified font color */}
            <div className="flex items-center justify-center">
              {/* Foodcube logo */}
              <img 
                src="https://foodcube.com.au/cdn/shop/files/Foodcube_Logo_2024_Trans_BG.png?v=1705369454&width=500" 
                alt="Foodcube Logo" 
                className="h-8 sm:h-10 mr-2"
              />
              
              {/* Main title with specified color and Montserrat font */}
              <h2 className="text-2xl sm:text-2xl font-bold tracking-tight" 
                  style={{ fontFamily: 'Montserrat, sans-serif', color: '#374151 !important' }}>
                Garden Designer
              </h2>
            </div>
            
            {/* Smaller subtitle with Montserrat font and specified color */}
            <p className="text-sm font-medium mt-1"
               style={{ fontFamily: 'Montserrat, sans-serif', color: '#374151 !important' }}>
              Create your perfect garden configuration
            </p>
            
            {/* Simple solid color bar */}
            <div className="mt-2">
              <div className="h-0.5 w-40 sm:w-48 rounded-full bg-gray-700"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Grid takes up more space */}
            <div className="lg:col-span-7 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 relative" data-testid="grid-wrapper">
              {/* Error message overlay */}
              <ErrorOverlay 
                message={friendlyErrorMessage} 
                isVisible={showErrorOverlay && !!displayError}
                onDismiss={dismissErrorOverlay}
              />
              
              {/* Overlay for preset selection with welcome message - positioned directly over the grid */}
              {!hasInteracted && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 rounded-xl" data-testid="config-overlay">
                  {/* Semi-transparent animated background */}
                  <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm animate-pulse rounded-xl"></div>
                  
                  {/* Content card with full opacity */}
                  <div className="relative bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 max-w-md w-full sm:w-4/5 mx-auto text-center transition-transform hover:scale-[1.01] duration-200 z-10">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <img 
                        src="https://foodcube.com.au/cdn/shop/files/Foodcube_Logo_2024_Trans_BG.png?v=1705369454&width=500" 
                        alt="Foodcube Logo" 
                        className="h-8"
                      />
                      <h3 className="text-lg md:text-xl font-semibold text-gray-800">Welcome!</h3>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">Select a preset configuration to get started</p>
                    
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <PresetConfigs onApply={handlePresetApply} />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">First time? Try the L-Shape!</p>
                      <button 
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                        onClick={() => resetTutorial()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Show Tutorial
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
            <div className="lg:col-span-5 space-y-3" data-testid="requirements-panel">
              {/* Desktop order (hidden on mobile) */}
              <div className="hidden lg:!block space-y-3">
                {/* Cladding Key */}
                <div className="transition-all duration-300 ease-in-out">
                  <CladdingKey requirements={requirements} showDebug={debugMode} />
                </div>
                
                {/* Preset configurations */}
                {hasInteracted && (
                  <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100" data-testid="side-presets-desktop">
                    <div className="mb-1 sm:mb-2">
                      <h3 className="text-sm sm:text-lg md:text-xl font-bold text-gray-700 flex items-center" data-testid="presets-heading">
                        <span className="bg-gray-100 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center mr-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" className="sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                          </svg>
                        </span>
                        Preset Configurations
                      </h3>
                    </div>
                    <div className="bg-gray-50/70 rounded-lg p-1.5 sm:p-2.5 flex flex-col gap-1.5 sm:gap-2.5">
                      <PresetConfigs onApply={handlePresetApply} />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mobile order (hidden on desktop) - Preset configs above Cladding Key */}
              <div className="block lg:hidden space-y-3">
                {/* Preset configurations first */}
                {hasInteracted && (
                  <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100" data-testid="side-presets-mobile">
                    <div className="mb-1 sm:mb-2">
                      <h3 className="text-sm sm:text-lg md:text-xl font-bold text-gray-700 flex items-center" data-testid="presets-heading-mobile">
                        <span className="bg-gray-100 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center mr-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" className="sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                          </svg>
                        </span>
                        Preset Configurations
                      </h3>
                    </div>
                    <div className="bg-gray-50/70 rounded-lg p-1.5 sm:p-2.5 flex flex-col gap-1.5 sm:gap-2.5">
                      <PresetConfigs onApply={handlePresetApply} />
                    </div>
                  </div>
                )}
                
                {/* Cladding Key second */}
                <div className="transition-all duration-300 ease-in-out">
                  <CladdingKey requirements={requirements} showDebug={debugMode} />
                </div>
              </div>
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
