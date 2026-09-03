import {
	ChevronsUpDownIcon,
	GitBranchIcon,
	GitBranchPlusIcon,
	RefreshCwIcon,
} from "lucide-react";
import { useState } from "react";
import {
	Button,
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type { GitBranches, GitStatus } from "./git.types";
import type { GitDataStatus } from "./git-commit-row";
import { GitCreateBranchDialog } from "./git-create-branch-dialog";

/** Props for selecting and refreshing repository branches. */
interface GitBranchControlProps {
	/** Current repository status. */
	status?: GitStatus;
	/** Available repository branches. */
	branches?: GitBranches;
	/** Current state of the branches request. */
	branchesStatus: GitDataStatus;
	/** Accessible scope name for the control. */
	label: string;
	/** Notify the adapter when branch choices open or close. */
	onOpenChange: (open: boolean) => void;
	/** Check out an existing branch. */
	onSwitch: (branch: string) => Promise<void>;
	/** Create and check out a branch from HEAD. */
	onCreate: (branch: string) => Promise<void>;
	/** Refresh repository status and consumers. */
	onRefresh: () => void;
	/** Optional host-specific trigger styling. */
	triggerClassName?: string;
	/** Optional host-specific refresh-button styling. */
	refreshClassName?: string;
	/** Optional host-specific refresh-icon styling. */
	refreshIconClassName?: string;
}

/** Select, create, and refresh Git branches. */
export const GitBranchControl = ({
	status,
	branches,
	branchesStatus,
	label,
	onOpenChange,
	onSwitch,
	onCreate,
	onRefresh,
	triggerClassName,
	refreshClassName,
	refreshIconClassName,
}: GitBranchControlProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isSwitching, setIsSwitching] = useState(false);
	const [search, setSearch] = useState("");
	const availableBranches =
		branches?.branches.filter((branch) => !branch.current) ?? [];
	const normalizedSearch = search.trim().toLocaleLowerCase();
	const filteredBranches = availableBranches.filter((branch) =>
		branch.name.toLocaleLowerCase().includes(normalizedSearch),
	);
	const branchLabel = status?.detached
		? "Detached HEAD"
		: status?.branch || "No branch";

	/** Check out a branch and refresh repository consumers after success. */
	const switchBranch = async (branch: string) => {
		setIsOpen(false);
		setSearch("");
		setIsSwitching(true);
		try {
			await onSwitch(branch);
			onRefresh();
			toast.success(`Switched to ${branch}`);
		} catch (error) {
			console.error(error);
			toast.error("Failed to switch branch");
		} finally {
			setIsSwitching(false);
		}
	};

	/** Close the create dialog and refresh after a branch is created. */
	const handleCreateSubmit = (branch?: string) => {
		setIsCreateOpen(false);
		if (branch) {
			onRefresh();
		}
	};

	/** Synchronize popover state with the data-loading adapter. */
	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		onOpenChange(open);
		if (!open) {
			setSearch("");
		}
	};

	/** Move focus from branch selection into the create-branch workflow. */
	const openCreateBranch = () => {
		handleOpenChange(false);
		setIsCreateOpen(true);
	};

	const refreshLabel = `Refresh ${label.toLocaleLowerCase()}`;

	return (
		<>
			<Popover open={isOpen} onOpenChange={handleOpenChange}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						disabled={isSwitching}
						className={cn(
							"min-w-0 max-w-56 justify-between rounded-md border border-input",
							triggerClassName,
						)}
						aria-label={`${label}: ${branchLabel}`}
						aria-expanded={isOpen}
					>
						<GitBranchIcon aria-hidden className="size-3.5" />
						<span className="min-w-0 truncate">{branchLabel}</span>
						{isSwitching ? (
							<Spinner className="size-3.5" />
						) : (
							<ChevronsUpDownIcon
								aria-hidden
								className="size-3.5 opacity-60"
							/>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-72 p-0" align="end">
					<Command shouldFilter={false}>
						<CommandInput
							placeholder="Search branches..."
							value={search}
							onValueChange={setSearch}
						/>
						<CommandList>
							{branchesStatus === "INITIAL" ||
							branchesStatus === "LOADING" ? (
								<CommandItem disabled>
									<Spinner className="size-3.5" />
									Loading branches
								</CommandItem>
							) : null}
							{branchesStatus === "ERROR" ? (
								<CommandItem disabled>
									Unable to load branches
								</CommandItem>
							) : null}
							{branchesStatus === "SUCCESS" &&
							filteredBranches.length === 0 ? (
								<CommandItem disabled>
									{availableBranches.length === 0
										? "No other branches."
										: "No matching branches."}
								</CommandItem>
							) : null}
							{filteredBranches.map((branch) => (
								<CommandItem
									key={branch.fullName}
									value={branch.name}
									onSelect={() =>
										void switchBranch(branch.name)
									}
								>
									{branch.name}
									{branch.remote ? " (remote)" : ""}
								</CommandItem>
							))}
							<CommandSeparator />
							<CommandGroup>
								<CommandItem onSelect={openCreateBranch}>
									<GitBranchPlusIcon aria-hidden />
									New branch...
								</CommandItem>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={onRefresh}
						aria-label={refreshLabel}
						className={cn(
							"flex-none text-muted-foreground",
							refreshClassName,
						)}
					>
						<RefreshCwIcon
							aria-hidden
							className={refreshIconClassName}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent>{refreshLabel}</TooltipContent>
			</Tooltip>
			<GitCreateBranchDialog
				open={isCreateOpen}
				onCreate={onCreate}
				onSubmit={handleCreateSubmit}
			/>
		</>
	);
};
