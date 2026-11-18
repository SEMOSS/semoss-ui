import { useSearchParams } from "react-router";
import { TwinSettings } from "@/features/digital-twin/twin-settings";

/** The owner's own Digital Twin: creating it, then its profile and the people it is shared with. */
export function TwinSettingsPage() {
	const [params] = useSearchParams();
	// A different twin starts with its own form, sharing and deletion state.
	return (
		<TwinSettings
			key={
				params.get("twinId") ??
				(params.get("create") === "true" ? "create" : "mine")
			}
		/>
	);
}
