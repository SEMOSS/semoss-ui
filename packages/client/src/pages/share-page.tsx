import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner, toast } from "@semoss/ui/next";
import { ProjectView } from "@/components/project";
import { PlatformMessages } from "@/components/shared";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import type { WorkspaceStore } from "@/stores";

/** Project types the share page can render a read-only view for. */
const SHAREABLE_TYPES = new Set<WorkspaceStore["type"]>([
	"CODE",
	"BLOCKS",
	"SKILL",
	"NOTEBOOK",
]);

/**
 * Render a shared project's read-only view (navbar-free) for the `#/s/:appId` route.
 */
export const SharePage = observer(() => {
	// App ID Needed for pixel calls
	const { appId } = useParams();
	const { configStore } = useRootStore();

	const navigate = useNavigate();

	const [workspace, setWorkspace] = useState<WorkspaceStore | null>(null);

	// load the shared project into a workspace
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — reruns on appId change only
	useEffect(() => {
		if (!appId) {
			navigate("/");
			return;
		}

		// clear out the old workspace
		setWorkspace(null);

		configStore
			.createWorkspace(appId)
			.then((loadedWorkspace) => {
				// only render project types that have a read-only view
				if (!SHAREABLE_TYPES.has(loadedWorkspace.type)) {
					toast.error("This project type cannot be shared.");
					navigate("/");
					return;
				}
				setWorkspace(loadedWorkspace);
			})
			.catch((e) => {
				toast.error(e.message);
				navigate("/");
			});
	}, [appId]);

	// hide the screen while it loads
	if (!workspace) {
		return (
			<div className="flex h-screen w-screen items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="relative flex h-screen w-screen overflow-hidden">
			<ProjectView workspace={workspace} />
			<PlatformMessages />
		</div>
	);
});
