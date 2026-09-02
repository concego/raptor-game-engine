# Raptor Game Engine

A modular 2D game engine for turn-based grid adventures, exploration, combat, and inclusive game design.

> The engine is in active development. The API may evolve before the first stable release.

## What it provides

- deterministic game state and turn-based command processing;
- grid positions, entities, occupancy and movement rules;
- multiple maps connected through portals;
- structured events for movement, scanning and map transitions;
- configurable scanning with range, visibility strategies and vision cones;
- replaceable input, rendering, accessibility, audio and persistence adapters;
- DOM and SVG renderers that remain outside the core game rules.

The core does not depend on HTML, CSS, the DOM, browser storage, audio files, speech synthesis or a specific game.

## Installation

Until a registry release is available, install directly from the repository:

```bash
npm install github:concego/raptor-game-engine
```

The package uses ECMAScript modules and requires Node.js 18 or newer.

## Quick start

```js
import { Engine, MovementSystem, moveCommand } from 'raptor-game-engine';

const engine = new Engine({ width: 3, height: 3 });

engine.addEntity({
  id: 'player',
  position: { x: 1, y: 1 }
});

engine.addSystem(new MovementSystem({ grid: engine.grid }));
engine.on('movement.completed', event => {
  console.log('Moved to', event.to);
});

// Commands are accepted after the engine starts.
engine.start();
const result = engine.dispatch(moveCommand(1, 0));

console.log(result.accepted);       // true
console.log(engine.state.turn);      // 1
```

## Public API

The package entry point exports:

- **Core:** `Engine`, `EventBus`, `createGameState`, `cloneGameState`, `TurnManager`;
- **Commands:** `COMMAND_TYPES`, `moveCommand`, `waitCommand`, `scanCommand`;
- **World:** `Grid`, `DIRECTIONS`, `FACING`, `position`, `addPosition`, `samePosition`, `EntityManager`, `MapManager`, `createPortal`;
- **Systems:** `MovementSystem`, `MapTransitionSystem`, `ScanSystem`;
- **Adapters and contracts:** `KeyboardInput`, `Renderer`, `DomRenderer`, `SvgRenderer`.

`DIRECTIONS` contains grid displacement vectors. `FACING` contains the canonical actor orientation tokens: `N`, `E`, `S` and `W`.

## Architecture

The data flow is:

```text
Input adapter → Command → Systems → GameState → Events → Feedback adapters
```

Systems change state and emit structured events. The consuming project decides how those events are rendered, announced, logged, persisted or turned into audio and haptic feedback.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the architectural rules and boundaries.

## Testing

Run the complete automated test suite with:

```bash
npm test
```

The repository also contains a small vertical slice and focused tests for collisions, multiple maps, scanning, visibility and renderer contracts.
