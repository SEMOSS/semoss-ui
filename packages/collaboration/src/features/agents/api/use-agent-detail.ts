import { useMemo } from "react";
import { usePixel } from "@semoss/sdk/react";
import { pixel } from "@/lib/pixel";
import { toWorkspaceAgent, workspacePayloadSchema } from "./agent-schemas";

/**
 * Load one agent's full configuration.
 *
 * List views only have an id and a name, so this is what fills in the system
 * prompt, resources, skills and run budgets.
 *
 * Uses the SDK's `usePixel` read lifecycle and validates the returned workspace
 * before mapping it to the client model.
 *
 * @param workspaceId - The agent to load. An empty id means a new agent that
 * does not exist server-side yet, and no request is made.
 * @returns `agent` once loaded (null before that, or on failure), `isLoading`,
 * `error`, and `refresh` to refetch.
 */
export function useAgentDetail(workspaceId: string) {
	const { data, status, error, refresh } = usePixel<unknown>(
		workspaceId ? pixel("GetWorkspace", { workspaceId }) : "",
	);

	const parsed = useMemo(() => {
		if (data === undefined || data === null) {
			return { agent: null, validationError: null };
		}

		const result = workspacePayloadSchema.safeParse(data);
		if (result.success === false) {
			return {
				agent: null,
				validationError: new Error(
					`SEMOSS returned an invalid workspace: ${result.error.message}`,
				),
			};
		}

		return {
			agent: toWorkspaceAgent(result.data),
			validationError: null,
		};
	}, [data]);

	return {
		agent: parsed.agent,
		isLoading:
			Boolean(workspaceId) &&
			(status === "INITIAL" || status === "LOADING"),
		error: error ?? parsed.validationError,
		refresh,
	};
}
