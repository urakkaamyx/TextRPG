# TextBasedRPG

A local, persistent text RPG prototype inspired by the attached **TextBaseRPG SystemRevamp System Guide**. In this checkout, “SystemRevamp” is treated as the project architecture—not a separate product name.

## Run it

Requires Node.js 20 or later. No package install, API key, hosted AI provider, database, or account is needed.

```sh
npm start
```

Open [http://localhost:4173](http://localhost:4173). To change the bind/port, set `HOST` or `PORT`. Story files are saved atomically under `data/stories/` (ignored by Git). For development, use `npm run dev`.

Run deterministic tests with:

```sh
npm test
```

## What works in this first implementation

- Create and locally save multiple stories; choose from 11 genre profiles.
- A mandatory world foundation, a known starting location, known routes, a fictional clock, and a small seeded cast.
- A responsive three-column story interface with World, People, Journal, Character, Inventory, Work, Add-ons, and reference views.
- Grounded local actions for known-route travel, inspection, co-located dialogue, person search, waiting/resting time, a bounded consumable/vital effect, and one explicitly offered/funded paid job.
- Composite turns such as travel → arrive → speak, source events and applied receipts, story revisions, retry idempotency, and stale-write protection.
- Server-authoritative state changes, atomic save replacement, bounded natural-language handling, local-only storage, and tests for privacy and economic invariants.
- Plugin-style enablement for installed story modules. World/time/exploration/dialogue foundation systems cannot be switched off.

The game deliberately does not claim that prose has changed the world: unsupported requests produce a clear no-action result. There is no AI planner or narrator connected; the current local engine handles a small, explicit set of patterns.

## Feature plan and current limits

The attached guide describes a much larger runtime. This repository started with only a README, so this implementation is a clean, runnable foundation—not a port of a missing C#/.NET 10 codebase. Combat, advanced checks, quests, crafting, trade, configurable survival/rest sessions, weather simulation, NPC schedules and memory, provider authentication, migration, extensive accessibility/browser acceptance, and the guide's many separately tracked gameplay owners remain unimplemented. The UI marks no placeholder as a working subsystem.

See [`docs/FEATURES.md`](docs/FEATURES.md) for the guide-to-code map and acceptance status. GitHub Issues [#1–#7](https://github.com/urakkaamyx/TextRPG/issues) now track the feature slices and remaining work; keep each follow-up tied to its issue and close it only after its acceptance checks pass.

## Trust and safety notes

- This is a local single-user prototype. Do not expose the server to an untrusted network or use it as a multi-user hosted service; it currently has no authentication or account isolation.
- Game data is written as JSON beneath `data/stories/`. Back up this directory if you need to preserve stories.
- No provider or external network call is part of gameplay. The web interface uses local system fonts and same-origin API requests.
