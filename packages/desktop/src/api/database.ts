import type { DesktopInstanceProfile, InstanceConfig } from "@/types";
import { runPixel } from "./pixel";

export type DatabaseQueryMode = "SQL" | "SPARQL";

export interface DatabaseColumn {
	column: string;
	type: string;
}

export interface DatabaseTable {
	table: string;
	columns: DatabaseColumn[];
}

export type DatabaseStatementResult =
	| {
			statement: number;
			query: string;
			route: string;
			timeToRun: number;
			type: "TABLE";
			status: "SUCCESS";
			output: { headers: string[]; values: unknown[][] };
	  }
	| {
			statement: number;
			query: string;
			route: string;
			timeToRun: number;
			type: "MESSAGE";
			status: "SUCCESS";
			message: string;
	  }
	| {
			statement: number;
			query: string;
			route: string;
			timeToRun: number;
			type: "ERROR";
			status: "ERROR";
			message: string;
	  }
	| {
			statement: number;
			query: string;
			route: string;
			timeToRun: number;
			type: "SKIPPED";
			status: "SKIPPED";
			message: string;
	  };

export type DatabaseQueryResult =
	| { type: "ERROR"; message: string; timeToRun: number }
	| {
			type: "TABLE";
			output: { headers: string[]; values: unknown[][] };
			timeToRun: number;
	  }
	| { type: "MESSAGE"; message: string; timeToRun: number }
	| { type: "JSON"; output: unknown; timeToRun: number }
	| {
			type: "BATCH";
			results: DatabaseStatementResult[];
			timeToRun: number;
	  };

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

export const parseDatabaseStructure = (rows: unknown): DatabaseTable[] => {
	if (!Array.isArray(rows)) return [];

	const tableMap = new Map<string, DatabaseColumn[]>();
	for (const row of rows) {
		if (!Array.isArray(row) || row.length < 3) continue;

		const tableName = String(row[5] ?? row[0] ?? "").trim();
		const columnName = String(row[4] ?? row[1] ?? "").trim();
		const columnType = String(row[2] ?? "UNKNOWN").trim() || "UNKNOWN";
		if (!tableName || !columnName) continue;

		const columns = tableMap.get(tableName) ?? [];
		columns.push({ column: columnName, type: columnType });
		tableMap.set(tableName, columns);
	}

	return Array.from(tableMap.entries()).map(([table, columns]) => ({
		table,
		columns,
	}));
};

export const parseStatementResults = (
	output: unknown,
): DatabaseStatementResult[] | null => {
	if (!Array.isArray(output) || output.length < 2) return null;

	const results: DatabaseStatementResult[] = [];
	for (const item of output) {
		if (!isRecord(item)) return null;

		const statement = item.statement;
		const query = item.query;
		const route = item.route;
		const type = item.type;
		const status = item.status;
		const timeToRun = item.timeToRun;
		if (
			typeof statement !== "number" ||
			typeof query !== "string" ||
			typeof route !== "string" ||
			typeof type !== "string" ||
			typeof status !== "string" ||
			typeof timeToRun !== "number"
		) {
			return null;
		}

		const base = { statement, query, route, timeToRun };
		if (type === "TABLE" && status === "SUCCESS" && isRecord(item.output)) {
			const headers = item.output.headers;
			const values = item.output.values;
			if (
				Array.isArray(headers) &&
				headers.every((header) => typeof header === "string") &&
				Array.isArray(values) &&
				values.every((row) => Array.isArray(row))
			) {
				results.push({
					...base,
					type,
					status,
					output: { headers, values: values as unknown[][] },
				});
				continue;
			}
		}

		if (typeof item.message !== "string") return null;
		if (type === "MESSAGE" && status === "SUCCESS") {
			results.push({ ...base, type, status, message: item.message });
			continue;
		}
		if (type === "ERROR" && status === "ERROR") {
			results.push({ ...base, type, status, message: item.message });
			continue;
		}
		if (type === "SKIPPED" && status === "SKIPPED") {
			results.push({ ...base, type, status, message: item.message });
			continue;
		}
		return null;
	}

	return results;
};

export const loadDatabaseWorkbench = async (
	profile: DesktopInstanceProfile,
	config: InstanceConfig,
	engineId: string,
): Promise<{ mode: DatabaseQueryMode; structure: DatabaseTable[] }> => {
	const encodedEngineId = JSON.stringify(engineId);
	const response = await runPixel<unknown>(
		profile,
		config,
		`META|GetDatabaseTableStructure(database=[${encodedEngineId}]); GetDatabaseCategory(engine=[${encodedEngineId}]);`,
	);
	return {
		structure: parseDatabaseStructure(response.outputs[0]),
		mode: String(response.outputs[1] ?? "") === "RDF" ? "SPARQL" : "SQL",
	};
};

export const runDatabaseQuery = async (
	profile: DesktopInstanceProfile,
	config: InstanceConfig,
	engineId: string,
	mode: DatabaseQueryMode,
	query: string,
	raw = true,
): Promise<DatabaseQueryResult> => {
	const encodedEngineId = JSON.stringify(engineId);
	const pixel =
		mode === "SPARQL"
			? `SparqlQuery(database=[${encodedEngineId}], query=["<encode>${query}</encode>"], raw=[${raw}], commit=[true]);`
			: `SqlQuery(database=[${encodedEngineId}], query=["<encode>${query}</encode>"], commit=[true]);`;
	const response = await runPixel<unknown>(profile, config, pixel);
	const firstReturn = response.returns?.[0];
	const output = firstReturn?.output ?? response.output;
	const timeToRun = firstReturn?.timeToRun ?? 0;

	if (
		isRecord(output) &&
		isRecord(output.data) &&
		Array.isArray(output.data.headers) &&
		output.data.headers.every((header) => typeof header === "string") &&
		Array.isArray(output.data.values) &&
		output.data.values.every((row) => Array.isArray(row))
	) {
		return {
			type: "TABLE",
			output: {
				headers: output.data.headers as string[],
				values: output.data.values as unknown[][],
			},
			timeToRun,
		};
	}

	if (typeof output === "string") {
		return { type: "MESSAGE", message: output, timeToRun };
	}

	const statementResults = parseStatementResults(output);
	if (statementResults) {
		return { type: "BATCH", results: statementResults, timeToRun };
	}

	return { type: "JSON", output, timeToRun };
};
