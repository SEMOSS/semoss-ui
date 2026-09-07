import { useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import type { GitCommit, GitCommitFile } from "@/components/git";
import { GitCommitRow } from "@/components/git";
import { useWorkbench } from "@/hooks";
import { WORKBENCH_COMPONENTS } from "../../workbench.constants";

/** Props for one expandable project commit history row. */
interface ProjectGitCommitRowProps {
	/** Project that owns the repository. */
	projectId: string;
	/** Commit metadata to display. */
	commit: GitCommit;
	/** Whether the current user may restore repository files. */
	canRestore: boolean;
	/** Refresh commit history after a restore. */
	onRestored: () => void;
}

/** Render an expandable project commit and lazily load its changed files. */
export const ProjectGitCommitRow = ({
	projectId,
	commit,
	canRestore,
	onRestored,
}: ProjectGitCommitRowProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const insight = useInsight();
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const files = usePixel<GitCommitFile[]>(
		isOpen
			? `ProjectCommitDiff(project=[${JSON.stringify(projectId)}], commitId=[${JSON.stringify(commit.commitId)}]);`
			: "",
	);
	/** Open the selected historical file in a project diff panel. */
	const openDiff = (file: GitCommitFile) => {
		const name =
			file.fileName.split("/").filter(Boolean).pop() ?? file.fileName;
		layoutActions.selectPanel(
			WORKBENCH_COMPONENTS.PROJECT_GIT_DIFF,
			{
				name,
				path: file.fileName,
				side: "COMMIT",
				commitId: commit.commitId,
			},
			{ name: `${name} (${commit.commitId.slice(0, 7)})` },
		);
	};
	/** Restore project files to this snapshot while preserving Git history. */
	const restore = async () => {
		await insight.actions.run(
			`ProjectCommitRestore(project=[${JSON.stringify(projectId)}], commitId=[${JSON.stringify(commit.commitId)}]);`,
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
