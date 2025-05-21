import React, { useEffect, useRef } from 'react';
import { TutorialTargetId } from '@/contexts/TutorialContext';
import { tutorialManager } from '@/utils/tutorial';
import { RecalculationTrigger } from '@/utils/tutorial/types';

interface OptimizedSpotlightProps {
  targetId: TutorialTargetId;
  fallbackTargetIds?: TutorialTargetId[];
  isActive: boolean;
  onClick?: () => void;
  allowClickThrough?: boolean;
  showPointer?: boolean;
  pointerPosition?: 'top' | 'bottom' | 'left' | 'right';
  zIndex?: number;
  padding?: number;
  isInteractive?: boolean;
}

/**
 * A high-performance spotlight component that highlights elements on the page
 * using direct DOM manipulation with minimal recalculation.
 */
export const OptimizedSpotlight: React.FC<OptimizedSpotlightProps> = ({
  targetId,
  fallbackTargetIds = [],
  isActive,
  showPointer = false,
  pointerPosition = 'top',
  zIndex = 10000,
  padding = 4,
  isInteractive = false,
}) => {
  // Reference to store the spotlight element ID
  const spotlightIdRef = useRef<string>('');
  
  // Track active state
  const isActiveRef = useRef<boolean>(false);
  
  useEffect(() => {
    // Create spotlight on mount
    spotlightIdRef.current = tutorialManager.createSpotlight({
      targetId,
      fallbackTargetIds,
      type: 'spotlight',
      showPointer,
      pointerPosition,
      zIndex,
      padding,
      isActive: false, // Start inactive
      isInteractive // Pass interactive state
    });
    
    return () => {
      // Clean up spotlight on unmount
      if (spotlightIdRef.current) {
        tutorialManager.removeElement(spotlightIdRef.current);
      }
    };
  }, [targetId]); // Only recreate if target ID changes
  
  useEffect(() => {
    // Update active state when it changes
    if (isActive !== isActiveRef.current && spotlightIdRef.current) {
      if (isActive) {
        tutorialManager.activateElement(spotlightIdRef.current);
      } else {
        tutorialManager.deactivateElement(spotlightIdRef.current);
      }
      
      isActiveRef.current = isActive;
    }
  }, [isActive]);
  
  // Trigger updates when props change
  useEffect(() => {
    if (isActive && spotlightIdRef.current) {
      tutorialManager.triggerUpdate(RecalculationTrigger.MANUAL_TRIGGER);
    }
  }, [showPointer, pointerPosition, zIndex, padding, isActive, isInteractive]);
  
  // Direct DOM manipulation as a fallback to ensure the target element gets the spotlight class
  useEffect(() => {
    let targetElement: HTMLElement | null = null;
    
    if (isActive) {
      console.log(`[OptimizedSpotlight] Attempting to find target for ID: ${targetId}`);
      
      // Try multiple selector strategies to find the target element
      const selectors = [
        `[data-testid="${targetId}"]`,
        `[data-cell-id="${targetId}"]`,
        `#${targetId}`,
        `[id="${targetId}"]`,
        `[data-grid-cell="${targetId}"]`,
        `[data-edge-id="${targetId}"]`,
      ];
      
      // Find target element
      let matchedSelector = '';
      
      // Try each selector until we find an element
      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector);
          if (element && element instanceof HTMLElement) {
            targetElement = element;
            matchedSelector = selector;
            break;
          }
        } catch (e) {
          // Ignore invalid selectors
        }
      }
      
      // Try fallbacks if primary target not found
      if (!targetElement && fallbackTargetIds.length > 0) {
        console.log(`[OptimizedSpotlight] Primary target not found, trying fallbacks: ${fallbackTargetIds.join(', ')}`);
        
        for (const fallbackId of fallbackTargetIds) {
          for (const selector of [
            `[data-testid="${fallbackId}"]`,
            `#${fallbackId}`,
            `[id="${fallbackId}"]`,
          ]) {
            try {
              const element = document.querySelector(selector);
              if (element && element instanceof HTMLElement) {
                targetElement = element;
                matchedSelector = selector;
                break;
              }
            } catch (e) {
              // Ignore invalid selectors
            }
          }
          
          if (targetElement) break;
        }
      }
      
      // If found, directly apply inline styles instead of relying on CSS classes
      if (targetElement) {
        console.log(`[OptimizedSpotlight] Target found with selector: ${matchedSelector}`);
        
        // Store original styles for cleanup
        const originalStyles = {
          position: targetElement.style.position,
          zIndex: targetElement.style.zIndex,
          outline: targetElement.style.outline,
          outlineOffset: targetElement.style.outlineOffset,
          boxShadow: targetElement.style.boxShadow,
          animation: targetElement.style.animation
        };
        
        // Store original styles on the element for cleanup
        targetElement.dataset.originalStyles = JSON.stringify(originalStyles);
        
        // Add spotlight class for backwards compatibility
        targetElement.classList.add('spotlight-target');
        
        // Apply critical spotlight styles inline to ensure they're visible even if CSS isn't loaded
        const elementStyle = targetElement.style;
        // Don't modify position as it can break layouts
        elementStyle.zIndex = '9999';
        elementStyle.outline = '3px solid #3b82f6';
        elementStyle.outlineOffset = `${padding + 2}px`;
        elementStyle.boxShadow = '0 0 15px rgba(59, 130, 246, 0.7), 0 0 30px rgba(59, 130, 246, 0.4)';
        
        // Add animation if supported
        try {
          elementStyle.animation = 'spotlight-glow 1.5s infinite ease-in-out';
        } catch (e) {
          // Animation not supported, fallback to static styles
        }
        
        // Add interactive styles if needed
        if (isInteractive) {
          targetElement.classList.add('interactive');
          elementStyle.outline = '3px solid #f59e0b';
          elementStyle.boxShadow = '0 0 15px rgba(245, 158, 11, 0.7), 0 0 30px rgba(245, 158, 11, 0.4)';
        }
        
        // Add animation keyframes to the document if they don't exist
        if (!document.getElementById('spotlight-keyframes')) {
          const style = document.createElement('style');
          style.id = 'spotlight-keyframes';
          style.textContent = `
            @keyframes spotlight-glow {
              0% {
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.7), 0 0 0 6px rgba(37, 99, 235, 0.3);
                outline-color: #2563eb;
              }
              50% {
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.8), 0 0 0 8px rgba(37, 99, 235, 0.4);
                outline-color: #3b82f6;
              }
              100% {
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.7), 0 0 0 6px rgba(37, 99, 235, 0.3);
                outline-color: #2563eb;
              }
            }
          `;
          document.head.appendChild(style);
        }
      } else {
        console.warn(`[OptimizedSpotlight] Could not find target element for: ${targetId}`);
      }
    }
    
    // Cleanup function to remove styles when the component unmounts or when isActive becomes false
    return () => {
      if (targetElement) {
        // Restore original styles if available
        try {
          if (targetElement.dataset.originalStyles) {
            const originalStyles = JSON.parse(targetElement.dataset.originalStyles);
            
            // Restore each style property
            for (const [property, value] of Object.entries(originalStyles)) {
              targetElement.style[property as any] = value as string;
            }
            
            // Clean up data attribute
            delete targetElement.dataset.originalStyles;
          }
          
          // Remove classes
          targetElement.classList.remove('spotlight-target', 'interactive');
        } catch (e) {
          console.warn('Error cleaning up spotlight styles:', e);
        }
      }
    };
  }, [isActive, targetId, fallbackTargetIds, isInteractive, padding]);
  
  // This component does not render any DOM elements directly
  return null;
};

export default OptimizedSpotlight;