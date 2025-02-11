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

describe('FoodcubeConfigurator Basic Functionality', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
  });

  test('renders with initial empty state', () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Cladding Configurator')).toBeInTheDocument();
    expect(screen.getByText('Tap grid to place Foodcube')).toBeInTheDocument();
  });

  test('places cube and toggles all cladding', () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Click the center cell to place a cube
    const cells = screen.getAllByTestId(/^grid-cell-\d+-\d+$/);
    const centerCell = cells[4]; // Center cell in 3x3 grid
    fireEvent.click(centerCell);

    // Toggle all cladding edges
    const claddingEdges = screen.getAllByTestId('cladding-edge');
    claddingEdges.forEach(edge => {
      fireEvent.click(edge);
    });

    expect(mockOnUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
      fourPackRegular: 1,
      straightCouplings: 0,
      cornerConnectors: 0
    }));
  });

  test('updates requirements when toggling cladding', () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Click the center cell to place a cube
    const cells = screen.getAllByTestId(/^grid-cell-\d+-\d+$/);
    const centerCell = cells[4];
    fireEvent.click(centerCell);

    // Get initial update values
    const initialCall = mockOnUpdate.mock.calls[0][0];

    // Toggle all available cladding edges
    const claddingEdges = screen.getAllByTestId('cladding-edge');
    claddingEdges.forEach(edge => {
      fireEvent.click(edge);
    });

    // Get final update values
    const finalCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0];

    // Expect more panels/connectors after adding cladding
    const initialTotal = initialCall.straightCouplings + initialCall.cornerConnectors;
    const finalTotal = finalCall.straightCouplings + finalCall.cornerConnectors;
    expect(finalTotal).toBeGreaterThan(initialTotal);
  });
});
