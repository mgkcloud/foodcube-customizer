import React from 'react';
import { createRoot } from 'react-dom/client';
import { FoodcubeConfigurator } from '@/components/FoodcubeConfigurator';
import { TutorialProvider } from '@/contexts/TutorialContext';
import { TutorialPositionProvider } from '@/contexts/TutorialPositionContext';
import OptimizedTutorial from '@/components/OptimizedTutorial';
import WelcomeModal from '@/components/WelcomeModal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import HelpButton from '@/components/HelpButton';
import { normalizeProductData } from '@/utils/productSchema';
import '@/styles/embed-reset.css';
import '@/index.css';
import '@/styles/welcome-modal.css';

type InitArgs =
  | HTMLElement
  | {
      container?: HTMLElement;
      variants?: any;
      onUpdate?: (selections: Record<string, number>) => void;
      onApply?: (selections: Record<string, number>) => void;
      onClose?: () => void;
    };

// Register a global that the iframe can call to bootstrap (supports element or options object)
(window as any).initFoodcubeConfigurator = function initFoodcubeConfigurator(input: InitArgs) {
  const inputIsObject = input && !(input instanceof HTMLElement);
  const container = input instanceof HTMLElement ? input : input?.container;
  const externalVariants = inputIsObject ? input?.variants : undefined;
  const externalOnUpdate = inputIsObject ? input?.onUpdate : undefined;
  const externalOnApply = inputIsObject ? input?.onApply : undefined;
  const externalOnClose = inputIsObject ? input?.onClose : undefined;

  if (!(container instanceof HTMLElement)) {
    console.error('[Standalone] Missing container for configurator init');
    return;
  }

  console.log('[Standalone] initFoodcubeConfigurator invoked');

  // Prefer caller-supplied variants, else try to read from the closest calculator script, else fall back to page-level script tag
  const readVariantData = (): Record<string, any> => {
    if (externalVariants && Object.keys(externalVariants).length > 0) {
      try {
        const { normalizedVariants } = normalizeProductData(externalVariants);
        return normalizedVariants;
      } catch (err) {
        console.warn('[Standalone] Failed to normalize caller variants, using raw value', err);
        return externalVariants;
      }
    }

    const parseJsonText = (text: string | null) => {
      if (!text) return {};
      try {
        return JSON.parse(text);
      } catch {
        try {
          // Clean trailing commas/empties
          return JSON.parse(text.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'));
        } catch (err) {
          console.error('[Standalone] Failed to parse product data JSON', err);
          return {};
        }
      }
    };

    const calculator = container.closest('cladding-calculator');
    const scriptInCalculator = calculator?.querySelector('script[type="application/json"]');
    const productDataScript = document.getElementById('foodcube-customizer-product-data');
    
    const rawData = scriptInCalculator
      ? parseJsonText(scriptInCalculator.textContent)
      : parseJsonText(productDataScript?.textContent || null);

    try {
      const { normalizedVariants } = normalizeProductData(rawData);
      return normalizedVariants;
    } catch (err) {
      console.warn('[Standalone] Failed to normalize script variants, using raw value', err);
      return rawData;
    }
  };

  const variantData = readVariantData();

  const root = createRoot(container);
  root.render(
    <div className="foodcube-configurator-embed">
      <TutorialProvider>
        <TutorialPositionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OptimizedTutorial />
            <WelcomeModal />
            <HelpButton />
            <FoodcubeConfigurator
              variants={variantData}
              onUpdate={(selections) => {
                if (typeof externalOnUpdate === 'function') {
                  externalOnUpdate(selections);
                }
              }}
              onApply={(selections) => {
                if (typeof externalOnApply === 'function') {
                  externalOnApply(selections);
                }
              }}
              onClose={() => {
                if (typeof externalOnClose === 'function') {
                  externalOnClose();
                }
              }}
            />
          </TooltipProvider>
        </TutorialPositionProvider>
      </TutorialProvider>
    </div>
  );
};
