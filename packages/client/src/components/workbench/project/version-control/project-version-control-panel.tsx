import {
	AlertCircleIcon,
	GitBranchIcon,
	GitBranchPlusIcon,
	GitMergeIcon,
	GitPullRequestArrowIcon,
	RefreshCwIcon,
} from "lucide-react";
import { useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	Muted,
	Skeleton,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useProject, useWorkbench } from "@/hooks";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import { WORKBENCH_COMPONENTS } from "../../workbench.constants";
import { GitChangeGroup } from "./git-change-group";
import { GitCreateBranchDialog } from "./git-create-branch-dialog";
import { GitHistoryAccordion } from "./git-history-accordion";
import { GitSwitchBranchDialog } from "./git-switch-branch-dialog";
import { ProjectVersionControlIcon } from "./project-version-control-icon";
import { useProjectGitStatus } from "./use-project-git-status";
import type {
	ProjectGitDiffSide,
	ProjectGitFile,
	ProjectGitStageAction,
} from "./version-control.types";

const ProjectVersionControlPanel = () => {
	const { project } = useProject();
	const insight = useInsight();
	const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);
	const [isSwitchBranchOpen, setIsSwitchBranchOpen] = useState(false);
	const [isMutating, setIsMutating] = useState(false);
	const status = useProjectGitStatus();
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const events = useWorkbench((state) => state.events.actions);
	const openConflict = (file: ProjectGitFile) => {
		const name = file.path.split("/").filter(Boolean).pop() ?? file.path;
		layoutActions.selectPanel(
			WORKBENCH_COMPONENTS.PROJECT_GIT_CONFLICT_RESOLVER,
			{ name, path: file.path },
			{ name: `Resolve: ${name}` },
		);
	};
	const openDiff = (file: ProjectGitFile, side: ProjectGitDiffSide) => {
		const name = file.path.split("/").filter(Boolean).pop() ?? file.path;
		layoutActions.selectPanel(
			WORKBENCH_COMPONENTS.PROJECT_GIT_DIFF,
			{ name, path: file.path, side },
			{ name: `${name} (${side === "STAGED" ? "Staged" : "Changes"})` },
		);
	};

	const mutateFile = async (
		file: ProjectGitFile,
		action: ProjectGitStageAction,
	) => {
		try {
			setIsMutating(true);
			await insight.actions.run(
				`ProjectGitStage(project=[${JSON.stringify(project.project_id)}], paths=[${JSON.stringify(file.path)}], action=[${JSON.stringify(action)}]);`,
			);
			events.emit("git:status-changed", undefined);
			toast.success(action === "STAGE" ? "File staged" : "File unstaged");
		} catch (error) {
			console.error(error);
			toast.error(
				action === "STAGE"
					? "Failed to stage file"
					: "Failed to unstage file",
			);
		} finally {
			setIsMutating(false);
		}
	};

	if (status.status === "INITIAL" || status.status === "LOADING") {
		return (
			<output className="flex flex-col gap-2 p-3">
				<span className="sr-only">Loading Git changes</span>
				<Skeleton className="h-8 w-full" />
				<Skeleton className="h-8 w-full" />
				<Skeleton className="h-8 w-3/4" />
			</output>
		);
	}

	if (status.status === "ERROR" || !status.data) {
		return (
			<div className="flex flex-col items-start gap-3 p-4" role="alert">
				<div className="flex items-center gap-2">
					<AlertCircleIcon
						className="size-4 text-destructive"
						aria-hidden="true"
					/>
					<span className="font-medium text-sm">
						Unable to load Git changes
					</span>
				</div>
				<Muted>
					{status.error?.message ??
						"The repository status is unavailable."}
				</Muted>
				<Button size="sm" variant="outline" onClick={status.refresh}>
					<RefreshCwIcon className="size-4" aria-hidden="true" />
					Retry
				</Button>
			</div>
		);
	}

	const changes = [...status.data.unstaged, ...status.data.untracked];
	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex items-center gap-2 border-border border-b px-3 py-2">
				<GitBranchIcon
					className="size-4 text-muted-foreground"
					aria-hidden="true"
				/>
				<span className="min-w-0 flex-1 truncate text-sm">
					{status.data.detached
						? "Detached HEAD"
						: status.data.branch || "No branch"}
				</span>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Switch branch"
							onClick={() => setIsSwitchBranchOpen(true)}
						>
							<GitPullRequestArrowIcon
								className="size-4"
								aria-hidden="true"
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Switch branch</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Create branch"
							onClick={() => setIsCreateBranchOpen(true)}
						>
							<GitBranchPlusIcon
								className="size-4"
								aria-hidden="true"
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Create branch</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Refresh Git changes"
							onClick={status.refresh}
						>
							<RefreshCwIcon
								className="size-4"
								aria-hidden="true"
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Refresh Git changes</TooltipContent>
				</Tooltip>
			</div>
			<Accordion
				type="multiple"
				defaultValue={["changes", "history"]}
				className="min-h-0 overflow-y-auto"
			>
				<AccordionItem value="changes">
					<AccordionTrigger className="px-3 py-2 hover:no-underline">
						<span className="flex items-center gap-2">
							<GitMergeIcon
								className="size-4"
								aria-hidden="true"
							/>
							<span className="font-medium text-sm">Changes</span>
						</span>
					</AccordionTrigger>
					<AccordionContent className="pb-1">
						{status.data.clean ? (
							<div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
								<span className="font-medium text-sm">
									No changes
								</span>
								<Muted>The working tree is clean.</Muted>
							</div>
						) : (
							<Accordion
								type="multiple"
								defaultValue={[
									"Merge Conflicts",
									"Staged Changes",
									"Changes",
								]}
							>
								<GitChangeGroup
									label="Merge Conflicts"
									files={status.data.conflicted}
									disabled={isMutating}
									onAction={mutateFile}
									onOpen={openConflict}
								/>
								<GitChangeGroup
									label="Staged Changes"
									files={status.data.staged}
									action="UNSTAGE"
									disabled={isMutating}
									onAction={mutateFile}
									onOpen={(file) => openDiff(file, "STAGED")}
								/>
								<GitChangeGroup
									label="Changes"
									files={changes}
									action="STAGE"
									disabled={isMutating}
									onAction={mutateFile}
									onOpen={(file) =>
										openDiff(file, "UNSTAGED")
									}
								/>
							</Accordion>
						)}
					</AccordionContent>
				</AccordionItem>
				<GitHistoryAccordion projectId={project.project_id} />
			</Accordion>
			<GitCreateBranchDialog
				open={isCreateBranchOpen}
				onSubmit={() => setIsCreateBranchOpen(false)}
			/>
			<GitSwitchBranchDialog
				open={isSwitchBranchOpen}
				onSubmit={() => setIsSwitchBranchOpen(false)}
			/>
		</div>
	);
};

/** Keep-alive project Version Control panel. */
export const PROJECT_VERSION_CONTROL_PANEL: WorkbenchPanelConfig = {
	name: "Version Control",
	helpText: "Version Control",
	icon: ({ className }) => (
		<ProjectVersionControlIcon className={className} />
	),
	canClose: false,
	canRename: false,
	canSplitTab: true,
	mount: "keepAlive",
	content: ProjectVersionControlPanel,
};
