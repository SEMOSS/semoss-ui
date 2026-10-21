/**
 * Scheduler callback — `/api/schedule`.
 *
 * Backend: `SchedulerResource`
 * (Monolith/src/prerna/semoss/web/services/local/SchedulerResource.java),
 * behind `SchedulerFilter` (Monolith/src/prerna/web/conf/SchedulerFilter.java).
 * The pixel response is streamed by `PixelStreamUtility`
 * (Semoss/src/prerna/sablecc2/PixelStreamUtility.java).
 *
 * Called by the SEMOSS scheduler when a job fires, not by end users.
 */

import type { RequestOptions } from "@/types";
import { post } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Runs a scheduled job's pixel as the job's users. `SchedulerFilter` first
 * checks that the one-time execution id matches the job id and group, builds a
 * session user from `-userAccess`, and deletes the execution id. The pixel
 * then runs in scheduler mode on a new insight and the session is invalidated.
 *
 * @name executePixel
 * @endpoint POST /api/schedule/executePixel
 * @source Monolith/src/prerna/semoss/web/services/local/SchedulerResource.java#executePixel
 * @param params - Form fields.
 * @param params.pixel - The pixel to run; a trailing `;` is added when missing.
 * @param params.-execId - The one-time execution id the scheduler stored for this run.
 * @param params.-jobId - The job id the execution id belongs to.
 * @param params.-jobGroup - The job group the execution id belongs to.
 * @param params.-userAccess - Comma-separated `PROVIDER:id` pairs to run as, e.g. `"NATIVE:admin"`.
 * @param options - Per-call overrides (signal, headers).
 * @returns The pixel run: the new insight id and one entry per pixel step. An invalid execution id yields an empty 200 body (`undefined`).
 * @throws {ApiError} 400 if `pixel` is empty; 500 if the run fails.
 */
export function executePixel(
	params: {
		pixel: string;
		"-execId": string;
		"-jobId": string;
		"-jobGroup": string;
		"-userAccess": string;
	},
	options?: RequestOptions,
): Promise<{
	insightID: string;
	pixelReturn: Array<{
		pixelId: string;
		pixelExpression: string;
		isMeta: boolean;
		timeToRun: number;
		output: unknown;
		operationType: string[];
		additionalOutput?: unknown[];
	}>;
}> {
	return post(path`/api/schedule/executePixel`, params, options);
}
