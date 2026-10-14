import { useCallback } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { safeHttpsUrl } from "@semoss/utility/browser";
import { ConnectorActionBar } from "../components/connector-action-bar";
import { ConnectorDetailView } from "../components/connector-detail-view";
import { ConnectorTextBody } from "../components/connector-text-body";
import { ConnectorViewerStatus } from "../components/connector-viewer-status";
import { formatFullDate } from "../core/connector.format";
import type { ConnectorViewerProps } from "../core/connector.types";
import { runConnectorPixel } from "../core/connector-pixel";
import { useConnectorControls } from "../core/use-connector-controls";
import { useConnectorQuery } from "../core/use-connector-query";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../core/use-connector-saver";
import { mailMessageFileName, mailMessageToMarkdown } from "./mail.markdown";
import { parseMailMessageDetail } from "./mail.parsers";
import type { MailMessage } from "./mail.types";
import type { MailApp } from "./mail-apps";
import { MailAttachmentList } from "./mail-attachment-list";
import { readConversation, threadSaveRequest } from "./mail-thread-view";

/** Props for {@link MailMessageView}. */
export interface MailMessageViewProps
	extends Pick<ConnectorViewerProps, "isVisible" | "onControlsChange"> {
	/** Re-focuses the heading when a retained detail is explicitly reopened. */
	focusRequestId?: number;
	/** The mailbox the email is in. */
	app: MailApp;
	/** The email as the list showed it, until the full one is read. */
	summary: MailMessage;
	/** Where the list is, for the back button. */
	folderName?: string;
	/** Saves the email and its attachments into the insight. */
	saver: ConnectorSaver;
	/** Goes back to the list. Without it the email is shown on its own. */
	onBack?: () => void;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
	/**
	 * Whether the summary is the whole email, as a call read it. It shows at
	 * once, the email is read again only to bring it up to date, and a read
	 * that fails, such as for an email since moved, keeps it.
	 */
	isSummaryComplete?: boolean;
}

/**
 * One email: who sent it and to whom, its text, and its attachments, each of
 * which can be added to the conversation or saved into the insight's files.
 */
export const MailMessageView = ({
	app,
	summary,
	folderName,
	saver,
	onBack,
	onSignIn,
	isSummaryComplete = false,
	isVisible = true,
	onControlsChange,
	focusRequestId,
}: MailMessageViewProps) => {
	const { t, i18n } = useTranslation("connectors");
	const { insightId } = useInsight();
	const query = useConnectorQuery(
		app.pixels.getMail(summary.id),
		parseMailMessageDetail,
	);
	const message =
		query.data?.id === summary.id
			? query.data
			: isSummaryComplete
				? summary
				: null;
	const webUrl = safeHttpsUrl(message?.webLink);
	const serviceName = t(app.nameKey);
	const title = (message ?? summary).subject || t("common.noSubject");
	const noInsightMessage = t("errors.noInsight");
	const { addToContext } = saver;

	/**
	 * How to save the email: its whole thread, read from every folder, when it
	 * belongs to one, or else the email on its own.
	 *
	 * @param full - The email, read in full.
	 * @return The save request.
	 */
	const messageRequest = useCallback(
		(full: MailMessage): ConnectorSaveRequest => {
			const conversationId = full.conversationId;
			if (conversationId) {
				return threadSaveRequest(
					app,
					full.id,
					title,
					full.subject,
					() => {
						if (!insightId) {
							throw new Error(noInsightMessage);
						}
						return readConversation(
							app,
							(pixel) => runConnectorPixel(pixel, insightId),
							conversationId,
						);
					},
				);
			}
			return {
				key: full.id,
				name: title,
				source: {
					kind: "text",
					fileName: mailMessageFileName(full),
					getContent: () => mailMessageToMarkdown(app, full),
				},
			};
		},
		[app, insightId, noInsightMessage, title],
	);
	const handleAddToContext = useCallback(() => {
		if (message) addToContext?.(messageRequest(message));
	}, [addToContext, message, messageRequest]);

	const isMessageBusy = saver.isBusy(summary.id);
	useConnectorControls(
		{
			openIn: webUrl
				? {
						href: webUrl,
						label: t("actions.openIn", {
							service: t(app.appNameKey),
						}),
					}
				: undefined,
			addToContext:
				message && addToContext
					? {
							onAddToContext: handleAddToContext,
							isBusy: isMessageBusy,
						}
					: undefined,
		},
		onControlsChange,
		isVisible,
	);

	return (
		<ConnectorDetailView
			isVisible={isVisible}
			focusRequestId={focusRequestId}
			title={title}
			backLabel={
				folderName
					? t("mail.backTo", { folder: folderName })
					: undefined
			}
			onBack={onBack}
			fields={
				message
					? [
							{
								label: t("mail.from"),
								value: message.from ?? t("mail.unknownSender"),
							},
							{
								label: t("mail.to"),
								value: message.to.join(", "),
							},
							{
								label: t("mail.cc"),
								value: message.cc.join(", "),
							},
							{
								label: t("mail.received"),
								value: formatFullDate(
									message.receivedDate ?? message.sentDate,
									i18n.language,
								),
							},
						]
					: []
			}
			actions={
				message ? (
					<ConnectorActionBar
						serviceName={t(app.appNameKey)}
						webUrl={onControlsChange ? undefined : webUrl}
						saveLabel={saver.saveLabel}
						isBusy={isMessageBusy}
						onAddToContext={
							!onControlsChange && addToContext
								? handleAddToContext
								: undefined
						}
						onSave={() => saver.save(messageRequest(message))}
					/>
				) : null
			}
		>
			{message ? (
				<>
					<ConnectorTextBody
						text={message.body}
						isTruncated={message.isBodyTruncated}
						emptyText={t("mail.noText")}
					/>
					<MailAttachmentList
						app={app}
						messageId={message.id}
						attachments={message.attachments}
						saver={saver}
					/>
				</>
			) : (
				<ConnectorViewerStatus
					query={query}
					serviceName={serviceName}
					account={app.account}
					onSignIn={onSignIn}
					skeletonRows={4}
				/>
			)}
		</ConnectorDetailView>
	);
};
