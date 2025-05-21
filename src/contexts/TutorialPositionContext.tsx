import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { throttle } from '@/lib/utils';
import { TutorialTargetId } from './TutorialContext';

// Position types
export type TargetPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: string;
};

export type TooltipPosition = {
  top: number;
  left: number;
  transform: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'inside-top' | 'inside-bottom' | 'inside-left' | 'inside-right';
};

export type ArrowPosition = {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  transform: string;
};

// Container context detection types
export type ContainerContext = {
  container: HTMLElement;
  isModal: boolean;
  hasFixedPosition: boolean;
  scrollParent: HTMLElement;
  viewportBounds: ViewportBounds;
  offsetParent: HTMLElement | null;
  zIndexContext: number;
};

export type ViewportBounds = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

// Priority-based container resolution
export enum ContainerPriority {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

// Positioning service context
interface TutorialPositionContextType {
  // Target finding and container detection
  findTarget: (targetId: TutorialTargetId, fallbackIds?: TutorialTargetId[]) => HTMLElement | null;
  detectContainerContext: (element: HTMLElement) => ContainerContext;
  
  // Spotlight positioning
  calculateSpotlightPosition: (
    targetId: TutorialTargetId, 
    fallbackIds?: TutorialTargetId[], 
    padding?: number
  ) => TargetPosition | null;
  
  // Tooltip positioning
  calculateTooltipPosition: (
    targetId: TutorialTargetId,
    fallbackIds?: TutorialTargetId[],
    preferredPosition?: 'top' | 'bottom' | 'left' | 'right',
    alignment?: 'start' | 'center' | 'end'
  ) => TooltipPosition | null;
  
  // Arrow positioning
  getArrowPosition: (
    position: 'top' | 'bottom' | 'left' | 'right' | 'inside-top' | 'inside-bottom' | 'inside-left' | 'inside-right',
    alignment: 'start' | 'center' | 'end'
  ) => ArrowPosition;
  
  getArrowBorderWidth: (
    position: 'top' | 'bottom' | 'left' | 'right' | 'inside-top' | 'inside-bottom' | 'inside-left' | 'inside-right'
  ) => string;
  
  // Cache management
  clearPositionCache: () => void;
}

// Create the context with a default undefined value
const TutorialPositionContext = createContext<TutorialPositionContextType | undefined>(undefined);

// Type for container candidate evaluation
type ContainerCandidate = {
  element: HTMLElement;
  priority: ContainerPriority;
  reason: string;
};

// Cache for element references and positioning data
type TargetCache = Map<string, {
  element: HTMLElement;
  timestamp: number;
  containerContext?: ContainerContext;
}>;

// Provider component
export const TutorialPositionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Target element cache to reduce DOM queries and improve performance
  const [targetCache] = useState<TargetCache>(new Map());
  
  // Container context cache to improve container detection
  const containerContextCache = useRef<Map<HTMLElement, ContainerContext>>(new Map());
  
  // Cache duration in milliseconds (5 seconds)
  const CACHE_DURATION = 5000;
  
  // Debug logger that respects DEBUG_MODE flag
  const logDebug = (message: string, ...args: any[]) => {
    // Enable this line to see debug messages
    // console.log(`[TutorialPositionContext] ${message}`, ...args);
  };
  
  // Helper to clear outdated entries from cache
  const cleanCache = useCallback(() => {
    const now = Date.now();
    for (const [id, data] of targetCache.entries()) {
      if (now - data.timestamp > CACHE_DURATION) {
        targetCache.delete(id);
      }
    }
  }, [targetCache]);
  
  // Clear the entire position cache
  const clearPositionCache = useCallback(() => {
    targetCache.clear();
    containerContextCache.current.clear();
  }, [targetCache]);
  
  // -- ELEMENT SELECTION LOGIC --
  
  // Find a target element by ID with fallbacks
  const findTarget = useCallback((targetId: TutorialTargetId, fallbackIds: TutorialTargetId[] = []): HTMLElement | null => {
    // Clean outdated cache entries
    cleanCache();
    
    // Check if target is in cache and still connected to DOM
    const cachedTarget = targetCache.get(targetId);
    if (cachedTarget && cachedTarget.element.isConnected) {
      logDebug(`Using cached target for: ${targetId}`);
      return cachedTarget.element;
    }
    
    // Try primary target first using multiple selector strategies
    const allSelectors = [
      // Exact ID matches
      `[data-testid="${targetId}"]`,
      `[data-cell-id="${targetId}"]`,
      `#${targetId}`,
      `[id="${targetId}"]`,
      
      // Grid cell-specific selectors
      `[data-grid-cell="${targetId}"]`,
      
      // Edge-specific selectors
      `[data-edge-id="${targetId}"]`,
      
      // Grid cell edge combined selectors
      `[data-cell-id^="${targetId.split('-edge-')[0]}"] [data-edge="${targetId.split('-edge-')[1]}"]`,
      
      // Attribute contains (more flexible but less specific)
      `[data-testid*="${targetId}"]`,
      `[id*="${targetId}"]`,
      
      // Class-based selectors as fallbacks
      `.${targetId}`,
      `[class*="${targetId}"]`
    ];
    
    // Find all potential targets
    const potentialTargets: HTMLElement[] = [];
    for (const selector of allSelectors) {
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
        
        const targetElement = exactMatches.length > 0 ? exactMatches[0] : visibleTargets[0];
        
        // Cache the found element
        targetCache.set(targetId, {
          element: targetElement, 
          timestamp: Date.now()
        });
        
        logDebug(`Found target for: ${targetId}`);
        return targetElement;
      }
    }
    
    // If primary target not found, try fallbacks in order
    if (fallbackIds.length > 0) {
      for (const fallbackId of fallbackIds) {
        const fallbackElement = findTarget(fallbackId);
        if (fallbackElement) {
          logDebug(`Using fallback target: ${fallbackId}`);
          return fallbackElement;
        }
      }
    }
    
    logDebug(`Could not find tutorial target: ${targetId} or any fallbacks`);
    return null;
  }, [targetCache, cleanCache]);
  
  // -- CONTAINER DETECTION LOGIC --
  
  // Check if an element is a modal container
  const isModalContainer = useCallback((element: HTMLElement): boolean => {
    // Check for modal-specific attributes
    const modalAttributes = [
      '[role="dialog"]',
      '[role="modal"]',
      '.modal',
      '[class*="modal"]',
      '[class*="dialog"]',
      '[class*="overlay"]',
      '#GlobalCladdingCalculatorModal',
      '[data-radix-portal]',
      'dialog'
    ];
    
    return modalAttributes.some(attr => element.matches(attr)) ||
           element.classList.contains('modal') ||
           element.id === 'GlobalCladdingCalculatorModal';
  }, []);
  
  // Check if element has a positioned parent
  const getPositionedParent = useCallback((element: HTMLElement): HTMLElement | null => {
    let current = element.parentElement;
    
    while (current) {
      const style = window.getComputedStyle(current);
      const position = style.getPropertyValue('position');
      
      if (position === 'relative' || position === 'absolute' || position === 'fixed' || position === 'sticky') {
        return current;
      }
      
      current = current.parentElement;
    }
    
    return null;
  }, []);
  
  // Get the z-index context for an element
  const getZIndexContext = useCallback((element: HTMLElement): number => {
    let current: HTMLElement | null = element;
    let highestZIndex = 0;
    
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const zIndex = parseInt(style.getPropertyValue('z-index'));
      
      if (!isNaN(zIndex) && zIndex > highestZIndex) {
        highestZIndex = zIndex;
      }
      
      // Special cases for known high z-index containers
      if (current.id === 'GlobalCladdingCalculatorModal' ||
          current.classList.contains('modal') ||
          current.hasAttribute('role') && current.getAttribute('role') === 'dialog') {
        // Modal containers typically need very high z-index values
        return Math.max(highestZIndex, 10000);
      }
      
      // Check for portals and other special containers that need high z-index
      if (current.hasAttribute('data-radix-portal') ||
          current.classList.contains('foodcube-configurator-embed')) {
        return Math.max(highestZIndex, 9000);
      }
      
      current = current.parentElement;
    }
    
    // Ensure minimum z-index for visibility
    return Math.max(highestZIndex, 1000);
  }, []);
  
  // Get the effective viewport bounds for a container
  const getViewportBounds = useCallback((container: HTMLElement, isModal: boolean): ViewportBounds => {
    // Default to window viewport
    let bounds: ViewportBounds = {
      top: 0,
      left: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    if (container !== document.body && container !== document.documentElement) {
      const containerRect = container.getBoundingClientRect();
      
      bounds = {
        top: containerRect.top,
        left: containerRect.left,
        right: containerRect.right,
        bottom: containerRect.bottom,
        width: containerRect.width,
        height: containerRect.height
      };
    }
    
    // If in a modal, check if we need to account for internal scrolling
    if (isModal) {
      // Check if this modal has scrollable content
      const style = window.getComputedStyle(container);
      const overflow = style.overflow;
      const overflowY = style.overflowY;
      const overflowX = style.overflowX;
      
      const isScrollable = 
        overflow === 'auto' || 
        overflow === 'scroll' ||
        overflowY === 'auto' || 
        overflowY === 'scroll' ||
        overflowX === 'auto' || 
        overflowX === 'scroll';
      
      // Adjust bounds if needed for scrollable modal
      if (isScrollable) {
        bounds.top += container.scrollTop;
        bounds.bottom = bounds.top + container.clientHeight;
        bounds.left += container.scrollLeft;
        bounds.right = bounds.left + container.clientWidth;
      }
    }
    
    return bounds;
  }, []);
  
  // Find the proper scroll container for an element
  const findScrollContainer = useCallback((element: HTMLElement): HTMLElement => {
    let current: HTMLElement | null = element;
    
    // Traverse up to find the first scrollable ancestor
    while (current && current !== document.body && current !== document.documentElement) {
      const style = window.getComputedStyle(current);
      const overflow = style.overflow;
      const overflowY = style.overflowY;
      const overflowX = style.overflowX;
      
      const isScrollable = 
        (overflow === 'auto' || overflow === 'scroll') ||
        (overflowY === 'auto' || overflowY === 'scroll') ||
        (overflowX === 'auto' || overflowX === 'scroll');
      
      const hasScroll = current.scrollHeight > current.clientHeight || 
                        current.scrollWidth > current.clientWidth;
      
      if (isScrollable && hasScroll) {
        return current;
      }
      
      // Check for modal containers specifically
      if (isModalContainer(current)) {
        return current;
      }
      
      current = current.parentElement;
    }
    
    // Default to document if no scrollable container is found
    return document.documentElement;
  }, [isModalContainer]);
  
  // Detect container context for positioning calculations
  const detectContainerContext = useCallback((element: HTMLElement): ContainerContext => {
    // Check for cached container context for this element
    // Use element path or ID as the key for better cache hit rates
    const elementId = element.id || 
                     element.getAttribute('data-testid') || 
                     element.getAttribute('data-cell-id');
    
    // Generate a unique key for the element based on its position in the DOM
    const generateElementPath = (el: HTMLElement): string => {
      const path: string[] = [];
      let currentEl: Node | null = el;
      
      while (currentEl && currentEl !== document.body) {
        if (currentEl instanceof HTMLElement) {
          const tag = currentEl.tagName.toLowerCase();
          const id = currentEl.id ? `#${currentEl.id}` : '';
          const classes = currentEl.className ? `.${currentEl.className.replace(/\s+/g, '.')}` : '';
          path.unshift(`${tag}${id}${classes}`);
        }
        currentEl = currentEl.parentNode;
      }
      
      return path.join(' > ');
    };
    
    const cacheKey = elementId ? element : element;
    
    if (containerContextCache.current.has(cacheKey)) {
      return containerContextCache.current.get(cacheKey)!;
    }
    
    // Candidates for the container
    const containerCandidates: ContainerCandidate[] = [];
    
    // Default baseline - document body
    containerCandidates.push({
      element: document.body,
      priority: ContainerPriority.NONE,
      reason: "Default document body"
    });
    
    // 1. Check if element is in a modal
    let current: HTMLElement | null = element;
    while (current && current !== document.body) {
      if (isModalContainer(current)) {
        containerCandidates.push({
          element: current,
          priority: ContainerPriority.HIGH,
          reason: "Modal container"
        });
        break;
      }
      current = current.parentElement;
    }
    
    // 2. Check if element has a positioned ancestor with height/width
    const positionedParent = getPositionedParent(element);
    if (positionedParent) {
      // Check if it has dimensions that could make it a container
      const rect = positionedParent.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        containerCandidates.push({
          element: positionedParent,
          priority: ContainerPriority.MEDIUM,
          reason: "Positioned parent with dimensions"
        });
      }
    }
    
    // 3. Check for embedding container
    const embedContainer = document.querySelector('.foodcube-configurator-embed');
    if (embedContainer && embedContainer instanceof HTMLElement) {
      containerCandidates.push({
        element: embedContainer,
        priority: ContainerPriority.MEDIUM,
        reason: "Embedding container"
      });
    }
    
    // 4. Check for specific modal ID
    const globalModal = document.getElementById('GlobalCladdingCalculatorModal');
    if (globalModal) {
      containerCandidates.push({
        element: globalModal,
        priority: ContainerPriority.HIGH,
        reason: "Global calculator modal"
      });
    }
    
    // 5. Check for data-scrollable attribute
    const scrollableContainer = element.closest('[data-scrollable="true"]');
    if (scrollableContainer && scrollableContainer instanceof HTMLElement) {
      containerCandidates.push({
        element: scrollableContainer,
        priority: ContainerPriority.HIGH,
        reason: "Data-scrollable container"
      });
    }
    
    // Sort candidates by priority (highest first)
    containerCandidates.sort((a, b) => b.priority - a.priority);
    
    // Select the highest priority container
    const selectedContainer = containerCandidates[0].element;
    const isModal = containerCandidates[0].priority >= ContainerPriority.MEDIUM;
    
    // Determine if container has fixed positioning
    const containerStyle = window.getComputedStyle(selectedContainer);
    const hasFixedPosition = containerStyle.position === 'fixed';
    
    // Find the scroll parent (may be different from the container)
    const scrollParent = findScrollContainer(element);
    
    // Get offset parent for position calculations
    const offsetParent = element.offsetParent as HTMLElement | null;
    
    // Get z-index context for proper stacking
    const zIndexContext = getZIndexContext(element);
    
    // Calculate appropriate viewport bounds
    const viewportBounds = getViewportBounds(selectedContainer, isModal);
    
    // Create the container context object
    const containerContext: ContainerContext = {
      container: selectedContainer,
      isModal,
      hasFixedPosition,
      scrollParent,
      viewportBounds,
      offsetParent,
      zIndexContext
    };
    
    // Cache the result
    containerContextCache.current.set(cacheKey, containerContext);
    
    logDebug('Container context detected:', {
      container: selectedContainer.tagName + (selectedContainer.id ? `#${selectedContainer.id}` : ''),
      isModal,
      hasFixedPosition,
      scrollParentType: scrollParent.tagName + (scrollParent.id ? `#${scrollParent.id}` : ''),
      priority: containerCandidates[0].priority,
      reason: containerCandidates[0].reason
    });
    
    return containerContext;
  }, [isModalContainer, getPositionedParent, findScrollContainer, getViewportBounds, getZIndexContext]);
  
  // -- POSITION CALCULATION LOGIC --
  
  // Calculate spotlight position based on target element
  const calculateSpotlightPosition = useCallback(throttle((
    targetId: TutorialTargetId, 
    fallbackIds: TutorialTargetId[] = [],
    padding: number = 4
  ): TargetPosition | null => {
    // Try to find the target element
    const target = findTarget(targetId, fallbackIds);
    
    // If no target was found, attempt to create a sensible default position
    if (!target) {
      console.log(`[TutorialPosition] Spotlight target not found for ID "${targetId}" or fallbacks [${fallbackIds.join(', ')}]`);
      
      // Look for alternative elements that might work as defaults
      const configurator = document.querySelector('[data-testid="foodcube-configurator"]') as HTMLElement;
      const gridWrapper = document.querySelector('[data-testid="grid-wrapper"]') as HTMLElement;
      const titleElement = document.querySelector('[data-testid="configurator-title"]') as HTMLElement;
      
      let defaultElement = null;
      if (gridWrapper) {
        defaultElement = gridWrapper;
      } else if (configurator) {
        defaultElement = configurator;
      } else if (titleElement) {
        defaultElement = titleElement;
      }
      
      // If we found a reasonable default element, use it
      if (defaultElement) {
        try {
          const rect = defaultElement.getBoundingClientRect();
          console.log(`[TutorialPosition] Using fallback element for spotlight: ${defaultElement.tagName}`);
          
          return {
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + (padding * 2),
            height: rect.height + (padding * 2),
            borderRadius: '8px' // Default border radius
          };
        } catch (e) {
          console.error('Failed to use fallback element for spotlight', e);
        }
      }
      
      // Last resort fallback: center of the window
      console.log('[TutorialPosition] Using window center as fallback for spotlight');
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const defaultWidth = viewportWidth * 0.7;
      const defaultHeight = viewportHeight * 0.6;
      
      return {
        top: (viewportHeight - defaultHeight) / 2,
        left: (viewportWidth - defaultWidth) / 2,
        width: defaultWidth,
        height: defaultHeight,
        borderRadius: '8px'
      };
    }
    
    try {
      // Get container context
      const containerContext = detectContainerContext(target);
      
      // Get element coordinates
      const targetRect = target.getBoundingClientRect();
      
      // Calculate position differently based on container type
      let top: number;
      let left: number;
      
      if (containerContext.isModal && containerContext.hasFixedPosition) {
        // For fixed modals, use position relative to viewport
        top = targetRect.top - padding;
        left = targetRect.left - padding;
      } else if (containerContext.isModal) {
        // For absolute/non-fixed modals, use position relative to container
        const containerRect = containerContext.container.getBoundingClientRect();
        top = targetRect.top - containerRect.top - padding;
        left = targetRect.left - containerRect.left - padding;
      } else {
        // For standard document flow, account for scrolling
        const scrollTop = containerContext.scrollParent.scrollTop || window.scrollY;
        const scrollLeft = containerContext.scrollParent.scrollLeft || window.scrollX;
        
        top = targetRect.top + scrollTop - padding;
        left = targetRect.left + scrollLeft - padding;
      }
      
      return {
        top,
        left,
        width: targetRect.width + (padding * 2),
        height: targetRect.height + (padding * 2),
        borderRadius: getComputedStyle(target).borderRadius || '4px'
      };
    } catch (error) {
      console.error('Error calculating spotlight position:', error);
      return null;
    }
  }, 100), [findTarget, detectContainerContext]);
  
  // Calculate tooltip position based on target element and preferred position
  const calculateTooltipPosition = useCallback(throttle((
    targetId: TutorialTargetId,
    fallbackIds: TutorialTargetId[] = [],
    preferredPosition: 'top' | 'bottom' | 'left' | 'right' = 'top',
    alignment: 'start' | 'center' | 'end' = 'center'
  ): TooltipPosition | null => {
    // Try to find the target element
    const target = findTarget(targetId, fallbackIds);
    
    // If no target was found, attempt to create a sensible default position
    if (!target) {
      console.log(`[TutorialPosition] Tooltip target not found for ID "${targetId}" or fallbacks [${fallbackIds.join(', ')}]`);
      
      // Look for alternative elements that might work as defaults
      const configurator = document.querySelector('[data-testid="foodcube-configurator"]') as HTMLElement;
      const gridWrapper = document.querySelector('[data-testid="grid-wrapper"]') as HTMLElement;
      const titleElement = document.querySelector('[data-testid="configurator-title"]') as HTMLElement;
      
      let defaultElement = null;
      if (gridWrapper) {
        defaultElement = gridWrapper;
      } else if (configurator) {
        defaultElement = configurator; 
      } else if (titleElement) {
        defaultElement = titleElement;
      }
      
      // If we found a default element, use it for positioning
      if (defaultElement) {
        try {
          console.log(`[TutorialPosition] Using fallback element for tooltip: ${defaultElement.tagName}`);
          const rect = defaultElement.getBoundingClientRect();
          
          // Position above the fallback element
          const tooltipWidth = 264;
          const tooltipHeight = 160;
          
          let tooltipPosition: TooltipPosition;
          
          // Based on preferred position
          if (preferredPosition === 'top') {
            tooltipPosition = {
              top: rect.top - tooltipHeight - 20,
              left: rect.left + (rect.width / 2),
              transform: 'translateX(-50%)',
              position: 'top'
            };
          } else if (preferredPosition === 'bottom') {
            tooltipPosition = {
              top: rect.bottom + 20,
              left: rect.left + (rect.width / 2),
              transform: 'translateX(-50%)',
              position: 'bottom'
            };
          } else if (preferredPosition === 'left') {
            tooltipPosition = {
              top: rect.top + (rect.height / 2),
              left: rect.left - tooltipWidth - 20,
              transform: 'translateY(-50%)',
              position: 'left'
            };
          } else { // right
            tooltipPosition = {
              top: rect.top + (rect.height / 2),
              left: rect.right + 20,
              transform: 'translateY(-50%)',
              position: 'right'
            };
          }
          
          // Check if tooltip would be off-screen and adjust
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          if (tooltipPosition.left < 20) {
            tooltipPosition.left = 20;
            tooltipPosition.transform = '';
            tooltipPosition.position = 'inside-left';
          } else if (tooltipPosition.left + tooltipWidth > viewportWidth - 20) {
            tooltipPosition.left = viewportWidth - tooltipWidth - 20;
            tooltipPosition.transform = '';
            tooltipPosition.position = 'inside-right';
          }
          
          if (tooltipPosition.top < 20) {
            tooltipPosition.top = 20;
            tooltipPosition.transform = tooltipPosition.transform.replace('translateY(-50%)', '');
            tooltipPosition.position = 'inside-top';
          } else if (tooltipPosition.top + tooltipHeight > viewportHeight - 20) {
            tooltipPosition.top = viewportHeight - tooltipHeight - 20;
            tooltipPosition.transform = tooltipPosition.transform.replace('translateY(-50%)', '');
            tooltipPosition.position = 'inside-bottom';
          }
          
          return tooltipPosition;
        } catch (e) {
          console.error('Failed to use fallback element for tooltip', e);
        }
      }
      
      // Last resort fallback: center of the window
      console.log('[TutorialPosition] Using window center as fallback for tooltip');
      
      return {
        top: 100, // Position near the top of the window
        left: window.innerWidth / 2,
        transform: 'translateX(-50%)',
        position: 'inside-top'
      };
    }
    
    try {
      // Get container context
      const containerContext = detectContainerContext(target);
      
      // Get element coordinates
      const targetRect = target.getBoundingClientRect();
      
      // Get viewport boundaries
      const viewportBounds = containerContext.viewportBounds;
      
      // Estimate tooltip dimensions (can be adjusted based on content)
      const tooltipWidth = 264; // w-64 = 16rem = 256px + padding
      const tooltipHeight = 160; // Estimated height based on content and padding
      
      let top = 0;
      let left = 0;
      let transform = '';
      let position = preferredPosition;
      
      // Calculate position relative to container type
      let calculatedTop: number;
      let calculatedLeft: number;
      
      if (containerContext.isModal && containerContext.hasFixedPosition) {
        // For fixed modals, use position relative to viewport
        calculatedTop = targetRect.top;
        calculatedLeft = targetRect.left;
      } else if (containerContext.isModal) {
        // For non-fixed modals, use position relative to container
        const containerRect = containerContext.container.getBoundingClientRect();
        calculatedTop = targetRect.top - containerRect.top;
        calculatedLeft = targetRect.left - containerRect.left;
      } else {
        // For standard document flow, account for scrolling
        calculatedTop = targetRect.top;
        calculatedLeft = targetRect.left;
      }
      
      // Default positions outside the element
      switch (position) {
        case 'top':
          top = calculatedTop - tooltipHeight - 10;
          left = calculatedLeft + (targetRect.width / 2);
          transform = 'translateX(-50%)';
          break;
        case 'bottom':
          top = calculatedTop + targetRect.height + 10;
          left = calculatedLeft + (targetRect.width / 2);
          transform = 'translateX(-50%)';
          break;
        case 'left':
          top = calculatedTop + (targetRect.height / 2);
          left = calculatedLeft - tooltipWidth - 10;
          transform = 'translateY(-50%)';
          break;
        case 'right':
          top = calculatedTop + (targetRect.height / 2);
          left = calculatedLeft + targetRect.width + 10;
          transform = 'translateY(-50%)';
          break;
      }
      
      // Apply alignment adjustments
      if (position === 'top' || position === 'bottom') {
        if (alignment === 'start') {
          left = calculatedLeft + 20;
          transform = 'none';
        } else if (alignment === 'end') {
          left = calculatedLeft + targetRect.width - tooltipWidth - 20;
          transform = 'none';
        }
      } else if (position === 'left' || position === 'right') {
        if (alignment === 'start') {
          top = calculatedTop + 20;
          transform = 'none';
        } else if (alignment === 'end') {
          top = calculatedTop + targetRect.height - tooltipHeight - 20;
          transform = 'none';
        }
      }
      
      // Adjust position based on viewport constraints
      if (position === 'top' && calculatedTop < viewportBounds.top + tooltipHeight + 20) {
        position = 'inside-top';
        top = calculatedTop + 20;
        logDebug('Repositioning tooltip inside at top edge - not enough space outside');
      } else if (position === 'bottom' && 
                calculatedTop + targetRect.height + tooltipHeight + 20 > viewportBounds.bottom) {
        position = 'inside-bottom';
        top = calculatedTop + targetRect.height - tooltipHeight - 20;
        logDebug('Repositioning tooltip inside at bottom edge - not enough space outside');
      } else if (position === 'left' && calculatedLeft < viewportBounds.left + tooltipWidth + 20) {
        position = 'inside-left';
        left = calculatedLeft + 20;
        logDebug('Repositioning tooltip inside at left edge - not enough space outside');
      } else if (position === 'right' && 
                calculatedLeft + targetRect.width + tooltipWidth + 20 > viewportBounds.right) {
        position = 'inside-right';
        left = calculatedLeft + targetRect.width - tooltipWidth - 20;
        logDebug('Repositioning tooltip inside at right edge - not enough space outside');
      }
      
      // Final viewport boundary adjustments
      if (left < viewportBounds.left + 10) {
        left = viewportBounds.left + 10;
        transform = transform.replace('translateX(-50%)', '');
      } else if (left + tooltipWidth > viewportBounds.right - 10) {
        left = viewportBounds.right - tooltipWidth - 10;
        transform = transform.replace('translateX(-50%)', '');
      }
      
      if (top < viewportBounds.top + 10) {
        top = viewportBounds.top + 10;
        transform = transform.replace('translateY(-50%)', '');
      } else if (top + tooltipHeight > viewportBounds.bottom - 10) {
        top = viewportBounds.bottom - tooltipHeight - 10;
        transform = transform.replace('translateY(-50%)', '');
      }
      
      // If we're in a fixed position container, we need to convert to absolute positioning
      if (containerContext.hasFixedPosition && !containerContext.isModal) {
        // Adjust for fixed position container
        const scrollTop = window.scrollY;
        const scrollLeft = window.scrollX;
        top += scrollTop;
        left += scrollLeft;
      }
      
      return {
        top,
        left, 
        transform,
        position
      };
    } catch (error) {
      console.error('Error calculating tooltip position:', error);
      return null;
    }
  }, 100), [findTarget, detectContainerContext]);
  
  // -- ARROW POSITIONING LOGIC --
  
  // Get arrow position based on tooltip position and alignment
  const getArrowPosition = useCallback((
    position: 'top' | 'bottom' | 'left' | 'right' | 'inside-top' | 'inside-bottom' | 'inside-left' | 'inside-right', 
    alignment: 'start' | 'center' | 'end'
  ): ArrowPosition => {
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
  }, []);
  
  // Get arrow border width based on tooltip position
  const getArrowBorderWidth = useCallback((
    position: 'top' | 'bottom' | 'left' | 'right' | 'inside-top' | 'inside-bottom' | 'inside-left' | 'inside-right'
  ): string => {
    switch (position) {
      case 'top':
        return '0 1px 1px 0'; // Border on right and bottom for arrow pointing down
      case 'bottom':
        return '1px 0 0 1px'; // Border on top and left for arrow pointing up
      case 'left':
        return '1px 1px 0 0'; // Border on top and right for arrow pointing left
      case 'right':
        return '0 0 1px 1px'; // Border on bottom and left for arrow pointing right
      case 'inside-top':
        return '1px 0 0 1px'; // Border on top and left for arrow pointing up
      case 'inside-bottom':
        return '0 1px 1px 0'; // Border on right and bottom for arrow pointing down
      case 'inside-left':
        return '0 0 1px 1px'; // Border on bottom and left for arrow pointing left
      case 'inside-right':
        return '1px 1px 0 0'; // Border on top and right for arrow pointing right
      default:
        return '0 1px 1px 0';
    }
  }, []);
  
  // Create context value
  const contextValue: TutorialPositionContextType = {
    findTarget,
    detectContainerContext,
    calculateSpotlightPosition,
    calculateTooltipPosition,
    getArrowPosition,
    getArrowBorderWidth,
    clearPositionCache
  };
  
  return (
    <TutorialPositionContext.Provider value={contextValue}>
      {children}
    </TutorialPositionContext.Provider>
  );
};

// Custom hook to use the tutorial position context
export const useTutorialPosition = (): TutorialPositionContextType => {
  const context = useContext(TutorialPositionContext);
  if (context === undefined) {
    throw new Error('useTutorialPosition must be used within a TutorialPositionProvider');
  }
  return context;
};