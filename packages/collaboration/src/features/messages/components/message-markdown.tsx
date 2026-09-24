import { type ComponentProps, memo } from "react";
import { Markdown } from "@semoss/ui/next";
import { useStreamingText } from "../hooks/use-streaming-text";
import { StreamingMarkdownContext } from "../streaming-markdown.context";
import { findStreamingCodeFence } from "../utils/streaming-code";
import { MessageMarkdownCode } from "./message-markdown-code";

const MARKDOWN_COMPONENTS: NonNullable<
	ComponentProps<typeof Markdown>["components"]
> = {
	pre: MessageMarkdownCode,
};

const MARKDOWN_CLASS_NAME =
	"min-w-0 max-w-prose wrap-anywhere text-base leading-7 [&>:first-child]:mt-0 [&_h1]:text-xl [&_h2]:mt-6 [&_h2]:text-lg [&_h3]:mt-4 [&_h3]:text-base [&_h4]:mt-4 [&_h4]:text-base [&_li]:mt-1 [&_li]:text-base [&_li]:leading-7 [&_ol]:my-3 [&_ul]:my-3 [&_p]:mt-3 [&_p]:text-base [&_p]:leading-7";

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
				className={MARKDOWN_CLASS_NAME}
			>
				{displayedText}
			</Markdown>
		</StreamingMarkdownContext.Provider>
	);
});
