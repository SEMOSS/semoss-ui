import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Spinner, toast } from "@semoss/ui/next";
import { ProjectView } from "@/components/project";
import { PlatformMessages } from "@/components/shared";
import { useProject, useRootStore } from "@/hooks";
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
	const { configStore } = useRootStore();
	const { project, permission } = useProject();

	const navigate = useNavigate();

	const [workspace, setWorkspace] = useState<WorkspaceStore | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — reruns on project change only
	useEffect(() => {
		setWorkspace(null);

		configStore
			.createWorkspace(project, permission)
			.then((loadedWorkspace) => {
				if (!SHAREABLE_TYPES.has(project.project_type)) {
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
	}, [project.project_id]);

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
