import { ElementMeasurements, PositionParams, PositionResult } from './types';

/**
 * A high performance position calculator with memoization
 * for tutorial elements like spotlights and tooltips.
 */
export class PositionCalculator {
  private positionCache: Map<string, PositionResult> = new Map();
  private measurementCache: WeakMap<HTMLElement, ElementMeasurements> = new WeakMap();
  
  // Cache validity duration in ms
  private readonly CACHE_VALIDITY_DURATION = 500;
  private lastCacheClear: number = Date.now();
  
  /**
   * Calculates the position of a tutorial element, using cached results when inputs haven't changed
   * @param params The position calculation parameters
   * @returns The calculated position
   */
  calculatePosition(params: PositionParams): PositionResult {
    // Check if we need to clear stale cache entries
    this.checkCacheValidity();
    
    // Generate cache key based on inputs that affect position
    const cacheKey = this.generateCacheKey(params);
    
    // Return cached result if available
    if (this.positionCache.has(cacheKey)) {
      return this.positionCache.get(cacheKey)!;
    }
    
    // If no cached result, perform the full calculation
    const result = this.performCalculation(params);
    
    // Cache the result for future use
    this.positionCache.set(cacheKey, result);
    
    return result;
  }
  
  /**
   * Perform the actual position calculation
   * @param params Position calculation parameters
   * @returns The calculated position result
   */
  private performCalculation(params: PositionParams): PositionResult {
    const {
      targetElement,
      containerElement = document.body,
      preferredPosition = 'top',
      alignment = 'center',
      padding = 0,
      offset = 10
    } = params;
    
    // Get or measure the target element
    const measurements = this.measureElement(targetElement);
    const targetRect = measurements.rect;
    
    // Default tooltip/spotlight dimensions (can be adjusted based on content)
    const elementWidth = preferredPosition === 'left' || preferredPosition === 'right' 
      ? 264  // Width for side tooltips
      : targetRect.width + (padding * 2); // Width for top/bottom tooltips or spotlight
      
    const elementHeight = preferredPosition === 'top' || preferredPosition === 'bottom'
      ? 150  // Height for top/bottom tooltips
      : targetRect.height + (padding * 2); // Height for side tooltips or spotlight
    
    // Get container bounds
    const containerRect = containerElement.getBoundingClientRect();
    const viewportBounds = {
      top: containerRect.top,
      left: containerRect.left,
      right: containerRect.right,
      bottom: containerRect.bottom,
      width: containerRect.width,
      height: containerRect.height
    };
    
    // Calculate initial position based on preferred position
    let top = 0;
    let left = 0;
    let transform = '';
    let finalPosition = preferredPosition;
    
    switch (preferredPosition) {
      case 'top':
        top = targetRect.top - elementHeight - offset;
        left = targetRect.left + (targetRect.width / 2);
        transform = 'translateX(-50%)';
        break;
      case 'bottom':
        top = targetRect.bottom + offset;
        left = targetRect.left + (targetRect.width / 2);
        transform = 'translateX(-50%)';
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2);
        left = targetRect.left - elementWidth - offset;
        transform = 'translateY(-50%)';
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2);
        left = targetRect.right + offset;
        transform = 'translateY(-50%)';
        break;
    }
    
    // Apply alignment adjustments
    if (preferredPosition === 'top' || preferredPosition === 'bottom') {
      if (alignment === 'start') {
        left = targetRect.left + padding;
        transform = '';
      } else if (alignment === 'end') {
        left = targetRect.right - elementWidth - padding;
        transform = '';
      }
    } else if (preferredPosition === 'left' || preferredPosition === 'right') {
      if (alignment === 'start') {
        top = targetRect.top + padding;
        transform = '';
      } else if (alignment === 'end') {
        top = targetRect.bottom - elementHeight - padding;
        transform = '';
      }
    }
    
    // Check for viewport overflow and adjust position if needed
    // The order of checks is important to handle cases where both dimensions overflow
    
    // Top overflow
    if (top < viewportBounds.top + 10) {
      if (preferredPosition === 'top') {
        // Flip to bottom
        finalPosition = 'bottom';
        top = targetRect.bottom + offset;
      } else {
        // Move inside viewport with margin
        finalPosition = 'inside-top';
        top = viewportBounds.top + 10;
        transform = transform.replace('translateY(-50%)', '');
      }
    }
    
    // Bottom overflow
    else if (top + elementHeight > viewportBounds.bottom - 10) {
      if (preferredPosition === 'bottom') {
        // Flip to top
        finalPosition = 'top';
        top = targetRect.top - elementHeight - offset;
      } else {
        // Move inside viewport with margin
        finalPosition = 'inside-bottom';
        top = viewportBounds.bottom - elementHeight - 10;
        transform = transform.replace('translateY(-50%)', '');
      }
    }
    
    // Left overflow
    if (left < viewportBounds.left + 10) {
      if (preferredPosition === 'left') {
        // Flip to right
        finalPosition = 'right';
        left = targetRect.right + offset;
      } else {
        // Move inside viewport with margin
        finalPosition = 'inside-left';
        left = viewportBounds.left + 10;
        transform = transform.replace('translateX(-50%)', '');
      }
    }
    
    // Right overflow
    else if (left + elementWidth > viewportBounds.right - 10) {
      if (preferredPosition === 'right') {
        // Flip to left
        finalPosition = 'left';
        left = targetRect.left - elementWidth - offset;
      } else {
        // Move inside viewport with margin
        finalPosition = 'inside-right';
        left = viewportBounds.right - elementWidth - 10;
        transform = transform.replace('translateX(-50%)', '');
      }
    }
    
    // Calculate arrow position based on final positioning
    const arrowPosition = this.calculateArrowPosition(finalPosition, alignment);
    
    return {
      top,
      left,
      width: elementWidth,
      height: elementHeight,
      position: finalPosition,
      transform,
      arrowPosition
    };
  }
  
  /**
   * Calculate the arrow position for tooltips
   * @param position The final position of the tooltip
   * @param alignment The alignment of the tooltip
   * @returns The arrow position properties
   */
  private calculateArrowPosition(
    position: 'top' | 'bottom' | 'left' | 'right' | 'inside-top' | 'inside-bottom' | 'inside-left' | 'inside-right', 
    alignment: 'start' | 'center' | 'end'
  ): PositionResult['arrowPosition'] {
    switch (position) {
      case 'top':
        // Arrow at the bottom of the tooltip
        return {
          bottom: '-6px',
          left: alignment === 'start' ? '12px' : alignment === 'end' ? 'calc(100% - 12px)' : '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'bottom':
        // Arrow at the top of the tooltip
        return {
          top: '-6px',
          left: alignment === 'start' ? '12px' : alignment === 'end' ? 'calc(100% - 12px)' : '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'left':
        // Arrow at the right of the tooltip
        return {
          right: '-6px',
          top: alignment === 'start' ? '12px' : alignment === 'end' ? 'calc(100% - 12px)' : '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        };
      case 'right':
        // Arrow at the left of the tooltip
        return {
          left: '-6px',
          top: alignment === 'start' ? '12px' : alignment === 'end' ? 'calc(100% - 12px)' : '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        };
      case 'inside-top':
        // Arrow at the top of the tooltip pointing up
        return {
          top: '-6px',
          left: alignment === 'start' ? '12px' : alignment === 'end' ? 'calc(100% - 12px)' : '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'inside-bottom':
        // Arrow at the bottom of the tooltip pointing down
        return {
          bottom: '-6px',
          left: alignment === 'start' ? '12px' : alignment === 'end' ? 'calc(100% - 12px)' : '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        };
      case 'inside-left':
        // Arrow at the left of the tooltip pointing left
        return {
          left: '-6px',
          top: alignment === 'start' ? '12px' : alignment === 'end' ? 'calc(100% - 12px)' : '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        };
      case 'inside-right':
        // Arrow at the right of the tooltip pointing right
        return {
          right: '-6px',
          top: alignment === 'start' ? '12px' : alignment === 'end' ? 'calc(100% - 12px)' : '50%',
          transform: 'translateY(-50%) rotate(45deg)',
        };
      default:
        return {
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        };
    }
  }
  
  /**
   * Generate a cache key based on the relevant input parameters
   * @param params Position calculation parameters
   * @returns A string key for the position cache
   */
  private generateCacheKey(params: PositionParams): string {
    const {
      targetElement,
      containerElement = document.body,
      preferredPosition = 'top',
      alignment = 'center',
      padding = 0,
      offset = 10
    } = params;
    
    // Measure the elements
    const measurements = this.measureElement(targetElement);
    const containerMeasurements = containerElement ? this.measureElement(containerElement) : null;
    
    // Include all factors that would affect positioning in the cache key
    return JSON.stringify({
      targetRect: {
        top: Math.round(measurements.rect.top),
        left: Math.round(measurements.rect.left),
        width: Math.round(measurements.rect.width),
        height: Math.round(measurements.rect.height),
      },
      containerRect: containerMeasurements ? {
        top: Math.round(containerMeasurements.rect.top),
        left: Math.round(containerMeasurements.rect.left),
        width: Math.round(containerMeasurements.rect.width),
        height: Math.round(containerMeasurements.rect.height),
      } : null,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      scrollPosition: {
        scrollX: window.scrollX,
        scrollY: window.scrollY
      },
      preferredPosition,
      alignment,
      padding,
      offset
    });
  }
  
  /**
   * Measure an element and cache the measurements
   * @param element The element to measure
   * @returns The element measurements
   */
  measureElement(element: HTMLElement): ElementMeasurements {
    const now = Date.now();
    const cachedMeasurement = this.measurementCache.get(element);
    
    // If we have a recent cached measurement, use it
    if (cachedMeasurement && now - (cachedMeasurement as any).timestamp < 100) {
      return cachedMeasurement;
    }
    
    // Otherwise, perform all DOM reads together to avoid layout thrashing
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    const scrollParent = this.getScrollParent(element);
    
    const measurements: ElementMeasurements = {
      rect,
      computedStyle,
      scrollPosition: {
        scrollTop: scrollParent ? scrollParent.scrollTop : window.scrollY,
        scrollLeft: scrollParent ? scrollParent.scrollLeft : window.scrollX
      },
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      isVisible: this.isElementVisible(element),
      zIndex: this.getZIndex(element)
    };
    
    // Add timestamp for cache validity checking
    (measurements as any).timestamp = now;
    
    // Cache the measurements
    this.measurementCache.set(element, measurements);
    
    return measurements;
  }
  
  /**
   * Find the nearest scrollable parent of an element
   * @param element The element to find the scroll parent for
   * @returns The scroll parent element or null
   */
  private getScrollParent(element: HTMLElement): HTMLElement | null {
    if (!element) return null;
    
    let parent = element.parentElement;
    while (parent) {
      const overflow = window.getComputedStyle(parent).overflow;
      if (overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay') {
        return parent;
      }
      parent = parent.parentElement;
    }
    
    return document.scrollingElement as HTMLElement || document.documentElement;
  }
  
  /**
   * Check if an element is visible in the viewport
   * @param element The element to check
   * @returns Whether the element is visible
   */
  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.isConnected
    );
  }
  
  /**
   * Get the effective z-index of an element
   * @param element The element to get the z-index for
   * @returns The effective z-index
   */
  private getZIndex(element: HTMLElement): number {
    let current = element;
    let zIndex = 0;
    
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const currentZIndex = parseInt(style.zIndex);
      
      if (!isNaN(currentZIndex) && currentZIndex > zIndex) {
        zIndex = currentZIndex;
      }
      
      current = current.parentElement as HTMLElement;
    }
    
    return zIndex;
  }
  
  /**
   * Check if cache entries need to be cleared due to age
   */
  private checkCacheValidity(): void {
    const now = Date.now();
    
    // Clear cache periodically to prevent memory buildup
    if (now - this.lastCacheClear > this.CACHE_VALIDITY_DURATION) {
      this.invalidateCache();
      this.lastCacheClear = now;
    }
  }
  
  /**
   * Invalidate the position cache
   */
  invalidateCache(): void {
    this.positionCache.clear();
    // We don't clear the measurement cache as it's a WeakMap
    // and will be garbage collected when elements are removed
  }
}