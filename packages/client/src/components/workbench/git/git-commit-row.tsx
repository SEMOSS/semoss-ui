import { useState } from "react";
import { FILE_PANEL_EVENTS } from "@semoss/panels";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { useWorkbench } from "@semoss/workbench";
import type { GitCommit, GitCommitFile } from "@/components/git";
import { GitCommitRow } from "@/components/git";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";
import { type GitPanelScopeParams, gitFileScope } from "./git-panel.types";

interface GitCommitRowAdapterProps {
	type: GitPanelScopeParams["type"];
	id: string;
	canRestore: boolean;
	commit: GitCommit;
	onRestored: () => void;
}

/** Adapt a scoped commit query and actions to the shared Git row. */
export const GitCommitRowAdapter = ({
	type,
	id,
	canRestore,
	commit,
	onRestored,
}: GitCommitRowAdapterProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const insight = useInsight();
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const emit = useWorkbench((state) => state.events.actions.emit);
	const prefix = type === "ENGINE" ? "Engine" : "Project";
	const resource =
		type === "ENGINE"
			? `engine=[${JSON.stringify(id)}]`
			: `project=[${JSON.stringify(id)}]`;
	const files = usePixel<GitCommitFile[]>(
		isOpen
			? `${prefix}CommitDiff(${resource}, commitId=[${JSON.stringify(commit.commitId)}]);`
			: "",
	);

	/** Open a historical file in the unified diff panel. */
	const openDiff = (file: GitCommitFile) => {
		const name =
			file.fileName.split("/").filter(Boolean).pop() ?? file.fileName;
		layoutActions.selectPanel(
			WORKBENCH_COMPONENTS.GIT_DIFF,
			{
				type,
				id,
				name,
				path: file.fileName,
				side: "COMMIT",
				commitId: commit.commitId,
			},
			{ name: `${name} (${commit.commitId.slice(0, 7)})` },
		);
	};

	/** Restore resource files to this snapshot while preserving Git history. */
	const restore = async () => {
		if (!canRestore) return;
		await insight.actions.run(
			`${prefix}CommitRestore(${resource}, commitId=[${JSON.stringify(commit.commitId)}]);`,
		);
		// The files on disk are now the snapshot's, so anything showing them is
		// stale — the same blast radius as a checkout.
		emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
			scope: gitFileScope({ type, id }),
		});
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
