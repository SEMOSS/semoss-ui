import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ToolViewProps } from "@semoss/shared";
import { Muted } from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";
import { readNonBlankString } from "@semoss/utility/text";
import { ToolCallNotice } from "../components/tool-call-notice";
import { ToolViewCard } from "../components/tool-view-card";
import {
	readArgText,
	readToolAccount,
	readToolResult,
} from "../core/tool-view-call";
import { toViewerHost } from "../core/tool-view-host";
import { useConnectorSaver } from "../core/use-connector-saver";
import { parseMailMessageDetail } from "./mail.parsers";
import type { MailMessage } from "./mail.types";
import { MAIL_APPS } from "./mail-apps";
import { MailChangeApproval } from "./mail-change-approval";
import { MailMessageView } from "./mail-message-view";

/**
 * An email a call returned, read.
 *
 * @param result - The call's parsed result.
 * @return The email, or null when the result is not one.
 */
const readMailMessage = (result: unknown): MailMessage | null => {
	try {
		return parseMailMessageDetail(result);
	} catch {
		return null;
	}
};

/**
 * One email in the conversation. For `GetMail` it is the email the call
 * read, with its attachments; for a move (`intent=move`) or a delete
 * (`intent=delete`) it asks first, naming the email, then says what was
 * done.
 */
export const MailMessageToolView = ({
	call,
	params,
	mode,
	onApprove,
	onDecline,
	host,
}: ToolViewProps) => {
	const { t } = useTranslation("connectors");
	const app = MAIL_APPS[readToolAccount(params, call.functionName)];
	const viewerHost = useMemo(() => toViewerHost(host), [host]);
	const saver = useConnectorSaver(app.service, viewerHost);
	const result = useMemo(() => readToolResult(call), [call]);
	const intent =
		params.intent === "move" || params.intent === "delete"
			? params.intent
			: null;

	if (intent && mode === "approval") {
		return (
			<MailChangeApproval
				app={app}
				intent={intent}
				call={call}
				onApprove={onApprove}
				onDecline={onDecline}
				onSignIn={viewerHost.onSignIn}
			/>
		);
	}
	if (call.status !== "succeeded") {
		return <ToolCallNotice call={call} appName={t(app.appNameKey)} />;
	}
	if (intent) {
		const folder =
			(isRecord(result)
				? readNonBlankString(result.folder)
				: undefined) ?? readArgText(call.arguments, "folder");
		return (
			<ToolViewCard
				brand={app.brand}
				title={t(
					intent === "move"
						? "toolViews.mail.moveTitle"
						: "toolViews.mail.deleteTitle",
				)}
			>
				<output className="block text-sm">
					{intent === "move"
						? t("toolViews.mail.moved", { folder: folder })
						: t("toolViews.mail.deleted")}
				</output>
			</ToolViewCard>
		);
	}

	const message = readMailMessage(result);
	if (!message) {
		return (
			<Muted className="block px-3 py-2">
				{t("toolViews.unreadable")}
			</Muted>
		);
	}
	return (
		<MailMessageView
			app={app}
			summary={message}
			saver={saver}
			onSignIn={viewerHost.onSignIn}
			isSummaryComplete
		/>
	);
};
