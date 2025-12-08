import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTutorial, TutorialTargetId } from '@/contexts/TutorialContext';
import { tutorialManager } from '@/utils/tutorial';
import { PositionResult, RecalculationTrigger } from '@/utils/tutorial/types';
import { toast } from "@/components/ui/use-toast";

interface OptimizedTutorialTooltipProps {
  stepId?: string;
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
  stepId,
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

  // Notify host app about tutorial-specific mode changes (e.g., cladding step)
  useEffect(() => {
    if (!isVisible || !stepId) return;

    const mode = stepId === 'toggle-cladding' ? 'cladding' : 'cube';
    window.dispatchEvent(
      new CustomEvent('tutorial-interaction-mode', {
        detail: { mode }
      })
    );
  }, [isVisible, stepId]);

  // Signal bottom sheet toggle for the "try another layout" step
  useEffect(() => {
    if (!stepId) return;
    const open = isVisible && stepId === 'try-another-preset';
    window.dispatchEvent(
      new CustomEvent('tutorial-bottomsheet', { detail: { open } })
    );
  }, [isVisible, stepId]);

  // Render tutorial steps as toast panels instead of anchored tooltips
  const lastToastRef = useRef<{ dismiss: () => void } | null>(null);
  useEffect(() => {
    if (!isVisible || !stepId) return;
    // Dismiss previous tutorial toast to avoid stacking
    lastToastRef.current?.dismiss?.();
    const handlePrevClick = () => {
      lastToastRef.current?.dismiss?.();
      onPrev?.();
    };
    const handleNextClick = () => {
      lastToastRef.current?.dismiss?.();
      if (isInteractive) {
        manuallyAdvanceStep();
      } else {
        onNext();
      }
    };
    const handleSkipClick = () => {
      lastToastRef.current?.dismiss?.();
      onSkip?.();
    };

    lastToastRef.current = toast({
      title,
      description: (
        <div className="space-y-3">
          <p className="text-sm text-gray-800">{content}</p>
          <div className="flex justify-between items-center gap-2">
            {onPrev ? (
              <button
                onClick={handlePrevClick}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              {showSkipButton && onSkip && (
                <button
                  onClick={handleSkipClick}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100"
                >
                  Skip
                </button>
              )}
              {showNextButton && (
                <button
                  onClick={handleNextClick}
                  className="px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isLastStep ? "Finish" : isInteractive ? "Skip" : "Next"}
                </button>
              )}
            </div>
          </div>
        </div>
      ),
      duration: 10000,
    });
  }, [isVisible, stepId, title, content, onPrev, onNext, onSkip, isInteractive, showNextButton, showSkipButton, isLastStep, manuallyAdvanceStep]);
  
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
  
  // Don't render any anchored tooltip UI; the tutorial messaging is delivered via toast
  return null;
};

export default OptimizedTutorialTooltip;
