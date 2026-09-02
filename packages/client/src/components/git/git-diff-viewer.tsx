import { FileDiffIcon, MinusIcon, PlusIcon, RefreshCwIcon } from "lucide-react";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	cn,
	Muted,
	Skeleton,
} from "@semoss/ui/next";
import type { GitDiff, GitStageAction } from "./git.types";
import type { GitDataStatus } from "./git-commit-row";

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

/** Return semantic styling for one unified diff line. */
const getDiffLineClass = (line: string): string => {
	if (line.startsWith("@@")) {
		return "bg-primary/10 text-primary";
	}
	if (line.startsWith("+") && !line.startsWith("+++")) {
		return "bg-success/10 text-success";
	}
	if (line.startsWith("-") && !line.startsWith("---")) {
		return "bg-destructive/10 text-destructive";
	}
	if (
		line.startsWith("diff --git") ||
		line.startsWith("index ") ||
		line.startsWith("---") ||
		line.startsWith("+++")
	) {
		return "text-muted-foreground";
	}
	return "text-foreground";
};

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
	const ActionIcon = action === "UNSTAGE" ? MinusIcon : PlusIcon;

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
				<ContextMenu>
					<ContextMenuTrigger asChild>
						<section
							className="min-h-0 flex-1 overflow-auto bg-muted/30 font-mono text-xs"
							aria-label={`Diff for ${path}`}
						>
							<div className="w-max min-w-full py-2">
								{diff.diff.split("\n").map((line, index) => (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: diff lines have no stable identity
										key={index}
										className={cn(
											"whitespace-pre px-3 py-0.5",
											getDiffLineClass(line),
										)}
									>
										{line || " "}
									</div>
								))}
							</div>
						</section>
					</ContextMenuTrigger>
					{action && onAction ? (
						<ContextMenuContent>
							<ContextMenuItem onSelect={onAction}>
								<ActionIcon
									className="size-4"
									aria-hidden="true"
								/>
								{actionLabel}
							</ContextMenuItem>
						</ContextMenuContent>
					) : null}
				</ContextMenu>
			) : (
				<div className="flex flex-1 items-center justify-center p-6 text-center">
					<Muted>No changes to display.</Muted>
				</div>
			)}
		</div>
	);
};
