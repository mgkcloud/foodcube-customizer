import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { FoodcubeConfigurator } from "@/components/FoodcubeConfigurator";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { TutorialPositionProvider } from "@/contexts/TutorialPositionContext";
import OptimizedTutorial from "@/components/OptimizedTutorial";
import WelcomeModal from "@/components/WelcomeModal";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import HelpButton from "@/components/HelpButton";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

// Import CSS
import "@/index.css";
// Tutorial CSS is now injected directly by OptimizedTutorial component for reliability
// import "@/styles/tutorial.css";
import "@/styles/embed-reset.css"; // Import our reset CSS
import "@/styles/welcome-modal.css"; // Import welcome modal specific styles

// Wrapper component to control welcome modal opening
const EmbeddedApp = ({ variants, onUpdate, onApply, onClose }) => {
  // Effect to control when the welcome modal appears in embed context
  useEffect(() => {
    // Check if the tutorial has already been completed
    const tutorialCompleted = document.cookie.includes('foodcube-tutorial-completed=true') ||
                             localStorage.getItem('foodcube-tutorial-completed') === 'true';
    
    // If the tutorial hasn't been completed, show the welcome modal after a short delay
    if (!tutorialCompleted) {
      // Check if we should show the tutorial based on cookie/localStorage
      const welcomeModalShown = document.cookie.includes('foodcube-welcome-modal-shown=true') ||
                               localStorage.getItem('foodcube-welcome-modal-shown') === 'true';
      
      // If welcome modal hasn't been shown yet, create cookie and localStorage entries
      if (!welcomeModalShown) {
        // Set cookies and localStorage to indicate modal has been shown
        const date = new Date();
        date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000)); // One year
        document.cookie = `foodcube-welcome-modal-shown=true; expires=${date.toUTCString()}; path=/`;
        localStorage.setItem('foodcube-welcome-modal-shown', 'true');
      }
    }
    
    // Add data-scrollable attribute to the modal container for proper positioning
    const modalContainer = document.getElementById('GlobalCladdingCalculatorModal');
    if (modalContainer) {
      modalContainer.setAttribute('data-scrollable', 'true');
      console.log('Added data-scrollable attribute to GlobalCladdingCalculatorModal');
    }

    // Fix font size scaling issue in Shopify themes
    // Shopify themes often set html { font-size: 62.5%; } which scales down all rem-based sizes
    const originalFontSize = document.documentElement.style.fontSize;
    const computedFontSize = window.getComputedStyle(document.documentElement).fontSize;
    
    // Store original values for restoration
    const fontSizeData = {
      original: originalFontSize,
      computed: computedFontSize
    };
    
    // Create and inject font size override style scoped to embedded content only
    const fontSizeOverrideStyle = document.createElement('style');
    fontSizeOverrideStyle.id = 'foodcube-font-size-override';
    fontSizeOverrideStyle.textContent = `
      /* Set base font size for the embedded configurator container */
      .foodcube-configurator-embed {
        font-size: 16px !important;
      }
      
      /* Override common Tailwind text classes with pixel values within the embed */
      .foodcube-configurator-embed .text-xs { font-size: 12px !important; }
      .foodcube-configurator-embed .text-sm { font-size: 14px !important; }
      .foodcube-configurator-embed .text-base { font-size: 16px !important; }
      .foodcube-configurator-embed .text-lg { font-size: 18px !important; }
      .foodcube-configurator-embed .text-xl { font-size: 20px !important; }
      .foodcube-configurator-embed .text-2xl { font-size: 24px !important; }
      .foodcube-configurator-embed .text-3xl { font-size: 30px !important; }
      .foodcube-configurator-embed .text-4xl { font-size: 36px !important; }
      .foodcube-configurator-embed .text-5xl { font-size: 48px !important; }
      .foodcube-configurator-embed .text-6xl { font-size: 60px !important; }
      
      /* Override button and input text sizes specifically within the embed */
      .foodcube-configurator-embed button { font-size: 14px !important; }
      .foodcube-configurator-embed input { font-size: 14px !important; }
      .foodcube-configurator-embed label { font-size: 14px !important; }
      .foodcube-configurator-embed select { font-size: 14px !important; }
      .foodcube-configurator-embed textarea { font-size: 14px !important; }
      
      /* Override specific UI component text sizes */
      .foodcube-configurator-embed .text-muted-foreground { font-size: 13px !important; }
      .foodcube-configurator-embed h1 { font-size: 32px !important; }
      .foodcube-configurator-embed h2 { font-size: 24px !important; }
      .foodcube-configurator-embed h3 { font-size: 20px !important; }
      .foodcube-configurator-embed h4 { font-size: 18px !important; }
      .foodcube-configurator-embed h5 { font-size: 16px !important; }
      .foodcube-configurator-embed h6 { font-size: 14px !important; }
      .foodcube-configurator-embed p { font-size: 16px !important; }
      .foodcube-configurator-embed span { font-size: inherit !important; }
      
      /* Ensure tooltips and dropdowns have proper sizing */
      .foodcube-configurator-embed [data-testid*="tooltip"] { font-size: 14px !important; }
      .foodcube-configurator-embed [role="tooltip"] { font-size: 14px !important; }
      .foodcube-configurator-embed [role="menu"] { font-size: 14px !important; }
      .foodcube-configurator-embed [role="menuitem"] { font-size: 14px !important; }
    `;
    
    document.head.appendChild(fontSizeOverrideStyle);
    
    console.log('Applied font size override for embedded modal', {
      originalFontSize: fontSizeData.original,
      computedFontSize: fontSizeData.computed
    });
    
    // Cleanup function
    return () => {
      // Remove font size override style
      const styleElement = document.getElementById('foodcube-font-size-override');
      if (styleElement) {
        styleElement.remove();
      }
      
      console.log('Cleaned up font size override');
    };
  }, []);

  return (
    <div className="foodcube-configurator-embed">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OptimizedTutorial />
        <WelcomeModal />
        <HelpButton />
        <FoodcubeConfigurator
          variants={variants}
          onUpdate={onUpdate}
          onApply={onApply}
          onClose={onClose}
        />
      </TooltipProvider>
    </div>
  );
};

declare global {
  interface Window {
    initFoodcubeConfigurator: (container: HTMLElement) => void;
    closeGlobalCladdingCalculator?: () => void;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.initFoodcubeConfigurator = (container: HTMLElement | null) => {
    // Ensure container is a DOM element
    if (!(container instanceof HTMLElement)) {
      console.error('Container must be a valid HTML element');
      return;
    }
    if (!container) {
      console.error("Container element is required");
      return;
    }

    // Find the calculator element
    let calculator: Element | null = null;
    try {
      calculator = container.closest("cladding-calculator");
    } catch (error) {
      console.error('Error finding calculator element:', error);
    }
    // Get variant data
    let variantData = {};
    try {
      const jsonScript = calculator?.querySelector("script[type=\"application/json\"]");
      console.log('Found JSON script:', jsonScript?.textContent);
      if (jsonScript?.textContent) {
        variantData = JSON.parse(jsonScript.textContent);
        console.log('Parsed variant data:', variantData);
      }
    } catch (error) {
      console.error('Error parsing variant data:', error);
    }

    // Helper function to determine if we should use regular or extra tall height
    const isRegularHeight = (title: string) => title.includes("500mm");
    
    // Helper function to calculate total cubes based on connectors
    const calculateTotalCubes = (selections: Record<string, number>): number => {
      // If there are no connectors, it's a single cube
      if (!selections.straightCouplings && !selections.cornerConnectors) {
        return 1;
      }
      
      // Formula: Cubes = Connectors + 1
      // Each connector connects two cubes, so total cubes = total connectors + 1
      return (selections.straightCouplings || 0) + (selections.cornerConnectors || 0) + 1;
    };
    
    // Flag to prevent updating inputs to zero after applying selections
    let hasJustAppliedSelections = false;
    // Store the last applied selections to keep in the inputs
    let lastAppliedSelections: Record<string, number> | null = null;

    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <TutorialProvider>
          <TutorialPositionProvider>
            <EmbeddedApp
            variants={variantData}
            onUpdate={(selections) => {
              // If we just applied selections via the "SELECT & CLOSE" button, don't update inputs
              if (hasJustAppliedSelections) {
                console.log('Skipping input update after applying selections');
                // Reset the flag for next time
                hasJustAppliedSelections = false;
                return;
              }
              
              // If all selections are zero and we have previously applied selections,
              // use the last applied selections instead
              const allSelectionsZero = Object.values(selections).every(value => value === 0);
              if (allSelectionsZero && lastAppliedSelections) {
                console.log('Using last applied selections instead of zeros');
                return;
              }
              
              Object.entries(variantData).forEach(([packType, data]) => {
                (data as any).variants.forEach((variant: any) => {
                  const variantElement = document.querySelector(
                    `product-customizer-variant[variant-id="${variant.id}"]`
                  );
                  if (variantElement) {
                    const input = variantElement.querySelector("quantity-input input");
                    if (input) {
                      let quantity = 0;
                      
                      // Check if this variant should receive quantities at all based on height preference
                      // Default all panels to 500mm height (which is the standard height) if no height preference is set
                      const isRegular = isRegularHeight(variant.title);
                      
                      if (packType === "4_pack_cladding") {
                        quantity = isRegular
                          ? selections.fourPackRegular || 0
                          : selections.fourPackExtraTall || 0;
                      } else if (packType === "2_pack_cladding") {
                        quantity = isRegular
                          ? selections.twoPackRegular || 0
                          : selections.twoPackExtraTall || 0;
                      } else if (packType === "side_panel_cladding") {
                        // Currently we don't differentiate sidePanels by height in our state
                        // So we assign all to the 500mm variants
                        quantity = isRegular ? selections.sidePanels || 0 : 0;
                      } else if (packType === "left_panel_cladding") {
                        // Currently we don't differentiate leftPanels by height in our state
                        // So we assign all to the 500mm variants
                        quantity = isRegular ? selections.leftPanels || 0 : 0;
                      } else if (packType === "right_panel_cladding") {
                        // Currently we don't differentiate rightPanels by height in our state
                        // So we assign all to the 500mm variants
                        quantity = isRegular ? selections.rightPanels || 0 : 0;
                      } else if (packType === "connectors") {
                        if ((variant as any).type === "straight") {
                          quantity = selections.straightCouplings || 0;
                        } else if ((variant as any).type === "corner") {
                          quantity = selections.cornerConnectors || 0;
                        }
                      }
                      
                      // Set the input value to an empty string if quantity is 0, otherwise set to the quantity string
                      (input as HTMLInputElement).value = quantity > 0 ? quantity.toString() : "";
                      input.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                  }
                });
              });
            }}
            onApply={(selections) => {
              console.log('Applying final selections:', selections);
              
              // Store these selections as the last applied
              lastAppliedSelections = { ...selections };
              
              // Set flag to prevent the next onUpdate call from zeroing out the inputs
              hasJustAppliedSelections = true;
              
              // Calculate total number of cubes based on connectors
              const totalCubes = calculateTotalCubes(selections);
              console.log(`Total cubes calculated: ${totalCubes}`);
              
              // Update the main product quantity input with a more robust selector
              // Try multiple selector approaches, from most specific to most generic
              let mainQuantityInput = 
                // Try parent container + input
                document.querySelector('.product-form__quantity quantity-input .quantity__input') ||
                // Try by input with specific name attribute
                document.querySelector('input.quantity__input[name="quantity.pc__details"]') ||
                // Try by input with specific attributes
                document.querySelector('input.quantity__input[data-not-overwrite="true"]') ||
                // Try by input inside quantity-input custom element
                document.querySelector('quantity-input .quantity__input') ||
                // Last resort - any quantity input
                document.querySelector('input.quantity__input[type="number"]');
              
              if (mainQuantityInput && mainQuantityInput instanceof HTMLInputElement) {
                console.log(`Updating main product quantity to ${totalCubes}`);
                mainQuantityInput.value = totalCubes.toString();
                mainQuantityInput.dispatchEvent(new Event('change', { bubbles: true }));
              } else {
                console.warn('Main product quantity input not found');
              }
              
              // First update all product quantities, but ONLY for non-zero quantities
              Object.entries(variantData).forEach(([packType, data]) => {
                (data as any).variants.forEach((variant: any) => {
                  const variantElement = document.querySelector(
                    `product-customizer-variant[variant-id="${variant.id}"]`
                  );
                  if (variantElement) {
                    const input = variantElement.querySelector("quantity-input input");
                    if (input) {
                      let quantity = 0;
                      
                      // Check if this variant should receive quantities at all based on height preference
                      // Default all panels to 500mm height (which is the standard height) if no height preference is set
                      const isRegular = isRegularHeight(variant.title);
                      
                      if (packType === "4_pack_cladding") {
                        quantity = isRegular
                          ? selections.fourPackRegular || 0
                          : selections.fourPackExtraTall || 0;
                      } else if (packType === "2_pack_cladding") {
                        quantity = isRegular
                          ? selections.twoPackRegular || 0
                          : selections.twoPackExtraTall || 0;
                      } else if (packType === "side_panel_cladding") {
                        // Currently we don't differentiate sidePanels by height in our state
                        // So we assign all to the 500mm variants
                        quantity = isRegular ? selections.sidePanels || 0 : 0;
                      } else if (packType === "left_panel_cladding") {
                        // Currently we don't differentiate leftPanels by height in our state
                        // So we assign all to the 500mm variants
                        quantity = isRegular ? selections.leftPanels || 0 : 0;
                      } else if (packType === "right_panel_cladding") {
                        // Currently we don't differentiate rightPanels by height in our state
                        // So we assign all to the 500mm variants
                        quantity = isRegular ? selections.rightPanels || 0 : 0;
                      } else if (packType === "connectors") {
                        if ((variant as any).type === "straight") {
                          quantity = selections.straightCouplings || 0;
                        } else if ((variant as any).type === "corner") {
                          quantity = selections.cornerConnectors || 0;
                        }
                      }
                      
                      // Only update inputs that have a positive quantity
                      if (quantity > 0) {
                        (input as HTMLInputElement).value = quantity.toString();
                        input.dispatchEvent(new Event("change", { bubbles: true }));
                      }
                    }
                  }
                });
              });
              
              // Log success message
              console.log('Successfully applied selections to products');

              toast({
                title: `Layout added to kit – ${totalCubes} Foodcubes`,
                action: (
                  <ToastAction
                    altText="Edit"
                    onClick={() => {
                      if (typeof (window as any).openGlobalCladdingCalculator === 'function') {
                        (window as any).openGlobalCladdingCalculator();
                      } else {
                        const modal = document.getElementById('GlobalCladdingCalculatorModal');
                        if (modal) {
                          modal.style.display = 'block';
                          document.body.classList.add('overflow-hidden');
                        }
                      }
                    }}
                  >
                    Edit
                  </ToastAction>
                )
              });
              
              // Close the modal using the global function
              if (typeof window.closeGlobalCladdingCalculator === 'function') {
                window.closeGlobalCladdingCalculator();
              } else {
                console.warn('closeGlobalCladdingCalculator function not found');
                
                // Fallback: try to find and close the modal directly
                const modal = document.getElementById('GlobalCladdingCalculatorModal');
                if (modal) {
                  modal.style.display = 'none';
                  document.body.classList.remove('overflow-hidden');
                }
              }
            }}
            onClose={() => {
              // Close the modal using the global function
              if (typeof window.closeGlobalCladdingCalculator === 'function') {
                window.closeGlobalCladdingCalculator();
              } else {
                console.warn('closeGlobalCladdingCalculator function not found');
                
                // Fallback: try to find and close the modal directly
                const modal = document.getElementById('GlobalCladdingCalculatorModal');
                if (modal) {
                  modal.style.display = 'none';
                  document.body.classList.remove('overflow-hidden');
                }
              }
            }}
          />
          </TutorialPositionProvider>
        </TutorialProvider>
      </React.StrictMode>
    );
  };
});