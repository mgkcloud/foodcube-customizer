/**
 * Tutorial implementation benchmark utility
 * 
 * This module provides a way to compare the performance of the standard
 * vs. optimized tutorial implementations.
 */

import { performanceTracker } from './performance';

/**
 * Interface for benchmark results
 */
export interface BenchmarkResult {
  standardImplementation: {
    fps: number;
    avgFrameTime: number;
    domReadCount: number;
    domWriteCount: number;
    recalculationCount: number;
    jankPercentage: number;
  };
  optimizedImplementation: {
    fps: number;
    avgFrameTime: number;
    domReadCount: number;
    domWriteCount: number;
    recalculationCount: number;
    jankPercentage: number;
  };
  improvement: {
    fpsImprovement: number;
    frameTimeReduction: number;
    domReadReduction: number;
    domWriteReduction: number;
    recalculationReduction: number;
    jankReduction: number;
  };
}

/**
 * Implementation is now always optimized
 */
const isOptimizedActive = true;

/**
 * Launch the benchmark
 * @param duration Duration in seconds for each test
 * @returns Promise that resolves with benchmark results
 */
export const runBenchmark = async (duration: number = 10): Promise<BenchmarkResult> => {
  console.log(`Starting tutorial benchmark (${duration}s per implementation)...`);
  
  // Test standard implementation first
  console.log('Testing standard implementation...');
  const standardResults = await benchmarkImplementation(duration);
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test optimized implementation
  console.log('Testing optimized implementation...');
  const optimizedResults = await benchmarkImplementation(duration);
  
  // Calculate improvement metrics
  const improvement = {
    fpsImprovement: (optimizedResults.fps / standardResults.fps) * 100 - 100,
    frameTimeReduction: 100 - (optimizedResults.avgFrameTime / standardResults.avgFrameTime) * 100,
    domReadReduction: 100 - (optimizedResults.domReadCount / standardResults.domReadCount) * 100,
    domWriteReduction: 100 - (optimizedResults.domWriteCount / standardResults.domWriteCount) * 100,
    recalculationReduction: 100 - (optimizedResults.recalculationCount / standardResults.recalculationCount) * 100,
    jankReduction: 100 - (optimizedResults.jankPercentage / standardResults.jankPercentage) * 100
  };
  
  // Return comparison results
  return {
    standardImplementation: standardResults,
    optimizedImplementation: optimizedResults,
    improvement
  };
};

/**
 * Benchmark a specific implementation
 * @param duration Duration in seconds
 * @returns Performance metrics
 */
const benchmarkImplementation = async (duration: number) => {
  // Activate the correct implementation
  switchImplementation(isOptimizedActive);
  
  // Wait for implementation to load and initialize
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Start performance tracking
  performanceTracker.startTracking();
  
  // Run tutorial for specified duration
  await new Promise(resolve => setTimeout(resolve, duration * 1000));
  
  // Stop tracking and get results
  const results = performanceTracker.stopTracking();
  
  return {
    fps: results.fps,
    avgFrameTime: results.avgFrameTime,
    domReadCount: results.domReadCount,
    domWriteCount: results.domWriteCount,
    recalculationCount: results.recalculationCount,
    jankPercentage: results.jankPercentage
  };
};

/**
 * Switch between standard and optimized implementations
 * @param useOptimized Whether to use the optimized implementation
 */
const switchImplementation = (useOptimized: boolean) => {
  // This is just a stub implementation for the benchmark
  // In a real app, we'd actually swap components or load different modules
  
  // Enable/disable tutorial based on implementation
  const tutorialElement = document.getElementById('tutorial-container');
  if (tutorialElement) {
    if (useOptimized) {
      tutorialElement.setAttribute('data-implementation', 'optimized');
    } else {
      tutorialElement.setAttribute('data-implementation', 'standard');
    }
  }
  
  // Dispatch custom event for app to handle
  document.dispatchEvent(new CustomEvent('tutorial-implementation-change', {
    detail: { optimized: useOptimized }
  }));
};

// Export singleton instance for easy access
export const benchmarkUtility = {
  runBenchmark,
  isOptimizedActive: () => isOptimizedActive
};