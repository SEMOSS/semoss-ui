import { MailIcon, PaperclipIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import type { ToolViewProps } from "@semoss/shared";
import { ConnectorItemRow } from "../components/connector-item-row";
import { ConnectorList } from "../components/connector-list";
import { ConnectorViewerHeader } from "../components/connector-viewer-header";
import { ToolCallNotice } from "../components/tool-call-notice";
import { formatListDate } from "../core/connector.format";
import { runConnectorPixel } from "../core/connector-pixel";
import { readToolAccount, readToolResult } from "../core/tool-view-call";
import { toViewerHost } from "../core/tool-view-host";
import type { ConnectorQuery } from "../core/use-connector-query";
import { useConnectorSaver } from "../core/use-connector-saver";
import { useReturnFocus } from "../core/use-return-focus";
import { mailMessageFileName, mailMessageToMarkdown } from "./mail.markdown";
import { parseMailMessageDetail, parseMailPage } from "./mail.parsers";
import type { MailMessage, MailPage } from "./mail.types";
import { MAIL_APPS } from "./mail-apps";
import { MailMessageView } from "./mail-message-view";

/**
 * A listing's result, read.
 *
 * @param result - The call's parsed result.
 * @return The page, or null when the result is not one.
 */
const readMailPage = (result: unknown): MailPage | null => {
	try {
		return parseMailPage(result);
	} catch {
		return null;
	}
};

/** Nothing to read again: the emails are the call's result. */
const keepResult = (): void => undefined;

/**
 * The emails a `ListMail` call found, in the conversation: one row each,
 * which opens the email in place, read in full from its mailbox. Rows add
 * an email to context or save it, as the mailbox viewer's rows do.
 */
export const MailListToolView = ({ call, params, host }: ToolViewProps) => {
	const { t, i18n } = useTranslation("connectors");
	const { insightId } = useInsight();
	const app = MAIL_APPS[readToolAccount(params, call.functionName)];
	const viewerHost = useMemo(() => toViewerHost(host), [host]);
	const saver = useConnectorSaver(app.service, viewerHost);
	const [openMessage, setOpenMessage] = useState<MailMessage | null>(null);
	const { listRef, rememberItem } = useReturnFocus(openMessage !== null);
	const page = useMemo(() => readMailPage(readToolResult(call)), [call]);
	const serviceName = t(app.nameKey);

	if (call.status !== "succeeded") {
		return <ToolCallNotice call={call} appName={t(app.appNameKey)} />;
	}

	const query: ConnectorQuery<MailMessage[]> = {
		status: "ready",
		data: page?.messages ?? [],
		error: null,
		isRefreshing: false,
		reload: keepResult,
	};

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div
				className={
					openMessage ? "hidden" : "flex h-full min-h-0 flex-col"
				}
			>
				<ConnectorViewerHeader
					icon={MailIcon}
					brand={app.brand}
					title={serviceName}
					description={t("toolViews.mail.found", {
						count: query.data?.length ?? 0,
					})}
				/>
				<ConnectorList
					query={query}
					serviceName={serviceName}
					account={app.account}
					listRef={listRef}
					isFull={page?.hasMore === true}
					limitNote={t("toolViews.mail.more")}
					emptyText={
						page
							? t("toolViews.mail.empty")
							: t("toolViews.unreadable")
					}
				>
					{(messages) =>
						messages.map((message) => {
							const from =
								message.fromName ??
								message.from ??
								t("mail.unknownSender");
							const title =
								message.subject || t("common.noSubject");
							const request = {
								key: message.id,
								name: title,
								source: {
									kind: "text" as const,
									fileName: mailMessageFileName(message),
									// a listing may leave bodies out, so the email is read in full
									getContent: async () => {
										if (!insightId) {
											throw new Error(
												t("errors.noInsight"),
											);
										}
										const full = parseMailMessageDetail(
											await runConnectorPixel(
												app.pixels.getMail(message.id),
												insightId,
											),
										);
										return mailMessageToMarkdown(app, full);
									},
								},
							};
							const Icon = message.hasAttachments
								? PaperclipIcon
								: MailIcon;
							return (
								<ConnectorItemRow
									key={message.id}
									itemKey={message.id}
									icon={
										<Icon aria-hidden className="size-4" />
									}
									title={title}
									description={from}
									meta={formatListDate(
										message.receivedDate,
										i18n.language,
									)}
									isEmphasized={message.isUnread}
									openLabel={t(
										message.isUnread
											? "mail.openUnreadMessage"
											: "mail.openMessage",
										{ subject: title, from: from },
									)}
									isBusy={saver.isBusy(request.key)}
									onOpen={() => {
										rememberItem(message.id);
										setOpenMessage(message);
									}}
									actions={{
										itemName: title,
										serviceName: serviceName,
										webUrl: message.webLink,
										saveLabel: saver.saveLabel,
										isBusy: saver.isBusy(request.key),
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
			{openMessage ? (
				<MailMessageView
					key={openMessage.id}
					app={app}
					summary={openMessage}
					folderName={t("toolViews.mail.results")}
					saver={saver}
					onSignIn={viewerHost.onSignIn}
					onBack={() => setOpenMessage(null)}
				/>
			) : null}
		</div>
	);
};
