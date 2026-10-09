import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ToolViewProps } from "@semoss/shared";
import { ToolApprovalActions } from "../components/tool-approval-actions";
import { ToolCallNotice } from "../components/tool-call-notice";
import { ToolViewCard } from "../components/tool-view-card";
import { readArgText, readToolAccount } from "../core/tool-view-call";
import { toViewerHost } from "../core/tool-view-host";
import { useToolDecision } from "../core/use-tool-decision";
import { MAIL_APPS } from "./mail-apps";
import { readMailComposeKind } from "./mail-compose";
import { MailComposeForm } from "./mail-compose-form";
import { MailComposeReceipt } from "./mail-compose-receipt";
import { MailMessageSummary } from "./mail-message-summary";

/**
 * An email the agent sends or saves: `SendMail`, `SaveDraft`, `ReplyMail`,
 * and `ForwardMail` (`intent` of `send`, `draft`, `reply`, `forward`), and
 * `SendDraft`. While the call waits it is an editable form, except a saved
 * draft, which is shown as it is; once it ran, it is what was sent or saved.
 */
export const MailComposeToolView = ({
	call,
	params,
	mode,
	onApprove,
	onDecline,
	onRespond,
	host,
}: ToolViewProps) => {
	const { t } = useTranslation("connectors");
	const app = MAIL_APPS[readToolAccount(params, call.functionName)];
	const viewerHost = useMemo(() => toViewerHost(host), [host]);
	const decision = useToolDecision();
	const kind = readMailComposeKind(params, call.functionName);

	if (mode === "approval" && kind === "sendDraft") {
		return (
			<ToolViewCard
				brand={app.brand}
				title={t("toolViews.mail.sendDraftTitle")}
			>
				<MailMessageSummary
					app={app}
					messageId={readArgText(call.arguments, "id")}
					onSignIn={viewerHost.onSignIn}
				/>
				<ToolApprovalActions
					approveLabel={t("toolViews.mail.send")}
					isBusy={decision.pending !== null}
					isApproving={decision.pending === "approve"}
					error={decision.error}
					onApprove={() =>
						decision.decide("approve", () => onApprove())
					}
					onDeny={() => decision.decide("deny", onDecline)}
				/>
			</ToolViewCard>
		);
	}
	if (mode === "approval" && kind !== "sendDraft") {
		return (
			<MailComposeForm
				app={app}
				kind={kind}
				call={call}
				onApprove={onApprove}
				onDecline={onDecline}
				onRespond={onRespond}
			/>
		);
	}
	if (call.status !== "succeeded") {
		return <ToolCallNotice call={call} appName={t(app.appNameKey)} />;
	}
	return <MailComposeReceipt app={app} call={call} />;
};
