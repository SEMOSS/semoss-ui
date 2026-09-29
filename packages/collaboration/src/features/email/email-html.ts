import DOMPurify, { type Config } from "dompurify";

const BODY_TAGS = [
	"p",
	"div",
	"span",
	"br",
	"strong",
	"b",
	"em",
	"i",
	"u",
	"s",
	"a",
	"ul",
	"ol",
	"li",
	"blockquote",
	"pre",
	"code",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"table",
	"thead",
	"tbody",
	"tfoot",
	"tr",
	"td",
	"th",
	"hr",
];
const BODY_ATTRIBUTES = [
	"href",
	"title",
	"style",
	"colspan",
	"rowspan",
	"scope",
	"start",
	"dir",
];
const STYLE_PROPERTIES = new Set([
	"color",
	"background-color",
	"font-size",
	"font-weight",
	"font-style",
	"text-decoration",
	"text-align",
	"white-space",
	"border",
	"border-collapse",
	"padding",
	"vertical-align",
]);
const FORBIDDEN = [
	"script",
	"noscript",
	"iframe",
	"object",
	"embed",
	"form",
	"input",
	"button",
	"textarea",
	"select",
	"base",
	"meta",
	"link",
	"svg",
	"math",
	"video",
	"audio",
];

/** Only user-activated web/mail links are retained. */
export function emailLink(value: string): string | undefined {
	try {
		const url = new URL(value);
		return ["https:", "http:", "mailto:"].includes(url.protocol)
			? url.href
			: undefined;
	} catch {
		return undefined;
	}
}

/** Parse sanitized content in an inert document; never attach source markup to the app. */
function documentFrom(html: string, config: Config): Document {
	return new DOMParser().parseFromString(
		DOMPurify.sanitize(html, config),
		"text/html",
	);
}

/** Restrict editor styles to formatting values, without URLs or CSS functions. */
export function sanitizeDraftHtml(html: string): string {
	const config: Config = {
		ALLOWED_TAGS: BODY_TAGS,
		ALLOWED_ATTR: BODY_ATTRIBUTES,
	};
	const doc = documentFrom(html, config);
	for (const element of doc.body.querySelectorAll<HTMLElement>("[style]")) {
		for (const property of Array.from(element.style)) {
			const value = element.style.getPropertyValue(property);
			if (
				!STYLE_PROPERTIES.has(property) ||
				/url|expression|var\s*\(|[{}<>\\]/i.test(value)
			)
				element.style.removeProperty(property);
		}
	}
	for (const element of doc.body.querySelectorAll<HTMLElement>("[style]"))
		if (!element.style.cssText) element.removeAttribute("style");
	for (const link of doc.body.querySelectorAll("a")) {
		const href = emailLink(link.getAttribute("href") ?? "");
		if (href) link.setAttribute("href", href);
		else link.removeAttribute("href");
	}
	return DOMPurify.sanitize(doc.body.innerHTML, config);
}

/** Plain text for meaningful-content validation, without interpreting plain input as HTML. */
export function draftText(
	body: string,
	format: "text" | "html" = "text",
): string {
	if (format === "text") return body.trim();
	const doc = documentFrom(body, {
		ALLOWED_TAGS: BODY_TAGS,
		ALLOWED_ATTR: [],
	});
	return (doc.body.textContent ?? "")
		.replace(/(?:\u200b|\u200c|\u200d|\ufeff)/g, "")
		.trim();
}

/** An inert source document with a network policy independent of the host application. */
export function emailDocument(
	html: string,
	loadImages: boolean,
): { html: string; hasImages: boolean } {
	const config: Config = {
		WHOLE_DOCUMENT: true,
		ADD_TAGS: ["style", "attachment", "at"],
		FORBID_TAGS: FORBIDDEN,
		FORBID_ATTR: ["srcset", "ping", "action", "formaction", "background"],
	};
	const doc = documentFrom(html, config);
	let hasImages = Array.from(doc.querySelectorAll("style,[style]")).some(
		(element) =>
			/url\s*\(/i.test(
				element.getAttribute("style") ?? element.textContent ?? "",
			),
	);
	for (const element of doc.querySelectorAll("img, attachment")) {
		const src = element.getAttribute("src") ?? "";
		const isRemote = /^https:\/\//i.test(src);
		if (element.tagName === "IMG" && isRemote) hasImages = true;
		if (element.tagName === "IMG" && loadImages && isRemote) {
			element.setAttribute("referrerpolicy", "no-referrer");
			if (!element.hasAttribute("alt"))
				element.setAttribute("alt", "Email image");
			continue;
		}
		const placeholder = doc.createElement("span");
		placeholder.textContent = `[${element.getAttribute("alt") || (isRemote ? "Remote image" : "Embedded image or attachment — open in Outlook")}]`;
		element.replaceWith(placeholder);
	}
	for (const link of doc.querySelectorAll("a")) {
		const href = emailLink(link.getAttribute("href") ?? "");
		if (href) link.setAttribute("href", href);
		else link.removeAttribute("href");
		link.setAttribute("target", "_blank");
		link.setAttribute("rel", "noopener noreferrer");
	}
	// Email-authored colors and layout are source data confined to this document.
	const baseStyle = doc.createElement("style");
	baseStyle.textContent =
		"html{color-scheme:light}body{margin:0;padding:8px;background:white;color:black;overflow-wrap:anywhere}img{max-width:100%;height:auto}a:focus-visible{outline:2px solid currentColor;outline-offset:2px}";
	doc.head.prepend(baseStyle);
	const clean = DOMPurify.sanitize(doc.documentElement.outerHTML, {
		...config,
		ADD_ATTR: ["target", "rel", "referrerpolicy"],
	});
	// Insert our policy before any source styles; every network resource is blocked until image consent.
	const policy = `default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src ${loadImages ? "https:" : "'none'"}; base-uri 'none'; form-action 'none'`;
	return {
		html: clean.replace(
			"<head>",
			`<head><meta http-equiv="Content-Security-Policy" content="${policy}">`,
		),
		hasImages,
	};
}

/** Teams HTML uses app typography and never imports provider CSS or loads media. */
export function teamsHtml(html: string): string {
	const doc = documentFrom(html, {
		ALLOWED_TAGS: [
			...BODY_TAGS,
			"at",
			"img",
			"attachment",
			"video",
			"audio",
			"iframe",
			"object",
			"embed",
		],
		ALLOWED_ATTR: ["href", "alt", "title", "colspan", "rowspan"],
	});
	for (const element of doc.querySelectorAll(
		"at, img, attachment, video, audio, iframe, object, embed",
	)) {
		const span = doc.createElement("span");
		span.textContent =
			element.tagName === "AT"
				? element.textContent
				: `[${element.getAttribute("alt") || "Media or card — open in Teams"}]`;
		if (element.tagName === "AT") span.setAttribute("data-mention", "true");
		element.replaceWith(span);
	}
	for (const link of doc.querySelectorAll("a")) {
		const href = emailLink(link.getAttribute("href") ?? "");
		if (href) link.setAttribute("href", href);
		else link.removeAttribute("href");
		link.setAttribute("target", "_blank");
		link.setAttribute("rel", "noopener noreferrer");
	}
	return DOMPurify.sanitize(doc.body.innerHTML, {
		ALLOWED_TAGS: BODY_TAGS,
		ALLOWED_ATTR: [
			"href",
			"title",
			"target",
			"rel",
			"data-mention",
			"colspan",
			"rowspan",
		],
	});
}

/** Escape supplied assistant/plain text when starting an email draft. */
export function plainTextEmail(text: string): string {
	const doc = document.implementation.createHTMLDocument();
	for (const line of text.split("\n")) {
		const paragraph = doc.createElement("p");
		paragraph.textContent = line;
		if (!line) paragraph.append(doc.createElement("br"));
		doc.body.append(paragraph);
	}
	return doc.body.innerHTML;
}

/** Test visible source content after sanitization, so image-only messages retain their placeholders. */
export function hasDisplayContent(content: string, channel: string): boolean {
	const html =
		channel === "teams"
			? teamsHtml(content)
			: emailDocument(content, false).html;
	const doc = new DOMParser().parseFromString(html, "text/html");
	return Boolean(doc.body.textContent?.trim());
}
