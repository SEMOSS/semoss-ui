import { lazy, Suspense, useEffect, useState } from "react";
import { runPixel, useInsight, usePixel } from "@semoss/sdk/react";
import { Spinner, toast } from "@semoss/ui/next";
import { WorkspaceContext } from "@/contexts";
import { useNavigate } from "@/hooks/useNavigate";

const BlocksWorkspace = lazy(() =>
	import("@/components/blocks-workspace").then((m) => ({
		default: m.BlocksWorkspace,
	})),
);

import { useProject } from "@/hooks";
import { WorkspaceStore } from "@/stores";

const WorkspaceLoadingState = () => {
	return (
		<div className="absolute inset-0 z-[1501] flex items-center justify-center bg-background/50">
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

		runPixel(`SetContext("${project.project_id}")`, insight.insightId)
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
	usePixel(
		insight.isReady && project.project_id
			? `ValidateUserProjectDependencies(project="${project.project_id}");`
			: "",
		{
			onSuccess: (data: Record<string, boolean>) => {
				const needsAccess: string[] = [];
				Object.entries(data).forEach((kv) => {
					const hasAccess = kv[1];

					if (!hasAccess) {
						needsAccess.push(kv[0]);
					}
				});
				if (needsAccess.length) {
					toast.warning(
						`You do not have access to the following dependencies: ${needsAccess.join(
							", ",
						)}.`,
					);
				}
			},
		},
		insight.insightId,
	);

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
				{/* Only BLOCKS remains on this shell — CODE, NOTEBOOK, SKILL and
				    AGENT render on the workbench. */}
				{type === "BLOCKS" && <BlocksWorkspace />}
			</Suspense>
		</WorkspaceContext.Provider>
	);
};
