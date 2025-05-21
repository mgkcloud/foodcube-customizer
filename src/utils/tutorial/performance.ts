/**
 * Performance measurement utilities for the tutorial system
 */

/**
 * Class for tracking performance metrics
 */
export class PerformanceTracker {
  private frameTimeHistory: number[] = [];
  private recalculationCounts: number = 0;
  private domReadCounts: number = 0;
  private domWriteCounts: number = 0;
  private startTime: number = 0;
  private isTracking: boolean = false;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameRequest: number | null = null;
  
  /**
   * Start tracking performance
   */
  startTracking(): void {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.startTime = performance.now();
    this.frameTimeHistory = [];
    this.recalculationCounts = 0;
    this.domReadCounts = 0;
    this.domWriteCounts = 0;
    this.frameCount = 0;
    this.lastFrameTime = this.startTime;
    
    // Start monitoring frames
    this.monitorFrames();
    
    // Override key DOM APIs to count operations
    this.setupDOMCounters();
    
    console.log('[PerformanceTracker] Started tracking');
  }
  
  /**
   * Stop tracking and report results
   */
  stopTracking(): PerformanceReport {
    if (!this.isTracking) {
      return this.generateEmptyReport();
    }
    
    this.isTracking = false;
    
    if (this.frameRequest) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }
    
    // Calculate metrics
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    // Calculate FPS and frame time statistics
    const fps = this.frameCount / (duration / 1000);
    const avgFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
    
    // Calculate jank percentage (frames taking > 16ms)
    const jankFrames = this.frameTimeHistory.filter(time => time > 16).length;
    const jankPercentage = (jankFrames / this.frameTimeHistory.length) * 100;
    
    // Generate report
    const report: PerformanceReport = {
      duration,
      fps,
      avgFrameTime,
      minFrameTime: Math.min(...this.frameTimeHistory),
      maxFrameTime: Math.max(...this.frameTimeHistory),
      jankPercentage,
      recalculationCount: this.recalculationCounts,
      domReadCount: this.domReadCounts,
      domWriteCount: this.domWriteCounts
    };
    
    console.log('[PerformanceTracker] Performance report:', report);
    
    // Restore original methods
    this.restoreDOMCounters();
    
    return report;
  }
  
  /**
   * Generate an empty report
   */
  private generateEmptyReport(): PerformanceReport {
    return {
      duration: 0,
      fps: 0,
      avgFrameTime: 0,
      minFrameTime: 0,
      maxFrameTime: 0,
      jankPercentage: 0,
      recalculationCount: 0,
      domReadCount: 0,
      domWriteCount: 0
    };
  }
  
  /**
   * Register a recalculation event
   */
  registerRecalculation(): void {
    if (this.isTracking) {
      this.recalculationCounts++;
    }
  }
  
  /**
   * Register a DOM read operation
   */
  registerDOMRead(): void {
    if (this.isTracking) {
      this.domReadCounts++;
    }
  }
  
  /**
   * Register a DOM write operation
   */
  registerDOMWrite(): void {
    if (this.isTracking) {
      this.domWriteCounts++;
    }
  }
  
  /**
   * Monitor frame times
   */
  private monitorFrames(): void {
    if (!this.isTracking) return;
    
    this.frameRequest = requestAnimationFrame((timestamp) => {
      // Calculate frame time
      const frameTime = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;
      
      // Record frame time for analysis
      this.frameTimeHistory.push(frameTime);
      this.frameCount++;
      
      // Continue monitoring
      this.monitorFrames();
    });
  }
  
  /**
   * Set up DOM operation counters
   */
  private setupDOMCounters(): void {
    // Store originals
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    const originalGetComputedStyle = window.getComputedStyle;
    const originalSetAttribute = Element.prototype.setAttribute;
    const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
    
    // Override to count reads
    Element.prototype.getBoundingClientRect = function() {
      if (window.performanceTracker) {
        (window.performanceTracker as PerformanceTracker).registerDOMRead();
      }
      return originalGetBoundingClientRect.apply(this);
    };
    
    window.getComputedStyle = function() {
      if (window.performanceTracker) {
        (window.performanceTracker as PerformanceTracker).registerDOMRead();
      }
      return originalGetComputedStyle.apply(this, arguments as any);
    };
    
    // Override to count writes
    Element.prototype.setAttribute = function(name, value) {
      if (window.performanceTracker) {
        (window.performanceTracker as PerformanceTracker).registerDOMWrite();
      }
      return originalSetAttribute.apply(this, [name, value]);
    };
    
    CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
      if (window.performanceTracker) {
        (window.performanceTracker as PerformanceTracker).registerDOMWrite();
      }
      return originalSetProperty.apply(this, [property, value, priority as any]);
    };
    
    // Store originals for restoration
    (this as any).originalGetBoundingClientRect = originalGetBoundingClientRect;
    (this as any).originalGetComputedStyle = originalGetComputedStyle;
    (this as any).originalSetAttribute = originalSetAttribute;
    (this as any).originalSetProperty = originalSetProperty;
    
    // Add to window for global access
    window.performanceTracker = this;
  }
  
  /**
   * Restore original DOM methods
   */
  private restoreDOMCounters(): void {
    // Restore original methods
    Element.prototype.getBoundingClientRect = (this as any).originalGetBoundingClientRect;
    window.getComputedStyle = (this as any).originalGetComputedStyle;
    Element.prototype.setAttribute = (this as any).originalSetAttribute;
    CSSStyleDeclaration.prototype.setProperty = (this as any).originalSetProperty;
    
    // Remove from window
    delete window.performanceTracker;
  }
}

/**
 * Performance report interface
 */
export interface PerformanceReport {
  duration: number;
  fps: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  jankPercentage: number;
  recalculationCount: number;
  domReadCount: number;
  domWriteCount: number;
}

// Extend Window interface to include performance tracker
declare global {
  interface Window {
    performanceTracker?: PerformanceTracker;
  }
}

// Create singleton instance
export const performanceTracker = new PerformanceTracker();