import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import type { ConversationTool } from "@/features/messages/types/message";

/** Recognize draft writes from tool metadata, never from generated assistant prose. */
export function isEmailDraftTool(tool: ConversationTool): boolean {
	const names = [
		tool.name,
		tool.metadata?.SMSS_ORIGINAL_TOOL_NAME,
		tool.metadata?.SMSS_FUNCTION_NAME,
	];
	return names.some(
		(name) =>
			typeof name === "string" &&
			(name.endsWith("SaveDraft") ||
				((tool.arguments.asDraft === true ||
					tool.arguments.asDraft === "true") &&
					(name.endsWith("ReplyMail") ||
						name.endsWith("ForwardMail")))),
	);
}

/** Normalize the existing draft tool arguments for display without changing the tool payload. */
export function emailDraftToolPreview(tool: ConversationTool): {
	to: string;
	cc: string;
	subject: string;
	body: string;
	isHtml: boolean;
	webLink?: string;
	status: string;
} {
	const text = (value: unknown): string =>
		typeof value === "string" ? value : "";
	const addresses = (value: unknown): string =>
		Array.isArray(value)
			? value
					.filter((item): item is string => typeof item === "string")
					.join(", ")
			: text(value);
	let webLink: string | undefined;
	try {
		const output: unknown = JSON.parse(tool.output || "null");
		if (output && typeof output === "object" && "webLink" in output)
			webLink = safeSourceUrl(text(output.webLink));
	} catch {
		/* Incomplete streaming output has no confirmed Outlook link. */
	}
	return {
		to: addresses(tool.arguments.to),
		cc: addresses(tool.arguments.cc),
		subject: text(tool.arguments.subject),
		body: text(tool.arguments.message) || text(tool.arguments.comment),
		isHtml: tool.arguments.html === true || tool.arguments.html === "true",
		webLink,
		status: {
			QUEUED: "Queued",
			RUNNING: "Saving",
			INPUT_REQUIRED: "Waiting for approval",
			COMPLETED: "Saved to Outlook",
			FAILED: "Needs attention",
			REJECTED: "Rejected · draft not saved",
			CANCELLED: "Cancelled · draft not saved",
		}[tool.status],
	};
}
