import { AppCatalogAvatar } from "@semoss/shared";
import { cn } from "@semoss/ui/next";

/** Props for {@link RoomAgentAvatar}. */
export interface RoomAgentAvatarProps {
	/** The agent (workspace) the room runs; none leaves the space blank. */
	workspaceId?: string | null;
	workspaceName?: string | null;
	/** Sizing; defaults to a 20px square. */
	className?: string;
}

/**
 * The icon of the agent a room was started with, as its catalog card shows it.
 * A room with no agent gets an empty square of the same size, so names line up.
 */
export const RoomAgentAvatar = ({
	workspaceId,
	workspaceName,
	className,
}: RoomAgentAvatarProps) => {
	if (!workspaceId) {
		return (
			<span
				aria-hidden="true"
				className={cn("size-5 shrink-0", className)}
			/>
		);
	}
	return (
		<AppCatalogAvatar
			projectId={workspaceId}
			name={workspaceName ?? ""}
			className={cn("size-5 shrink-0 rounded-sm text-xs", className)}
		/>
	);
};
