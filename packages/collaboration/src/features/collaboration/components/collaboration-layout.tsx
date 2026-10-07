import { CollaborationDataProvider } from "../live/live-session";
import { CollaborationShell } from "./collaboration-shell";

/** Owns the session shared by Work and Brain. */
export function CollaborationLayout() {
	return (
		<CollaborationDataProvider>
			<CollaborationShell />
		</CollaborationDataProvider>
	);
}
