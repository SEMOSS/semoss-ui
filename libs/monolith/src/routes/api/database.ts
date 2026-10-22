/**
 * One database engine — `/api/database-{databaseId}`.
 *
 * Backend: `DatabaseEngineResource`
 * (Monolith/src/prerna/semoss/web/services/local/DatabaseEngineResource.java).
 * The pixel endpoints run through `ResourceUtility.runPixel`
 * (Monolith/src/prerna/semoss/web/services/local/ResourceUtility.java) in a
 * fresh insight that is dropped afterwards, and stream the result with
 * `PixelStreamUtility.collectPixelData` (Semoss/src/prerna/sablecc2).
 *
 * Unlike `runPixel`, a pixel that fails (an `ERROR` or `INVALID_SYNTAX`
 * operation type) answers 400; the `ApiError.data` is then the full pixel
 * return. Access is enforced by the reactor the endpoint runs.
 */

import type { RequestOptions } from "../../types";
import { get, post } from "../../utility/http";
import { path } from "../../utility/url";

/**
 * Returns the database's type and its engine subtype. Requires view access,
 * or the database being discoverable.
 *
 * @name type
 * @endpoint GET /api/database-{databaseId}/type
 * @source Monolith/src/prerna/semoss/web/services/local/DatabaseEngineResource.java#getDatabaseType
 * @param params - Path parameter.
 * @param params.databaseId - The database.
 * @param options - Per-call overrides (signal, headers).
 * @returns The id, the `IDatabaseEngine.DATABASE_TYPE` and the `ENGINESUBTYPE` from the security database.
 * @throws {ApiError} 401 if the session is invalid or the database is neither viewable nor discoverable; 400 if the database cannot be loaded.
 */
export function type(
	params: { databaseId: string },
	options?: RequestOptions,
): Promise<{
	engineId: string;
	databaseType?:
		| "JENA"
		| "JENA_TDB"
		| "SESAME"
		| "RDF4J"
		| "TINKER"
		| "NEO4J"
		| "DATASTAX_GRAPH"
		| "JANUS_GRAPH"
		| "RDBMS"
		| "R"
		| "JMES_API"
		| "JSON"
		| "JSON2"
		| "WEB"
		| "IMPALA";
	subtype?: string;
}> {
	return get(
		path`/api/database-${params.databaseId}/type`,
		undefined,
		options,
	);
}

/**
 * Closes and reopens the database (`ReloadDatabase`). Requires edit access to
 * the database, or an admin.
 *
 * @name reload
 * @endpoint POST /api/database-{databaseId}/reload
 * @source Monolith/src/prerna/semoss/web/services/local/DatabaseEngineResource.java#reload
 * @param params - Path parameter.
 * @param params.databaseId - The database.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one `ReloadDatabase` step whose `output` is `true`.
 * @throws {ApiError} 401 if the session is invalid; 400 if the pixel fails (for example without permission, or if the database cannot be reopened).
 */
export function reload(
	params: { databaseId: string },
	options?: RequestOptions,
): Promise<{
	insightID: string;
	pixelReturn: Array<{
		pixelId: string;
		pixelExpression?: string;
		isMeta: boolean;
		timeToRun: number;
		output: true;
		operationType: string[];
		additionalOutput?: Array<{
			output: unknown;
			operationType: string[];
			[key: string]: unknown;
		}>;
	}>;
}> {
	return post(
		path`/api/database-${params.databaseId}/reload`,
		undefined,
		options,
	);
}

/**
 * Builds a raw query against the database
 * (`Database(database=…) | Query(query=…)`). Requires view access to the
 * database.
 *
 * @name query
 * @endpoint POST /api/database-{databaseId}/query
 * @source Monolith/src/prerna/semoss/web/services/local/DatabaseEngineResource.java#query
 * @param params - Path parameter and JSON body.
 * @param params.databaseId - The database.
 * @param params.query - The query, in the engine's native language (SQL, SPARQL, …).
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step whose `output` is the serialized query
 * struct (`HardSelectQueryStructAdapter`), not result rows.
 * @throws {ApiError} 401 if the session is invalid; 400 if `query` is empty or the pixel fails.
 * @remarks The backend pixel ends at `Query(...)` with no `Collect`, so the
 * query is never run: the step only echoes the query struct back. Use
 * `runPixel` with `Database(database=…) | Query(query=…) | Collect(…)` to get
 * rows.
 */
export function query(
	params: { databaseId: string; query: string },
	options?: RequestOptions,
): Promise<{
	insightID: string;
	pixelReturn: Array<{
		pixelId: string;
		pixelExpression?: string;
		isMeta: boolean;
		timeToRun: number;
		output: {
			qsType: "RAW_ENGINE_QUERY";
			engineName: string;
			query: string;
		};
		operationType: string[];
		additionalOutput?: Array<{
			output: unknown;
			operationType: string[];
			[key: string]: unknown;
		}>;
	}>;
}> {
	const { databaseId, ...body } = params;
	return post(path`/api/database-${databaseId}/query`, body, options, {
		bodyType: "json",
	});
}
