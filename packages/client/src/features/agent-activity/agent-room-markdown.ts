import { slugifyIdentifier } from "@semoss/utility/identifier";
import {
	type AgentRunDetail,
	type EngineInfo,
	formatRunDuration,
	type RoomRunDetail,
	type SubagentRunNode,
	type TranscriptMessage,
	type TranscriptPart,
	toPrettyJson,
} from "./agent-activity-types";

/** One line of a room export's header, such as who the room belongs to */
export interface AgentRoomExportDetail {
	label: string;
	value: string;
}

/** What a room export is made from */
export interface AgentRoomExport {
	roomId: string;
	roomName: string | null;
	/** The room's runs, each with its messages and subagent tree */
	runs: RoomRunDetail[];
	/** Model display names, keyed by engine id */
	engineInfo: Record<string, EngineInfo>;
	/** More lines for the header, such as the room's user and agent */
	details?: AgentRoomExportDetail[];
	/** When the export was made, as an ISO time */
	exportedAt: string;
}

/** What each run role a message plays is called in the export */
const ROLE_TITLES: Record<string, string> = {
	input: "User",
	assistant_tool: "Assistant",
	tool_result: "Tool results",
	final_output: "Assistant",
};

/**
 * Wraps text in a code fence longer than any run of backticks inside it, so
 * the text cannot end the block early.
 *
 * @param text - The block's text.
 * @param language - The block's language, or none.
 * @returns The fenced block.
 */
const codeBlock = (text: string, language = ""): string => {
	const longest = Math.max(
		2,
		...Array.from(text.matchAll(/`+/g), (match) => match[0].length),
	);
	const fence = "`".repeat(longest + 1);
	return `${fence}${language}\n${text}\n${fence}`;
};

/** What a message is called by the role it plays in its run */
const messageTitle = (message: TranscriptMessage): string => {
	const role = message.agentRun?.role ?? message.ornaments?.agentRunRole;
	if (role && ROLE_TITLES[role]) {
		return ROLE_TITLES[role];
	}
	if (message.type === "INPUT_TOOL_EXEC") {
		return "Tool results";
	}
	return message.io === "INPUT" ? "User" : "Assistant";
};

/**
 * Writes one message part.
 *
 * @param part - The part.
 * @returns Its Markdown, or nothing for a part with no content.
 */
const partMarkdown = (part: TranscriptPart): string => {
	switch (part.type) {
		case "TOOL_CALL": {
			const call = part.toolCall;
			if (!call) {
				return "";
			}
			return `**Tool call:** \`${call.name}\` (id \`${call.id}\`)\n\n${codeBlock(toPrettyJson(call.arguments ?? {}), "json")}`;
		}
		case "TOOL_RESULT": {
			const result = part.toolResult;
			if (!result) {
				return "";
			}
			return `**Tool result:** \`${result.toolName}\` (${result.toolStatus}, call \`${result.toolCallId}\`)\n\n${codeBlock(result.output ?? "")}`;
		}
		case "THINKING":
			return part.thinking
				? `**Thinking:**\n\n${part.thinking
						.split("\n")
						.map((line) => `> ${line}`)
						.join("\n")}`
				: "";
		case "SYSTEM": {
			const text = part.text ?? part.prompt ?? "";
			return text ? `**System:**\n\n${text}` : "";
		}
		default:
			return part.uiText ?? part.text ?? part.prompt ?? "";
	}
};

/**
 * Writes one message, with when it was made and its parts.
 *
 * @param message - The message.
 * @returns Its Markdown.
 */
const messageMarkdown = (message: TranscriptMessage): string => {
	const hidden = message.visible ? "" : " (hidden)";
	const parts = message.parts
		.map(partMarkdown)
		.filter((part) => part.trim() !== "");
	return [
		`#### ${messageTitle(message)}${hidden} - ${message.dateCreated}`,
		...parts,
	].join("\n\n");
};

/**
 * Writes one run: its facts, input, conversation and final output.
 *
 * @param run - The run.
 * @param label - Its place in the room, such as "Run 1" or "Run 1.2".
 * @param engineInfo - Model display names, keyed by engine id.
 * @param parentLabel - The run that spawned it, for a subagent run.
 * @returns Its Markdown.
 */
const runMarkdown = (
	run: AgentRunDetail,
	label: string,
	engineInfo: Record<string, EngineInfo>,
	parentLabel: string | null,
): string => {
	const model = run.modelName ?? engineInfo[run.modelId]?.name ?? null;
	const duration = formatRunDuration(run.startedAt, run.completedAt);
	const facts = [
		`- Run id: \`${run.runId}\``,
		parentLabel ? `- Subagent of: ${parentLabel}` : null,
		`- Status: ${run.status}`,
		`- Agent: \`${run.workspaceId}\``,
		`- Model: ${model ? `${model} (\`${run.modelId}\`)` : `\`${run.modelId}\``}`,
		`- Harness: ${run.harnessType}`,
		`- Created: ${run.dateCreated}`,
		run.startedAt ? `- Started: ${run.startedAt}` : null,
		run.completedAt ? `- Completed: ${run.completedAt}` : null,
		duration ? `- Duration: ${duration}` : null,
	].filter((fact): fact is string => fact !== null);

	const sections = [`## ${label}: ${run.status}`, facts.join("\n")];
	if (run.errorMessage) {
		sections.push(`### Error\n\n${codeBlock(run.errorMessage)}`);
	}
	sections.push(`### Input\n\n${run.input || "(none)"}`);
	const messages = run.messages ?? [];
	sections.push(
		`### Conversation\n\n${
			messages.length > 0
				? messages.map(messageMarkdown).join("\n\n")
				: "(no messages recorded)"
		}`,
	);
	if (run.finalText) {
		sections.push(`### Final output\n\n${run.finalText}`);
	}
	return sections.join("\n\n");
};

/**
 * Writes a subagent tree, each run under the one that spawned it.
 *
 * @param nodes - The subagent runs.
 * @param parentLabel - The run they belong to, such as "Run 1".
 * @param engineInfo - Model display names, keyed by engine id.
 * @returns Each run's Markdown, the tree walked in order.
 */
const subagentMarkdown = (
	nodes: SubagentRunNode[],
	parentLabel: string,
	engineInfo: Record<string, EngineInfo>,
): string[] =>
	nodes.flatMap((node, index) => {
		const label = `${parentLabel}.${index + 1}`;
		return [
			runMarkdown(node, label, engineInfo, parentLabel),
			...subagentMarkdown(node.children, label, engineInfo),
		];
	});

/**
 * Writes a room's runs as one Markdown document for someone investigating
 * it: the room, each run with its facts, input, every message between the
 * user, the agent and its tools, and its final output, then each subagent run
 * under the run that spawned it.
 *
 * @param room - The room and its runs.
 * @returns The document.
 */
export const buildAgentRoomMarkdown = (room: AgentRoomExport): string => {
	const header = [
		`# ${room.roomName ?? "Untitled room"}`,
		[
			`- Room id: \`${room.roomId}\``,
			...(room.details ?? []).map(
				(detail) => `- ${detail.label}: ${detail.value}`,
			),
			`- Runs: ${room.runs.length}`,
			`- Exported: ${room.exportedAt}`,
		].join("\n"),
	];
	const runs = room.runs.flatMap((run, index) => {
		const label = `Run ${index + 1}`;
		return [
			runMarkdown(run, label, room.engineInfo, null),
			...subagentMarkdown(run.subagents, label, room.engineInfo),
		];
	});
	return `${[...header, ...runs].join("\n\n")}\n`;
};

/**
 * The file name a room export is saved as: the room's name and its id.
 *
 * @param roomId - The room.
 * @param roomName - Its name, or null.
 * @returns The file name.
 */
export const agentRoomExportFileName = (
	roomId: string,
	roomName: string | null,
): string => {
	const name = slugifyIdentifier(roomName ?? "") || "room";
	return `${name}-${slugifyIdentifier(roomId) || "room"}.md`;
};
