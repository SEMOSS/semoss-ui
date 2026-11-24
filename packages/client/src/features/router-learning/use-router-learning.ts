import { usePixel, useSessionInsight } from "@semoss/sdk/react";
import { getErrorMessage } from "@semoss/utility/error";
import {
	type RouterConfig,
	type RouterLearningStatus,
	rollbackRouterConfigPixel,
	routerConfigQuery,
	routerLearningStatusQuery,
	type SetRouterLearningInput,
	setRouterLearningPixel,
} from "@/api/router-learning";

/**
 * Reads a model router's learning status in two steps, the quick fields first and the
 * costs (a slow scan of the run history) once those arrived, plus its live config, and runs
 * the two changes the card offers. A change rejects with a readable error and refreshes the reads on success.
 */
export const useRouterLearning = (engineId: string) => {
	const { run } = useSessionInsight();
	const query = usePixel<RouterLearningStatus>(
		routerLearningStatusQuery(engineId, false),
	);
	const costs = usePixel<RouterLearningStatus>(
		query.status === "SUCCESS"
			? routerLearningStatusQuery(engineId, true)
			: "",
	);
	const configQuery = usePixel<string>(routerConfigQuery(engineId));

	const change = async (pixel: string, failure: string) => {
		try {
			const response = await run(pixel);
			const result = response.pixelReturn?.[0];
			if (
				response.errors.length > 0 ||
				String(result?.operationType).includes("ERROR")
			) {
				throw new Error(
					response.errors.join("") || String(result?.output),
				);
			}
			query.refresh();
			configQuery.refresh();
		} catch (error: unknown) {
			throw new Error(getErrorMessage(error, failure));
		}
	};

	let config: RouterConfig | null = null;
	try {
		config =
			configQuery.status === "SUCCESS"
				? (JSON.parse(String(configQuery.data)) as RouterConfig)
				: null;
	} catch {
		config = null;
	}

	return {
		query,
		costs: costs.status === "SUCCESS" ? costs.data : null,
		config,
		setLearning: (input: SetRouterLearningInput) =>
			change(
				setRouterLearningPixel(input),
				"Unable to change router learning",
			),
		rollback: (version: string) =>
			change(
				rollbackRouterConfigPixel(engineId, version),
				"Unable to roll back the router",
			),
	};
};
