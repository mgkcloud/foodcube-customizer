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

describe('FoodcubeConfigurator Preset Configurations', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
  });

  test('L-shaped preset gives correct requirements', () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Apply L-shape preset
    fireEvent.click(screen.getByText('L-Shape'));

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
  });

  test('U-shaped preset gives correct requirements', () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Apply U-shape preset
    fireEvent.click(screen.getByText('U-Shape'));

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

  test('straight line preset gives correct requirements', () => {
    render(<FoodcubeConfigurator variants={mockVariants} onUpdate={mockOnUpdate} />);
    
    // Apply straight line preset
    fireEvent.click(screen.getByText('Straight (3x1)'));

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
});
