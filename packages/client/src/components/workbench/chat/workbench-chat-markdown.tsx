import type { ComponentProps } from "react";
import { Markdown } from "@semoss/ui/next";

/**
 * Chat-scale element overrides for the shared Markdown component. The
 * default preset is tuned for long-form document pages (24px paragraph gaps,
 * page-scale headings, roomy lists) — in a ~400px chat panel that reads as
 * sparse and oversized. These keep the same semantics at conversation scale:
 * compact paragraph rhythm, modest heading steps, and tight lists. Code,
 * links, and tables keep the preset's rendering.
 */
const CHAT_COMPONENTS: ComponentProps<typeof Markdown>["components"] = {
	p: ({ children, ...props }) => (
		<p className="leading-relaxed [&:not(:first-child)]:mt-2.5" {...props}>
			{children}
		</p>
	),
	h1: ({ children, ...props }) => (
		<h2 className="mt-4 mb-1 font-semibold text-base first:mt-0" {...props}>
			{children}
		</h2>
	),
	h2: ({ children, ...props }) => (
		<h3 className="mt-4 mb-1 font-semibold text-base first:mt-0" {...props}>
			{children}
		</h3>
	),
	h3: ({ children, ...props }) => (
		<h4 className="mt-3 mb-1 font-semibold text-sm first:mt-0" {...props}>
			{children}
		</h4>
	),
	h4: ({ children, ...props }) => (
		<h5 className="mt-3 mb-1 font-semibold text-sm first:mt-0" {...props}>
			{children}
		</h5>
	),
	h5: ({ children, ...props }) => (
		<h6 className="mt-3 mb-1 font-semibold text-sm first:mt-0" {...props}>
			{children}
		</h6>
	),
	h6: ({ children, ...props }) => (
		<h6 className="mt-3 mb-1 font-semibold text-sm first:mt-0" {...props}>
			{children}
		</h6>
	),
	ul: ({ children, ...props }) => (
		<ul
			className="my-2 ms-5 list-disc [&>li]:mt-1 [&>li]:leading-relaxed"
			{...props}
		>
			{children}
		</ul>
	),
	ol: ({ children, ...props }) => (
		<ol
			className="my-2 ms-5 list-decimal [&>li]:mt-1 [&>li]:leading-relaxed"
			{...props}
		>
			{children}
		</ol>
	),
	blockquote: ({ children, ...props }) => (
		<blockquote
			className="mt-2 border-border border-s-2 ps-3 text-muted-foreground"
			{...props}
		>
			{children}
		</blockquote>
	),
	hr: ({ ...props }) => <hr className="my-3 border-border" {...props} />,
};

/**
 * The shared Markdown renderer with chat-scale typography — used for
 * assistant replies and tool output inside the chat panel.
 *
 * @name WorkbenchChatMarkdown
 * @param children - Markdown content to render.
 * @return The chat-scaled markdown.
 */
export const WorkbenchChatMarkdown = ({ children }: { children: string }) => (
	<Markdown components={CHAT_COMPONENTS}>{children}</Markdown>
);
