import { lazy, Suspense, useEffect, useState } from "react";
import { runPixel, useInsight } from "@semoss/sdk/react";
import { Spinner, toast } from "@semoss/ui/next";
import { WorkspaceContext } from "@/contexts";
import { useCatalogDependencyWarning } from "@/features/catalog/dependencies/use-catalog-dependency-warning";
import { useNavigate } from "@/hooks/useNavigate";

const BlocksWorkbench = lazy(() =>
	import("@/components/workbench/project/blocks/blocks-workbench").then(
		(m) => ({ default: m.BlocksWorkbench }),
	),
);

import { useProject } from "@/hooks";
import { WorkspaceStore } from "@/stores";

const WorkspaceLoadingState = () => {
	return (
		<div className="absolute inset-0 z-1501 flex items-center justify-center bg-background/50">
			<Spinner />
		</div>
	);
};

export const Workspace: React.FC = () => {
	const insight = useInsight();
	const { project, type } = useProject();

	const navigate = useNavigate();

	const [workspace, setWorkspace] = useState<WorkspaceStore | null>(null);

	useEffect(() => {
		// clear out the old app
		setWorkspace(null);

		if (!insight.isReady) {
			return;
		}

		runPixel(`LoadApp("${project.project_id}")`, insight.insightId)
			.then(() => {
				const w = new WorkspaceStore({
					insightId: insight.insightId,
					projectId: project.project_id,
				});

				setWorkspace(w);
			})
			.catch((_e) => {
				toast.error("Failed to load app, returning to home page.");
				navigate("/");
			});
	}, [project.project_id, insight.isReady, insight.insightId, navigate]);

	// check the dependencies
	useCatalogDependencyWarning({
		catalogId: project.project_id,
		catalogType: project.project_type,
	});

	if (!insight.isReady || !workspace) {
		return <WorkspaceLoadingState />;
	}

	return (
		<WorkspaceContext.Provider
			value={{
				workspace: workspace,
			}}
		>
			<Suspense fallback={<WorkspaceLoadingState />}>
				{/* What this still owns is the store, not a shell: every
				    project type renders on the workbench now. */}
				{type === "BLOCKS" && <BlocksWorkbench />}
			</Suspense>
		</WorkspaceContext.Provider>
	);
};
