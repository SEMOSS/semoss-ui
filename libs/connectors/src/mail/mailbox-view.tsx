import {
	MailIcon,
	MailsIcon,
	PaperclipIcon,
	RefreshCwIcon,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
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
import { ConnectorViewerStatus } from "../components/connector-viewer-status";
import { formatListDate } from "../core/connector.format";
import type {
	ConnectorAccount,
	ConnectorFocusRequest,
	ConnectorViewerProps,
} from "../core/connector.types";
import { runConnectorPixel } from "../core/connector-pixel";
import { useConnectorControls } from "../core/use-connector-controls";
import { useConnectorFocus } from "../core/use-connector-focus";
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
import { MailCompactRow } from "./mail-compact-row";
import type { MailSelection } from "./mail-detail-view";
import { MailMessageView } from "./mail-message-view";
import {
	MailThreadView,
	readConversation,
	threadSaveRequest,
} from "./mail-thread-view";
import { useMailPages } from "./use-mail-pages";

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

/** Props for {@link MailboxView}. */
export interface MailboxViewProps extends ConnectorViewerProps {
	/** The account whose mailbox is read: Outlook for `microsoft`, Gmail for `google`. */
	provider: ConnectorAccount;
	/** The logo the header shows. Defaults to the mailbox's own. */
	brand?: ConnectorBrand;
	/** Opt into the narrow browser toolbar and two-line mail rows. */
	presentation?: "default" | "compact";
	/** Let the host open a retained detail instead of replacing this browser. */
	onOpenItem?: (selection: MailSelection) => void;
	/** Restore focus to the originating row after host navigation. */
	focusItem?: ConnectorFocusRequest;
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
		isVisible = true,
		onControlsChange,
		presentation = "default",
		onOpenItem,
		focusItem,
	} = props;
	const browserRef = useRef<HTMLDivElement>(null);
	const Row = presentation === "compact" ? MailCompactRow : ConnectorItemRow;
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

	const query = useMailPages({
		provider,
		folder,
		subject,
		unreadOnly: isUnreadOnly,
		isGrouped,
	});
	const emails = query.data ?? [];
	useConnectorFocus(
		listRef,
		focusItem,
		isVisible,
		query.status !== "loading",
		browserRef,
	);
	const conversations = groupMailByConversation(emails, isGrouped);
	const conversationsQuery = {
		...query,
		data: query.data ? conversations : null,
	};

	// the folders fail with the mail when the account is signed out, so both
	// are read again after a sign in or a refresh
	const reload = useCallback(() => {
		query.reload();
		if (foldersQuery.status !== "ready") foldersQuery.reload();
	}, [query.reload, foldersQuery.status, foldersQuery.reload]);
	useConnectorControls(
		{
			refresh: {
				onRefresh: reload,
				isRefreshing: query.isRefreshing || query.status === "loading",
			},
		},
		onControlsChange,
		isVisible && openConversation === null,
	);

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
	const refreshButton = onControlsChange ? null : (
		<ConnectorIconButton
			icon={RefreshCwIcon}
			label={t("common.refresh")}
			isSpinning={query.isRefreshing}
			onClick={reload}
		/>
	);

	return (
		<section
			ref={browserRef}
			tabIndex={-1}
			aria-label={serviceName}
			className="focus-visible:-outline-offset-2 flex h-full min-h-0 min-w-0 flex-col focus-visible:outline-2 focus-visible:outline-ring"
		>
			<div
				className={cn(
					"flex h-full min-h-0 flex-col",
					openConversation !== null && "hidden",
				)}
			>
				{showHeader ? (
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
						{presentation === "compact" ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="h-8 text-xs shadow-none"
									>
										{t("mail.filters")}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuCheckboxItem
										checked={isUnreadOnly}
										onCheckedChange={setIsUnreadOnly}
									>
										{t("mail.unreadOnly")}
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem
										checked={isGrouped}
										onCheckedChange={setIsGrouped}
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

						{showHeader ? null : refreshButton}
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
					account={app.account}
					onClearSearch={subject ? () => setSearch("") : undefined}
					onSignIn={onSignIn}
					listRef={listRef}
					isFull={query.hasMore && !query.pageError}
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
								<Row
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
										if (onOpenItem) {
											onOpenItem({
												provider,
												itemKey: conversation.key,
												folderName,
												...(isWholeThread(conversation)
													? {
															kind: "thread",
															conversation,
														}
													: {
															kind: "message",
															message:
																conversation.latest,
														}),
											});
										} else
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
				{query.status === "ready" &&
				emails.length === 0 &&
				query.hasMore &&
				!query.pageError ? (
					<Button
						variant="outline"
						size="sm"
						className="my-2 self-center"
						disabled={query.isRefreshing}
						onClick={query.loadMore}
					>
						{t(
							query.isRefreshing
								? "common.loadingMore"
								: "common.showMore",
						)}
					</Button>
				) : null}
				{query.pageError?.kind === "signIn" ? (
					<div className="max-h-full shrink-0 overflow-y-auto border-border border-t">
						<ConnectorViewerStatus
							query={{
								status: "signedOut",
								error: query.pageError,
								reload: query.loadMore,
							}}
							serviceName={serviceName}
							account={provider}
							onSignIn={onSignIn}
						/>
					</div>
				) : query.pageError ? (
					<div
						role="alert"
						className="flex shrink-0 flex-col items-start gap-2 border-border border-t p-3"
					>
						<Muted>{t("mail.pageError")}</Muted>
						<Button
							variant="outline"
							size="sm"
							onClick={query.loadMore}
						>
							{t("common.retry")}
						</Button>
					</div>
				) : null}
			</div>

			{openConversation && isWholeThread(openConversation) ? (
				<MailThreadView
					key={openConversation.key}
					app={app}
					conversation={openConversation}
					folderName={folderName}
					saver={saver}
					onSignIn={onSignIn}
					isVisible={isVisible}
					onControlsChange={onControlsChange}
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
					isVisible={isVisible}
					onControlsChange={onControlsChange}
					onBack={() => setOpenConversation(null)}
				/>
			) : null}
		</section>
	);
};
