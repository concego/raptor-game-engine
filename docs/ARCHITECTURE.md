# Raptor Game Engine — Architecture

## Direction

Raptor is a modular 2D engine for turn-based grid adventures, exploration, combat, and inclusive game design.

The engine core must not depend on HTML, CSS, audio files, browser storage, or a specific game.

## Data flow

```text
Input adapter → Command → Systems → GameState → Events → Feedback adapters
```

## Planned structure

```text
src/
├── core/ # engine lifecycle, state, turns, commands, events
├── world/ # maps, grids, cells, positions, entities, occupancy
├── systems/ # movement, map transitions, scanning, collision, combat, AI, resources
├── input/ # configurable keyboard and other command mappings
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
4. Keyboard keys and other input bindings belong to the consuming project, not the engine core.
5. Rendering, audio, accessibility and persistence are replaceable adapters.
6. Game-specific content belongs in the consuming game, not in the engine.
7. Every reusable system needs a focused example or test.
8. Rejected or blocked actions may return `{ consumesTurn: false }`; only resolved turn-consuming actions advance the turn.
9. Visual renderers are optional views; text, audio and accessibility adapters remain independent of them.

## Input bindings

`KeyboardInput` is an optional adapter. A consuming project supplies its own key-to-command bindings, so the engine does not impose arrows, WASD or any other layout. Bindings may be command factories, allowing commands to be created for each key event. The same commands can also come from buttons, touch controls, gamepads or assistive technology.

## Multiple maps and transitions

A game may define multiple named maps through `Engine({ maps, mapId })`. Each map owns its grid dimensions and entity collection. `GameState.mapId`, `GameState.grid` and `GameState.entities` always describe the active map, while `GameState.maps` preserves the inactive maps.

A portal is a passable entity created with `createPortal({ position, toMapId, toPosition })`. `MapTransitionSystem` runs after `MovementSystem`: entering a portal transfers the actor, switches the active map, updates the active entity collection and emits `map.transitioned`. The movement itself still consumes one turn. A missing map, invalid destination or occupied destination emits `map.transition.blocked` instead of crashing the game.

The engine does not assume that every transition is a door or portal. A consuming game can create other passable transition entities with the same `portal` contract, or provide another system for ladders, stairs, elevators and one-way exits.

## Configurable scanning

`scanCommand()` and `ScanSystem` provide a generic spatial query. A project configures the actor, range, distance function, target filter, result description, optional cost strategy and whether a successful scan consumes a turn. Costs remain project-defined, so they can represent charges, O₂, mana, energy or any other resource without coupling the engine to a specific game.

The system emits structured `scan.completed`, `scan.empty` or `scan.blocked` events. It does not choose a key, speak, play audio, manipulate the DOM or localize labels. Feedback adapters and the consuming project decide how to present the results to players and screen readers.

## Scan geometry adaptation

The Scan API incorporates the reusable geometric idea from `ECJ Game Library`'s `GridMap` without importing its separate map state or event system. In addition to the default Manhattan-radius query, `ScanSystem` can enable an optional `visionCone: { angle }` and obtain the actor's facing through `getDirection`.

The vision cone uses the same grid convention as the library: `N`, `E`, `S` and `W`, with north as zero degrees and clockwise angles. Missing facing is reported as `scan.blocked` with reason `no-facing`, instead of spending a cost or silently producing an incorrect result. Line-of-sight rules can be supplied by the consumer through the `isVisible` callback, so map-specific occlusion does not enter the engine core.

## Feedback and accessibility

The event history is a passive view: it remains available for review but must not be a live region that is announced again on every turn.

Textual state and feedback remain available independently of any visual renderer. SVG is a visual option, not the primary accessibility channel.

Accessibility adapters may announce concise, intentionally selected state changes through a separate live region. They must never automatically read an entire history or replay all prior events after a new event arrives.

## First implementation target

The first vertical slice will be a tiny grid simulation with a player, movement, turns, entities and an event log. Dino Crawler will be used as the behavioral reference, not copied as a monolith.
