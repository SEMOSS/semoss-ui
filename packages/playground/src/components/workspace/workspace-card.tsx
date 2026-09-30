import { EllipsisIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { AppCatalogAvatar } from "@semoss/shared";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import type { Workspace } from "@/types";
import { normalizeTimestamp } from "@/utility";

/** Props for {@link WorkspaceCard}. */
export interface WorkspaceCardProps {
	/** The agent the card shows. */
	workspace: Pick<Workspace, "workspace_id" | "name" | "description">;
	/** Delete the agent, once the user confirms. */
	onDeleteClick: () => void;
	/**
	 * The viewing user's permission on this workspace. Gates Edit (EDIT/OWNER)
	 * and Delete (OWNER) in the card's menu, and surfaces as a small label in
	 * the card metadata row. When omitted, both actions show and no permission
	 * label is shown.
	 */
	permission?: "OWNER" | "EDIT" | "READ_ONLY";
	/**
	 * ISO date string for when the workspace was created. When provided,
	 * shown as a relative time in the metadata row.
	 */
	dateCreated?: string;
}

/**
 * A card for one agent: its name, description, and the user's access, with
 * New Chat as its action and Edit and Delete, as the user's access allows, in
 * its menu. Clicking the card opens the agent.
 */
export const WorkspaceCard = observer(
	({
		workspace,
		onDeleteClick,
		permission,
		dateCreated,
	}: WorkspaceCardProps) => {
		// When permission is undefined, show both actions (backward compatible).
		// When provided, gate per role.
		const canEdit =
			permission === undefined ||
			permission === "OWNER" ||
			permission === "EDIT";
		const canDelete = permission === undefined || permission === "OWNER";

		const navigate = useNavigate();
		const { t } = useTranslation(["workspace", "common"]);

		const [deleteModal, setDeleteModal] = useState(false);

		const permissionLabel = permission
			? permission === "OWNER"
				? t("workspace:members.owner")
				: permission === "EDIT"
					? t("workspace:members.editor")
					: t("workspace:members.readOnly")
			: null;

		const createdLabel = (() => {
			if (!dateCreated) return null;
			const d = normalizeTimestamp(dateCreated);
			if (!d.isValid()) return null;
			return t("workspace:card.createdAgo", { when: d.fromNow() });
		})();

		const hasMetadata = !!permissionLabel || !!createdLabel;

		return (
			<>
				<Card
					className="cursor-pointer gap-0 bg-card p-0"
					onClick={() => navigate(`/agent/${workspace.workspace_id}`)}
				>
					<CardContent className="flex flex-1 flex-col gap-2 p-6">
						<div className="flex min-w-0 items-center gap-3">
							<AppCatalogAvatar
								name={workspace.name}
								className="size-9 shrink-0 rounded-md text-base"
							/>
							<CardTitle className="line-clamp-2 min-w-0 flex-1 leading-normal">
								{workspace.name}
							</CardTitle>
						</div>
						{workspace.description && (
							<CardDescription className="line-clamp-2">
								{workspace.description}
							</CardDescription>
						)}
						{hasMetadata && (
							<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs">
								{permissionLabel && (
									<span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 font-medium">
										{permissionLabel}
									</span>
								)}
								{createdLabel && <span>{createdLabel}</span>}
							</div>
						)}
					</CardContent>

					<div className="flex flex-nowrap items-center gap-2 rounded-b-xl border-border border-t px-6 py-4 dark:bg-secondary">
						<Button
							size="sm"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								navigate(
									`/new?workspaceId=${workspace.workspace_id}`,
								);
							}}
							className="min-w-0 shrink"
						>
							<PlusIcon className="shrink-0" />
							<span className="truncate">
								{t("workspace:actions.newChat")}
							</span>
						</Button>
						{(canEdit || canDelete) && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										className="-me-2 ms-auto shrink-0"
										aria-label={t(
											"workspace:actions.moreActions",
											{ name: workspace.name },
										)}
										onClick={(e) => e.stopPropagation()}
									>
										<EllipsisIcon />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									onClick={(e) => e.stopPropagation()}
								>
									{canEdit && (
										<DropdownMenuItem
											onSelect={() =>
												navigate(
													`/agent/${workspace.workspace_id}/edit`,
												)
											}
										>
											<PencilIcon />
											{t("workspace:actions.edit")}
										</DropdownMenuItem>
									)}
									{canDelete && (
										<DropdownMenuItem
											variant="destructive"
											onSelect={() =>
												setDeleteModal(true)
											}
										>
											<Trash2Icon />
											{t("workspace:actions.delete")}
										</DropdownMenuItem>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</Card>
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
								data-testid={`workspace-card--cancel-delete-btn`}
							>
								{t("common:buttons.cancel")}
							</Button>
							<Button
								variant="destructive"
								data-testid={`workspace-card--confirm-delete-btn`}
								onClick={(e) => {
									e.stopPropagation();
									setDeleteModal(false);
									onDeleteClick();
								}}
							>
								{t("workspace:actions.delete")}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</>
		);
	},
);
