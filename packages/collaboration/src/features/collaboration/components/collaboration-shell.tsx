import { DashboardProvider } from "@/features/dashboard/dashboard-provider";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationFrame } from "./collaboration-frame";
import { CollaborationSidebarProvider } from "./collaboration-sidebar-provider";

/** Account boundaries isolate saved preferences and transient source snapshots. */
export function CollaborationShell() {
	const { state } = useCollaborationSession();
	return (
		<DashboardProvider key={`${state.profile.id}:${state.profile.email}`}>
			<CollaborationSidebarProvider>
				<CollaborationFrame />
			</CollaborationSidebarProvider>
		</DashboardProvider>
	);
}
