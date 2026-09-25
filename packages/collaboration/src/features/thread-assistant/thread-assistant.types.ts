import type { SourceAttachment } from "@/features/connectors/types";
import type { InsightActions } from "@/lib/pixel";

export interface ThreadAssistantProps {
	/** Stable Work identity used to recover an owned conversation. */
	threadId: string;
	/** Display name saved on a newly created conversation. */
	threadTitle: string;
	/** Exact, already filtered source snapshot for the next request. */
	contextText: string;
	/** Changes whenever model-visible context changes. */
	contextRevision: string;
	/** Connected source content needs a retention notice before the first send. */
	isConnected: boolean;
	/** Opens the host's editable draft review; this callback never sends email. */
	onDraft?: (body: string) => void;
	/** Outlook's native message identity for explicitly selected attachments. */
	sourceUid?: string;
	/** Metadata only; content is fetched after an explicit attachment selection. */
	sourceAttachments?: SourceAttachment[];
	/** Exposes this thread's isolated insight for coordinated file operations. */
	onInsightReady?: (insight: {
		insightId: string;
		actions: InsightActions;
	}) => void;
}
