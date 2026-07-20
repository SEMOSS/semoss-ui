import type { AgentFormValues } from "./types";
import { PIXEL_HOOK_KIND } from "./types";

const buildSubagentsPayload = (subagents: AgentFormValues["subagents"]) =>
	subagents
		.filter((s) => s.alias || s.workspaceId)
		.map((s) => ({
			alias: s.alias,
			workspaceId: s.workspaceId,
			...(s.description ? { description: s.description } : {}),
		}));

// Drops a `pixel`-kind hook that has no pixel expression yet (just added, not
// started) - matches the subagents policy of only dropping rows nobody has
// touched. The no-param kinds (git_commit/log_tools/ppt_to_pdf) are always
// complete as soon as their kind is picked.
const buildHooksPayload = (hooks: AgentFormValues["hooks"]) =>
	hooks
		.filter((h) => h.kind !== PIXEL_HOOK_KIND || h.pixel)
		.map((h) =>
			h.kind === PIXEL_HOOK_KIND
				? {
						kind: h.kind,
						pixel: h.pixel,
						...(h.events?.length ? { events: h.events } : {}),
					}
				: { kind: h.kind },
		);

/**
 * Builds the EditWorkspace pixel call that mirrors the full agent form state.
 * Shared by the edit page's save and the create page's post-create follow-up
 * (AddWorkspace doesn't accept model/execution-limit/subagent/hook fields), so
 * both save paths stay in sync with whatever EditWorkspace's reactor accepts.
 */
export const buildEditWorkspacePixel = (
	workspaceId: string,
	data: AgentFormValues,
): string => {
	const mcp = [...data.knowledge, ...data.toolboxes];
	const skills = data.skills.map((s) => s.id);
	const subagents = buildSubagentsPayload(data.subagents);
	const hooks = buildHooksPayload(data.hooks);

	return `EditWorkspace(workspaceId=["${workspaceId}"], name=${JSON.stringify(data.name)}, description=${JSON.stringify(data.description)}, systemPrompt=${JSON.stringify(data.instructions)}, mcp=${JSON.stringify(mcp)}, skills=${JSON.stringify(skills)}, prompts=${JSON.stringify(data.prompts)}, modelId=${JSON.stringify(data.modelId)}, maxTurns=${JSON.stringify(data.maxTurns)}, maxReflections=${JSON.stringify(data.maxReflections)}, maxSubagentDepth=${JSON.stringify(data.maxSubagentDepth)}, maxSubagentsPerRun=${JSON.stringify(data.maxSubagentsPerRun)}, maxSpawnsPerTurn=${JSON.stringify(data.maxSpawnsPerTurn)}, subagents=${JSON.stringify(subagents)}, hooks=${JSON.stringify(hooks)});`;
};
