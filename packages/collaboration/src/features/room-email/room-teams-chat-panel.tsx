import { MessagesSquare } from "lucide-react";
import { createElement, useEffect, useState } from "react";
import {
	useWorkbenchPanel,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import { getTeamsMessages } from "@/features/connectors/api/microsoft";
import { liveTeamsMessages } from "./load-room-source-emails";
import { useRoomEmail } from "./room-email.context";
import { LIVE_TEAMS_NOTICE, RoomTeamsReader } from "./room-teams-reader";

export const ROOM_TEAMS_CHAT_PANEL_TYPE = "collaboration-teams-chat";

interface RoomTeamsChatPanelConfig {
	/** A Teams chat the assistant found that Brain does not hold, read live. */
	chatId: string;
	title?: string;
	webLink?: string;
}

/** One answer from Teams, kept with the request it answers. */
interface ChatRead {
	key: string;
	messages: WorkspaceMessage[];
	error: string | null;
}

/** Read a Teams chat the assistant found, beside the chat; replying stays in Teams. */
export function RoomTeamsChatPanel({ id }: WorkbenchPanelProps) {
	const { config } = useWorkbenchPanel<RoomTeamsChatPanelConfig>(id);
	const { session } = useRoomEmail();
	const [attempt, setAttempt] = useState(0);
	const [read, setRead] = useState<ChatRead | null>(null);
	const { chatId, title, webLink } = config;
	const { actions } = session.insight;
	const key = `${chatId}:${attempt}`;
	useEffect(() => {
		let isCurrent = true;
		void getTeamsMessages(actions, chatId).then(
			(page) => {
				if (!isCurrent) return;
				setRead(
					page.chatId === chatId
						? {
								key,
								messages: liveTeamsMessages(page, webLink),
								error: null,
							}
						: {
								key,
								messages: [],
								error: "Teams answered for a different chat. Try again.",
							},
				);
			},
			(cause: unknown) => {
				if (isCurrent)
					setRead({
						key,
						messages: [],
						error:
							cause instanceof Error
								? cause.message
								: "This Teams chat could not be loaded.",
					});
			},
		);
		return () => {
			isCurrent = false;
		};
	}, [actions, chatId, key, webLink]);
	const current = read?.key === key ? read : null;
	return (
		<RoomTeamsReader
			title={title ?? ""}
			messages={current?.messages ?? []}
			webLink={webLink}
			isLoading={!current}
			error={current?.error ?? null}
			onRetry={() => setAttempt((value) => value + 1)}
			notice={LIVE_TEAMS_NOTICE}
			emptyText="This chat has no messages you can read here."
		/>
	);
}

const ROOM_TEAMS_CHAT_PANEL: WorkbenchPanelConfig<RoomTeamsChatPanelConfig> = {
	name: "Teams chat",
	icon: ({ className }) =>
		createElement(MessagesSquare, { className, "aria-hidden": true }),
	content: RoomTeamsChatPanel,
	mount: "keepAlive",
	canRename: false,
	matches: (a, b) => a.chatId === b.chatId,
};

/** Register the live Teams chat reader in the room's existing tool and file dock. */
export const ROOM_TEAMS_CHAT_PANEL_COMPONENTS = {
	[ROOM_TEAMS_CHAT_PANEL_TYPE]: ROOM_TEAMS_CHAT_PANEL,
};
