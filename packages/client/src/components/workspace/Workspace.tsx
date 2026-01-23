import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { Spinner, toast } from "@semoss/ui/next";
import { BlocksWorkspace } from "@/components/blocks-workspace";
import { CodeWorkspace } from "@/components/code-workspace";
import { WorkspaceContext } from "@/contexts";
import { useRootStore } from "@/hooks";
import type { WorkspaceStore } from "@/stores";

interface WorkspaceProps {
	/** App to load */
	app: string;
}

export const Workspace: React.FC<WorkspaceProps> = ({ app }) => {
	const insight = useInsight();
	const { configStore } = useRootStore();

	const navigate = useNavigate();

	const [workspace, setWorkspace] = useState<WorkspaceStore | null>(null);

	useEffect(() => {
		// clear out the old app
		setWorkspace(undefined);

		if (!insight.isReady) {
			return;
		}

		configStore
			.createWorkspace(app, insight.insightId)
			.then((loadedWorkspace) => {
				setWorkspace(loadedWorkspace);
			})
			.catch((e) => {
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
			: null,
		{
			onSuccess: (data: Record<string, boolean>) => {
				const needsAccess = [];
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
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<WorkspaceContext.Provider
			value={{
				workspace: workspace,
			}}
		>
			{workspace.type === "CODE" && <CodeWorkspace />}
			{workspace.type === "BLOCKS" && <BlocksWorkspace />}
		</WorkspaceContext.Provider>
	);
};
