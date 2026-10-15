import { createElement, type ReactNode } from "react";
import { sanitizeChatHtml } from "@/features/rooms/components/chat-rich-content";

/** Render explicitly marked user HTML with an allowlist, never arbitrary DOM injection. */
export function MessageRichText({ html }: { html: string }) {
	try {
		const doc = new DOMParser().parseFromString(
			sanitizeChatHtml(html),
			"text/html",
		);
		function renderNode(node: Node, key: number): ReactNode {
			if (node.nodeType === Node.TEXT_NODE) return node.textContent;
			if (!(node instanceof HTMLElement)) return null;
			const tag = node.tagName.toLowerCase();
			const children = [...node.childNodes].map(renderNode);
			const props: Record<string, unknown> = { key };
			if (tag === "td" || tag === "th") {
				props.className =
					"border border-border p-1 whitespace-pre-wrap align-top [&_p]:m-0";
				for (const attribute of ["rowspan", "colspan"]) {
					const value = node.getAttribute(attribute);
					if (value)
						props[attribute === "rowspan" ? "rowSpan" : "colSpan"] =
							Number(value);
				}
				if (tag === "th") {
					props.scope = node.getAttribute("scope") ?? undefined;
					props.className += " bg-muted font-bold";
				}
			}
			if (tag === "p")
				props.className = "my-1 whitespace-pre-wrap wrap-anywhere";
			if (tag === "ul") props.className = "list-disc pl-6";
			if (tag === "ol") props.className = "list-decimal pl-6";
			if (tag === "table")
				return (
					<section
						key={key}
						className="my-2 max-w-full overflow-x-auto rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
						// biome-ignore lint/a11y/noNoninteractiveTabindex: wide tables must be keyboard reachable for horizontal scrolling
						tabIndex={0}
						aria-label="Pasted table"
					>
						<table className="border-collapse">{children}</table>
					</section>
				);
			return createElement(tag, props, ...(tag === "br" ? [] : children));
		}
		return (
			<div
				dir="auto"
				className="min-w-0 text-sm leading-6 group-data-[layout=bubbles]/message:text-base"
			>
				{[...doc.body.childNodes].map(renderNode)}
			</div>
		);
	} catch {
		return <div className="wrap-anywhere whitespace-pre-wrap">{html}</div>;
	}
}
