import {
	type AddWorkspaceParams,
	addWorkspacePixel,
	type EditWorkspaceParams,
	editWorkspacePixel,
	readWorkspaceSaveWarning,
} from "@semoss/sdk";
import { PIXEL_HOOK_KIND } from "../agent.types";
import type { AgentFormValues } from "./types";

const buildSubagentsPayload = (subagents: AgentFormValues["subagents"]) =>
	subagents
		.filter((s) => s.workspaceId)
		.map((s) => ({
			workspaceId: s.workspaceId,
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
 * The agent form's basics, as AddWorkspace takes them: its knowledge and
 * toolboxes in one list, and its skills by id.
 *
 * @param data - The agent form's values.
 * @returns What `addWorkspace` in `@semoss/sdk` takes.
 */
export const toAddWorkspaceParams = (
	data: AgentFormValues,
): AddWorkspaceParams => ({
	name: data.name,
	description: data.description,
	systemPrompt: data.instructions,
	mcp: [...data.knowledge, ...data.toolboxes],
	skills: data.skills.map((s) => s.id),
	prompts: data.prompts,
});

/** Returns a partial-save warning emitted by EditWorkspace, when present. */
export const getWorkspaceSaveWarning = readWorkspaceSaveWarning;

/**
 * The agent form's whole state, as EditWorkspace takes it. Subagent rows with
 * no agent and pixel hooks with no pixel yet are left out.
 *
 * @param data - The agent form's values.
 * @returns What `editWorkspace` in `@semoss/sdk` takes.
 */
export const toEditWorkspaceParams = (
	data: AgentFormValues,
): EditWorkspaceParams => ({
	...toAddWorkspaceParams(data),
	modelId: data.modelId,
	useDefaultAgentTools: data.useDefaultAgentTools,
	disabledDefaultTools: data.disabledDefaultTools,
	maxTurns: data.maxTurns,
	maxReflections: data.maxReflections,
	maxSeconds: data.maxSeconds,
	maxSubagentDepth: data.maxSubagentDepth,
	maxSubagentsPerRun: data.maxSubagentsPerRun,
	maxSpawnsPerTurn: data.maxSpawnsPerTurn,
	subagents: buildSubagentsPayload(data.subagents),
	hooks: buildHooksPayload(data.hooks),
	greeting: data.greeting,
	greetingEnabled: data.greetingEnabled,
});

/**
 * Builds the EditWorkspace pixel call that mirrors the full agent form state.
 * Shared by the edit page's save and the create page's post-create follow-up
 * (AddWorkspace doesn't accept model/execution-limit/subagent/hook fields), so
 * both save paths stay in sync with whatever EditWorkspace's reactor accepts.
 */
export const buildEditWorkspacePixel = (
	workspaceId: string,
	data: AgentFormValues,
): string => editWorkspacePixel(workspaceId, toEditWorkspaceParams(data));

/**
 * Builds the AddWorkspace pixel for a new agent. AddWorkspace only accepts
 * the basics; follow it with `buildEditWorkspacePixel` when
 * `agentNeedsFollowUpEdit` is true.
 */
export const buildAddWorkspacePixel = (data: AgentFormValues): string =>
	addWorkspacePixel(toAddWorkspaceParams(data));

/**
 * Whether a new agent sets anything AddWorkspace does not accept (model,
 * built-in tools, execution limits, subagents, hooks, greeting), so it needs
 * an EditWorkspace call once it exists. That call resends everything, since
 * EditWorkspace treats omitted mcp/skills/prompts as empty.
 */
export const agentNeedsFollowUpEdit = (data: AgentFormValues): boolean =>
	Boolean(
		data.modelId ||
			!data.useDefaultAgentTools ||
			data.maxTurns ||
			data.maxReflections ||
			data.maxSeconds ||
			data.maxSubagentDepth ||
			data.maxSubagentsPerRun ||
			data.maxSpawnsPerTurn ||
			data.subagents.some((s) => s.workspaceId) ||
			data.disabledDefaultTools.length > 0 ||
			data.hooks.length > 0 ||
			data.greeting ||
			data.greetingEnabled,
	);
