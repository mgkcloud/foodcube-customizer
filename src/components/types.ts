export type CompassDirection = 'N' | 'S' | 'E' | 'W';

export interface CubeConnection {
  entry: CompassDirection | null;
  exit: CompassDirection | null;
}

export interface GridCell {
  id: string;
  row: number;
  col: number;
  hasCube: boolean;
  type: string;
  claddingEdges: Set<CompassDirection>;
  excludedCladdingEdges: Set<CompassDirection>;
  connections: CubeConnection;
  rotation: 0 | 90 | 180 | 270;
  subgrid?: { subgridRow: number; subgridCol: number }[];
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
