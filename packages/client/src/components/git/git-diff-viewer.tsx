import { FileDiffIcon, RefreshCwIcon } from "lucide-react";
import {
	Button,
	CodeEditor,
	type CodeEditorMenuItem,
	DiffCodeEditor,
	Muted,
	Skeleton,
} from "@semoss/ui/next";
import { getCodeEditorLanguage } from "@/components/workbench/file-editor.utility";
import type { GitDiff, GitStageAction } from "./git.types";
import type { GitDataStatus } from "./git-commit-row";
import { getGitDiffCodeModels } from "./git-diff.utility";

/** Props for displaying a standalone Git diff. */
interface GitDiffViewerProps {
	/** Repository-relative path being compared. */
	path: string;
	/** Loaded diff data. */
	diff?: GitDiff;
	/** Current state of the diff request. */
	status: GitDataStatus;
	/** Error returned while loading the diff. */
	error?: Error;
	/** Available index mutation for this diff. */
	action?: GitStageAction;
	/** Retry loading the diff. */
	onRetry: () => void;
	/** Stage or unstage the displayed file. */
	onAction?: () => void;
}

/** Display a unified Git diff with an optional index action. */
export const GitDiffViewer = ({
	path,
	diff,
	status,
	error,
	action,
	onRetry,
	onAction,
}: GitDiffViewerProps) => {
	const actionLabel = action === "UNSTAGE" ? "Unstage file" : "Stage file";
	const actionMenuItems: CodeEditorMenuItem[] | undefined =
		action && onAction
			? [
					{
						id: `${action.toLowerCase()}-file`,
						label: actionLabel,
						onSelect: onAction,
					},
				]
			: undefined;

	if (status === "INITIAL" || status === "LOADING") {
		return (
			<output
				className="flex h-full flex-col gap-2 p-3"
				aria-live="polite"
			>
				<span className="sr-only">Loading file diff</span>
				<Skeleton className="h-8 w-full" />
				<Skeleton className="min-h-0 flex-1" />
			</output>
		);
	}

	if (status === "ERROR" || !diff) {
		return (
			<div
				className="flex h-full flex-col items-center justify-center gap-3 p-6"
				role="alert"
			>
				<FileDiffIcon
					className="size-5 text-destructive"
					aria-hidden="true"
				/>
				<span className="font-medium text-sm">
					Unable to load file diff
				</span>
				<Muted>{error?.message ?? "The diff is unavailable."}</Muted>
				<Button size="sm" variant="outline" onClick={onRetry}>
					<RefreshCwIcon className="size-4" aria-hidden="true" />
					Retry
				</Button>
			</div>
		);
	}

	const codeModels = diff.diff ? getGitDiffCodeModels(diff.diff) : null;
	const language = getCodeEditorLanguage(path);

	return (
		<div className="flex h-full min-h-0 flex-col">
			{diff.isTruncated ? (
				<div className="border-warning border-b bg-warning/10 px-3 py-2 text-sm text-warning">
					Diff truncated because the file is too large to display in
					full.
				</div>
			) : null}
			{diff.isBinary ? (
				<div className="flex flex-1 items-center justify-center p-6 text-center">
					<Muted>Binary file diff is not available.</Muted>
				</div>
			) : diff.diff ? (
				<section
					className="min-h-0 flex-1 overflow-hidden bg-background"
					aria-label={`Diff for ${path}`}
				>
					{codeModels ? (
						<DiffCodeEditor
							className="size-full"
							original={codeModels.original}
							modified={codeModels.modified}
							disabled
							language={language}
							menuItems={actionMenuItems}
						/>
					) : (
						<CodeEditor
							className="size-full"
							code={diff.diff}
							disabled
							language="diff"
							menuItems={actionMenuItems}
						/>
					)}
				</section>
			) : (
				<div className="flex flex-1 items-center justify-center p-6 text-center">
					<Muted>No changes to display.</Muted>
				</div>
			)}
		</div>
	);
};
