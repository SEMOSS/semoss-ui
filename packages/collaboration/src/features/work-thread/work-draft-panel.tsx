import { FilePenLine } from "lucide-react";
import { createElement, useSyncExternalStore } from "react";
import { P } from "@semoss/ui/next";
import {
	useWorkbenchPanel,
	type WorkbenchPanelConfig,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { WorkDraftEditor } from "./work-draft-editor";
import { useWorkEmail } from "./work-email.context";

interface DraftPanelConfig {
	draftId: string;
}

/** Resolve the retained draft from its identity, even after closing and reopening its tab. */
export function WorkDraftPanel({ id }: WorkbenchPanelProps) {
	const { config } = useWorkbenchPanel<DraftPanelConfig>(id);
	const { composer, workspace, thread } = useWorkEmail();
	const { state } = useCollaborationSession();
	const memory = useSyncExternalStore(
		composer.subscribe,
		composer.getSnapshot,
		composer.getSnapshot,
	);
	const draft = memory.emailDrafts.find(
		(item) => item.seed.id === config.draftId,
	);
	const original = workspace.messages.find(
		(message) => message.id === draft?.seed.sourceUid,
	);
	const sender = original
		? (state.people.find((person) => person.id === original?.fromId) ??
			thread.participants.find(
				(person) => person.personId === original.fromId,
			))
		: undefined;
	return draft ? (
		<WorkDraftEditor
			key={draft.seed.id}
			draft={draft}
			replyContext={
				sender
					? { name: sender.name, address: sender.email }
					: undefined
			}
		/>
	) : (
		<P className="p-4">This local draft is no longer available.</P>
	);
}

export const WORK_DRAFT_PANEL: WorkbenchPanelConfig<DraftPanelConfig> = {
	name: "Email draft",
	icon: ({ className }) =>
		createElement(FilePenLine, { className, "aria-hidden": true }),
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.draftId === b.draftId,
	content: WorkDraftPanel,
};
