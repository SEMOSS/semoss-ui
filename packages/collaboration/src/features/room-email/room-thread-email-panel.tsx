import { Mail } from "lucide-react";
import { createElement, useEffect, useState } from "react";
import {
	useWorkbenchPanel,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { readThreadMessagesPage } from "@/features/collaboration/live/live-state";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useRoomEmail } from "./room-email.context";
import { RoomEmailReader, shownEmail } from "./room-email-reader";
import { RoomTeamsReader } from "./room-teams-reader";

export const ROOM_THREAD_EMAIL_PANEL_TYPE = "collaboration-thread-email";

interface RoomThreadEmailPanelConfig {
	/** A Brain thread the assistant read in this room; the room need not be about it. */
	threadId: string;
	/** The email asked for, or the owner's pick among the thread's emails. */
	messageId?: string;
	/** Known before the read when the opener had it, so a Teams chat loads as one. */
	source?: "email" | "teams";
}

/** One answer from the server, kept with the request it answers. */
interface ThreadRead {
	key: string;
	source?: string;
	messages: WorkspaceMessage[];
	/** Emails the owner's rules hide, and emails gone from the mailbox. */
	hiddenCount: number;
	unavailableCount: number;
	error: string | null;
}

/** Why a thread shows nothing when nothing failed. */
function emptyText(read: ThreadRead | null): string {
	if (read?.unavailableCount)
		return "This thread's messages were deleted or moved.";
	if (read?.hiddenCount)
		return "Your Brain rules hide this thread's messages.";
	return "No included message is available in this thread.";
}

/** Read a thread the assistant read, beside the chat; replying stays with the assistant. */
export function RoomThreadEmailPanel({ id }: WorkbenchPanelProps) {
	const { config, setConfig, rename } =
		useWorkbenchPanel<RoomThreadEmailPanelConfig>(id);
	const { session } = useRoomEmail();
	const profile = useOptionalCollaborationSession()?.state.liveProfile;
	const [attempt, setAttempt] = useState(0);
	const [read, setRead] = useState<ThreadRead | null>(null);
	const { threadId } = config;
	const { actions } = session.insight;
	const key = `${threadId}:${attempt}`;
	useEffect(() => {
		let isCurrent = true;
		// the same Brain read as the assistant's, so its never-ingest rules apply here too
		void readThreadMessagesPage(actions, threadId).then(
			(page) => {
				if (isCurrent)
					setRead({
						key,
						source: page.source,
						messages: page.messages.filter(
							(message) => !message.excluded,
						),
						hiddenCount: page.hiddenCount,
						unavailableCount: page.unavailableCount,
						error: null,
					});
			},
			(cause: unknown) => {
				if (isCurrent)
					setRead({
						key,
						messages: [],
						hiddenCount: 0,
						unavailableCount: 0,
						error:
							cause instanceof Error
								? cause.message
								: "This email could not be loaded.",
					});
			},
		);
		return () => {
			isCurrent = false;
		};
	}, [actions, key, threadId]);
	const current = read?.key === key ? read : null;
	const messages = current?.messages ?? [];
	const message = shownEmail(messages, config.messageId, profile);
	const title = messages.find((item) => item.subject)?.subject;
	useEffect(() => {
		if (title) rename(title);
	}, [rename, title]);
	const retry = () => setAttempt((value) => value + 1);
	if ((current?.source ?? config.source) === "teams")
		return (
			<RoomTeamsReader
				title={title ?? ""}
				messages={messages}
				webLink={
					messages
						.filter((item) => item.webLink)
						.sort((left, right) => left.at.localeCompare(right.at))
						.at(-1)?.webLink
				}
				isLoading={!current}
				error={current?.error ?? null}
				onRetry={retry}
				emptyText={emptyText(current)}
			/>
		);
	// the email asked for is gone or hidden now: say so rather than quietly show another
	const isMissing = Boolean(
		current &&
			!current.error &&
			config.messageId &&
			!messages.some((item) => item.id === config.messageId),
	);
	return (
		<RoomEmailReader
			label="Email thread"
			source={{
				threadId,
				title: title ?? "",
				channel: "email",
				kind: "brain",
				messages: [],
			}}
			messages={messages}
			message={message}
			onSelect={(messageId) => setConfig({ messageId })}
			isLoading={!current}
			error={current?.error ?? null}
			onRetry={retry}
			notice={
				isMissing
					? "That email is not among the emails you can read in this thread."
					: undefined
			}
			emptyText={emptyText(current)}
		/>
	);
}

const ROOM_THREAD_EMAIL_PANEL: WorkbenchPanelConfig<RoomThreadEmailPanelConfig> =
	{
		name: "Email",
		icon: ({ className }) =>
			createElement(Mail, { className, "aria-hidden": true }),
		content: RoomThreadEmailPanel,
		mount: "keepAlive",
		canRename: false,
		matches: (a, b) => a.threadId === b.threadId,
	};

/** Register the thread reader in the room's existing tool and file dock. */
export const ROOM_THREAD_EMAIL_PANEL_COMPONENTS = {
	[ROOM_THREAD_EMAIL_PANEL_TYPE]: ROOM_THREAD_EMAIL_PANEL,
};
