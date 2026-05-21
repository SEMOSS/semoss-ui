import { PencilIcon, SquarePen, Trash2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
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
					className="cursor-pointer gap-0 bg-card p-0"
					onClick={() => {
						navigate(`/agent/${workspace.workspace_id}`);
					}}
				>
					<CardContent className="flex flex-col gap-2 p-6">
						<div className="flex min-w-0 items-center gap-3">
							<img
								className="size-8 shrink-0 select-none dark:brightness-0 dark:invert"
								alt="logo"
								src={root.theme?.images.logo || logoImage}
							/>
							<CardTitle className="line-clamp-2 min-w-0 flex-1 leading-normal">
								{workspace.name}
							</CardTitle>
						</div>
						<CardDescription className="truncate">
							{workspace.description ||
								t("workspace:card.noDescription")}
						</CardDescription>
					</CardContent>

					<hr
						className="w-full"
						style={{
							borderTop: "1px solid var(--base-border, #E5E5E5)",
						}}
					/>

					<CardContent className="flex flex-wrap items-center gap-2 rounded-b-xl px-6 py-4 dark:bg-secondary">
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
						<div className="ml-auto flex items-center gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										aria-label={t("workspace:actions.edit")}
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
						</div>
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
