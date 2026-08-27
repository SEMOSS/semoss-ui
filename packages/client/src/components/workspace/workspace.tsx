import { lazy, Suspense, useEffect, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { Spinner, toast } from "@semoss/ui/next";
import { WorkspaceContext } from "@/contexts";
import { useNavigate } from "@/hooks/useNavigate";

const BlocksWorkspace = lazy(() =>
	import("@/components/blocks-workspace").then((m) => ({
		default: m.BlocksWorkspace,
	})),
);
const AutomationWorkspace = lazy(() =>
	import("@/components/automation-workspace").then((m) => ({
		default: m.AutomationWorkbenchPage,
	})),
);

import { useProject, useRootStore } from "@/hooks";
import type { WorkspaceStore } from "@/stores";

const WorkspaceLoadingState = () => {
	return (
		<div className="absolute inset-0 z-[1501] flex items-center justify-center bg-background/50">
			<Spinner />
		</div>
	);
};

export const Workspace: React.FC = () => {
	const insight = useInsight();
	const { configStore } = useRootStore();
	const { project, type } = useProject();

	const navigate = useNavigate();

	const [workspace, setWorkspace] = useState<WorkspaceStore | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: project/permission are stable within a loaded project context
	useEffect(() => {
		// clear out the old app
		setWorkspace(null);

		if (!insight.isReady) {
			return;
		}

		configStore
			.createWorkspace(project, insight.insightId)
			.then((loadedWorkspace) => {
				setWorkspace(loadedWorkspace);
			})
			.catch((_e) => {
				toast.error("Failed to load app, returning to home page.");
				navigate("/");
			});
	}, [
		project.project_id,
		insight.isReady,
		insight.insightId,
		configStore.createWorkspace,
		navigate,
	]);

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
				{/* CODE, NOTEBOOK, SKILL, and AGENT render on the new workbench. */}
				{type === "BLOCKS" && <BlocksWorkspace />}
				{type === "AUTOMATION" && <AutomationWorkspace />}
			</Suspense>
		</WorkspaceContext.Provider>
	);
};
