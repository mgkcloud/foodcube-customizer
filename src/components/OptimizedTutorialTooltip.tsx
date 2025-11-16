import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTutorial, TutorialTargetId } from '@/contexts/TutorialContext';
import { tutorialManager } from '@/utils/tutorial';
import { PositionResult, RecalculationTrigger } from '@/utils/tutorial/types';
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

const computeArrowPosition = (position: string, alignment: string) => {
  const basePosition = position.replace('inside-', '');
  
  switch (basePosition) {
    case 'top':
      return {
        bottom: '-6px',
        left: alignment === 'start' ? '12px' : alignment === 'end' ? 'calc(100% - 12px)' : '50%',
        transform: 'translateX(-50%) rotate(45deg)',
      };
    case 'bottom':
      return {
        top: '-6px',
        left: alignment === 'start' ? '12px' : alignment === 'end' ? 'calc(100% - 12px)' : '50%',
        transform: 'translateX(-50%) rotate(45deg)',
      };
    case 'left':
      return {
        right: '-6px',
        top: alignment === 'start' ? '12px' : alignment === 'end' ? 'calc(100% - 12px)' : '50%',
        transform: 'translateY(-50%) rotate(45deg)',
      };
    case 'right':
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

const computeArrowBorderWidth = (position: string) => {
  const basePosition = position.replace('inside-', '');
  
  switch (basePosition) {
    case 'top':
      return '0 1px 1px 0';
    case 'bottom':
      return '1px 0 0 1px';
    case 'left':
      return '1px 1px 0 0';
    case 'right':
      return '0 0 1px 1px';
    default:
      return '0 1px 1px 0';
  }
};

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
  const [tooltipInstanceVersion, setTooltipInstanceVersion] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hasResolvedPosition, setHasResolvedPosition] = useState(false);
  const [resolvedPosition, setResolvedPosition] = useState(position);
  const [arrowPositionStyles, setArrowPositionStyles] = useState<React.CSSProperties>(() =>
    computeArrowPosition(position, alignment)
  );
  const [arrowBorderWidth, setArrowBorderWidth] = useState(() => computeArrowBorderWidth(position));
  
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
  
  const fallbackKey = fallbackTargetIds.join('|');
  const fallbackTargetsRef = useRef<TutorialTargetId[]>(fallbackTargetIds);
  
  useEffect(() => {
    fallbackTargetsRef.current = fallbackTargetIds;
  }, [fallbackTargetIds, fallbackKey]);
  
  const handlePositionChange = useCallback((result: PositionResult) => {
    setResolvedPosition(result.position);
    setArrowPositionStyles(result.arrowPosition || computeArrowPosition(result.position, alignment));
    setArrowBorderWidth(computeArrowBorderWidth(result.position));
    setHasResolvedPosition(true);
  }, [alignment]);
  
  // Initialize tooltip once the DOM node exists so we can hand the element to the tutorial manager
  useLayoutEffect(() => {
    if (!tooltipContainer) return;
    const tooltipElement = tooltipRef.current;
    if (!tooltipElement) return;
    
    setHasResolvedPosition(false);
    setResolvedPosition(position);
    setArrowPositionStyles(computeArrowPosition(position, alignment));
    setArrowBorderWidth(computeArrowBorderWidth(position));
    
    const newTooltipId = tutorialManager.createTooltip({
      targetId,
      fallbackTargetIds: fallbackTargetsRef.current,
      type: 'tooltip',
      position,
      alignment,
      zIndex,
      isActive: false,
      styleElement: tooltipElement,
      onPositionChange: handlePositionChange
    });
    
    if (newTooltipId) {
      tooltipIdRef.current = newTooltipId;
      setTooltipInstanceVersion((version) => version + 1);
    }
    
    return () => {
      const currentId = tooltipIdRef.current;
      if (currentId) {
        tutorialManager.deactivateElement(currentId);
        tutorialManager.removeElement(currentId);
        tooltipIdRef.current = '';
      }
    };
  }, [targetId, fallbackKey, position, alignment, zIndex, handlePositionChange, tooltipContainer]);

  // Update tooltip visibility whenever state changes or a new tooltip is created
  useEffect(() => {
    const currentId = tooltipIdRef.current;
    if (!currentId) return;
    if (isVisible) {
      tutorialManager.activateElement(currentId);
    } else {
      tutorialManager.deactivateElement(currentId);
    }
  }, [isVisible, tooltipInstanceVersion]);
  
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
  
  // Don't render anything if not visible or container not ready
  if (!isVisible || !tooltipContainer) return null;
  
  // The tooltip content is rendered using a portal
  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed backdrop-blur-xl bg-white/90 rounded-2xl shadow-2xl border border-white/20 p-7 w-80 max-w-[90vw] pointer-events-auto transition-all duration-500 ease-out"
      style={{
        zIndex,
        opacity: hasResolvedPosition ? 1 : 0,
        transform: hasResolvedPosition ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-8px)',
        boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.12), 0 8px 24px -8px rgba(0, 0, 0, 0.08)',
      }}
      data-testid={`tutorial-tooltip-${targetId}`}
      data-position={resolvedPosition}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex flex-col space-y-5">
        {/* Title section with icon */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              strokeWidth="2.5"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <h3 className="flex-1 font-semibold text-gray-900 text-lg leading-tight tracking-tight">
            {title}
          </h3>
        </div>

        {/* Content with better typography */}
        <p className="text-base leading-relaxed text-gray-700 font-normal">
          {content}
        </p>

        {/* Action buttons with refined styling */}
        <div className="flex justify-between items-center pt-3">
          {showBackButton && onPrev ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrev}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-colors px-4 py-2"
            >
              Back
            </Button>
          ) : (
            <div></div>
          )}

          <div className="flex gap-2">
            {showNextButton && (
              <Button
                size="sm"
                onClick={handleNext}
                className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200 px-5 py-2"
              >
                {isLastStep ? 'Finish' : (isInteractive ? 'Skip' : 'Next')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Refined arrow with glass effect */}
      <div
        className="absolute w-3 h-3 backdrop-blur-xl bg-white/90 transform rotate-45 border-white/20"
        style={{
          ...arrowPositionStyles,
          borderWidth: arrowBorderWidth,
          zIndex: 1,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}
        data-testid={`tutorial-tooltip-arrow-${targetId}`}
      ></div>
    </div>,
    tooltipContainer
  );
};

export default OptimizedTutorialTooltip;
