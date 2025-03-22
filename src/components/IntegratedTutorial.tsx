import React, { useState, useEffect, useCallback } from 'react';
import { useTutorial, ActionType, TutorialAction } from '@/contexts/TutorialContext';
import IntegratedTutorialTooltip from './IntegratedTutorialTooltip';
import IntegratedSpotlight from './IntegratedSpotlight';
import { throttle } from '@/lib/utils';

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

// Define the tutorial steps
const tutorialSteps: TutorialStep[] = [
  // Step 0: Welcome introduction
  {
    id: 'welcome',
    title: 'Welcome to FoodCube Designer!',
    content: 'This interactive tool helps you design custom garden layouts. Let\'s get started with a quick tutorial to show you the main features. Follow the highlighted steps!',
    targetId: 'config-overlay',
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

export const IntegratedTutorial: React.FC = () => {
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
  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Add a body class when tutorial is active to help with styling
  useEffect(() => {
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
  const checkActionForStep = useCallback((step: TutorialStep, action: TutorialAction | null): boolean => {
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
  }, [currentStep]);

  // Flag to track if U-shape was selected
  const [uShapeApplied, setUShapeApplied] = useState(false);

  // Initialize uShapeApplied based on lastAction if needed
  useEffect(() => {
    if (lastAction?.type === 'PRESET_APPLIED' && 
        lastAction.payload && 'presetName' in lastAction.payload && 
        lastAction.payload.presetName === 'u-shape') {
      console.log('U-shape preset detected, setting flag to skip redundant steps');
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
        console.log('U-shape was applied, skipping from step', currentStep, 'to components step (step 6)');
        setCurrentStep(6); // Skip to components step
        return;
      }
    }
    
    // Only check for completion if this is an interactive step
    if (currentTutorialStep.isInteractive && lastAction) {
      const actionSatisfiesStep = checkActionForStep(currentTutorialStep, lastAction);
      
      if (actionSatisfiesStep) {
        console.log(`Step ${currentStep} completed through action: ${lastAction.type}`);
        
        // If this is the U-shape step that was completed
        if (currentStep === 5 && lastAction.type === 'PRESET_APPLIED' && 
            lastAction.payload && 'presetName' in lastAction.payload && 
            lastAction.payload.presetName === 'u-shape') {
          setUShapeApplied(true);
        }
        
        setInteractiveStepCompleted(true);
      }
    }
  }, [showTutorial, ready, currentStep, lastAction, checkActionForStep, uShapeApplied, setCurrentStep]);

  // Auto-advance to next step when interactive steps are completed
  useEffect(() => {
    if (interactiveStepCompleted && currentStep < tutorialSteps.length) {
      console.log(`Step ${currentStep} completed, moving to next step after delay`);
      
      // Wait a moment for the user to see the result of their action
      const timer = setTimeout(() => {
        // If U-shape was just applied, skip to components step
        if (uShapeApplied && currentStep === 5) {
          console.log(`U-shape was applied, skipping from step ${currentStep} to step 6`);
          setCurrentStep(6);
        } else {
          console.log(`Advancing from step ${currentStep} to ${currentStep + 1}`);
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
      {/* Spotlight overlay */}
      <IntegratedSpotlight
        targetId={currentTutorialStep.targetId}
        fallbackTargetIds={currentTutorialStep.fallbackTargetIds}
        isActive={true}
        allowClickThrough={currentTutorialStep.isInteractive}
        showPointer={currentTutorialStep.showPointer}
        pointerPosition={currentTutorialStep.pointerPosition || 'top'}
        zIndex={10000}
        padding={currentTutorialStep.spotlightPadding}
      />
      
      {/* Tooltip */}
      <IntegratedTutorialTooltip
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

export default IntegratedTutorial;