import {
	ChevronDownIcon,
	MailIcon,
	MailsIcon,
	PaperclipIcon,
	RefreshCwIcon,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import type { ConnectorBrand } from "@semoss/shared";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Toggle,
	useDebouncedValue,
} from "@semoss/ui/next";
import { ConnectorIconButton } from "../components/connector-icon-button";
import { ConnectorItemRow } from "../components/connector-item-row";
import { ConnectorList } from "../components/connector-list";
import { ConnectorSearchField } from "../components/connector-search-field";
import { ConnectorViewerHeader } from "../components/connector-viewer-header";
import { formatListDate } from "../core/connector.format";
import type {
	ConnectorAccount,
	ConnectorViewerProps,
} from "../core/connector.types";
import { runConnectorPixel } from "../core/connector-pixel";
import { useConnectorQuery } from "../core/use-connector-query";
import {
	type ConnectorSaveRequest,
	useConnectorSaver,
} from "../core/use-connector-saver";
import { useReturnFocus } from "../core/use-return-focus";
import { mailMessageFileName, mailMessageToMarkdown } from "./mail.markdown";
import { parseMailFolders, parseMailMessageDetail } from "./mail.parsers";
import {
	groupMailByConversation,
	type MailConversation,
	normalizeMailSubject,
} from "./mail.threads";
import type { MailMessage } from "./mail.types";
import { MAIL_APPS } from "./mail-apps";
import type { MailItemSelection } from "./mail-item-selection";
import { MailMessageView } from "./mail-message-view";
import {
	MailThreadView,
	readConversation,
	threadSaveRequest,
} from "./mail-thread-view";
import { useMailboxQuery } from "./use-mailbox-query";

/** The inbox's well known name, which every mailbox takes in place of its id. */
const INBOX = "inbox";

/**
 * Whether a thread can be read as a whole: only when the backend reports
 * which conversation its emails belong to.
 *
 * @param conversation - The thread.
 * @return True when the thread has a conversation id.
 */
const isWholeThread = (
	conversation: MailConversation,
): conversation is MailConversation & { conversationId: string } =>
	!!conversation.conversationId;

/** The current mailbox's actions and live state for host-owned controls. */
export interface MailboxViewControls {
	/** The account these controls belong to, including when providers are retained. */
	provider: ConnectorAccount;
	/** Reload the current filters from the first page. */
	refresh: () => void;
	/** Whether the current mailbox is loading, refreshing, or reading another page. */
	isRefreshing: boolean;
	/** The provider's mailbox home, rather than a link to an individual message. */
	mailboxUrl: string;
	/** The localized provider app name, such as Outlook or Gmail. */
	appName: string;
}

/** Props for {@link MailboxView}. */
export interface MailboxViewProps extends ConnectorViewerProps {
	/** The account whose mailbox is read: Outlook for `microsoft`, Gmail for `google`. */
	provider: ConnectorAccount;
	/** The logo the header shows. Defaults to the mailbox's own. */
	brand?: ConnectorBrand;
	/** The full viewer, or a compact browser for a narrow workspace rail. */
	presentation?: "full" | "compact";
	/** The host's account picker, shown beside Refresh in compact mode. */
	providerControl?: ReactNode;
	/** Opens an item in the host while leaving this browser visible. */
	onOpenItem?: (selection: MailItemSelection) => void;
	/** Receives host-control state when it changes. Keep the receiver identity stable. */
	onControls?: (controls: MailboxViewControls) => void;
	/** Show the viewer's own Refresh action. Defaults to true. */
	showRefresh?: boolean;
}

/**
 * Read the user's mail, in Outlook or Gmail: pick a folder or label, find
 * emails by subject, and bring an email, a whole thread, or an attachment into
 * the insight. Every mailbox reads the same way; only the reactors it calls
 * and the names it shows differ.
 *
 * Emails of one thread share a row, so a busy conversation reads as one line
 * with a count. Opening it shows the whole thread from every folder, the
 * user's own replies included.
 */
export const MailboxView = (props: MailboxViewProps) => {
	const {
		provider,
		onSignIn,
		showHeader = true,
		presentation = "full",
		providerControl,
		onOpenItem,
		onControls,
		showRefresh = true,
	} = props;
	const isCompact = presentation === "compact";
	const app = MAIL_APPS[provider];
	const { t, i18n } = useTranslation("connectors");
	const { insightId } = useInsight();
	const saver = useConnectorSaver(app.service, props);
	const [folder, setFolder] = useState(INBOX);
	const [search, setSearch] = useState("");
	const [isUnreadOnly, setIsUnreadOnly] = useState(false);
	const [isGrouped, setIsGrouped] = useState(true);
	const [openConversation, setOpenConversation] =
		useState<MailConversation | null>(null);
	const debouncedSubject = useDebouncedValue(search.trim());
	// clearing the search takes effect at once rather than after the delay
	const subject = search.trim() === "" ? "" : debouncedSubject;
	const searchLimitId = useId();
	const isSearchLimited = provider === "microsoft" && subject !== "";
	const { listRef, rememberItem } = useReturnFocus(openConversation !== null);
	const serviceName = t(app.nameKey);

	const foldersQuery = useConnectorQuery(
		app.pixels.listFolders(),
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

	const query = useMailboxQuery({
		provider,
		folder,
		subject,
		unreadOnly: isUnreadOnly,
	});
	const emails = query.data?.messages ?? [];
	const conversations = groupMailByConversation(emails, isGrouped);
	const conversationsQuery = {
		...query,
		data: query.data ? conversations : null,
	};

	// the folders fail with the mail when the account is signed out, so both
	// are read again after a sign in or a refresh
	const reload = useCallback(() => {
		query.reload();
		if (foldersQuery.status !== "ready") {
			foldersQuery.reload();
		}
	}, [query.reload, foldersQuery.reload, foldersQuery.status]);
	const appName = t(app.appNameKey);
	const isRefreshing = query.status === "loading" || query.isRefreshing;
	const mailboxUrl = app.mailboxUrl;
	// Hosts may publish these controls to their own store. Depend on fields,
	// not a fresh object, so that host rerenders do not publish back forever.
	useEffect(() => {
		onControls?.({
			provider,
			refresh: reload,
			isRefreshing,
			mailboxUrl,
			appName,
		});
	}, [onControls, provider, reload, isRefreshing, mailboxUrl, appName]);

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
		conversation: MailConversation,
		title: string,
	): ConnectorSaveRequest => {
		// a row with conversations off stands for one email, which still
		// belongs to a thread; saving takes the whole thread either way
		const conversationId =
			conversation.conversationId ?? conversation.latest.conversationId;
		if (conversationId) {
			return threadSaveRequest(
				app,
				conversation.key,
				title,
				conversation.latest.subject,
				() => readConversation(app, read, conversationId),
			);
		}
		const email: MailMessage = conversation.latest;
		return {
			key: conversation.key,
			name: title,
			source: {
				kind: "text",
				fileName: mailMessageFileName(email),
				// the list is read without bodies, so the email is read in full
				getContent: async () =>
					mailMessageToMarkdown(
						app,
						parseMailMessageDetail(
							await read(app.pixels.getMail(email.id)),
						),
					),
			},
		};
	};

	// in the header, or at the end of the toolbar when the host leaves
	// the header out
	const refreshButton = showRefresh ? (
		<ConnectorIconButton
			icon={RefreshCwIcon}
			label={t("common.refresh")}
			isSpinning={query.isRefreshing}
			onClick={reload}
		/>
	) : null;

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div
				className={cn(
					"flex h-full min-h-0 flex-col",
					openConversation !== null && "hidden",
				)}
			>
				{isCompact ? (
					<div className="flex min-w-0 items-center gap-2 border-border border-b px-3 py-2">
						<div className="min-w-0 flex-1">{providerControl}</div>
						{refreshButton}
					</div>
				) : showHeader ? (
					<ConnectorViewerHeader
						brand={props.brand ?? app.brand}
						icon={MailIcon}
						title={serviceName}
						description={folderName}
					>
						{refreshButton}
					</ConnectorViewerHeader>
				) : null}

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
						{isCompact ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="h-8 shrink-0 gap-1 px-2 shadow-none"
									>
										{t("mail.filters")}
										<ChevronDownIcon
											aria-hidden
											className="size-3.5"
										/>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuCheckboxItem
										checked={isUnreadOnly}
										onCheckedChange={setIsUnreadOnly}
										onSelect={(event) =>
											event.preventDefault()
										}
									>
										{t("mail.unreadOnly")}
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={isGrouped}
										onCheckedChange={setIsGrouped}
										onSelect={(event) =>
											event.preventDefault()
										}
									>
										{t("mail.conversations")}
									</DropdownMenuCheckboxItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<>
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
							</>
						)}
						{!isCompact && !showHeader ? refreshButton : null}
					</div>
					<ConnectorSearchField
						value={search}
						placeholder={t("mail.searchPlaceholder")}
						descriptionId={
							isSearchLimited ? searchLimitId : undefined
						}
						onChange={setSearch}
					/>
					{isSearchLimited && (
						<Muted id={searchLimitId} className="text-xs">
							{t("mail.outlookSearchLimit")}
						</Muted>
					)}
				</div>

				<ConnectorList
					query={{ ...conversationsQuery, reload: reload }}
					serviceName={serviceName}
					account={app.account}
					onClearSearch={subject ? () => setSearch("") : undefined}
					onSignIn={onSignIn}
					listRef={listRef}
					isFull={query.data?.hasMore === true}
					loadMoreError={query.loadMoreError}
					emptyText={
						subject
							? t("common.noResults", { query: subject })
							: isUnreadOnly
								? t("mail.noUnread")
								: t("mail.empty")
					}
					onShowMore={query.loadMore}
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
									presentation={presentation}
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
										if (onOpenItem) {
											onOpenItem({
												kind: isWholeThread(
													conversation,
												)
													? "thread"
													: "message",
												id:
													conversation.conversationId ??
													latest.id,
												title: title,
												itemKey: conversation.key,
												folderName: folderName,
												summary: conversation,
											});
											return;
										}
										rememberItem(conversation.key);
										setOpenConversation(conversation);
									}}
									actions={{
										itemName: title,
										serviceName: serviceName,
										webUrl: latest.webLink,
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
				<MailThreadView
					key={openConversation.key}
					app={app}
					conversation={openConversation}
					folderName={folderName}
					saver={saver}
					onSignIn={onSignIn}
					onBack={() => setOpenConversation(null)}
				/>
			) : openConversation ? (
				<MailMessageView
					key={openConversation.key}
					app={app}
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
