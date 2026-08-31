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
├── world/ # grid, cells, positions, entities, occupancy
├── systems/ # movement, collision, combat, AI, resources
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

## Feedback and accessibility

The event history is a passive view: it remains available for review but must not be a live region that is announced again on every turn.

Textual state and feedback remain available independently of any visual renderer. SVG is a visual option, not the primary accessibility channel.

Accessibility adapters may announce concise, intentionally selected state changes through a separate live region. They must never automatically read an entire history or replay all prior events after a new event arrives.

## First implementation target

The first vertical slice will be a tiny grid simulation with a player, movement, turns, entities and an event log. Dino Crawler will be used as the behavioral reference, not copied as a monolith.
