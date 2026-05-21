import { Pencil, SquarePen, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
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
import logoImage from "@/assets/img/logo.svg";
import { useRoot } from "@/hooks";
import type { Workspace } from "@/types";

interface WorkspaceCardProps {
	workspace: Pick<Workspace, "workspace_id" | "name" | "description">;
	onDeleteClick: () => void;
}

/**
 * Renders a card representing a workspace
 *
 * @component
 */
export const WorkspaceCard = observer(
	({ workspace, onDeleteClick }: WorkspaceCardProps) => {
		/**
		 * Library Hooks
		 */
		const navigate = useNavigate();
		const { root } = useRoot();
		const { t } = useTranslation(["workspace", "common"]);

		const [deleteModal, setDeleteModal] = useState(false);

		return (
			<>
				<Card
					className="relative cursor-pointer gap-0 bg-card p-0"
					onClick={() => {
						navigate(`/agent/${workspace.workspace_id}`);
					}}
				>
					<div className="absolute top-2 right-2 z-10 flex items-center gap-0.5">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={(e) => {
										e.stopPropagation();
										navigate(
											`/agent/${workspace.workspace_id}/edit`,
										);
									}}
									aria-label={t("workspace:actions.edit")}
								>
									<Pencil className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{t("workspace:actions.edit")}
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={(e) => {
										e.stopPropagation();
										setDeleteModal(true);
									}}
									aria-label={t("workspace:actions.delete")}
								>
									<Trash2 className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{t("workspace:actions.delete")}
							</TooltipContent>
						</Tooltip>
					</div>
					<CardContent className="flex flex-col gap-4 p-6">
						<div className="text-4xl">
							<img
								className="flex h-10 select-none flex-row items-center dark:brightness-0 dark:invert"
								alt="logo"
								src={root.theme?.images.logo || logoImage}
							/>
						</div>
						<CardHeader className="gap-1.5 p-0">
							<CardTitle className="truncate leading-normal">
								{workspace.name}
							</CardTitle>
							<CardDescription className="truncate">
								{workspace.description ||
									t("workspace:card.noDescription")}
							</CardDescription>
						</CardHeader>
					</CardContent>

					<hr
						className="w-full"
						style={{
							borderTop: "1px solid var(--base-border, #E5E5E5)",
						}}
					/>

					<CardContent className="rounded-b-xl px-6 py-4 dark:bg-secondary">
						<Button
							size="sm"
							onClick={(e) => {
								e.stopPropagation();
								navigate(
									`/new?workspaceId=${workspace.workspace_id}`,
								);
							}}
							variant="outline"
						>
							<SquarePen />
							{t("workspace:actions.newChat")}
						</Button>
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
