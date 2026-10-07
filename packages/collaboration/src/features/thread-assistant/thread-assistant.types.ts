import type { ReactNode } from "react";
import type { ThreadContext } from "@/features/collaboration/state/collaboration.types";
import type { SourceAttachment } from "@/features/connectors/types";
import type { ToolWorkbenchProviderProps } from "@/features/tools/components/tool-workbench-provider";
import type { InsightActions } from "@/lib/pixel";
import type { ThreadSession } from "./thread-session";

export interface ThreadAssistantProps {
	/** Work supplies its own panels without changing the generic room dock. */
	workbench?: Pick<
		ToolWorkbenchProviderProps,
		"components" | "createLayout" | "defaultOpen" | "panelTarget"
	>;
	/** Work host composes a single transcript and persistent dock around the session. */
	renderWorkspace?: (
		session: ThreadSession,
		snapshot: ReturnType<ThreadSession["getSnapshot"]>,
	) => ReactNode;
	/** Stable Work identity used to recover an owned conversation. */
	threadId: string;
	/** Display name saved on a newly created conversation. */
	threadTitle: string;
	/** Exact, already filtered source snapshot for the next request. */
	context?: ThreadContext;
	/** Compatibility for hosts that still supply a serialized source snapshot. */
	contextText?: string;
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
