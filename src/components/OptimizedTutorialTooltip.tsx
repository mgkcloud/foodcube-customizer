import React, { useEffect, useRef, useState } from 'react';
import { useTutorial, TutorialTargetId } from '@/contexts/TutorialContext';
import { tutorialManager } from '@/utils/tutorial';
import { RecalculationTrigger } from '@/utils/tutorial/types';
import { Button } from "@/components/ui/button";
import { createPortal } from 'react-dom';

interface OptimizedTutorialTooltipProps {
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

/**
 * A high-performance tooltip component for the tutorial system
 * that uses direct positioning and minimal recalculation.
 */
export const OptimizedTutorialTooltip: React.FC<OptimizedTutorialTooltipProps> = ({
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
  // Use the shared tutorial context
  const { manuallyAdvanceStep } = useTutorial();
  
  // References
  const tooltipIdRef = useRef<string>('');
  const isVisibleRef = useRef<boolean>(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // State for portal container
  const [tooltipContainer, setTooltipContainer] = useState<HTMLElement | null>(null);
  
  // Create portal container for tooltips
  useEffect(() => {
    let container = document.getElementById('tutorial-tooltips-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'tutorial-tooltips-container';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '99999999999999999999';
      document.body.appendChild(container);
    }
    setTooltipContainer(container);
    
    return () => {
      // Don't remove the container on unmount as other tooltips might use it
    };
  }, []);
  
  // Initialize tooltip on mount
  useEffect(() => {
    // Create tooltip element (not visible yet)
    tooltipIdRef.current = tutorialManager.createTooltip({
      targetId,
      fallbackTargetIds,
      type: 'tooltip',
      position,
      alignment,
      zIndex,
      isActive: false
    });
    
    return () => {
      // Clean up tooltip on unmount
      if (tooltipIdRef.current) {
        tutorialManager.removeElement(tooltipIdRef.current);
      }
    };
  }, [targetId]);
  
  // Update tooltip visibility
  useEffect(() => {
    if (isVisible !== isVisibleRef.current && tooltipIdRef.current) {
      if (isVisible) {
        tutorialManager.activateElement(tooltipIdRef.current);
      } else {
        tutorialManager.deactivateElement(tooltipIdRef.current);
      }
      
      isVisibleRef.current = isVisible;
    }
  }, [isVisible]);
  
  // Trigger updates when props change
  useEffect(() => {
    if (isVisible && tooltipIdRef.current) {
      tutorialManager.triggerUpdate(RecalculationTrigger.MANUAL_TRIGGER);
    }
  }, [position, alignment, zIndex, isVisible]);
  
  // Handle the next button click
  const handleNext = () => {
    if (isInteractive) {
      // For interactive steps, manually advance
      manuallyAdvanceStep();
    } else {
      // For normal steps, use the callback
      onNext();
    }
  };
  
  // Function to get arrow position based on tooltip position
  const getArrowPosition = (position: string, alignment: string) => {
    // Extract position from tooltip position (which could include 'inside-')
    const basePosition = position.replace('inside-', '');
    
    switch (basePosition) {
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
      default:
        return {
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
        };
    }
  };
  
  // Function to get arrow border width based on tooltip position
  const getArrowBorderWidth = (position: string) => {
    // Extract position from tooltip position (which could include 'inside-')
    const basePosition = position.replace('inside-', '');
    
    switch (basePosition) {
      case 'top':
        return '0 1px 1px 0'; // Border on right and bottom for arrow pointing down
      case 'bottom':
        return '1px 0 0 1px'; // Border on top and left for arrow pointing up
      case 'left':
        return '1px 1px 0 0'; // Border on top and right for arrow pointing left
      case 'right':
        return '0 0 1px 1px'; // Border on bottom and left for arrow pointing right
      default:
        return '0 1px 1px 0';
    }
  };
  
  // Don't render anything if not visible or container not ready
  if (!isVisible || !tooltipContainer) return null;
  
  // The tooltip content is rendered using a portal
  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed bg-white rounded-lg shadow-lg border border-blue-100 p-4 w-64 max-w-[90vw] pointer-events-auto transition-all duration-300 ease-in-out"
      style={{
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
          ...getArrowPosition(position, alignment),
          borderWidth: getArrowBorderWidth(position),
          zIndex: 1, // Ensure arrow is above tooltip content
        }}
        data-testid={`tutorial-tooltip-arrow-${targetId}`}
      ></div>
    </div>,
    tooltipContainer
  );
};

export default OptimizedTutorialTooltip;