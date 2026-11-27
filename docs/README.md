# SEMOSS Docs

Reference for people and agents. [AGENTS.md](../AGENTS.md) is the entry point and routes here;
task procedures are in [skills/](../skills/README.md).

## Standards

Rules for what good code looks like. `general.md` is the base; the others build on it. Each fact
lives in one place; others link to it.

| Standard | Covers |
|---|---|
| [general.md](./standards/general.md) | Principles, comments, architecture, design, naming, exports, boundaries, requests, scope, changing existing code |
| [typescript.md](./standards/typescript.md) | Types |
| [react.md](./standards/react.md) | Components, hooks, effects, data access, performance, [state](./standards/react.md#state), [forms](./standards/react.md#forms) |
| [ui.md](./standards/ui.md) | [Styling](./standards/ui.md#styling), [accessibility](./standards/ui.md#accessibility), [responsive and touch](./standards/ui.md#responsive-and-touch), [UI text](./standards/ui.md#ui-text). Composition is in [DESIGN.md](../DESIGN.md) |
| [testing.md](./standards/testing.md) | Test naming, what to test, validation commands |

## Architecture

How the system fits together across packages.

| Doc | Covers |
|---|---|
| [packages.md](./architecture/packages.md) | Package map, dependency graph, public APIs, [state migration](./architecture/packages.md#state-migration) |
| [i18n.md](./architecture/i18n.md) | Lazy loading, namespaces, resources |

## Features

Knowledge about a feature lives in its code: types, tests, and comments on the symbols that own
each rule ([comments](./standards/general.md#comments)). A feature gets an `AGENTS.md` only for
what the code cannot carry, such as a contract that spans files or packages, or a backend or
vendor fact. Keep it short, and never repeat what the code says.

## Maintaining

Use the [maintain-agent-docs skill](../skills/maintain-agent-docs.skill.md).

### Future Work

- Enforce the package graph with Biome `noRestrictedImports` overrides or a dependency check,
  then shorten the prose that describes it.
- Add a markdown link check to CI.
