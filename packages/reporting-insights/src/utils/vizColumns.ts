/**
 * Derive the set of column names a visualization references, from its saved
 * config — WITHOUT needing to run its query. Used to populate a Filter widget's
 * column picker from the columns of the visualizations it targets.
 *
 * `config.columnTypes` is the richest source (it holds every query header, saved
 * on test-run); the field-based keys (xKey/yKeys/tableColumns/pivot*) cover charts
 * configured but never test-run.
 */
export function vizConfigColumns(viz: { config?: any }): string[] {
	const c = viz?.config ?? {};
	const out = new Set<string>();
	for (const k of Object.keys(c.columnTypes ?? {})) out.add(k);
	for (const k of c.tableColumns ?? []) out.add(k);
	for (const k of c.yKeys ?? []) out.add(k);
	for (const k of c.pivotRows ?? []) out.add(k);
	for (const k of c.pivotColumns ?? []) out.add(k);
	for (const k of c.pivotValues ?? []) out.add(k);
	if (c.xKey) out.add(c.xKey);
	if (c.label) out.add(c.label);
	if (c.size) out.add(c.size);
	if (c.colorKey) out.add(c.colorKey);
	return [...out].filter(Boolean);
}
