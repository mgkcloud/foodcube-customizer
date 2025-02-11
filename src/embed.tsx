import React from "react";
import { createRoot } from "react-dom/client";
import { FoodcubeConfigurator } from "@/components/FoodcubeConfigurator";

declare global {
  interface Window {
    initFoodcubeConfigurator: (container: HTMLElement) => void;
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

    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <FoodcubeConfigurator
          variants={variantData}
          onUpdate={(selections) => {
            Object.entries(variantData).forEach(([packType, data]) => {
              (data as any).variants.forEach((variant: any) => {
                const variantElement = document.querySelector(
                  `product-customizer-variant[variant-id="${variant.id}"]`
                );
                if (variantElement) {
                  const input = variantElement.querySelector("quantity-input input");
                  if (input) {
                    let quantity = 0;
                    if (packType === "4_pack_cladding") {
                      quantity = variant.title.toLowerCase().includes("regular")
                        ? selections.fourPackRegular || 0
                        : selections.fourPackExtraTall || 0;
                    } else if (packType === "2_pack_cladding") {
                      quantity = variant.title.toLowerCase().includes("regular")
                        ? selections.twoPackRegular || 0
                        : selections.twoPackExtraTall || 0;
                    }
                    input.value = quantity.toString();
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                }
              });
            });
          }}
        />
      </React.StrictMode>
    );
  };
});