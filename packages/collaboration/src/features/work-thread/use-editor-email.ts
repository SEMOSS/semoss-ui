import { useSyncExternalStore } from "react";
import type { EmailDraftInput } from "@/features/connectors/types";
import type { WorkComposerSession } from "./work-composer-session";

const noSubscription = () => () => undefined;

/** What an open editor email holds now, so a card names its real recipients. */
export function useEditorEmail(
	composer: WorkComposerSession | undefined,
	editorId: string | undefined,
): { mode: EmailDraftInput["mode"]; to: string; subject: string } | undefined {
	const draft = useSyncExternalStore(
		composer?.subscribe ?? noSubscription,
		() =>
			editorId
				? composer
						?.getSnapshot()
						.emailDrafts.find((item) => item.seed.id === editorId)
				: undefined,
	);
	const values = useSyncExternalStore(
		draft?.subscribe ?? noSubscription,
		() => draft?.getSnapshot().values,
	);
	return draft && values
		? { mode: draft.seed.mode, to: values.to, subject: values.subject }
		: undefined;
}
