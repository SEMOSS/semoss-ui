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
import { sanitizeFileNameStem } from "@semoss/utility/file";
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

// The note an owner writes about themself. It is a copy like any other: the twin reads it with the rest, the
// people it is shared with can open it, and its owner can also edit it under Files.
const TWIN_NOTE_FILE = "About me.md";
const TWIN_NOTE_PATH = `${TWIN_FILES_PATH}/${TWIN_NOTE_FILE}`;
/** The most an owner's note about themself can hold. */
export const TWIN_NOTE_MAX_LENGTH = 8000;

/** A Digital Twin as the lists show it. */
export interface DigitalTwin {
	id: string;
	name: string;
}

/** What an owner sets on their twin. */
export interface TwinProfile {
	name: string;
	instructions: string;
	/** The twin's opening message; empty for none. */
	greeting: string;
	/** The owner's note about themself, which the twin reads with its copies; empty for none. */
	about: string;
	/** Ids from the owner's skill catalog. */
	skills: string[];
	toolboxes: Pick<MCPConfig, "id" | "name" | "type">[];
	/** A new image to upload; without one the twin keeps the image it has. */
	image?: File | null;
}

/**
 * A create that made the twin but could not finish setting it up. The caller
 * finishes `twinId` on retry instead of creating a duplicate.
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
	// 1 is owner: the twins this person created and still owns
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
// one change at a time per twin.
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

/** All twins the signed-in person created and still owns. */
async function listMyTwins(actions: InsightActions): Promise<DigitalTwin[]> {
	return (await callPixel(actions, MY_TWIN_PIXEL, projectListSchema)).map(
		toTwin,
	);
}

/** An owned twin by id; older links without an id work only when there is at most one. */
export async function getMyTwin(
	actions: InsightActions,
	twinId?: string,
): Promise<DigitalTwin | null> {
	const twins = await listMyTwins(actions);
	if (twinId !== undefined) {
		const twin = twins.find((entry) => entry.id === twinId);
		if (!twin)
			throw new Error(
				"This Digital Twin is unavailable or is not yours to manage.",
			);
		return twin;
	}
	if (twins.length > 1) {
		throw new Error(
			"You have more than one Digital Twin. Go back to Digital Twins and choose one.",
		);
	}
	return twins[0] ?? null;
}

/** The signed-in person's own twin with its full configuration, or null when they have none. */
export async function getMyTwinAgent(actions: InsightActions, twinId?: string) {
	const twin = await getMyTwin(actions, twinId);
	return twin ? getAgent(actions, twin.id) : null;
}

/** The signed-in person's own twins, and the twins other people shared with them. */
export async function listTwins(
	actions: InsightActions,
): Promise<{ mine: DigitalTwin[]; shared: DigitalTwin[] }> {
	const [mine, all] = await Promise.all([
		listMyTwins(actions),
		callPixel(actions, TWINS_PIXEL, projectListSchema),
	]);
	const mineIds = new Set(mine.map((twin) => twin.id));
	return {
		mine,
		shared: all.filter((row) => !mineIds.has(row.project_id)).map(toTwin),
	};
}

/**
 * Save the fields the form shows over the twin's whole configuration, so
 * what the form does not show (model, limits, knowledge, hooks) is kept.
 */
export async function saveTwinProfile(
	actions: InsightActions,
	twinId: string,
	profile: Omit<TwinProfile, "image" | "about">,
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

/**
 * The note the twin's owner wrote about themself; empty when there is none.
 *
 * @throws when the twin's files could not be read, so a note that is there is
 * never taken for none and then saved over.
 */
export async function readTwinNote(
	actions: InsightActions,
	twinId: string,
): Promise<string> {
	const files = twinFiles(twinId);
	// looked for before it is read: a file that is not there is an answer, a read that fails is not
	if (!(await listTwinTop(actions, twinId)).some(isFilesFolder)) return "";
	const held = files.mapEntries(
		await callPixel(actions, files.browse(TWIN_FILES_PATH), z.unknown()),
		TWIN_FILES_PATH,
	);
	const isHeld = held.some(
		(item) => item.type !== "directory" && item.name === TWIN_NOTE_FILE,
	);
	return isHeld
		? callPixel(actions, files.read(TWIN_NOTE_PATH), z.string())
		: "";
}

/**
 * Save the owner's note about themself over the one the twin holds, after
 * what is already on its way into the twin. An empty note takes the file away.
 */
export function saveTwinNote(
	actions: InsightActions,
	twinId: string,
	note: string,
): Promise<void> {
	return queueForTwin(twinId, async () => {
		await callPixel(
			actions,
			note.trim()
				? // built here and not by the files adapter, which puts the text between <encode> tags as it
					// is: a note can say anything, those tags too
					pixel("SaveAppAssets", {
						project: twinId,
						filePath: TWIN_NOTE_PATH,
						content: note,
					})
				: twinFiles(twinId).remove(TWIN_NOTE_PATH),
			z.unknown(),
		);
	});
}

/**
 * Save an existing twin: its profile, then its owner's note when that
 * changed, then a newly chosen image.
 *
 * @param savedAbout - The note the twin holds, as it was last read or saved.
 * Left out when that is not known, and the note is then left as it is.
 */
export async function saveTwin(
	actions: InsightActions,
	twinId: string,
	{ image, about, ...profile }: TwinProfile,
	savedAbout?: string,
): Promise<void> {
	await saveTwinProfile(actions, twinId, profile);
	// an unchanged note is not written again: its owner may have edited the file under Files since
	if (
		savedAbout !== undefined &&
		about !== savedAbout &&
		(about.trim() || savedAbout.trim())
	) {
		try {
			await saveTwinNote(actions, twinId, about);
		} catch (cause) {
			throw new Error(
				`Your changes were saved, but your note could not be: ${reason(cause)}`,
				{ cause },
			);
		}
	}
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
	| "note"
	| "knowledge";

/**
 * The steps creating this profile takes, in the order they run: the agent,
 * its files folder, then its greeting, its image and its owner's note when it
 * has them, none of which the create call takes, then the copies of what the
 * owner chose.
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
		...(profile.about.trim() ? (["note"] as const) : []),
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
		note: {
			failure: "your note could not be saved",
			run: () => saveTwinNote(actions, twinId, profile.about),
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

/**
 * Tell people a twin was shared with them, in an email from the owner's own
 * Outlook. One person gets a letter to themself; several are hidden from each
 * other, since who a twin is shared with is its owner's to know.
 *
 * @param emails - Who to tell; at least one.
 * @throws when Outlook did not send it, such as when it is not connected.
 */
export async function sendTwinNote(
	actions: InsightActions,
	emails: string[],
	subject: string,
	body: string,
): Promise<void> {
	await callPixel(
		actions,
		pixel("MicrosoftOutlookSendMail", {
			...(emails.length === 1 ? { to: emails } : { bcc: emails }),
			subject,
			body,
		}),
		z.object({ sent: z.literal(true) }),
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

const twinIndexSchema = z.object({
	described: z.number(),
	remaining: z.number(),
});
// the server describes about a dozen files a pass, so this covers a first pass over a large twin
const MAX_INDEX_PASSES = 10;

/**
 * Bring the twin's index of what its files hold up to date, so a chat with it
 * is told what each copy is about and not only its file name. The server
 * describes a few files a pass and says how many wait, so this asks again
 * while a pass still got somewhere. Each pass takes its own turn after what is
 * on its way into the twin, so an add made meanwhile goes ahead of the next.
 *
 * It never fails: a twin works without descriptions, and the next time its
 * owner opens its pages the index is tried again.
 */
export async function indexTwinFiles(
	actions: InsightActions,
	twinId: string,
): Promise<void> {
	for (let pass = 0; pass < MAX_INDEX_PASSES; pass += 1) {
		const result = await queueForTwin(twinId, () =>
			callPixel(
				actions,
				pixel("WorkIndexTwinFiles", { project: twinId }),
				twinIndexSchema,
			),
		).catch(() => null);
		// nothing waits, or what waits cannot be described now: no text model, or a file the model fails on
		if (!result || result.remaining <= 0 || result.described <= 0) return;
	}
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
	"outlook-calendar": "meetings",
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

const transcriptPageSchema = z.object({
	subject: z.string().optional(),
	transcript: z.string().optional(),
	hasMore: z.boolean().optional(),
	nextOffset: z.number().optional(),
	message: z.string().optional(),
});
// a page is about three quarters of an hour of talk, so this is a meeting of a whole day
const MAX_TRANSCRIPT_PAGES = 12;

/** What was said in a meeting, or why that cannot be read. */
export type MeetingTranscript =
	| {
			/** The meeting's subject; empty when it has none. */
			subject: string;
			/** A line for each turn, starting with who spoke. */
			text: string;
			/** Whether the meeting ran on past what was read. */
			isCutShort: boolean;
	  }
	| {
			/** Why there is nothing to read, in the server's words. */
			message: string;
	  };

/**
 * Read what was said in the Teams meeting of an event on the owner's Outlook
 * calendar, a page at a time until it is all read. Only a server whose
 * Microsoft sign in asks for the transcript scope can.
 *
 * @param eventId - The event, as the calendar names it.
 */
// shortcut: never run against Microsoft: the scope it needs has not been granted to any deployment yet, so check it against a real meeting once one has it
export async function readMeetingTranscript(
	actions: InsightActions,
	eventId: string,
): Promise<MeetingTranscript> {
	const pages: string[] = [];
	let subject = "";
	let offset: number | undefined;
	for (let page = 0; page < MAX_TRANSCRIPT_PAGES; page += 1) {
		const answer = await callPixel(
			actions,
			pixel("MicrosoftCalendarGetMeetingTranscript", {
				id: eventId,
				offset,
			}),
			transcriptPageSchema,
		);
		subject = answer.subject ?? subject;
		if (answer.transcript === undefined)
			// a meeting with a transcript answers no message, so one on a later page is not an answer for all of it
			return pages.length === 0
				? {
						message:
							answer.message ?? "This meeting has no transcript.",
					}
				: { subject, text: pages.join("\n"), isCutShort: true };
		pages.push(answer.transcript);
		if (!answer.hasMore || answer.nextOffset === undefined)
			return {
				subject,
				text: pages.join("\n"),
				// more was promised, without saying where it starts
				isCutShort: answer.hasMore === true,
			};
		offset = answer.nextOffset;
	}
	return { subject, text: pages.join("\n"), isCutShort: true };
}

/**
 * A meeting's transcript as the Markdown file a twin keeps beside the
 * meeting: its subject as the title, then a line for each turn.
 */
export function meetingTranscriptFile(
	transcript: Extract<MeetingTranscript, { text: string }>,
): File {
	const subject = transcript.subject.trim() || "Meeting";
	return new File(
		[
			`# ${subject}: transcript\n\n${transcript.text}\n`,
			transcript.isCutShort
				? "\nThe meeting went on past this point; the rest of its transcript was not read.\n"
				: "",
		],
		`${sanitizeFileNameStem(subject).slice(0, 100) || "Meeting"}-transcript.md`,
		{ type: "text/markdown" },
	);
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
