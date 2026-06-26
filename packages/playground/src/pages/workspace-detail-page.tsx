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
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	AppCatalogAvatar,
	getUserProjectPermission,
	MembersTable,
	type Role,
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
import {
	InstructionsModal,
	WorkspaceChatList,
	WorkspaceMCPList,
	WorkspacePromptList,
	WorkspaceSkillList,
} from "@/components";
import { useGlobalBreadcrumbs } from "@/hooks";
import { useChat } from "@/hooks/use-chat";
import type { Workspace } from "@/types";

/**
 * Renders the Workspace (Agent) Detail Page.
 *
 * Read-only configuration view:
 *   - Header: agent name + Edit / Delete actions (top right)
 *   - About: description (when set) + instructions
 *   - Continue recent chats: scrollable list with a max height
 *   - Tabs: Knowledge / Toolboxes / Prompts / Members
 */
export const WorkspaceDetailPage = observer(() => {
	const { t } = useTranslation(["workspace", "common"]);

	const { workspaceId } = useParams<{ workspaceId: string }>();
	const navigate = useNavigate();
	const { chat } = useChat();

	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteModal, setDeleteModal] = useState(false);
	const [instructionsModal, setInstructionsModal] = useState(false);
	const [userPermission, setUserPermission] = useState<Role | null>(null);

	useEffect(() => {
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

	const getWorkspace = usePixel<Workspace>(
		workspaceId ? `GetWorkspace(workspaceId=["${workspaceId}"]);` : "",
		{
			onError: (_d, e) => {
				toast.error(
					t("workspace:detail.failedToLoad", {
						error: e instanceof Error ? e.message : "Unknown error",
					}),
				);
			},
		},
	);

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{ name: t("workspace:breadcrumbs.home"), path: "/" },
			{ name: t("workspace:breadcrumbs.agent"), path: "/agent" },
			{
				name:
					getWorkspace.status === "SUCCESS"
						? getWorkspace.data.name
						: t("workspace:breadcrumbs.loading"),
				path: `/agent/${workspaceId}`,
			},
		],
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
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 @3xl:px-12 @md:px-6 px-4 pt-8 pb-4">
				{/* Sticky header so New Chat / Edit / Delete stay reachable while scrolling */}
				<div className="-mx-4 -mt-8 @md:-mx-6 @3xl:-mx-12 sticky top-0 z-20 flex flex-row items-center gap-3 border-border border-b bg-background/95 @3xl:px-12 @md:px-6 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
					<AppCatalogAvatar
						name={workspace.name}
						className="size-10 shrink-0 rounded-md text-base"
					/>
					<div className="min-w-0 flex-1">
						<div className="truncate font-semibold text-2xl text-foreground leading-tight">
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
					<section className="flex flex-col gap-4">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<MessagesSquareIcon className="size-5" />
							{t("workspace:detail.recentChats.title")}
						</h2>
						<WorkspaceChatList workspaceId={workspaceId} />
					</section>

					{/* About */}
					<section className="flex flex-col gap-4">
						<h2 className="font-semibold text-foreground text-lg">
							{t("workspace:detail.about.title")}
						</h2>
						{hasDescription ? (
							<div className="flex flex-col gap-1">
								<div className="text-muted-foreground text-xs uppercase tracking-wide">
									{t("workspace:form.descriptionLabel")}
								</div>
								<div className="text-foreground text-sm">
									{workspace.description}
								</div>
							</div>
						) : null}
						<div className="flex flex-col gap-1">
							<div className="flex items-center justify-between">
								<div className="text-muted-foreground text-xs uppercase tracking-wide">
									{t("workspace:form.instructionsLabel")}
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setInstructionsModal(true)}
									data-testid="workspace-detail-page--expand-instructions-btn"
								>
									<Maximize2Icon />
									{t("workspace:instructions.expand")}
								</Button>
							</div>
							{hasInstructions ? (
								<div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 font-mono text-foreground text-xs">
									{instructions}
								</div>
							) : (
								<div className="rounded-md border border-border border-dashed bg-muted/20 p-3 text-muted-foreground text-sm italic">
									{t("workspace:detail.about.noInstructions")}
								</div>
							)}
						</div>
					</section>

					{/* Knowledge */}
					<section className="flex flex-col gap-3">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<BookOpenIcon className="size-5" />
							{t("workspace:detail.tabs.knowledge")}
						</h2>
						<div className="min-h-32 rounded-xl border border-border bg-card">
							<WorkspaceMCPList
								type="KNOWLEDGE"
								workspaceId={workspaceId}
								search=""
							/>
						</div>
					</section>

					{/* Toolboxes */}
					<section className="flex flex-col gap-3">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<HammerIcon className="size-5" />
							{t("workspace:detail.tabs.toolbox")}
						</h2>
						<div className="min-h-32 rounded-xl border border-border bg-card">
							<WorkspaceMCPList
								type="TOOLBOX"
								workspaceId={workspaceId}
								search=""
							/>
						</div>
					</section>

					{/* Skills */}
					<section className="flex flex-col gap-3">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<BlocksIcon className="size-5" />
							{t("workspace:detail.tabs.skills")}
						</h2>
						<div className="min-h-32 rounded-xl border border-border bg-card">
							<WorkspaceSkillList
								skills={workspace.skills ?? []}
							/>
						</div>
					</section>

					{/* Prompts */}
					<section className="flex flex-col gap-3">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<SparklesIcon className="size-5" />
							{t("workspace:detail.tabs.prompts")}
						</h2>
						<div className="min-h-32 rounded-xl border border-border bg-card">
							<WorkspacePromptList
								promptIds={workspace.prompts ?? []}
							/>
						</div>
					</section>

					{/* Members */}
					<section className="flex flex-col gap-3">
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
