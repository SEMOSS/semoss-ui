import { z } from "@semoss/ui/next";
import { mcpConfigSchema } from "@/features/agents/api/agent-schemas";
import type { PlaygroundRoomOptions } from "@/features/rooms/api/room-schemas";
import {
	LEGACY_THREAD_ASSISTANT_INSTRUCTIONS,
	THREAD_ASSISTANT_INSTRUCTIONS,
} from "./thread-context";

/** User-authored settings, kept separate from the agent's inherited resources. */
export const threadSettingsSchema = z.object({
	modelId: z.string().min(1, "Choose a model."),
	agentId: z.string(),
	instructions: z.string().max(8000, "Use up to 8,000 characters."),
	temperature: z.number().min(0).max(1).nullable(),
	mcp: z.array(mcpConfigSchema),
});

export type ThreadChatSettings = z.infer<typeof threadSettingsSchema>;

/** Recover custom instructions without displaying Work's built-in instructions as edits. */
export function settingsFromRoom(
	options: PlaygroundRoomOptions,
	agentId = "",
): ThreadChatSettings {
	const instructions = options.instructions;
	const prefix = instructions.startsWith(THREAD_ASSISTANT_INSTRUCTIONS)
		? THREAD_ASSISTANT_INSTRUCTIONS
		: LEGACY_THREAD_ASSISTANT_INSTRUCTIONS;
	return {
		modelId: options.modelId,
		agentId,
		instructions: instructions.startsWith(prefix)
			? instructions.slice(prefix.length).trimStart()
			: instructions,
		temperature: options.temperature ?? null,
		mcp: options.mcp.filter(
			(resource) => !resource.fromWorkspace && !resource.fromRoom,
		),
	};
}

/** Always keep Work's context guidance, appending to any selected agent prompt. */
export function workInstructions(instructions: string): string {
	return [THREAD_ASSISTANT_INSTRUCTIONS, instructions.trim()]
		.filter(Boolean)
		.join("\n\n");
}
