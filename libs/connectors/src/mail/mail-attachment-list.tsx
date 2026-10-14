import { useTranslation } from "@semoss/i18n";
import { getFileIconComponent } from "@semoss/shared";
import { Muted } from "@semoss/ui/next";
import { ConnectorItemRow } from "../components/connector-item-row";
import { formatConnectorSize } from "../core/connector.format";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../core/use-connector-saver";
import { readMailSavedPath } from "./mail.parsers";
import type { MailAttachment } from "./mail.types";
import type { MailApp } from "./mail-apps";

/** Props for {@link MailAttachmentList}. */
export interface MailAttachmentListProps {
	/** The mailbox the email is in. */
	app: MailApp;
	/** The email the attachments belong to. */
	messageId: string;
	/** Its attachments, as `GetMail` read them. */
	attachments: MailAttachment[];
	/** Saves the attachments into the insight. */
	saver: ConnectorSaver;
}

/**
 * An email's file attachments, each of which can be added to the
 * conversation or saved into the insight's files. Pictures placed inside the
 * text, and attachments without bytes of their own, are left out. Renders
 * nothing when no file is left.
 */
export const MailAttachmentList = ({
	app,
	messageId,
	attachments,
	saver,
}: MailAttachmentListProps) => {
	const { t, i18n } = useTranslation("connectors");
	const files = attachments.filter(
		(attachment) => attachment.kind === "file" && !attachment.isInline,
	);

	if (files.length === 0) {
		return null;
	}

	const attachmentRequest = (
		attachment: MailAttachment,
	): ConnectorSaveRequest => ({
		key: `${messageId}:${attachment.id}`,
		name: attachment.name,
		source: {
			kind: "download",
			readSavedPath: readMailSavedPath,
			fileName: attachment.name,
			buildPixel: (fileName) =>
				app.pixels.downloadAttachment({
					messageId: messageId,
					attachmentId: attachment.id,
					fileName: fileName,
				}),
		},
	});

	return (
		<section
			aria-label={t("mail.attachments")}
			className="flex flex-col gap-1"
		>
			<Muted>{t("mail.attachments")}</Muted>
			<ul className="flex flex-col">
				{files.map((attachment) => {
					const request = attachmentRequest(attachment);
					const isBusy = saver.isBusy(request.key);
					const FileIcon = getFileIconComponent(attachment.name);
					return (
						<ConnectorItemRow
							key={attachment.id}
							itemKey={request.key}
							icon={<FileIcon className="size-4" />}
							title={attachment.name}
							meta={
								attachment.size !== undefined
									? formatConnectorSize(
											attachment.size,
											i18n.language,
										)
									: undefined
							}
							isBusy={isBusy}
							actions={{
								itemName: attachment.name,
								serviceName: t(app.nameKey),
								saveLabel: saver.saveLabel,
								isBusy: isBusy,
								onAddToContext: saver.addToContext
									? () => saver.addToContext?.(request)
									: undefined,
								onSave: () => saver.save(request),
							}}
						/>
					);
				})}
			</ul>
		</section>
	);
};
