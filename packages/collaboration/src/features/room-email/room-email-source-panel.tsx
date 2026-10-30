import { Mail } from "lucide-react";
import { createElement, useEffect } from "react";
import { P } from "@semoss/ui/next";
import {
	useWorkbenchPanel,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useRoomEmail } from "./room-email.context";
import { RoomEmailReader, shownEmail } from "./room-email-reader";

export const ROOM_EMAIL_SOURCE_PANEL_TYPE = "collaboration-email-source";

interface RoomEmailSourcePanelConfig {
	/** Selection is a provider email UID within the room's imported allowlist. */
	messageId?: string;
}

/** Read an imported email and start a reply through its owning room. */
export function RoomEmailSourcePanel({ id }: WorkbenchPanelProps) {
	const { config, setConfig } =
		useWorkbenchPanel<RoomEmailSourcePanelConfig>(id);
	const {
		source,
		sourceMessages,
		isSourceLoading,
		sourceError,
		reloadSource,
		replyToSource,
		selectSourceMessage,
	} = useRoomEmail();
	const profile = useOptionalCollaborationSession()?.state.liveProfile;
	const allowedIds = new Set(source?.messages.map((message) => message.id));
	const messages = sourceMessages.filter(
		(message) =>
			source?.channel === "email" &&
			allowedIds.has(message.id) &&
			!message.excluded,
	);
	const message = shownEmail(messages, config.messageId, profile);
	const messageId = message?.id;
	useEffect(() => {
		if (messageId) selectSourceMessage(messageId);
	}, [messageId, selectSourceMessage]);
	if (source?.channel !== "email")
		return <P className="p-4">This room does not have a source email.</P>;
	return (
		<RoomEmailReader
			label="Source email"
			source={source}
			messages={messages}
			message={message}
			onSelect={(messageId) => setConfig({ messageId })}
			isLoading={isSourceLoading}
			error={sourceError}
			onRetry={reloadSource}
			emptyText="No included email is available in this room."
			onReply={replyToSource}
		/>
	);
}

const ROOM_EMAIL_SOURCE_PANEL: WorkbenchPanelConfig<RoomEmailSourcePanelConfig> =
	{
		name: "Email",
		icon: ({ className }) =>
			createElement(Mail, { className, "aria-hidden": true }),
		content: RoomEmailSourcePanel,
		mount: "keepAlive",
		canRename: false,
		canSplitTab: false,
		matches: () => true,
	};

/** Register the source reader in the room's existing tool and file dock. */
export const ROOM_EMAIL_SOURCE_PANEL_COMPONENTS = {
	[ROOM_EMAIL_SOURCE_PANEL_TYPE]: ROOM_EMAIL_SOURCE_PANEL,
};
