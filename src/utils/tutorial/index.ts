/**
 * High-Performance Tutorial System
 * 
 * This system provides a performance-optimized implementation of tutorial 
 * UI elements like spotlights and tooltips. It uses a deterministic update 
 * system rather than continuous polling, batches DOM operations, and carefully
 * manages resources to ensure smooth 60fps animation even on lower-end devices.
 */

// Core infrastructure exports
export * from './types';
export * from './TutorialElementObserver';
export * from './PositionCalculator';
export * from './StyleManager';
export * from './TutorialRenderLoop';
export * from './TutorialManager';
export * from './performance';

// Export a singleton instance for easier integration
import { TutorialManager } from './TutorialManager';
import { performanceTracker } from './performance';

/**
 * Singleton tutorial manager instance for application-wide use
 */
export const tutorialManager = new TutorialManager();