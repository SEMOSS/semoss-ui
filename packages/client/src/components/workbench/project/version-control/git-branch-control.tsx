import { GitBranchIcon } from "lucide-react";
import {
	Button,
	Muted,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Skeleton,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { WORKBENCH_STYLES } from "../../core/workbench.chrome";
import { useProjectGitStatus } from "./use-project-git-status";

const formatFullDate = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
};

/** Compact branch metadata control for editable project workbenches. */
export const GitBranchControl = () => {
	const status = useProjectGitStatus();
	const branch = status.data?.detached
		? "Detached HEAD"
		: status.data?.branch || "Branch unavailable";
	const lastCommit = status.data?.lastCommit;

	return (
		<Popover>
			<Tooltip>
				<TooltipTrigger asChild>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={`Git branch: ${branch}`}
							className={WORKBENCH_STYLES.chromeButton}
						>
							<GitBranchIcon
								className={WORKBENCH_STYLES.chromeIcon}
								aria-hidden="true"
							/>
						</Button>
					</PopoverTrigger>
				</TooltipTrigger>
				<TooltipContent side="top">{branch}</TooltipContent>
			</Tooltip>
			<PopoverContent side="top" align="start" className="w-80 p-4">
				{status.status === "INITIAL" || status.status === "LOADING" ? (
					<div className="flex flex-col gap-2">
						<Skeleton className="h-5 w-2/3" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
					</div>
				) : null}
				{status.status === "ERROR" ? (
					<div role="alert">
						<span className="font-medium text-sm">
							Git status unavailable
						</span>
						<Muted className="mt-1 block">
							Open Version Control to retry.
						</Muted>
					</div>
				) : null}
				{status.status === "SUCCESS" && status.data ? (
					<div className="flex min-w-0 flex-col gap-3">
						<div className="min-w-0">
							<Muted>Current branch</Muted>
							<div className="mt-1 flex items-center gap-2">
								<GitBranchIcon
									className="size-4 shrink-0"
									aria-hidden="true"
								/>
								<span
									className="truncate font-medium text-sm"
									title={branch}
								>
									{branch}
								</span>
							</div>
						</div>
						{lastCommit ? (
							<div className="min-w-0 border-border border-t pt-3">
								<Muted>Last commit</Muted>
								<div
									className="mt-1 truncate font-medium text-sm"
									title={lastCommit.message}
								>
									{lastCommit.message.split("\n")[0]}
								</div>
								<Muted className="mt-1 block truncate">
									{lastCommit.author} ·{" "}
									{formatFullDate(lastCommit.date)}
								</Muted>
								<Muted className="mt-1 block font-mono">
									{lastCommit.commitId.slice(0, 7)}
								</Muted>
							</div>
						) : null}
						<div className="border-border border-t pt-3">
							<Muted>Publish status unknown</Muted>
						</div>
					</div>
				) : null}
			</PopoverContent>
		</Popover>
	);
};
