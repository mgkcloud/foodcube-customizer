import { ElementMeasurements, RecalculationTrigger, TutorialElement } from './types';
import { StyleManager } from './StyleManager';
import { PositionCalculator } from './PositionCalculator';

/**
 * Manages the render loop for tutorial elements with frame-perfect synchronization
 * and batched DOM operations.
 */
export class TutorialRenderLoop {
  private pendingUpdates: Set<TutorialElement> = new Set();
  private frameRequest: number | null = null;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  
  // Performance measurements
  private frameCount: number = 0;
  private totalFrameTime: number = 0;
  private slowFrameCount: number = 0;
  
  // Debug mode
  private debugMode: boolean = false;
  
  /**
   * Creates a new tutorial render loop
   * @param styleManager The style manager for applying and restoring styles
   * @param positionCalculator The position calculator for element positioning
   */
  constructor(
    private styleManager: StyleManager,
    private positionCalculator: PositionCalculator
  ) {}
  
  /**
   * Enable or disable debug mode
   * @param enabled Whether debug mode should be enabled
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
  
  /**
   * Request an update for a tutorial element
   * @param element The element to update
   */
  requestUpdate(element: TutorialElement): void {
    // Only request updates for active elements
    if (!element.isActive) return;
    
    // Mark element as needing update
    element.needsUpdate = true;
    this.pendingUpdates.add(element);
    
    // Schedule an update if not already scheduled
    if (!this.frameRequest && this.isRunning) {
      this.scheduleUpdate();
    }
  }
  
  /**
   * Start the render loop
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.scheduleUpdate();
    
    if (this.debugMode) {
      console.log('[TutorialRenderLoop] Started render loop');
      
      // Reset performance metrics
      this.frameCount = 0;
      this.totalFrameTime = 0;
      this.slowFrameCount = 0;
    }
  }
  
  /**
   * Stop the render loop
   */
  stop(): void {
    this.isRunning = false;
    
    if (this.frameRequest !== null) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }
    
    if (this.debugMode) {
      console.log('[TutorialRenderLoop] Stopped render loop');
      
      // Report performance metrics
      if (this.frameCount > 0) {
        const avgFrameTime = this.totalFrameTime / this.frameCount;
        const slowFramePercentage = (this.slowFrameCount / this.frameCount) * 100;
        
        console.log(`[TutorialRenderLoop] Performance:
          Frames: ${this.frameCount}
          Average frame time: ${avgFrameTime.toFixed(2)}ms
          Slow frames: ${this.slowFrameCount} (${slowFramePercentage.toFixed(2)}%)
        `);
      }
    }
  }
  
  /**
   * Schedule a frame update
   */
  private scheduleUpdate(): void {
    if (this.frameRequest !== null || !this.isRunning) return;
    
    this.frameRequest = requestAnimationFrame(this.processUpdates);
  }
  
  /**
   * Process all pending element updates
   */
  private processUpdates = (timestamp: number): void => {
    this.frameRequest = null;
    
    // Measure frame time for performance monitoring
    const frameStartTime = performance.now();
    const frameDelta = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Process updates only if there are elements to update
    if (this.pendingUpdates.size > 0) {
      // 1. Batch all DOM reads first to avoid layout thrashing
      const measurements = new Map<TutorialElement, ElementMeasurements>();
      
      for (const element of this.pendingUpdates) {
        if (!element.isActive || !element.element.isConnected) {
          // Skip inactive or disconnected elements
          this.pendingUpdates.delete(element);
          continue;
        }
        
        // Measure the element
        const targetElement = element.element;
        measurements.set(element, this.positionCalculator.measureElement(targetElement));
      }
      
      // 2. Then batch all DOM writes
      for (const [element, measurement] of measurements.entries()) {
        if (!element.isActive) continue;
        
        try {
          // Skip position styling for elements with data-tutorial-no-position attribute
          if (element.element.hasAttribute('data-tutorial-no-position')) {
            // For these elements, only apply visual effects like outline and box-shadow
            // but not any position/layout changing styles
            this.styleManager.applyVisualEffectsOnly(element.element);
            element.needsUpdate = false;
            continue;
          }
          
          // Calculate styles based on measurements
          const styles = element.calculateStyles(measurement);
          
          // Check if this is a spotlight element - for those we only need to apply styles once
          // This prevents continuous repositioning that can cause jitter
          if (element.type === 'spotlight' && !element.needsUpdate) {
            // Skip applying styles for stable spotlight elements
            continue;
          }
          
          // Apply styles using the style manager
          this.styleManager.applyStyles(element.element, styles);
          
          // Store last measurement for reference
          element.lastMeasurement = measurement;
          
          // Mark as updated
          element.needsUpdate = false;
        } catch (error) {
          console.error(`[TutorialRenderLoop] Error updating element ${element.id}:`, error);
        }
      }
    }
    
    // Schedule next frame if still running
    if (this.isRunning) {
      this.scheduleUpdate();
    }
    
    // Performance monitoring
    if (this.debugMode) {
      const frameEndTime = performance.now();
      const frameTime = frameEndTime - frameStartTime;
      
      this.frameCount++;
      this.totalFrameTime += frameTime;
      
      // Count frames that take longer than 16ms (60fps threshold)
      if (frameTime > 16) {
        this.slowFrameCount++;
      }
      
      // Log slow frames
      if (frameTime > 50) {
        console.warn(`[TutorialRenderLoop] Slow frame detected: ${frameTime.toFixed(2)}ms`);
      }
    }
  };
  
  /**
   * Trigger updates based on a specific recalculation trigger
   * @param trigger The trigger type
   * @param elements Optional subset of elements to update
   */
  triggerUpdate(
    trigger: RecalculationTrigger, 
    elements?: TutorialElement[]
  ): void {
    // If elements are specified, only update those
    if (elements && elements.length > 0) {
      for (const element of elements) {
        this.requestUpdate(element);
      }
      return;
    }
    
    // Otherwise update all pending elements
    if (this.debugMode) {
      console.log(`[TutorialRenderLoop] Triggering update for: ${trigger}`);
    }
    
    // Request update for all active elements
    for (const element of this.pendingUpdates) {
      if (element.isActive) {
        this.requestUpdate(element);
      }
    }
  }
  
  /**
   * Add a tutorial element to the render loop
   * @param element The element to add
   */
  addElement(element: TutorialElement): void {
    if (element.isActive) {
      this.requestUpdate(element);
    }
  }
  
  /**
   * Remove a tutorial element from the render loop
   * @param element The element to remove
   */
  removeElement(element: TutorialElement): void {
    this.pendingUpdates.delete(element);
    
    // Restore original styles
    this.styleManager.restoreStyles(element.element);
  }
  
  /**
   * Update the active state of a tutorial element
   * @param element The element to update
   * @param isActive Whether the element is active
   */
  updateElementState(element: TutorialElement, isActive: boolean): void {
    // Skip if state hasn't changed
    if (element.isActive === isActive) return;
    
    // Update state
    element.isActive = isActive;
    
    if (isActive) {
      // Add to pending updates if active
      this.requestUpdate(element);
    } else {
      // Remove from pending updates if inactive
      this.pendingUpdates.delete(element);
      
      // Restore original styles
      this.styleManager.restoreStyles(element.element);
    }
  }
  
  /**
   * Clean up all resources used by the render loop
   */
  cleanup(): void {
    // Stop the render loop
    this.stop();
    
    // Clear pending updates
    this.pendingUpdates.clear();
    
    if (this.debugMode) {
      console.log('[TutorialRenderLoop] Cleanup completed');
    }
  }
}