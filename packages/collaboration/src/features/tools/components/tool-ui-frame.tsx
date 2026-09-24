import { useCallback, useEffect, useRef, useState } from "react";
import type { MCPToolRequest } from "@semoss/sdk";
import { Alert, AlertDescription, Skeleton } from "@semoss/ui/next";
import type { ConversationTool } from "@/features/messages/types/message";
import { useToolWorkbench } from "../tool-workbench.context";
import { readToolFrameResponse } from "../utils/tool-frame-message";

interface ToolUiFrameProps {
	tool: ConversationTool;
	url: string;
}

function targetOrigin(url: string): string {
	try {
		return new URL(url, window.location.origin).origin;
	} catch {
		return window.location.origin;
	}
}

/** Load a tool-provided UI and initialize it with the Playground MCP contract. */
export function ToolUiFrame({ tool, url }: ToolUiFrameProps) {
	const { roomId, pendingApprovals, onApproveTool, onRejectTool } =
		useToolWorkbench();
	const action = pendingApprovals.find((entry) => entry.toolId === tool.id);
	const decidingRef = useRef(false);
	const completedActions = useRef(new Set<string>());
	const [error, setError] = useState<string | null>(null);
	const frameRef = useRef<HTMLIFrameElement>(null);
	const isReadyRef = useRef(false);
	const [isLoading, setIsLoading] = useState(true);
	const parameters = tool.arguments;

	const sendContext = useCallback(() => {
		const originalName = tool.metadata?.SMSS_ORIGINAL_TOOL_NAME;
		frameRef.current?.contentWindow?.postMessage(
			{
				type: "SMSS_INIT_TOOL",
				tool: {
					type: "MCP",
					message: tool.parentMessageId,
					id: tool.id,
					name: tool.name,
					parameters,
					roomId: tool.roomId ?? roomId,
					original_name:
						typeof originalName === "string"
							? originalName
							: tool.name,
					tool_response: tool.output,
					executedParameters: parameters,
					_meta: tool.metadata,
				} satisfies MCPToolRequest,
			},
			targetOrigin(url),
		);
	}, [parameters, roomId, tool, url]);

	useEffect(() => {
		if (isReadyRef.current) sendContext();
	}, [sendContext]);

	useEffect(() => {
		const handleMessage = async (
			event: MessageEvent<unknown>,
		): Promise<void> => {
			const response = readToolFrameResponse(
				event,
				frameRef.current?.contentWindow ?? null,
				targetOrigin(url),
				tool,
				roomId,
			);
			if (
				!response ||
				!action ||
				action.isDeciding ||
				decidingRef.current
			)
				return;
			const actionKey = action.actionId ?? action.toolId;
			if (completedActions.current.has(actionKey)) return;
			if (response.tool_status === "error") {
				setError(
					response.response ||
						"The tool interface reported an error.",
				);
				return;
			}
			decidingRef.current = true;
			setError(null);
			try {
				if (
					response.tool_status === "cancelled" ||
					response.tool_status === "paused"
				)
					await onRejectTool(action);
				else
					await onApproveTool(
						action,
						response.executedParameters ?? action.arguments,
					);
				completedActions.current.add(actionKey);
			} catch (cause) {
				setError(
					cause instanceof Error
						? cause.message
						: "Could not save the tool decision.",
				);
			} finally {
				decidingRef.current = false;
			}
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [action, onApproveTool, onRejectTool, roomId, tool, url]);

	return (
		<div className="relative flex size-full min-h-64 flex-col overflow-hidden bg-background">
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			{isLoading && (
				<>
					<Skeleton className="absolute inset-0 size-full" />
					<output className="sr-only">Loading {tool.title}</output>
				</>
			)}
			<iframe
				key={url}
				ref={frameRef}
				src={url}
				title={`${tool.title} tool`}
				className="min-h-0 w-full flex-1 border-0"
				onError={() => {
					setIsLoading(false);
					setError(
						"This tool interface could not be loaded. Use the Inputs tab to review the request.",
					);
				}}
				onLoad={() => {
					isReadyRef.current = true;
					setIsLoading(false);
					sendContext();
				}}
			/>
		</div>
	);
}
