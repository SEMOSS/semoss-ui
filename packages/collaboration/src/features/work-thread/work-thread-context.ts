import { type ComponentProps, createContext, useContext } from "react";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import type { ThreadContextPanel } from "./thread-context-panel";

export interface WorkThreadContextValue {
	/** Live session data stays outside the dock's serializable configuration. */
	session: ThreadSession;
	snapshot: ReturnType<ThreadSession["getSnapshot"]>;
	title: string;
	/** Source-free chat omits the source-thread navigation and email panes. */
	conversationKind?: "chat" | "source-thread";
	/** Reveal the selected panel and return to its trigger when the workspace closes. */
	onOpenPanel?: (trigger?: HTMLElement | null) => void;
	settingsSection?: "chat" | "thread" | "advanced";
	setSettingsSection?: (section: "chat" | "thread" | "advanced") => void;
	onEmailSent?: () => void;
	contextPanel: ComponentProps<typeof ThreadContextPanel>;
}
export const WorkThreadContext = createContext<WorkThreadContextValue | null>(
	null,
);

/** Read the host-owned thread from a docked panel. */
export function useWorkThread(): WorkThreadContextValue {
	const value = useContext(WorkThreadContext);
	if (!value) throw new Error("Work panels require a thread context.");
	return value;
}
