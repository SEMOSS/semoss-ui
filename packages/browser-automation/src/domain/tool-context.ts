import type { McpToolContext } from "../types/browserEvents";

export function getToolStringParameter(
	context: McpToolContext | null,
	key: string,
): string {
	const value = context?.parameters?.[key];
	return typeof value === "string" ? value.trim() : "";
}

export function getToolStringMapParameter(
	context: McpToolContext | null,
	key: string,
): Record<string, string> {
	const value = context?.parameters?.[key];
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}
	return Object.fromEntries(
		Object.entries(value).flatMap(([name, item]) =>
			typeof item === "string" ||
			typeof item === "number" ||
			typeof item === "boolean"
				? [[name, String(item)]]
				: [],
		),
	);
}

function getToolFunctionName(context: McpToolContext | null): string {
	return (context?.originalName || context?.name || "").trim();
}

export function isPlayRecordingTool(context: McpToolContext | null): boolean {
	const name = getToolFunctionName(context);
	if (
		name === "play_playwright_sockets_recording" ||
		name.endsWith("_play_playwright_sockets_recording") ||
		name === "PlayPlaywrightSocketsRoomRecording" ||
		name.endsWith("_PlayPlaywrightSocketsRoomRecording")
	) {
		return true;
	}
	const recordingFile = context?.parameters?.recording_file;
	return (
		typeof recordingFile === "string" &&
		recordingFile.trim().endsWith(".json")
	);
}
