import { useTranslation } from "@semoss/i18n";
import { getFileIconComponent } from "@semoss/shared";
import { Muted } from "@semoss/ui/next";
import { ConnectorAuthorAvatar } from "../../components/connector-author-avatar";
import { ConnectorItemRow } from "../../components/connector-item-row";
import { ConnectorTextBody } from "../../components/connector-text-body";
import { formatFullDate } from "../../core/connector.format";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../../core/use-connector-saver";
import type { TeamsAttachment, TeamsMessage } from "../microsoft.types";

/** Props for {@link TeamsMessageItem}. */
export interface TeamsMessageItemProps {
	/** The message. */
	message: TeamsMessage;
	/** Saves the message's attachments into the insight. */
	saver: ConnectorSaver;
	/** The app's name, for the open action. */
	serviceName: string;
	/**
	 * How to save one of the message's attachments, or null when it cannot be
	 * saved.
	 */
	getAttachmentRequest: (
		attachment: TeamsAttachment,
	) => ConnectorSaveRequest | null;
}

/**
 * One Teams message in a thread or chat: who wrote it and when, its text, and
 * the files attached to it.
 */
export const TeamsMessageItem = ({
	message,
	saver,
	serviceName,
	getAttachmentRequest,
}: TeamsMessageItemProps) => {
	const { t, i18n } = useTranslation("connectors");
	const files = message.attachments.filter((attachment) => attachment.isFile);

	const author = message.fromName ?? t("teams.someone");

	return (
		<article className="flex min-w-0 flex-col gap-2 border-border border-b py-3 last:border-b-0">
			<div className="flex min-w-0 items-center gap-2">
				<ConnectorAuthorAvatar name={author} />
				<span className="min-w-0 flex-1 truncate font-medium text-sm">
					{author}
				</span>
				<span className="max-w-1/2 shrink-0 text-end text-muted-foreground text-xs">
					{formatFullDate(message.createdDateTime, i18n.language)}
				</span>
			</div>
			{message.isDeleted ? (
				<Muted>{t("teams.deleted")}</Muted>
			) : (
				<ConnectorTextBody
					text={message.body}
					isTruncated={message.isBodyTruncated}
					emptyText={t("teams.noText")}
				/>
			)}
			{files.length > 0 ? (
				<ul
					aria-label={t("teams.attachments")}
					className="flex flex-col"
				>
					{files.map((attachment, index) => {
						const name =
							attachment.name ??
							t("teams.attachment", { number: index + 1 });
						const request = getAttachmentRequest(attachment);
						const itemKey =
							request?.key ?? `${message.id}:${index}`;
						const isBusy = request
							? saver.isBusy(request.key)
							: false;
						const FileIcon = getFileIconComponent(name);
						return (
							<ConnectorItemRow
								key={itemKey}
								itemKey={itemKey}
								icon={<FileIcon className="size-4" />}
								title={name}
								isBusy={isBusy}
								actions={
									request
										? {
												itemName: name,
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
											}
										: null
								}
							/>
						);
					})}
				</ul>
			) : null}
		</article>
	);
};
