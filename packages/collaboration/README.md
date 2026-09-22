# Collaboration

Standalone SEMOSS collaboration workspace based on the Teamwork client reference.

## Development

```bash
pnpm dev:collaboration
```

The app runs on port `5180`. Configure `ENDPOINT`, `MODULE`, `APP`, `ACCESS_KEY`, and
`SECRET_KEY` through the workspace environment when connecting to a SEMOSS backend.

The initial route shell covers Home, Attention, Agents, agent settings, rooms, and
Settings. Agent and room API workflows will be added under `src/features` using the
workspace SDK and validated reactor responses.
