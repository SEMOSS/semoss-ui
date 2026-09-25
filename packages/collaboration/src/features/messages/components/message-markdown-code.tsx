import {
	Children,
	type ComponentProps,
	isValidElement,
	useContext,
} from "react";
import { StreamingMarkdownContext } from "../streaming-markdown.context";
import { MessageCodeBlock } from "./message-code-block";

/** Adapt both incomplete and complete fences without moving their DOM subtree. */
export function MessageMarkdownCode({
	children,
	node,
}: ComponentProps<"pre"> & {
	node?: { position?: { start: { offset?: number } } };
}) {
	const fence = useContext(StreamingMarkdownContext);
	const start = node?.position?.start.offset;
	const isStreaming =
		fence !== null &&
		start !== undefined &&
		start >= fence.before.length &&
		start <= fence.before.length + 3;
	let code = "";
	let language: string | undefined;

	Children.forEach(children, (child) => {
		if (!isValidElement(child)) return;
		const props = child.props as {
			code?: unknown;
			language?: unknown;
			className?: unknown;
			children?: unknown;
		};
		if (typeof props.code === "string") code += props.code;
		else if (typeof props.children === "string") code += props.children;
		if (typeof props.language === "string") language = props.language;
		else if (typeof props.className === "string") {
			language = /(?:^|\s)language-([^\s]+)/.exec(props.className)?.[1];
		}
	});

	return (
		<MessageCodeBlock
			code={isStreaming ? fence.code : code}
			language={language}
			isStreaming={isStreaming}
		/>
	);
}
