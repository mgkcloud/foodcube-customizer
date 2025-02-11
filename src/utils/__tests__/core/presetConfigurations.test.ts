import { countPanels } from '../panelCounter';
import { detectConnections } from '../connectionDetector';
import { validateIrrigationPath } from '../connectionValidator';
import {
  createSingleCube,
  createLineCubes,
  createLShapeCubes,
  createUShapeCubes,
  EXPECTED_COUNTS
} from '../presetConfigurations';

describe('Preset Configurations', () => {
  describe('Single Cube', () => {
    const grid = createSingleCube();

    it('should have valid irrigation path', () => {
      const paths = validateIrrigationPath(grid);
      expect(paths.length).toBe(1);
      expect(paths[0].isValid).toBe(true);
    });

    it('should count panels correctly', () => {
      const result = countPanels(grid);
      expect(result).toEqual({
        sidePanels: EXPECTED_COUNTS.singleCube.sidePanels,
        leftPanels: EXPECTED_COUNTS.singleCube.leftPanels,
        rightPanels: EXPECTED_COUNTS.singleCube.rightPanels
      });
    });

    it('should detect correct connections', () => {
      const connections = detectConnections(grid);
      expect(connections.straight).toBe(EXPECTED_COUNTS.singleCube.straightCouplings);
      expect(connections.cornerLeft + connections.cornerRight).toBe(EXPECTED_COUNTS.singleCube.cornerConnectors);
    });
  });

  describe('Line Configuration', () => {
    const grid = createLineCubes();

    it('should have valid irrigation path', () => {
      const paths = validateIrrigationPath(grid);
      expect(paths.length).toBe(1);
      expect(paths[0].isValid).toBe(true);
    });

    it('should count panels correctly', () => {
      const result = countPanels(grid);
      expect(result).toEqual({
        sidePanels: EXPECTED_COUNTS.lineCubes.sidePanels,
        leftPanels: EXPECTED_COUNTS.lineCubes.leftPanels,
        rightPanels: EXPECTED_COUNTS.lineCubes.rightPanels
      });
    });

    it('should detect correct connections', () => {
      const connections = detectConnections(grid);
      expect(connections.straight).toBe(EXPECTED_COUNTS.lineCubes.straightCouplings);
      expect(connections.cornerLeft + connections.cornerRight).toBe(EXPECTED_COUNTS.lineCubes.cornerConnectors);
    });
  });

  describe('L-Shape Configuration', () => {
    const grid = createLShapeCubes();

    it('should have valid irrigation path', () => {
      const paths = validateIrrigationPath(grid);
      expect(paths.length).toBe(1);
      expect(paths[0].isValid).toBe(true);
    });

    it('should count panels correctly', () => {
      const result = countPanels(grid);
      expect(result).toEqual({
        sidePanels: EXPECTED_COUNTS.lShapeCubes.sidePanels,
        leftPanels: EXPECTED_COUNTS.lShapeCubes.leftPanels,
        rightPanels: EXPECTED_COUNTS.lShapeCubes.rightPanels
      });
    });

    it('should detect correct connections', () => {
      const connections = detectConnections(grid);
      expect(connections.straight).toBe(EXPECTED_COUNTS.lShapeCubes.straightCouplings);
      expect(connections.cornerLeft + connections.cornerRight).toBe(EXPECTED_COUNTS.lShapeCubes.cornerConnectors);
    });
  });

  describe('U-Shape Configuration', () => {
    const grid = createUShapeCubes();

    it('should have valid irrigation path', () => {
      const paths = validateIrrigationPath(grid);
      expect(paths.length).toBe(1);
      expect(paths[0].isValid).toBe(true);
    });

    it('should count panels correctly', () => {
      const result = countPanels(grid);
      expect(result).toEqual({
        sidePanels: EXPECTED_COUNTS.uShapeCubes.sidePanels,
        leftPanels: EXPECTED_COUNTS.uShapeCubes.leftPanels,
        rightPanels: EXPECTED_COUNTS.uShapeCubes.rightPanels
      });
    });

    it('should detect correct connections', () => {
      const connections = detectConnections(grid);
      expect(connections.straight).toBe(EXPECTED_COUNTS.uShapeCubes.straightCouplings);
      expect(connections.cornerLeft + connections.cornerRight).toBe(EXPECTED_COUNTS.uShapeCubes.cornerConnectors);
    });
  });
});
