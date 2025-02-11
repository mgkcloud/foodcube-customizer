import { render, screen, fireEvent } from '@testing-library/react';
import { FoodcubeConfigurator } from '../FoodcubeConfigurator';

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

describe('FoodcubeConfigurator Panel Packing', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
  });

  test('correctly packs panels into 4-packs', () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Create a 2x2 square of cubes
    const cells = screen.getAllByTestId(/^grid-cell-\d+-\d+$/);
    fireEvent.click(cells[0]); // Top-left
    fireEvent.click(cells[1]); // Top-right
    fireEvent.click(cells[3]); // Bottom-left
    fireEvent.click(cells[4]); // Bottom-right

    // Add cladding to all exposed edges
    const claddingEdges = screen.getAllByTestId('cladding-edge');
    claddingEdges.forEach(edge => {
      fireEvent.click(edge);
    });

    // Verify that panels are packed efficiently
    const lastUpdate = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0];
    
    // Calculate total panels
    const totalPanels = lastUpdate.sidePanels + lastUpdate.leftPanels + lastUpdate.rightPanels;
    
    // Calculate minimum required 4-packs
    const expectedFourPacks = Math.floor(totalPanels / 4);
    
    expect(lastUpdate.fourPackRegular).toBe(expectedFourPacks);
  });

  test('packs remaining panels into 2-packs', () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Create an L-shape configuration
    const cells = screen.getAllByTestId(/^grid-cell-\d+-\d+$/);
    fireEvent.click(cells[4]); // Center
    fireEvent.click(cells[3]); // Left
    fireEvent.click(cells[7]); // Bottom

    // Add cladding to all exposed edges
    const claddingEdges = screen.getAllByTestId('cladding-edge');
    claddingEdges.forEach(edge => {
      fireEvent.click(edge);
    });

    const lastUpdate = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0];
    
    // Calculate total panels
    const totalPanels = lastUpdate.sidePanels + lastUpdate.leftPanels + lastUpdate.rightPanels;
    
    // Calculate remaining panels after 4-packs
    const remainingPanels = totalPanels - (lastUpdate.fourPackRegular * 4);
    
    // Calculate expected 2-packs
    const expected2Packs = Math.floor(remainingPanels / 2);
    
    expect(lastUpdate.twoPackRegular).toBe(expected2Packs);
  });
});
