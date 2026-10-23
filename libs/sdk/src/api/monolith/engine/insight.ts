/**
 * Insight data-frame calls — `/api/engine/i-{insightId}`.
 *
 * Backend: `DataframeResource`
 * (Monolith/src/prerna/semoss/web/services/local/DataframeResource.java),
 * located by `NameServer#getInsightDataFrame`
 * (Monolith/src/prerna/semoss/web/services/local/NameServer.java).
 *
 * The locator looks the insight up in the `InsightStore`; `i-new` creates a
 * new, empty insight instead. An unknown insight id is answered with
 * `{ errorMessage }` and status 400 by the locator.
 */

import type { RequestOptions } from "../../../lib/api-types";
import { post } from "../../../lib/http";
import { path } from "../../../lib/url";

/**
 * Calls a method on the playsheet of a legacy (`OldInsight`) insight. Any other
 * kind of insight is answered with `{ errorMessage }` and status 200.
 *
 * @name doMethod
 * @endpoint POST /api/engine/i-{insightId}/do-{method}
 * @source Monolith/src/prerna/semoss/web/services/local/DataframeResource.java#doMethod
 * @param params - Path parameters and form fields.
 * @param params.insightId - The insight (`"new"` creates one, which is never an `OldInsight`).
 * @param params.method - The playsheet method name.
 * @param params.data - Arguments passed to the playsheet method.
 * @param options - Per-call overrides (signal, headers).
 * @returns Whatever the playsheet method returns, or `{ errorMessage }` when the insight is not a legacy insight.
 * @remarks `IPlaySheet.doMethod` owns the result. It can return any value for a playsheet-specific method, so the response must be narrowed by that method's caller.
 * @throws {ApiError} 400 if the insight id is unknown.
 */
export function doMethod(
	params: {
		insightId: string;
		method: string;
		data?: Record<string, unknown>;
	},
	options?: RequestOptions,
): Promise<unknown> {
	const { insightId, method, ...body } = params;
	return post(path`/api/engine/i-${insightId}/do-${method}`, body, options);
}
