import { Ellipsis, SquarePen } from "lucide-react";
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
import type { Workspace } from "@/types";

export interface WorkspaceCardProps {
	workspace: Pick<Workspace, "workspace_id" | "name" | "description">;
	onEditClick: () => void;
	onDeleteClick: () => void;
}

/**
 * Renders a card representing a workspace
 *
 * @component
 */
export const WorkspaceCard = ({
	onEditClick,
	workspace,
	onDeleteClick,
}: WorkspaceCardProps) => {
	/**
	 * Library Hooks
	 */
	const navigate = useNavigate();

	/**
	 * Functions
	 */
	const createRoom = () =>
		navigate(`/new?workspaceId=${workspace.workspace_id}`);

	return (
		<Card className="gap-0 p-0">
			<CardContent className="flex flex-col gap-4 p-6">
				<div className="flex justify-between">
					<div className="h-10 w-10">🌴</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost">
								<Ellipsis />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								<DropdownMenuItem onClick={onEditClick}>
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem onClick={onDeleteClick}>
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
						{workspace.description ?? "No description available"}
					</CardDescription>
				</CardHeader>
			</CardContent>

			<hr
				className="w-full"
				style={{ borderTop: "1px solid var(--base-border, #E5E5E5)" }}
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
};
