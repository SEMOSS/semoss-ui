import { Ellipsis, SquarePen } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
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

		const [deleteModal, setDeleteModal] = useState(false);

		return (
			<>
				<Card
					className="cursor-pointer gap-0 bg-background p-0"
					onClick={() => {
						navigate(`/agent/${workspace.workspace_id}`);
					}}
				>
					<CardContent className="flex flex-col gap-4 p-6">
						<div className="flex justify-between">
							<div className="text-4xl">
								<img
									className="flex h-10 select-none flex-row items-center"
									alt="logo"
									src={root.theme?.images.logo || logoImage}
								/>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										onClick={(e) => e.stopPropagation()}
									>
										<Ellipsis />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuGroup>
										<DropdownMenuItem
											onClick={(e) => {
												e.stopPropagation();
											}}
											asChild
										>
											<Link
												to={`/agent/${workspace.workspace_id}/edit`}
											>
												Edit
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={(e) => {
												e.stopPropagation();
												setDeleteModal(true);
											}}
										>
											Delete
										</DropdownMenuItem>
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<CardHeader className="gap-1.5 p-0">
							<CardTitle className="truncate leading-normal">
								{workspace.name}
							</CardTitle>
							<CardDescription className="truncate">
								{workspace.description ??
									"No description available"}
							</CardDescription>
						</CardHeader>
					</CardContent>

					<hr
						className="w-full"
						style={{
							borderTop: "1px solid var(--base-border, #E5E5E5)",
						}}
					/>

					<CardContent className="px-6 py-4">
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
							New Chat
						</Button>
					</CardContent>
				</Card>
				<Dialog open={deleteModal} onOpenChange={setDeleteModal}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Are you sure?</DialogTitle>
							<DialogDescription>
								This action is irreversable. This will
								permanentely delete the {workspace.name}{" "}
								workspace.
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
								Cancel
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
								Delete
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</>
		);
	},
);
