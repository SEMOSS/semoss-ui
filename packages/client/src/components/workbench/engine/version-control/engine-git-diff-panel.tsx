import { FileDiffIcon } from "lucide-react";
import { usePixel } from "@semoss/sdk/react";
import type { GitCommitFile } from "@/components/git";
import { GitDiffViewer } from "@/components/git";
import { useEngine } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";

/** Parameters that identify one historical engine diff. */
export interface EngineGitDiffPanelConfig {
	/** Display name for the file. */
	name: string;
	/** Repository-relative path to compare. */
	path: string;
	/** Commit containing the historical file snapshot. */
	commitId: string;
}

/** Display one file diff from an engine commit. */
const EngineGitDiffPanel: WorkbenchComponent<EngineGitDiffPanelConfig> = ({
	config,
}) => {
	const { engine } = useEngine();
	const diff = usePixel<GitCommitFile[]>(
		`EngineCommitDiff(engine=[${JSON.stringify(engine.engine_id)}], commitId=[${JSON.stringify(config.commitId)}], filePath=[${JSON.stringify(config.path)}]);`,
	);
	const file = diff.data?.[0];
	const diffData = file
		? {
				path: file.fileName,
				side: "STAGED" as const,
				diff: file.diff ?? "",
				isBinary: file.isBinary ?? false,
				isTruncated: file.isTruncated ?? false,
			}
		: undefined;

	return (
		<GitDiffViewer
			path={config.path}
			diff={diffData}
			status={diff.status}
			error={diff.error}
			onRetry={diff.refresh}
		/>
	);
};

/** Blueprint for historical engine file diffs. */
export const ENGINE_GIT_DIFF_PANEL: WorkbenchPanelConfig<EngineGitDiffPanelConfig> =
	{
		name: "Diff",
		helpText: "File diff",
		icon: ({ className }) => <FileDiffIcon className={className} />,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path && a.commitId === b.commitId,
		content: EngineGitDiffPanel,
	};
