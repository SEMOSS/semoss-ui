import { useTranslation } from "@semoss/i18n";
import { Muted } from "@semoss/ui/next";
import { ConnectorActionBar } from "../../components/connector-action-bar";
import { ConnectorDetailView } from "../../components/connector-detail-view";
import { ConnectorViewerStatus } from "../../components/connector-viewer-status";
import { useConnectorQuery } from "../../core/use-connector-query";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../../core/use-connector-saver";
import { teamsChatFileName, teamsChatToMarkdown } from "../microsoft.markdown";
import {
	parseChatMessages,
	readMicrosoftSavedPath,
} from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type {
	TeamsAttachment,
	TeamsChat,
	TeamsMessage,
} from "../microsoft.types";
import { TeamsMessageItem } from "./teams-message-item";

/** How many of a chat's newest messages are read. */
export const CHAT_MESSAGE_LIMIT = 50;

/** Props for {@link TeamsChatDetail}. */
export interface TeamsChatDetailProps {
	/** The chat. */
	chat: TeamsChat;
	/** Saves the chat and its files into the insight. */
	saver: ConnectorSaver;
	/** Goes back to the chats. */
	onBack: () => void;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * One Teams chat: its newest messages, oldest first, with their files. The
 * messages shown can be added to the conversation or saved as one file.
 */
export const TeamsChatDetail = ({
	chat,
	saver,
	onBack,
	onSignIn,
}: TeamsChatDetailProps) => {
	const { t } = useTranslation("connectors");
	const query = useConnectorQuery(
		MICROSOFT_PIXELS.teamsListChatMessages({
			chatId: chat.id,
			limit: CHAT_MESSAGE_LIMIT,
		}),
		parseChatMessages,
	);
	const messages = query.data?.messages ?? null;
	const readCount = query.data?.readCount ?? 0;
	const serviceName = t("services.teams");
	const title = chat.displayName || t("teams.chat");

	const chatRequest = (shown: TeamsMessage[]): ConnectorSaveRequest => ({
		key: chat.id,
		name: title,
		source: {
			kind: "text",
			fileName: teamsChatFileName(chat),
			getContent: () => teamsChatToMarkdown(chat, shown),
		},
	});

	/**
	 * How to save a file attached to one of the chat's messages.
	 *
	 * @param message - The message holding the file.
	 * @return A factory for the file's save request.
	 */
	const attachmentRequests =
		(message: TeamsMessage) =>
		(attachment: TeamsAttachment): ConnectorSaveRequest | null => {
			const attachmentId = attachment.id ?? attachment.name;
			if (!attachmentId) {
				return null;
			}
			const name = attachment.name ?? attachmentId;
			return {
				key: `${message.id}:${attachmentId}`,
				name: name,
				source: {
					kind: "download",
					readSavedPath: readMicrosoftSavedPath,
					fileName: name,
					buildPixel: (fileName) =>
						MICROSOFT_PIXELS.teamsDownloadAttachment({
							chatId: chat.id,
							messageId: message.id,
							attachmentId: attachmentId,
							fileName: fileName,
						}),
				},
			};
		};

	return (
		<ConnectorDetailView
			title={title}
			backLabel={t("teams.backToChats")}
			onBack={onBack}
			actions={
				messages ? (
					<ConnectorActionBar
						serviceName={serviceName}
						saveLabel={saver.saveLabel}
						webUrl={chat.webUrl}
						isBusy={saver.isBusy(chat.id)}
						onAddToContext={
							saver.addToContext
								? () =>
										saver.addToContext?.(
											chatRequest(messages),
										)
								: undefined
						}
						onSave={() => saver.save(chatRequest(messages))}
					/>
				) : null
			}
		>
			{messages ? (
				messages.length === 0 ? (
					<Muted>{t("teams.emptyChat")}</Muted>
				) : (
					<div className="flex flex-col gap-2">
						{readCount >= CHAT_MESSAGE_LIMIT ? (
							<Muted>
								{t("teams.latestMessages", {
									count: messages.length,
								})}
							</Muted>
						) : null}
						{messages.map((message) => (
							<TeamsMessageItem
								key={message.id}
								message={message}
								saver={saver}
								serviceName={serviceName}
								getAttachmentRequest={attachmentRequests(
									message,
								)}
							/>
						))}
					</div>
				)
			) : (
				<ConnectorViewerStatus
					query={query}
					serviceName={serviceName}
					onSignIn={onSignIn}
					skeletonRows={5}
				/>
			)}
		</ConnectorDetailView>
	);
};
