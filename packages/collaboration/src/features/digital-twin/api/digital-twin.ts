import type { ConnectorSavedFile } from "@semoss/connectors";
import { uploadProjectImage } from "@semoss/sdk";
import {
	buildEditWorkspacePixel,
	getFileExplorerAdapter,
	getWorkspaceSaveWarning,
	type MCPConfig,
	toAgentFormValues,
} from "@semoss/shared";
import { z } from "@semoss/ui/next";
import {
	type ProjectRow,
	projectListSchema,
} from "@/features/agents/api/agent-schemas";
import { getAgent } from "@/features/agents/api/get-agent";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/**
 * The folder of a twin's project that holds what it knows. It is the agent
 * files folder: the one part of the project a chat reads, and that the people
 * the twin is shared with may read.
 */
export const TWIN_FILES_PATH = "/public";

/** A Digital Twin as the lists show it. */
export interface DigitalTwin {
	id: string;
	name: string;
}

/** The six things an owner sets on their twin. */
export interface TwinProfile {
	name: string;
	instructions: string;
	/** The twin's opening message; empty for none. */
	greeting: string;
	/** Ids from the owner's skill catalog. */
	skills: string[];
	toolboxes: Pick<MCPConfig, "id" | "name" | "type">[];
	/** A new image to upload; without one the twin keeps the image it has. */
	image?: File | null;
}

/**
 * A create that made the twin but could not finish setting it up. The server
 * refuses a second twin, so the caller saves the rest as an edit of `twinId`
 * instead of creating again.
 */
export class TwinSetupError extends Error {
	readonly twinId: string;

	constructor(
		message: string,
		twinId: string,
		options?: { cause?: unknown },
	) {
		super(message, options);
		this.name = "TwinSetupError";
		this.twinId = twinId;
	}
}

// the server marks a twin with this metadata key; nothing else can set it
const TWIN_FILTER = {
	projectType: "WORKSPACE",
	metaFilters: { digital_twin: ["true"] },
};
const MY_TWIN_PIXEL = pixel("MyProjects", {
	...TWIN_FILTER,
	// 1 is owner: the twin this person created and still owns
	effectivePermissions: 1,
	createdByMe: true,
});
const TWINS_PIXEL = pixel("MyProjects", TWIN_FILTER);

// project_name can be a namespace many agents share; the display name is the twin's own
const toTwin = (row: ProjectRow): DigitalTwin => ({
	id: row.project_id,
	name: row.project_display_name?.trim() || row.project_name,
});

// a sentence of its own wherever it is put: the server's reasons come with and without a full stop
const reason = (cause: unknown): string =>
	`${(cause instanceof Error ? cause.message : "that did not work").replace(/\.$/, "")}.`;

const twinFiles = (twinId: string) =>
	getFileExplorerAdapter({ type: "APP", app: twinId });

/** The signed-in person's own twin, or null when they have none. */
export async function getMyTwin(
	actions: InsightActions,
): Promise<DigitalTwin | null> {
	const [row] = await callPixel(actions, MY_TWIN_PIXEL, projectListSchema);
	return row ? toTwin(row) : null;
}

/** The signed-in person's own twin with its full configuration, or null when they have none. */
export async function getMyTwinAgent(actions: InsightActions) {
	const twin = await getMyTwin(actions);
	return twin ? getAgent(actions, twin.id) : null;
}

/** The signed-in person's own twin, and the twins other people shared with them. */
export async function listTwins(
	actions: InsightActions,
): Promise<{ mine: DigitalTwin | null; shared: DigitalTwin[] }> {
	const [mine, all] = await Promise.all([
		getMyTwin(actions),
		callPixel(actions, TWINS_PIXEL, projectListSchema),
	]);
	return {
		mine,
		shared: all.filter((row) => row.project_id !== mine?.id).map(toTwin),
	};
}

/**
 * Save the fields the form shows over the twin's whole configuration, so
 * what the form does not show (model, limits, knowledge, hooks) is kept.
 */
export async function saveTwinProfile(
	actions: InsightActions,
	twinId: string,
	profile: Omit<TwinProfile, "image">,
): Promise<void> {
	const agent = await getAgent(actions, twinId);
	const output = await callPixel(
		actions,
		buildEditWorkspacePixel(twinId, {
			...toAgentFormValues(agent),
			name: profile.name,
			instructions: profile.instructions,
			greeting: profile.greeting,
			greetingEnabled: profile.greeting !== "",
			// only the ids are sent
			skills: profile.skills.map((id) => ({ id, name: id })),
			toolboxes: profile.toolboxes,
		}),
		z.unknown(),
	);
	// the greeting lives in the part this warning says was not written
	const warning = getWorkspaceSaveWarning(output);
	if (warning) throw new Error(warning);
	if (agent.name !== profile.name) {
		await callPixel(
			actions,
			pixel("SetProjectDisplayName", {
				project: twinId,
				name: `<encode>${profile.name}</encode>`,
			}),
			z.unknown(),
		);
	}
}

/** Save an existing twin: its profile, then a newly chosen image. */
export async function saveTwin(
	actions: InsightActions,
	twinId: string,
	{ image, ...profile }: TwinProfile,
): Promise<void> {
	await saveTwinProfile(actions, twinId, profile);
	if (!image) return;
	try {
		await uploadProjectImage(twinId, image);
	} catch (cause) {
		// the profile is saved by now, so say which part is not
		throw new Error(
			`Your changes were saved, but the image could not be uploaded: ${reason(cause)}`,
			{ cause },
		);
	}
}

/**
 * Something in the page's files that can be copied into a twin: an email,
 * Teams chat or drive file a viewer saved there, or a file uploaded there.
 */
export interface TwinSource {
	/** Where the file is, relative to the insight's folder. */
	path: string;
	/** The file's name, which its copy in the twin keeps. */
	name: string;
	/** The viewer that saved it; left out for a file uploaded from the owner's computer. */
	service?: ConnectorSavedFile["service"];
}

/** What creating a twin does, one server step after another. */
export type TwinSetupStep =
	| "twin"
	| "folder"
	| "greeting"
	| "image"
	| "knowledge";

/**
 * The steps creating this profile takes, in the order they run: the agent,
 * its files folder, then its greeting and its image when it has them, neither
 * of which the create call takes, then the copies of what the owner chose.
 */
export function twinSetupSteps(
	profile: TwinProfile,
	knowledge: TwinSource[] = [],
): TwinSetupStep[] {
	return [
		"twin",
		"folder",
		...(profile.greeting ? (["greeting"] as const) : []),
		...(profile.image ? (["image"] as const) : []),
		...(knowledge.length ? (["knowledge"] as const) : []),
	];
}

interface TwinCreateOptions {
	/** What the owner chose for the twin to know, already saved in the page's files. */
	knowledge?: TwinSource[];
	/**
	 * Told as each step starts. The step is not over before what this returns
	 * settles, so a screen can keep each one up long enough to read.
	 */
	onStep?: (step: TwinSetupStep) => void | Promise<void>;
	/** Told as each of `knowledge` is copied; the next copy waits for what this returns. */
	onCopied?: (source: TwinSource) => void | Promise<void>;
}

/**
 * Create the owner's twin, running {@link twinSetupSteps} in order.
 *
 * @returns The new twin's id.
 * @throws {TwinSetupError} when the twin was made and a later step failed.
 */
export async function createTwin(
	actions: InsightActions,
	profile: TwinProfile,
	{ knowledge = [], onStep, onCopied }: TwinCreateOptions = {},
): Promise<string> {
	// the work and the caller's pause run together, so a slow step is not made slower
	const during = async <T>(
		step: TwinSetupStep,
		run: () => Promise<T>,
	): Promise<T> => (await Promise.all([run(), onStep?.(step)]))[0];
	const twinId = await during("twin", () =>
		callPixel(
			actions,
			pixel("AddDigitalTwin", {
				name: profile.name,
				systemPrompt: profile.instructions,
				mcp: profile.toolboxes.map(({ id, name, type }) => ({
					id,
					name,
					type,
				})),
				skills: profile.skills,
			}),
			z.string().min(1),
		),
	);
	const setUp: Record<
		Exclude<TwinSetupStep, "twin">,
		{ failure: string; run: () => Promise<unknown> }
	> = {
		folder: {
			failure: "its files folder could not be made",
			// once only: asked again, the server makes a numbered folder beside the first
			run: () => createTwinFolder(actions, twinId),
		},
		greeting: {
			failure: "its greeting could not be saved",
			run: () => saveTwinProfile(actions, twinId, profile),
		},
		image: {
			failure: "its image could not be uploaded",
			run: async () => {
				if (profile.image)
					await uploadProjectImage(twinId, profile.image);
			},
		},
		knowledge: {
			failure: "not everything you chose could be added",
			run: () => addTwinKnowledge(actions, twinId, knowledge, onCopied),
		},
	};
	for (const step of twinSetupSteps(profile, knowledge)) {
		if (step === "twin") continue;
		try {
			await during(step, setUp[step].run);
		} catch (cause) {
			throw new TwinSetupError(
				`Your Digital Twin was created, but ${setUp[step].failure}: ${reason(cause)}`,
				twinId,
				{ cause },
			);
		}
	}
	return twinId;
}

/** Delete the owner's twin, with its files and the access people have to it. */
export async function deleteTwin(
	actions: InsightActions,
	twinId: string,
): Promise<void> {
	await callPixel(
		actions,
		pixel("DeleteWorkspace", { workspaceId: twinId }),
		z.unknown(),
	);
}

/** Whether the twin's files folder is there; a twin whose setup stopped early has none. */
export async function hasTwinFolder(
	actions: InsightActions,
	twinId: string,
): Promise<boolean> {
	const files = twinFiles(twinId);
	// the project's top folder, so a missing files folder is an answer and not a failed read
	const listing = await callPixel(actions, files.browse("/"), z.unknown());
	return files
		.mapEntries(listing, "/")
		.some(
			(item) =>
				item.type === "directory" &&
				item.name === TWIN_FILES_PATH.slice(1),
		);
}

/** Make the twin's files folder. Only where it is known to be missing. */
export async function createTwinFolder(
	actions: InsightActions,
	twinId: string,
): Promise<void> {
	await callPixel(
		actions,
		twinFiles(twinId).createDirectory(TWIN_FILES_PATH),
		z.unknown(),
	);
}

// one folder per kind, so a later version can move them under per-audience sets
const SAVED_FOLDERS: Partial<Record<ConnectorSavedFile["service"], string>> = {
	"outlook-mail": "emails",
	"teams-chats": "teams-chats",
};

/**
 * Copy something in the page's files into the twin's. It has to run in the
 * insight the file was saved into, which is where the copy reads it from.
 * Nothing is overwritten: a name already taken gets a numbered copy.
 *
 * @returns The path the copy was written to, inside the twin's project.
 */
export async function copyToTwin(
	actions: InsightActions,
	twinId: string,
	source: TwinSource,
): Promise<string> {
	const folder = (source.service && SAVED_FOLDERS[source.service]) || "files";
	const copied = await callPixel(
		actions,
		pixel("Copy", {
			sourceType: "INSIGHT",
			sourceFilePath: source.path,
			target: twinId,
			targetType: "PROJECT",
			targetFilePath: `${TWIN_FILES_PATH.slice(1)}/${folder}/${source.name}`,
		}),
		z.object({ targetFilePath: z.string() }),
	);
	return copied.targetFilePath;
}

/**
 * Copy what the owner chose into the twin, one after another. Every one is
 * tried, so one that fails does not keep the rest out.
 *
 * @param onCopied - Told as each is copied, so a caller knows which never to
 * copy again; the next copy waits for what this returns.
 * @throws when any could not be copied, naming each with the reason.
 */
export async function addTwinKnowledge(
	actions: InsightActions,
	twinId: string,
	sources: TwinSource[],
	onCopied?: (source: TwinSource) => void | Promise<void>,
): Promise<void> {
	const failures: string[] = [];
	for (const source of sources) {
		try {
			await copyToTwin(actions, twinId, source);
		} catch (cause) {
			failures.push(`"${source.name}": ${reason(cause)}`);
			continue;
		}
		await onCopied?.(source);
	}
	if (failures.length) throw new Error(failures.join(" "));
}
