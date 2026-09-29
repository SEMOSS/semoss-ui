import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, Muted } from "@semoss/ui/next";
import { ConnectorAuthorAvatar } from "../../components/connector-author-avatar";
import { ConnectorTextBody } from "../../components/connector-text-body";
import { ConnectorViewerStatus } from "../../components/connector-viewer-status";
import { formatFullDate } from "../../core/connector.format";
import { toTextSnippet } from "../../core/connector-markdown";
import { useConnectorQuery } from "../../core/use-connector-query";
import type { ConnectorSaver } from "../../core/use-connector-saver";
import { parseMailMessageDetail } from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { OutlookMessage } from "../microsoft.types";
import { OutlookAttachmentList } from "./outlook-attachment-list";
import { getOwnText } from "./outlook-mail.threads";

/** Props for {@link OutlookThreadMessage}. */
export interface OutlookThreadMessageProps {
	/** The email, read with its body. */
	message: OutlookMessage;
	/** Whether it starts open, as the newest email of a thread does. */
	isInitiallyExpanded: boolean;
	/** Saves its attachments into the insight. */
	saver: ConnectorSaver;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * One email in a thread, set apart from the others the way Outlook shows a
 * conversation. Closed, it shows who wrote it, when, and how it starts. Open,
 * it shows its own text without the earlier emails it quotes, which the whole
 * email can be shown with, and its attachments, read the first time it opens.
 */
export const OutlookThreadMessage = ({
	message,
	isInitiallyExpanded,
	saver,
	onSignIn,
}: OutlookThreadMessageProps) => {
	const { t, i18n } = useTranslation("connectors");
	const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
	const [isWholeEmailShown, setIsWholeEmailShown] = useState(false);
	const contentId = useId();
	const sender = message.fromName ?? message.from ?? t("mail.unknownSender");
	const own = getOwnText(message);
	const wholeText = message.body?.trim() ?? "";
	// what the body has beyond this email's own text is what it quotes
	const hasQuotedHistory = wholeText.length > own.text.length;

	// a listing says whether there are attachments, not what they are
	const attachmentsQuery = useConnectorQuery(
		isExpanded && message.hasAttachments
			? MICROSOFT_PIXELS.outlookGetMail(message.uid)
			: null,
		parseMailMessageDetail,
	);
	const Chevron = isExpanded ? ChevronDownIcon : ChevronRightIcon;

	return (
		<article className="flex min-w-0 flex-col gap-2 rounded-md border border-border p-3">
			<Button
				variant="ghost"
				className="h-auto min-w-0 justify-start gap-2 px-1 py-1 text-start font-normal"
				aria-expanded={isExpanded}
				aria-controls={contentId}
				onClick={() => setIsExpanded((previous) => !previous)}
			>
				<Chevron aria-hidden className="size-4 shrink-0" />
				<ConnectorAuthorAvatar name={sender} />
				<span className="flex min-w-0 flex-1 flex-col">
					<span className="truncate font-medium text-foreground text-sm">
						{sender}
					</span>
					{isExpanded ? (
						message.fromName && message.from ? (
							<span className="truncate text-muted-foreground text-xs">
								{message.from}
							</span>
						) : null
					) : (
						<span className="truncate text-muted-foreground text-xs">
							{toTextSnippet(own.text, 120) || t("mail.noText")}
						</span>
					)}
				</span>
				<span className="shrink-0 text-muted-foreground text-xs">
					{formatFullDate(
						message.receivedDate ?? message.sentDate,
						i18n.language,
					)}
				</span>
			</Button>
			{isExpanded ? (
				<div
					id={contentId}
					className="flex min-w-0 flex-col gap-2 px-1"
				>
					{message.to ? (
						<Muted className="wrap-anywhere">
							{t("mail.toLine", { to: message.to })}
						</Muted>
					) : null}
					{message.cc ? (
						<Muted className="wrap-anywhere">
							{t("mail.ccLine", { cc: message.cc })}
						</Muted>
					) : null}
					<ConnectorTextBody
						text={isWholeEmailShown ? wholeText : own.text}
						isTruncated={
							isWholeEmailShown
								? message.isBodyTruncated
								: own.isTruncated
						}
						emptyText={t("mail.noText")}
					/>
					{hasQuotedHistory ? (
						<Button
							variant="ghost"
							size="sm"
							className="self-start"
							aria-pressed={isWholeEmailShown}
							onClick={() =>
								setIsWholeEmailShown((previous) => !previous)
							}
						>
							{isWholeEmailShown
								? t("mail.hideQuoted")
								: t("mail.showQuoted")}
						</Button>
					) : null}
					{attachmentsQuery.data ? (
						<OutlookAttachmentList
							uid={message.uid}
							attachments={attachmentsQuery.data.attachments}
							saver={saver}
						/>
					) : attachmentsQuery.status === "loading" ? (
						<Muted>{t("mail.loadingAttachments")}</Muted>
					) : (
						<ConnectorViewerStatus
							query={attachmentsQuery}
							serviceName={t("services.outlookMail")}
							onSignIn={onSignIn}
						/>
					)}
				</div>
			) : null}
		</article>
	);
};
