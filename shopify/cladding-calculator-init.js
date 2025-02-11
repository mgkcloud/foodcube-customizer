// Initialize the Foodcube Configurator when the modal opens
document.addEventListener('DOMContentLoaded', function() {
  // Find all calculator modal buttons
  const modalButtons = document.querySelectorAll('[id^="button-modal-calculator-"]');
  
  modalButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modalId = this.getAttribute('id').replace('button-', '');
      const modal = document.getElementById(modalId);
      
      if (modal) {
        // Find the container within the modal
        const container = modal.querySelector('[data-cc-container]');
        const configuratorContainer = container.querySelector('#foodcube-configurator');
        
        if (configuratorContainer) {
          // Get variant data from the calculator element
          const calculator = modal.querySelector('cladding-calculator');
          const variantData = calculator ? JSON.parse(calculator.querySelector('script[type="application/json"]').textContent) : {};
          
          // Initialize the configurator
          window.initFoodcubeConfigurator({
            container: configuratorContainer,
            variants: variantData,
            onUpdate: function(selections) {
              // Map the selections to the appropriate variant IDs
              const variantSelections = {};
              
              // Map 4-pack selections
              if (variantData['4_pack_cladding'] && variantData['4_pack_cladding'].variants) {
                variantData['4_pack_cladding'].variants.forEach(variant => {
                  if (variant.title.toLowerCase().includes('regular')) {
                    variantSelections[variant.id] = selections.fourPackRegular || 0;
                  } else if (variant.title.toLowerCase().includes('extra')) {
                    variantSelections[variant.id] = selections.fourPackExtraTall || 0;
                  }
                });
              }
              
              // Map 2-pack selections
              if (variantData['2_pack_cladding'] && variantData['2_pack_cladding'].variants) {
                variantData['2_pack_cladding'].variants.forEach(variant => {
                  if (variant.title.toLowerCase().includes('regular')) {
                    variantSelections[variant.id] = selections.twoPackRegular || 0;
                  } else if (variant.title.toLowerCase().includes('extra')) {
                    variantSelections[variant.id] = selections.twoPackExtraTall || 0;
                  }
                });
              }

              // Update the variant quantities in the UI
              Object.entries(variantSelections).forEach(([variantId, quantity]) => {
                const variantElement = document.querySelector(
                  `product-customizer-variant[variant-id="${variantId}"]`
                );
                if (variantElement) {
                  const input = variantElement.querySelector('quantity-input input');
                  if (input) {
                    input.value = quantity.toString();
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }
              });
            }
          });
        }
      }
    });
  });
});
