import { SquarePen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@semoss/ui/next";
import type { Workspace } from "@/types";

export interface WorkspaceCardProps {
	workspace: Pick<Workspace, "workspace_id" | "name" | "description">;
	onCardClick?: () => void;
	onMenuClick?: () => void;
}

/**
 * Renders a card representing a workspace
 *
 * @component
 */
export const WorkspaceCard = ({
	onCardClick,
	workspace,
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

	console.log(workspace);

	return (
		<Card onClick={onCardClick}>
			<CardContent className="gap-4">
				<CardHeader>
					<CardTitle>{workspace.name}</CardTitle>
					<CardDescription className="truncate">
						{workspace.description ?? "No description available"}
					</CardDescription>
				</CardHeader>
			</CardContent>

			<hr
				className="w-full"
				style={{ borderTop: "1px solid var(--base-border, #E5E5E5)" }}
			/>

			<CardContent>
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
