import {
	CopyIcon,
	PaperclipIcon,
	RefreshCwIcon,
	WrenchIcon,
} from "lucide-react";
import { Badge, Button, Markdown, Muted, Spinner } from "@semoss/ui/next";
import { FeedbackButtons } from "@/components/engine/FeedbackButtons";
import type { ModelChatMessage as ModelChatMessageModel } from "@/stores/workbench/model";
import { ModelChatThinking } from "./model-chat-thinking";

interface ModelChatMessageProps {
	/** The turn to render. */
	message: ModelChatMessageModel;
	/** Rating already recorded for this message, when the user submitted one. */
	feedback: "true" | "false" | null;
	/** Record a thumbs up/down for an assistant message. */
	onFeedback: (messageId: string, rating: "true" | "false") => void;
	/** Re-send the prompt that produced this assistant message. */
	onRewrite: (messageId: string) => void;
	/** Whether actions that start a new turn should be disabled. */
	isBusy: boolean;
}

/**
 * One turn in the model chat transcript. User prompts sit in a right-aligned
 * bubble; the model's reply is rendered bare so long answers read as page
 * content rather than as chat.
 *
 * @name ModelChatMessage
 * @return The rendered turn.
 */
export const ModelChatMessage = ({
	message,
	feedback,
	onFeedback,
	onRewrite,
	isBusy,
}: ModelChatMessageProps) => {
	const copy = () => {
		void navigator.clipboard.writeText(message.text);
	};

	if (message.io === "INPUT") {
		return (
			<div
				className="group ms-auto flex max-w-[750px] flex-col items-end"
				data-testid={`model-chat-message-input-${message.id}`}
			>
				<div className="items-start self-stretch rounded-lg bg-accent px-4 py-3 leading-normal">
					<span
						dir="auto"
						className="wrap-break-word whitespace-pre-wrap text-foreground text-sm"
					>
						{message.text}
					</span>
					{message.attachments && (
						<div className="flex flex-wrap gap-1.5 pt-2">
							{message.attachments.map((attachment) => (
								<span
									key={
										attachment.fileLocation ??
										attachment.fileName
									}
									className="inline-flex max-w-48 items-center gap-1 rounded-sm border border-border bg-background/70 px-2 py-1 text-xs"
									title={attachment.fileName}
								>
									<PaperclipIcon
										className="size-3 shrink-0"
										aria-hidden
									/>
									<span className="min-w-0 truncate">
										{attachment.fileName}
									</span>
								</span>
							))}
						</div>
					)}
				</div>
				<div className="flex flex-row items-center gap-0.5 pt-2 opacity-0 transition-opacity group-hover:opacity-100">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Copy prompt"
						onClick={copy}
					>
						<CopyIcon className="size-3.5" aria-hidden />
					</Button>
				</div>
			</div>
		);
	}

	const isEmptyStream = message.isStreaming && !message.text;

	return (
		<div
			className="group flex w-full flex-col gap-2 pe-3 sm:pe-10"
			data-testid={`model-chat-message-output-${message.id}`}
		>
			{message.thinking && (
				<ModelChatThinking
					thinking={message.thinking}
					isStreaming={message.isStreaming ?? false}
				/>
			)}

			{message.toolCalls?.map((toolCall) => (
				<div
					key={toolCall.id}
					className="flex w-fit items-center gap-2 rounded-lg border border-border bg-sidebar px-3 py-1.5 text-muted-foreground text-xs"
				>
					<WrenchIcon className="size-3.5 shrink-0" aria-hidden />
					<span className="font-medium">{toolCall.name}</span>
					<Badge variant="outline" className="font-mono text-xs">
						{toolCall.output === undefined ? "running" : "done"}
					</Badge>
				</div>
			))}

			{isEmptyStream ? (
				<div className="flex items-center gap-2">
					<Spinner className="size-4" />
					<Muted className="text-sm">Generating response…</Muted>
				</div>
			) : (
				<Markdown dir="auto" className="wrap-anywhere">
					{message.text}
				</Markdown>
			)}

			{!message.isStreaming && (
				<div className="flex flex-row flex-wrap items-center gap-0.5">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Copy response"
						onClick={copy}
					>
						<CopyIcon className="size-3.5" aria-hidden />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Regenerate response"
						disabled={isBusy}
						onClick={() => onRewrite(message.id)}
					>
						<RefreshCwIcon className="size-3.5" aria-hidden />
					</Button>
					<FeedbackButtons
						messageId={message.id}
						onFeedbackCall={onFeedback}
						initialValue={feedback}
					/>
					{message.tokens ? (
						<Muted className="px-2 text-xs">
							{message.tokens} tokens
						</Muted>
					) : null}
				</div>
			)}
		</div>
	);
};
