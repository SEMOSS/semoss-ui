import { MessageCircleIcon, SearchIcon, UsersIcon } from "lucide-react";
import type { Ref } from "react";
import { useTranslation } from "@semoss/i18n";
import { ConnectorItemRow } from "../../components/connector-item-row";
import { ConnectorList } from "../../components/connector-list";
import { formatListDate } from "../../core/connector.format";
import type { ConnectorQuery } from "../../core/use-connector-query";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../../core/use-connector-saver";
import type { TeamsChat, TeamsMessageSearchPage } from "../microsoft.types";

/** Props for {@link TeamsMessageSearchList}. */
export interface TeamsMessageSearchListProps {
	/** What was searched, for the empty state. */
	search: string;
	/** The read of the messages found. */
	query: ConnectorQuery<TeamsMessageSearchPage>;
	/** Reads more of the same search, when one read can hold more. */
	onShowMore?: () => void;
	/** The chats already listed, which name the chat each message is in. */
	chats: TeamsChat[];
	/** Saves a found message's chat into the insight. */
	saver: ConnectorSaver;
	/** How to save a chat, as the chat list saves it. */
	getChatRequest: (chat: TeamsChat) => ConnectorSaveRequest;
	/**
	 * Opens the chat a message is in, at that message.
	 *
	 * @param chat - The chat, as well as it is known.
	 * @param messageId - The message the search found.
	 * @param itemKey - The row's key, so focus can return to it.
	 */
	onOpenHit: (chat: TeamsChat, messageId: string, itemKey: string) => void;
	/** Clears the search. */
	onClearSearch: () => void;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
	/** The list element, so focus can return to a row. */
	listRef?: Ref<HTMLUListElement>;
	/** The app's name, for the messages. */
	serviceName: string;
}

/**
 * The chat messages a Teams search found, newest first: who wrote each one,
 * in which chat, and the text around the match. Opening one opens its chat.
 */
export const TeamsMessageSearchList = ({
	search,
	query,
	onShowMore,
	chats,
	saver,
	getChatRequest,
	onOpenHit,
	onClearSearch,
	onSignIn,
	listRef,
	serviceName,
}: TeamsMessageSearchListProps) => {
	const { t, i18n } = useTranslation("connectors");
	const chatsById = new Map(chats.map((chat) => [chat.id, chat]));

	return (
		<ConnectorList
			query={{ ...query, data: query.data?.hits ?? null }}
			serviceName={serviceName}
			emptyIcon={SearchIcon}
			onSignIn={onSignIn}
			listRef={listRef}
			isFull={query.data?.hasMore ?? false}
			onShowMore={onShowMore}
			onClearSearch={onClearSearch}
			emptyText={t("common.noResults", { query: search })}
		>
			{(hits) =>
				hits.flatMap((hit) => {
					const chatId = hit.chatId;
					if (!chatId) {
						return [];
					}
					const chat = chatsById.get(chatId) ?? {
						id: chatId,
						hasUnread: false,
					};
					const itemKey = `${chatId}:${hit.id}`;
					const request = getChatRequest(chat);
					const isBusy = saver.isBusy(request.key);
					const author = hit.fromName ?? t("teams.someone");
					const title =
						hit.subject || hit.summary || t("teams.noText");
					const Icon =
						chat.chatType === "group" || chat.chatType === "meeting"
							? UsersIcon
							: MessageCircleIcon;
					return [
						<ConnectorItemRow
							key={itemKey}
							itemKey={itemKey}
							icon={<Icon aria-hidden className="size-4" />}
							title={title}
							description={
								chat.displayName
									? t("teams.searchResultIn", {
											author: author,
											chat: chat.displayName,
										})
									: author
							}
							meta={formatListDate(
								hit.createdDateTime,
								i18n.language,
							)}
							openLabel={t("teams.openSearchResult", {
								author: author,
								text: title,
							})}
							isBusy={isBusy}
							onOpen={() => onOpenHit(chat, hit.id, itemKey)}
							actions={{
								itemName: chat.displayName || t("teams.chat"),
								serviceName: t("services.teams"),
								webUrl: chat.webUrl ?? hit.webUrl,
								saveLabel: saver.saveLabel,
								isBusy: isBusy,
								onAddToContext: saver.addToContext
									? () => saver.addToContext?.(request)
									: undefined,
								onSave: () => saver.save(request),
							}}
						/>,
					];
				})
			}
		</ConnectorList>
	);
};
