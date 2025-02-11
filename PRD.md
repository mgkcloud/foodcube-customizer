# Cladding Cube Customizer - Product Requirements Document

## Overview
The Cladding Cube Customizer is a tool for calculating and visualizing the required panels and couplings for food cube configurations. It analyzes irrigation flow paths to determine the correct panel types and quantities needed for valid cube arrangements.

## Core Components

### 1. Flow Analysis System
- **Purpose**: Determines how irrigation flows through connected food cubes
- **Components**:
  - `flowValidator`: Validates irrigation paths through cubes
  - `connectionDetector`: Identifies connections between cubes
  - `irrigationRules`: Defines valid flow patterns

### 2. Panel Calculation System
- **Purpose**: Calculates required panels based on flow analysis
- **Components**:
  - `panelCounter`: Counts raw panel requirements based on flow
  - `panelPacker`: Optimizes panel distribution into packs
  - `rules`: Defines panel type determination rules

### 3. Visualization System
- **Purpose**: Provides visual feedback of configurations
- **Components**:
  - `CladdingVisualizer`: Shows panel placements
  - `PipelineVisualizer`: Shows irrigation flow

## Data Flow

1. **Grid Configuration Input**
   - User places cubes in grid
   - System validates cube connections
   - Flow paths are determined

2. **Flow Analysis**
   - `flowValidator` analyzes cube connections
   - Valid paths are identified
   - Flow direction through each cube is determined

3. **Panel Calculation**
   - `panelCounter` determines raw panel needs:
     - Analyzes each cube's position in flow
     - Determines panel types (side/left/right)
     - Counts required couplings
   - `panelPacker` optimizes panel distribution:
     - Groups panels into standard packs
     - Handles special cases (L-shape, U-shape)
     - Validates final configuration

4. **Visualization**
   - Updates visual representation
   - Shows panel placements
   - Indicates flow direction

## Configuration Rules

### Panel Types
- **Side Panels**: Used where flow enters/exits cube
- **Left/Right Panels**: Determined by position relative to flow
- **Extra Panels**: Required for turns (L-shape)

### Standard Configurations
1. **Single Cube (4 edges)**
   - 1 four-pack (2 side + 1 left + 1 right)

2. **Three Cubes in Line (8 edges)**
   - 1 four-pack
   - 2 two-packs
   - 2 straight couplings

3. **L-Shape (8 edges)**
   - 1 four-pack
   - 1 two-packs
   - 1 extra side panel
   - 1 extra left/right panel
   - 1 corner connector
   - 1 straight coupling

4. **U-Shape (12 edges)**
   - 1 four-pack
   - 2 two-packs
   - 2 corner connectors
   - 2 straight couplings

## Validation Rules

1. **Flow Validation**
   - All cubes must be connected
   - No T-junctions allowed
   - Valid entry/exit points required

2. **Panel Validation**
   - All exposed edges must be covered
   - Panel types must match flow direction
   - Correct coupling types for connections

3. **Configuration Validation**
   - Total panel count must match edges
   - Coupling count must match connections
   - Panel packs must follow standard rules

## Technical Architecture

### Core Utilities
- `gridUtils`: Grid manipulation functions
- `debugLogger`: Debugging support
- `testUtils`: Testing helpers

### Calculation Layer
- `calculation/`: Panel counting and packing logic
- `validation/`: Flow and configuration validators
- `core/`: Fundamental rules and types

### UI Layer
- `components/`: React components
- `hooks/`: Custom React hooks
- `types/`: TypeScript definitions

## Future Considerations

1. **Extensibility**
   - Support for new cube configurations
   - Additional panel pack types
   - Custom coupling types

2. **Performance**
   - Optimize flow calculations
   - Cache common configurations
   - Reduce unnecessary recalculations

3. **Visualization**
   - 3D visualization support
   - Interactive flow animation
   - Enhanced error feedback

## Success Metrics

1. **Accuracy**
   - 100% correct panel calculations
   - Valid flow path detection
   - Proper panel type assignment

2. **Usability**
   - Clear visual feedback
   - Intuitive cube placement
   - Helpful error messages

3. **Performance**
   - Real-time calculation updates
   - Smooth visualization
   - Efficient panel packing
