import { FileIcon, MinusIcon, PlusIcon } from "lucide-react";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type {
	ProjectGitFile,
	ProjectGitStageAction,
} from "./version-control.types";

interface GitChangeRowProps {
	file: ProjectGitFile;
	action?: ProjectGitStageAction;
	disabled: boolean;
	onAction: (file: ProjectGitFile, action: ProjectGitStageAction) => void;
	onOpen?: (file: ProjectGitFile) => void;
}

const STATUS_LABELS: Record<ProjectGitFile["status"], string> = {
	ADDED: "A",
	MODIFIED: "M",
	DELETED: "D",
	UNTRACKED: "U",
	CONFLICTED: "C",
};

/** A changed file row with equivalent pointer, keyboard, and context actions. */
export const GitChangeRow = ({
	file,
	action,
	disabled,
	onAction,
	onOpen,
}: GitChangeRowProps) => {
	const actionLabel = action === "STAGE" ? "Stage file" : "Unstage file";
	const ActionIcon = action === "STAGE" ? PlusIcon : MinusIcon;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div className="group flex w-full items-center gap-2 px-3 py-1 hover:bg-accent">
					<FileIcon
						className="size-4 shrink-0 text-muted-foreground"
						aria-hidden="true"
					/>
					{onOpen ? (
						<button
							type="button"
							className="min-w-0 flex-1 truncate text-left font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							title={file.path}
							onClick={() => onOpen(file)}
						>
							{file.path}
						</button>
					) : (
						<span
							className="min-w-0 flex-1 truncate font-mono text-sm"
							title={file.path}
						>
							{file.path}
						</span>
					)}
					{action ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={`${actionLabel}: ${file.path}`}
									disabled={disabled}
									onClick={() => onAction(file, action)}
								>
									<ActionIcon
										className="size-4"
										aria-hidden="true"
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent>{actionLabel}</TooltipContent>
						</Tooltip>
					) : null}
					<span className="font-medium text-muted-foreground text-xs">
						<span aria-hidden="true">
							{STATUS_LABELS[file.status]}
						</span>
						<span className="sr-only">
							{file.status.toLowerCase()}
						</span>
					</span>
				</div>
			</ContextMenuTrigger>
			{action ? (
				<ContextMenuContent>
					<ContextMenuItem
						disabled={disabled}
						onSelect={() => onAction(file, action)}
					>
						<ActionIcon className="size-4" aria-hidden="true" />
						{actionLabel}
					</ContextMenuItem>
				</ContextMenuContent>
			) : onOpen ? (
				<ContextMenuContent>
					<ContextMenuItem onSelect={() => onOpen(file)}>
						Resolve conflict
					</ContextMenuItem>
				</ContextMenuContent>
			) : null}
		</ContextMenu>
	);
};
