import createDOMPurify, { type Config, type DOMPurify } from "dompurify";
import type { MailDisplayBody, MailInlineImage } from "./mail.types";

/** Elements an email body never keeps: active content, forms, and other documents. */
const FORBIDDEN_TAGS = [
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

/**
 * Attributes that load or send something without the reader asking. An old
 * `background` attribute is kept, and moved into its element's style, so a
 * background picture follows the same rules as every other.
 */
const FORBIDDEN_ATTRIBUTES = ["srcset", "ping", "action", "formaction"];

/** How every email body is sanitized, on the way in and on the way out. */
const SANITIZE_CONFIG: Config = {
	WHOLE_DOCUMENT: true,
	ADD_TAGS: ["style", "attachment"],
	FORBID_TAGS: FORBIDDEN_TAGS,
	FORBID_ATTR: FORBIDDEN_ATTRIBUTES,
};

/** A CSS `url()`, its address with or without the quotes around it. */
const CSS_URL = /url\(\s*(["']?)(.*?)\1\s*\)/gi;

/**
 * The sanitizer mail uses, made for mail alone, so the hooks other code adds
 * to the shared one, as diagram rendering does, never change what an email
 * keeps.
 */
let mailPurifier: DOMPurify | undefined;

/**
 * The sanitizer mail uses, made the first time an email is read.
 *
 * @return The sanitizer.
 */
const getMailPurifier = (): DOMPurify => {
	mailPurifier ??= createDOMPurify(window);
	return mailPurifier;
};

/** What a document shows when its policy cannot be put first: nothing. */
const UNSHOWN_DOCUMENT: MailHtmlDocument = {
	html: "",
	hasContent: false,
	hasRemoteImages: false,
	hasEmbeddedImages: false,
	hasQuotedHistory: false,
};

/**
 * Take the comment markers out of an email's style elements. Outlook writes
 * its CSS inside an HTML comment, for mail readers older than CSS, and the
 * sanitizer reads a comment there as markup and drops the whole style with
 * every rule in it. The email is read into an inert document for this, so no
 * pattern has to find where a style ends.
 *
 * @param html - The email's HTML body.
 * @return The HTML, its styles' comment markers taken out.
 */
const uncommentStyles = (html: string): string => {
	if (!html.includes("<!--")) {
		return html;
	}
	const doc = new DOMParser().parseFromString(html, "text/html");
	const styles = doc.querySelectorAll("style");
	if (styles.length === 0) {
		return html;
	}
	for (const style of styles) {
		style.textContent = (style.textContent ?? "").replace(/<!--|-->/g, "");
	}
	return doc.documentElement.outerHTML;
};

/**
 * Where the history an email quotes begins, in the markup each mail app writes
 * it with. Exchange prefixes the ids and classes of mail it delivers with `x_`,
 * so each is matched at the end of its id or as one of its classes either way.
 */
const QUOTED_HISTORY = [
	'[id$="appendonsend"]',
	'[id$="divRplyFwdMsg"]',
	'[id$="mail-editor-reference-message-container"]',
	'a[name="_MailEndCompose"]',
	".gmail_quote_container",
	".x_gmail_quote_container",
	".gmail_quote",
	".x_gmail_quote",
	".moz-cite-prefix",
	".x_moz-cite-prefix",
	".yahoo_quoted",
	".x_yahoo_quoted",
].join(",");

/** What an email shows in place of what it does not load. */
export interface MailHtmlLabels {
	/** Stands in for a picture on the web, until the reader shows them. */
	remoteImage: string;
	/** Stands in for a picture or file embedded in the email. */
	embeddedImage: string;
	/** The alternative text of a picture on the web that has none. */
	image: string;
}

/** How to build an email's document. */
export interface MailHtmlOptions {
	/** Whether pictures on the web load, which the reader has to ask for. */
	isRemoteImagesShown: boolean;
	/** Whether the history the email quotes is shown. */
	isQuotedHistoryShown: boolean;
	/**
	 * The pictures the email embeds, read from its mailbox once the reader
	 * shows them. Until then, and for any not among them, embedded pictures
	 * show a placeholder.
	 */
	embeddedImages?: readonly MailInlineImage[];
	labels: MailHtmlLabels;
}

/** An email as a document of its own, for a sandboxed frame. */
interface MailHtmlDocument {
	/** The document's markup, sanitized, with a policy that blocks loading. */
	html: string;
	/** Whether it has anything to show, text or pictures. */
	hasContent: boolean;
	/** Whether it has pictures on the web, held back until the reader asks. */
	hasRemoteImages: boolean;
	/**
	 * Whether it has pictures of its own, named by content id or written into
	 * it, held back until the reader asks.
	 */
	hasEmbeddedImages: boolean;
	/** Whether it quotes earlier emails, which can be shown or left out. */
	hasQuotedHistory: boolean;
}

/**
 * A link an email may keep: one to the web or to write an email.
 *
 * @param value - The link as the email has it.
 * @return The link, or undefined when it goes anywhere else.
 */
export const getMailLink = (value: string): string | undefined => {
	try {
		const url = new URL(value);
		return ["https:", "http:", "mailto:"].includes(url.protocol)
			? url.href
			: undefined;
	} catch {
		return undefined;
	}
};

/**
 * Remove an element and everything that follows it in the document.
 *
 * @param start - Where the removal begins.
 */
const removeFrom = (start: Element): void => {
	let node: Element | null = start;
	while (node && node.tagName !== "BODY" && node.tagName !== "HTML") {
		while (node.nextSibling) {
			node.nextSibling.remove();
		}
		node = node.parentElement;
	}
	start.remove();
};

/**
 * The content id a picture's `cid:` address names, the way the backend writes
 * it: without the angle brackets a header carries, with escapes decoded, in
 * lower case.
 *
 * @param src - The picture's address.
 * @return The content id, or undefined when the address is not a `cid:` one.
 */
const readContentId = (src: string): string | undefined => {
	if (!/^cid:/i.test(src)) {
		return undefined;
	}
	let id = src.slice("cid:".length).trim();
	try {
		id = decodeURIComponent(id).trim();
	} catch {
		// a malformed escape is matched as it was written
	}
	if (id.startsWith("<") && id.endsWith(">")) {
		id = id.slice(1, -1).trim();
	}
	return id === "" ? undefined : id.toLowerCase();
};

/**
 * Read an email's HTML into an inert document of its own, sanitized, with any
 * old `background` attribute moved into its element's style, so a background
 * picture loads, or does not, by the same rules as every other picture.
 *
 * @param html - The email's HTML body.
 * @return The document.
 */
const parseMailHtml = (html: string): Document => {
	const doc = new DOMParser().parseFromString(
		getMailPurifier().sanitize(uncommentStyles(html), SANITIZE_CONFIG),
		"text/html",
	);
	for (const element of doc.querySelectorAll("[background]")) {
		const address = element.getAttribute("background")?.trim() ?? "";
		element.removeAttribute("background");
		if (address !== "" && !/["'()\\]/.test(address)) {
			// the element's own style comes after, so it still has the last word
			element.setAttribute(
				"style",
				`background-image:url("${address}");${element.getAttribute("style") ?? ""}`,
			);
		}
	}
	return doc;
};

/**
 * The addresses of the pictures a document shows, in its `img` elements and
 * in the `url()`s of its styles.
 *
 * @param doc - The document.
 * @return The addresses, as written.
 */
const getPictureAddresses = (doc: Document): string[] => {
	const addresses = Array.from(
		doc.querySelectorAll("img"),
		(image) => image.getAttribute("src")?.trim() ?? "",
	);
	for (const element of doc.querySelectorAll("style,[style]")) {
		const css =
			element.tagName === "STYLE"
				? (element.textContent ?? "")
				: (element.getAttribute("style") ?? "");
		for (const match of css.matchAll(CSS_URL)) {
			addresses.push(match[2].trim());
		}
	}
	return addresses;
};

/** Which kinds of pictures an email shows. */
interface MailHtmlPictures {
	/** Whether it shows pictures on the web. */
	hasRemoteImages: boolean;
	/** Whether it shows pictures of its own, named by content id or written into it. */
	hasEmbeddedImages: boolean;
}

/**
 * Which kinds of pictures a document shows.
 *
 * @param doc - The document.
 * @return The kinds.
 */
const findPictures = (doc: Document): MailHtmlPictures => {
	const addresses = getPictureAddresses(doc);
	return {
		hasRemoteImages: addresses.some((address) =>
			/^https:\/\//i.test(address),
		),
		hasEmbeddedImages: addresses.some(
			(address) =>
				readContentId(address) !== undefined ||
				/^data:image\//i.test(address),
		),
	};
};

/**
 * Whether an email's formatted body shows pictures, in its own part or in what
 * it quotes, for deciding whether its picture settings are worth offering.
 *
 * @param body - The formatted body, when the email has one.
 * @return True when it is HTML with pictures on the web or of its own.
 */
export const hasMailHtmlPictures = (
	body: MailDisplayBody | undefined,
): boolean => {
	if (body?.contentType !== "html") {
		return false;
	}
	const pictures = findPictures(parseMailHtml(body.content));
	return pictures.hasRemoteImages || pictures.hasEmbeddedImages;
};

/**
 * Whether a document has anything a reader would see.
 *
 * @param doc - The document.
 * @return True when it has text, a picture, or an embedded file.
 */
const hasVisibleContent = (doc: Document): boolean =>
	Boolean(doc.body.textContent?.trim()) ||
	doc.body.querySelector("img, attachment") !== null;

/**
 * Turn an email's HTML into a document that can be shown without running or
 * loading anything: scripts, forms, and other documents are removed, pictures
 * show only once the reader asks, those the email embeds from the pictures
 * read for it and those on the web over https, and links open in a new tab.
 * When asked,
 * the history it quotes is left out, unless that would leave nothing, as with
 * an email that only forwards another.
 *
 * @param html - The email's HTML body, as its mailbox sent it.
 * @param options - What to load and show.
 * @return The document, and what it holds back.
 */
export const buildMailHtmlDocument = (
	html: string,
	options: MailHtmlOptions,
): MailHtmlDocument => {
	const doc = parseMailHtml(html);

	// the history counts as quoted only when the email has something of its
	// own before it, so an email that only forwards another shows it whole
	let hasQuotedHistory = false;
	const quoted = doc.body.querySelector(QUOTED_HISTORY);
	if (quoted) {
		const whole = doc.body.innerHTML;
		removeFrom(quoted);
		hasQuotedHistory = hasVisibleContent(doc);
		if (!hasQuotedHistory || options.isQuotedHistoryShown) {
			doc.body.innerHTML = whole;
		}
	}
	const hasContent = hasVisibleContent(doc);
	const { hasRemoteImages, hasEmbeddedImages } = findPictures(doc);

	const embedded = new Map(
		(options.embeddedImages ?? []).map((image) => [
			image.contentId.toLowerCase(),
			image,
		]),
	);
	for (const element of doc.querySelectorAll("img, attachment")) {
		const src = element.getAttribute("src") ?? "";
		const isImage = element.tagName === "IMG";
		const isRemote = isImage && /^https:\/\//i.test(src);
		const contentId = isImage ? readContentId(src) : undefined;
		const isWrittenIn = isImage && /^data:image\//i.test(src);
		if (isRemote && options.isRemoteImagesShown) {
			element.setAttribute("referrerpolicy", "no-referrer");
			if (!element.hasAttribute("alt")) {
				element.setAttribute("alt", options.labels.image);
			}
			continue;
		}
		const picture =
			contentId === undefined ? undefined : embedded.get(contentId);
		if (options.embeddedImages && (picture || isWrittenIn)) {
			if (picture) {
				element.setAttribute(
					"src",
					`data:${picture.contentType};base64,${picture.data}`,
				);
			}
			if (!element.hasAttribute("alt")) {
				element.setAttribute("alt", options.labels.image);
			}
			continue;
		}
		const placeholder = doc.createElement("span");
		placeholder.textContent = `[${
			element.getAttribute("alt") ||
			(isRemote
				? options.labels.remoteImage
				: options.labels.embeddedImage)
		}]`;
		element.replaceWith(placeholder);
	}
	// a background a style names by content id takes the picture read for it;
	// one on the web loads or not by the policy below
	if (options.embeddedImages) {
		const withPictures = (css: string): string =>
			css.replace(CSS_URL, (whole, _quote: string, address: string) => {
				const contentId = readContentId(address.trim());
				const picture =
					contentId === undefined
						? undefined
						: embedded.get(contentId);
				return picture
					? `url("data:${picture.contentType};base64,${picture.data}")`
					: whole;
			});
		for (const element of doc.querySelectorAll("style,[style]")) {
			if (element.tagName === "STYLE") {
				element.textContent = withPictures(element.textContent ?? "");
			} else {
				element.setAttribute(
					"style",
					withPictures(element.getAttribute("style") ?? ""),
				);
			}
		}
	}
	// an image map's areas are links too, which would otherwise open inside the
	// frame
	for (const link of doc.querySelectorAll("a, area")) {
		const href = getMailLink(link.getAttribute("href") ?? "");
		if (href) {
			link.setAttribute("href", href);
		} else {
			link.removeAttribute("href");
		}
		link.setAttribute("target", "_blank");
		link.setAttribute("rel", "noopener noreferrer");
	}

	// the email's own styles come after these and override them, since the
	// :where() rules carry no weight; Outlook writes every line as its own
	// MsoNormal paragraph, which its CSS gives no margin, so one without that
	// CSS is not spaced as a paragraph either
	const baseStyle = doc.createElement("style");
	baseStyle.textContent =
		"html{color-scheme:light}" +
		"body{margin:0;padding:12px;background:white;color:black;overflow-wrap:anywhere}" +
		":where(body){font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.5}" +
		":where(p){margin-block:0 1em}" +
		":where(.MsoNormal){margin:0}" +
		":where(blockquote){margin-inline:0;padding-inline-start:1em;border-inline-start:2px solid currentColor}" +
		"img{max-width:100%;height:auto}" +
		"table{max-width:100%}" +
		"a:focus-visible{outline:2px solid currentColor;outline-offset:2px}";
	doc.head.prepend(baseStyle);
	// the frame is as tall as the email, measured from outside, so an email
	// that sizes itself to its window, or scrolls on its own, would leave a
	// second scroll bar inside the frame; this comes last, after every style
	// the email has, and the body's own style has the last word over those.
	// The body holds its floats and its children's margins, so its box is all
	// there is to measure.
	const fitStyle = doc.createElement("style");
	fitStyle.textContent =
		"html,body{height:auto!important;min-height:0!important;max-height:none!important}" +
		"html{overflow-y:hidden!important;overflow-x:auto!important}" +
		"body{overflow:visible!important;display:flow-root!important}";
	doc.body.append(fitStyle);
	doc.body.style.setProperty("height", "auto", "important");
	doc.body.style.setProperty("min-height", "0", "important");
	doc.body.style.setProperty("overflow", "visible", "important");

	const clean = getMailPurifier().sanitize(doc.documentElement.outerHTML, {
		...SANITIZE_CONFIG,
		ADD_ATTR: ["target", "rel", "referrerpolicy"],
	});
	// pictures load only once the reader asks: its own as data, those on the
	// web over https
	const imageSources = [
		options.embeddedImages ? "data:" : undefined,
		options.isRemoteImagesShown ? "https:" : undefined,
	].filter((source) => source !== undefined);
	const page = new DOMParser().parseFromString(clean, "text/html");
	const policy = page.createElement("meta");
	policy.setAttribute("http-equiv", "Content-Security-Policy");
	policy.setAttribute(
		"content",
		`default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src ${
			imageSources.length > 0 ? imageSources.join(" ") : "'none'"
		}; base-uri 'none'; form-action 'none'`,
	);
	const referrer = page.createElement("meta");
	referrer.setAttribute("name", "referrer");
	referrer.setAttribute("content", "no-referrer");
	// the policy leads the head, so nothing the email declares can load before
	// it; it is placed in the document rather than written into the markup, so
	// nothing the email's own markup holds can move it, and an email it cannot
	// lead is not shown at all
	page.head.prepend(policy, referrer);
	if (
		page.head.firstElementChild !== policy ||
		page.querySelectorAll("meta").length !== 2
	) {
		return UNSHOWN_DOCUMENT;
	}
	return {
		// a doctype keeps the frame out of quirks mode, where the body is
		// stretched to the window and cannot be measured
		html: `<!DOCTYPE html>${page.documentElement.outerHTML}`,
		hasContent: hasContent,
		hasRemoteImages: hasRemoteImages,
		hasEmbeddedImages: hasEmbeddedImages,
		hasQuotedHistory: hasQuotedHistory,
	};
};
