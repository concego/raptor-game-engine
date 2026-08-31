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
├── core/ # engine lifecycle, state, turns, commands, events
├── world/ # maps, grids, cells, positions, entities, occupancy
├── systems/ # movement, map transitions, collision, combat, AI, resources
├── input/ # keyboard, touch, command mapping
├── rendering/ # renderer contract and DOM/SVG visual adapters
├── feedback/ # accessibility, log, audio and haptics adapters
├── persistence/ # storage adapters and save data
└── utils/ # small generic utilities

tests/ # automated behavior tests
examples/ # small public demonstrations
```

## Rules

1. Core logic is deterministic whenever it receives an explicit random source.
2. Systems change state and emit events; they do not manipulate the DOM.
3. Inputs become abstract commands before reaching game systems.
4. Rendering, audio, accessibility and persistence are replaceable adapters.
5. Game-specific content belongs in the consuming game, not in the engine.
6. Every reusable system needs a focused example or test.
7. Rejected or blocked actions may return `{ consumesTurn: false }`; only resolved turn-consuming actions advance the turn.
8. Visual renderers are optional views; text, audio and accessibility adapters remain independent of them.

## Multiple maps and transitions

A game may define multiple named maps through `Engine({ maps, mapId })`. Each map owns its grid dimensions and entity collection. `GameState.mapId`, `GameState.grid` and `GameState.entities` always describe the active map, while `GameState.maps` preserves the inactive maps.

A portal is a passable entity created with `createPortal({ position, toMapId, toPosition })`. `MapTransitionSystem` runs after `MovementSystem`: entering a portal transfers the actor, switches the active map, updates the active entity collection and emits `map.transitioned`. The movement itself still consumes one turn. A missing map, invalid destination or occupied destination emits `map.transition.blocked` instead of crashing the game.

The engine does not assume that every transition is a door or portal. A consuming game can create other passable transition entities with the same `portal` contract, or provide another system for ladders, stairs, elevators and one-way exits.

## Feedback and accessibility

The event history is a passive view: it remains available for review but must not be a live region that is announced again on every turn.

Textual state and feedback remain available independently of any visual renderer. SVG is a visual option, not the primary accessibility channel.

Accessibility adapters may announce concise, intentionally selected state changes through a separate live region. They must never automatically read an entire history or replay all prior events after a new event arrives.

## First implementation target

The first vertical slice will be a tiny grid simulation with a player, movement, turns, entities and an event log. Dino Crawler will be used as the behavioral reference, not copied as a monolith.
