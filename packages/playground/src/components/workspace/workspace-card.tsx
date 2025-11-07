import { ArrowRight, TrashIcon } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { Workspace } from "@/types";

export interface WorkspaceCardProps {
	workspace: Pick<Workspace, "workspace_id" | "name" | "description"> | null;
	onPrimaryClick?: () => void;
	onSecondaryClick?: () => void;
	onDeleteClick?: () => void;
}

/**
 * Renders a card representing a workspace
 *
 * @component
 */
export const WorkspaceCard = ({
	onPrimaryClick,
	onSecondaryClick,
	onDeleteClick,
	workspace,
}: WorkspaceCardProps) => {
	/**
	 * Constants
	 */
	const isWorkspaceValid = workspace !== null;

	return (
		<button
			type="button"
			onClick={onPrimaryClick}
			className="group/card relative flex w-full items-start gap-3 rounded-lg border p-3 hover:bg-accent/50"
		>
			{/* Trash button in top right */}
			{onDeleteClick && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="absolute top-2 right-2 hidden group-hover/card:inline-flex"
							variant="ghost"
							size="icon-sm"
							onClick={(e) => {
								e.stopPropagation();
								onDeleteClick();
							}}
						>
							<TrashIcon className="text-destructive" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Delete Workspace</TooltipContent>
				</Tooltip>
			)}

			<div className="grid flex-1 gap-1.5 font-normal">
				<p className="font-medium text-sm leading-none">
					{isWorkspaceValid ? workspace.name : "Unknown Workspace"}
				</p>
				<p className="min-h-8 text-muted-foreground text-sm">
					{isWorkspaceValid
						? workspace.description
						: "No description available"}
				</p>
				<Button
					onClick={
						onSecondaryClick
							? (e) => {
									e.stopPropagation();
									onSecondaryClick?.();
								}
							: onPrimaryClick
					}
					size="sm"
					variant="secondary"
					disabled={!isWorkspaceValid}
				>
					View Details
					<ArrowRight />
				</Button>
			</div>
		</button>
	);
};
