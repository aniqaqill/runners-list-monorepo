# Single service with package-level domain separation

The platform covers multiple domains — Race aggregation, Running Clubs, Club Sessions, social publishing — that could be split into separate services. We chose to keep a single Go binary with one deployment unit and enforce domain boundaries through Go packages (`race/`, `club/`, `session/`, `publisher/`) rather than network boundaries.

At hobby scale (one country, handful of users, solo developer), the operational overhead of multiple services (inter-service auth, distributed tracing, independent deploy pipelines, network latency) outweighs any isolation benefit. Package boundaries are enforceable via Go's import rules and provide the same conceptual separation without the distributed systems complexity.

## Considered Options

- **Microservices from day one** — rejected; adds distributed systems overhead with no scale justification
- **Single service, no internal structure** — rejected; domain concepts (Race vs Club Session) would bleed into each other

## Consequences

When the team grows or a genuine scaling boundary emerges (e.g. social publishing has wildly different load characteristics), extract the relevant package into its own service. The package boundary will already be clean.
