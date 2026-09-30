import {
	MailIcon,
	MailsIcon,
	PaperclipIcon,
	RefreshCwIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import {
	cn,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Toggle,
	useDebouncedValue,
} from "@semoss/ui/next";
import { ConnectorIconButton } from "../../components/connector-icon-button";
import { ConnectorItemRow } from "../../components/connector-item-row";
import { ConnectorList } from "../../components/connector-list";
import { ConnectorSearchField } from "../../components/connector-search-field";
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
	outlookMessageFileName,
	outlookMessageToMarkdown,
} from "../microsoft.markdown";
import {
	parseMailFolders,
	parseMailList,
	parseMailMessageDetail,
} from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { OutlookMessage } from "../microsoft.types";
import {
	groupMailByConversation,
	normalizeMailSubject,
	type OutlookConversation,
} from "./outlook-mail.threads";
import { OutlookMailDetail } from "./outlook-mail-detail";
import {
	OutlookThreadDetail,
	readConversation,
	threadSaveRequest,
} from "./outlook-thread-detail";

/** How many emails a list reads at first, and how many more each time. */
const PAGE_SIZE = 25;

/** The most emails the backend reads at once. */
const MAX_EMAILS = 100;

/** Outlook's name for the inbox, which works in place of its id. */
const INBOX = "inbox";

/**
 * Whether a thread can be read as a whole: only when the backend reports
 * which conversation its emails belong to.
 *
 * @param conversation - The thread.
 * @return True when the thread has a conversation id.
 */
const isWholeThread = (
	conversation: OutlookConversation,
): conversation is OutlookConversation & { conversationId: string } =>
	!!conversation.conversationId;

/** Props for {@link OutlookMailViewer}. */
export type OutlookMailViewerProps = ConnectorViewerProps;

/**
 * Read the user's Outlook mail: pick a folder, find emails by subject, and
 * bring an email, a whole thread, or an attachment into the insight.
 *
 * Emails of one thread share a row, so a busy conversation reads as one line
 * with a count. Opening it shows the whole thread from every folder, the
 * user's own replies included.
 */
export const OutlookMailViewer = (props: OutlookMailViewerProps) => {
	const { onSignIn } = props;
	const { t, i18n } = useTranslation("connectors");
	const { insightId } = useInsight();
	const saver = useConnectorSaver("outlook-mail", props);
	const [folder, setFolder] = useState(INBOX);
	const [search, setSearch] = useState("");
	const [isUnreadOnly, setIsUnreadOnly] = useState(false);
	const [isGrouped, setIsGrouped] = useState(true);
	const [openConversation, setOpenConversation] =
		useState<OutlookConversation | null>(null);
	const debouncedSubject = useDebouncedValue(search.trim());
	// clearing the search takes effect at once rather than after the delay
	const subject = search.trim() === "" ? "" : debouncedSubject;
	const listKey = `${folder}|${subject}|${isUnreadOnly}`;
	// more emails are read for one list; a different list starts over
	const [paging, setPaging] = useState({ key: listKey, limit: PAGE_SIZE });
	const limit = paging.key === listKey ? paging.limit : PAGE_SIZE;
	const { listRef, rememberItem } = useReturnFocus(openConversation !== null);
	const serviceName = t("services.outlookMail");

	const foldersQuery = useConnectorQuery(
		MICROSOFT_PIXELS.outlookListFolders(),
		parseMailFolders,
	);
	// the inbox is offered under its well known name, so its own entry is
	// left out rather than listed twice
	const folders = [
		{ id: INBOX, name: t("mail.inbox") },
		...(foldersQuery.data ?? []).filter(
			(entry) => entry.name.toLowerCase() !== INBOX,
		),
	];
	const folderName =
		folders.find((entry) => entry.id === folder)?.name ?? t("mail.inbox");

	const query = useConnectorQuery(
		MICROSOFT_PIXELS.outlookListMail({
			folder: folder,
			limit: limit,
			subject: subject,
			unreadOnly: isUnreadOnly,
		}),
		parseMailList,
		{ listKey: listKey },
	);
	const emailCount = query.data?.length ?? 0;
	const conversations = groupMailByConversation(query.data ?? [], isGrouped);
	const conversationsQuery = {
		...query,
		data: query.data ? conversations : null,
	};

	// the folders fail with the mail when the account is signed out, so both
	// are read again after a sign in or a refresh
	const reload = () => {
		query.reload();
		if (foldersQuery.status !== "ready") {
			foldersQuery.reload();
		}
	};

	/**
	 * Run a read in the current insight.
	 *
	 * @param pixel - The reactor call.
	 * @return Its output.
	 */
	const read = async (pixel: string): Promise<unknown> => {
		if (!insightId) {
			throw new Error(t("errors.noInsight"));
		}
		return runConnectorPixel(pixel, insightId);
	};

	/**
	 * How to save what a row stands for: its whole thread, read from every
	 * folder, whenever its email belongs to one, or else its one email.
	 *
	 * @param conversation - The row's thread.
	 * @param title - What to call it in messages.
	 * @return The save request.
	 */
	const conversationRequest = (
		conversation: OutlookConversation,
		title: string,
	): ConnectorSaveRequest => {
		// a row with conversations off stands for one email, which still
		// belongs to a thread; saving takes the whole thread either way
		const conversationId =
			conversation.conversationId ?? conversation.latest.conversationId;
		if (conversationId) {
			return threadSaveRequest(
				conversation.key,
				title,
				conversation.latest.subject,
				() => readConversation(read, conversationId),
			);
		}
		const email: OutlookMessage = conversation.latest;
		return {
			key: conversation.key,
			name: title,
			source: {
				kind: "text",
				fileName: outlookMessageFileName(email),
				// the list is read without bodies, so the email is read in full
				getContent: async () =>
					outlookMessageToMarkdown(
						parseMailMessageDetail(
							await read(
								MICROSOFT_PIXELS.outlookGetMail(email.uid),
							),
						),
					),
			},
		};
	};

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div
				className={cn(
					"flex h-full min-h-0 flex-col",
					openConversation !== null && "hidden",
				)}
			>
				<ConnectorViewerHeader
					brand="outlook"
					icon={MailIcon}
					title={serviceName}
					description={folderName}
				>
					<ConnectorIconButton
						icon={RefreshCwIcon}
						label={t("common.refresh")}
						isSpinning={query.isRefreshing}
						onClick={reload}
					/>
				</ConnectorViewerHeader>

				<div className="flex flex-col gap-1.5 border-border border-b bg-muted/10 px-3 py-2">
					{/* the toggles move under the folder when the panel is narrow */}
					<div className="flex flex-wrap items-center gap-2">
						<Select value={folder} onValueChange={setFolder}>
							<SelectTrigger
								size="sm"
								className="h-8 min-w-24 max-w-full flex-1 bg-background shadow-none"
								aria-label={t("mail.folder")}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{folders.map((entry) => (
									<SelectItem key={entry.id} value={entry.id}>
										{entry.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Toggle
							variant="default"
							className="h-8 px-2 text-xs"
							size="sm"
							pressed={isUnreadOnly}
							onPressedChange={setIsUnreadOnly}
						>
							{t("mail.unreadOnly")}
						</Toggle>
						<Toggle
							variant="default"
							className="h-8 px-2 text-xs"
							size="sm"
							pressed={isGrouped}
							onPressedChange={setIsGrouped}
						>
							{t("mail.conversations")}
						</Toggle>
					</div>
					<ConnectorSearchField
						value={search}
						placeholder={t("mail.searchPlaceholder")}
						onChange={setSearch}
					/>
				</div>

				<ConnectorList
					query={{ ...conversationsQuery, reload: reload }}
					serviceName={serviceName}
					onClearSearch={subject ? () => setSearch("") : undefined}
					onSignIn={onSignIn}
					listRef={listRef}
					isFull={emailCount >= limit}
					limitNote={t("mail.limitReached", { count: emailCount })}
					emptyText={
						subject
							? t("common.noResults", { query: subject })
							: isUnreadOnly
								? t("mail.noUnread")
								: t("mail.empty")
					}
					onShowMore={
						limit < MAX_EMAILS
							? () =>
									setPaging({
										key: listKey,
										limit: Math.min(
											limit + PAGE_SIZE,
											MAX_EMAILS,
										),
									})
							: undefined
					}
				>
					{(threads) =>
						threads.map((conversation) => {
							const latest = conversation.latest;
							const count = conversation.messages.length;
							const from =
								latest.fromName ??
								latest.from ??
								t("mail.unknownSender");
							const title =
								normalizeMailSubject(latest.subject) ||
								t("common.noSubject");
							const request = conversationRequest(
								conversation,
								title,
							);
							const isBusy = saver.isBusy(request.key);
							const Icon = conversation.hasAttachments
								? PaperclipIcon
								: count > 1
									? MailsIcon
									: MailIcon;
							return (
								<ConnectorItemRow
									key={conversation.key}
									itemKey={conversation.key}
									icon={
										<Icon aria-hidden className="size-4" />
									}
									title={title}
									description={
										count > 1
											? t("mail.threadFrom", {
													from: from,
													count: count,
												})
											: from
									}
									meta={formatListDate(
										latest.receivedDate,
										i18n.language,
									)}
									isEmphasized={conversation.isUnread}
									openLabel={
										count > 1
											? t(
													conversation.isUnread
														? "mail.openUnreadThread"
														: "mail.openThread",
													{
														subject: title,
														count: count,
													},
												)
											: t(
													conversation.isUnread
														? "mail.openUnreadMessage"
														: "mail.openMessage",
													{
														subject: title,
														from: from,
													},
												)
									}
									isBusy={isBusy}
									onOpen={() => {
										rememberItem(conversation.key);
										setOpenConversation(conversation);
									}}
									actions={{
										itemName: title,
										serviceName: serviceName,
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

			{openConversation && isWholeThread(openConversation) ? (
				<OutlookThreadDetail
					key={openConversation.key}
					conversation={openConversation}
					folderName={folderName}
					saver={saver}
					onSignIn={onSignIn}
					onBack={() => setOpenConversation(null)}
				/>
			) : openConversation ? (
				<OutlookMailDetail
					key={openConversation.key}
					summary={openConversation.latest}
					folderName={folderName}
					saver={saver}
					onSignIn={onSignIn}
					onBack={() => setOpenConversation(null)}
				/>
			) : null}
		</div>
	);
};
