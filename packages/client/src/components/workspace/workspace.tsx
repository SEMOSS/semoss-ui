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
const CodeWorkspace = lazy(() =>
	import("@/components/code-workspace").then((m) => ({
		default: m.CodeWorkspace,
	})),
);
const SkillWorkspace = lazy(() =>
	import("@/components/skill-workspace").then((m) => ({
		default: m.SkillWorkspace,
	})),
);
const AgentWorkspace = lazy(() =>
	import("@/components/agent-workspace").then((m) => ({
		default: m.AgentWorkspace,
	})),
);
const WorkflowWorkspace = lazy(() =>
	import("@/components/workflow-workspace").then((m) => ({
		default: m.WorkflowWorkspace,
	})),
);

import { useRootStore } from "@/hooks";
import type { WorkspaceStore } from "@/stores";

interface WorkspaceProps {
	/** App to load */
	app: string;
}

const WorkspaceLoadingState = () => {
	return (
		<div
			className="absolute inset-0 flex items-center justify-center"
			style={{
				background: "rgba(255, 255, 255, 0.5)",
				zIndex: 1501,
			}}
		>
			<Spinner className="size-6" />
		</div>
	);
};

export const Workspace: React.FC<WorkspaceProps> = ({ app }) => {
	const insight = useInsight();
	const { configStore } = useRootStore();

	const navigate = useNavigate();

	const [workspace, setWorkspace] = useState<WorkspaceStore | null>(null);

	useEffect(() => {
		// clear out the old app
		setWorkspace(null);

		if (!insight.isReady) {
			return;
		}

		configStore
			.createWorkspace(app, insight.insightId)
			.then((loadedWorkspace) => {
				setWorkspace(loadedWorkspace);
			})
			.catch((_e) => {
				toast.error("Failed to load app, returning to home page.");

				navigate("/");
			});
	}, [
		app,
		insight.isReady,
		insight.insightId,
		configStore.createWorkspace,
		navigate,
	]);

	// check the dependencies
	usePixel(
		insight.isReady && app
			? `ValidateUserProjectDependencies(project="${app}");`
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
				{workspace.type === "CODE" && <CodeWorkspace />}
				{workspace.type === "BLOCKS" && <BlocksWorkspace />}
				{workspace.type === "SKILL" && <SkillWorkspace />}
				{workspace.type === "WORKSPACE" && <AgentWorkspace />}
				{workspace.type === "WORKFLOW" && <WorkflowWorkspace />}
			</Suspense>
		</WorkspaceContext.Provider>
	);
};
