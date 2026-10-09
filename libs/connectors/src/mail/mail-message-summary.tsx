import { useTranslation } from "@semoss/i18n";
import { ConnectorViewerStatus } from "../components/connector-viewer-status";
import { formatFullDate } from "../core/connector.format";
import { useConnectorQuery } from "../core/use-connector-query";
import { parseMailMessageDetail } from "./mail.parsers";
import type { MailApp } from "./mail-apps";

/** Props for {@link MailMessageSummary}. */
export interface MailMessageSummaryProps {
	/** The mailbox the email is in. */
	app: MailApp;
	/** The email. */
	messageId: string;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * Which email a call acts on, read from its mailbox: who sent it, its
 * subject, and how it begins, so the user knows what they approve.
 */
export const MailMessageSummary = ({
	app,
	messageId,
	onSignIn,
}: MailMessageSummaryProps) => {
	const { t, i18n } = useTranslation("connectors");
	const query = useConnectorQuery(
		messageId ? app.pixels.getMail(messageId) : null,
		parseMailMessageDetail,
	);
	const message = query.data;

	if (!message) {
		return (
			<ConnectorViewerStatus
				query={query}
				serviceName={t(app.nameKey)}
				account={app.account}
				onSignIn={onSignIn}
				skeletonRows={2}
			/>
		);
	}

	const fields = [
		{
			label: t("mail.from"),
			value: message.fromName ?? message.from ?? t("mail.unknownSender"),
		},
		{ label: t("mail.to"), value: message.to.join(", ") },
		{
			label: t("toolViews.mail.subject"),
			value: message.subject || t("common.noSubject"),
		},
		{
			label: t("mail.received"),
			value: formatFullDate(
				message.receivedDate ?? message.sentDate,
				i18n.language,
			),
		},
	].filter((field) => field.value.trim() !== "");

	return (
		<div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-2">
			<dl className="flex flex-col gap-1 text-sm">
				{fields.map((field) => (
					<div key={field.label} className="flex min-w-0 gap-2">
						<dt className="shrink-0 text-muted-foreground">
							{field.label}
						</dt>
						<dd className="wrap-anywhere min-w-0">{field.value}</dd>
					</div>
				))}
			</dl>
			{message.body ? (
				<p className="wrap-anywhere line-clamp-4 whitespace-pre-line text-muted-foreground text-sm">
					{message.body}
				</p>
			) : null}
		</div>
	);
};
