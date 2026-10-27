import { runPixel } from "@semoss/sdk";
import type {
	DataStoreEngine,
	DataStoreEngineType,
} from "../features/bpmn-viewer/bpmn-engine-match";

const DATA_STORE_ENGINE_TYPES: readonly DataStoreEngineType[] = [
	"DATABASE",
	"STORAGE",
	"VECTOR",
];

interface EngineRow {
	engine_id?: unknown;
	engine_name?: unknown;
	engine_display_name?: unknown;
	engine_type?: unknown;
}

function isDataStoreEngineType(value: unknown): value is DataStoreEngineType {
	return DATA_STORE_ENGINE_TYPES.some((type) => type === value);
}

/**
 * Lists the database, storage and vector engines the current user can access,
 * for matching imported BPMN data stores to real engines.
 */
export async function listDataStoreEngines(): Promise<DataStoreEngine[]> {
	const response = await runPixel(
		`META | MyEngines(engineTypes=${JSON.stringify(DATA_STORE_ENGINE_TYPES)}, limit=[1000], offset=[0]);`,
	);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join("\n"));
	}
	const output = response.pixelReturn?.[0]?.output;
	if (!Array.isArray(output)) return [];

	const engines: DataStoreEngine[] = [];
	for (const row of output as EngineRow[]) {
		if (
			typeof row.engine_id !== "string" ||
			!isDataStoreEngineType(row.engine_type)
		) {
			continue;
		}
		engines.push({
			id: row.engine_id,
			names: [row.engine_display_name, row.engine_name].filter(
				(name): name is string => typeof name === "string" && !!name,
			),
			type: row.engine_type,
		});
	}
	return engines;
}
