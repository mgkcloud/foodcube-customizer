import React, { useState, useEffect, useCallback } from 'react';
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

  // Find the first valid target from the primary and fallback options
  const findTarget = useCallback(() => {
    // Try primary target first
    let target = document.querySelector(`[data-testid="${targetId}"], [data-cell-id="${targetId}"]`) as HTMLElement;
    let id = targetId;
    
    // If primary target not found, try fallbacks in order
    if (!target && fallbackTargetIds.length > 0) {
      for (const fallbackId of fallbackTargetIds) {
        target = document.querySelector(`[data-testid="${fallbackId}"], [data-cell-id="${fallbackId}"]`) as HTMLElement;
        if (target) {
          id = fallbackId;
          console.log(`Using fallback target: ${fallbackId} for spotlight`);
          break;
        }
      }
    }
    
    if (target) {
      setCurrentTargetId(id);
      return target;
    }
    
    return null;
  }, [targetId, fallbackTargetIds]);

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
    } catch (error) {
      console.error('Error positioning spotlight:', error);
      setIsPositioned(false);
    }
  }, 100), [padding]);

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
    
    // Update position on resize and scroll
    window.addEventListener('resize', () => {
      const resizeTarget = findTarget();
      if (resizeTarget) updatePosition(resizeTarget);
    });
    
    window.addEventListener('scroll', () => {
      const scrollTarget = findTarget();
      if (scrollTarget) updatePosition(scrollTarget);
    });
    
    return () => {
      window.removeEventListener('resize', () => {
        const resizeTarget = findTarget();
        if (resizeTarget) updatePosition(resizeTarget);
      });
      
      window.removeEventListener('scroll', () => {
        const scrollTarget = findTarget();
        if (scrollTarget) updatePosition(scrollTarget);
      });
      
      clearInterval(initialPositionInterval);
    };
  }, [isActive, targetId, fallbackTargetIds, findTarget, updatePosition, isPositioned, currentTargetId]);
  
  if (!isActive) return null;
  
  // Semi-transparent overlay with a "hole" for the spotlight
  return (
    <>
      {/* Spotlight element positioned over the target */}
      <div 
        className="fixed transition-all duration-300 outline outline-2 outline-blue-500 pointer-events-none"
        style={{
          ...spotlightStyle,
          position: 'absolute',
          zIndex,
          opacity: isActive && isPositioned ? 1 : 0,
          filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.7))',
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