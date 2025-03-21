import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

// Type definitions for target registration
export type TutorialTarget = HTMLElement;
export type TutorialTargetId = string;
export type TutorialTargetRegistryEntry = {
  element: TutorialTarget;
  ref: React.RefObject<HTMLElement>;
  priority: number;
  ready: boolean;
};

// Tutorial action types
export type ActionType = 
  | 'CUBE_TOGGLED' 
  | 'CLADDING_TOGGLED' 
  | 'PRESET_APPLIED' 
  | 'MANUAL_ADVANCE';

// Action payload types
export type CubeToggledPayload = {
  row: number;
  col: number;
  hasCube: boolean;
  action: 'added' | 'removed';
};

export type CladdingToggledPayload = {
  row: number;
  col: number;
  edge: 'N' | 'E' | 'S' | 'W';
  isActive: boolean;
};

export type PresetAppliedPayload = {
  presetName: string;
};

export type TutorialActionPayload = 
  | CubeToggledPayload
  | CladdingToggledPayload
  | PresetAppliedPayload
  | null;

// Tutorial action object
export type TutorialAction = {
  type: ActionType;
  payload: TutorialActionPayload;
};

// Define the type for our tutorial context
interface TutorialContextType {
  // Basic tutorial state
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  skipTutorial: () => void;
  
  // Target registration system
  registerTarget: (id: TutorialTargetId, element: TutorialTarget, priority?: number) => void;
  unregisterTarget: (id: TutorialTargetId) => void;
  getTarget: (id: TutorialTargetId) => TutorialTarget | null;
  getTargetRef: (id: TutorialTargetId) => React.RefObject<HTMLElement> | null;
  
  // Tutorial action notification system
  notifyTutorial: (action: TutorialAction) => void;
  lastAction: TutorialAction | null;
  
  // Manual advancement
  manuallyAdvanceStep: () => void;
}

// Create the context with a default value
const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Storage keys
const TUTORIAL_COMPLETED_KEY = 'foodcube-tutorial-completed';
const WELCOME_MODAL_SHOWN_KEY = 'foodcube-welcome-modal-shown';

// Provider component
export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for tutorial visibility
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  
  // State for welcome modal visibility
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  
  // State for current step in the tutorial
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // State for last action performed
  const [lastAction, setLastAction] = useState<TutorialAction | null>(null);
  
  // Target registry - stores references to DOM elements by ID
  const [targetRegistry, setTargetRegistry] = useState<Record<TutorialTargetId, TutorialTargetRegistryEntry>>({});
  
  // Get cookie value helper
  const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };
  
  // Set cookie helper
  const setCookie = (name: string, value: string, days: number = 365): void => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + value + expires + "; path=/";
  };
  
  // Check if this is the first visit
  useEffect(() => {
    // First try cookies (persists across browsers)
    const tutorialCompletedCookie = getCookie(TUTORIAL_COMPLETED_KEY);
    const welcomeModalShownCookie = getCookie(WELCOME_MODAL_SHOWN_KEY);
    
    // Fallback to localStorage (for backwards compatibility)
    const tutorialCompletedStorage = localStorage.getItem(TUTORIAL_COMPLETED_KEY);
    const welcomeModalShownStorage = localStorage.getItem(WELCOME_MODAL_SHOWN_KEY);
    
    const tutorialCompleted = tutorialCompletedCookie || tutorialCompletedStorage;
    const welcomeModalShown = welcomeModalShownCookie || welcomeModalShownStorage;
    
    if (!tutorialCompleted && !welcomeModalShown) {
      // First time user, show welcome modal automatically
      console.log('First visit detected, showing welcome modal...');
      setShowWelcomeModal(true);
      
      // Store in both cookie and localStorage
      setCookie(WELCOME_MODAL_SHOWN_KEY, 'true');
      localStorage.setItem(WELCOME_MODAL_SHOWN_KEY, 'true');
    }
  }, []);

  // Register a target element with the tutorial system
  const registerTarget = (id: TutorialTargetId, element: TutorialTarget, priority = 0) => {
    console.log(`Registering tutorial target: ${id}`);
    setTargetRegistry(prev => {
      // Create a new ref object if we don't already have one for this ID
      const existingEntry = prev[id];
      const ref = existingEntry?.ref || React.createRef<HTMLElement>();
      
      // Set the current property of the ref to the element
      if (ref.current !== element) {
        // @ts-ignore - we know element is an HTMLElement
        ref.current = element;
      }
      
      return {
        ...prev,
        [id]: {
          element,
          ref,
          priority,
          ready: true
        }
      };
    });
  };

  // Unregister a target element
  const unregisterTarget = (id: TutorialTargetId) => {
    console.log(`Unregistering tutorial target: ${id}`);
    setTargetRegistry(prev => {
      const newRegistry = { ...prev };
      delete newRegistry[id];
      return newRegistry;
    });
  };

  // Get a target element by ID
  const getTarget = (id: TutorialTargetId): TutorialTarget | null => {
    const entry = targetRegistry[id];
    if (!entry) {
      console.log(`Tutorial target not found: ${id}`);
      return null;
    }
    return entry.element;
  };

  // Get a target element ref by ID
  const getTargetRef = (id: TutorialTargetId): React.RefObject<HTMLElement> | null => {
    const entry = targetRegistry[id];
    if (!entry) {
      console.log(`Tutorial target ref not found: ${id}`);
      return null;
    }
    return entry.ref;
  };

  // Notify the tutorial system of an action
  const notifyTutorial = (action: TutorialAction) => {
    console.log(`Tutorial system notified of action: ${action.type}`, action.payload);
    setLastAction(action);
  };

  // Function to manually advance to the next step
  const manuallyAdvanceStep = () => {
    console.log(`Manually advancing from step ${currentStep} to ${currentStep + 1}`);
    setCurrentStep(prev => {
      // Check if we're at the last step
      // This would need to be updated with the actual number of steps
      const MAX_STEPS = 8;
      if (prev >= MAX_STEPS) {
        completeTutorial();
        return prev;
      }
      return prev + 1;
    });
  };

  // Function to complete the tutorial
  const completeTutorial = () => {
    setShowTutorial(false);
    // Store completion status in both cookie and localStorage
    setCookie(TUTORIAL_COMPLETED_KEY, 'true');
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    console.log('Tutorial completed and marked as done in cookies');
  };

  // Function to reset the tutorial
  const resetTutorial = () => {
    // Clear any stored tutorial completion status
    setCookie(TUTORIAL_COMPLETED_KEY, '', -1); // Expire the cookie
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    console.log('Tutorial reset - cleared completion status');
    
    // Reset to the beginning
    setCurrentStep(0);
    // Show the tutorial
    setShowTutorial(true);
  };

  // Function to skip the tutorial
  const skipTutorial = () => {
    setShowTutorial(false);
    // Store skip status in both cookie and localStorage
    setCookie(TUTORIAL_COMPLETED_KEY, 'true');
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    console.log('Tutorial skipped and marked as done in cookies');
  };

  // Value object that will be passed to consumers
  const value = {
    showTutorial,
    setShowTutorial,
    showWelcomeModal,
    setShowWelcomeModal,
    currentStep,
    setCurrentStep,
    completeTutorial,
    resetTutorial,
    skipTutorial,
    registerTarget,
    unregisterTarget,
    getTarget,
    getTargetRef,
    notifyTutorial,
    lastAction,
    manuallyAdvanceStep
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

// Custom hook to use the tutorial context
export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};