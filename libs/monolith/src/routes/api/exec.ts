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

import type { RequestOptions } from "@/types";
import { post } from "@/utility/http";
import { path } from "@/utility/url";

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
 * @returns A pixel return with the collected data, the frame headers and the `DropInsight` step.
 * @remarks Unverified response shape of `output`.
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
		output: unknown;
		operationType: string[];
		additionalOutput?: Array<{
			output: unknown;
			operationType: string[];
			[key: string]: unknown;
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
 * @remarks Unverified response shape of `output`.
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
			[key: string]: unknown;
		}>;
	}>;
}> {
	return post(
		path`/api/exec/a-${params.projectId}/i-${params.rdbmsId}/getInsightState`,
		undefined,
		options,
	);
}
