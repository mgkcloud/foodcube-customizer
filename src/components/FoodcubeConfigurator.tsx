import React, { useState, useEffect } from 'react';
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

interface FoodcubeConfiguratorProps {
  variants: Record<string, any>;
  onUpdate: (selections: Record<string, number>) => void;
}

export const FoodcubeConfigurator: React.FC<FoodcubeConfiguratorProps> = ({ variants, onUpdate }) => {
  console.log('FoodcubeConfigurator received variants:', variants);
  const { grid, requirements, toggleCell, toggleCladding, applyPreset, error } = useGridState();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [debugMode, setDebugMode] = useState(true); // Set to true by default for debugging

  // Debug the current configuration when in debug mode
  useEffect(() => {
    if (debugMode) {
      console.log("===== DEBUG MODE ENABLED =====");
      console.log("Current Requirements:", requirements);
      debugConfiguration(grid, requirements);
    }
  }, [grid, requirements, debugMode]);

  React.useEffect(() => {
    // Update the parent component with the current requirements
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

  return (
    <div className="p-4 max-w-4xl mx-auto" data-testid="foodcube-configurator">
      <HelpTooltip />
      <div className="mb-6">
        {error && (
          <Alert variant="destructive" className="mb-4" data-testid="error-message">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <h2 className="text-3xl p-4 m-auto text-center font-bold" data-testid="configurator-title">Cladding Configurator</h2>
        
        <div className='flex justify-center items-center gap-2 mb-4'>
          <h4 className="text-sm my-2 text-center font-semibold" data-testid="preset-title">Preset Configurations</h4>
          <PresetConfigs 
            onApply={(preset) => {
              console.log(`Applying preset type: ${preset}`);
              applyPreset(preset);
              setHasInteracted(true);
              
              // Debug the configuration after applying preset
              if (debugMode) {
                console.group(`Applied Preset: ${preset}`);
                console.log(`Preset applied: ${preset}`);
                setTimeout(() => {
                  debugConfiguration(grid, requirements);
                  // Log for Playwright tests
                  console.log("TEST_INFO: Preset applied and requirements calculated");
                }, 100);
                console.groupEnd();
              }
            }}
          />
          
          <div className="ml-auto flex items-center space-x-2">
            <Switch
              id="debug-mode"
              checked={debugMode}
              onCheckedChange={(checked) => {
                setDebugMode(checked);
                console.log(`Debug mode ${checked ? 'enabled' : 'disabled'}`);
              }}
              data-testid="debug-toggle"
            />
            <Label htmlFor="debug-mode" className="text-xs" data-testid="debug-label">Debug Mode</Label>
          </div>
        </div>
        
        {!hasInteracted && (
          <div className="text-center mb-4 text-sm text-gray-500" data-testid="instruction-text">
            Tap grid to place foodcube
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="grid-container">
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow" data-testid="grid-wrapper">
          <Grid 
            grid={grid} 
            onToggleCell={(row, col) => {
              console.log(`Toggling cell at [${row}, ${col}]`);
              toggleCell(row, col);
              setHasInteracted(true);
            }}
            onToggleCladding={(row, col, edge) => {
              console.log(`Toggling cladding at [${row}, ${col}], edge: ${edge}`);
              toggleCladding(row, col, edge);
            }}
            setHasInteracted={setHasInteracted}
            debug={debugMode}
          />
        </div>
        
        <div className="space-y-4" data-testid="requirements-panel">
          <CladdingKey requirements={requirements} />
          
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
    </div>
  );
};

export default FoodcubeConfigurator;
