/**
 * Tutorial System Performance Optimization Types
 */

/**
 * Enum representing the specific triggers that necessitate a recalculation
 */
export enum RecalculationTrigger {
  STEP_CHANGE = 'step_change',       // Tutorial step changed
  TARGET_MUTATION = 'target_mutation',   // Target element attributes/content changed
  TARGET_RESIZE = 'target_resize',     // Target element size changed
  TARGET_VISIBILITY = 'target_visibility', // Target element visibility changed
  WINDOW_RESIZE = 'window_resize',     // Window dimensions changed
  SCROLL_STABILIZED = 'scroll_stabilized', // Scrolling has stopped
  MANUAL_TRIGGER = 'manual_trigger'     // Force recalculation
}

/**
 * Type representing the current state of each trigger
 */
export type TriggerState = {
  [key in RecalculationTrigger]: boolean;
};

/**
 * Types of element changes the observer can detect
 */
export enum ElementChangeType {
  ATTRIBUTES = 'attributes',
  SIZE = 'size',
  POSITION = 'position',
  VISIBILITY = 'visibility',
  CHILDREN = 'children',
  REMOVAL = 'removal'
}

/**
 * Data stored about each observed element
 */
export interface ObserverData {
  element: Element;
  observeAttributes: boolean;
  observeChildren: boolean;
  observeSize: boolean;
  observeVisibility: boolean;
  callbacks: Set<(element: Element, changes: ElementChangeType[]) => void>;
  lastBounds?: DOMRect;
  isVisible?: boolean;
}

/**
 * Element measurements used for position calculations
 */
export interface ElementMeasurements {
  rect: DOMRect;
  computedStyle: CSSStyleDeclaration;
  scrollPosition: {
    scrollTop: number;
    scrollLeft: number;
  };
  viewportSize: {
    width: number;
    height: number;
  };
  isVisible: boolean;
  zIndex: number;
}

/**
 * Parameters for position calculation
 */
export interface PositionParams {
  targetElement: HTMLElement;
  containerElement?: HTMLElement;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  alignment?: 'start' | 'center' | 'end';
  padding?: number;
  offset?: number;
}

/**
 * Result of position calculation
 */
export interface PositionResult {
  top: number;
  left: number;
  width: number;
  height: number;
  position: 'top' | 'bottom' | 'left' | 'right' | 'inside-top' | 'inside-bottom' | 'inside-left' | 'inside-right';
  transform: string;
  arrowPosition?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    transform: string;
  };
}

/**
 * Style definition for applying and restoring styles
 */
export interface StyleDefinition {
  [key: string]: string;
}

/**
 * Tutorial element interface for the render loop
 */
export interface TutorialElement {
  id: string;
  element: HTMLElement;
  type: 'spotlight' | 'tooltip';
  isActive: boolean;
  needsUpdate: boolean;
  lastMeasurement?: ElementMeasurements;
  calculateStyles: (measurement: ElementMeasurements) => StyleDefinition;
}

/**
 * Configuration for tutorial elements
 */
export interface TutorialElementConfig {
  targetId: string;
  fallbackTargetIds?: string[];
  type: 'spotlight' | 'tooltip';
  position?: 'top' | 'bottom' | 'left' | 'right';
  alignment?: 'start' | 'center' | 'end';
  padding?: number;
  showPointer?: boolean;
  pointerPosition?: 'top' | 'bottom' | 'left' | 'right';
  zIndex?: number;
  isActive: boolean;
  isInteractive?: boolean;
}