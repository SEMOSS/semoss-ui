import { ExternalLinkIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import type { ToolViewCall } from "@semoss/shared";
import { Button, Muted } from "@semoss/ui/next";
import { ConnectorTextBody } from "../components/connector-text-body";
import { ToolViewCard } from "../components/tool-view-card";
import { toPlainText } from "../core/connector.format";
import { readToolOutcome, readToolResult } from "../core/tool-view-call";
import { parseMailReceipt } from "./mail.parsers";
import type { MailApp } from "./mail-apps";

/** Props for {@link MailComposeReceipt}. */
export interface MailComposeReceiptProps {
	/** The mailbox the email went out from. */
	app: MailApp;
	/** The call, which succeeded. */
	call: ToolViewCall;
}

/**
 * What a compose call did: the email as it was sent or saved as a draft,
 * from what the reactor reported. When the user ran the other operation in
 * place of the call, it says so.
 */
export const MailComposeReceipt = ({ app, call }: MailComposeReceiptProps) => {
	const { t } = useTranslation("connectors");
	const result = readToolResult(call);
	const outcome = readToolOutcome(result);
	const receipt = parseMailReceipt(outcome ? outcome.result : result);
	const appName = t(app.appNameKey);

	if (!receipt) {
		return (
			<Muted className="block px-3 py-2">
				{outcome?.summary ?? t("toolViews.unreadable")}
			</Muted>
		);
	}

	const fields = [
		{ label: t("mail.to"), value: receipt.to.join(", ") },
		{ label: t("mail.cc"), value: receipt.cc.join(", ") },
		{ label: t("toolViews.mail.bcc"), value: receipt.bcc.join(", ") },
		{
			label: t("toolViews.mail.subject"),
			value: receipt.subject ?? t("common.noSubject"),
		},
	].filter((field) => field.value !== "");

	return (
		<ToolViewCard
			brand={app.brand}
			title={t(
				receipt.isSent
					? "toolViews.mail.sent"
					: "toolViews.mail.draftSaved",
			)}
		>
			{outcome ? (
				<output className="block text-sm">
					{t(
						receipt.isSent
							? "toolViews.mail.sentInstead"
							: "toolViews.mail.savedAsDraftInstead",
						{ app: appName },
					)}
				</output>
			) : null}
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
			<ConnectorTextBody
				text={
					receipt.isHtml && receipt.body
						? toPlainText(receipt.body)
						: receipt.body
				}
				emptyText={t("mail.noText")}
			/>
			{receipt.attachments.length > 0 ? (
				<Muted className="wrap-anywhere text-xs">
					{t("toolViews.mail.attached", {
						names: receipt.attachments.join(", "),
					})}
				</Muted>
			) : null}
			{receipt.webLink ? (
				<div className="flex justify-end">
					<Button variant="ghost" size="sm" asChild>
						<a
							href={receipt.webLink}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLinkIcon aria-hidden />
							{t("actions.openIn", { service: appName })}
						</a>
					</Button>
				</div>
			) : null}
		</ToolViewCard>
	);
};
