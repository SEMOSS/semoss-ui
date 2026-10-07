import type { ReactNode } from "react";
import type { EmailDraftEditor } from "@/features/connectors/api/email-draft-editor";
import { EmailDraftEditorForm } from "@/features/connectors/components/email-draft-editor-form";
import type { EmailReplyContext } from "@/features/connectors/components/email-reply-field";
import { useWorkThread } from "./work-thread-context";

/** The thread owns its retained editor and keeps the insight alive during email writes. */
export function WorkDraftEditor({
	draft,
	replyContext,
	assistantContent,
}: {
	draft: EmailDraftEditor;
	replyContext?: EmailReplyContext;
	assistantContent?: ReactNode;
}) {
	const { session, onEmailSent } = useWorkThread();
	return (
		<EmailDraftEditorForm
			draft={draft}
			replyContext={replyContext}
			assistantContent={assistantContent}
			actions={session.insight.actions}
			insightId={session.insight.insightId}
			retain={() => session.retain()}
			onEmailSent={onEmailSent}
		/>
	);
}
