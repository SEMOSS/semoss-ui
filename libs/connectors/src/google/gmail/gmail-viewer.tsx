import { MailIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { cn, Muted, Tabs, TabsContent } from "@semoss/ui/next";
import { ConnectorIconButton } from "../../components/connector-icon-button";
import { ConnectorItemRow } from "../../components/connector-item-row";
import { ConnectorList } from "../../components/connector-list";
import { ConnectorTabsList } from "../../components/connector-tabs-list";
import { ConnectorTabsTrigger } from "../../components/connector-tabs-trigger";
import { ConnectorViewerHeader } from "../../components/connector-viewer-header";
import type { ConnectorViewerProps } from "../../core/connector.types";
import { runConnectorPixel } from "../../core/connector-pixel";
import { useConnectorQuery } from "../../core/use-connector-query";
import {
	type ConnectorSaveRequest,
	useConnectorSaver,
} from "../../core/use-connector-saver";
import { useReturnFocus } from "../../core/use-return-focus";
import {
	gmailMessageFileName,
	gmailMessageToMarkdown,
} from "../google.markdown";
import { parseGmailList, parseGmailMessage } from "../google.parsers";
import { GOOGLE_PIXELS } from "../google.pixels";
import type { GmailMessageSummary } from "../google.types";
import { GmailMessageDetail } from "./gmail-message-detail";

/** How many emails a list reads at first, and how many more each time. */
const PAGE_SIZE = 25;

/**
 * The most emails read at once. The backend reads each email with its own
 * request, so a long list is slow.
 */
const MAX_EMAILS = 50;

type GmailView = "recent" | "unread";

const isGmailView = (value: string): value is GmailView =>
	value === "recent" || value === "unread";

/**
 * The name part of a `Name <address>` header, for a list row.
 *
 * @param from - The header.
 * @return The name, or the header as it is.
 */
const toSenderName = (from: string): string => {
	const match = /^\s*"?([^"<]+?)"?\s*<[^>]+>\s*$/.exec(from);
	return match ? match[1] : from;
};

/** Props for {@link GmailViewer}. */
export type GmailViewerProps = ConnectorViewerProps;

/**
 * The user's newest Gmail, or their unread email: open one to read it, and
 * bring it into the insight. Gmail marks an email read when it is opened.
 */
export const GmailViewer = (props: GmailViewerProps) => {
	const { onSignIn } = props;
	const { t, i18n } = useTranslation("connectors");
	const { insightId } = useInsight();
	const saver = useConnectorSaver("gmail", props);
	const [view, setView] = useState<GmailView>("recent");
	const [limit, setLimit] = useState(PAGE_SIZE);
	const [openMessage, setOpenMessage] = useState<GmailMessageSummary | null>(
		null,
	);
	const { listRef, rememberItem } = useReturnFocus(openMessage !== null);
	const serviceName = t("services.gmail");
	const listName = view === "recent" ? t("gmail.recent") : t("gmail.unread");

	const query = useConnectorQuery(
		view === "recent"
			? GOOGLE_PIXELS.gmailRecent(limit)
			: GOOGLE_PIXELS.gmailUnread(limit),
		parseGmailList,
		{ listKey: view },
	);

	const messageRequest = (
		message: GmailMessageSummary,
	): ConnectorSaveRequest => ({
		key: message.id,
		name: message.subject || t("common.noSubject"),
		source: {
			kind: "text",
			fileName: gmailMessageFileName(message.subject),
			// the list holds a preview, so the email is read in full first
			getContent: async () => {
				if (!insightId) {
					throw new Error(t("errors.noInsight"));
				}
				return gmailMessageToMarkdown(
					parseGmailMessage(message.id)(
						await runConnectorPixel(
							GOOGLE_PIXELS.gmailRead(message.id),
							insightId,
						),
					),
				);
			},
		},
	});

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div
				className={cn(
					"flex h-full min-h-0 flex-col",
					openMessage !== null && "hidden",
				)}
			>
				<ConnectorViewerHeader
					brand="gmail"
					icon={MailIcon}
					title={serviceName}
					description={listName}
				>
					<ConnectorIconButton
						icon={RefreshCwIcon}
						label={t("common.refresh")}
						isSpinning={query.isRefreshing}
						onClick={query.reload}
					/>
				</ConnectorViewerHeader>

				<Tabs
					dir={i18n.dir()}
					value={view}
					onValueChange={(value) => {
						if (isGmailView(value)) {
							setView(value);
							setLimit(PAGE_SIZE);
						}
					}}
					className="min-h-0 flex-1 gap-0"
				>
					<div className="shrink-0 border-border border-b bg-muted/10 px-3 pb-1.5">
						<ConnectorTabsList aria-label={t("gmail.viewLabel")}>
							<ConnectorTabsTrigger value="recent">
								{t("gmail.recent")}
							</ConnectorTabsTrigger>
							<ConnectorTabsTrigger value="unread">
								{t("gmail.unread")}
							</ConnectorTabsTrigger>
						</ConnectorTabsList>
						<Muted className="text-xs">
							{t("gmail.marksRead")}
						</Muted>
					</div>
					<TabsContent value={view} className="flex min-h-0 flex-col">
						<ConnectorList
							query={query}
							serviceName={serviceName}
							account="google"
							onSignIn={onSignIn}
							listRef={listRef}
							limit={limit}
							emptyText={
								view === "unread"
									? t("gmail.noUnread")
									: t("gmail.empty")
							}
							onShowMore={
								limit < MAX_EMAILS
									? () =>
											setLimit((previous) =>
												Math.min(
													previous + PAGE_SIZE,
													MAX_EMAILS,
												),
											)
									: undefined
							}
						>
							{(messages) =>
								messages.map((message) => {
									const request = messageRequest(message);
									const isBusy = saver.isBusy(request.key);
									const title =
										message.subject ||
										t("common.noSubject");
									const from = message.from
										? toSenderName(message.from)
										: t("mail.unknownSender");
									return (
										<ConnectorItemRow
											key={message.id}
											itemKey={message.id}
											icon={
												<MailIcon
													aria-hidden
													className="size-4"
												/>
											}
											title={title}
											description={
												message.snippet
													? t(
															"gmail.fromWithPreview",
															{
																from: from,
																preview:
																	message.snippet,
															},
														)
													: from
											}
											isEmphasized={view === "unread"}
											openLabel={t("mail.openMessage", {
												subject: title,
												from: from,
											})}
											isBusy={isBusy}
											onOpen={() => {
												rememberItem(message.id);
												setOpenMessage(message);
											}}
											actions={{
												itemName: title,
												serviceName: serviceName,
												saveLabel: saver.saveLabel,
												isBusy: isBusy,
												onAddToContext:
													saver.addToContext
														? () =>
																saver.addToContext?.(
																	request,
																)
														: undefined,
												onSave: () =>
													saver.save(request),
											}}
										/>
									);
								})
							}
						</ConnectorList>
					</TabsContent>
				</Tabs>
			</div>

			{openMessage ? (
				<GmailMessageDetail
					key={openMessage.id}
					summary={openMessage}
					listName={listName}
					saver={saver}
					onSignIn={onSignIn}
					onBack={() => setOpenMessage(null)}
				/>
			) : null}
		</div>
	);
};
