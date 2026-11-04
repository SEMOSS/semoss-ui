import type { ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";
import { Muted } from "@semoss/ui/next";
import { ConnectorAuthorAvatar } from "../components/connector-author-avatar";
import { formatFullDate } from "../core/connector.format";
import type { MailMessage } from "./mail.types";

/** Props for {@link MailMessageHeader}. */
export interface MailMessageHeaderProps {
	/** The email. */
	message: MailMessage;
	/** Small controls for the email, such as its picture settings, beside the date. */
	actions?: ReactNode;
}

/**
 * Who sent an email, to whom, and when, the way a mail app heads the email it
 * shows: the sender beside their initials and the date, with their address
 * and the recipients beneath.
 */
export const MailMessageHeader = ({
	message,
	actions,
}: MailMessageHeaderProps) => {
	const { t, i18n } = useTranslation("connectors");
	const sender = message.fromName ?? message.from ?? t("mail.unknownSender");
	const date = message.receivedDate ?? message.sentDate;

	return (
		<header className="flex min-w-0 items-start gap-2 border-border border-b pb-3">
			<ConnectorAuthorAvatar name={sender} />
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3">
					<span className="min-w-0 truncate font-medium text-foreground text-sm">
						{sender}
					</span>
					<span className="flex shrink-0 items-center gap-1">
						{actions}
						{date ? (
							<time
								dateTime={date}
								className="text-muted-foreground text-xs"
							>
								{formatFullDate(date, i18n.language)}
							</time>
						) : null}
					</span>
				</div>
				{message.fromName && message.from ? (
					<Muted className="wrap-anywhere text-xs">
						{message.from}
					</Muted>
				) : null}
				{message.to.length > 0 ? (
					<Muted className="wrap-anywhere text-xs">
						{t("mail.toLine", { to: message.to.join(", ") })}
					</Muted>
				) : null}
				{message.cc.length > 0 ? (
					<Muted className="wrap-anywhere text-xs">
						{t("mail.ccLine", { cc: message.cc.join(", ") })}
					</Muted>
				) : null}
			</div>
		</header>
	);
};
