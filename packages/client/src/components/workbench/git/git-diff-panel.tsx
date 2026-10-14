import { FileDiffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccess } from "@semoss/panels";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import {
	useWorkbench,
	useWorkbenchControl,
	useWorkbenchPanel,
	WorkbenchPanelError,
	WorkbenchPanelLoading,
} from "@semoss/workbench";
import type {
	GitCommitFile,
	GitDiff,
	GitDiffControlValue,
	GitDiffSide,
	GitStageAction,
} from "@/components/git";
import { GitDiffControl, GitDiffEditor } from "@/components/git";
import { WORKBENCH_EVENTS } from "@/stores/workbench";
import { type GitPanelScopeParams, gitFileScope } from "./git-panel.types";

export interface GitDiffParams extends GitPanelScopeParams {
	name: string;
	path: string;
	side: GitDiffSide | "COMMIT";
	commitId?: string;
}

const GitDiffPanel = ({ id }: WorkbenchPanelProps) => {
	const { config, setValue, close } = useWorkbenchPanel<
		GitDiffParams,
		GitDiffControlValue
	>(id);

	const insight = useInsight();
	const emit = useWorkbench((state) => state.events.actions.emit);
	const access = useAccess(config.type, config.id);
	const readOnly = access.status !== "ready" || access.readOnly;
	const [renderSideBySide, setRenderSideBySide] = useState(true);
	const historical = config.side === "COMMIT";
	const prefix = config.type === "ENGINE" ? "Engine" : "Project";
	const resource =
		config.type === "ENGINE"
			? `engine=[${JSON.stringify(config.id)}]`
			: `project=[${JSON.stringify(config.id)}]`;
	const diff = usePixel<GitDiff | GitCommitFile[]>(
		access.status !== "ready"
			? ""
			: historical
				? `${prefix}CommitDiff(${resource}, commitId=[${JSON.stringify(config.commitId ?? "")}], filePath=[${JSON.stringify(config.path)}]);`
				: `${prefix}GitDiff(${resource}, filePath=[${JSON.stringify(config.path)}], side=[${JSON.stringify(config.side)}]);`,
	);
	const historicalFile = Array.isArray(diff.data) ? diff.data[0] : undefined;
	const diffData: GitDiff | undefined = historicalFile
		? {
				path: historicalFile.fileName,
				side: "STAGED",
				diff: historicalFile.diff ?? "",
				isBinary: historicalFile.isBinary ?? false,
				isTruncated: historicalFile.isTruncated ?? false,
			}
		: Array.isArray(diff.data)
			? undefined
			: diff.data;
	const action: GitStageAction | null =
		historical || readOnly
			? null
			: config.side === "STAGED"
				? "UNSTAGE"
				: "STAGE";

	/** Apply the available index mutation and close the stale diff panel. */
	const mutateFile = async () => {
		if (!action || readOnly) return;

		try {
			await insight.actions.run(
				`${prefix}GitStage(${resource}, paths=[${JSON.stringify(config.path)}], action=[${JSON.stringify(action)}]);`,
			);
			toast.success(action === "STAGE" ? "File staged" : "File unstaged");
			// The staged counts live in the version panel's control, which is a
			// different panel and does not re-render with this one.
			emit(WORKBENCH_EVENTS.GIT_STATUS_CHANGED, {
				scope: gitFileScope(config),
			});
			close();
		} catch (error) {
			console.error(error);
			toast.error(
				action === "STAGE"
					? "Failed to stage file"
					: "Failed to unstage file",
			);
		}
	};

	useEffect(() => {
		setValue({ renderSideBySide, setRenderSideBySide });
	}, [renderSideBySide, setValue]);
	useWorkbenchControl(id, GitDiffControl);

	if (access.status === "loading") {
		return <WorkbenchPanelLoading label="Loading resource access" />;
	}

	if (access.status === "error") {
		return (
			<WorkbenchPanelError
				message={access.error}
				onRetry={() => void access.refresh()}
			/>
		);
	}

	return (
		<div className="relative size-full">
			<GitDiffEditor
				path={config.path}
				diff={diffData}
				status={diff.status}
				error={diff.error}
				action={action ?? undefined}
				onRetry={diff.refresh}
				onAction={action ? () => void mutateFile() : undefined}
				renderSideBySide={renderSideBySide}
			/>
		</div>
	);
};

/** Scope-aware Git diff blueprint shared by project and engine workbenches. */
export const GIT_DIFF_PANEL: WorkbenchPanelConfig<
	GitDiffParams,
	GitDiffControlValue
> = {
	name: "Diff",
	helpText: "File diff",
	icon: ({ className }) => <FileDiffIcon className={className} />,
	mount: "keepAlive",
	matches: (a, b) =>
		a.type === b.type &&
		a.id === b.id &&
		a.path === b.path &&
		a.side === b.side &&
		a.commitId === b.commitId,
	content: GitDiffPanel,
};
