import { isRecordObject } from "./json";

const ATTACHMENT_IMAGE_RE = /(!\[[^\]]*\]\()attachment:([^)\s]+)(\))/g;

/**
 * nbformat markdown cells can embed images via `![alt](attachment:name.png)`
 * plus a `cell.attachments` map of name -> mimeType -> base64, instead of an
 * inline data URI or external link. Markdown renderers don't know about that
 * convention, so this rewrites each attachment: reference to a real data URI
 * before the source is handed to marked.
 */
export const resolveMarkdownAttachments = (
	source: string,
	attachments?: Record<string, Record<string, string>>,
): string => {
	if (!attachments) return source;

	return source.replace(
		ATTACHMENT_IMAGE_RE,
		(match, prefix: string, name: string, suffix: string) => {
			const mimeMap = attachments[name];
			if (!isRecordObject(mimeMap)) return match;

			const mimeType = Object.keys(mimeMap)[0];
			const data = mimeType ? mimeMap[mimeType] : undefined;
			if (!mimeType || typeof data !== "string") return match;

			return `${prefix}data:${mimeType};base64,${data}${suffix}`;
		},
	);
};
