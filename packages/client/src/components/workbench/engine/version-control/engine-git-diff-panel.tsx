import { FileDiffIcon } from "lucide-react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import type {
	GitCommitFile,
	GitDiff,
	GitDiffSide,
	GitStageAction,
} from "@/components/git";
import { GitDiffViewer } from "@/components/git";
import { useEngine } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";

/** Parameters that identify one engine working-tree diff. */
export interface EngineGitDiffPanelConfig {
	/** Display name for the file. */
	name: string;
	/** Repository-relative path to compare. */
	path: string;
	/** Working-tree side or historical commit comparison. */
	side: GitDiffSide | "COMMIT";
	/** Commit to compare when side is COMMIT. */
	commitId?: string;
}

/** Display a staged or unstaged engine diff with its index action. */
const EngineGitDiffPanel: WorkbenchComponent<EngineGitDiffPanelConfig> = ({
	config,
	close,
}) => {
	const { engine } = useEngine();
	const insight = useInsight();
	const historical = config.side === "COMMIT";
	const diff = usePixel<GitDiff | GitCommitFile[]>(
		historical
			? `EngineCommitDiff(engine=[${JSON.stringify(engine.engine_id)}], commitId=[${JSON.stringify(config.commitId ?? "")}], filePath=[${JSON.stringify(config.path)}]);`
			: `EngineGitDiff(engine=[${JSON.stringify(engine.engine_id)}], filePath=[${JSON.stringify(config.path)}], side=[${JSON.stringify(config.side)}]);`,
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
	const action: GitStageAction | null = historical
		? null
		: config.side === "STAGED"
			? "UNSTAGE"
			: "STAGE";

	/** Apply the available index mutation and close the stale diff panel. */
	const mutateFile = async () => {
		if (!action) {
			return;
		}
		try {
			await insight.actions.run(
				`EngineGitStage(engine=[${JSON.stringify(engine.engine_id)}], paths=[${JSON.stringify(config.path)}], action=[${JSON.stringify(action)}]);`,
			);
			toast.success(action === "STAGE" ? "File staged" : "File unstaged");
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

	return (
		<GitDiffViewer
			path={config.path}
			diff={diffData}
			status={diff.status}
			error={diff.error}
			action={action ?? undefined}
			onRetry={diff.refresh}
			onAction={action ? () => void mutateFile() : undefined}
		/>
	);
};

/** Blueprint for staged and unstaged engine file diffs. */
export const ENGINE_GIT_DIFF_PANEL: WorkbenchPanelConfig<EngineGitDiffPanelConfig> =
	{
		name: "Diff",
		helpText: "File diff",
		icon: ({ className }) => <FileDiffIcon className={className} />,
		mount: "keepAlive",
		matches: (a, b) =>
			a.path === b.path && a.side === b.side && a.commitId === b.commitId,
		content: EngineGitDiffPanel,
	};
