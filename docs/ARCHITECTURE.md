# Raptor Game Engine — Architecture

## Direction

Raptor is a modular 2D engine for turn-based grid adventures, exploration, combat, and inclusive game design.

The engine core must not depend on HTML, CSS, audio files, browser storage, or a specific game.

## Data flow

```text
Input → Command → Systems → GameState → Events → Adapters
```

## Planned structure

```text
src/
├── core/          # engine lifecycle, state, turns, commands, events
├── world/         # grid, cells, positions, entities, occupancy
├── systems/       # movement, collision, combat, AI, resources
├── input/         # keyboard, touch, command mapping
├── rendering/     # DOM renderer first; other renderers later
├── feedback/      # accessibility, log, audio and haptics adapters
├── persistence/   # storage adapters and save data
└── utils/         # small generic utilities

tests/             # automated behavior tests
examples/          # small public demonstrations
```

## Rules

1. Core logic is deterministic whenever it receives an explicit random source.
2. Systems change state and emit events; they do not manipulate the DOM.
3. Inputs become abstract commands before reaching game systems.
4. Rendering, audio, accessibility and persistence are replaceable adapters.
5. Game-specific content belongs in the consuming game, not in the engine.
6. Every reusable system needs a focused example or test.

## First implementation target

The first vertical slice will be a tiny grid simulation with a player, movement, turns, entities and an event log. Dino Crawler will be used as the behavioral reference, not copied as a monolith.

