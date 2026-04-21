import {
	ChevronDown,
	ChevronRight,
	File,
	FileMinus,
	FilePlus,
	FileText,
	GitCommitHorizontal,
	History,
	Loader2,
	RotateCcw,
	User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	H4,
	Muted,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

interface CommitAuthor {
	userId: string;
	userEmail: string;
}

interface CommitDetails {
	commitId: string;
	author: CommitAuthor;
	date: string;
	commitMessage: string;
	tags: string[];
}

interface ChangedFile {
	fileName: string;
	changeType: "ADD" | "MODIFY" | "DELETE" | "RENAME" | "COPY";
	oldPath: string | null;
	newPath: string | null;
	diff?: string;
	isBinary?: boolean;
	isTruncated?: boolean;
}

interface CommitsTabProps {
	appId: string;
}

const PAGE_SIZE = 20;

const CHANGE_TYPE_CONFIG: Record<
	string,
	{ label: string; color: string; icon: typeof FilePlus }
> = {
	ADD: {
		label: "Added",
		color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
		icon: FilePlus,
	},
	MODIFY: {
		label: "Modified",
		color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
		icon: FileText,
	},
	DELETE: {
		label: "Deleted",
		color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
		icon: FileMinus,
	},
	RENAME: {
		label: "Renamed",
		color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
		icon: File,
	},
	COPY: {
		label: "Copied",
		color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
		icon: File,
	},
};

function formatRelativeDate(dateStr: string): string {
	try {
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) {
			return dateStr;
		}

		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHr = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHr / 24);

		if (diffSec < 60) return "Just now";
		if (diffMin < 60) return `${diffMin}m ago`;
		if (diffHr < 24) return `${diffHr}h ago`;
		if (diffDay === 1) return "Yesterday";
		if (diffDay < 7) return `${diffDay}d ago`;
		if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;

		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year:
				date.getFullYear() !== now.getFullYear()
					? "numeric"
					: undefined,
		});
	} catch {
		return dateStr;
	}
}

function formatFullDate(dateStr: string): string {
	try {
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return dateStr;
		return date.toLocaleString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	} catch {
		return dateStr;
	}
}

function getInitials(name: string): string {
	return name
		.split(/[\s@._-]/)
		.filter(Boolean)
		.slice(0, 2)
		.map((s) => s[0].toUpperCase())
		.join("");
}

function DiffView({ diff }: { diff: string }) {
	// Strip git diff header lines (diff --git, index, old mode, new file mode, ---, +++)
	// since the file name is already shown in the parent component
	const lines = diff
		.split("\n")
		.filter(
			(line) =>
				!line.startsWith("diff --git") &&
				!line.startsWith("index ") &&
				!line.startsWith("old mode") &&
				!line.startsWith("new mode") &&
				!line.startsWith("new file mode") &&
				!line.startsWith("deleted file mode") &&
				!line.startsWith("similarity index") &&
				!line.startsWith("rename from") &&
				!line.startsWith("rename to") &&
				!line.startsWith("--- ") &&
				!line.startsWith("+++ "),
		);

	return (
		<div className="overflow-x-auto rounded-md border border-border bg-muted/30 font-mono text-xs">
			{lines.map((line, i) => {
				let lineClass = "px-3 py-0.5 whitespace-pre";

				if (line.startsWith("@@")) {
					lineClass +=
						" bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
				} else if (line.startsWith("+")) {
					lineClass +=
						" bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300";
				} else if (line.startsWith("-")) {
					lineClass +=
						" bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300";
				}

				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: diff lines have no stable key
					<div key={`diff-line-${i}`} className={lineClass}>
						{line}
					</div>
				);
			})}
		</div>
	);
}

function FileChangeItem({
	file,
	appId,
	commitId,
}: {
	file: ChangedFile;
	appId: string;
	commitId: string;
}) {
	const { monolithStore } = useRootStore();
	const [isOpen, setIsOpen] = useState(false);
	const [diff, setDiff] = useState<string | null>(null);
	const [diffLoading, setDiffLoading] = useState(false);
	const [isBinary, setIsBinary] = useState(false);
	const [isTruncated, setIsTruncated] = useState(false);

	const config =
		CHANGE_TYPE_CONFIG[file.changeType] || CHANGE_TYPE_CONFIG.MODIFY;
	const Icon = config.icon;

	const fetchDiff = useCallback(async () => {
		if (diff !== null || diffLoading) return;
		setDiffLoading(true);
		try {
			const res = await monolithStore.runQuery(
				`ProjectCommitDiff(project=["${appId}"], commitId=["${commitId}"], filePath=["${file.fileName}"]);`,
			);
			const output = res?.pixelReturn?.[0]?.output;
			if (Array.isArray(output) && output.length > 0) {
				const fileData = output[0];
				setDiff(fileData.diff || "");
				setIsBinary(!!fileData.isBinary);
				setIsTruncated(!!fileData.isTruncated);
			} else {
				setDiff("");
			}
		} catch {
			toast.error("Failed to load diff");
			setDiff("");
		} finally {
			setDiffLoading(false);
		}
	}, [appId, commitId, file.fileName, diff, diffLoading, monolithStore]);

	const handleToggle = (open: boolean) => {
		setIsOpen(open);
		if (open) fetchDiff();
	};

	return (
		<Collapsible open={isOpen} onOpenChange={handleToggle}>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/50"
				>
					{isOpen ? (
						<ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
					) : (
						<ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
					)}
					<Icon className="size-4 shrink-0 text-muted-foreground" />
					<span className="min-w-0 flex-1 truncate font-mono text-sm">
						{file.fileName}
					</span>
					{file.changeType === "RENAME" && file.oldPath && (
						<Muted className="truncate text-xs">
							← {file.oldPath}
						</Muted>
					)}
					<span
						className={`shrink-0 rounded-full px-2 py-0.5 font-medium text-xs ${config.color}`}
					>
						{config.label}
					</span>
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-1 ml-9">
					{diffLoading && (
						<div className="flex items-center gap-2 py-3 text-muted-foreground text-sm">
							<Loader2 className="size-4 animate-spin" />
							Loading diff...
						</div>
					)}
					{!diffLoading && isBinary && (
						<div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-muted-foreground text-sm">
							Binary file — diff not available
						</div>
					)}
					{!diffLoading &&
						!isBinary &&
						diff !== null &&
						diff === "" && (
							<div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-muted-foreground text-sm">
								No changes to display
							</div>
						)}
					{!diffLoading && !isBinary && diff && (
						<>
							{isTruncated && (
								<div className="mb-1 text-amber-600 text-xs dark:text-amber-400">
									⚠ Diff truncated — file is too large to
									display in full
								</div>
							)}
							<DiffView diff={diff} />
						</>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}

function CommitItem({
	commit,
	appId,
	onRevertSuccess,
}: {
	commit: CommitDetails;
	appId: string;
	onRevertSuccess: () => void;
}) {
	const { monolithStore } = useRootStore();
	const [isOpen, setIsOpen] = useState(false);
	const [files, setFiles] = useState<ChangedFile[] | null>(null);
	const [filesLoading, setFilesLoading] = useState(false);
	const [revertDialogOpen, setRevertDialogOpen] = useState(false);
	const [reverting, setReverting] = useState(false);

	const shortSha = commit.commitId.substring(0, 7);
	const authorName = commit.author?.userId || "Unknown";
	const initials = getInitials(authorName);

	const fetchFiles = useCallback(async () => {
		if (files !== null || filesLoading) return;
		setFilesLoading(true);
		try {
			const res = await monolithStore.runQuery(
				`ProjectCommitDiff(project=["${appId}"], commitId=["${commit.commitId}"]);`,
			);
			const output = res?.pixelReturn?.[0]?.output;
			if (Array.isArray(output)) {
				setFiles(output as ChangedFile[]);
			} else {
				setFiles([]);
			}
		} catch {
			toast.error("Failed to load commit files");
			setFiles([]);
		} finally {
			setFilesLoading(false);
		}
	}, [appId, commit.commitId, files, filesLoading, monolithStore]);

	const handleToggle = (open: boolean) => {
		setIsOpen(open);
		if (open) fetchFiles();
	};

	const handleRevert = async () => {
		setReverting(true);
		try {
			const res = await monolithStore.runQuery(
				`ProjectCommitRestore(project=["${appId}"], commitId=["${commit.commitId}"]);`,
			);
			const operationType = res?.pixelReturn?.[0]?.operationType as
				| string[]
				| string
				| undefined;
			const isError = Array.isArray(operationType)
				? operationType.includes("ERROR")
				: typeof operationType === "string" &&
					(operationType as string).includes("ERROR");

			if (isError) {
				const output = res?.pixelReturn?.[0]?.output;
				throw new Error(
					typeof output === "string"
						? output
						: "Failed to revert commit",
				);
			}

			toast.success(
				`Reverted to commit ${shortSha}. A new commit has been created.`,
			);
			setRevertDialogOpen(false);
			onRevertSuccess();
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Failed to revert to this commit";
			toast.error(message);
		} finally {
			setReverting(false);
		}
	};

	// Parse the commit message: first line is summary, rest is body
	const messageLines = commit.commitMessage.trim().split("\n");
	const summary = messageLines[0];
	const hasBody = messageLines.length > 1;

	return (
		<>
			<Collapsible open={isOpen} onOpenChange={handleToggle}>
				<div className="relative flex gap-3 py-3">
					{/* Timeline line */}
					<div className="flex flex-col items-center">
						<Avatar className="size-8 shrink-0">
							<AvatarFallback className="text-xs">
								{initials || <User className="size-3.5" />}
							</AvatarFallback>
						</Avatar>
						<div className="mt-2 w-px flex-1 bg-border" />
					</div>

					{/* Content */}
					<div className="min-w-0 flex-1 pb-2">
						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="group flex w-full cursor-pointer items-start gap-2 text-left"
							>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="font-medium text-sm leading-tight">
											{summary}
										</span>
									</div>
									<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
										<span className="font-medium text-foreground/80">
											{authorName}
										</span>
										<span
											title={formatFullDate(commit.date)}
										>
											{formatRelativeDate(commit.date)}
										</span>
										<Badge
											variant="outline"
											className="font-mono text-[10px]"
										>
											{shortSha}
										</Badge>
										{commit.tags.map((tag) => (
											<Badge
												key={tag}
												variant="secondary"
												className="text-[10px]"
											>
												{tag}
											</Badge>
										))}
									</div>
									{hasBody && (
										<Muted className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs">
											{messageLines
												.slice(1)
												.join("\n")
												.trim()}
										</Muted>
									)}
								</div>
								<ChevronRight
									className={`mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform ${
										isOpen ? "rotate-90" : ""
									}`}
								/>
							</button>
						</CollapsibleTrigger>
						<div className="mt-1 flex items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								className="h-7 gap-1.5 text-muted-foreground text-xs hover:text-foreground"
								onClick={(e) => {
									e.stopPropagation();
									setRevertDialogOpen(true);
								}}
							>
								<RotateCcw className="size-3" />
								Revert
							</Button>
						</div>

						<CollapsibleContent>
							<div className="mt-3 rounded-lg border border-border bg-background/50 p-2">
								{filesLoading && (
									<div className="flex items-center gap-2 px-3 py-3 text-muted-foreground text-sm">
										<Loader2 className="size-4 animate-spin" />
										Loading changed files...
									</div>
								)}
								{!filesLoading &&
									files !== null &&
									files.length === 0 && (
										<div className="px-3 py-3 text-muted-foreground text-sm">
											No file changes found for this
											commit
										</div>
									)}
								{!filesLoading && files && files.length > 0 && (
									<div className="space-y-0.5">
										<div className="mb-2 flex items-center gap-2 px-3 text-muted-foreground text-xs">
											<span>
												{files.length} file
												{files.length !== 1 ? "s" : ""}{" "}
												changed
											</span>
										</div>
										{files.map((file) => (
											<FileChangeItem
												key={file.fileName}
												file={file}
												appId={appId}
												commitId={commit.commitId}
											/>
										))}
									</div>
								)}
							</div>
						</CollapsibleContent>
					</div>
				</div>
			</Collapsible>

			<Dialog
				open={revertDialogOpen}
				onOpenChange={(open) => !open && setRevertDialogOpen(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Revert to this commit?</DialogTitle>
					</DialogHeader>
					<div className="space-y-3 text-sm">
						<p>
							This will restore all files to the state they were
							in at commit{" "}
							<Badge
								variant="outline"
								className="font-mono text-[10px]"
							>
								{shortSha}
							</Badge>
						</p>
						<div className="rounded-md border border-border bg-muted/30 p-3">
							<p className="font-medium">{summary}</p>
							<p className="mt-1 text-muted-foreground text-xs">
								{authorName} • {formatFullDate(commit.date)}
							</p>
						</div>
						<p className="text-muted-foreground text-xs">
							A new commit will be created to record the revert.
							No history will be lost.
						</p>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRevertDialogOpen(false)}
							disabled={reverting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleRevert}
							disabled={reverting}
						>
							{reverting ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Reverting...
								</>
							) : (
								"Revert"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

export const CommitsTab = ({ appId }: CommitsTabProps) => {
	const { monolithStore } = useRootStore();
	const [commits, setCommits] = useState<CommitDetails[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [error, setError] = useState("");

	const fetchCommits = useCallback(
		async (offset: number, append: boolean) => {
			if (append) {
				setLoadingMore(true);
			} else {
				setLoading(true);
			}
			setError("");

			try {
				const res = await monolithStore.runQuery(
					`ProjectCommitDetails(project=["${appId}"], limit=["${PAGE_SIZE}"], offset=["${offset}"]);`,
				);

				const operationType = res?.pixelReturn?.[0]?.operationType as
					| string[]
					| string
					| undefined;
				const isError = Array.isArray(operationType)
					? operationType.includes("ERROR")
					: typeof operationType === "string" &&
						(operationType as string).includes("ERROR");

				if (isError) {
					const output = res?.pixelReturn?.[0]?.output;
					throw new Error(
						typeof output === "string"
							? output
							: "Failed to load commits",
					);
				}

				const output = res?.pixelReturn?.[0]?.output;
				const newCommits = Array.isArray(output)
					? (output as CommitDetails[])
					: [];

				if (append) {
					setCommits((prev) => [...prev, ...newCommits]);
				} else {
					setCommits(newCommits);
				}

				setHasMore(newCommits.length >= PAGE_SIZE);
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "Failed to load commit history";
				setError(message);
				if (!append) setCommits([]);
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[appId, monolithStore],
	);

	useEffect(() => {
		fetchCommits(0, false);
	}, [fetchCommits]);

	const handleLoadMore = () => {
		fetchCommits(commits.length, true);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Spinner className="size-6" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
				<p className="font-medium text-destructive text-sm">{error}</p>
				<Button
					variant="outline"
					size="sm"
					className="mt-3"
					onClick={() => fetchCommits(0, false)}
				>
					Retry
				</Button>
			</div>
		);
	}

	if (commits.length === 0) {
		return (
			<div className="rounded-xl border border-border/70 border-dashed bg-muted/20 p-8 text-center">
				<div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
					<History className="size-5 text-muted-foreground" />
				</div>
				<p className="font-medium text-sm">No commit history</p>
				<p className="mt-1 text-muted-foreground text-sm">
					Commits will appear here as changes are saved to the app.
				</p>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-4 flex items-center gap-2">
				<GitCommitHorizontal className="size-5 text-muted-foreground" />
				<H4>Commit History</H4>
			</div>

			<div className="space-y-0">
				{commits.map((commit) => (
					<CommitItem
						key={commit.commitId}
						commit={commit}
						appId={appId}
						onRevertSuccess={() => fetchCommits(0, false)}
					/>
				))}
			</div>

			{hasMore && (
				<div className="mt-4 flex justify-center">
					<Button
						variant="outline"
						size="sm"
						onClick={handleLoadMore}
						disabled={loadingMore}
					>
						{loadingMore ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Loading...
							</>
						) : (
							"Load more commits"
						)}
					</Button>
				</div>
			)}
		</div>
	);
};
