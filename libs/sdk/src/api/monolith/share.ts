/**
 * Read an insight that is already open in this session — `/api/share/i-{insightId}`.
 *
 * Backend: `RunInsight`
 * (Monolith/src/prerna/semoss/web/services/local/RunInsight.java), located by
 * `ShareInsightResource#validInsight`
 * (Monolith/src/prerna/semoss/web/services/local/ShareInsightResource.java).
 * Pixel returns are streamed by `PixelStreamUtility.collectPixelData`
 * (Semoss/src/prerna/sablecc2).
 *
 * The locator only accepts an insight id registered to the caller's session;
 * otherwise it answers 400 with `{ errorMessage }`.
 */

import type { RequestOptions } from "../../lib/api-types";
import { post } from "../../lib/http";
import { path } from "../../lib/url";

/**
 * Returns all rows of the open insight's frame and the frame headers
 * (`QueryAll() | Collect(-1); FrameHeaders();`). The insight is kept.
 *
 * @name getTableData
 * @endpoint POST /api/share/i-{insightId}/getTableData
 * @source Monolith/src/prerna/semoss/web/services/local/RunInsight.java#getInsightData
 * @param params - Path parameter.
 * @param params.insightId - The open insight's id.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step per pixel, whose `output` is one of: the `Collect` task (`data.values` rows, `data.headers` aliases, `data.rawHeaders`, plus the task id and task meta such as `headerInfo`) and the `FrameHeaders` map (`{}` when the insight has no frame). A failed step, and any delayed message after the steps, has a message string as its `output`.
 * @throws {ApiError} 400 without a session, or if the insight is unknown or not in this session.
 */
export function getTableData(
	params: { insightId: string },
	options?: RequestOptions,
): Promise<{
	insightID: string;
	pixelReturn: Array<{
		pixelId: string;
		pixelExpression?: string;
		isMeta: boolean;
		timeToRun: number;
		output:
			| {
					data: {
						values: unknown[][];
						headers: string[];
						rawHeaders: string[];
					};
					taskId: string;
					numCollected: number;
					[key: string]: unknown;
			  }
			| {
					name?: string;
					type?: string;
					headerInfo?: {
						headers: Array<{
							alias: string;
							displayName: string;
							header: string;
							dataType: string;
							adtlType: string;
							qsName: "unknown" | Record<string, string[]>;
							isPrim: string | boolean;
							isDerived: string | boolean;
							parentNode: string;
							isFiltered: boolean;
						}>;
						joins: Array<{
							fromNode: string;
							toNode: string;
							joinType: string;
						}>;
					};
			  }
			| string;
		operationType: string[];
		additionalOutput?: Array<{
			output: unknown;
			operationType: string[];
			additionalOutput?: unknown[];
		}>;
	}>;
}> {
	return post(
		path`/api/share/i-${params.insightId}/getTableData`,
		undefined,
		options,
	);
}

/**
 * Returns the pixel returns that recreate the open insight's state (panels,
 * frames, tasks) on the client.
 *
 * @name getInsightState
 * @endpoint POST /api/share/i-{insightId}/getInsightState
 * @source Monolith/src/prerna/semoss/web/services/local/RunInsight.java#recreateInsightState
 * @param params - Path parameter.
 * @param params.insightId - The open insight's id.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return that rebuilds the insight state.
 * @remarks `InsightUtility.recreateInsightState` emits cached frame headers, reruns the saved recipe and appends insight configuration. Each recipe can produce different Pixel outputs, so `output` remains unknown; inspect `operationType` before reading it.
 * @throws {ApiError} 400 without a session, or if the insight is unknown or not in this session.
 */
export function getInsightState(
	params: { insightId: string },
	options?: RequestOptions,
): Promise<{
	insightID: string;
	pixelReturn: Array<{
		pixelId: string;
		pixelExpression?: string;
		isMeta: boolean;
		timeToRun: number;
		output: unknown;
		operationType: string[];
		additionalOutput?: Array<{
			output: unknown;
			operationType: string[];
			additionalOutput?: unknown[];
		}>;
	}>;
}> {
	return post(
		path`/api/share/i-${params.insightId}/getInsightState`,
		undefined,
		options,
	);
}
