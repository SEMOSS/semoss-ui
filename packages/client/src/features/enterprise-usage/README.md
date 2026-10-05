# Enterprise Usage And Activity

Admin settings route: `/settings/enterprise-usage`.

The route checks the authenticated admin role before creating an SDK `InsightProvider`. It waits for initialization before mounting report queries, and queries/downloads share that insight. Initialization failures remain visible instead of crashing the page.

Deploy this client with the corresponding SEMOSS backend changes:

- `AdminGetEnterpriseUsageReactor`
- `AdminGetEnterpriseUsageDetailReactor`
- `AdminGetEnterpriseUsageFilterOptionsReactor`
- `AdminExportEnterpriseUsageReactor`
- `prerna.auth.utils.EnterpriseUsageUtils`

The reactors register through the existing classpath discovery mechanism. A backend rebuild/restart is required; no RDF-map override or database migration is introduced.

## API boundary

The frontend sends typed requests to dedicated reactors. It has no SQL, database names, joins, or arbitrary query execution. All four reactors check `SecurityAdminUtils.getInstance(insight.getUser())` before reading a system database. The backend chooses an allowlisted source and view, builds fixed SQL, binds all filter/identifier/date/pagination values in prepared statements, and applies a 30-second query timeout. Execution uses the reusable `QueryExecutionUtility.ParameterizedQuery` and `flushRsToMap(engine, query, timeout)` overload, including result conversion and JDBC cleanup.

`AdminGetEnterpriseUsage` accepts:

| Parameter | Values |
| --- | --- |
| `source` | `model`, `activity` |
| `view` | `summary`, `trend`, `logs`; model only: `latency`, `feedback`, `ranking` |
| `startDate`, `endDate` | Inclusive calendar dates, at most 366 days |
| `user`, `app`, `engine` | Case-insensitive literal name/ID fragments; `=id` for exact ID drill-down |
| `dimension` | `user`, `app`, `engine` for ranking |
| `limit`, `offset` | Bounded non-negative pagination; at most 5,000 log records, 100 ranked entities (UI requests 20) |

`engine` is the shared model/engine filter, including exports. It matches `MESSAGE.AGENT_ID` for inference and `AUDIT_LOGS.ENGINE_ID` for activity across all engine types. The old `model` argument remains a compatibility alias; an explicit `engine` takes precedence.

`AdminGetEnterpriseUsageFilterOptions` accepts `dimension` (`user`, `app`, `engine`), optional `search` or exact `id`, and bounded `limit`/`offset`. It returns `{ rows, hasMore, limit, offset }`, projecting only `ENTITY_ID`, `ENTITY_NAME`, and `ENTITY_TYPE` from the security catalog. The UI fetches 50 choices per page. User choices display authentication type, but usage filtering matches the ID across types because inference logs do not store a provider. Historical identities can still be entered as exact IDs. A newly introduced reactor requires a backend rebuild/restart so the startup classpath scan discovers it.

`AdminGetEnterpriseUsageDetail` accepts `source` and `recordId`. It resolves message pairing and user/model/room boundaries on the server. No body content is returned in overview, ranking, or log metadata requests.

Read responses are `{ rows, limit, source }`. Missing/disabled databases and query failures are errors, not empty collections. The UI validates the response, restores documented nullable columns omitted by Gson, shows independently retryable source errors, and never substitutes a zero rate for a missing denominator.

## Metric definitions and provenance

| Metric | Definition |
| --- | --- |
| Model requests | Number of `MESSAGE` rows with `MESSAGE_TYPE = INPUT` |
| Input / output / total tokens | Recorded `MESSAGE_TOKENS` by message type / both types; null counts remain unavailable when all values are missing |
| Token coverage | Rows with recorded token counts divided by model message rows |
| Active users / apps / models / conversations | Distinct user / room project / message agent / room identifiers in matching inference rows |
| Average / p95 latency | Non-negative `RESPONSE_TIME` on RESPONSE rows only, converted from milliseconds; p95 uses nearest rank |
| Cache-read / cache-creation / thinking tokens | Provider-reported detail columns; not added to total tokens |
| Positive feedback | Positive rated responses divided by rated responses, matching feedback on both message ID and type |
| Platform events / users / failures | Rows / distinct users / explicit false outcomes in `AUDIT_LOGS` |
| Activity success rate | Explicit true outcomes divided by known outcomes; null outcomes excluded |
| Previous-period benchmark | Immediately preceding period of the same number of calendar days; both windows are inclusive |
| Last-year benchmark | Same calendar dates one year earlier, clamping February 29 to February 28 when necessary |
| Custom benchmark | Explicit inclusive start/end dates, at most 366 days, using the same user/app/engine filters |

Model data comes from `ModelInferenceLogsDatabase.MESSAGE`, `ROOM`, `AGENT`, and `FEEDBACK`. Platform events come from `AuditLogs.AUDIT_LOGS`. Definitions were checked against the backend OWL creators and `ModelEngineInferenceLogsWorker` (which writes one INPUT and one RESPONSE record per normal inference and stores response time in milliseconds).

Lookups collapse duplicate room/model rows before joining. Grouping uses stable IDs rather than display names. Date filters use a half-open interval ending at midnight after the selected end date. Daily charts zero-fill quiet days; missing latency remains a gap. Input and response records can fall on different dates. Logs use stable row-number pagination; new writes can shift later pages, so pagination is not a transactional snapshot.

Inference includes chat, embeddings and other model methods. Vector `nearestNeighbor` messages are excluded. App attribution uses the room's recorded project, which may be missing or reflect its historical association. Activity logs can include operations also represented in inference logs; do not sum the two populations. Retention, logging configuration, asynchronous writes and provider support limit completeness.

Spend, complete LLM failure rates, time to first token, department chargeback, quota utilization, and distinct human-versus-service adoption need additional authoritative telemetry/configuration. This dashboard does not estimate those values. Feedback is about rated responses, not a platform-wide quality score.

## Exports

`AdminExportEnterpriseUsage` accepts `source`, `view` (`overview`, `ranking`, `logs`), `format` (`csv`, or `pdf` for overview), the applied date/entity filters, ranking `dimension`, and optional `comparisonStartDate` / `comparisonEndDate`. The server queries and renders every file; no client-supplied rows, SQL, file paths, or export limits are accepted. It enforces admin authorization and the configured exporter permission, then returns an insight-scoped `FILE_DOWNLOAD` key through the existing download flow.

- KPI CSV includes applied filters, current/benchmark dates, generation time, and definitions.
- Top-consumer CSV queries the top 20 on the server, with its scope included.
- Log CSV queries the newest matching metadata records, up to 5,000, independent of the displayed page. Use narrower filters for larger datasets.
- PDF is generated with the existing Flying Saucer renderer and JFreeChart dependency. It includes a branded executive summary, current/benchmark charts, KPI comparisons, both periods' daily tables, reporting scope, generation attribution and reference, repeated headers, page numbers, and metric definitions. All dynamic text is escaped, chart images are generated in memory, and message bodies are excluded.
- CSV quotes delimiters/newlines and neutralizes spreadsheet formulas. PDF markup escapes all dynamic data.
- Export branding is resolved on the server from the active theme's `brand.name`, then the legacy top-level `name`, with `SEMOSS` used only when no valid name is configured. The PDF wordmark and repeated page headers/footers use that name as escaped text; CSV includes it in the report scope.
- Source files and static labels use ASCII characters. The backend currently compiles Java with `cp1252`, so non-ASCII test data uses Unicode escapes. Runtime Unicode is preserved: CSV explicitly writes UTF-8 with a BOM; the PDF renderer consumes a character reader and embeds the existing OpenPDF Liberation Sans font with Identity-H encoding. PDF glyph coverage follows that font (including extended Latin, Greek, and Cyrillic); scripts outside its coverage require an appropriate additional font. Do not convert runtime strings to ASCII or round-trip them through the default charset.
- Each export attempt emits the authenticated actor, scope, generation outcome, and row count through the existing engine logger / audit appender. This records file generation, not download completion; persistence depends on audit logging configuration.

## Dashboard Interaction And Comparisons

Overview lands on platform activity. Token Consumption is a separate tab with model KPIs and trends. Each dashboard queries and exports only its selected logging source.

Date Range offers Last 7/30/90 Days and Custom. Presets populate draft dates; Custom exposes start/end inputs. Entity dropdowns also edit the draft. Apply Filters highlights when dates or entities differ from the applied scope and commits them together. Search only queries the catalog. Applied filters remain visible above all tabs.

Charts use the existing Apache ECharts dependency with SVG rendering and resolved UI theme tokens. Native hover tooltips show actual current and benchmark dates and values. Dragging a date brush applies that current-period range across tabs; a simple click does not filter. The selection is a transparent outline; ECharts' unrelated rectangle/lasso/keep/clear toolbar is disabled. A compact Reset control on each filtered chart restores the base date window. Top-level custom dates provide a keyboard/touch alternative to dragging; the expandable Daily Data table exposes exact values.

Both complete comparison windows are displayed. Equal-length windows align by ordinal day with current calendar-date labels. Unequal windows use Day 1, Day 2, etc.; the shorter series has gaps outside its period. Volume KPI changes (requests, tokens, activity events) use daily averages when lengths differ, while displayed KPI totals remain full-period totals. Distinct users/apps/models/conversations are not divided by duration or assigned a misleading percentage change. Both day counts and these definitions are shown beside the benchmark selector. Unequal-period exports include total values, day counts and daily averages for additive metrics.

## Validation

Frontend: `pnpm --filter @semoss/client test src/features/enterprise-usage`, focused Biome check, client production build and full client type-check. The workspace has unrelated baseline type errors; inspect the full type-check output rather than only new files.

Backend tests in the SEMOSS repo: `EnterpriseUsageUtilsUnitTests`, `AdminGetEnterpriseUsageReactorUnitTests`, `AdminExportEnterpriseUsageReactorUnitTests`, and `QueryExecutionUtilityUnitTests`. They cover real H2 query execution, paired-message counts, duplicate lookups, inclusive date edges, null telemetry, literal search, exact-ID scoping, all report views, message detail, caps, JDBC resource cleanup, non-admin denial, exporter policy, real CSV/PDF output, and generation audit events. H2 is verified; custom system-log database dialects should be integration-tested before rollout.

Before handoff, scan all feature-owned source/tests/docs and added lines in shared files for non-ASCII characters (`rg -n '[^\x00-\x7F]' <paths>` should find none). Export regressions verify Unicode CSV data, PDF text and per-page themed branding; run the backend tests with the configured `cp1252` source encoding and a non-UTF-8 JVM default as well as UTF-8.

Browser verification uses synthetic log responses and the actual UI: populated/error/empty states, mobile and desktop layout, model-to-message drill-down, Escape dismissal, focus return, and light/dark theme tokens. It is not an authenticated production-data or screen-reader audit.
