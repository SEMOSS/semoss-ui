import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { ConnectorActionBar } from "../../components/connector-action-bar";
import { ConnectorDetailView } from "../../components/connector-detail-view";
import { ConnectorTextBody } from "../../components/connector-text-body";
import { ConnectorViewerStatus } from "../../components/connector-viewer-status";
import { formatFullDate } from "../../core/connector.format";
import { runConnectorPixel } from "../../core/connector-pixel";
import { useConnectorQuery } from "../../core/use-connector-query";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../../core/use-connector-saver";
import {
	outlookMessageFileName,
	outlookMessageToMarkdown,
} from "../microsoft.markdown";
import { parseMailMessageDetail } from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { OutlookMessage } from "../microsoft.types";
import { OutlookAttachmentList } from "./outlook-attachment-list";
import { readConversation, threadSaveRequest } from "./outlook-thread-detail";

/** Props for {@link OutlookMailDetail}. */
export interface OutlookMailDetailProps {
	/** The email as the list showed it, until the full one is read. */
	summary: OutlookMessage;
	/** Where the list is, for the back button. */
	folderName: string;
	/** Saves the email and its attachments into the insight. */
	saver: ConnectorSaver;
	/** Goes back to the list. */
	onBack: () => void;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * One email: who sent it and to whom, its text, and its attachments, each of
 * which can be added to the conversation or saved into the insight's files.
 */
export const OutlookMailDetail = ({
	summary,
	folderName,
	saver,
	onBack,
	onSignIn,
}: OutlookMailDetailProps) => {
	const { t, i18n } = useTranslation("connectors");
	const { insightId } = useInsight();
	const query = useConnectorQuery(
		MICROSOFT_PIXELS.outlookGetMail(summary.uid),
		parseMailMessageDetail,
	);
	const message = query.data;
	const serviceName = t("services.outlookMail");
	const title = (message ?? summary).subject || t("common.noSubject");

	/**
	 * How to save the email: its whole thread, read from every folder, when it
	 * belongs to one, or else the email on its own.
	 *
	 * @param full - The email, read in full.
	 * @return The save request.
	 */
	const messageRequest = (full: OutlookMessage): ConnectorSaveRequest => {
		const conversationId = full.conversationId;
		if (conversationId) {
			return threadSaveRequest(full.uid, title, full.subject, () => {
				if (!insightId) {
					throw new Error(t("errors.noInsight"));
				}
				return readConversation(
					(pixel) => runConnectorPixel(pixel, insightId),
					conversationId,
				);
			});
		}
		return {
			key: full.uid,
			name: title,
			source: {
				kind: "text",
				fileName: outlookMessageFileName(full),
				getContent: () => outlookMessageToMarkdown(full),
			},
		};
	};

	const isMessageBusy = saver.isBusy(summary.uid);

	return (
		<ConnectorDetailView
			title={title}
			backLabel={t("mail.backTo", { folder: folderName })}
			onBack={onBack}
			fields={
				message
					? [
							{
								label: t("mail.from"),
								value: message.from ?? t("mail.unknownSender"),
							},
							{ label: t("mail.to"), value: message.to ?? "" },
							{ label: t("mail.cc"), value: message.cc ?? "" },
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
						serviceName={serviceName}
						saveLabel={saver.saveLabel}
						isBusy={isMessageBusy}
						onAddToContext={
							saver.addToContext
								? () =>
										saver.addToContext?.(
											messageRequest(message),
										)
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
					<OutlookAttachmentList
						uid={message.uid}
						attachments={message.attachments}
						saver={saver}
					/>
				</>
			) : (
				<ConnectorViewerStatus
					query={query}
					serviceName={serviceName}
					onSignIn={onSignIn}
					skeletonRows={4}
				/>
			)}
		</ConnectorDetailView>
	);
};
