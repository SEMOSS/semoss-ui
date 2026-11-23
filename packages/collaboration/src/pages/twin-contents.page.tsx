import { useSearchParams } from "react-router";
import { TwinContents } from "@/features/digital-twin/twin-contents";

/** The full-screen page for what the owner's Digital Twin knows. */
export function TwinContentsPage() {
	const [params] = useSearchParams();
	// Copied-item markers and the file dock belong to this twin only.
	return <TwinContents key={params.get("twinId") ?? "mine"} />;
}
