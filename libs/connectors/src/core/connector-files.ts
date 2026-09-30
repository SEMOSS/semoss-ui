import { uploadInsight } from "@semoss/sdk";
import type {
	ConnectorSavedFile,
	ConnectorViewerService,
} from "./connector.types";
import { runConnectorPixel } from "./connector-pixel";

/** Lists the top of the insight's folder, where every download lands. */
const LIST_INSIGHT_ROOT = 'BrowseInsightAssets(filePath=["/"]);';

/** Characters no common file system allows in a name. */
const RESERVED_NAME_CHARACTERS = /[\\/:*?"<>|]/g;

/** Longest name a saved file is given, extension included. */
const MAX_NAME_LENGTH = 120;

/**
 * Whether a character is a control character, which names cannot hold.
 *
 * @param character - One character.
 * @return True for U+0000 to U+001F and U+007F.
 */
const isControlCharacter = (character: string): boolean => {
	const code = character.charCodeAt(0);
	return code < 32 || code === 127;
};

/**
 * A name that is safe to save a file under on the server: no path separators,
 * reserved or control characters, or leading dots, and no longer than a file
 * system allows. The extension is kept when the name is shortened.
 *
 * @param name - The name the item has in Microsoft 365, or a title.
 * @param fallback - The name to use when nothing usable is left.
 * @return The safe name.
 */
export const toSafeFileName = (name: string, fallback: string): string => {
	let cleaned = "";
	for (const character of name) {
		cleaned += isControlCharacter(character) ? " " : character;
	}
	cleaned = cleaned
		.replace(RESERVED_NAME_CHARACTERS, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/^\.+/, "")
		.trim();

	if (!cleaned) {
		return fallback;
	}
	if (cleaned.length <= MAX_NAME_LENGTH) {
		return cleaned;
	}

	const dot = cleaned.lastIndexOf(".");
	const extension =
		dot > 0 && cleaned.length - dot <= 12 ? cleaned.slice(dot) : "";
	return `${cleaned.slice(0, MAX_NAME_LENGTH - extension.length).trim()}${extension}`;
};

/**
 * A name no file in the folder has yet, made by numbering the name the way
 * file managers do: `report.pdf`, then `report (2).pdf`. Names are compared
 * without case, since the server's disk may not tell case apart.
 *
 * @param name - The wanted name.
 * @param taken - The names already in the folder.
 * @return The wanted name when it is free, or else a numbered one.
 */
export const toUniqueFileName = (
	name: string,
	taken: Iterable<string>,
): string => {
	const used = new Set<string>();
	for (const existing of taken) {
		used.add(existing.toLowerCase());
	}
	if (!used.has(name.toLowerCase())) {
		return name;
	}

	const dot = name.lastIndexOf(".");
	const base = dot > 0 ? name.slice(0, dot) : name;
	const extension = dot > 0 ? name.slice(dot) : "";
	for (let copy = 2; copy < 1000; copy++) {
		const candidate = `${base} (${copy})${extension}`;
		if (!used.has(candidate.toLowerCase())) {
			return candidate;
		}
	}
	return `${base} (${Date.now()})${extension}`;
};

/**
 * The names at the top of the insight's folder.
 *
 * @param insightId - The insight.
 * @return The names of its top level files and folders.
 */
const listInsightRootNames = async (insightId: string): Promise<string[]> => {
	const output = await runConnectorPixel(LIST_INSIGHT_ROOT, insightId);
	if (!Array.isArray(output)) {
		return [];
	}
	const names: string[] = [];
	for (const entry of output) {
		if (
			typeof entry === "object" &&
			entry !== null &&
			"name" in entry &&
			typeof entry.name === "string"
		) {
			names.push(entry.name);
		}
	}
	return names;
};

/** The last download queued for each insight. */
const DOWNLOAD_QUEUES = new Map<string, Promise<unknown>>();

/**
 * Run a download after the ones already queued for the same insight, so each
 * picks its name knowing what the one before it wrote. Two files of one name
 * saved at once would otherwise both take the same free name, and the second
 * would replace the first.
 *
 * @param insightId - The insight the file goes into.
 * @param task - The download.
 * @return The download's result.
 */
const queueDownload = <T>(
	insightId: string,
	task: () => Promise<T>,
): Promise<T> => {
	const previous = DOWNLOAD_QUEUES.get(insightId) ?? Promise.resolve();
	const next = previous.then(task, task);
	const settled = next.then(
		() => undefined,
		() => undefined,
	);
	DOWNLOAD_QUEUES.set(insightId, settled);
	void settled.then(() => {
		if (DOWNLOAD_QUEUES.get(insightId) === settled) {
			DOWNLOAD_QUEUES.delete(insightId);
		}
	});
	return next;
};

/** How to put one item into the insight's files. */
export type ConnectorSaveSource =
	| {
			/** A file a provider's download reactor writes into the insight. */
			kind: "download";
			/** The name to save it as, before it is made unique. */
			fileName: string;
			/** The download pixel, given the free name to save under. */
			buildPixel: (fileName: string) => string;
			/**
			 * Where the reactor's output says the file landed, relative to the
			 * insight's folder, read with the provider's own parser.
			 */
			readSavedPath: (output: unknown) => string;
	  }
	| {
			/** Text the viewer writes out, such as an email as Markdown. */
			kind: "text";
			/** The name to save it as. The upload keeps names unique. */
			fileName: string;
			/** The file's contents, read when the save runs. */
			getContent: () => string | Promise<string>;
	  };

/**
 * Save an item at the top of the insight's folder.
 *
 * Downloads are given a name nothing in the folder has yet, because the
 * download reactors replace a file of the same name without asking, and the
 * folder also holds the user's uploads and what apps created. Everything goes
 * to the top of the folder because a message's `media` is copied flat into the
 * room, so a file anywhere else would be copied a second time.
 *
 * @param insightId - The insight whose files receive the item.
 * @param service - The viewer saving it.
 * @param source - What to save.
 * @return The saved file.
 * @throws Error when the item could not be saved.
 */
export const saveToInsight = async (
	insightId: string,
	service: ConnectorViewerService,
	source: ConnectorSaveSource,
): Promise<ConnectorSavedFile> => {
	if (source.kind === "download") {
		return queueDownload(insightId, async () => {
			const taken = await listInsightRootNames(insightId);
			const fileName = toUniqueFileName(
				toSafeFileName(source.fileName, "download"),
				taken,
			);
			const path = source.readSavedPath(
				await runConnectorPixel(source.buildPixel(fileName), insightId),
			);
			return {
				path: path,
				name: path.split("/").pop() || fileName,
				service: service,
			};
		});
	}

	const content = await source.getContent();
	const file = new File(
		[content],
		toSafeFileName(source.fileName, "note.md"),
		{
			type: "text/markdown",
		},
	);
	const { data } = await uploadInsight(insightId, "", file);
	const saved = Array.isArray(data) ? data[0] : undefined;
	if (!saved?.fileLocation) {
		throw new Error("The server did not save the file.");
	}
	return {
		path: saved.fileLocation,
		name: saved.fileName || file.name,
		service: service,
	};
};
