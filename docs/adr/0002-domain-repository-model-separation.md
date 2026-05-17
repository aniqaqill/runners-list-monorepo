# Separate domain structs from repository models

Domain entities (`Race`, `RunningClub`, `ClubSession`, `User`) are pure Go structs with no GORM or JSON tags. Each repository adapter owns a separate persistence model (`RaceRow`, etc.) with GORM tags and a mapper function between the two.

Embedding `gorm.Model` in domain structs couples the core business layer to the ORM — a violation of the hexagonal architecture the codebase is already attempting. Swapping or mocking the persistence layer requires changing domain types, and tests that import domain structs transitively pull in GORM.

The separation is introduced during the `Events` → `Race` rename (the natural moment to touch those files).

## Consequences

More files per domain entity (domain struct + repository model + mapper). This is intentional — the verbosity is the point of the exercise and enforces the boundary at the type level.
