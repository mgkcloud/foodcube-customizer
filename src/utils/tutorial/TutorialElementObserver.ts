import { ElementChangeType, ObserverData } from './types';

/**
 * Unified observer for tutorial elements that efficiently tracks DOM changes
 * using various browser APIs with minimal performance impact.
 */
export class TutorialElementObserver {
  private intersectionObserver: IntersectionObserver;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver;
  private observedElements: WeakMap<Element, ObserverData> = new WeakMap();
  private pendingUpdate: boolean = false;
  private updateQueue: Map<Element, Set<ElementChangeType>> = new Map();
  
  // Threshold for determining significant size changes
  private readonly RESIZE_THRESHOLD = 2; // px
  
  // Performance flags
  private scrollTicking: boolean = false;
  private lastScrollTime: number = 0;
  private readonly SCROLL_STABILIZATION_THRESHOLD = 150; // ms

  /**
   * Creates a new observer instance with unified callback for all change types
   * @param onElementChange Callback triggered when an observed element changes
   */
  constructor(private onElementChange: (element: Element, changes: ElementChangeType[]) => void) {
    // Initialize ResizeObserver if supported by browser
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.handleResize);
    }
    
    // Initialize IntersectionObserver for visibility detection
    this.intersectionObserver = new IntersectionObserver(this.handleIntersection, {
      threshold: [0, 0.1, 0.5, 1.0], // Multiple thresholds for more precise visibility detection
      rootMargin: '0px'
    });
    
    // Initialize MutationObserver for DOM changes
    this.mutationObserver = new MutationObserver(this.handleMutation);
    
    // Set up global window listeners with passive flags for performance
    window.addEventListener('resize', this.handleWindowResize, { passive: true });
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    
    // Ensure observers are properly cleaned up
    this.setupCleanup();
  }
  
  /**
   * Start observing an element for specified changes
   * @param element The DOM element to observe
   * @param options Configuration options for what to observe
   */
  observe(
    element: Element, 
    options: { 
      attributes?: boolean, 
      children?: boolean, 
      size?: boolean, 
      visibility?: boolean 
    } = {
      attributes: true,
      children: true,
      size: true,
      visibility: true
    },
    callback?: (element: Element, changes: ElementChangeType[]) => void
  ): void {
    // Skip if element is not valid
    if (!element || !(element instanceof Element)) {
      console.warn('TutorialElementObserver: Invalid element provided to observe');
      return;
    }
    
    const elementData: ObserverData = this.observedElements.get(element) || {
      element,
      observeAttributes: options.attributes ?? true,
      observeChildren: options.children ?? true,
      observeSize: options.size ?? true,
      observeVisibility: options.visibility ?? true,
      callbacks: new Set(),
      lastBounds: element.getBoundingClientRect(),
      isVisible: this.isElementVisible(element)
    };
    
    // Add callback if provided
    if (callback) {
      elementData.callbacks.add(callback);
    }
    
    // Store element data
    this.observedElements.set(element, elementData);
    
    // Set up the appropriate observers based on options
    if (elementData.observeVisibility) {
      this.intersectionObserver.observe(element);
    }
    
    if (elementData.observeSize && this.resizeObserver) {
      this.resizeObserver.observe(element);
    }
    
    if (elementData.observeAttributes || elementData.observeChildren) {
      this.mutationObserver.observe(element, {
        attributes: elementData.observeAttributes,
        childList: elementData.observeChildren,
        subtree: elementData.observeChildren,
        attributeFilter: ['style', 'class', 'id', 'data-testid']
      });
    }
  }
  
  /**
   * Stop observing a specific element
   * @param element The element to stop observing
   */
  unobserve(element: Element): void {
    if (!element || !this.observedElements.has(element)) return;
    
    // Remove from all observers
    this.intersectionObserver.unobserve(element);
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(element);
    }
    this.mutationObserver.disconnect(); // Will need to re-observe other elements
    
    // Remove from our tracking
    this.observedElements.delete(element);
    
    // Re-observe remaining elements for mutations
    this.reobserveRemainingElements();
  }
  
  /**
   * Check if element is visible within the viewport
   * @param element Element to check visibility
   * @returns Whether the element is visible
   */
  private isElementVisible(element: Element): boolean {
    if (!element.isConnected) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0 &&
      rect.width > 0 &&
      rect.height > 0
    );
  }
  
  /**
   * Re-observe remaining elements after disconnecting MutationObserver
   */
  private reobserveRemainingElements(): void {
    // Get WeakMap elements with DOM query workaround
    const tempElements: Element[] = [];
    // We need to find all observed elements through the DOM since WeakMap doesn't support direct iteration
    document.querySelectorAll('*').forEach(el => {
      if (this.observedElements.has(el)) {
        tempElements.push(el);
      }
    });
    
    // Re-observe mutations for remaining elements
    for (const element of tempElements) {
      const data = this.observedElements.get(element);
      if (!data) continue;
      
      if (data.observeAttributes || data.observeChildren) {
        this.mutationObserver.observe(element, {
          attributes: data.observeAttributes,
          childList: data.observeChildren,
          subtree: data.observeChildren,
          attributeFilter: ['style', 'class', 'id', 'data-testid']
        });
      }
    }
  }
  
  /**
   * Handle intersection changes (visibility)
   */
  private handleIntersection = (entries: IntersectionObserverEntry[]): void => {
    for (const entry of entries) {
      const element = entry.target;
      const data = this.observedElements.get(element);
      if (!data) continue;
      
      const wasVisible = data.isVisible;
      const isVisible = entry.isIntersecting;
      
      // Only notify if visibility actually changed
      if (wasVisible !== isVisible) {
        data.isVisible = isVisible;
        this.queueElementChange(element, ElementChangeType.VISIBILITY);
      }
    }
    
    this.processUpdateQueue();
  };
  
  /**
   * Handle resize changes
   */
  private handleResize = (entries: ResizeObserverEntry[]): void => {
    for (const entry of entries) {
      const element = entry.target;
      const data = this.observedElements.get(element);
      if (!data) continue;
      
      const oldRect = data.lastBounds || element.getBoundingClientRect();
      const newRect = entry.contentRect;
      
      // Check if size change is significant (avoid pixel rounding issues)
      const widthChanged = Math.abs(oldRect.width - newRect.width) > this.RESIZE_THRESHOLD;
      const heightChanged = Math.abs(oldRect.height - newRect.height) > this.RESIZE_THRESHOLD;
      
      if (widthChanged || heightChanged) {
        data.lastBounds = element.getBoundingClientRect(); // Get full rect with position
        this.queueElementChange(element, ElementChangeType.SIZE);
        
        // Position also changes when size changes
        this.queueElementChange(element, ElementChangeType.POSITION);
      }
    }
    
    this.processUpdateQueue();
  };
  
  /**
   * Handle DOM mutations
   */
  private handleMutation = (mutations: MutationRecord[]): void => {
    const changedElements = new Map<Element, Set<ElementChangeType>>();
    
    for (const mutation of mutations) {
      const element = mutation.target as Element;
      const data = this.observedElements.get(element);
      if (!data) continue;
      
      if (mutation.type === 'attributes') {
        this.queueElementChange(element, ElementChangeType.ATTRIBUTES);
        
        // Style/class changes can affect position or visibility
        if (
          mutation.attributeName === 'style' || 
          mutation.attributeName === 'class'
        ) {
          this.queueElementChange(element, ElementChangeType.POSITION);
        }
      } else if (mutation.type === 'childList') {
        this.queueElementChange(element, ElementChangeType.CHILDREN);
      }
    }
    
    this.processUpdateQueue();
  };
  
  /**
   * Handle window resize events
   */
  private handleWindowResize = (): void => {
    if (this.scrollTicking) return;
    
    this.scrollTicking = true;
    requestAnimationFrame(() => {
      // Notify about window resize for ALL observed elements
      // WeakMap doesn't have forEach, so we need to work around this
      // Get all observed elements using this workaround for WeakMap iteration
      const elements: Element[] = [];
      // Can't directly iterate a WeakMap in JS
      document.querySelectorAll('*').forEach(el => {
        if (this.observedElements.has(el)) {
          elements.push(el);
        }
      });
      
      // Queue position changes for all observed elements
      elements.forEach(element => {
        this.queueElementChange(element, ElementChangeType.POSITION);
      });
      
      this.processUpdateQueue();
      this.scrollTicking = false;
    });
  };
  
  /**
   * Handle scroll events with efficient throttling
   */
  private handleScroll = (): void => {
    if (this.scrollTicking) return;
    
    this.scrollTicking = true;
    this.lastScrollTime = Date.now();
    
    requestAnimationFrame(() => {
      // Only emit position changes if scrolling has stabilized
      const now = Date.now();
      if (now - this.lastScrollTime > this.SCROLL_STABILIZATION_THRESHOLD) {
        this.observedElements.forEach((data, element) => {
          // Only check elements that are or might be visible
          if (data.isVisible !== false) {
            const newRect = element.getBoundingClientRect();
            const oldRect = data.lastBounds;
            
            if (oldRect) {
              // Check if position changed significantly
              const positionChanged = 
                Math.abs(oldRect.top - newRect.top) > this.RESIZE_THRESHOLD ||
                Math.abs(oldRect.left - newRect.left) > this.RESIZE_THRESHOLD;
              
              if (positionChanged) {
                data.lastBounds = newRect;
                this.queueElementChange(element, ElementChangeType.POSITION);
              }
            } else {
              data.lastBounds = newRect;
            }
          }
        });
        
        this.processUpdateQueue();
      }
      
      this.scrollTicking = false;
    });
  };
  
  /**
   * Queue element change to be processed in the next animation frame
   */
  private queueElementChange(element: Element, changeType: ElementChangeType): void {
    if (!this.updateQueue.has(element)) {
      this.updateQueue.set(element, new Set());
    }
    
    this.updateQueue.get(element)?.add(changeType);
    
    if (!this.pendingUpdate) {
      this.pendingUpdate = true;
      requestAnimationFrame(() => this.processUpdateQueue());
    }
  }
  
  /**
   * Process all queued element changes
   */
  private processUpdateQueue(): void {
    this.pendingUpdate = false;
    
    // Process each element's changes
    for (const [element, changes] of this.updateQueue.entries()) {
      if (!element.isConnected) {
        // Element was removed from DOM, notify with REMOVAL type
        this.notifyElementChange(element, [ElementChangeType.REMOVAL]);
        this.observedElements.delete(element);
        continue;
      }
      
      // Get callbacks for this element
      const data = this.observedElements.get(element);
      if (!data) continue;
      
      // If there are changes, notify with array of change types
      if (changes.size > 0) {
        this.notifyElementChange(element, Array.from(changes));
      }
    }
    
    // Clear the queue
    this.updateQueue.clear();
  }
  
  /**
   * Notify all callbacks about element changes
   */
  private notifyElementChange(element: Element, changes: ElementChangeType[]): void {
    const data = this.observedElements.get(element);
    if (!data) return;
    
    // Notify the main callback
    this.onElementChange(element, changes);
    
    // Notify element-specific callbacks
    data.callbacks.forEach(callback => {
      callback(element, changes);
    });
  }
  
  /**
   * Clean up all observers
   */
  disconnect(): void {
    this.intersectionObserver.disconnect();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.mutationObserver.disconnect();
    
    window.removeEventListener('resize', this.handleWindowResize);
    window.removeEventListener('scroll', this.handleScroll);
    
    this.observedElements = new WeakMap();
    this.updateQueue.clear();
  }
  
  /**
   * Set up cleanup for when the observer is no longer needed
   */
  private setupCleanup(): void {
    // Clean up observers when window unloads
    window.addEventListener('unload', () => this.disconnect(), { once: true });
  }
}