import { Children, type ComponentProps, isValidElement } from "react";
import { MessageCodeBlock } from "./message-code-block";

/** Adapt Markdown's fenced-code child into Collaboration's completed code UI. */
export function MessageMarkdownCode({ children }: ComponentProps<"pre">) {
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

	return <MessageCodeBlock code={code} language={language} />;
}
