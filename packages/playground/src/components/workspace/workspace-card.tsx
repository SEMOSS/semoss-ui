import { ArrowRight } from "lucide-react";
import { Button } from "@semoss/ui/next";
import type { Workspace } from "@/types";

export interface WorkspaceCardProps {
	workspace: Workspace;
	onPrimaryClick?: () => void;
	onSecondaryClick?: () => void;
}

/**
 * Renders a card representing a workspace
 *
 * @component
 */
export const WorkspaceCard = ({
	onPrimaryClick,
	onSecondaryClick,
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
			className="flex w-full items-start gap-3 rounded-lg border p-3 hover:bg-accent/50"
		>
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
