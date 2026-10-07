import { type ComponentProps, memo } from "react";
import { cn, Markdown } from "@semoss/ui/next";
import { useStreamingText } from "../hooks/use-streaming-text";
import { StreamingMarkdownContext } from "../streaming-markdown.context";
import { messageMarkdownUrlTransform } from "../utils/room-file-link";
import { findStreamingCodeFence } from "../utils/streaming-code";
import { MessageMarkdownCode } from "./message-markdown-code";
import { MessageMarkdownLink } from "./message-markdown-link";
import { MESSAGE_PROSE_CLASS_NAME } from "./message-prose.styles";

const MARKDOWN_COMPONENTS: NonNullable<
	ComponentProps<typeof Markdown>["components"]
> = {
	pre: MessageMarkdownCode,
	a: MessageMarkdownLink,
};

/** Reveal incoming text while preserving the same Markdown tree for code. */
export const MessageMarkdown = memo(function MessageMarkdown({
	text,
	isStreaming,
	shouldFlush = false,
}: {
	text: string;
	isStreaming: boolean;
	shouldFlush?: boolean;
}) {
	const { displayedText, isRevealing } = useStreamingText({
		text,
		isStreaming,
		shouldFlush,
	});
	const streamingFence =
		isStreaming || isRevealing
			? findStreamingCodeFence(displayedText)
			: null;

	return (
		<StreamingMarkdownContext.Provider value={streamingFence}>
			<Markdown
				dir="auto"
				components={MARKDOWN_COMPONENTS}
				urlTransform={messageMarkdownUrlTransform}
				className={cn("min-w-0 max-w-prose", MESSAGE_PROSE_CLASS_NAME)}
			>
				{displayedText}
			</Markdown>
		</StreamingMarkdownContext.Provider>
	);
});
