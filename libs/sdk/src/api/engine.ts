import { Env } from "../env";
import { post } from "../utility";
import { runPixel } from "./base";
import { type PixelMessages, readPixelMessages } from "./pixel-messages";

/**
 * Upload file(s) to an engine
 * @param engineId
 * @param path
 * @param files
 * @param insightId
 * @returns
 */
export const uploadEngine = async (
	engineId: string,
	path: string,
	files: File | File[],
	insightId: string | null,
) => {
	const fd: FormData = new FormData();
	if (Array.isArray(files)) {
		for (let i = 0; i < files.length; i++) {
			fd.append("file", files[i]);
		}
	} else {
		// pasted data
		fd.append("file", files);
	}

	return await post<
		{
			fileName: string;
			fileLocation: string;
		}[]
	>(
		`${Env.MODULE}/api/uploadFile/engineAssetsUpload?insightId=${insightId}&engineId=${engineId}&path=${encodeURIComponent(path)}`,
		fd,
		{},
	);
};

/** An engine {@link cloneEngine} made. */
export interface ClonedEngine {
	/** The clone's id. */
	engineId: string;
	/** The clone's name. */
	name: string;
	/** The clone's type, the type of the engine cloned, such as `DATABASE`. */
	engineType: string;
	/** What the backend reported about the clone. */
	messages: PixelMessages;
}

/**
 * Clone an engine of any type (CloneEngine) into a new private engine owned by
 * the signed in user, with a copy of everything the engine keeps on the server:
 * its folder (database file, vector indexes, python files and the rest), its
 * settings and secrets, its metadata and its image. Only the engine's owners
 * can clone it.
 *
 * @param params.engineId - The engine to clone.
 * @param params.name - The clone's name. Without one the backend names it after
 * the engine, followed by "Copy".
 * @param insightId - Insight to run the pixel against.
 * @returns The clone.
 * @throws Error when the backend refuses the clone or returns no engine id.
 */
export const cloneEngine = async (
	params: { engineId: string; name?: string },
	insightId?: string,
): Promise<ClonedEngine> => {
	const { engineId } = params;
	const name = params.name?.trim();
	const nameClause = name ? `, name=${JSON.stringify([name])}` : "";

	const response = await runPixel<[unknown]>(
		`CloneEngine(engine=${JSON.stringify([engineId])}${nameClause});`,
		insightId,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	const [statement] = response.pixelReturn;
	const output = statement?.output;
	if (typeof output !== "object" || output === null) {
		throw new Error("The clone returned no engine.");
	}
	const { engine_id, engine_display_name, engine_name, engine_type } =
		output as Record<string, unknown>;
	if (typeof engine_id !== "string" || !engine_id) {
		throw new Error("The clone returned no engine id.");
	}

	return {
		engineId: engine_id,
		name:
			typeof engine_display_name === "string" && engine_display_name
				? engine_display_name
				: typeof engine_name === "string"
					? engine_name
					: (name ?? ""),
		engineType: typeof engine_type === "string" ? engine_type : "",
		messages: readPixelMessages(statement),
	};
};

/**
 * Restart an engine (CloseEngine): close it so its next use opens it again from
 * its files, which shuts down the python process the engine owns and picks up
 * changed files. In a cluster every server closes it. Only the engine's owners
 * can restart it.
 *
 * @param engineId - The engine to restart.
 * @param insightId - Insight to run the pixel against.
 * @returns What the backend reported, such as whether the engine was running,
 * and a warning when the other servers could not be told.
 * @throws Error when the backend refuses the restart.
 */
export const restartEngine = async (
	engineId: string,
	insightId?: string,
): Promise<PixelMessages> => {
	const response = await runPixel<[unknown]>(
		`CloseEngine(engine=${JSON.stringify([engineId])});`,
		insightId,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	return readPixelMessages(response.pixelReturn[0]);
};
