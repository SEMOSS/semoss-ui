import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import type { Project } from "@semoss/shared";
import { Spinner, toast } from "@semoss/ui/next";
import { ProjectView } from "@/components/project";
import { PlatformMessages } from "@/components/shared";
import { useProject, useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

/** Project types the share page can render a read-only view for. */
const SHAREABLE_TYPES = new Set<Project["project_type"]>([
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
	const { project } = useProject();

	const navigate = useNavigate();

	const [insightId, setInsightId] = useState<string | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — reruns on project change only
	useEffect(() => {
		setInsightId(null);

		configStore
			.createProjectInsight(project)
			.then((loadedInsightId) => {
				if (!SHAREABLE_TYPES.has(project.project_type)) {
					toast.error("This project type cannot be shared.");
					navigate("/");
					return;
				}
				setInsightId(loadedInsightId);
			})
			.catch((e) => {
				toast.error(e.message);
				navigate("/");
			});
	}, [project.project_id]);

	// hide the screen while it loads
	if (!insightId) {
		return (
			<div className="flex h-screen w-screen items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="relative flex h-screen w-screen overflow-hidden">
			<ProjectView insightId={insightId} />
			<PlatformMessages />
		</div>
	);
});
