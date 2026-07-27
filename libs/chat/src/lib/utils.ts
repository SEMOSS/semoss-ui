/**
 * The name to actually display for a tool call — real playground renders
 * the backend's clean `title` verbatim rather than the raw `name` (often a
 * project-id-prefixed reactor identifier), only falling back to `name`
 * before `title` has arrived (mid-stream) or for older data that never had
 * one.
 */
export function toolCallDisplayName(toolCall: {
	name: string;
	title?: string;
}): string {
	return toolCall.title || toolCall.name;
}
