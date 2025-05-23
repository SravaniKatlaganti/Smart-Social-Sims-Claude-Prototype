# Smart Social Sims

A browser-based social simulation game where autonomous agents interact, form relationships, and navigate their daily lives based on their needs and memories.

## Features

- **Autonomous Agents**: NPCs make decisions based on their needs (hunger, social, energy, fun)
- **Memory System**: Agents remember interactions and locations
- **Pathfinding**: A* algorithm for intelligent navigation
- **Social Interactions**: Agents can chat, form friendships, and influence each other
- **Dynamic World**: Grid-based world with various locations (homes, park, cafe, etc.)

## Getting Started

1. Clone this repository
2. Open `index.html` in a modern web browser
3. Click "Play" to start the simulation

## Controls

- **Click** on agents to view their details
- **Play/Pause** button to control simulation
- **Speed Slider** to adjust simulation speed (0.5x - 3x)
- **Reset** button to restart the simulation

## Architecture

### Core Modules

- **main.js**: Entry point, initializes game loop and UI
- **world.js**: Manages the grid-based world and rendering
- **agent.js**: Defines Agent class with AI behaviors
- **memory.js**: Implements memory storage for agents
- **pathfinding.js**: A* pathfinding implementation

### Game Loop

1. Update agent needs
2. Process agent decisions
3. Execute movements
4. Handle interactions
5. Update memories
6. Render frame

## Development

### Adding New Behaviors

Extend the `Agent` class in `agent.js`:

```javascript
class CustomAgent extends Agent {
    makeDecision() {
        // Custom decision logic
    }
}
