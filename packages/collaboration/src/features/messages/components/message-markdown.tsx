import type { ComponentProps } from "react";
import { Markdown } from "@semoss/ui/next";
import { findStreamingCodeFence } from "../utils/streaming-code";
import { MessageCodeBlock } from "./message-code-block";
import { MessageMarkdownCode } from "./message-markdown-code";

const MARKDOWN_COMPONENTS: NonNullable<
	ComponentProps<typeof Markdown>["components"]
> = {
	pre: MessageMarkdownCode,
};

const MARKDOWN_CLASS_NAME =
	"min-w-0 break-words text-sm [&>:first-child]:mt-0 [&_h1]:text-lg [&_h2]:mt-6 [&_h2]:text-base [&_h3]:mt-5 [&_h3]:text-sm [&_h4]:mt-4 [&_h4]:text-sm [&_li]:text-sm [&_p]:mt-4 [&_p]:text-sm [&_p]:leading-6";

/** Markdown response text that extracts an unfinished final code fence. */
export function MessageMarkdown({
	text,
	isStreaming,
}: {
	text: string;
	isStreaming: boolean;
}) {
	const streamingFence = isStreaming ? findStreamingCodeFence(text) : null;

	return (
		<div className="min-w-0">
			<Markdown
				components={MARKDOWN_COMPONENTS}
				className={MARKDOWN_CLASS_NAME}
			>
				{streamingFence?.before ?? text}
			</Markdown>
			{streamingFence && (
				<MessageCodeBlock
					code={streamingFence.code}
					language={streamingFence.language}
					isStreaming
				/>
			)}
		</div>
	);
}
