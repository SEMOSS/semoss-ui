import { FilePenLine } from "lucide-react";
import { createElement, useSyncExternalStore } from "react";
import { P } from "@semoss/ui/next";
import {
	useWorkbenchPanel,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { EmailDraftEditorForm } from "@/features/connectors/components/email-draft-editor-form";
import { useRoomEmail } from "./room-email.context";

export const ROOM_EMAIL_PANEL_TYPE = "collaboration-email-editor";

interface RoomEmailPanelConfig {
	/** Resolve local edits through the room rather than copying them into a tab. */
	draftId: string;
}

/** An explicit tool-card action opens this retained room email editor. */
function RoomEmailPanel({ id }: WorkbenchPanelProps) {
	const { config } = useWorkbenchPanel<RoomEmailPanelConfig>(id);
	const { store, session, source } = useRoomEmail();
	const memory = useSyncExternalStore(
		store.subscribe,
		store.getSnapshot,
		store.getSnapshot,
	);
	const draft = memory.emailDrafts.find(
		(item) => item.seed.id === config.draftId,
	);
	const original = source?.messages.find(
		(message) => message.id === draft?.seed.sourceUid,
	);
	if (!draft)
		return <P className="p-4">This email draft is no longer available.</P>;
	return (
		<EmailDraftEditorForm
			key={draft.seed.id}
			draft={draft}
			replyContext={
				original
					? { name: original.fromName, address: original.fromAddress }
					: undefined
			}
			actions={session.insight.actions}
			insightId={session.insight.insightId}
			retain={() => session.retain()}
		/>
	);
}

const ROOM_EMAIL_PANEL: WorkbenchPanelConfig<RoomEmailPanelConfig> = {
	name: "Email draft",
	icon: ({ className }) =>
		createElement(FilePenLine, { className, "aria-hidden": true }),
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.draftId === b.draftId,
	content: RoomEmailPanel,
};

/** Add email editing to the standard file/tool dock without opening any panels. */
export const ROOM_EMAIL_PANEL_COMPONENTS = {
	[ROOM_EMAIL_PANEL_TYPE]: ROOM_EMAIL_PANEL,
};
