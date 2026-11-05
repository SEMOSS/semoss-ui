/** Engine types a BPMN data store can stand for. */
export type DataStoreEngineType = "DATABASE" | "STORAGE" | "VECTOR";

/** An engine the user can reach, reduced to what data-store matching needs. */
export interface DataStoreEngine {
	id: string;
	/** Every label the engine goes by (display name, name). */
	names: string[];
	type: DataStoreEngineType;
}

function normalize(value: string): string {
	return value.trim().toLowerCase();
}

/**
 * Finds the engine a BPMN data store names.
 *
 * A BPMN file only carries a label, so the match is by exact name or id,
 * ignoring case. An ambiguous label (two engines share it) returns undefined
 * rather than picking one at random.
 */
export function matchDataStoreEngine(
	engines: readonly DataStoreEngine[],
	storeName: string,
): DataStoreEngine | undefined {
	const wanted = normalize(storeName);
	if (!wanted) return undefined;
	const matches = engines.filter(
		(engine) =>
			normalize(engine.id) === wanted ||
			engine.names.some((name) => normalize(name) === wanted),
	);
	return matches.length === 1 ? matches[0] : undefined;
}
