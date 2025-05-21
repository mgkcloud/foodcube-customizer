import { StyleDefinition } from './types';

/**
 * Manages style application and restoration for tutorial elements with
 * batched operations for optimal performance.
 */
export class StyleManager {
  // Store original styles to restore them later
  private originalStyles: WeakMap<HTMLElement, Record<string, string>> = new WeakMap();
  
  // Track elements with active styling
  private activeElements: Set<HTMLElement> = new Set();
  
  // Track pending style operations for batching
  private pendingOperations: Map<HTMLElement, {
    styles: StyleDefinition,
    operation: 'apply' | 'restore'
  }> = new Map();
  
  // Animation frame request reference
  private frameRequest: number | null = null;
  
  /**
   * Registers an element for style management
   * @param element The element to register
   */
  registerElement(element: HTMLElement): void {
    if (!this.originalStyles.has(element)) {
      this.storeOriginalStyles(element);
    }
  }
  
  /**
   * Apply styles to an element with batched operations
   * @param element The target element
   * @param styles The styles to apply
   * @param immediate Whether to apply styles immediately or batch them
   */
  applyStyles(
    element: HTMLElement, 
    styles: StyleDefinition,
    immediate: boolean = false
  ): void {
    if (!element || !element.isConnected) return;
    
    // Store original styles on first style application
    if (!this.activeElements.has(element)) {
      this.storeOriginalStyles(element);
      this.activeElements.add(element);
    }
    
    if (immediate) {
      // Apply styles immediately for time-critical operations
      this.applyStylesToElement(element, styles);
    } else {
      // Queue styles for batch processing
      this.pendingOperations.set(element, {
        styles,
        operation: 'apply'
      });
      
      this.scheduleUpdate();
    }
  }
  
  /**
   * Restore original styles to an element
   * @param element The element to restore
   * @param immediate Whether to restore immediately or batch the operation
   */
  restoreStyles(
    element: HTMLElement,
    immediate: boolean = false
  ): void {
    if (!element || !this.activeElements.has(element)) return;
    
    const originalStyles = this.originalStyles.get(element);
    if (!originalStyles) return;
    
    if (immediate) {
      // Restore styles immediately
      this.restoreStylesToElement(element);
    } else {
      // Queue style restoration for batch processing
      this.pendingOperations.set(element, {
        styles: {},
        operation: 'restore'
      });
      
      this.scheduleUpdate();
    }
  }
  
  /**
   * Schedule a batched update of styles
   */
  private scheduleUpdate(): void {
    if (this.frameRequest !== null) return;
    
    this.frameRequest = requestAnimationFrame(() => {
      this.processPendingOperations();
      this.frameRequest = null;
    });
  }
  
  /**
   * Process all pending style operations
   */
  private processPendingOperations(): void {
    // Process operations in order
    for (const [element, operation] of this.pendingOperations.entries()) {
      if (!element.isConnected) {
        // Element removed from DOM, clean up
        this.activeElements.delete(element);
        continue;
      }
      
      if (operation.operation === 'apply') {
        this.applyStylesToElement(element, operation.styles);
      } else {
        this.restoreStylesToElement(element);
      }
    }
    
    // Clear pending operations
    this.pendingOperations.clear();
  }
  
  /**
   * Store original styles of an element before modification
   * @param element The element to store styles for
   * @param properties Specific properties to store, or all if not specified
   */
  private storeOriginalStyles(
    element: HTMLElement, 
    properties?: string[]
  ): void {
    if (this.originalStyles.has(element)) return;
    
    const computedStyle = window.getComputedStyle(element);
    const originalStyles: Record<string, string> = {};
    
    // Store all important style properties that might be modified
    const propsToStore = properties || [
      'position',
      'top',
      'left',
      'right',
      'bottom',
      'zIndex',
      'outline',
      'outlineOffset',
      'boxShadow',
      'animation',
      'transform',
      'transition',
      'pointerEvents',
      'visibility',
      'opacity',
      'backgroundColor',
      'borderRadius'
    ];
    
    for (const prop of propsToStore) {
      // Store as camelCase for direct style access
      const camelCaseProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      originalStyles[camelCaseProp] = computedStyle.getPropertyValue(prop);
    }
    
    this.originalStyles.set(element, originalStyles);
  }
  
  /**
   * Apply styles directly to an element
   * @param element The element to style
   * @param styles The styles to apply
   */
  private applyStylesToElement(
    element: HTMLElement,
    styles: StyleDefinition
  ): void {
    // Skip if element is not connected to DOM
    if (!element.isConnected) return;
    
    // For spotlight elements, ensure critical styles are applied directly
    if (element.classList.contains('spotlight-target')) {
      // Apply critical spotlight styles
      // Do not modify position as it can break layouts
      element.style.zIndex = '9999';
      element.style.outline = '3px solid #3b82f6';
      element.style.outlineOffset = '2px';
      element.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.7), 0 0 30px rgba(59, 130, 246, 0.4)';
      
      // Add animation if supported
      try {
        element.style.animation = 'spotlight-glow 1.5s infinite ease-in-out';
      } catch (e) {
        // Animation not supported, fallback to static styles
      }
      
      // Add interactive styles if needed
      if (element.classList.contains('interactive')) {
        element.style.outline = '3px solid #f59e0b';
        element.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.7), 0 0 30px rgba(245, 158, 11, 0.4)';
      }
    }
    
    // Apply each style property
    Object.entries(styles).forEach(([property, value]) => {
      try {
        // Safe casting to any to avoid TypeScript errors with style access
        (element.style as any)[property] = value;
      } catch (error) {
        console.warn(`Failed to apply style property ${property}:`, error);
      }
    });
  }
  
  /**
   * Restore original styles to an element
   * @param element The element to restore
   */
  private restoreStylesToElement(element: HTMLElement): void {
    const originalStyles = this.originalStyles.get(element);
    if (!originalStyles || !element.isConnected) return;
    
    // First remove any CSS classes we added for visual effects
    element.classList.remove('spotlight-target');
    element.classList.remove('tutorial-highlight');
    
    // Remove any animation styles that might have been added directly
    element.style.animation = '';
    element.style.boxShadow = '';
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.transition = '';
    
    // Only restore specific styles that we know are safe to restore
    // This prevents accidentally changing positioning styles that might break layouts
    const safeStylesToRestore = ['zIndex', 'opacity'];
    
    // Restore only safe style properties
    Object.entries(originalStyles).forEach(([property, value]) => {
      try {
        if (safeStylesToRestore.includes(property)) {
          // Safe casting to any to avoid TypeScript errors with style access
          (element.style as any)[property] = value;
        }
      } catch (error) {
        console.warn(`Failed to restore style property ${property}:`, error);
      }
    });
    
    // Remove from active elements
    this.activeElements.delete(element);
    
    // Keep original styles in case we need to restore again
  }
  
  /**
   * Generate spotlight styles for an element
   * @param element The target element
   * @param options Additional options for the spotlight
   * @returns The spotlight style definition
   */
  generateSpotlightStyles(
    element: HTMLElement,
    options: {
      zIndex?: number,
      padding?: number,
      isInteractive?: boolean,
      showSuccess?: boolean
    } = {}
  ): StyleDefinition {
    // Store the original position before we modify anything
    if (!this.originalStyles.has(element)) {
      this.storeOriginalStyles(element);
    }
    
    // Add the spotlight-target class to apply base effects
    element.classList.add('spotlight-target');
    
    // Apply interactive class if this step is interactive
    if (options.isInteractive) {
      element.classList.add('interactive');
    } else {
      element.classList.remove('interactive');
    }
    
    // Apply success class for completed interactions
    if (options.showSuccess) {
      element.classList.add('success');
      
      // Remove success class after animation completes
      setTimeout(() => {
        element.classList.remove('success');
      }, 1500);
    } else {
      element.classList.remove('success');
    }
    
    // Ensure element has higher z-index to be visible
    // but do not modify position which can break layouts
    return {
      zIndex: String(options.zIndex || 9999),
      outlineOffset: `${(options.padding || 2) + 2}px`,
    };
  }
  
  /**
   * Generate tooltip styles based on position
   * @param position The calculated position
   * @param zIndex The z-index to use
   * @returns The tooltip style definition
   */
  generateTooltipStyles(
    position: {
      top: number,
      left: number,
      transform: string
    },
    zIndex: number = 10001
  ): StyleDefinition {
    return {
      position: 'fixed',
      top: `${position.top}px`,
      left: `${position.left}px`,
      transform: position.transform,
      zIndex: String(zIndex),
      transition: 'all 0.3s ease-out',
      opacity: '1'
    };
  }
  
  /**
   * Clean up all style tracking
   */
  cleanup(): void {
    // Restore styles for all active elements
    this.activeElements.forEach(element => {
      if (element.isConnected) {
        this.restoreStylesToElement(element);
      }
    });
    
    // Clear pending operations and cancel frame request
    this.pendingOperations.clear();
    if (this.frameRequest !== null) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }
    
    // Reset tracking collections
    this.activeElements.clear();
    // originalStyles is a WeakMap so it will be garbage collected
  }
  
  /**
   * Add a class to an element in a batched operation
   * @param element The element to add the class to
   * @param className The class to add
   */
  addClass(element: HTMLElement, className: string): void {
    requestAnimationFrame(() => {
      if (element.isConnected) {
        element.classList.add(className);
      }
    });
  }
  
  /**
   * Remove a class from an element in a batched operation
   * @param element The element to remove the class from
   * @param className The class to remove
   */
  removeClass(element: HTMLElement, className: string): void {
    requestAnimationFrame(() => {
      if (element.isConnected) {
        element.classList.remove(className);
      }
    });
  }
  
  /**
   * Apply only visual effects to an element (outline, box-shadow) without position changes
   * @param element The target element
   */
  applyVisualEffectsOnly(element: HTMLElement): void {
    if (!element || !element.isConnected) return;
    
    // Store original styles if not already stored
    if (!this.activeElements.has(element)) {
      this.storeOriginalStyles(element, ['outline', 'boxShadow']);
      this.activeElements.add(element);
    }
    
    // Add spotlight class for CSS animations
    element.classList.add('spotlight-target');
    
    // Apply visual styles directly to ensure they're visible
    // Apply only visual properties, never position or layout properties
    element.style.outline = '3px solid #3b82f6';
    element.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.7), 0 0 30px rgba(59, 130, 246, 0.4)';
    element.style.outlineOffset = '2px';
  }
}