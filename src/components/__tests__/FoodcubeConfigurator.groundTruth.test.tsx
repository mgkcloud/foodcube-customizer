import { render, screen, fireEvent } from '@testing-library/react';
import { FoodcubeConfigurator } from '../FoodcubeConfigurator';
import { PANEL_COLORS } from '@/constants/colors';

const mockVariants = {
  fourPackRegular: {
    name: "4-Pack Regular",
    price: 29.99,
    description: "Regular height 4-pack of panels"
  },
  cornerConnectors: {
    name: "Corner Connector",
    price: 4.99,
    description: "Corner connector for joining panels"
  },
  straightCouplings: {
    name: "Straight Coupling",
    price: 3.99,
    description: "Straight coupling for joining panels"
  }
};

describe('FoodcubeConfigurator Ground Truth Configurations', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
  });

  test('single cube with all edges cladded (4 edges)', () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Place a single cube in the center
    const cells = screen.getAllByTestId(/^grid-cell-\d+-\d+$/);
    fireEvent.click(cells[4]); // Center cell

    // Add cladding to all edges
    const claddingEdges = screen.getAllByTestId('cladding-edge');
    claddingEdges.forEach(edge => {
      fireEvent.click(edge);
    });

    // Verify against ground truth:
    // 1 four-pack (2 side + 1 left + 1 right)
    expect(mockOnUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
      fourPackRegular: 1,
      fourPackExtraTall: 0,
      twoPackRegular: 0,
      twoPackExtraTall: 0,
      sidePanels: 2,
      leftPanels: 1,
      rightPanels: 1,
      straightCouplings: 0,
      cornerConnectors: 0
    }));

    // Verify panel types based on offset coupling
    claddingEdges.forEach(edge => {
      const edgeType = edge.getAttribute('data-edge');
      const panelType = window.getComputedStyle(edge).backgroundColor;
      
      // Due to offset coupling:
      // N/S are side panels (entry/exit faces)
      // E is left panel (offset side)
      // W is right panel (opposite offset side)
      if (edgeType === 'N' || edgeType === 'S') {
        expect(panelType).toBe(PANEL_COLORS.side);
      } else if (edgeType === 'E') {
        expect(panelType).toBe(PANEL_COLORS.left);
      } else if (edgeType === 'W') {
        expect(panelType).toBe(PANEL_COLORS.right);
      }
    });
  });

  test('three cubes in line (8 edges)', () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Place three cubes in a line
    const cells = screen.getAllByTestId(/^grid-cell-\d+-\d+$/);
    fireEvent.click(cells[3]); // Left
    fireEvent.click(cells[4]); // Center
    fireEvent.click(cells[5]); // Right

    // Add cladding to all exposed edges
    const claddingEdges = screen.getAllByTestId('cladding-edge');
    claddingEdges.forEach(edge => {
      fireEvent.click(edge);
    });

    // Verify against ground truth:
    // 1 four-pack (2 side + 1 left + 1 right)
    // 1 2-pack (2 sides)
    // 1 2-pack (2 sides)
    // 2 straight couplings
    expect(mockOnUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
      fourPackRegular: 1,
      fourPackExtraTall: 0,
      twoPackRegular: 2,
      twoPackExtraTall: 0,
      sidePanels: 6,
      leftPanels: 1,
      rightPanels: 1,
      straightCouplings: 2,
      cornerConnectors: 0
    }));
  });

  test('L-shaped configuration (8 edges)', () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Place three cubes in an L-shape
    const cells = screen.getAllByTestId(/^grid-cell-\d+-\d+$/);
    fireEvent.click(cells[4]); // Center
    fireEvent.click(cells[3]); // Left
    fireEvent.click(cells[7]); // Bottom

    // Add cladding to all exposed edges
    const claddingEdges = screen.getAllByTestId('cladding-edge');
    claddingEdges.forEach(edge => {
      fireEvent.click(edge);
    });

    // Verify against ground truth:
    // 1 four-pack (2 side + 1 right + 1 left)
    // 1 left (1 side)
    // 1 2-pack (2 sides)
    // 1 2-pack (2 sides)
    // 1 corner connector
    // 1 straight coupling
    expect(mockOnUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
      fourPackRegular: 1,
      fourPackExtraTall: 0,
      twoPackRegular: 2,
      twoPackExtraTall: 0,
      sidePanels: 5,
      leftPanels: 2,
      rightPanels: 1,
      straightCouplings: 1,
      cornerConnectors: 1
    }));

    // Verify panel types based on offset coupling
    claddingEdges.forEach(edge => {
      const edgeType = edge.getAttribute('data-edge');
      const flowDirection = edge.closest('[data-flow-direction]')?.getAttribute('data-flow-direction');
      const panelType = window.getComputedStyle(edge).backgroundColor;
      
      if (flowDirection === 'N→E') { // Corner piece
        if (edgeType === 'N' || edgeType === 'E') {
          expect(panelType).toBe(PANEL_COLORS.side);
        } else if (edgeType === 'S') {
          expect(panelType).toBe(PANEL_COLORS.left);
        } else if (edgeType === 'W') {
          expect(panelType).toBe(PANEL_COLORS.right);
        }
      }
    });
  });

  test('U-shaped configuration (12 edges)', () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Place five cubes in a U-shape
    const cells = screen.getAllByTestId(/^grid-cell-\d+-\d+$/);
    fireEvent.click(cells[3]); // Left
    fireEvent.click(cells[4]); // Center
    fireEvent.click(cells[5]); // Right
    fireEvent.click(cells[6]); // Bottom Left
    fireEvent.click(cells[8]); // Bottom Right

    // Add cladding to all exposed edges
    const claddingEdges = screen.getAllByTestId('cladding-edge');
    claddingEdges.forEach(edge => {
      fireEvent.click(edge);
    });

    // Verify against ground truth:
    // 1 four-pack (2 side + 1 right + 1 left)
    // 1 2-pack (2 sides)
    // 1 2-pack (2 sides)
    // 2 corner connectors
    // 2 straight couplings
    expect(mockOnUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
      fourPackRegular: 1,
      fourPackExtraTall: 0,
      twoPackRegular: 2,
      twoPackExtraTall: 0,
      sidePanels: 6,
      leftPanels: 1,
      rightPanels: 1,
      straightCouplings: 2,
      cornerConnectors: 2
    }));
  });
});
