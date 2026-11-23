interface RoomFileLink {
	path: string;
	name: string;
}

// How a run names one of its agent's own files, in its tools and in its answers: agent:/folder/file.md
const AGENT_FILE_SCHEME = "agent:";

/** Decode one room-relative filename without introducing traversal or another scope. */
export function parseRoomFileLink(url: string): RoomFileLink | null {
	if (!url.startsWith("room://")) return null;
	return parseRelativePath(url.slice("room://".length));
}

/**
 * Decode a link to one of the agent's own files, such as a source a Digital
 * Twin names under an answer, as a path inside the agent's files folder. The
 * slashes after the scheme are optional, as they are for the run's own tools.
 */
export function parseAgentFileLink(url: string): RoomFileLink | null {
	if (!url.startsWith(AGENT_FILE_SCHEME)) return null;
	return parseRelativePath(
		url.slice(AGENT_FILE_SCHEME.length).replace(/^\/+/, ""),
	);
}

/** One percent-encoded relative path as a file, refusing traversal and another scope. */
function parseRelativePath(relativePath: string): RoomFileLink | null {
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

/** Preserve normal Markdown URLs and allow verified syntax for room file and agent file anchors. */
export function messageMarkdownUrlTransform(
	url: string,
	key?: string,
): string | undefined {
	if (url.startsWith("room://")) {
		if (key === "src") return undefined;
		return parseRoomFileLink(url) ? url : "";
	}
	if (url.startsWith(AGENT_FILE_SCHEME)) {
		if (key === "src") return undefined;
		return parseAgentFileLink(url) ? url : "";
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
