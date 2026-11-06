import type { ComponentProps } from "react";
import { useChat } from "../host/chat.context";

/** Props for {@link RoomLink}. */
export interface RoomLinkProps
	extends Omit<ComponentProps<"a">, "href" | "onClick"> {
	/** The room the link shows. */
	roomId: string;
}

/**
 * A link to a room at the host's address for it. A plain click navigates
 * through the host; a modified one (a new tab, a new window) is the
 * browser's, so it works as any link does.
 *
 * @component
 */
export const RoomLink = ({ roomId, ...props }: RoomLinkProps) => {
	const { config } = useChat();
	return (
		<a
			{...props}
			href={config.navigation.getRoomHref(roomId)}
			onClick={(e) => {
				if (
					e.button !== 0 ||
					e.metaKey ||
					e.ctrlKey ||
					e.shiftKey ||
					e.altKey
				) {
					return;
				}
				e.preventDefault();
				config.navigation.onOpenRoom(roomId);
			}}
		/>
	);
};
