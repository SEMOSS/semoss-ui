import { useCallback, useEffect, useRef, useState } from "react";
import type { MCPToolRequest, PendingAgentAction } from "@semoss/sdk";
import { Skeleton } from "@semoss/ui/next";
import type { ConversationTool } from "@/features/messages/types/message";

interface ToolUiFrameProps {
	roomId: string;
	tool: ConversationTool;
	action: PendingAgentAction;
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
export function ToolUiFrame({ roomId, tool, action, url }: ToolUiFrameProps) {
	const frameRef = useRef<HTMLIFrameElement>(null);
	const isReadyRef = useRef(false);
	const [isLoading, setIsLoading] = useState(true);
	const parameters = action.editedArgs ?? action.toolArgs ?? tool.arguments;

	const sendContext = useCallback(() => {
		const originalName = action.toolMeta?.SMSS_ORIGINAL_TOOL_NAME;
		frameRef.current?.contentWindow?.postMessage(
			{
				type: "SMSS_INIT_TOOL",
				tool: {
					type: "MCP",
					message: action.parentMessageId ?? "",
					id: action.toolCallId ?? tool.id,
					name: action.toolName ?? tool.name,
					parameters,
					roomId,
					original_name:
						typeof originalName === "string"
							? originalName
							: tool.name,
					tool_response: tool.output,
					executedParameters: parameters,
					_meta: action.toolMeta ?? tool.metadata,
				} satisfies MCPToolRequest,
			},
			targetOrigin(url),
		);
	}, [action, parameters, roomId, tool, url]);

	useEffect(() => {
		if (isReadyRef.current) sendContext();
	}, [sendContext]);

	return (
		<div className="relative size-full min-h-64 overflow-hidden bg-background">
			{isLoading && (
				<>
					<Skeleton className="absolute inset-0 size-full" />
					<output className="sr-only">Loading {tool.title}</output>
				</>
			)}
			<iframe
				ref={frameRef}
				src={url}
				title={`${tool.title} tool`}
				className="size-full border-0"
				onLoad={() => {
					isReadyRef.current = true;
					setIsLoading(false);
					sendContext();
				}}
			/>
		</div>
	);
}
