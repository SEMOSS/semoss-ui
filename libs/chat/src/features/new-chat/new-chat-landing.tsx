import type { ReactNode } from "react";
import { DropHighlight } from "../conversation/drop-highlight";
import { RoomGreeting } from "../conversation/messages/room-greeting";
import type { RoomStore } from "../room/store/room.store";

/** Props for {@link NewChatLanding}. */
interface NewChatLandingProps {
	/** What fills the space behind the landing, such as a `NewChatBackdrop`. */
	backdrop: ReactNode;
	/** The welcome above the composer, such as a `NewChatWelcome`. */
	welcome: ReactNode;
	/** An agent link's scripted greeting, shown while its room starts; empty for none. */
	greeting: string;
	/** The room the greeting renders for. */
	room: RoomStore;
	/** The composer and what goes with it, below the welcome. */
	children: ReactNode;
}

/**
 * A new chat's landing: the host's backdrop and welcome, and an agent's
 * greeting, over the composer. Files dropped anywhere on it attach to the
 * draft.
 */
export const NewChatLanding = ({
	backdrop,
	welcome,
	greeting,
	room,
	children,
}: NewChatLandingProps) => (
	<>
		{backdrop}
		<DropHighlight className="flex h-full flex-col items-center overflow-auto px-4 py-8 sm:px-6">
			<div className="relative z-10 mx-auto my-auto flex w-full max-w-3xl flex-col gap-6 py-6">
				{welcome}
				{greeting && <RoomGreeting room={room} greeting={greeting} />}
				{children}
			</div>
		</DropHighlight>
	</>
);
