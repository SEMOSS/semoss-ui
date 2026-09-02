import {
	ChevronsUpDownIcon,
	GitBranchIcon,
	GitBranchPlusIcon,
	RefreshCwIcon,
} from "lucide-react";
import { type FC, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
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
import { useProject } from "@/hooks";
import type {
	WorkbenchChromeProps,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../../core/workbench.chrome";
import { GitCreateBranchDialog } from "./git-create-branch-dialog";
import type {
	ProjectGitBranches,
	ProjectGitStatus,
} from "./version-control.types";

/** Select, create, and refresh project Git branches from panel chrome. */
export const ProjectVersionControl: FC<
	WorkbenchChromeProps<WorkbenchPanelParams, number>
> = ({ setValue }) => {
	const { project } = useProject();
	const insight = useInsight();
	const [isOpen, setIsOpen] = useState(false);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isSwitching, setIsSwitching] = useState(false);
	const [search, setSearch] = useState("");
	const status = usePixel<ProjectGitStatus>(
		`ProjectGitStatus(project=[${JSON.stringify(project.project_id)}]);`,
	);
	const branches = usePixel<ProjectGitBranches>(
		isOpen
			? `ProjectGitBranches(project=[${JSON.stringify(project.project_id)}]);`
			: "",
	);
	const availableBranches =
		branches.data?.branches.filter((branch) => !branch.current) ?? [];
	const normalizedSearch = search.trim().toLocaleLowerCase();
	const filteredBranches = availableBranches.filter((branch) =>
		branch.name.toLocaleLowerCase().includes(normalizedSearch),
	);
	const branchLabel = status.data?.detached
		? "Detached HEAD"
		: status.data?.branch || "No branch";

	const refresh = () => {
		status.refresh();
		setValue((revision = 0) => revision + 1);
	};

	const switchBranch = async (value: string) => {
		setIsOpen(false);
		setSearch("");
		setIsSwitching(true);
		try {
			await insight.actions.run(
				`ProjectGitCheckout(project=[${JSON.stringify(project.project_id)}], branch=[${JSON.stringify(value)}]);`,
			);
			refresh();
			toast.success(`Switched to ${value}`);
		} catch (error) {
			console.error(error);
			toast.error("Failed to switch branch");
		} finally {
			setIsSwitching(false);
		}
	};

	const handleCreateSubmit = (branch?: string) => {
		setIsCreateOpen(false);
		if (!branch) {
			return;
		}
		refresh();
	};

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setSearch("");
		}
	};

	const openCreateBranch = () => {
		setIsOpen(false);
		setSearch("");
		setIsCreateOpen(true);
	};

	return (
		<>
			<Popover open={isOpen} onOpenChange={handleOpenChange}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						disabled={isSwitching}
						className={cn(
							"min-w-0 max-w-56 justify-between",
							WORKBENCH_STYLES.chromeSelect,
						)}
						aria-label={`Project version: ${branchLabel}`}
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
							{branches.status === "INITIAL" ||
							branches.status === "LOADING" ? (
								<CommandItem disabled>
									<Spinner className="size-3.5" />
									Loading branches
								</CommandItem>
							) : null}
							{branches.status === "ERROR" ? (
								<CommandItem disabled>
									Unable to load branches
								</CommandItem>
							) : null}
							{branches.status === "SUCCESS" &&
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
						onClick={refresh}
						aria-label="Refresh project version"
						className={cn(
							"flex-none text-muted-foreground",
							WORKBENCH_STYLES.chromeButton,
						)}
					>
						<RefreshCwIcon
							aria-hidden
							className={WORKBENCH_STYLES.chromeIcon}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent>Refresh project version</TooltipContent>
			</Tooltip>
			<GitCreateBranchDialog
				open={isCreateOpen}
				onSubmit={handleCreateSubmit}
			/>
		</>
	);
};
