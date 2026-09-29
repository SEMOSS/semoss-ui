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
