# Feature tracker — guide-to-code map

This ledger translates the attached **TextBaseRPG SystemRevamp Full Technical Guide** into this repository's implementation. GitHub Issues are the work queue: keep features independently reviewable, link their issue here, and only close them after the stated acceptance checks pass. The original repository had no issues or feature source files; this is a new, source-backed implementation rather than a port of unavailable source.

**Status key:** `Implemented (prototype)` means a working bounded local slice with tests, not guide-wide production acceptance. `Partial` means the surface/data exists but key owner behavior or acceptance work remains. `Not implemented` means do not assume the guide's described feature exists.

## Implemented prototype slices

| GitHub Issue | Guide feature | Status | Current implementation | Main acceptance evidence |
|---|---|---|---|---|
| [#1](https://github.com/urakkaamyx/TextRPG/issues/1) | Story creation and mandatory Worldbuilding Foundation (2, 7, 20) | Implemented (prototype) | `createStory` in `src/domain.js`; 11 profiles; stored anchor, map-init and foundation receipts | Story creation test verifies anchor and receipt |
| [#2](https://github.com/urakkaamyx/TextRPG/issues/2) | Story aggregate, events, receipts, persistence and revision (8–9) | Implemented (prototype) | JSON aggregate; atomic temp-file replacement; applied receipts; optimistic revision guard; idempotent turns | Domain tests and HTTP smoke check; restart persistence still needs dedicated automation |
| [#3](https://github.com/urakkaamyx/TextRPG/issues/3) | Fictional time, known-route travel, exploration and local search (10) | Implemented (prototype) | `AdvanceTime`/`AdvanceJourney`; local inspect/search; no remote position disclosure | Composite travel/search tests verify route order and projection privacy |
| [#4](https://github.com/urakkaamyx/TextRPG/issues/4) | NPC dialogue, work inquiries, funded paid work and currency (11–13) | Implemented (prototype) | Co-located dialogue; real offer/no-lead response; one funded pinned job and one-time payment | Tests check actor-bound speech, no payment for asking, source balance debit, credit and replay |
| [#5](https://github.com/urakkaamyx/TextRPG/issues/5) | Browser Story Chat, panels, references and player-safe projections (17) | Partial | Responsive three-column shell, transcript, world/people/journal/vitals/inventory/work/add-on panels, reference picker | UI source and responsive CSS; automated cross-browser/accessibility acceptance remains |
| [#6](https://github.com/urakkaamyx/TextRPG/issues/6) | Remaining gameplay-owner suite: trade, checks, quests, Survival, world simulation, weather, combat, genre rules (12–15, 19–20) | Not implemented / partial | A single source-bound consumable and bounded vital effect work; broader inventory/currency owner workflows and the full suite remain | Each owner needs authoritative state, validation, events/receipts, projection and negative/replay tests |
| [#7](https://github.com/urakkaamyx/TextRPG/issues/7) | Provider adapters, segmented narration, migration and release verification (9, 16, 18, 22–23) | Not implemented / partial | No AI provider is connected; deterministic bounded local resolver only | No-provider campaign, privacy canaries, narration schema, migration and UI acceptance remain |

## Remaining guide features — planned issues

Each row should become its own GitHub Issue and be implemented as a vertical slice with owner state, event/receipt evidence, player-safe projection, docs, and negative tests. Do not mark a broad domain complete because a placeholder panel or manifest exists.

| Feature slice | Guide chapters | Status | Acceptance focus |
|---|---:|---|---|
| Turn coordinator, intent decomposition, conditional batches and bounded replanning | 5–6 | Not implemented | Preserve every clause in compound requests; reject atomically; prove source IDs and command order |
| Player projection, privacy, knowledge and narrative evidence boundaries | 4–5, 11, 16, 26 | Partial | No remote locations, hidden values, fabricated speech, or uncommitted state in the narrator/UI payload |
| Atomic journal replay, crash recovery, migrations and idempotent HTTP recovery | 9 | Partial | Isolated fixture restore, replay equivalence, migration gates; preserve user saves |
| Map authoring, route discovery/blockage and world expansion | 10 | Partial | No invented routes; legitimate blockers and discovery receipts; exploration can find nothing |
| NPC schedules, duties, availability, memory, knowledge and relationships | 11, 15 | Not implemented | Location/time scoped; attributable memory; no remote omniscience |
| Job lifecycle, frozen offer versions, employer funding, materials and referrals | 11–13 | Partial | Original offer terms pin; exact time/material/account deltas; no double-pay or invented vacancy |
| Inventory mutation, item definitions, containers, currency accounts, trade and loot | 13 | Partial | Ownership and provenance for every grant, use, transfer, sale and payment |
| Checks, dice, scoped challenges, quest chronology and progression | 14 | Not implemented | Negative/replay tests; unrelated evidence cannot advance accepted objectives |
| Configured survival needs, fractional intervals, rest sessions and vital costs | 12 | Not implemented | No auto-drain absent policy; exact interval remainders and bounded recovery |
| Living-world simulation, duties, weather and settlement services | 15 | Not implemented | Fictional-time only; causal owner events; no real-time/background AI ticks |
| Segmented narration, public scene briefs and post-commit provider adapter | 16, 18 | Not implemented | Narration only after commit; structured segment/event IDs; safe speech attribution |
| Plugin manifests, command-reference audit and independent domain owners | 19 | Partial | A manifest never substitutes for owner; every advertised command has handler and tests |
| Story-local configuration, genre rules and versioned historical terms | 20 | Partial | Changes isolated per story; historical records remain pinned |
| Portrait Studio, panel arrangement, drag/reorder, responsive/accessibility QA | 17 | Partial | Keyboard/touch/focus/reduced-motion and viewport testing; no false image-generation claims |
| Verification suites, campaign tests, privacy canaries and acceptance evidence | 22–23 | Partial | Repeatable no-provider campaign, replay, negative controls, honest evidence tier |
| Legacy bridge and original-story migration | 9, 24, 26 | Not implemented | Explicitly authorized, clone-first migration and non-destructive restore drill |

## Delivery rules

- Link each feature PR to its GitHub Issue; use the issue acceptance checklist before coding.
- Implement authoritative behavior first; the browser is a projection, never a second rules engine.
- Store source evidence (events/receipts) for material effects, and test rejection paths.
- Keep original story saves out of scratch tests; use isolated disposable stories.
- Call a feature complete only after relevant deterministic, privacy, replay, and UI acceptance checks exist.
- The attached guide is an architecture reference, not proof that this prototype already has the complete 50-owner runtime or release-level acceptance.
