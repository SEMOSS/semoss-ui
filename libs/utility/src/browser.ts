/** Return a normalized absolute HTTPS link, or undefined for an unsafe URL. */
export const safeHttpsUrl = (value: string | undefined): string | undefined => {
	if (!value) return undefined;
	try {
		const url = new URL(value);
		return url.protocol === "https:" ? url.href : undefined;
	} catch {
		return undefined;
	}
};

/** Replace favicon links; browser globals are accessed only when called. */
export const setFavicon = (href: string) => {
	// Remove existing icon links
	document
		.querySelectorAll(
			'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
		)
		.forEach((n) => {
			n.parentNode?.removeChild(n);
		});

	const link = document.createElement("link");
	link.rel = "icon";

	// Set MIME type when using SVG data URLs (helps some browsers)
	if (href.startsWith("data:image/svg+xml")) link.type = "image/svg+xml";
	if (href.startsWith("data:image/png")) link.type = "image/png";

	// Only cache-bust normal URLs, not data: URLs
	const finalHref = href.startsWith("data:")
		? href
		: `${href}${href.includes("?") ? "&" : "?"}v=${Date.now()}`;

	link.href = finalHref;
	document.head.appendChild(link);
};

/** Download a Blob and release its temporary anchor and object URL. */
export const downloadBlob = (blob: Blob, fileName: string): void => {
	const url = URL.createObjectURL(blob);
	let link: HTMLAnchorElement | undefined;
	try {
		link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
	} finally {
		link?.remove();
		URL.revokeObjectURL(url);
	}
};

/**
 * Scroll an element's ancestors, the page included, back to the top, such as
 * when one view replaces another in place.
 *
 * @param element - The element whose ancestors are scrolled.
 * @returns Puts each ancestor back where it was, including one scrolled only
 * after this call, such as when the first view comes back.
 */
export const scrollAncestorsToTop = (element: Element | null): (() => void) => {
	const ancestors: { node: Element; top: number }[] = [];
	for (
		let node = element?.parentElement ?? null;
		node;
		node = node.parentElement
	) {
		ancestors.push({ node, top: node.scrollTop });
	}
	for (const { node, top } of ancestors) {
		if (top > 0) {
			node.scrollTop = 0;
		}
	}
	return () => {
		for (const { node, top } of ancestors) {
			if (node.scrollTop !== top) {
				node.scrollTop = top;
			}
		}
	};
};
