import { Ellipsis, SquarePen } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import { useRoot } from "@/hooks";
import type { Workspace } from "@/types";

interface WorkspaceCardProps {
	workspace: Pick<Workspace, "workspace_id" | "name" | "description">;
	onEditClick: () => void;
	onDeleteClick: () => void;
}

/**
 * Renders a card representing a workspace
 *
 * @component
 */
export const WorkspaceCard = observer(
	({ onEditClick, workspace, onDeleteClick }: WorkspaceCardProps) => {
		/**
		 * Library Hooks
		 */
		const navigate = useNavigate();
		const { root } = useRoot();

		/**
		 * Functions
		 */
		const createRoom = () => {
			navigate(`/new?workspaceId=${workspace.workspace_id}`);
		};

		/**
		 * View Workspace Details
		 */
		const viewDetails = () => {
			navigate(`/workspace/${workspace.workspace_id}`);
		};
		return (
			<Card
				className="cursor-pointer gap-0 bg-background p-0"
				onClick={() => viewDetails()}
			>
				<CardContent className="flex flex-col gap-4 p-6">
					<div className="flex justify-between">
						<div className="text-4xl">
							{root.theme?.images.logo ? (
								<img
									className="flex h-10 select-none flex-row items-center"
									alt="logo"
									src={root.theme?.images.logo}
								/>
							) : null}
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
											onEditClick();
										}}
									>
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={(e) => {
											e.stopPropagation();
											onDeleteClick();
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
							createRoom();
						}}
						variant="outline"
					>
						<SquarePen />
						New Chat
					</Button>
				</CardContent>
			</Card>
		);
	},
);
