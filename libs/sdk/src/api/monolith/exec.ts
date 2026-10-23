/**
 * Run a saved insight and read its data — `/api/exec/a-{projectId}/i-{rdbmsId}`.
 *
 * Backend: `RunInsight`
 * (Monolith/src/prerna/semoss/web/services/local/RunInsight.java), located by
 * `ExecuteInsightResource#generateInsight`
 * (Monolith/src/prerna/semoss/web/services/local/ExecuteInsightResource.java).
 * Pixel returns are streamed by `PixelStreamUtility.collectPixelData`
 * (Semoss/src/prerna/sablecc2).
 *
 * Every call loads the saved insight fresh and re-runs its recipe, so it is
 * expensive. The locator requires view access to the insight; failures are
 * answered by the locator with 400 / 401 and an `{ error }` or
 * `{ errorMessage }` body.
 */

import type { RequestOptions } from "../../lib/api-types";
import { post } from "../../lib/http";
import { path } from "../../lib/url";

/**
 * Re-runs the saved insight, then returns all rows of its frame and the frame
 * headers (`QueryAll() | Collect(-1); FrameHeaders();`). The insight is dropped
 * afterwards.
 *
 * @name getTableData
 * @endpoint POST /api/exec/a-{projectId}/i-{rdbmsId}/getTableData
 * @source Monolith/src/prerna/semoss/web/services/local/RunInsight.java#getInsightData
 * @param params - Path parameters.
 * @param params.projectId - The project id or alias (the path segment is `a-`).
 * @param params.rdbmsId - The saved insight id.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return with one step per pixel, whose `output` is one of: the `Collect` task (`data.values` rows, `data.headers` aliases, `data.rawHeaders`, plus the task id and task meta such as `headerInfo`), the `FrameHeaders` map (`{}` when the insight has no frame) and `true` from `DropInsight`. A failed step, and any delayed message after the steps, has a message string as its `output`.
 * @throws {ApiError} 401 if the session is invalid or the caller cannot view the insight; 400 without a session.
 */
export function getTableData(
	params: { projectId: string; rdbmsId: string },
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
			| true
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
		path`/api/exec/a-${params.projectId}/i-${params.rdbmsId}/getTableData`,
		undefined,
		options,
	);
}

/**
 * Re-runs the saved insight and returns the pixel returns that recreate its
 * state (panels, frames, tasks) on the client. The insight stays in the
 * insight store.
 *
 * @name getInsightState
 * @endpoint POST /api/exec/a-{projectId}/i-{rdbmsId}/getInsightState
 * @source Monolith/src/prerna/semoss/web/services/local/RunInsight.java#recreateInsightState
 * @param params - Path parameters.
 * @param params.projectId - The project id or alias (the path segment is `a-`).
 * @param params.rdbmsId - The saved insight id.
 * @param options - Per-call overrides (signal, headers).
 * @returns A pixel return that rebuilds the insight state.
 * @remarks `InsightUtility.recreateInsightState` emits cached frame headers, reruns the saved recipe and appends insight configuration. Each recipe can produce different Pixel outputs, so `output` remains unknown; inspect `operationType` before reading it.
 * @throws {ApiError} 401 if the session is invalid or the caller cannot view the insight; 400 without a session.
 */
export function getInsightState(
	params: { projectId: string; rdbmsId: string },
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
		path`/api/exec/a-${params.projectId}/i-${params.rdbmsId}/getInsightState`,
		undefined,
		options,
	);
}
