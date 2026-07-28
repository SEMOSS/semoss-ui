import type { McpToolContext } from "../types/browserEvents";

export function getToolStringParameter(
	context: McpToolContext | null,
	key: string,
): string {
	const value =
		context?.parameters?.[key] ?? context?.executedParameters?.[key];
	return typeof value === "string" ? value.trim() : "";
}

export function getToolStringMapParameter(
	context: McpToolContext | null,
	key: string,
): Record<string, string> {
	const value =
		context?.parameters?.[key] ?? context?.executedParameters?.[key];
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value) as unknown;
			if (
				parsed &&
				typeof parsed === "object" &&
				!Array.isArray(parsed)
			) {
				return Object.fromEntries(
					Object.entries(parsed).filter(
						(entry): entry is [string, string] =>
							typeof entry[1] === "string",
					),
				);
			}
		} catch {
			return {};
		}
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(value).filter(
			(entry): entry is [string, string] => typeof entry[1] === "string",
		),
	);
}

function getToolFunctionName(context: McpToolContext | null): string {
	return (context?.originalName || context?.name || "").trim();
}

export function getRecordingNameHintFromTool(
	context: McpToolContext | null,
): string {
	const name = getToolFunctionName(context);
	const playIndex = name.toLowerCase().lastIndexOf("play_");
	if (playIndex < 0) return "";
	return name
		.slice(playIndex + "play_".length)
		.replace(/_/g, " ")
		.trim();
}

export function isPlayRecordingTool(context: McpToolContext | null): boolean {
	const name = getToolFunctionName(context);
	const normalizedName = name.toLowerCase();
	if (
		normalizedName === "play_playwright_sockets_recording" ||
		normalizedName.endsWith("_play_playwright_sockets_recording") ||
		normalizedName.startsWith("play_") ||
		normalizedName.includes("_play_") ||
		name === "PlayPlaywrightSocketsRoomRecording" ||
		name.endsWith("_PlayPlaywrightSocketsRoomRecording")
	) {
		return true;
	}
	const recordingFile =
		context?.parameters?.recording_file ??
		context?.parameters?.recordingFile ??
		context?.executedParameters?.recording_file ??
		context?.executedParameters?.recordingFile;
	return (
		typeof recordingFile === "string" &&
		recordingFile.trim().endsWith(".json")
	);
}
