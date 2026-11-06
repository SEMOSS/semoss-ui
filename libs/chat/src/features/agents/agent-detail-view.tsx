import {
	MessagesSquareIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { getUserProjectPermission, type Role } from "@semoss/sdk";
import { useSessionPixel } from "@semoss/sdk/react";
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
import { getErrorMessage } from "@semoss/utility/error";
import { useChat } from "../../host/chat.context";
import type { Workspace } from "../../types";
import { getAgentLinks } from "../../utility/mcp-utils";
import { deleteWorkspace } from "./agents.api";
import { WorkspaceChatList } from "./workspace-chat-list";

/** Props for {@link AgentDetailView}. */
export interface AgentDetailViewProps {
	/** The agent to show, by its workspace id. */
	workspaceId: string;
}

/**
 * An agent, read-only: its name with Edit and Delete (for those who may),
 * its recent chats, the shared agent definition the client also shows, and
 * its members. An agent that cannot be read sends the user back to the
 * catalog through the host's navigation.
 *
 * @component
 */
export const AgentDetailView = ({ workspaceId }: AgentDetailViewProps) => {
	const { t } = useTranslation(["workspace", "common"]);

	const { config: chatConfig } = useChat();

	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteModal, setDeleteModal] = useState(false);
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

	const getWorkspace = useSessionPixel<
		AgentWorkspace & Pick<Workspace, "workspace_id">
	>(workspaceId ? `GetWorkspace(workspaceId=["${workspaceId}"]);` : "", {
		onError: (_d, e) => {
			toast.error(
				t("workspace:detail.failedToLoad", {
					error: getErrorMessage(e, "Unknown error"),
				}),
			);
		},
	});

	// an agent that cannot be read sends the user back to the catalog
	const isMissing = getWorkspace.status === "ERROR" || !workspaceId;
	const { onOpenAgents } = chatConfig.navigation;
	useEffect(() => {
		if (isMissing) {
			onOpenAgents();
		}
	}, [isMissing, onOpenAgents]);

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

	if (isMissing) {
		return null;
	}

	const workspace = getWorkspace.data;
	if (!workspace) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	// GetWorkspace returns the instructions with escaped line breaks
	const definition = {
		...workspace,
		system_prompt: (workspace.system_prompt || "").replace(/\\n/g, "\n"),
	};

	return (
		<div className="@container h-full w-full overflow-y-auto">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
				{/* Sticky header so New Chat / Edit / Delete stay reachable while scrolling */}
				<div className="-mx-4 -mt-6 sm:-mx-6 sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-background px-4 py-4 sm:px-6">
					<AppCatalogAvatar
						projectId={workspaceId}
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
											chatConfig.navigation.onEditAgent(
												workspaceId,
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
								chatConfig.navigation.onNewRoom({
									agentId: workspaceId,
								})
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
					<section className="flex min-w-0 flex-col gap-4">
						<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
							<MessagesSquareIcon className="size-5" />
							{t("workspace:detail.recentChats.title")}
						</h2>
						<WorkspaceChatList workspaceId={workspaceId} />
					</section>

					{/* Agent definition, read-only */}
					<section aria-label={t("workspace:detail.about.title")}>
						<AgentDefinition
							workspace={definition}
							{...getAgentLinks({
								platformUrl: chatConfig.platformUrl,
								showPlatformLinks:
									chatConfig.featureFlags.showPlatformLinks,
								getAgentHref:
									chatConfig.navigation.getAgentHref,
							})}
						/>
					</section>

					{/* Members */}
					<section className="flex min-w-0 flex-col gap-3">
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
									await deleteWorkspace(workspaceId);
									chatConfig.navigation.onOpenAgents();
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
};
