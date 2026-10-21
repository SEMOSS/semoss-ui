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

import type { RequestOptions } from "@/types";
import { post } from "@/utility/http";
import { path } from "@/utility/url";

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
 * @returns A pixel return with the collected data and the frame headers.
 * @remarks Unverified response shape of `output`.
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
 * @remarks Unverified response shape of `output`.
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
			[key: string]: unknown;
		}>;
	}>;
}> {
	return post(
		path`/api/share/i-${params.insightId}/getInsightState`,
		undefined,
		options,
	);
}
