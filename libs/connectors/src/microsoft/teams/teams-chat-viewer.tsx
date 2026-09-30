import { MessageCircleIcon, RefreshCwIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { cn } from "@semoss/ui/next";
import { ConnectorIconButton } from "../../components/connector-icon-button";
import { ConnectorItemRow } from "../../components/connector-item-row";
import { ConnectorList } from "../../components/connector-list";
import { ConnectorViewerHeader } from "../../components/connector-viewer-header";
import { formatListDate } from "../../core/connector.format";
import type { ConnectorViewerProps } from "../../core/connector.types";
import { runConnectorPixel } from "../../core/connector-pixel";
import { useConnectorQuery } from "../../core/use-connector-query";
import {
	type ConnectorSaveRequest,
	useConnectorSaver,
} from "../../core/use-connector-saver";
import { useReturnFocus } from "../../core/use-return-focus";
import {
	teamsChatFileName,
	teamsChatToMarkdown,
	teamsMessageTitle,
} from "../microsoft.markdown";
import { parseChatMessages, parseChats } from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { TeamsChat } from "../microsoft.types";
import { CHAT_MESSAGE_LIMIT, TeamsChatDetail } from "./teams-chat-detail";

/** How many chats the list reads. */
const CHAT_LIMIT = 50;

/** Props for {@link TeamsChatViewer}. */
export type TeamsChatViewerProps = ConnectorViewerProps;

/**
 * The user's Teams chats, most recently active first: open one to read it,
 * and bring it or its files into the insight.
 */
export const TeamsChatViewer = (props: TeamsChatViewerProps) => {
	const { onSignIn } = props;
	const { t, i18n } = useTranslation("connectors");
	const { insightId } = useInsight();
	const saver = useConnectorSaver("teams-chats", props);
	const [openChat, setOpenChat] = useState<TeamsChat | null>(null);
	const { listRef, rememberItem } = useReturnFocus(openChat !== null);
	const serviceName = t("services.teamsChats");

	const query = useConnectorQuery(
		MICROSOFT_PIXELS.teamsListChats(CHAT_LIMIT),
		parseChats,
	);

	const chatRequest = (chat: TeamsChat): ConnectorSaveRequest => ({
		key: chat.id,
		name: chat.displayName || t("teams.chat"),
		source: {
			kind: "text",
			fileName: teamsChatFileName(chat),
			// the list holds only each chat's newest message, so the chat is read
			getContent: async () => {
				if (!insightId) {
					throw new Error(t("errors.noInsight"));
				}
				const { messages } = parseChatMessages(
					await runConnectorPixel(
						MICROSOFT_PIXELS.teamsListChatMessages({
							chatId: chat.id,
							limit: CHAT_MESSAGE_LIMIT,
						}),
						insightId,
					),
				);
				return teamsChatToMarkdown(chat, messages);
			},
		},
	});

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div
				className={cn(
					"flex h-full min-h-0 flex-col",
					openChat !== null && "hidden",
				)}
			>
				<ConnectorViewerHeader
					brand="teams"
					icon={MessageCircleIcon}
					title={serviceName}
				>
					<ConnectorIconButton
						icon={RefreshCwIcon}
						label={t("common.refresh")}
						isSpinning={query.isRefreshing}
						onClick={query.reload}
					/>
				</ConnectorViewerHeader>

				<ConnectorList
					query={query}
					serviceName={serviceName}
					emptyIcon={MessageCircleIcon}
					onSignIn={onSignIn}
					listRef={listRef}
					limit={CHAT_LIMIT}
					emptyText={t("teams.emptyChats")}
				>
					{(chats) =>
						chats.map((chat) => {
							const request = chatRequest(chat);
							const isBusy = saver.isBusy(request.key);
							const title = chat.displayName || t("teams.chat");
							const last = chat.lastMessage;
							const previewText = last
								? teamsMessageTitle(last, 80)
								: "";
							const preview =
								last && previewText
									? t("teams.lastMessage", {
											author:
												last.fromName ??
												t("teams.someone"),
											text: previewText,
										})
									: undefined;
							return (
								<ConnectorItemRow
									key={chat.id}
									itemKey={chat.id}
									icon={
										chat.chatType === "oneOnOne" ? (
											<MessageCircleIcon
												aria-hidden
												className="size-4"
											/>
										) : (
											<UsersIcon
												aria-hidden
												className="size-4"
											/>
										)
									}
									title={title}
									description={preview}
									meta={formatListDate(
										chat.lastUpdatedDateTime,
										i18n.language,
									)}
									isEmphasized={chat.hasUnread}
									openLabel={t(
										chat.hasUnread
											? "teams.openUnreadChat"
											: "teams.openChat",
										{ title: title },
									)}
									isBusy={isBusy}
									onOpen={() => {
										rememberItem(chat.id);
										setOpenChat(chat);
									}}
									actions={{
										itemName: title,
										serviceName: t("services.teams"),
										webUrl: chat.webUrl,
										saveLabel: saver.saveLabel,
										isBusy: isBusy,
										onAddToContext: saver.addToContext
											? () =>
													saver.addToContext?.(
														request,
													)
											: undefined,
										onSave: () => saver.save(request),
									}}
								/>
							);
						})
					}
				</ConnectorList>
			</div>

			{openChat ? (
				<TeamsChatDetail
					key={openChat.id}
					chat={openChat}
					saver={saver}
					onSignIn={onSignIn}
					onBack={() => setOpenChat(null)}
				/>
			) : null}
		</div>
	);
};
