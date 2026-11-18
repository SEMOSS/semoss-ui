import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, Muted } from "@semoss/ui/next";
import { ConnectorAuthorAvatar } from "../components/connector-author-avatar";
import { ConnectorTextBody } from "../components/connector-text-body";
import { ConnectorViewerStatus } from "../components/connector-viewer-status";
import { formatFullDate } from "../core/connector.format";
import { toTextSnippet } from "../core/connector-markdown";
import { useConnectorQuery } from "../core/use-connector-query";
import type { ConnectorSaver } from "../core/use-connector-saver";
import { parseMailMessageDetail } from "./mail.parsers";
import { getOwnText } from "./mail.threads";
import type { MailMessage } from "./mail.types";
import type { MailApp } from "./mail-apps";
import { MailAttachmentList } from "./mail-attachment-list";
import { hasMailHtmlPictures } from "./mail-html";
import { MailHtmlBody } from "./mail-html-body";
import { MailPicturesMenu } from "./mail-pictures-menu";
import { useMailEmbeddedImagesReader } from "./use-mail-embedded-images-reader";

/** Props for {@link MailThreadMessage}. */
interface MailThreadMessageProps {
	/** The mailbox the email is in. */
	app: MailApp;
	/** The email, read with its body. */
	message: MailMessage;
	/** Whether it starts open, as the newest email of a thread does. */
	isInitiallyExpanded: boolean;
	/** Saves its attachments into the insight. */
	saver: ConnectorSaver;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * One email in a thread, set apart from the others the way a mail app shows a
 * conversation. Closed, it shows who wrote it, when, and how it starts. Open,
 * it shows its own part without the earlier emails it quotes, which the whole
 * email can be shown with, and its attachments. Opening it reads the email
 * again, so it shows with its own formatting once that arrives, its text
 * standing in until then.
 */
export const MailThreadMessage = ({
	app,
	message,
	isInitiallyExpanded,
	saver,
	onSignIn,
}: MailThreadMessageProps) => {
	const { t, i18n } = useTranslation("connectors");
	const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
	const [isWholeEmailShown, setIsWholeEmailShown] = useState(false);
	const contentId = useId();
	const sender = message.fromName ?? message.from ?? t("mail.unknownSender");
	const own = getOwnText(message);
	const wholeText = message.body?.trim() ?? "";
	// what the body has beyond this email's own text is what it quotes
	const hasQuotedHistory = wholeText.length > own.text.length;

	// opening an email reads it again for its formatted body and for what its
	// attachments are, since a listing says only whether it has any
	const detailQuery = useConnectorQuery(
		isExpanded
			? app.pixels.getMail(message.id, { includeDisplayBody: true })
			: null,
		parseMailMessageDetail,
	);
	const displayBody = detailQuery.data?.displayBody;
	const hasPictures = useMemo(
		() => hasMailHtmlPictures(displayBody),
		[displayBody],
	);
	const readEmbeddedImages = useMailEmbeddedImagesReader(app, message.id);
	const Chevron = isExpanded ? ChevronDownIcon : ChevronRightIcon;
	// the text shows at once, and stands in when the email has no formatting
	const textBody = (
		<>
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
		</>
	);

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
					{message.to.length > 0 ||
					message.cc.length > 0 ||
					hasPictures ? (
						// the picture settings sit under the date, at the end
						// of the recipients, since the date is part of the
						// button that opens and closes the email
						<div className="flex min-w-0 items-start gap-2">
							<div className="flex min-w-0 flex-1 flex-col gap-0.5">
								{message.to.length > 0 ? (
									<Muted className="wrap-anywhere">
										{t("mail.toLine", {
											to: message.to.join(", "),
										})}
									</Muted>
								) : null}
								{message.cc.length > 0 ? (
									<Muted className="wrap-anywhere">
										{t("mail.ccLine", {
											cc: message.cc.join(", "),
										})}
									</Muted>
								) : null}
							</div>
							{hasPictures ? <MailPicturesMenu /> : null}
						</div>
					) : null}
					{displayBody?.contentType === "html" ? (
						<MailHtmlBody
							html={displayBody.content}
							title={t("mail.htmlFrame", { from: sender })}
							fallback={textBody}
							onLoadEmbeddedImages={readEmbeddedImages}
						/>
					) : (
						textBody
					)}
					{detailQuery.data ? (
						<MailAttachmentList
							app={app}
							messageId={message.id}
							attachments={detailQuery.data.attachments}
							saver={saver}
						/>
					) : detailQuery.status === "loading" ? (
						message.hasAttachments ? (
							<Muted>{t("mail.loadingAttachments")}</Muted>
						) : null
					) : (
						<ConnectorViewerStatus
							query={detailQuery}
							serviceName={t(app.nameKey)}
							account={app.account}
							onSignIn={onSignIn}
						/>
					)}
				</div>
			) : null}
		</article>
	);
};
