import { CopyIcon, Loader2Icon, PaperclipIcon } from "lucide-react";
import type React from "react";
import { Button, Markdown } from "@semoss/ui/next";
import type {
	WorkbenchChatMessage as WorkbenchChatMessageType,
	WorkbenchChatToolState,
} from "./workbench-chat.reducer";
import { WorkbenchChatTool } from "./workbench-chat-tool";

interface WorkbenchChatMessageProps {
	message: WorkbenchChatMessageType;
	tools: Record<string, WorkbenchChatToolState>;
	showThinking: boolean;
	onRunTool: (toolId: string) => void;
	onCancelTool: (toolId: string) => void;
}

/** Render one user or assistant room message. */
export const WorkbenchChatMessage: React.FC<WorkbenchChatMessageProps> = ({
	message,
	tools,
	showThinking,
	onRunTool,
	onCancelTool,
}) => {
	const text = message.parts
		.filter((part) => part.type === "TEXT")
		.map((part) => part.uiText || part.text)
		.join("");
	const media = message.parts.filter((part) => part.type === "MEDIA");
	const hasVisibleContent = message.parts.some(
		(part) =>
			(part.type === "TEXT" && Boolean(part.text)) ||
			(showThinking &&
				part.type === "THINKING" &&
				Boolean(part.thinking)) ||
			part.type === "TOOL_CALL",
	);

	if (message.io === "INPUT") {
		return (
			<div className="group ms-auto flex w-full max-w-[85%] flex-col items-end">
				<div className="w-fit max-w-full rounded-lg bg-accent px-4 py-3 leading-normal">
					{media.length > 0 ? (
						<div className="mb-2 flex flex-wrap justify-end gap-1.5">
							{media.map((part) => (
								<span
									key={
										part.mediaInfo.fileLocation ||
										`${message.messageId}-${part.mediaInfo.fileName}`
									}
									className="inline-flex max-w-full items-center gap-1 rounded-sm border border-border bg-background/70 px-2 py-1 text-xs"
									title={part.mediaInfo.fileName}
								>
									<PaperclipIcon className="size-3 shrink-0" />
									<span className="truncate">
										{part.mediaInfo.fileName}
									</span>
								</span>
							))}
						</div>
					) : null}
					{text ? (
						<p className="wrap-break-word whitespace-pre-wrap text-sm">
							{text}
						</p>
					) : null}
				</div>
			</div>
		);
	}

	return (
		<div className="group flex min-w-0 flex-col gap-2 pe-3">
			{message.parts.map((part, index) => {
				const key = `${message.messageId}-${part.type}-${index}`;
				if (part.type === "TEXT" && part.text) {
					return (
						<div key={key} className="min-w-0 text-sm leading-6">
							<Markdown>{part.uiText || part.text}</Markdown>
						</div>
					);
				}
				if (part.type === "THINKING" && part.thinking) {
					if (!showThinking) {
						return null;
					}
					return (
						<details
							key={key}
							className="overflow-hidden rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground text-xs shadow-xs"
							open={message.isStreaming}
						>
							<summary className="cursor-pointer font-medium">
								Thinking
							</summary>
							<div className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
								{part.thinking}
							</div>
						</details>
					);
				}
				if (part.type === "TOOL_CALL") {
					const tool = tools[part.toolCall.id];
					return tool ? (
						<WorkbenchChatTool
							key={key}
							tool={tool}
							onRun={onRunTool}
							onCancel={onCancelTool}
						/>
					) : null;
				}
				return null;
			})}
			{message.isStreaming && !hasVisibleContent ? (
				<div className="flex min-h-8 items-center gap-2 text-muted-foreground text-sm">
					<Loader2Icon className="size-4 animate-spin" />
					<span>Thinking...</span>
				</div>
			) : null}
			{text ? (
				<div className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
					<Button
						type="button"
						size="icon-sm"
						variant="ghost"
						aria-label="Copy response"
						onClick={() => void navigator.clipboard.writeText(text)}
					>
						<CopyIcon />
					</Button>
				</div>
			) : null}
		</div>
	);
};
