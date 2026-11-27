import { runPixel } from "./base";
import { throwOnPixelErrors } from "./playground-room";

// -------------------------------------------------------------------------------------------------
// Knowledge sources: the vector databases a user can read, the documents embedded in them, and
// embedding more. Each call runs in the insight it is given, normally the session's
// (`Session.insight.withInsight`).
// -------------------------------------------------------------------------------------------------

/** A knowledge source (a vector database), as `MyEngines` returns it. */
export interface KnowledgeEngine {
	/** The engine's id. */
	engine_id: string;
	/** The engine's name. */
	engine_name: string;
	/** The name to show, when it differs from the engine's name. */
	engine_display_name?: string;
	/** The engine's description metadata. */
	description?: string;
	/** The engine's tag metadata: one tag, or several. */
	tag?: string[] | string;
	/** When the engine was created, as `yyyy-MM-dd HH:mm:ss` in UTC. */
	engine_date_created?: string;
	/** 1 when the user has favorited the engine. */
	engine_favorite?: number;
}

/** Which knowledge sources {@link listKnowledgeEngines} reads. */
export interface ListKnowledgeEnginesOptions {
	/** Read only this engine, with the user's own permission on it. */
	engineId?: string;
	/** Read only the engines tagged with one of these tags. */
	tags?: readonly string[];
}

/** A document embedded in a knowledge source, as `ListDocumentsInVectorDatabase` returns it. */
export interface VectorDocument {
	/** The document's file name. */
	fileName: string;
	/**
	 * The document's size in kilobytes. Missing when the file is no longer in
	 * the source's documents folder.
	 */
	fileSize?: number;
	/**
	 * When the document last changed, as `yyyy-MM-dd HH:mm:ss`. Missing when
	 * the file is no longer in the source's documents folder.
	 */
	lastModified?: string;
}

/**
 * Read the user's knowledge sources (`MyEngines` over VECTOR engines, with
 * their description and tag metadata).
 *
 * @param insightId - The insight to run in.
 * @param options - Read one engine, or only the engines with some tags;
 * every source without either.
 * @returns The sources.
 * @throws When the backend reports an error.
 */
export const listKnowledgeEngines = async (
	insightId: string,
	options: ListKnowledgeEnginesOptions = {},
): Promise<KnowledgeEngine[]> => {
	const { engineId, tags } = options;
	let pixel = `MyEngines ( engineTypes = [ 'VECTOR' ], metaKeys = ["description", "tag"])`;
	if (engineId) {
		pixel = `MyEngines(engine=["${engineId}"], engineTypes=['VECTOR'], metaKeys=["description","tag"], userT=[true], limit=[1], offset=[0]);`;
	} else if (tags) {
		pixel = `MyEngines ( engineTypes = [ 'VECTOR' ], metaKeys = ["description", "tag"],  metaFilters=[{"tag":${JSON.stringify(tags)}}])`;
	}

	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[KnowledgeEngine[]]>(pixel, insightId),
	);
	return pixelReturn[0]?.output ?? [];
};

/**
 * Read the documents embedded in a knowledge source
 * (`ListDocumentsInVectorDatabase`).
 *
 * @param insightId - The insight to run in.
 * @param engineId - The knowledge source.
 * @returns Its documents.
 * @throws When the backend reports an error, as when the user cannot view it.
 */
export const listVectorDocuments = async (
	insightId: string,
	engineId: string,
): Promise<VectorDocument[]> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[VectorDocument[]]>(
			`ListDocumentsInVectorDatabase(engine=["${engineId}"]);`,
			insightId,
		),
	);
	return pixelReturn[0]?.output ?? [];
};

/**
 * Read a file kept in an engine's folder as text (`GetEngineAssets`).
 *
 * @param insightId - The insight to run in.
 * @param engineId - The engine.
 * @param filePath - The file, from the engine's folder, such as
 * `/schema/default/documents/notes.txt`.
 * @returns The file's text.
 * @throws When the backend reports an error.
 */
export const getEngineAsset = async (
	insightId: string,
	engineId: string,
	filePath: string,
): Promise<string> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[string]>(
			`GetEngineAssets(filePath=["${filePath}"], engine=["${engineId}"]);`,
			insightId,
		),
	);
	return pixelReturn[0]?.output ?? "";
};

/**
 * Read a file kept in an engine's folder as base64 (`GetEngineAssetsBase64`),
 * for binary files such as PDFs and images.
 *
 * @param insightId - The insight to run in.
 * @param engineId - The engine.
 * @param filePath - The file, from the engine's folder.
 * @returns The file's bytes, base64 encoded.
 * @throws When the backend reports an error.
 */
export const getEngineAssetBase64 = async (
	insightId: string,
	engineId: string,
	filePath: string,
): Promise<string> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[string]>(
			`GetEngineAssetsBase64(filePath=["${filePath}"], engine=["${engineId}"]);`,
			insightId,
		),
	);
	return pixelReturn[0]?.output ?? "";
};

/**
 * Prepare a knowledge source's document for download (`VectorFileDownload`).
 * Download it with the key from the same insight, as
 * `Session.insight.download` does.
 *
 * @param insightId - The insight to run in, and to download from.
 * @param engineId - The knowledge source.
 * @param fileName - The document's file name.
 * @returns The key to download the file with.
 * @throws When the backend reports an error.
 */
export const downloadVectorFile = async (
	insightId: string,
	engineId: string,
	fileName: string,
): Promise<string> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[string]>(
			`META | VectorFileDownload(engine = "${engineId}", fileNames=["${fileName}"]);`,
			insightId,
		),
	);
	return pixelReturn[0]?.output ?? "";
};

/**
 * Embed uploaded documents into a knowledge source
 * (`CreateEmbeddingsFromDocuments`).
 *
 * @param insightId - The insight to run in: the one the files were uploaded to.
 * @param engineId - The knowledge source.
 * @param filePaths - Where the upload put each file (its `fileLocation`).
 * @throws When the backend reports an error.
 */
export const createEmbeddingsFromDocuments = async (
	insightId: string,
	engineId: string,
	filePaths: readonly string[],
): Promise<void> => {
	const paths = filePaths.map((path) => `"${path}"`).join(", ");
	throwOnPixelErrors(
		await runPixel<[unknown]>(
			`CreateEmbeddingsFromDocuments(engine=["${engineId}"], filePaths=[${paths}]);`,
			insightId,
		),
	);
};
