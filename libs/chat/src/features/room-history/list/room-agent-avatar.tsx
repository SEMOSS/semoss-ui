import { AppCatalogAvatar } from "@semoss/shared";

/** Props for {@link RoomAgentAvatar}. */
export interface RoomAgentAvatarProps {
	/** The agent (workspace) the room runs; none leaves the space blank. */
	workspaceId?: string | null;
	/** That agent's name, for the avatar's fallback initials. */
	workspaceName?: string | null;
}

/**
 * The icon of the agent a room was started with, as its catalog card shows it.
 * A room with no agent gets an empty square of the same size, so names line up.
 */
export const RoomAgentAvatar = ({
	workspaceId,
	workspaceName,
}: RoomAgentAvatarProps) => {
	if (!workspaceId) {
		return <span aria-hidden="true" className="size-5 shrink-0" />;
	}
	return (
		<AppCatalogAvatar
			projectId={workspaceId}
			name={workspaceName ?? ""}
			className="size-5 shrink-0 rounded-sm text-xs"
		/>
	);
};
