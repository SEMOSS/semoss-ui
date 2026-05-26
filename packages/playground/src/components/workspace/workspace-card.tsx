import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { Workspace } from "@/types";

dayjs.extend(relativeTime);

interface WorkspaceCardProps {
	workspace: Pick<Workspace, "workspace_id" | "name" | "description">;
	onDeleteClick: () => void;
	/**
	 * The viewing user's permission on this workspace. Gates the Edit
	 * (EDIT/OWNER) and Delete (OWNER) buttons, and surfaces as a small
	 * label in the card metadata row. When omitted, both icons render
	 * (backward compatible) and no permission label is shown.
	 */
	permission?: "OWNER" | "EDIT" | "READ_ONLY";
	/**
	 * ISO date string for when the workspace was created. When provided,
	 * shown as a relative time in the metadata row.
	 */
	dateCreated?: string;
}

/**
 * Renders a card representing a workspace
 *
 * @component
 */
export const WorkspaceCard = observer(
	({
		workspace,
		onDeleteClick,
		permission,
		dateCreated,
	}: WorkspaceCardProps) => {
		// When permission is undefined, render both icons (backward compatible).
		// When provided, gate per role.
		const canEdit =
			permission === undefined ||
			permission === "OWNER" ||
			permission === "EDIT";
		const canDelete = permission === undefined || permission === "OWNER";
		/**
		 * Library Hooks
		 */
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
			const d = dayjs(
				dateCreated.endsWith("Z") ? dateCreated : `${dateCreated}Z`,
			);
			if (!d.isValid()) return null;
			return t("workspace:card.createdAgo", { when: d.fromNow() });
		})();

		const hasMetadata = !!permissionLabel || !!createdLabel;

		return (
			<>
				<Card
					className="cursor-pointer gap-0 bg-card p-0"
					onClick={() => {
						navigate(`/agent/${workspace.workspace_id}`);
					}}
				>
					<CardContent className="flex flex-col gap-2 p-6">
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

					<hr
						className="w-full"
						style={{
							borderTop: "1px solid var(--base-border, #E5E5E5)",
						}}
					/>

					<CardContent className="flex flex-nowrap items-center gap-2 rounded-b-xl px-6 py-4 dark:bg-secondary">
						<Button
							size="sm"
							onClick={(e) => {
								e.stopPropagation();
								navigate(
									`/new?workspaceId=${workspace.workspace_id}`,
								);
							}}
							variant="outline"
							className="min-w-0 shrink"
						>
							<PlusIcon className="shrink-0" />
							<span className="truncate">
								{t("workspace:actions.newChat")}
							</span>
						</Button>
						{(canEdit || canDelete) && (
							<div className="-mr-2 ml-auto flex shrink-0 items-center gap-0">
								{canEdit && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												aria-label={t(
													"workspace:actions.edit",
												)}
												onClick={(e) => {
													e.stopPropagation();
													navigate(
														`/agent/${workspace.workspace_id}/edit`,
													);
												}}
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
												variant="ghost"
												size="icon"
												aria-label={t(
													"workspace:actions.delete",
												)}
												onClick={(e) => {
													e.stopPropagation();
													setDeleteModal(true);
												}}
											>
												<Trash2Icon />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{t("workspace:actions.delete")}
										</TooltipContent>
									</Tooltip>
								)}
							</div>
						)}
					</CardContent>
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
