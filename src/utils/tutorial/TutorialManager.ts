import { ElementChangeType, RecalculationTrigger, TutorialElement, TutorialElementConfig } from './types';
import { TutorialElementObserver } from './TutorialElementObserver';
import { PositionCalculator } from './PositionCalculator';
import { StyleManager } from './StyleManager';
import { TutorialRenderLoop } from './TutorialRenderLoop';

/**
 * Main manager class for the high-performance tutorial system.
 * Coordinates all components and provides a simplified API for the application.
 */
export class TutorialManager {
  // Core infrastructure components
  private observer: TutorialElementObserver;
  private positionCalculator: PositionCalculator;
  private styleManager: StyleManager;
  private renderLoop: TutorialRenderLoop;
  
  // Tutorial elements tracking
  private tutorialElements: Map<string, TutorialElement> = new Map();
  private activeTargets: Map<string, HTMLElement> = new Map();
  
  // Flag to track if the tutorial is active
  private isTutorialActive: boolean = false;
  
  // Debug mode
  private debugMode: boolean = false;
  
  /**
   * Creates a new tutorial manager
   */
  constructor() {
    // Initialize infrastructure components
    this.styleManager = new StyleManager();
    this.positionCalculator = new PositionCalculator();
    
    // Create observer with unified callback
    this.observer = new TutorialElementObserver(this.handleElementChange);
    
    // Create render loop
    this.renderLoop = new TutorialRenderLoop(
      this.styleManager,
      this.positionCalculator
    );
    
    // Set up window event listeners with passive flag for better performance
    window.addEventListener('resize', this.handleWindowResize, { passive: true });
    
    // Set up cleanup
    this.setupCleanup();
    
    if (this.debugMode) {
      console.log('[TutorialManager] Initialized');
    }
  }
  
  /**
   * Set debug mode
   * @param enabled Whether debug mode is enabled
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    this.renderLoop.setDebugMode(enabled);
  }
  
  /**
   * Initialize the tutorial system
   */
  initialize(): void {
    // Start render loop
    this.renderLoop.start();
    
    if (this.debugMode) {
      console.log('[TutorialManager] Tutorial system initialized');
    }
  }
  
  /**
   * Handle element changes from the observer
   */
  private handleElementChange = (element: Element, changes: ElementChangeType[]): void => {
    // Skip processing if tutorial is not active
    if (!this.isTutorialActive) return;
    
    // Check if this element is an active target
    let affectedElements: TutorialElement[] = [];
    
    // Find tutorial elements affected by this change
    for (const [targetId, targetElement] of this.activeTargets.entries()) {
      if (targetElement === element || element.contains(targetElement) || targetElement.contains(element)) {
        // Find tutorial elements using this target
        for (const [elementId, tutorialElement] of this.tutorialElements.entries()) {
          if (tutorialElement.isActive && tutorialElement.element === targetElement) {
            affectedElements.push(tutorialElement);
          }
        }
      }
    }
    
    // Determine appropriate recalculation trigger based on change types
    let trigger: RecalculationTrigger | null = null;
    
    if (changes.includes(ElementChangeType.REMOVAL)) {
      // Handle removal - need to find new target
      trigger = RecalculationTrigger.TARGET_MUTATION;
      
      // Remove from active targets
      for (const [targetId, targetElement] of this.activeTargets.entries()) {
        if (targetElement === element) {
          this.activeTargets.delete(targetId);
        }
      }
    } else if (changes.includes(ElementChangeType.SIZE)) {
      trigger = RecalculationTrigger.TARGET_RESIZE;
    } else if (changes.includes(ElementChangeType.POSITION)) {
      trigger = RecalculationTrigger.TARGET_VISIBILITY;
    } else if (changes.includes(ElementChangeType.VISIBILITY)) {
      trigger = RecalculationTrigger.TARGET_VISIBILITY;
    } else if (changes.includes(ElementChangeType.ATTRIBUTES) || changes.includes(ElementChangeType.CHILDREN)) {
      trigger = RecalculationTrigger.TARGET_MUTATION;
    }
    
    // If we have a trigger and affected elements, update them
    if (trigger && affectedElements.length > 0) {
      this.renderLoop.triggerUpdate(trigger, affectedElements);
      
      if (this.debugMode) {
        console.log(`[TutorialManager] Trigger ${trigger} for ${affectedElements.length} elements due to ${changes.join(', ')}`);
      }
    }
  };
  
  /**
   * Handle window resize events
   */
  private handleWindowResize = (): void => {
    if (!this.isTutorialActive) return;
    
    // Only trigger if we're not already processing a frame
    this.renderLoop.triggerUpdate(RecalculationTrigger.WINDOW_RESIZE);
    
    // Invalidate position calculator cache
    this.positionCalculator.invalidateCache();
  };
  
  /**
   * Create a spotlight element
   * @param config The spotlight configuration
   * @returns The tutorial element ID
   */
  createSpotlight(config: TutorialElementConfig): string {
    const {
      targetId,
      fallbackTargetIds = [],
      zIndex = 10000,
      padding = 4,
      isActive = false,
      isInteractive = false
    } = config;
    
    // Find target element
    const targetElement = this.findTarget(targetId, fallbackTargetIds);
    if (!targetElement) {
      if (this.debugMode) {
        console.warn(`[TutorialManager] Could not find target element for spotlight: ${targetId}`);
      }
      return '';
    }
    
    // Create unique ID for the spotlight
    const elementId = `spotlight-${targetId}-${Date.now()}`;
    
    // Create tutorial element
    const tutorialElement: TutorialElement = {
      id: elementId,
      element: targetElement,
      type: 'spotlight',
      isActive,
      needsUpdate: true,
      calculateStyles: (measurement) => {
        return this.styleManager.generateSpotlightStyles(targetElement, {
          zIndex,
          padding,
          isInteractive
        });
      }
    };
    
    // Store element
    this.tutorialElements.set(elementId, tutorialElement);
    
    // Register with observer if active
    if (isActive) {
      this.activateElement(elementId);
    }
    
    return elementId;
  }
  
  /**
   * Create a tooltip element
   * @param config The tooltip configuration
   * @returns The tutorial element ID
   */
  createTooltip(config: TutorialElementConfig): string {
    const {
      targetId,
      fallbackTargetIds = [],
      position = 'top',
      alignment = 'center',
      zIndex = 10001,
      isActive = false
    } = config;
    
    // Find target element
    const targetElement = this.findTarget(targetId, fallbackTargetIds);
    if (!targetElement) {
      if (this.debugMode) {
        console.warn(`[TutorialManager] Could not find target element for tooltip: ${targetId}`);
      }
      return '';
    }
    
    // Create unique ID for the tooltip
    const elementId = `tooltip-${targetId}-${Date.now()}`;
    
    // Create tutorial element
    const tutorialElement: TutorialElement = {
      id: elementId,
      element: targetElement,
      type: 'tooltip',
      isActive,
      needsUpdate: true,
      calculateStyles: (measurement) => {
        // Calculate tooltip position
        const positionResult = this.positionCalculator.calculatePosition({
          targetElement,
          preferredPosition: position as any,
          alignment: alignment as any
        });
        
        // Convert to styles
        return this.styleManager.generateTooltipStyles({
          top: positionResult.top,
          left: positionResult.left,
          transform: positionResult.transform
        }, zIndex);
      }
    };
    
    // Store element
    this.tutorialElements.set(elementId, tutorialElement);
    
    // Register with observer if active
    if (isActive) {
      this.activateElement(elementId);
    }
    
    return elementId;
  }
  
  /**
   * Activate a tutorial element
   * @param elementId The element ID
   */
  activateElement(elementId: string): void {
    const element = this.tutorialElements.get(elementId);
    if (!element) return;
    
    // Force a needsUpdate for initial setup only
    element.needsUpdate = true;
    
    // Update element state
    this.renderLoop.updateElementState(element, true);
    
    // Add to active targets
    this.activeTargets.set(elementId, element.element);
    
    // Only observe position and visibility changes for spotlight elements
    // not size or attribute changes which can cause constant recalculation
    if (element.type === 'spotlight') {
      this.observer.observe(element.element, {
        visibility: true
      });
    } else {
      // For other elements, observe all changes
      this.observer.observe(element.element, {
        attributes: true,
        children: true,
        size: true,
        visibility: true
      });
    }
    
    // Add spotlight class for CSS animations
    if (element.type === 'spotlight') {
      this.styleManager.addClass(element.element, 'spotlight-target');
      
      // Immediately mark spotlight elements as not needing updates
      // to prevent continuous recalculation
      element.needsUpdate = false;
    }
    
    // Add to render loop
    this.renderLoop.addElement(element);
  }
  
  /**
   * Deactivate a tutorial element
   * @param elementId The element ID
   */
  deactivateElement(elementId: string): void {
    const element = this.tutorialElements.get(elementId);
    if (!element) return;
    
    // Update element state
    this.renderLoop.updateElementState(element, false);
    
    // Remove from active targets
    this.activeTargets.delete(elementId);
    
    // Remove spotlight class
    if (element.type === 'spotlight') {
      this.styleManager.removeClass(element.element, 'spotlight-target');
    }
  }
  
  /**
   * Remove a tutorial element
   * @param elementId The element ID
   */
  removeElement(elementId: string): void {
    const element = this.tutorialElements.get(elementId);
    if (!element) return;
    
    // Deactivate first
    this.deactivateElement(elementId);
    
    // Remove from render loop
    this.renderLoop.removeElement(element);
    
    // Remove from tutorial elements
    this.tutorialElements.delete(elementId);
  }
  
  /**
   * Find a target element by ID with fallbacks
   * @param targetId The primary target ID
   * @param fallbackTargetIds Fallback target IDs
   * @returns The found element or null
   */
  private findTarget(targetId: string, fallbackTargetIds: string[] = []): HTMLElement | null {
    // Try primary target first using multiple selector strategies
    const selectors = [
      `[data-testid="${targetId}"]`,
      `[data-cell-id="${targetId}"]`,
      `#${targetId}`,
      `[id="${targetId}"]`,
      `[data-grid-cell="${targetId}"]`,
      `[data-edge-id="${targetId}"]`,
      // Looser matches
      `[data-testid*="${targetId}"]`,
      `[id*="${targetId}"]`,
      // Class-based selectors as fallbacks
      `.${targetId}`,
      `[class*="${targetId}"]`
    ];
    
    // Find all potential targets
    const potentialTargets: HTMLElement[] = [];
    for (const selector of selectors) {
      try {
        const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
        potentialTargets.push(...elements);
      } catch (e) {
        // Ignore invalid selectors
      }
    }
    
    if (potentialTargets.length > 0) {
      // Filter out hidden or zero-size elements
      const visibleTargets = potentialTargets.filter(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && 
               rect.height > 0 && 
               style.display !== 'none' && 
               style.visibility !== 'hidden';
      });
      
      if (visibleTargets.length > 0) {
        // Prioritize exact matches over partial ones
        const exactMatches = visibleTargets.filter(el => 
          el.id === targetId || 
          el.getAttribute('data-testid') === targetId ||
          el.getAttribute('data-cell-id') === targetId
        );
        
        return exactMatches.length > 0 ? exactMatches[0] : visibleTargets[0];
      }
    }
    
    // If primary target not found, try fallbacks in order
    if (fallbackTargetIds.length > 0) {
      for (const fallbackId of fallbackTargetIds) {
        const fallbackElement = this.findTarget(fallbackId, []);
        if (fallbackElement) {
          return fallbackElement;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Set the active state of the tutorial
   * @param isActive Whether the tutorial is active
   */
  setTutorialActive(isActive: boolean): void {
    if (this.isTutorialActive === isActive) return;
    
    this.isTutorialActive = isActive;
    
    if (isActive) {
      // Start render loop
      this.renderLoop.start();
      
      // Add tutorial-active class to body - crucial for spotlight CSS
      document.body.classList.add('tutorial-active');
      
      // Ensure CSS files are loaded
      this.ensureTutorialStylesLoaded();
    } else {
      // Deactivate all elements
      for (const [elementId, element] of this.tutorialElements.entries()) {
        this.deactivateElement(elementId);
      }
      
      // Stop render loop
      this.renderLoop.stop();
      
      // Remove tutorial-active class from body
      document.body.classList.remove('tutorial-active');
    }
  }
  
  /**
   * Ensure the tutorial CSS styles are properly loaded
   */
  private ensureTutorialStylesLoaded(): void {
    // Check if tutorial.css is already loaded
    const isTutorialStyleLoaded = Array.from(document.styleSheets).some(
      sheet => sheet.href && sheet.href.includes('tutorial.css')
    );
    
    if (!isTutorialStyleLoaded && this.debugMode) {
      console.warn('[TutorialManager] Tutorial styles may not be loaded properly');
    }
    
    // Force a repaint to ensure CSS animations take effect
    setTimeout(() => {
      if (this.isTutorialActive) {
        const elements = document.querySelectorAll('.spotlight-target');
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            // Temporarily toggle class to force a repaint
            el.classList.remove('spotlight-target');
            void el.offsetWidth; // Trigger reflow
            el.classList.add('spotlight-target');
            
            // Also apply spotlight styles directly
            el.style.animation = 'spotlight-glow 1.5s infinite ease-in-out';
            el.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.7), 0 0 30px rgba(59, 130, 246, 0.4)';
            el.style.outline = '3px solid #3b82f6';
            el.style.outlineOffset = '2px';
          }
        });
      }
    }, 100);
  }
  
  /**
   * Get the active state of the tutorial
   * @returns Whether the tutorial is active
   */
  getTutorialActiveState(): boolean {
    return this.isTutorialActive;
  }
  
  /**
   * Manual trigger for updates
   * @param trigger The recalculation trigger
   */
  triggerUpdate(trigger: RecalculationTrigger): void {
    this.renderLoop.triggerUpdate(trigger);
  }
  
  /**
   * Clean up all resources used by the tutorial manager
   */
  cleanup(): void {
    // Stop render loop
    this.renderLoop.stop();
    
    // Disconnect observer
    this.observer.disconnect();
    
    // Clean up style manager
    this.styleManager.cleanup();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleWindowResize);
    
    // Reset state
    this.tutorialElements.clear();
    this.activeTargets.clear();
    this.isTutorialActive = false;
    
    // Remove tutorial-active class from body
    document.body.classList.remove('tutorial-active');
    
    if (this.debugMode) {
      console.log('[TutorialManager] Cleanup completed');
    }
  }
  
  /**
   * Set up cleanup for when the tutorial manager is no longer needed
   */
  private setupCleanup(): void {
    // Clean up when window unloads
    window.addEventListener('unload', () => this.cleanup(), { once: true });
  }
  
  /**
   * Show success animation on a spotlight element
   * @param elementId The spotlight element ID
   */
  showSuccessState(elementId: string): void {
    const element = this.tutorialElements.get(elementId);
    if (!element || element.type !== 'spotlight') return;
    
    // Update the element's style calculation function
    const originalCalculateStyles = element.calculateStyles;
    
    // Temporarily override style calculation to include success state
    element.calculateStyles = (measurement) => {
      const styles = originalCalculateStyles(measurement);
      return {
        ...styles,
        ...this.styleManager.generateSpotlightStyles(element.element, {
          showSuccess: true,
          isInteractive: false // Always reset to non-interactive during success state
        })
      };
    };
    
    // Trigger update to show success state
    this.renderLoop.triggerUpdate(RecalculationTrigger.MANUAL_TRIGGER);
    
    // Reset style calculation function after animation completes
    setTimeout(() => {
      if (this.tutorialElements.has(elementId)) {
        element.calculateStyles = originalCalculateStyles;
        this.renderLoop.triggerUpdate(RecalculationTrigger.MANUAL_TRIGGER);
      }
    }, 1500);
  }
}