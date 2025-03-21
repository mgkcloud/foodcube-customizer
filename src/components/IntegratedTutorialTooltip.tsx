import React, { useState, useEffect, useCallback } from 'react';
import { useTutorial, TutorialTargetId } from '@/contexts/TutorialContext';
import { Button } from "@/components/ui/button";
import { throttle } from '@/lib/utils';

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
  const [adjustedPosition, setAdjustedPosition] = useState<'top' | 'bottom' | 'left' | 'right' | 'inside-top' | 'inside-bottom' | 'inside-left' | 'inside-right'>(position);

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
          console.log(`Using fallback target: ${fallbackId} for tooltip`);
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

  // Throttled function for updating tooltip position with viewport checks
  const updatePosition = useCallback(throttle((target: HTMLElement) => {
    try {
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const targetRect = target.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      // Estimate tooltip dimensions - we'll use these to check if tooltip fits
      const tooltipWidth = 264; // w-64 = 16rem = 256px + padding
      const tooltipHeight = 160; // Estimated height based on content and padding
      
      let top = 0;
      let left = 0;
      let transform = '';
      let newPosition = position;
      
      // First, position the tooltip OUTSIDE the target element rather than over it
      // This ensures the element is visible and not covered by the tooltip
      
      // Default positions outside the element
      switch (position) {
        case 'top':
          top = targetRect.top + scrollTop - tooltipHeight - 80; // Position above with 20px gap
          left = targetRect.left + scrollLeft + (targetRect.width / 2);
          transform = 'translateX(-50%)';
          break;
        case 'bottom':
          top = targetRect.top + scrollTop + targetRect.height + 10; // Position below with 10px gap
          left = targetRect.left + scrollLeft + (targetRect.width / 2);
          transform = 'translateX(-50%)';
          break;
        case 'left':
          top = targetRect.top + scrollTop + (targetRect.height / 2);
          left = targetRect.left + scrollLeft - tooltipWidth - 10; // Position to the left with 10px gap
          transform = 'translateY(-50%)';
          break;
        case 'right':
          top = targetRect.top + scrollTop + (targetRect.height / 2);
          left = targetRect.left + scrollLeft + targetRect.width + 10; // Position to the right with 10px gap
          transform = 'translateY(-50%)';
          break;
      }
      
      // Apply alignment adjustments
      if (newPosition === 'top' || newPosition === 'bottom') {
        if (alignment === 'start') {
          left = targetRect.left + scrollLeft + 20; // Align near the start with margin
          transform = 'none';
        } else if (alignment === 'end') {
          left = targetRect.left + scrollLeft + targetRect.width - tooltipWidth - 20; // Align near the end with margin
          transform = 'none';
        }
      } else if (newPosition === 'left' || newPosition === 'right') {
        if (alignment === 'start') {
          top = targetRect.top + scrollTop + 20; // Align near the start with margin
          transform = 'none';
        } else if (alignment === 'end') {
          top = targetRect.top + scrollTop + targetRect.height - tooltipHeight - 20; // Align near the end with margin
          transform = 'none';
        }
      }
      
      // Check if the tooltip will fit in the specified position
      // If not enough space, position inside the target element with arrow pointing outward
      
      // Top position check - if not enough room on top
      if (newPosition === 'top' && targetRect.top < tooltipHeight + 20) {
        // Instead of flipping to bottom, position inside the target with arrow pointing up
        newPosition = 'inside-top';
        top = targetRect.top + scrollTop + 20; // Position inside, near top edge
        console.log('Repositioning tooltip inside at top edge - not enough space outside');
      }
      // Bottom position check - if not enough room on bottom
      else if (newPosition === 'bottom' && targetRect.bottom + tooltipHeight + 20 > viewportHeight) {
        // Instead of flipping to top, position inside the target with arrow pointing down
        newPosition = 'inside-bottom';
        top = targetRect.top + scrollTop + targetRect.height - tooltipHeight - 20; // Position inside, near bottom edge
        console.log('Repositioning tooltip inside at bottom edge - not enough space outside');
      }
      // Left position check - if not enough room on left
      else if (newPosition === 'left' && targetRect.left < tooltipWidth + 20) {
        // Instead of flipping to right, position inside the target with arrow pointing left
        newPosition = 'inside-left';
        left = targetRect.left + scrollLeft + 20; // Position inside, near left edge
        console.log('Repositioning tooltip inside at left edge - not enough space outside');
      }
      // Right position check - if not enough room on right
      else if (newPosition === 'right' && targetRect.right + tooltipWidth + 20 > viewportWidth) {
        // Instead of flipping to left, position inside the target with arrow pointing right
        newPosition = 'inside-right';
        left = targetRect.left + scrollLeft + targetRect.width - tooltipWidth - 20; // Position inside, near right edge
        console.log('Repositioning tooltip inside at right edge - not enough space outside');
      }
      
      // Ensure tooltip stays within viewport boundaries
      // Adjust horizontal position if needed
      if (left < 10) {
        left = 10;
        transform = transform.replace('translateX(-50%)', '');
      } else if (left + tooltipWidth > viewportWidth - 10) {
        left = viewportWidth - tooltipWidth - 10;
        transform = transform.replace('translateX(-50%)', '');
      }
      
      // Adjust vertical position if needed
      if (top < 10) {
        top = 10;
        transform = transform.replace('translateY(-50%)', '');
      } else if (top + tooltipHeight > viewportHeight - 10) {
        top = viewportHeight - tooltipHeight - 10;
        transform = transform.replace('translateY(-50%)', '');
      }
      
      // Update the adjusted position state so we can pass it to the arrow
      setAdjustedPosition(newPosition);
      
      setTooltipStyle({
        top,
        left,
        transform,
      });
      
      setIsPositioned(true);
    } catch (error) {
      console.error('Error positioning tooltip:', error);
      setIsPositioned(false);
    }
  }, 100), [position, alignment]);

  // Position the tooltip based on the target element
  useEffect(() => {
    if (!isVisible) {
      setIsPositioned(false);
      return;
    }
    
    const target = findTarget();
    if (!target) {
      console.log(`Could not find tutorial target: ${targetId} or any fallbacks for tooltip`);
      setIsPositioned(false);
      return;
    }
    
    // Initial update
    updatePosition(target);
    
    // Create handler functions that can be properly removed
    const handleResize = () => {
      const resizeTarget = findTarget();
      if (resizeTarget) updatePosition(resizeTarget);
    };
    
    const handleScroll = () => {
      const scrollTarget = findTarget();
      if (scrollTarget) updatePosition(scrollTarget);
    };
    
    // Update position on resize and scroll
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isVisible, targetId, fallbackTargetIds, findTarget, updatePosition]);

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
      className="fixed bg-white rounded-lg shadow-lg border border-blue-100 p-4 w-64 max-w-[90vw] z-50 transition-all duration-300 ease-in-out"
      style={{
        ...tooltipStyle,
        zIndex,
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
          zIndex: 1, // Ensure arrow is above tooltip content
        }}
        data-testid={`tutorial-tooltip-arrow-${targetId}`}
      ></div>
    </div>
  );
};

// Helper function to position the arrow
function getArrowPosition(position: 'top' | 'bottom' | 'left' | 'right' | 'inside-top' | 'inside-bottom' | 'inside-left' | 'inside-right', alignment: 'start' | 'center' | 'end') {
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
function getArrowBorderWidth(position: 'top' | 'bottom' | 'left' | 'right' | 'inside-top' | 'inside-bottom' | 'inside-left' | 'inside-right') {
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