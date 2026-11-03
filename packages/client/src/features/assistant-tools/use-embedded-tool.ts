import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MCPToolRequest } from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";
import type { AssistantToolResult } from "@/api/assistant-tools";
import { useAssistant } from "@/hooks/use-assistant";
import type { BuildRun, BuildTool } from "@/stores/assistant/assistant.runs";
import { readEmbeddedToolResult } from "./assistant-tool-bridge";

interface EmbeddedToolState {
	/** Keep the submitted page at its original URL while its result reconciles. */
	url: string;
	/** A different invocation gets a fresh frame, even when its URL is shared. */
	frameKey: string;
	frameRef: RefObject<HTMLIFrameElement | null>;
	onLoad: () => void;
	error: string | null;
	isSubmitting: boolean;
	/** A native frame load error keeps arguments/result usable. */
	hasFailed: boolean;
	/** Whether this page has completed its frame load. */
	hasLoaded: boolean;
	retry: () => void;
}

interface EmbeddedToolPage {
	invocation: string;
	actionId: string | undefined;
	url: string;
	request: MCPToolRequest;
}

/** Own the frame protocol, listener lifetime, and retry of an already produced result. */
export const useEmbeddedTool = (
	resolvedUrl: string,
	run: BuildRun,
	tool: BuildTool,
): EmbeddedToolState => {
	const frameRef = useRef<HTMLIFrameElement>(null);
	const [loadedFrame, setLoadedFrame] = useState<string | null>(null);
	const sentContext = useRef<string | null>(null);
	const lifetime = useRef<AbortController | null>(null);
	const [failure, setFailure] = useState<{
		result: AssistantToolResult;
		message: string;
	} | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [failedFrame, setFailedFrame] = useState<string | null>(null);
	const [submittedPage, setSubmittedPage] = useState<EmbeddedToolPage | null>(
		null,
	);
	const respondToolView = useAssistant((state) => state.respondToolView);
	const action = run.pendingActions.find(
		(action) => action.toolCallId === tool.id,
	);
	const invocation = JSON.stringify([run.runId, run.roomId, tool.id]);
	// Once the page returns a result, it owns the displayed form/result. Pending
	// metadata disappearing or durable output arriving must not reload or reinit it.
	// A different call or approval action still gets its own current context.
	const page: EmbeddedToolPage =
		submittedPage?.invocation === invocation &&
		(!action || action.actionId === submittedPage.actionId)
			? submittedPage
			: {
					invocation,
					actionId: action?.actionId,
					url: resolvedUrl,
					request: {
						type: "MCP",
						id: tool.id,
						name: tool.name,
						message:
							tool.messageId ?? action?.parentMessageId ?? "",
						roomId: run.roomId,
						parameters: tool.arguments ?? {},
						executedParameters: tool.arguments ?? {},
						original_name:
							typeof tool.metadata?.SMSS_ORIGINAL_TOOL_NAME ===
							"string"
								? tool.metadata.SMSS_ORIGINAL_TOOL_NAME
								: tool.name,
						_meta: tool.metadata,
						tool_response: tool.output,
					},
				};
	const { url, request } = page;
	const frameKey = JSON.stringify([invocation, url]);
	const { id, name, message, roomId } = request;
	const origin = url ? new URL(url, window.location.href).origin : "";

	useEffect(() => {
		const controller = new AbortController();
		lifetime.current = controller;
		return () => controller.abort();
	}, []);

	const submit = useCallback(
		async (result: AssistantToolResult): Promise<void> => {
			const signal = lifetime.current?.signal;
			setSubmittedPage(page);
			setIsSubmitting(true);
			setFailure(null);
			try {
				await respondToolView(run.runId, tool.id, result);
			} catch (error) {
				if (!signal?.aborted)
					setFailure({ result, message: getErrorMessage(error) });
			} finally {
				if (!signal?.aborted) setIsSubmitting(false);
			}
		},
		[page, respondToolView, run.runId, tool.id],
	);

	// Compare the wire context by value: polling recreates objects even when the
	// invocation is unchanged, and repeated init messages can reset UI drafts.
	const context = JSON.stringify({
		type: "SMSS_INIT_TOOL",
		tool: request,
	});
	const sendContext = useCallback(
		(isFrameLoad = false) => {
			if (!url || (!isFrameLoad && sentContext.current === context))
				return;
			frameRef.current?.contentWindow?.postMessage(
				JSON.parse(context),
				origin,
			);
			sentContext.current = context;
		},
		[context, origin, url],
	);

	useEffect(() => {
		const frame = frameRef.current;
		if (!frame || !url) return;
		const handleError = (): void => setFailedFrame(frameKey);
		frame.addEventListener("error", handleError);
		return () => frame.removeEventListener("error", handleError);
	}, [frameKey, url]);

	useEffect(() => {
		if (loadedFrame === frameKey) sendContext();
	}, [frameKey, loadedFrame, sendContext]);
	useEffect(() => {
		if (!url || failedFrame === frameKey) return;
		const handleMessage = (event: MessageEvent<unknown>): void => {
			const result = readEmbeddedToolResult(
				event,
				frameRef.current?.contentWindow ?? null,
				origin,
				{ id, name, roomId, message },
			);
			if (result) void submit(result);
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [failedFrame, frameKey, id, message, name, origin, roomId, submit, url]);

	return {
		url,
		frameKey,
		frameRef,
		onLoad: () => {
			setLoadedFrame(frameKey);
			sendContext(true);
		},
		error: failure?.message ?? null,
		isSubmitting,
		hasFailed: failedFrame === frameKey,
		hasLoaded: loadedFrame === frameKey,
		retry: () => {
			if (failure) void submit(failure.result);
		},
	};
};
