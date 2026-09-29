import {
	BlocksIcon,
	BookOpenIcon,
	HammerIcon,
	Maximize2Icon,
	MessagesSquareIcon,
	PencilIcon,
	PlusIcon,
	SparklesIcon,
	Trash2Icon,
	UsersRound,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { getUserProjectPermission, type Role } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import {
	AgentDefinition,
	type AgentWorkspace,
	AppCatalogAvatar,
	MembersTable,
} from "@semoss/shared";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { InstructionsModal } from "@/components/workspace/instructions-modal";
import { WorkspaceChatList } from "@/components/workspace/workspace-chat-list";
import { WorkspaceMCPList } from "@/components/workspace/workspace-mcp-list";
import { WorkspacePromptList } from "@/components/workspace/workspace-prompt-list";
import { WorkspaceSkillList } from "@/components/workspace/workspace-skill-list";
import { useChat } from "@/hooks/use-chat";
import { useRoot } from "@/hooks/use-root";
import type { Workspace } from "@/types";
import { getPlaygroundAgentLinks } from "@/utility/mcp-utils";

/**
 * Renders the Workspace (Agent) Detail Page.
 *
 * Read-only configuration view:
 *   - Header: agent name + Edit / Delete actions (top right)
 *   - About: description (when set) + instructions
 *   - Continue recent chats: scrollable list with a max height
 *   - Resource cards and the shared agent's complete configuration
 *   - Members
 */
export const WorkspaceDetailPage = observer(() => {
	const { t } = useTranslation(["workspace", "common"]);

	const { workspaceId } = useParams<{ workspaceId: string }>();
	const navigate = useNavigate();
	const { chat } = useChat();
	const { root } = useRoot();

	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteModal, setDeleteModal] = useState(false);
	const [instructionsModal, setInstructionsModal] = useState(false);
	const [userPermission, setUserPermission] = useState<Role | null>(null);

	useEffect(() => {
		setUserPermission(null);
		if (!workspaceId) return;
		let cancelled = false;
		(async () => {
			try {
				const permission = await getUserProjectPermission(workspaceId);
				if (!cancelled && permission) {
					setUserPermission(permission);
				}
			} catch {
				// If permission fetch fails, leave as null — Edit/Delete stay hidden
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [workspaceId]);

	const canEdit = userPermission === "EDIT" || userPermission === "OWNER";
	const canDelete = userPermission === "OWNER";

	const getWorkspace = usePixel<
		AgentWorkspace & Pick<Workspace, "workspace_id">
	>(workspaceId ? `GetWorkspace(workspaceId=["${workspaceId}"]);` : "", {
		onError: (_d, e) => {
			toast.error(
				t("workspace:detail.failedToLoad", {
					error: e instanceof Error ? e.message : "Unknown error",
				}),
			);
		},
	});

	if (
		getWorkspace.status === "LOADING" ||
		(getWorkspace.status === "SUCCESS" && !getWorkspace.data)
	) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (getWorkspace.status === "ERROR" || !workspaceId) {
		return <Navigate to="/agent" />;
	}

	const workspace = getWorkspace.data;
	if (!workspace) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	const instructions = (workspace.system_prompt || "").replace(/\\n/g, "\n");
	const hasDescription = !!workspace.description?.trim();
	const hasInstructions = !!instructions.trim();

	return (
		<div className="@container h-full w-full overflow-y-auto">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
				{/* Sticky header so New Chat / Edit / Delete stay reachable while scrolling */}
				<div className="-mx-4 -mt-6 sm:-mx-6 sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-background px-4 py-4 sm:px-6">
					<AppCatalogAvatar
						name={workspace.name}
						className="size-10 shrink-0 rounded-md text-base"
					/>
					<div className="min-w-0 flex-1">
						<div className="break-words font-semibold text-2xl text-foreground leading-tight">
							{workspace.name}
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						{canEdit && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										aria-label={t("workspace:actions.edit")}
										onClick={() =>
											navigate(
												`/agent/${workspaceId}/edit`,
											)
										}
										data-testid="workspace-detail-page--edit-btn"
									>
										<PencilIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{t("workspace:actions.edit")}
								</TooltipContent>
							</Tooltip>
						)}
						{canDelete && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										aria-label={t(
											"workspace:actions.delete",
										)}
										onClick={() => setDeleteModal(true)}
										data-testid="workspace-detail-page--delete-btn"
									>
										<Trash2Icon />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{t("workspace:actions.delete")}
								</TooltipContent>
							</Tooltip>
						)}
						<Button
							onClick={() =>
								navigate(`/new?workspaceId=${workspaceId}`)
							}
							data-testid="workspace-detail-page--new-chat-btn"
						>
							<PlusIcon />
							{t("workspace:actions.newChat")}
						</Button>
					</div>
				</div>

				{/* Body — flows naturally; outer container scrolls */}
				<div className="flex flex-col gap-8">
					{/* Recent chats — timeline grouped by day */}
					<section className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<MessagesSquareIcon className="size-5" />
							{t("workspace:detail.recentChats.title")}
						</h2>
						<WorkspaceChatList workspaceId={workspaceId} />
					</section>

					<AgentDefinition
						workspace={workspace}
						variant="cards"
						className="gap-8"
						{...getPlaygroundAgentLinks(
							root.theme.featureFlags?.showPlatformLinks,
						)}
						aboutContent={
							<>
								{hasDescription ? (
									<div className="flex flex-col gap-1">
										<div className="text-muted-foreground text-xs uppercase tracking-wide">
											{t(
												"workspace:form.descriptionLabel",
											)}
										</div>
										<div className="text-foreground text-sm">
											{workspace.description}
										</div>
									</div>
								) : null}
								<div className="flex flex-col gap-1">
									<div className="flex items-center justify-between">
										<div className="text-muted-foreground text-xs uppercase tracking-wide">
											{t(
												"workspace:form.instructionsLabel",
											)}
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() =>
												setInstructionsModal(true)
											}
											data-testid="workspace-detail-page--expand-instructions-btn"
										>
											<Maximize2Icon />
											{t("workspace:instructions.expand")}
										</Button>
									</div>
									{hasInstructions ? (
										<div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-foreground text-sm leading-relaxed">
											{instructions}
										</div>
									) : (
										<div className="rounded-md border border-border border-dashed bg-muted/20 p-3 text-muted-foreground text-sm italic">
											{t(
												"workspace:detail.about.noInstructions",
											)}
										</div>
									)}
								</div>
							</>
						}
						sectionOverrides={{
							knowledge: (
								<section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
									<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
										<BookOpenIcon className="size-5" />
										{t("workspace:detail.tabs.knowledge")}
									</h2>
									<div className="min-h-32">
										<WorkspaceMCPList
											type="KNOWLEDGE"
											workspaceId={workspaceId}
											search=""
										/>
									</div>
								</section>
							),
							toolboxes: (
								<section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
									<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
										<HammerIcon className="size-5" />
										{t("workspace:detail.tabs.toolbox")}
									</h2>
									<div className="min-h-32">
										<WorkspaceMCPList
											type="TOOLBOX"
											workspaceId={workspaceId}
											search=""
										/>
									</div>
								</section>
							),
							skills: (
								<section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
									<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
										<BlocksIcon className="size-5" />
										{t("workspace:detail.tabs.skills")}
									</h2>
									<div className="min-h-32">
										<WorkspaceSkillList
											skills={workspace.skills ?? []}
										/>
									</div>
								</section>
							),
							prompts: (
								<section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
									<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
										<SparklesIcon className="size-5" />
										{t("workspace:detail.tabs.prompts")}
									</h2>
									<div className="min-h-32">
										<WorkspacePromptList
											promptIds={(
												workspace.prompts ?? []
											).map((prompt) => prompt.id)}
										/>
									</div>
								</section>
							),
						}}
					/>

					{/* Members */}
					<section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<UsersRound className="size-5" />
							{t("workspace:detail.tabs.members")}
						</h2>
						<div className="min-h-32">
							<MembersTable
								id={workspaceId}
								type="WORKSPACE"
								readOnly
							/>
						</div>
					</section>
				</div>
			</div>

			{/* Instructions modal (read-only) */}
			<InstructionsModal
				open={instructionsModal}
				onOpenChange={setInstructionsModal}
				value={instructions}
				readOnly
			/>

			{/* Delete confirmation */}
			<Dialog open={deleteModal} onOpenChange={setDeleteModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("workspace:card.deleteConfirmTitle")}
						</DialogTitle>
						<DialogDescription>
							{t("workspace:card.deleteConfirmDescription", {
								name: workspace.name,
							})}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={(e) => {
								e.stopPropagation();
								setDeleteModal(false);
							}}
							data-testid="workspace-detail-page--cancel-delete-btn"
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button
							variant="destructive"
							data-testid="workspace-detail-page--confirm-delete-btn"
							disabled={isDeleting}
							onClick={async (e) => {
								e.stopPropagation();
								setIsDeleting(true);
								try {
									await chat.deleteWorkspace(workspaceId);
									navigate("/agent");
								} catch (err) {
									toast.error(
										err instanceof Error
											? err.message
											: t(
													"workspace:detail.failedToDelete",
												),
									);
								} finally {
									setIsDeleting(false);
								}
							}}
						>
							{t("workspace:actions.delete")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
});
