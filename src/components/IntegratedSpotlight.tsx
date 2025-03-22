import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTutorial, TutorialTargetId } from '@/contexts/TutorialContext';
import { throttle } from '@/lib/utils';

interface IntegratedSpotlightProps {
  targetId: TutorialTargetId;
  fallbackTargetIds?: TutorialTargetId[];
  isActive: boolean;
  onClick?: () => void;
  allowClickThrough?: boolean;
  showPointer?: boolean;
  pointerPosition?: 'top' | 'bottom' | 'left' | 'right';
  zIndex?: number;
  padding?: number;
}

export const IntegratedSpotlight: React.FC<IntegratedSpotlightProps> = ({
  targetId,
  fallbackTargetIds = [],
  isActive,
  onClick,
  allowClickThrough = false,
  showPointer = false,
  pointerPosition = 'top',
  zIndex = 10000,
  padding = 4,
}) => {
  const [spotlightStyle, setSpotlightStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    borderRadius: '4px',
  });
  
  const [currentTargetId, setCurrentTargetId] = useState<TutorialTargetId | null>(null);
  const [isPositioned, setIsPositioned] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVisibleElementRef = useRef<HTMLElement | null>(null);

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

  // Scroll element into view with smooth behavior
  const scrollIntoViewIfNeeded = useCallback((element: HTMLElement) => {
    if (!isInViewport(element) && !isScrolling) {
      console.log(`Scrolling target ${currentTargetId} into view...`);
      setIsScrolling(true);
      
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Scroll the element into view smoothly
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center', 
        inline: 'center' 
      });
      
      // Set a timeout to prevent multiple scrolls
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000); // Wait a bit after scrolling to prevent multiple scrolls
    }
  }, [isInViewport, currentTargetId, isScrolling]);

  // Find the best target from the primary and fallback options, handling duplicates
  const findTarget = useCallback(() => {
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
      return bestTarget;
    }
    
    return null;
  }, [targetId, fallbackTargetIds, isInViewport, getDistanceFromViewport]);

  // Throttled function for updating spotlight position
  const updatePosition = useCallback(throttle((target: HTMLElement) => {
    try {
      const targetRect = target.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setSpotlightStyle({
        top: targetRect.top + scrollTop - padding,
        left: targetRect.left + scrollLeft - padding,
        width: targetRect.width + (padding * 2),
        height: targetRect.height + (padding * 2),
        borderRadius: getComputedStyle(target).borderRadius || '4px',
      });
      
      setIsPositioned(true);
      
      // Check if we need to scroll the element into view
      scrollIntoViewIfNeeded(target);
    } catch (error) {
      console.error('Error positioning spotlight:', error);
      setIsPositioned(false);
    }
  }, 100), [padding, scrollIntoViewIfNeeded]);

  // Update spotlight position based on target element
  useEffect(() => {
    if (!isActive) {
      setIsPositioned(false);
      return;
    }
    
    const target = findTarget();
    if (!target) {
      console.log(`Could not find tutorial target: ${targetId} or any fallbacks`);
      setIsPositioned(false);
      return;
    }
    
    // Initial update
    updatePosition(target);
    
    // Set up a short interval to keep trying to position in case the target is not fully rendered
    const initialPositionInterval = setInterval(() => {
      if (!isPositioned) {
        const refreshTarget = findTarget();
        if (refreshTarget) {
          console.log(`Retrying spotlight position for ${currentTargetId}...`);
          updatePosition(refreshTarget);
        }
      } else {
        clearInterval(initialPositionInterval);
      }
    }, 100);
    
    // Clear interval after max 2 seconds to prevent infinite loop
    setTimeout(() => clearInterval(initialPositionInterval), 2000);
    
    // Define event handlers for resize and scroll
    const handleResize = () => {
      const resizeTarget = findTarget();
      if (resizeTarget) updatePosition(resizeTarget);
    };
    
    const handleScroll = () => {
      const scrollTarget = findTarget();
      if (scrollTarget) updatePosition(scrollTarget);
    };
    
    // Set up a regular interval to recheck which element is visible (for responsive layouts)
    const visibilityCheckInterval = setInterval(() => {
      const checkTarget = findTarget();
      if (checkTarget && checkTarget !== lastVisibleElementRef.current) {
        updatePosition(checkTarget);
      }
    }, 500);
    
    // Update position on resize and scroll
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      // Properly remove event listeners
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      
      clearInterval(initialPositionInterval);
      clearInterval(visibilityCheckInterval);
      
      // Clear any existing scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isActive, targetId, fallbackTargetIds, findTarget, updatePosition, isPositioned, currentTargetId]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  if (!isActive) return null;
  
  // Semi-transparent overlay with a "hole" for the spotlight
  return (
    <>
      {/* Spotlight element positioned over the target */}
      <div 
        className="fixed transition-all duration-300 outline outline-3 outline-blue-600 pointer-events-none spotlight-border"
        style={{
          ...spotlightStyle,
          position: 'absolute',
          zIndex,
          opacity: isActive && isPositioned ? 1 : 0,
          filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.7))',
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.7), 0 0 0 6px rgba(37, 99, 235, 0.3)',
          animation: 'pulse 2s infinite',
        }}
        data-testid="integrated-spotlight"
      >
        {/* Always make elements inside the spotlight clickable */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            background: 'transparent'
          }}
        />
        
        {/* Animated pointer finger */}
        {showPointer && (
          <div 
            className="absolute text-2xl animate-pulse tutorial-pointer"
            style={{
              ...getPointerPosition(pointerPosition),
              zIndex: zIndex + 1,
            }}
          >
            👉
          </div>
        )}
      </div>
    </>
  );
};

// Helper function to position the pointer
function getPointerPosition(position: 'top' | 'bottom' | 'left' | 'right') {
  switch (position) {
    case 'top':
      return { top: '-2rem', left: '50%', transform: 'translateX(-50%) rotate(-90deg)' };
    case 'bottom':
      return { bottom: '-2rem', left: '50%', transform: 'translateX(-50%) rotate(90deg)' };
    case 'left':
      return { left: '-2rem', top: '50%', transform: 'translateY(-50%)' };
    case 'right':
      return { right: '-2rem', top: '50%', transform: 'translateY(-50%) rotate(180deg)' };
    default:
      return { top: '-2rem', left: '50%', transform: 'translateX(-50%) rotate(-90deg)' };
  }
}

export default IntegratedSpotlight;