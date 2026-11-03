import { Lock } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { AgentRunRoomClosure } from "@/api/agent-runs";
import { CloseAgentRoomDialog } from "./close-agent-room-dialog";

export interface CloseAgentRoomActionProps {
	/** The room to close */
	roomId: string;
	/** The room's name, or its id when it has none */
	roomLabel: string;
	/** Who the room belongs to when it is someone else's; null when it is the signed in user's own */
	ownerLabel: string | null;
	/** Whether the room is already closed */
	isClosed: boolean;
	/** Closes the room, returning what it closed and stopped */
	onConfirm: () => Promise<AgentRunRoomClosure>;
	/** Called once closing ran, with what it closed and stopped */
	onClosed: (closure: AgentRunRoomClosure) => void;
}

/**
 * A room view's Close Room button and its confirmation. Once the room is closed
 * the button stays focusable, so its tooltip can say why it does nothing.
 */
export const CloseAgentRoomAction = ({
	roomId,
	roomLabel,
	ownerLabel,
	isClosed,
	onConfirm,
	onClosed,
}: CloseAgentRoomActionProps) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const handleDialogClose = (closure?: AgentRunRoomClosure) => {
		setIsDialogOpen(false);
		if (closure) {
			onClosed(closure);
		}
	};

	return (
		<>
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<Button
						type="button"
						variant="destructive"
						size="sm"
						aria-disabled={isClosed}
						className={
							isClosed
								? "cursor-not-allowed opacity-50"
								: undefined
						}
						onClick={() => {
							if (!isClosed) {
								setIsDialogOpen(true);
							}
						}}
						data-testid="closeAgentRoomAction-close-btn"
					>
						<Lock className="size-4" aria-hidden="true" />
						Close Room
					</Button>
				</TooltipTrigger>
				<TooltipContent sideOffset={4} className="max-w-xs break-words">
					{isClosed
						? "This room is closed"
						: ownerLabel
							? "Stop its runs and close it for its user"
							: "Stop its runs and close it"}
				</TooltipContent>
			</Tooltip>
			<CloseAgentRoomDialog
				open={isDialogOpen}
				roomId={roomId}
				roomLabel={roomLabel}
				ownerLabel={ownerLabel}
				onConfirm={onConfirm}
				onClose={handleDialogClose}
			/>
		</>
	);
};
