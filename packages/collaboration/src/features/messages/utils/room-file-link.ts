interface RoomFileLink {
	path: string;
	name: string;
}

/** Decode one room-relative filename without introducing traversal or another scope. */
export function parseRoomFileLink(url: string): RoomFileLink | null {
	if (!url.startsWith("room://")) return null;
	const relativePath = url.slice("room://".length);
	if (!relativePath || /[?#]/.test(relativePath)) return null;

	let segments: string[];
	try {
		segments = relativePath.split("/").map(decodeURIComponent);
	} catch {
		return null;
	}
	if (
		segments.some(
			(segment) =>
				!segment ||
				segment === "." ||
				segment === ".." ||
				/[\\/:]/.test(segment) ||
				[...segment].some((character) => {
					const code = character.charCodeAt(0);
					return code < 32 || code === 127;
				}),
		)
	) {
		return null;
	}
	const name = segments.at(-1);
	return name ? { path: `/${segments.join("/")}`, name } : null;
}

/** Room files linked as Markdown anchors in a message's text, in order. */
export function roomFileLinks(text: string): RoomFileLink[] {
	// the closing ")" or title space keeps a half-streamed name from matching
	return [...text.matchAll(/\]\((room:\/\/[^)\s]+)[)\s]/g)].flatMap(
		(match) => parseRoomFileLink(match[1]) ?? [],
	);
}

/** Preserve normal Markdown URLs and allow verified syntax for room file anchors. */
export function messageMarkdownUrlTransform(
	url: string,
	key?: string,
): string | undefined {
	if (url.startsWith("room://")) {
		if (key === "src") return undefined;
		return parseRoomFileLink(url) ? url : "";
	}
	// Match react-markdown's default protocol policy; relative URLs stay relative.
	const colon = url.indexOf(":");
	if (
		colon < 0 ||
		["/", "?", "#"].some((separator) => {
			const index = url.indexOf(separator);
			return index >= 0 && index < colon;
		}) ||
		/^(https?|ircs?|mailto|xmpp)$/i.test(url.slice(0, colon))
	) {
		return url;
	}
	return "";
}
