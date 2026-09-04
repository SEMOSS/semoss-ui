import { FileDiffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import type {
	GitCommitFile,
	GitDiff,
	GitDiffControlValue,
	GitDiffSide,
	GitStageAction,
} from "@/components/git";
import { GitDiffControl, GitDiffEditor } from "@/components/git";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";

/** Parameters that identify one project working-tree diff. */
export interface ProjectGitDiffPanelConfig {
	/** Display name for the file. */
	name: string;
	/** Repository-relative path to compare. */
	path: string;
	/** Working-tree side or historical commit comparison. */
	side: GitDiffSide | "COMMIT";
	/** Commit to compare when side is COMMIT. */
	commitId?: string;
}

/** Display a staged or unstaged project diff with its index action. */
const ProjectGitDiffPanel: WorkbenchComponent<
	ProjectGitDiffPanelConfig,
	GitDiffControlValue
> = ({ config, id, setValue, close }) => {
	const { project } = useProject();
	const insight = useInsight();
	const [renderSideBySide, setRenderSideBySide] = useState(true);
	const historical = config.side === "COMMIT";
	const diff = usePixel<GitDiff | GitCommitFile[]>(
		historical
			? `ProjectCommitDiff(project=[${JSON.stringify(project.project_id)}], commitId=[${JSON.stringify(config.commitId ?? "")}], filePath=[${JSON.stringify(config.path)}]);`
			: `ProjectGitDiff(project=[${JSON.stringify(project.project_id)}], filePath=[${JSON.stringify(config.path)}], side=[${JSON.stringify(config.side)}]);`,
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
				`ProjectGitStage(project=[${JSON.stringify(project.project_id)}], paths=[${JSON.stringify(config.path)}], action=[${JSON.stringify(action)}]);`,
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

	useEffect(() => {
		setValue({
			renderSideBySide,
			setRenderSideBySide,
		});
	}, [renderSideBySide, setValue]);

	useWorkbenchControl(id, GitDiffControl);

	return (
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
	);
};

/** Blueprint for staged and unstaged project file diffs. */
export const PROJECT_GIT_DIFF_PANEL: WorkbenchPanelConfig<ProjectGitDiffPanelConfig> =
	{
		name: "Diff",
		helpText: "File diff",
		icon: ({ className }) => <FileDiffIcon className={className} />,
		mount: "keepAlive",
		matches: (a, b) =>
			a.path === b.path && a.side === b.side && a.commitId === b.commitId,
		content: ProjectGitDiffPanel,
	};
