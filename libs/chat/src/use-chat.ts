import { autorun } from "mobx";
import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import type { ChatOptions } from "./chat-options";
import { ChatSession } from "./chat-session";
import type { ChatMessage, MCPConfig } from "./types";

export interface UseChatResult {
	messages: ChatMessage[];
	isTyping: boolean;
	error: string | null;
	roomId: string | null;
	/** Starts at options.engineId — mutable via setEngineId, e.g. from an EngineSelect next to ChatInput. */
	engineId: string;
	setEngineId: (engineId: string) => void;
	sendMessage: (text: string) => Promise<void>;
	/** True while a resumed room's history (options.roomId) is loading. Always false for a fresh session. */
	isLoadingHistory: boolean;
	/** Thumbs up (true) / down (false) on an assistant response — calling it again with the same rating clears it. */
	recordFeedback: (messageId: string, rating: boolean) => Promise<void>;
	/** Renders an assistant response to a Word/PDF file and triggers a browser download. */
	downloadMessage: (
		messageId: string,
		format: "word" | "pdf",
	) => Promise<void>;
	/** Knowledge/toolbox sources currently attached to this room. Empty until restored from a resumed room or set via setMcp(). */
	mcp: MCPConfig[];
	/** Attach/detach knowledge sources or toolbox tools — e.g. from an McpOverlay's save callback. Persists via the real UpdateRoomOptions pixel once a room exists. */
	setMcp: (mcp: MCPConfig[]) => Promise<void>;
}

/**
 * Headless chat hook — no styling, no rendering, just message state and
 * the transport calls to drive it. The session underneath is a MobX
 * store, but this hook bridges it to plain React re-renders via autorun()
 * so a consuming component works without wrapping in mobx-react-lite's
 * observer() or knowing MobX is involved at all.
 */
export function useChat(options: ChatOptions): UseChatResult {
	const { actions, insightId } = useInsight();
	const sessionRef = useRef<ChatSession | null>(null);
	if (!sessionRef.current) {
		sessionRef.current = new ChatSession(actions, insightId, options);
	}
	const session = sessionRef.current;

	const [, setRenderTick] = useState(0);
	useEffect(() => {
		const dispose = autorun(() => {
			// Reading these fields registers them as MobX dependencies, so
			// this effect re-runs (and re-renders the consumer) whenever any
			// of them change. `revision` (not just messages.length) is what
			// catches in-place mutations like appending streamed text onto
			// an existing message's parts.
			session.messages.length;
			session.isTyping;
			session.error;
			session.roomId;
			session.engineId;
			session.revision;
			session.isLoadingHistory;
			session.mcp.length;
			setRenderTick((tick) => tick + 1);
		});
		return dispose;
	}, [session]);

	return {
		messages: [...session.messages],
		isTyping: session.isTyping,
		error: session.error,
		roomId: session.roomId,
		engineId: session.engineId,
		setEngineId: session.setEngineId,
		sendMessage: session.sendMessage,
		isLoadingHistory: session.isLoadingHistory,
		recordFeedback: session.recordFeedback,
		downloadMessage: session.downloadMessage,
		mcp: [...session.mcp],
		setMcp: session.setMcp,
	};
}
