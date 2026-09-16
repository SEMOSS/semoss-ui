import { runPixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import { makeEngineRoomMcp, updateRoomOptions } from "./rooms";

/**
 * Throw when a pixel response contains an operation error. No-op when the
 * error list is empty.
 *
 * @name assertPixelSuccess
 * @param errors - Operation errors collected from a runPixel response.
 */
const assertPixelSuccess = (errors: string[]): void => {
	if (errors.length > 0) {
		throw new Error(errors.join(""));
	}
};

/**
 * Wrap free-text user content for a pixel argument. `JSON.stringify` makes it a
 * valid string literal; the `<encode>` wrapper is what the backend expects
 * around content it must not interpret. Both are required — see the note on
 * `escapePixelString` in components/project/clone-project-dialog.tsx, which
 * escapes only single quotes and breaks on a double quote.
 *
 * @name encodedArg
 * @param value - Raw user text.
 * @return The serialized pixel argument value.
 */
const encodedArg = (value: string): string =>
	JSON.stringify(`<encode>${value}</encode>`);

/** Placeholder portal for a new code app, so it renders on first open. */
const buildIndexFile = (name: string) =>
	`<html><style>html {font-family: sans-serif; padding: 30px;}</style><h1>${name}</h1><p>This is placeholder text for your new Application.</p><p>You can add new files and edit this text using the Code Editor.</p></html>`;

/**
 * What a planned target is: a project to create, or an engine. Mirrors the
 * backend's `targetKind`.
 */
export type BuildTargetKind = "PROJECT" | "ENGINE";

/**
 * Raw `PlanBuildFromPrompt` output.
 *
 * This interface and {@link planBuildFromPrompt} are the only two places in the
 * client that depend on the reactor's response shape. If the backend renames a
 * key, nothing else has to change.
 */
interface BuildPlanOutput {
	success?: boolean;
	targetKind?: string;
	targetType?: string;
	projectName?: string;
	templateProjectId?: string | null;
	templateProjectName?: string | null;
	templateMatchConfidence?: string;
	agentProjectId?: string | null;
	agentProjectName?: string | null;
	agentIsDefault?: boolean;
	error?: string;
}

/** A normalized plan for what to create from a prompt. */
export interface BuildPlan {
	/** Whether to create a project or an engine. */
	targetKind: BuildTargetKind;
	/** The specific project or engine type. */
	targetType: string;
	/** Name suggested for the new project or engine. */
	name: string;
	/** Template project to clone, or null to start empty. */
	templateId: string | null;
	/** Display name of the matched template, for the status line. */
	templateName: string | null;
	/** WORKSPACE project id to run the assistant under, or null for the default. */
	agentId: string | null;
	/** Display name of the matched agent. */
	agentName: string | null;
}

const toOptionalString = (value: unknown): string | null =>
	typeof value === "string" && value.trim() ? value.trim() : null;

/**
 * Ask the backend what to create from a natural-language prompt: the target
 * kind and type, the closest template, the best agent, and a suggested name.
 *
 * The reactor resolves its own reasoning model, so no engine is passed.
 *
 * @name planBuildFromPrompt
 * @param prompt - What the user typed.
 * @param insightId - Insight the pixel executes against.
 * @return The normalized plan.
 * @throws When the pixel errors or the reactor reports failure.
 */
export const planBuildFromPrompt = async (
	prompt: string,
	insightId: string,
): Promise<BuildPlan> => {
	const response = await runPixel<[BuildPlanOutput]>(
		`PlanBuildFromPrompt(prompt=[${encodedArg(prompt)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const output = response.pixelReturn[0]?.output;
	if (!output) {
		throw new Error("PlanBuildFromPrompt returned no plan");
	}
	if (output.success === false) {
		throw new Error(
			output.error || "Could not plan anything from that prompt",
		);
	}

	return {
		targetKind: output.targetKind === "ENGINE" ? "ENGINE" : "PROJECT",
		targetType: toOptionalString(output.targetType) ?? "CODE",
		name: toOptionalString(output.projectName) ?? "",
		templateId: toOptionalString(output.templateProjectId),
		templateName: toOptionalString(output.templateProjectName),
		// The reactor always sends a concrete agent id, but an explicitly
		// default one is left null so the assistant store's own fallback wins.
		agentId: output.agentIsDefault
			? null
			: toOptionalString(output.agentProjectId),
		agentName: output.agentIsDefault
			? null
			: toOptionalString(output.agentProjectName),
	};
};

/**
 * Whether a name is already taken. Projects and engines live in separate
 * namespaces with separate check pixels.
 *
 * @name isNameTaken
 * @param name - Candidate name.
 * @param kind - Which namespace to check.
 * @param insightId - Insight the pixel executes against.
 * @return True when something already has that name.
 */
const isNameTaken = async (
	name: string,
	kind: BuildTargetKind,
	insightId: string,
): Promise<boolean> => {
	if (kind === "ENGINE") {
		const response = await runPixel<[boolean]>(
			`META | CheckEngineName(${JSON.stringify(name)});`,
			insightId,
		);
		assertPixelSuccess(response.errors);
		return Boolean(response.pixelReturn[0]?.output);
	}

	const response = await runPixel<[{ exists?: boolean }]>(
		`CheckProjectName(project=[${JSON.stringify(name)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);
	return Boolean(response.pixelReturn[0]?.output?.exists);
};

/** Give up suffixing after this many tries rather than looping on a bad check. */
const MAX_NAME_ATTEMPTS = 20;

/**
 * Find a free name, appending " 2", " 3", … as needed. The user never typed
 * this name, so a duplicate-name error would be confusing to show them.
 *
 * @name resolveFreeName
 * @param name - Suggested name.
 * @param kind - Which namespace to check.
 * @param insightId - Insight the pixels execute against.
 * @return A name nothing currently uses, or the last one tried when the check
 * is unavailable — creation will surface the real error in that case.
 */
export const resolveFreeName = async (
	name: string,
	kind: BuildTargetKind,
	insightId: string,
): Promise<string> => {
	for (let attempt = 1; attempt <= MAX_NAME_ATTEMPTS; attempt++) {
		const candidate = attempt === 1 ? name : `${name} ${attempt}`;
		try {
			if (!(await isNameTaken(candidate, kind, insightId))) {
				return candidate;
			}
		} catch (error) {
			// A failing check must not block creation; let the create call
			// report whatever is actually wrong.
			console.error(error);
			return candidate;
		}
	}

	return `${name} ${Date.now()}`;
};

/**
 * Read a project id off a create-pixel response.
 *
 * @name readProjectId
 * @param output - Raw pixel output.
 * @param pixelName - Name used in the error message.
 * @return The new project id.
 */
const readProjectId = (
	output: { project_id?: string } | undefined,
	pixelName: string,
): string => {
	const projectId = output?.project_id;
	if (!projectId) {
		throw new Error(`${pixelName} returned no project id`);
	}
	return projectId;
};

/**
 * Clone a template into a new project. The backend copies the template's own
 * project type, so this covers CODE, NOTEBOOK and WORKSPACE templates.
 *
 * @name createProjectFromTemplate
 * @param name - Name for the new project.
 * @param templateId - Template project to clone.
 * @param insightId - Insight the pixel executes against.
 * @return The new project id.
 */
export const createProjectFromTemplate = async (
	name: string,
	templateId: string,
	insightId: string,
): Promise<string> => {
	const response = await runPixel<[{ project_id?: string }]>(
		`CreateAppFromTemplate(project=[${JSON.stringify(name)}], projectTemplate=[${JSON.stringify(templateId)}], global=["false"]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	return readProjectId(
		response.pixelReturn[0]?.output,
		"CreateAppFromTemplate",
	);
};

/**
 * Clone a skill template. SKILL projects do not go through
 * `CreateAppFromTemplate`.
 *
 * @name cloneSkillFromTemplate
 * @param name - Name for the new skill.
 * @param skillId - Skill template to clone.
 * @param insightId - Insight the pixel executes against.
 * @return The new project id.
 */
export const cloneSkillFromTemplate = async (
	name: string,
	skillId: string,
	insightId: string,
): Promise<string> => {
	const response = await runPixel<[{ project_id?: string }]>(
		`CloneSkill(skillId=[${JSON.stringify(skillId)}], name=[${JSON.stringify(name)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	return readProjectId(response.pixelReturn[0]?.output, "CloneSkill");
};

/**
 * Create an empty CODE project with a placeholder portal, so it renders on
 * first open. This is the fallback when no template fits.
 *
 * @name createBlankCodeProject
 * @param name - Name for the new project. Already sanitized by the caller,
 * since it is interpolated into the placeholder HTML.
 * @param insightId - Insight the pixels execute against.
 * @return The new project id.
 */
export const createBlankCodeProject = async (
	name: string,
	insightId: string,
): Promise<string> => {
	const created = await runPixel<[Project]>(
		`CreateProject(project=[${JSON.stringify(name)}], portal=[true], projectType=["CODE"]);`,
		insightId,
	);
	assertPixelSuccess(created.errors);

	const projectId = readProjectId(
		created.pixelReturn[0]?.output,
		"CreateProject",
	);

	const filePath = "version/assets/portals/index.html";
	const portal = await runPixel(
		`SaveAsset(fileName=[${JSON.stringify(filePath)}], content=[${encodedArg(buildIndexFile(name))}], space=[${JSON.stringify(projectId)}]); CommitAsset(filePath=[${JSON.stringify(filePath)}], comment=["Created from a prompt"], space=[${JSON.stringify(projectId)}]);`,
		insightId,
	);
	assertPixelSuccess(portal.errors);

	return projectId;
};

/**
 * Create an empty notebook project.
 *
 * @name createBlankNotebookProject
 * @param name - Name for the new notebook.
 * @param insightId - Insight the pixel executes against.
 * @return The new notebook project id.
 */
export const createBlankNotebookProject = async (
	name: string,
	insightId: string,
): Promise<string> => {
	const response = await runPixel<[{ project_id?: string }]>(
		`CreateNotebook(project=[${JSON.stringify(name)}]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	return readProjectId(response.pixelReturn[0]?.output, "CreateNotebook");
};

/**
 * Create an empty workspace project.
 *
 * @name createBlankWorkspaceProject
 * @param name - Name for the new workspace.
 * @param insightId - Insight the pixel executes against.
 * @return The new workspace project id.
 */
export const createBlankWorkspaceProject = async (
	name: string,
	insightId: string,
): Promise<string> => {
	const response = await runPixel<[string]>(
		`AddWorkspace(name=${JSON.stringify(name)}, description="", systemPrompt="", mcp=[], skills=[], prompts=[]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const workspaceId = response.pixelReturn[0]?.output;
	if (!workspaceId) {
		throw new Error("AddWorkspace returned no workspace id");
	}

	return workspaceId;
};

/**
 * Create an empty local H2 database. This is the only engine type that can be
 * created from a name alone — every other `Create*Engine` reactor requires a
 * connection details map.
 *
 * @name createEmptyDatabase
 * @param name - Name for the new database.
 * @param description - Optional description to persist as metadata.
 * @param insightId - Insight the pixels execute against.
 * @return The new engine id.
 */
export const createEmptyDatabase = async (
	name: string,
	description: string,
	insightId: string,
): Promise<string> => {
	const meta = description ? { description } : {};
	const response = await runPixel<
		[{ engine_id?: string; database_id?: string }]
	>(
		`databaseVar = CreateEmptyRdbmsDatabase(database=[${JSON.stringify(name)}], rdbmsType=["H2_DB"], username=[""], password=[""]); SetDatabaseMetadata(database=[databaseVar], meta=[${JSON.stringify(meta)}]); SyncDatabaseWithLocalMaster(database=[databaseVar]);`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const output = response.pixelReturn[0]?.output;
	// engine_id is the current key; database_id is the legacy fallback the
	// import forms still allow for.
	const engineId = output?.engine_id || output?.database_id;
	if (!engineId) {
		throw new Error("CreateEmptyRdbmsDatabase returned no engine id");
	}

	return engineId;
};

/**
 * Create the room a prompt-driven build will run in.
 *
 * `project` matters: a room is stamped with the creating insight's project
 * unless one is passed, and the assistant's history list filters by the
 * workbench insight's project — so a room created here without it would be
 * invisible in the workbench the user lands on. Engines have no project, and
 * their workbench insight has none either, so the filter does not apply.
 *
 * @name createBuildRoom
 * @param name - Display name for the room.
 * @param projectId - Project to stamp the room with, or null for an engine.
 * @param insightId - Insight the pixel executes against.
 * @return The new room id.
 */
export const createBuildRoom = async (
	name: string,
	projectId: string | null,
	insightId: string,
): Promise<string> => {
	const args = [`name=[${encodedArg(name)}]`];
	if (projectId) {
		args.push(`project=[${JSON.stringify(projectId)}]`);
	}

	const response = await runPixel<[{ roomId?: string }]>(
		`CreateRoom(${args.join(", ")});`,
		insightId,
	);
	assertPixelSuccess(response.errors);

	const roomId = response.pixelReturn[0]?.output?.roomId;
	if (!roomId) {
		throw new Error("CreateRoom did not return a room ID");
	}

	return roomId;
};

/**
 * Give the room its tools, model and instructions before the run starts.
 * `RunAgent` reads all of this off the room, so a run started without it has
 * no tools and no system prompt.
 *
 * Mirrors what the assistant store does on every submit: engine workbenches
 * load tools from the room's MCP file, project workbenches pass MCP entries
 * directly.
 *
 * @name prepareBuildRoom
 * @param options - Room, target, model, agent and display name.
 * @param insightId - Insight the pixels execute against.
 */
export const prepareBuildRoom = async (
	options: {
		roomId: string;
		/** Project or engine id — also the workbench the room is tagged with. */
		targetId: string;
		/** Display name of the thing being built. */
		targetName: string;
		/** True for an engine, which loads its tools server-side. */
		isEngine: boolean;
		modelId: string;
		agent: { workspace_id: string; name?: string } | null;
	},
	insightId: string,
): Promise<void> => {
	if (options.isEngine) {
		await makeEngineRoomMcp(insightId, options.targetId);
	}

	await updateRoomOptions(insightId, options.roomId, {
		// Deliberately specific to this first turn. The workbench overwrites
		// it with its own system prompt on the next submit.
		instructions: `You are the assistant for ${options.targetName} (${options.targetId}). The user has just created it from the request below and is watching you work. Use only the tools provided in this room. Never claim an operation succeeded unless its tool result confirms it.`,
		mcp: options.isEngine
			? []
			: [
					{
						type: "PROJECT",
						id: options.targetId,
						name: options.targetName,
					},
				],
		predefinedPrompts: [],
		modelId: options.modelId,
		workspace: options.agent,
		harnessType: "semoss",
		// The workbench tags its conversations with the bare project/engine id.
		workbench: options.targetId,
	});
};
