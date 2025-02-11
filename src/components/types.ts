export type CompassDirection = 'N' | 'S' | 'E' | 'W';

export interface CubeConnection {
  entry: CompassDirection | null;
  exit: CompassDirection | null;
}

export interface GridCell {
  hasCube: boolean;
  claddingEdges: Set<CompassDirection>;
  connections: CubeConnection;
}

export interface Requirements {
  fourPackRegular: number;
  fourPackExtraTall: number;
  twoPackRegular: number;
  twoPackExtraTall: number;
  leftPanels: number;
  rightPanels: number;
  sidePanels: number;
  cornerConnectors: number;
  straightCouplings: number;
}