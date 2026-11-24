export const HTML_PREVIEW_CHANNEL = "semoss-html-preview";

type HtmlPreviewMessage =
	| { type: "ready" }
	| { type: "error"; message: string };

/** Validates the untrusted payload after the iframe's source is checked. */
export function readHtmlPreviewMessage(
	value: unknown,
	id: string,
): HtmlPreviewMessage | null {
	if (
		!value ||
		typeof value !== "object" ||
		!("channel" in value) ||
		value.channel !== HTML_PREVIEW_CHANNEL ||
		!("id" in value) ||
		value.id !== id ||
		!("type" in value)
	) {
		return null;
	}

	if (value.type === "ready") return { type: "ready" };
	if (
		value.type === "error" &&
		"message" in value &&
		typeof value.message === "string"
	) {
		return { type: "error", message: value.message.slice(0, 2000) };
	}
	return null;
}

/**
 * Adds the preview bridge before the author's scripts without rewriting them.
 * The browser parses the remaining document, including full HTML or fragments.
 */
export function createHtmlPreviewDocument(
	html: string,
	id: string,
	parentOrigin: string,
): string {
	// Template contents are inert, including scripts and resource elements.
	const template = document.createElement("template");
	template.innerHTML = html;
	const base = document.createElement("base");
	base.setAttribute(
		"href",
		template.content.querySelector("base[href]")?.getAttribute("href") ??
			"about:srcdoc",
	);
	const config = JSON.stringify({
		channel: HTML_PREVIEW_CHANNEL,
		id,
		parentOrigin,
	}).replace(/</g, "\\u003c");

	return `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer">${base.outerHTML}<script>
(() => {
	const { channel, id, parentOrigin } = ${config};
	const send = (message) => window.parent.postMessage(
		{ ...message, channel, id },
		parentOrigin === "null" ? "*" : parentOrigin,
	);
	window.addEventListener("error", (event) => {
		if (event instanceof ErrorEvent) {
			send({ type: "error", message: event.message.slice(0, 2000) });
		} else if (event.target instanceof HTMLScriptElement || event.target instanceof HTMLLinkElement) {
			send({ type: "error", message: "" });
		}
	}, true);
	window.addEventListener("unhandledrejection", (event) => {
		const reason = event.reason;
		const message = typeof reason === "string" ? reason : reason instanceof Error ? reason.message : "";
		send({ type: "error", message: message.slice(0, 2000) });
	});
	const ready = () => send({ type: "ready" });
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", ready, { once: true });
	} else {
		ready();
	}
})();
</script>${html.trim() ? html : "</head><body></body></html>"}`;
}
