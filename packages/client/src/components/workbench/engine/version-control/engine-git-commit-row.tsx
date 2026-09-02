import { useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import type { GitCommit, GitCommitFile } from "@/components/git";
import { GitCommitRow } from "@/components/git";
import { useWorkbench } from "@/hooks";
import { WORKBENCH_COMPONENTS } from "../../workbench.constants";

/** Props for an engine commit history row. */
interface EngineGitCommitRowProps {
	/** Engine that owns the repository. */
	engineId: string;
	/** Commit metadata to display. */
	commit: GitCommit;
	/** Whether the current user may restore repository files. */
	canRestore: boolean;
	/** Refresh commit history after a restore. */
	onRestored: () => void;
}

/** Adapt an engine commit query and diff action to a standalone Git row. */
export const EngineGitCommitRow = ({
	engineId,
	commit,
	canRestore,
	onRestored,
}: EngineGitCommitRowProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const insight = useInsight();
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const files = usePixel<GitCommitFile[]>(
		isOpen
			? `EngineCommitDiff(engine=[${JSON.stringify(engineId)}], commitId=[${JSON.stringify(commit.commitId)}]);`
			: "",
	);

	/** Open the selected historical file in an engine diff panel. */
	const openDiff = (file: GitCommitFile) => {
		const name =
			file.fileName.split("/").filter(Boolean).pop() ?? file.fileName;
		layoutActions.selectPanel(
			WORKBENCH_COMPONENTS.ENGINE_GIT_DIFF,
			{
				name,
				path: file.fileName,
				commitId: commit.commitId,
			},
			{ name: `${name} (${commit.commitId.slice(0, 7)})` },
		);
	};
	/** Restore engine files to this snapshot while preserving Git history. */
	const restore = async () => {
		await insight.actions.run(
			`EngineCommitRestore(engine=[${JSON.stringify(engineId)}], commitId=[${JSON.stringify(commit.commitId)}]);`,
		);
	};

	return (
		<GitCommitRow
			commit={commit}
			files={files.data}
			filesStatus={files.status}
			open={isOpen}
			onOpenChange={setIsOpen}
			onOpenDiff={openDiff}
			onRestore={canRestore ? restore : undefined}
			onRestored={onRestored}
		/>
	);
};
