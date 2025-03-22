import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTutorial, TutorialTargetId } from '@/contexts/TutorialContext';
import { Button } from "@/components/ui/button";
import { throttle } from '@/lib/utils';

// Extended position types to include inside positions and corner positions
type TooltipPosition = 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right' 
  | 'inside-top' 
  | 'inside-bottom' 
  | 'inside-left' 
  | 'inside-right'
  | 'top-right'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-left';

interface IntegratedTutorialTooltipProps {
  title: string;
  content: string;
  isVisible: boolean;
  onNext: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  targetId: TutorialTargetId;
  fallbackTargetIds?: TutorialTargetId[];
  position?: 'top' | 'bottom' | 'left' | 'right';
  alignment?: 'start' | 'center' | 'end';
  isInteractive?: boolean;
  showNextButton?: boolean;
  showBackButton?: boolean;
  showSkipButton?: boolean;
  isLastStep?: boolean;
  zIndex?: number;
}

export const IntegratedTutorialTooltip: React.FC<IntegratedTutorialTooltipProps> = ({
  title,
  content,
  isVisible,
  onNext,
  onPrev,
  onSkip,
  targetId,
  fallbackTargetIds = [],
  position = 'top',
  alignment = 'center',
  isInteractive = false,
  showNextButton = true,
  showBackButton = true,
  showSkipButton = true,
  isLastStep = false,
  zIndex = 10001
}) => {
  const { manuallyAdvanceStep } = useTutorial();
  const [tooltipStyle, setTooltipStyle] = useState({
    top: 0,
    left: 0,
    transform: 'translate(-50%, -100%)',
  });
  
  const [currentTargetId, setCurrentTargetId] = useState<TutorialTargetId | null>(null);
  const [isPositioned, setIsPositioned] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState<TooltipPosition>(position);
  const lastVisibleElementRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const lastPositionLogTimeRef = useRef<number>(0);
  const lastTargetLogTimeRef = useRef<number>(0);
  const lastPositionLogRef = useRef<string | null>(null);
  const lastFindTargetTimeRef = useRef<number>(0);
  const cachedTargetRef = useRef<HTMLElement | null>(null);
  const lastFallbackLogRef = useRef<string | null>(null);
  const lastTargetFoundLogRef = useRef<string | null>(null);

  // Check if an element is in the viewport
  const isInViewport = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    
    // Check if the element is actually visible in the DOM (not hidden via CSS)
    const style = window.getComputedStyle(element);
    const isVisible = style.display !== 'none' && 
                      style.visibility !== 'hidden' && 
                      style.opacity !== '0' &&
                      rect.width > 0 && 
                      rect.height > 0;
    
    if (!isVisible) return false;
    
    // Check if it's in the viewport
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, []);

  // Calculate how close an element is to being in the viewport
  const getDistanceFromViewport = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // If it's in the viewport, distance is 0
    if (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewportHeight &&
      rect.right <= viewportWidth
    ) {
      return 0;
    }
    
    // Calculate distance from viewport
    const topDistance = rect.top < 0 ? Math.abs(rect.top) : Math.max(0, rect.top - viewportHeight);
    const leftDistance = rect.left < 0 ? Math.abs(rect.left) : Math.max(0, rect.left - viewportWidth);
    
    // Return the combined distance
    return topDistance + leftDistance;
  }, []);

  // Find the best target from the primary and fallback options, handling duplicates
  const findTarget = useCallback(() => {
    // First check cache with timing constraint to avoid excessive DOM queries
    // Only run actual DOM queries at most once every 250ms
    const now = Date.now();
    if (
      lastFindTargetTimeRef.current && 
      now - lastFindTargetTimeRef.current < 250 &&
      cachedTargetRef.current && 
      document.body.contains(cachedTargetRef.current)
    ) {
      return cachedTargetRef.current;
    }
    
    // Update the timestamp for last find operation
    lastFindTargetTimeRef.current = now;
    
    // IMPORTANT: This logic must match IntegratedSpotlight.tsx's findTarget function
    // Try primary target first - but now get ALL matching elements
    let elements = Array.from(document.querySelectorAll(`[data-testid="${targetId}"], [data-cell-id="${targetId}"]`)) as HTMLElement[];
    let id = targetId;
    
    // If primary target not found, try fallbacks in order
    if (elements.length === 0 && fallbackTargetIds.length > 0) {
      for (const fallbackId of fallbackTargetIds) {
        elements = Array.from(document.querySelectorAll(`[data-testid="${fallbackId}"], [data-cell-id="${fallbackId}"]`)) as HTMLElement[];
        if (elements.length > 0) {
          id = fallbackId;
          break;
        }
      }
    }
    
    if (elements.length === 0) {
      cachedTargetRef.current = null;
      return null;
    }
    
    // If we have elements, choose the best one
    // First, check if any are in the viewport
    const visibleElements = elements.filter(el => isInViewport(el));
    
    let bestTarget: HTMLElement | null = null;
    
    if (visibleElements.length > 0) {
      // If we have visible elements, use the first one
      bestTarget = visibleElements[0];
    } else if (lastVisibleElementRef.current && elements.includes(lastVisibleElementRef.current)) {
      // If we have a previously visible element that's still valid, use it
      bestTarget = lastVisibleElementRef.current;
    } else {
      // Otherwise, find the element closest to being in the viewport
      let closestDistance = Infinity;
      elements.forEach(el => {
        // Skip elements that are not visible in the DOM
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return;
        }
        
        const distance = getDistanceFromViewport(el);
        if (distance < closestDistance) {
          closestDistance = distance;
          bestTarget = el;
        }
      });
    }
    
    if (bestTarget) {
      setCurrentTargetId(id);
      lastVisibleElementRef.current = bestTarget;
      cachedTargetRef.current = bestTarget;
      return bestTarget;
    }
    
    cachedTargetRef.current = null;
    return null;
  }, [targetId, fallbackTargetIds, isInViewport, getDistanceFromViewport]);

  // Check if a tooltip would be fully visible in the viewport
  const isTooltipPositionValid = useCallback((top: number, left: number, width: number, height: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    return (
      top >= 10 &&
      left >= 10 &&
      top + height <= viewportHeight - 10 &&
      left + width <= viewportWidth - 10
    );
  }, []);

  // Find the best position for the tooltip to stay in viewport
  const findOptimalPosition = useCallback((
    targetRect: DOMRect,
    tooltipWidth: number,
    tooltipHeight: number,
    scrollTop: number,
    scrollLeft: number
  ): { position: TooltipPosition; top: number; left: number; transform: string; } => {
    // Performance optimization: Cache viewport measurements
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check if the target is a small element (like a grid cell or small button)
    const isSmallElement = targetRect.width < 80 || targetRect.height < 80;
    
    // Calculate the coordinates of each position around the target
    const positionCoordinates: Record<TooltipPosition, {
      top: number; 
      left: number; 
      transform: string;
      coversTarget?: boolean; // Indicates if this position would cover the target
      isInsideViewport: boolean; // Indicates if this position is fully visible
    }> = {
      'top': {
        top: targetRect.top + scrollTop - tooltipHeight - 15,
        left: targetRect.left + scrollLeft + (targetRect.width / 2) - (tooltipWidth / 2),
        transform: 'translate(0, 0)',
        isInsideViewport: false
      },
      'right': {
        top: targetRect.top + scrollTop + (targetRect.height / 2) - (tooltipHeight / 2),
        left: targetRect.right + scrollLeft + 15,
        transform: 'translate(0, 0)',
        isInsideViewport: false
      },
      'bottom': {
        top: targetRect.bottom + scrollTop + 15,
        left: targetRect.left + scrollLeft + (targetRect.width / 2) - (tooltipWidth / 2),
        transform: 'translate(0, 0)',
        isInsideViewport: false
      },
      'left': {
        top: targetRect.top + scrollTop + (targetRect.height / 2) - (tooltipHeight / 2),
        left: targetRect.left + scrollLeft - tooltipWidth - 15,
        transform: 'translate(0, 0)',
        isInsideViewport: false
      },
      'inside-top': {
        top: targetRect.top + scrollTop + 8,
        left: targetRect.left + scrollLeft + (targetRect.width / 2) - (tooltipWidth / 2),
        transform: 'translate(0, 0)',
        coversTarget: true,
        isInsideViewport: false
      },
      'inside-bottom': {
        top: targetRect.bottom + scrollTop - tooltipHeight - 8,
        left: targetRect.left + scrollLeft + (targetRect.width / 2) - (tooltipWidth / 2),
        transform: 'translate(0, 0)',
        coversTarget: true,
        isInsideViewport: false
      },
      'inside-left': {
        top: targetRect.top + scrollTop + (targetRect.height / 2) - (tooltipHeight / 2),
        left: targetRect.left + scrollLeft + 8,
        transform: 'translate(0, 0)',
        coversTarget: true,
        isInsideViewport: false
      },
      'inside-right': {
        top: targetRect.top + scrollTop + (targetRect.height / 2) - (tooltipHeight / 2),
        left: targetRect.right + scrollLeft - tooltipWidth - 8,
        transform: 'translate(0, 0)',
        coversTarget: true,
        isInsideViewport: false
      },
      // For small elements, add corner positions that don't fully cover the element
      'top-right': {
        top: targetRect.top + scrollTop - tooltipHeight - 8,
        left: targetRect.right + scrollLeft - (tooltipWidth / 4),
        transform: 'translate(0, 0)',
        isInsideViewport: false
      },
      'bottom-right': {
        top: targetRect.bottom + scrollTop + 8,
        left: targetRect.right + scrollLeft - (tooltipWidth / 4),
        transform: 'translate(0, 0)',
        isInsideViewport: false
      },
      'bottom-left': {
        top: targetRect.bottom + scrollTop + 8,
        left: targetRect.left + scrollLeft - (tooltipWidth * 3/4),
        transform: 'translate(0, 0)',
        isInsideViewport: false
      },
      'top-left': {
        top: targetRect.top + scrollTop - tooltipHeight - 8,
        left: targetRect.left + scrollLeft - (tooltipWidth * 3/4),
        transform: 'translate(0, 0)',
        isInsideViewport: false
      }
    };
    
    // Check which positions are fully inside the viewport
    const positions = Object.keys(positionCoordinates) as TooltipPosition[];
    positions.forEach(position => {
      const coords = positionCoordinates[position];
      
      // Check if tooltip would be fully visible in the viewport
      const isLeftVisible = coords.left >= 0 && coords.left + tooltipWidth <= viewportWidth;
      const isTopVisible = coords.top >= 0 && coords.top + tooltipHeight <= viewportHeight;
      
      coords.isInsideViewport = isLeftVisible && isTopVisible;
    });
    
    // First try to use the position specified in the tutorial step
    if (position && (position === 'top' || position === 'right' || position === 'bottom' || position === 'left')) {
      const requestedPosition = positionCoordinates[position];
      
      // If the requested position would be at least partially in viewport or we can adjust it to fit
      if (requestedPosition.left + tooltipWidth > 0 && 
          requestedPosition.left < viewportWidth &&
          requestedPosition.top + tooltipHeight > 0 && 
          requestedPosition.top < viewportHeight) {
        
        // Adjust coordinates to keep tooltip in viewport
        let { top, left } = requestedPosition;
        
        // Adjust horizontal position if needed
        if (left < 0) left = 8;
        if (left + tooltipWidth > viewportWidth) left = viewportWidth - tooltipWidth - 8;
        
        // Adjust vertical position if needed
        if (top < 0) top = 8;
        if (top + tooltipHeight > viewportHeight) top = viewportHeight - tooltipHeight - 8;
        
        return {
          position: position as TooltipPosition,
          top,
          left,
          transform: requestedPosition.transform
        };
      }
    }
    
    // If the requested position doesn't work, find the best alternative
    // Filter positions based on visibility
    let validPositions = positions.filter(pos => {
      // For small elements, avoid positions that would cover them
      if (isSmallElement && positionCoordinates[pos].coversTarget) {
        return false;
      }
      
      // Prefer positions in-viewport when possible
      return positionCoordinates[pos].isInsideViewport;
    });
    
    // If no valid positions are fully in viewport, allow positions that are partially visible
    if (validPositions.length === 0) {
      validPositions = positions.filter(pos => {
        // For small elements, still avoid positions that would cover them
        if (isSmallElement && positionCoordinates[pos].coversTarget) {
          return false;
        }
        
        // Accept positions that are at least partially visible
        const coords = positionCoordinates[pos];
        const isPartiallyVisible = 
          coords.left + tooltipWidth > 0 && 
          coords.left < viewportWidth &&
          coords.top + tooltipHeight > 0 && 
          coords.top < viewportHeight;
        
        return isPartiallyVisible;
      });
    }
    
    // If still no valid positions (rare edge case), use all positions
    if (validPositions.length === 0) {
      validPositions = positions;
    }
    
    // Priority order - always prefer the user-specified position first when possible
    const basePositions: TooltipPosition[] = ['right', 'bottom', 'left', 'top'];
    const positionPriority: TooltipPosition[] = [
      ...(position ? [position as TooltipPosition] : []), // First try the position specified in props
      ...basePositions // Then try standard positions
    ].filter(p => positions.includes(p)); // Filter out any invalid positions
    
    // Find the highest priority position that is valid
    let optimalPosition: TooltipPosition = 'right'; // Default fallback
    
    for (const pos of positionPriority) {
      if (validPositions.includes(pos)) {
        optimalPosition = pos;
        break;
      }
    }
    
    // Get the coordinates for the chosen position
    let { top, left, transform } = positionCoordinates[optimalPosition];
    
    // Adjust to ensure tooltip stays in viewport boundaries
    if (left < 0) left = 8;
    if (left + tooltipWidth > viewportWidth) left = viewportWidth - tooltipWidth - 8;
    if (top < 0) top = 8;
    if (top + tooltipHeight > viewportHeight) top = viewportHeight - tooltipHeight - 8;
    
    return {
      position: optimalPosition,
      top,
      left,
      transform
    };
  }, [position]);

  // Throttled function for updating tooltip position with viewport checks
  const updatePosition = useCallback(throttle((target: HTMLElement) => {
    try {
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const targetRect = target.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      // Measure the tooltip if possible, otherwise estimate dimensions
      let tooltipWidth = 264;  // Default from styles
      let tooltipHeight = 160; // Default estimate
      
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        tooltipWidth = tooltipRect.width || tooltipWidth;
        tooltipHeight = tooltipRect.height || tooltipHeight;
      }
      
      // Find the optimal position that keeps the tooltip in viewport
      const optimalPosition = findOptimalPosition(
        targetRect,
        tooltipWidth,
        tooltipHeight,
        scrollTop,
        scrollLeft
      );
      
      // Apply the optimal position
      setAdjustedPosition(optimalPosition.position);
      setTooltipStyle({
        top: optimalPosition.top,
        left: optimalPosition.left,
        transform: optimalPosition.transform,
      });
      
      setIsPositioned(true);

      // If the target element is not fully in view, scroll it into view
      // Only do this if it's really out of view to avoid unnecessary scrolling
      if (!isInViewport(target)) {
        // Removed logging, just scroll
        target.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center', 
          inline: 'center' 
        });
      }
    } catch (error) {
      // Only keep error logs for debugging critical issues
      console.error('Error positioning tooltip:', error);
      setIsPositioned(false);
    }
  // Increased throttle time to reduce calculations
  }, 200), [findOptimalPosition, isInViewport, currentTargetId]);

  // Re-position the tooltip when it's rendered to ensure accurate measurements
  // Using a throttled version to prevent too many updates
  const debouncedUpdateOnRender = useCallback(
    throttle((target: HTMLElement) => {
      updatePosition(target);
    }, 250), 
    [updatePosition]
  );

  useEffect(() => {
    if (isPositioned && tooltipRef.current) {
      const target = findTarget();
      if (target) {
        // Short delay to ensure the DOM has updated
        const timer = setTimeout(() => {
          debouncedUpdateOnRender(target);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [isPositioned, findTarget, debouncedUpdateOnRender]);

  // Position the tooltip based on the target element
  useEffect(() => {
    if (!isVisible) {
      setIsPositioned(false);
      return;
    }
    
    const target = findTarget();
    if (!target) {
      // Removed logging for "could not find target"
      setIsPositioned(false);
      return;
    }
    
    // Initial update
    updatePosition(target);
    
    // Combined interval for multiple tasks to reduce setInterval overhead
    // This handles both initial positioning and visibility checks
    const combinedInterval = setInterval(() => {
      // Skip all checks if tooltip isn't visible
      if (!isVisible) return;
      
      const currentTarget = findTarget();
      if (!currentTarget) return;
      
      // If we haven't positioned yet, keep trying
      if (!isPositioned) {
        updatePosition(currentTarget);
      } 
      // If target changed or we're doing a visibility recheck (less frequent)
      else if (currentTarget !== lastVisibleElementRef.current || Date.now() % 4 === 0) {
        // Only update position if needed (target changed)
        updatePosition(currentTarget);
      }
    }, 500); // One interval to rule them all
    
    // Clear interval after max 3 seconds if we still haven't positioned
    const clearInitialTimer = setTimeout(() => {
      if (!isPositioned) {
        clearInterval(combinedInterval);
      }
    }, 3000);
    
    // Create handler functions that can be properly removed
    // Using throttled handlers with more aggressive throttling
    const handleResize = throttle(() => {
      const resizeTarget = findTarget();
      if (resizeTarget) updatePosition(resizeTarget);
    }, 500); // Even more aggressive throttling
    
    const handleScroll = throttle(() => {
      const scrollTarget = findTarget();
      if (scrollTarget) updatePosition(scrollTarget);
    }, 500); // Even more aggressive throttling
    
    // Update position on resize and scroll
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(combinedInterval);
      clearTimeout(clearInitialTimer);
    };
  }, [isVisible, targetId, fallbackTargetIds, findTarget, updatePosition, isPositioned]);

  // Handle the manual next button click
  const handleNext = () => {
    if (isInteractive) {
      // For interactive steps, manually advance
      manuallyAdvanceStep();
    } else {
      // For normal steps, use the callback
      onNext();
    }
  };

  if (!isVisible || !isPositioned) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed bg-white rounded-lg shadow-lg border border-blue-100 p-4 w-64 max-w-[90vw] z-50 transition-all duration-300 ease-in-out"
      style={{
        ...tooltipStyle,
        zIndex: 100000000000,
      }}
      data-testid={`tutorial-tooltip-${targetId}`}
    >
      <div className="flex flex-col">
        <div className="mb-2">
          <h3 className="font-bold text-blue-600">{title}</h3>
        </div>
        <div className="text-sm text-gray-700 mb-4">
          {content}
        </div>
        <div className="flex justify-between items-center">
          {showBackButton && onPrev ? (
            <Button variant="outline" size="sm" onClick={onPrev} className="text-xs">
              Back
            </Button>
          ) : (
            <div></div>
          )}
          
          <div className="flex gap-2">
            {/* {showSkipButton && onSkip && (
              <Button variant="ghost" size="sm" onClick={onSkip} className="text-xs text-gray-500">
                Skip
              </Button>
            )} */}
            
            {showNextButton && (
              <Button size="sm" onClick={handleNext} className="text-xs">
                {isLastStep ? 'Finish' : (isInteractive ? 'Skip' : 'Next')}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Arrow pointing to the target */}
      <div
        className="absolute w-3 h-3 bg-white transform rotate-45 border-blue-100"
        style={{
          ...getArrowPosition(adjustedPosition, alignment),
          borderWidth: getArrowBorderWidth(adjustedPosition),
          zIndex: 100000000000, // Match tooltip's z-index
        }}
        data-testid={`tutorial-tooltip-arrow-${targetId}`}
      ></div>
    </div>
  );
};

// Helper function to position the arrow
function getArrowPosition(position: TooltipPosition, alignment: 'start' | 'center' | 'end') {
  // For the arrow position, we need to point it toward the target element
  // based on which side of the tooltip is closest to the target
  
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
  }
}

// Helper function to determine border sides for the arrow
function getArrowBorderWidth(position: TooltipPosition) {
  // Make sure we use the right border based on where the arrow is positioned
  // This controls which sides of the arrow have borders to create a seamless connection
  // with the tooltip while pointing to the target
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
}

export default IntegratedTutorialTooltip;