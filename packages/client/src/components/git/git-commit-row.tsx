import { ChevronRightIcon, FileIcon, RotateCcwIcon } from "lucide-react";
import { useState } from "react";
import {
	Badge,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	Muted,
	Skeleton,
} from "@semoss/ui/next";
import type { GitCommit, GitCommitFile } from "./git.types";
import { GitRestoreDialog } from "./git-restore-dialog";

/** Loading state for Git data rendered by standalone components. */
export type GitDataStatus = "INITIAL" | "LOADING" | "SUCCESS" | "ERROR";

/** Props for one expandable commit history row. */
interface GitCommitRowProps {
	/** Commit metadata to display. */
	commit: GitCommit;
	/** Files changed by the commit. */
	files?: GitCommitFile[];
	/** Current state of the changed-files request. */
	filesStatus: GitDataStatus;
	/** Whether the commit details are expanded. */
	open: boolean;
	/** Update the expanded state. */
	onOpenChange: (open: boolean) => void;
	/** Open the diff for a changed file. */
	onOpenDiff: (file: GitCommitFile) => void;
	/** Restore the repository to this commit snapshot. */
	onRestore?: () => Promise<void>;
	/** Notify the adapter after a successful restore. */
	onRestored?: () => void;
}

/** Format a commit date for the compact history list. */
const formatCommitDate = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(date);
};

/** Render an expandable Git commit and its changed files. */
export const GitCommitRow = ({
	commit,
	files,
	filesStatus,
	open,
	onOpenChange,
	onOpenDiff,
	onRestore,
	onRestored,
}: GitCommitRowProps) => {
	const [isRestoreOpen, setIsRestoreOpen] = useState(false);
	const subject = commit.commitMessage.split("\n")[0] || "Untitled commit";
	const trigger = (
		<CollapsibleTrigger asChild>
			<button
				type="button"
				aria-label={`${subject}, committed by ${commit.author.userId} on ${formatCommitDate(commit.date)}`}
				className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<ChevronRightIcon
					className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform data-[state=open]:rotate-90"
					aria-hidden="true"
				/>
				<span className="min-w-0 flex-1">
					<span
						className="block truncate font-medium text-sm"
						title={subject}
					>
						{subject}
					</span>
					<span className="block truncate text-muted-foreground text-xs">
						{commit.author.userId} · {formatCommitDate(commit.date)}
					</span>
					{commit.refs && commit.refs.length > 0 ? (
						<span className="mt-1 flex flex-wrap gap-1">
							{commit.refs.map((ref) => (
								<Badge
									key={`${ref.type}-${ref.name}`}
									variant="outline"
									className="max-w-full truncate"
									title={ref.name}
								>
									{ref.name}
								</Badge>
							))}
						</span>
					) : null}
				</span>
				<span className="font-mono text-muted-foreground text-xs">
					{commit.commitId.slice(0, 7)}
				</span>
			</button>
		</CollapsibleTrigger>
	);

	return (
		<>
			<Collapsible open={open} onOpenChange={onOpenChange}>
				{onRestore ? (
					<ContextMenu>
						<ContextMenuTrigger asChild>
							<div>{trigger}</div>
						</ContextMenuTrigger>
						<ContextMenuContent>
							<ContextMenuItem
								variant="destructive"
								onSelect={() => setIsRestoreOpen(true)}
							>
								<RotateCcwIcon aria-hidden="true" />
								Restore
							</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
				) : (
					trigger
				)}
				<CollapsibleContent>
					{filesStatus === "INITIAL" || filesStatus === "LOADING" ? (
						<output
							className="flex flex-col gap-2 px-5 py-2"
							aria-live="polite"
						>
							<span className="sr-only">
								Loading changed files
							</span>
							<Skeleton className="h-6 w-full" />
							<Skeleton className="h-6 w-3/4" />
						</output>
					) : null}
					{filesStatus === "ERROR" ? (
						<Muted className="block px-5 py-2" role="alert">
							Unable to load changed files.
						</Muted>
					) : null}
					{filesStatus === "SUCCESS" && files?.length === 0 ? (
						<Muted className="block px-5 py-2">
							No changed files.
						</Muted>
					) : null}
					{files?.length ? (
						<ul aria-label={`Files changed by ${subject}`}>
							{files.map((file) => (
								<li key={`${file.changeType}-${file.fileName}`}>
									<button
										type="button"
										className="flex w-full items-center gap-2 px-5 py-1 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										onClick={() => onOpenDiff(file)}
									>
										<FileIcon
											className="size-4 text-muted-foreground"
											aria-hidden="true"
										/>
										<span
											className="min-w-0 flex-1 truncate font-mono text-sm"
											title={file.fileName}
										>
											{file.fileName}
										</span>
										<span className="text-muted-foreground text-xs">
											{file.changeType}
										</span>
									</button>
								</li>
							))}
						</ul>
					) : null}
				</CollapsibleContent>
			</Collapsible>
			{onRestore ? (
				<GitRestoreDialog
					commit={commit}
					open={isRestoreOpen}
					onOpenChange={setIsRestoreOpen}
					onRestore={onRestore}
					onRestored={onRestored}
				/>
			) : null}
		</>
	);
};
