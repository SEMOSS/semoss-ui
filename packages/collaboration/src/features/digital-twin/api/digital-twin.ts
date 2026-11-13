import type { ConnectorSavedFile } from "@semoss/connectors";
import { uploadProjectImage } from "@semoss/sdk";
import {
	buildEditWorkspacePixel,
	type FileItem,
	getFileExplorerAdapter,
	getWorkspaceSaveWarning,
	type MCPConfig,
	toAgentFormValues,
} from "@semoss/shared";
import { z } from "@semoss/ui/next";
import { decodeBase64ToBytes } from "@semoss/utility/encoding";
import { tryParseJson } from "@semoss/utility/json";
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

// Which item each copy in the twin came from, by the copy's path, so a list of the owner's emails, chats or
// files can mark what the twin already holds. It sits beside the files folder, not in it: a chat reads only
// that folder, and so do the people the twin is shared with.
const TWIN_SOURCES_FILE = "twin-sources.json";
const TWIN_SOURCES_PATH = `/${TWIN_SOURCES_FILE}`;
const twinSourcesSchema = z.record(z.string(), z.string());

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

const isFilesFolder = (item: FileItem): boolean =>
	item.type === "directory" && item.name === TWIN_FILES_PATH.slice(1);

/** What is at the top of the twin's project. That folder is always there, so something missing is an answer and not a failed read. */
async function listTwinTop(
	actions: InsightActions,
	twinId: string,
): Promise<FileItem[]> {
	const files = twinFiles(twinId);
	return files.mapEntries(
		await callPixel(actions, files.browse("/"), z.unknown()),
		"/",
	);
}

// What is still on its way into each twin. A twin's list of sources is read, changed and saved whole, so
// one change at a time; a person has one twin, so this holds one entry.
const TWIN_QUEUES = new Map<string, Promise<unknown>>();

/** Run after everything already queued for the twin, whether or not that worked. */
function queueForTwin<T>(twinId: string, task: () => Promise<T>): Promise<T> {
	const next = (TWIN_QUEUES.get(twinId) ?? Promise.resolve()).then(
		task,
		task,
	);
	TWIN_QUEUES.set(
		twinId,
		next.catch(() => undefined),
	);
	return next;
}

/**
 * Which item each copy came from. Empty when nothing is recorded yet, and when
 * what is recorded cannot be read as a list, which the next copy starts over.
 *
 * @param top - What is at the top of the twin's project, read just before.
 */
async function readTwinSources(
	actions: InsightActions,
	twinId: string,
	top: FileItem[],
): Promise<Record<string, string>> {
	if (!top.some((item) => item.name === TWIN_SOURCES_FILE)) return {};
	const content = await callPixel(
		actions,
		twinFiles(twinId).read(TWIN_SOURCES_PATH),
		z.unknown(),
	);
	// a file's contents come as text; a list already read out of it is taken as it is
	const sources = twinSourcesSchema.safeParse(
		typeof content === "string" ? tryParseJson(content) : content,
	);
	return sources.success ? sources.data : {};
}

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

/** A generated avatar option: the file a save uploads, and an address to show it from. */
export interface TwinAvatarOption {
	file: File;
	url: string;
}

const avatarSchema = z.object({
	needsDescription: z.boolean().optional(),
	image: z.string().min(1).optional(),
});

/**
 * Ask the server for one avatar option: a cartoon character drawn with the
 * owner's Microsoft profile photo as a rough reference, or from `description`
 * when one is given. The server picks the image model, and nothing is saved
 * until the twin is.
 *
 * @param description - How the avatar should look; left out to use the photo.
 * @param variant - Which look to draw, as any whole number: the server counts
 * it round the looks it has, so three numbers in a row are three different looks.
 * @returns The option, or null when the owner has no photo and gave no description.
 */
// shortcut: each option is one ordinary request, so a picture slower than the load balancer allows fails; run it as a pixel job (actions.runAsync and polling) if that shows up
export async function generateTwinAvatar(
	actions: InsightActions,
	description?: string,
	variant?: number,
): Promise<TwinAvatarOption | null> {
	const answer = await callPixel(
		actions,
		pixel("WorkGenerateTwinAvatar", { description, variant }),
		avatarSchema,
	);
	if (!answer.image) {
		if (answer.needsDescription) return null;
		throw new Error("The server did not return a picture.");
	}
	return {
		// the server always answers with a PNG, a type the image upload takes
		file: new File([decodeBase64ToBytes(answer.image)], "avatar.png", {
			type: "image/png",
		}),
		url: `data:image/png;base64,${answer.image}`,
	};
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
	/** What that viewer knows the item by, so its list can mark it; an upload has none. */
	itemKey?: string;
}

/** A copy made in a twin. */
export interface TwinCopy {
	/** The path the copy was written to, inside the twin's project. */
	path: string;
	/**
	 * Why the item it came from could not be recorded, when it could not. The
	 * copy is in the twin all the same; the owner's list stops marking it
	 * once the page is read again.
	 */
	recordError?: string;
}

/** What a twin holds, as the page that fills it needs it. */
export interface TwinHoldings {
	/** Whether its files folder is there; a twin whose setup stopped early has none. */
	hasFolder: boolean;
	/** The items it holds a copy of, by what their viewer knows them by. */
	itemKeys: ReadonlySet<string>;
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
	return (await listTwinTop(actions, twinId)).some(isFilesFolder);
}

/**
 * What the twin holds: its files folder, and the items a viewer saved that it
 * still has a copy of. A copy the owner deleted since no longer counts, and
 * neither does one made before copies recorded where they came from.
 */
export function readTwinHoldings(
	actions: InsightActions,
	twinId: string,
): Promise<TwinHoldings> {
	// after the copies still on their way, so what they record is read too
	return queueForTwin(twinId, async () => {
		const top = await listTwinTop(actions, twinId);
		const hasFolder = top.some(isFilesFolder);
		// without the folder there is no copy, and without a record no copy to look for
		if (!hasFolder || !top.some((item) => item.name === TWIN_SOURCES_FILE))
			return { hasFolder, itemKeys: new Set<string>() };
		const [sources, found] = await Promise.all([
			readTwinSources(actions, twinId, top),
			// every file under the folder, however deep; the pattern is any name
			callPixel(
				actions,
				pixel("SearchAppAssets", {
					project: twinId,
					filePath: TWIN_FILES_PATH,
					search: ".",
					options: ["regex"],
				}),
				z.array(z.object({ path: z.string() })),
			),
		]);
		// a listing starts its paths with a slash; a copy answers with its path without one
		const held = new Set(
			found.map((item) => item.path.replace(/^\/+/, "")),
		);
		return {
			hasFolder,
			itemKeys: new Set(
				Object.entries(sources)
					.filter(([path]) => held.has(path))
					.map(([, itemKey]) => itemKey),
			),
		};
	});
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
 * Copy something in the page's files into the twin's, and record which item
 * it came from when a viewer saved it, so the owner's lists can mark it. It
 * has to run in the insight the file was saved into, which is where the copy
 * reads it from. Nothing is overwritten: a name already taken gets a numbered
 * copy. Copies into one twin run one after another.
 *
 * @returns The copy; it is in the twin even when its source could not be recorded.
 * @throws when the copy itself could not be made.
 */
export function copyToTwin(
	actions: InsightActions,
	twinId: string,
	source: TwinSource,
): Promise<TwinCopy> {
	const folder = (source.service && SAVED_FOLDERS[source.service]) || "files";
	return queueForTwin(twinId, async () => {
		const { targetFilePath: path } = await callPixel(
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
		if (!source.itemKey) return { path };
		try {
			// read again each time: another window may have added to it since
			const sources = await readTwinSources(
				actions,
				twinId,
				await listTwinTop(actions, twinId),
			);
			await callPixel(
				actions,
				twinFiles(twinId).save(
					TWIN_SOURCES_PATH,
					JSON.stringify({ ...sources, [path]: source.itemKey }),
				),
				z.unknown(),
			);
			return { path };
		} catch (cause) {
			return { path, recordError: reason(cause) };
		}
	});
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
