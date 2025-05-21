import React, { useState, useEffect } from 'react';
import { useTutorial, ActionType, TutorialAction } from '@/contexts/TutorialContext';
import OptimizedTutorialTooltip from './OptimizedTutorialTooltip';
import OptimizedSpotlight from './OptimizedSpotlight';
import { tutorialManager } from '@/utils/tutorial';

// Define the tutorial step interface with target IDs instead of selectors
interface TutorialStep {
  id: string;
  title: string;
  content: string;
  targetId: string;
  fallbackTargetIds?: string[];
  position?: 'top' | 'bottom' | 'left' | 'right';
  alignment?: 'start' | 'center' | 'end';
  isInteractive?: boolean;
  requiredAction?: ActionType;
  showPointer?: boolean;  
  pointerPosition?: 'top' | 'bottom' | 'left' | 'right';
  showNextButton?: boolean;
  spotlightPadding?: number;
}

// Keep the same tutorial steps from original implementation
// but can be optimized with additional data if needed
const tutorialSteps: TutorialStep[] = [
  // Step 0: Welcome introduction
  {
    id: 'welcome',
    title: 'Welcome to FoodCube Designer!',
    content: 'This interactive tool helps you design custom garden layouts. Let\'s get started with a quick tutorial to show you the main features. Follow the highlighted steps!',
    targetId: 'config-overlay',
    fallbackTargetIds: ['foodcube-configurator', 'configurator-title', 'grid-wrapper'],
    position: 'top',
    alignment: 'center',
  },
  
  // Step 1: Select L-shape (INTERACTIVE)
  {
    id: 'select-preset',
    title: 'Select a Layout',
    content: '👉 CLICK ON THE L-SHAPE BUTTON to begin with a preset layout. This will place several cubes on your grid in an L-shape pattern.',
    targetId: 'preset-l-shape',
    fallbackTargetIds: ['preset-configs'],
    position: 'top',
    alignment: 'center',
    isInteractive: true,
    requiredAction: 'PRESET_APPLIED',
    showNextButton: true,
    showPointer: true,
    pointerPosition: 'left',
    spotlightPadding: 10,
  },
  
  // Step 2: Remove a cube (INTERACTIVE)
  {
    id: 'remove-cube',
    title: 'Remove a Cube',
    content: '👉 Action required: Click on the top-left cube to remove it from the layout.',
    targetId: 'grid-cell-0-0',
    fallbackTargetIds: ['grid-cell-0-1', 'grid-cell-1-0'],
    position: 'right',
    alignment: 'center',
    isInteractive: true,
    requiredAction: 'CUBE_TOGGLED',
    showNextButton: true,
    showPointer: true,
    pointerPosition: 'top',
    spotlightPadding: 10,
  },
  
  // Step 3: Add a cube back (INTERACTIVE)
  {
    id: 'add-cube',
    title: 'Add a Cube',
    content: '👉 Action required: Now click on the same empty cell to add the cube back to your layout.',
    targetId: 'grid-cell-0-0',
    fallbackTargetIds: ['grid-cell-0-1', 'grid-cell-1-0'],
    position: 'right',
    alignment: 'center',
    isInteractive: true,
    requiredAction: 'CUBE_TOGGLED',
    showNextButton: true,
    showPointer: true,
    pointerPosition: 'top',
    spotlightPadding: 10,
  },
  
  // Step 4: Toggle cladding (INTERACTIVE)
  {
    id: 'toggle-cladding',
    title: 'Configure Cladding',
    content: '👉 Action required: Click on this edge panel to toggle the cladding on/off. Cladding panels form the outer walls of your garden.',
    targetId: 'grid-cell-0-0-edge-E',
    fallbackTargetIds: ['grid-cell-0-0-edge-W', 'grid-cell-0-0-edge-N', 'grid-cell-0-0-edge-S'],
    position: 'right',
    alignment: 'center',
    isInteractive: true,
    requiredAction: 'CLADDING_TOGGLED',
    showNextButton: true,
    showPointer: true,
    pointerPosition: 'left',
    spotlightPadding: 5,
  },
  
  // Step 5: Try another preset (INTERACTIVE)
  {
    id: 'try-another-preset',
    title: 'Try Another Layout',
    content: '👉 Action required: Now let\'s try the U-Shape layout. Click on the U-Shape configuration button.',
    targetId: 'preset-u-shape',
    fallbackTargetIds: ['preset-configs'],
    position: 'bottom',
    alignment: 'center',
    isInteractive: true,
    requiredAction: 'PRESET_APPLIED',
    showNextButton: true,
    showPointer: true,
    pointerPosition: 'top',
    spotlightPadding: 10,
  },
  
  // Step 6: Show components
  {
    id: 'components',
    title: 'Required Components',
    content: 'This panel shows all components needed for your design, including panels and connectors. Notice how it updates as you modify your layout.',
    targetId: 'cladding-key',
    position: 'left',
    alignment: 'start',
    spotlightPadding: 10,
  },
  
  // Step 7: Apply design
  {
    id: 'apply',
    title: 'Complete Your Design',
    content: 'When you\'re satisfied with your design, click here to save your configuration.',
    targetId: 'mobile-apply-button',
    position: 'left',
    alignment: 'center',
    spotlightPadding: 15,
  },
  
  // Step 8: Clear option
  {
    id: 'clear',
    title: 'Start Over',
    content: 'You can clear your design and start over at any time using this button.',
    targetId: 'mobile-clear-button',
    position: 'left',
    alignment: 'center',
    spotlightPadding: 10,
  },
];

/**
 * High-performance tutorial component that uses the optimized infrastructure
 * to show tutorial steps with spotlights and tooltips.
 */
export const OptimizedTutorial: React.FC = () => {
  const { 
    showTutorial, 
    currentStep,
    setCurrentStep,
    completeTutorial,
    skipTutorial,
    lastAction,
    manuallyAdvanceStep
  } = useTutorial();
  
  // Track completion of interactive steps
  const [interactiveStepCompleted, setInteractiveStepCompleted] = useState(false);
  
  // Wait a short moment for the app to fully render before starting the tutorial
  const [ready, setReady] = useState(false);
  
  // Flag to track if U-shape was selected
  const [uShapeApplied, setUShapeApplied] = useState(false);
  
  // Initialize tutorial system
  useEffect(() => {
    // Initialize the tutorial system when component mounts
    tutorialManager.initialize();
    
    // Inject critical tutorial styles directly to ensure they're always available
    const injectCriticalStyles = () => {
      // Check if styles are already injected
      if (document.getElementById('tutorial-critical-styles')) return;
      
      // Create style element
      const styleEl = document.createElement('style');
      styleEl.id = 'tutorial-critical-styles';
      
      // Add critical styles for tutorial functionality
      styleEl.textContent = `
        /* Backdrop overlay */
        .tutorial-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9990;
          pointer-events: none;
        }
        
        /* Core spotlight styles */
        .spotlight-target {
          z-index: 9999 !important;
          outline: 3px solid #3b82f6 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.7), 0 0 30px rgba(59, 130, 246, 0.4) !important;
        }
        
        /* Interactive spotlight styles */
        .spotlight-target.interactive {
          outline-color: #f59e0b !important;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.7), 0 0 30px rgba(245, 158, 11, 0.4) !important;
        }
        
        /* Success state */
        .spotlight-target.success {
          outline-color: #10b981 !important;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.7), 0 0 30px rgba(16, 185, 129, 0.4) !important;
        }
        
        /* Tooltip container */
        #tutorial-tooltips-container {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          pointer-events: none !important;
          z-index: 2147483646 !important;
          overflow: visible !important;
        }
        
        /* Tutorial animations */
        @keyframes spotlight-glow {
          0% {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.7), 0 0 0 6px rgba(37, 99, 235, 0.3);
            outline-color: #2563eb;
          }
          50% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.8), 0 0 0 8px rgba(37, 99, 235, 0.4);
            outline-color: #3b82f6;
          }
          100% {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.7), 0 0 0 6px rgba(37, 99, 235, 0.3);
            outline-color: #2563eb;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Makes interactive elements clickable during tutorial */
        body.tutorial-active [data-edge],
        body.tutorial-active [data-has-cube],
        body.tutorial-active [data-testid^="preset"],
        body.tutorial-active button,
        body.tutorial-active a,
        body.tutorial-active input,
        body.tutorial-active select {
          pointer-events: auto !important;
          z-index: 10000 !important;
        }
      `;
      
      // Add to document head
      document.head.appendChild(styleEl);
      
      console.log('[OptimizedTutorial] Critical tutorial styles injected');
    };
    
    // Inject styles
    injectCriticalStyles();
    
    // Set up a short delay before marking the tutorial as ready
    const timer = setTimeout(() => {
      setReady(true);
    }, 500);
    
    return () => {
      clearTimeout(timer);
      // Clean up tutorial system when component unmounts
      tutorialManager.cleanup();
      
      // Optionally remove injected styles on unmount
      // const styleEl = document.getElementById('tutorial-critical-styles');
      // if (styleEl) styleEl.remove();
    };
  }, []);
  
  // Set tutorial active state based on showTutorial flag
  useEffect(() => {
    tutorialManager.setTutorialActive(showTutorial && ready);
    
    // Add body class when tutorial is active
    if (showTutorial && ready) {
      document.body.classList.add('tutorial-active');
    } else {
      document.body.classList.remove('tutorial-active');
    }
    
    return () => {
      document.body.classList.remove('tutorial-active');
    };
  }, [showTutorial, ready]);
  
  // Check if the action satisfies the current step's requirements
  const checkActionForStep = (step: TutorialStep, action: TutorialAction | null): boolean => {
    if (!action || !step.requiredAction) return false;
    
    // Check if action type matches the required type
    if (action.type !== step.requiredAction) return false;
    
    // For specific actions, check additional conditions
    switch (action.type) {
      case 'CUBE_TOGGLED':
        // For step 2 (remove cube), check if a cube was removed
        if (currentStep === 2 && action.payload && 'action' in action.payload) {
          return action.payload.action === 'removed';
        }
        // For step 3 (add cube), check if a cube was added
        else if (currentStep === 3 && action.payload && 'action' in action.payload) {
          return action.payload.action === 'added';
        }
        return true;
        
      case 'PRESET_APPLIED':
        // For step 1 (select L-shape), check if L-shape was selected
        if (currentStep === 1 && action.payload && 'presetName' in action.payload) {
          return action.payload.presetName === 'l-shape';
        }
        // For step 5 (try another preset), check if U-shape was selected
        else if (currentStep === 5 && action.payload && 'presetName' in action.payload) {
          return action.payload.presetName === 'u-shape'; // specifically require U-shape
        }
        return true;
        
      default:
        return true;
    }
  };
  
  // Initialize uShapeApplied based on lastAction if needed
  useEffect(() => {
    if (lastAction?.type === 'PRESET_APPLIED' && 
        lastAction.payload && 'presetName' in lastAction.payload && 
        lastAction.payload.presetName === 'u-shape') {
      setUShapeApplied(true);
    }
  }, [lastAction]);
  
  // Monitor lastAction to auto-advance interactive steps
  useEffect(() => {
    if (!showTutorial || !ready || currentStep >= tutorialSteps.length) return;
    
    const currentTutorialStep = tutorialSteps[currentStep];
    
    // Always check if U-shape was applied, regardless of current step
    if (uShapeApplied) {
      // If we're on steps 2, 3, or 4 (remove cube, add cube, toggle cladding), skip to step 6 (components)
      if (currentStep >= 2 && currentStep < 6) {
        setCurrentStep(6); // Skip to components step
        return;
      }
    }
    
    // Only check for completion if this is an interactive step
    if (currentTutorialStep.isInteractive && lastAction) {
      const actionSatisfiesStep = checkActionForStep(currentTutorialStep, lastAction);
      
      if (actionSatisfiesStep) {
        // If this is the U-shape step that was completed
        if (currentStep === 5 && lastAction.type === 'PRESET_APPLIED' && 
            lastAction.payload && 'presetName' in lastAction.payload && 
            lastAction.payload.presetName === 'u-shape') {
          setUShapeApplied(true);
        }
        
        // Show success animation on the target element
        const targetElement = document.querySelector(`[data-testid="${currentTutorialStep.targetId}"]`) ||
                             document.getElementById(currentTutorialStep.targetId);
        
        if (targetElement) {
          // Add temporary success class
          targetElement.classList.add('spotlight-target', 'success');
          
          // Remove after animation completes
          setTimeout(() => {
            targetElement.classList.remove('success');
          }, 1500);
        }
        
        setInteractiveStepCompleted(true);
      }
    }
  }, [showTutorial, ready, currentStep, lastAction, uShapeApplied, setCurrentStep]);
  
  // Auto-advance to next step when interactive steps are completed
  useEffect(() => {
    if (interactiveStepCompleted && currentStep < tutorialSteps.length) {
      // Wait a moment for the user to see the result of their action
      const timer = setTimeout(() => {
        // If U-shape was just applied, skip to components step
        if (uShapeApplied && currentStep === 5) {
          setCurrentStep(6);
        } else {
          setCurrentStep(currentStep + 1);
        }
        setInteractiveStepCompleted(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [interactiveStepCompleted, currentStep, setCurrentStep, uShapeApplied]);
  
  // Handle navigation
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      // If current step is before components but U-shape was applied, skip to components
      if (uShapeApplied && currentStep < 6) {
        setCurrentStep(6);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      completeTutorial();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      // If currently at components step and U-shape was applied, go back to U-shape step
      if (uShapeApplied && currentStep === 6) {
        setCurrentStep(5);
      } else if (uShapeApplied && currentStep < 6) {
        // Don't allow going back to steps that should be skipped
        setCurrentStep(5);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };
  
  if (!ready || !showTutorial || currentStep >= tutorialSteps.length) {
    return null;
  }
  
  const currentTutorialStep = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  
  return (
    <>
      {/* Backdrop overlay */}
      {showTutorial && ready && (
        <div
          className="tutorial-backdrop"
          aria-hidden="true"
          onClick={currentTutorialStep.isInteractive ? undefined : handleNext}
        />
      )}
      
      {/* Spotlight overlay */}
      <OptimizedSpotlight
        targetId={currentTutorialStep.targetId}
        fallbackTargetIds={currentTutorialStep.fallbackTargetIds}
        isActive={true}
        showPointer={currentTutorialStep.showPointer}
        pointerPosition={currentTutorialStep.pointerPosition || 'top'}
        zIndex={10000}
        padding={currentTutorialStep.spotlightPadding}
        isInteractive={currentTutorialStep.isInteractive}
      />
      
      {/* Tooltip */}
      <OptimizedTutorialTooltip
        title={currentTutorialStep.title}
        content={currentTutorialStep.content}
        isVisible={showTutorial}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={skipTutorial}
        isInteractive={currentTutorialStep.isInteractive}
        showNextButton={currentTutorialStep.showNextButton !== false}
        showBackButton={currentStep > 0}
        showSkipButton={true}
        isLastStep={isLastStep}
        targetId={currentTutorialStep.targetId}
        fallbackTargetIds={currentTutorialStep.fallbackTargetIds}
        position={currentTutorialStep.position || 'top'}
        alignment={currentTutorialStep.alignment || 'center'}
        zIndex={100000000000}
      />
    </>
  );
};

export default OptimizedTutorial;