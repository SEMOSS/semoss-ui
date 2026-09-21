# n8n LLM Conversion Fallback

## Goal

Keep n8n import and export deterministic for mappings we understand, while allowing a host application to provide an LLM fallback for new or unsupported node types.

The LLM is an enhancement, not a replacement for the current adapters.

## Import Flow

1. Parse and shape-validate the n8n JSON.
2. Convert known nodes with the existing deterministic mapping:
   - manual trigger
   - wait
   - if
   - set
   - LangChain agent
3. Preserve graph connections, positions, labels, and the existing workflow document format.
4. Identify unsupported nodes that were converted to the existing `developer.python` placeholder.
5. If a conversion model was supplied, call it once for the import with:
   - all unsupported n8n nodes
   - the complete workflow, including connection context
   - the available SEMOSS automation node types
   - the expected batch result shape
6. Validate each returned conversion independently at runtime.
7. Replace a placeholder only when its matching conversion is valid.
8. On timeout, model error, invalid JSON, unsupported output type, or a missing conversion, retain the blank Python placeholder and add a warning.
9. Continue importing all other nodes even when one conversion fails.

## Model Contract

The model callback is supplied by the host. The automation package does not own model selection, credentials, room state, or project parameters.

```ts
interface N8nImportConversionModel {
    (input: N8nImportConversionInput): Promise<N8nImportConversionResult>;
}
```

The callback is invoked once per import, not once per node. Its input contains all unsupported
nodes and its response contains a `conversions` array keyed by `nodeId`. Each conversion is
validated independently, so one invalid item falls back without discarding successful items.

The host can use the existing Assistant/model configuration and pass project-scoped parameters through its own implementation. The callback should use structured output and must not mutate the workflow directly.

## Safety Rules

- Deterministic mappings always win.
- The model never controls node IDs or graph edges.
- The model may select a supported SEMOSS node type and provide config/source only.
- Model output is validated before it reaches the canvas.
- A failed model call never blocks the rest of the import.
- The existing Python placeholder remains the final fallback.
- Imported Python is editable and visibly marked with a warning.

## Export Flow

The first implementation targets import fallback. Export should follow the same pattern later:

1. Export known SEMOSS nodes with deterministic mappings.
2. Identify nodes that become Code-node fallbacks.
3. Optionally ask the host model to produce a valid n8n node definition.
4. Validate the returned node and preserve the existing Code-node fallback on failure.
5. Never allow the model to alter connection topology without a separate validated graph result.

## Rollout Plan

- [x] Preserve existing deterministic import mappings.
- [x] Add an optional async import conversion callback contract.
- [x] Validate model results and retain placeholder fallback behavior.
- [ ] Wire the client workbench to a real structured model call.
- [ ] Add cancellation and timeout handling at the host boundary.
- [ ] Add conversion telemetry and a reviewable import summary.
- [ ] Add the equivalent optional export fallback.
- [ ] Add fixtures and tests for successful, invalid, timed-out, and unavailable model calls.
