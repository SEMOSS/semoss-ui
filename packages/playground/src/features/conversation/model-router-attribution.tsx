import { Small } from "@semoss/ui/next";
import type { ModelRouting } from "@/types";

interface ModelRouterAttributionProps {
	/** Confirmed routing decision for this response, absent on ordinary models. */
	routing?: ModelRouting;
}

/** Names the successful serving model on every routed response, including repeats. */
export const ModelRouterAttribution = ({
	routing,
}: ModelRouterAttributionProps) => {
	if (
		!routing ||
		typeof routing.routed_engine_id !== "string" ||
		!routing.routed_engine_id.trim()
	) {
		return null;
	}

	const name =
		typeof routing.routed_engine_name === "string"
			? routing.routed_engine_name.trim()
			: "";

	return (
		<Small className="wrap-anywhere block min-w-0 text-base text-muted-foreground">
			{name || routing.routed_engine_id}
		</Small>
	);
};
