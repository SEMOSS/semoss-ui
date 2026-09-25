import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { CollaborationShell } from "./collaboration-shell";

/** Owns the session shared by Work and Brain. */
export function CollaborationLayout() {
	return (
		<CollaborationSessionProvider>
			<CollaborationShell />
		</CollaborationSessionProvider>
	);
}
