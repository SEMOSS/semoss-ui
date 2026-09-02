import { FileDiffIcon, MinusIcon, PlusIcon, RefreshCwIcon } from "lucide-react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	cn,
	Muted,
	Skeleton,
	toast,
} from "@semoss/ui/next";
import { useProject, useWorkbench } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import type {
	ProjectGitDiff,
	ProjectGitDiffSide,
	ProjectGitStageAction,
} from "./version-control.types";

/** Parameters that identify one project working-tree diff. */
export interface GitDiffPanelConfig {
	name: string;
	path: string;
	side: ProjectGitDiffSide;
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

/** Display a staged or unstaged unified diff with its index action. */
const GitDiffPanel: WorkbenchComponent<GitDiffPanelConfig> = ({
	config,
	close,
}) => {
	const { project } = useProject();
	const insight = useInsight();
	const events = useWorkbench((state) => state.events.actions);
	const diff = usePixel<ProjectGitDiff>(
		`ProjectGitDiff(project=[${JSON.stringify(project.project_id)}], filePath=[${JSON.stringify(config.path)}], side=[${JSON.stringify(config.side)}]);`,
	);
	const action: ProjectGitStageAction =
		config.side === "STAGED" ? "UNSTAGE" : "STAGE";
	const actionLabel = action === "STAGE" ? "Stage file" : "Unstage file";
	const ActionIcon = action === "STAGE" ? PlusIcon : MinusIcon;

	const mutateFile = async () => {
		try {
			await insight.actions.run(
				`ProjectGitStage(project=[${JSON.stringify(project.project_id)}], paths=[${JSON.stringify(config.path)}], action=[${JSON.stringify(action)}]);`,
			);
			events.emit("git:status-changed", undefined);
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

	if (diff.status === "INITIAL" || diff.status === "LOADING") {
		return (
			<output className="flex h-full flex-col gap-2 p-3">
				<span className="sr-only">Loading file diff</span>
				<Skeleton className="h-8 w-full" />
				<Skeleton className="min-h-0 flex-1" />
			</output>
		);
	}

	if (diff.status === "ERROR" || !diff.data) {
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
				<Muted>
					{diff.error?.message ?? "The diff is unavailable."}
				</Muted>
				<Button size="sm" variant="outline" onClick={diff.refresh}>
					<RefreshCwIcon className="size-4" aria-hidden="true" />
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex items-center gap-2 border-border border-b p-2">
				<span
					className="min-w-0 flex-1 truncate font-mono text-sm"
					title={config.path}
				>
					{config.path}
				</span>
				<Button
					size="sm"
					variant="outline"
					onClick={() => void mutateFile()}
				>
					<ActionIcon className="size-4" aria-hidden="true" />
					{actionLabel}
				</Button>
			</div>
			{diff.data.isTruncated ? (
				<div className="border-warning border-b bg-warning/10 px-3 py-2 text-sm text-warning">
					Diff truncated because the file is too large to display in
					full.
				</div>
			) : null}
			{diff.data.isBinary ? (
				<div className="flex flex-1 items-center justify-center p-6 text-center">
					<Muted>Binary file diff is not available.</Muted>
				</div>
			) : diff.data.diff ? (
				<ContextMenu>
					<ContextMenuTrigger asChild>
						<section
							className="min-h-0 flex-1 overflow-auto bg-muted/30 font-mono text-xs"
							aria-label={`Diff for ${config.path}`}
						>
							<div className="w-max min-w-full py-2">
								{diff.data.diff
									.split("\n")
									.map((line, index) => (
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
					<ContextMenuContent>
						<ContextMenuItem onSelect={() => void mutateFile()}>
							<ActionIcon className="size-4" aria-hidden="true" />
							{actionLabel}
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			) : (
				<div className="flex flex-1 items-center justify-center p-6 text-center">
					<Muted>No changes to display.</Muted>
				</div>
			)}
		</div>
	);
};

/** Blueprint for staged and unstaged project file diffs. */
export const PROJECT_GIT_DIFF_PANEL: WorkbenchPanelConfig<GitDiffPanelConfig> =
	{
		name: "Diff",
		helpText: "File diff",
		icon: ({ className }) => <FileDiffIcon className={className} />,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path && a.side === b.side,
		content: GitDiffPanel,
	};
