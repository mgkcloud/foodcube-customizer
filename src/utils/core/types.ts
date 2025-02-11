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

export interface ConnectionPath {
  sequence: number;
  cubes: Array<{
    row: number;
    col: number;
    entry: CompassDirection;
    exit: CompassDirection;
  }>;
  isValid: boolean;
}

export interface CouplingRequirements {
  straight: number;
  cornerLeft: number;
  cornerRight: number;
}

export interface PanelRequirements {
  sidePanels: number;
  leftPanels: number;
  rightPanels: number;
  straightCouplings: number;
  cornerConnectors: number;
}

export interface TotalRequirements extends PanelRequirements {
  straightCouplings: number;
  cornerConnectors: number;
  fourPackRegular: number;
  fourPackExtraTall: number;
  twoPackRegular: number;
  twoPackExtraTall: number;
}
