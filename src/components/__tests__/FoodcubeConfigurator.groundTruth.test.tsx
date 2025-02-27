import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  // Set the default timeout to 10 seconds (10000ms)
  jest.setTimeout(10000);

  beforeEach(() => {
    mockOnUpdate.mockClear();
    console.log("======= STARTING NEW TEST =======");
  });

  test('single cube with all edges cladded (4 edges)', async () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Place a single cube in the center
    const cells = screen.getAllByTestId(/^grid-cell-\d+-\d+$/);
    console.log(`Found ${cells.length} grid cells`);
    fireEvent.click(cells[4]); // Center cell
    
    // Wait for state updates to propagate
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
      console.log("State updated after placing cube");
    });

    // Add cladding to all edges
    const claddingEdges = screen.getAllByTestId('cladding-edge');
    console.log(`Found ${claddingEdges.length} cladding edges`);
    for (const edge of claddingEdges) {
      fireEvent.click(edge);
      // Wait for each cladding edge click to take effect
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
        console.log(`Cladding edge clicked: ${edge.getAttribute('data-edge')}`);
      });
    }

    // Verify against ground truth:
    // 1 four-pack (2 side + 1 left + 1 right)
    await waitFor(() => {
      console.log("Last mockOnUpdate call:", mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0]);
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
      console.log("Ground truth verification passed");
    });
    
    // Also check individual panel colors for corners and edges
    claddingEdges.forEach(edge => {
      const edgeType = edge.getAttribute('data-edge');
      const panelType = edge.getAttribute('data-panel-type');
      
      if (edgeType === 'N' || edgeType === 'S') {
        expect(panelType).toBe(PANEL_COLORS.side);
      } else if (edgeType === 'E') {
        expect(panelType).toBe(PANEL_COLORS.left);
      } else if (edgeType === 'W') {
        expect(panelType).toBe(PANEL_COLORS.right);
      }
      console.log(`Verified panel color for edge ${edgeType}: ${panelType}`);
    });
  });

  test('three cubes in line (8 edges)', async () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Place three cubes in a line
    const cells = screen.getAllByTestId(/^grid-cell-\d+-\d+$/);
    console.log("Placing three cubes in a line");
    fireEvent.click(cells[3]); // Left
    fireEvent.click(cells[4]); // Center
    fireEvent.click(cells[5]); // Right
    
    // Wait for state updates
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
      console.log("State updated after placing cubes");
    });

    // Add cladding to all exposed edges
    const claddingEdges = screen.getAllByTestId('cladding-edge');
    console.log(`Found ${claddingEdges.length} cladding edges for straight line`);
    for (const edge of claddingEdges) {
      fireEvent.click(edge);
      // Wait for each cladding edge click to take effect
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
        console.log(`Cladding edge clicked: ${edge.getAttribute('data-edge')}`);
      });
    }

    // Verify against ground truth:
    // 1 four-pack (2 side + 1 left + 1 right)
    // 1 2-pack (2 sides)
    // 1 2-pack (2 sides)
    // 2 straight couplings
    await waitFor(() => {
      console.log("Last mockOnUpdate call for straight line:", mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0]);
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
      console.log("Ground truth verification passed for straight line");
    });
  });

  test('L-shaped configuration (8 edges)', async () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Place cubes in an L-shape
    const cells = screen.getAllByTestId(/^grid-cell-\d+-\d+$/);
    console.log("Placing L-shape configuration");
    fireEvent.click(cells[3]); // Top left of L
    fireEvent.click(cells[4]); // Top right of L
    fireEvent.click(cells[7]); // Bottom right of L
    
    // Wait for state updates
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
      console.log("State updated after placing L-shape");
    });

    // Add cladding to all exposed edges
    const claddingEdges = screen.getAllByTestId('cladding-edge');
    console.log(`Found ${claddingEdges.length} cladding edges for L-shape`);
    for (const edge of claddingEdges) {
      fireEvent.click(edge);
      // Wait for each cladding edge click to take effect
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
        console.log(`Cladding edge clicked: ${edge.getAttribute('data-edge')}`);
      });
    }

    // Verify against ground truth:
    // 1 four-pack (2 side + 1 right + 1 left)
    // 2 two-packs (2 sides each)
    // 1 corner connector
    // 1 straight coupling
    await waitFor(() => {
      console.log("Last mockOnUpdate call for L-shape:", mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0]);
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
      console.log("Ground truth verification passed for L-shape");
    });
  });

  test('U-shaped configuration (12 edges)', async () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Place cubes in a U-shape
    const cells = screen.getAllByTestId(/^grid-cell-\d+-\d+$/);
    console.log("Placing U-shape configuration");
    fireEvent.click(cells[3]); // Top left of U
    fireEvent.click(cells[5]); // Top right of U
    fireEvent.click(cells[6]); // Bottom left of U
    fireEvent.click(cells[7]); // Bottom middle of U
    fireEvent.click(cells[8]); // Bottom right of U
    
    // Wait for state updates
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
      console.log("State updated after placing U-shape");
    });

    // Add cladding to all exposed edges
    const claddingEdges = screen.getAllByTestId('cladding-edge');
    console.log(`Found ${claddingEdges.length} cladding edges for U-shape`);
    for (const edge of claddingEdges) {
      fireEvent.click(edge);
      // Wait for each cladding edge click to take effect
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
        console.log(`Cladding edge clicked: ${edge.getAttribute('data-edge')}`);
      });
    }

    // Verify against ground truth:
    // 1 four-pack (2 side + 1 right + 1 left)
    // 2 two-packs (4 sides)
    // 2 corner connectors
    // 2 straight couplings
    await waitFor(() => {
      console.log("Last mockOnUpdate call for U-shape:", mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0]);
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
      console.log("Ground truth verification passed for U-shape");
    });
  });
});
