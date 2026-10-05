import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { ConnectorActionBar } from "../../components/connector-action-bar";
import { ConnectorDetailView } from "../../components/connector-detail-view";
import { ConnectorTextBody } from "../../components/connector-text-body";
import { ConnectorViewerStatus } from "../../components/connector-viewer-status";
import { toPlainText } from "../../core/connector.format";
import { useConnectorQuery } from "../../core/use-connector-query";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../../core/use-connector-saver";
import {
	gmailMessageFileName,
	gmailMessageToMarkdown,
} from "../google.markdown";
import { parseGmailMessage } from "../google.parsers";
import { GOOGLE_PIXELS } from "../google.pixels";
import type { GmailMessage, GmailMessageSummary } from "../google.types";

/**
 * Where an email opens in Gmail.
 *
 * @param messageId - The email.
 * @return The link.
 */
export const getGmailMessageUrl = (messageId: string): string =>
	`https://mail.google.com/mail/u/0/#all/${encodeURIComponent(messageId)}`;

/** Props for {@link GmailMessageDetail}. */
export interface GmailMessageDetailProps {
	/** The email as the list showed it, until the full one is read. */
	summary: GmailMessageSummary;
	/** What the list shows, for the back button. */
	listName: string;
	/** Saves the email into the insight. */
	saver: ConnectorSaver;
	/** Goes back to the list. */
	onBack: () => void;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * One Gmail email: who sent it, when, and its text, read out as plain text
 * when it was sent as HTML.
 */
export const GmailMessageDetail = ({
	summary,
	listName,
	saver,
	onBack,
	onSignIn,
}: GmailMessageDetailProps) => {
	const { t } = useTranslation("connectors");
	// the reactor does not repeat the id, so the parser is made for this one
	const parse = useMemo(() => parseGmailMessage(summary.id), [summary.id]);
	const query = useConnectorQuery(GOOGLE_PIXELS.gmailRead(summary.id), parse);
	const message = query.data;
	const serviceName = t("services.gmail");
	const title = (message ?? summary).subject || t("common.noSubject");

	const request = (full: GmailMessage): ConnectorSaveRequest => ({
		key: full.id,
		name: title,
		source: {
			kind: "text",
			fileName: gmailMessageFileName(full.subject),
			getContent: () => gmailMessageToMarkdown(full),
		},
	});

	return (
		<ConnectorDetailView
			title={title}
			backLabel={t("mail.backTo", { folder: listName })}
			onBack={onBack}
			fields={
				message
					? [
							{
								label: t("mail.from"),
								value: message.from ?? t("mail.unknownSender"),
							},
							{ label: t("mail.to"), value: message.to ?? "" },
							{
								label: t("gmail.sent"),
								value: message.sentDate ?? "",
							},
						]
					: []
			}
			actions={
				message ? (
					<ConnectorActionBar
						serviceName={serviceName}
						saveLabel={saver.saveLabel}
						webUrl={getGmailMessageUrl(message.id)}
						isBusy={saver.isBusy(message.id)}
						onAddToContext={
							saver.addToContext
								? () => saver.addToContext?.(request(message))
								: undefined
						}
						onSave={() => saver.save(request(message))}
					/>
				) : null
			}
		>
			{message ? (
				<ConnectorTextBody
					text={
						message.content
							? toPlainText(message.content)
							: undefined
					}
					emptyText={t("mail.noText")}
				/>
			) : (
				<ConnectorViewerStatus
					query={query}
					serviceName={serviceName}
					account="google"
					onSignIn={onSignIn}
					skeletonRows={4}
				/>
			)}
		</ConnectorDetailView>
	);
};
