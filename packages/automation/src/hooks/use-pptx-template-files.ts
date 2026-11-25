import { runPixel, usePixel } from "@semoss/sdk/react";

/** Where a template lives. TemplatePPTX looks in the insight folder first, then the project assets. */
export type PptxTemplateSource = "project" | "insight";

/** A .pptx file that can be used as a template. */
export interface PptxTemplateFile {
	name: string;
	/** Path relative to the folder it lives in, as `template_file` expects. */
	path: string;
	source: PptxTemplateSource;
}

export interface PptxTemplateFilesGroup {
	files: PptxTemplateFile[];
	isLoading: boolean;
	error?: Error;
}

export interface PptxTemplateFiles {
	project: PptxTemplateFilesGroup;
	insight: PptxTemplateFilesGroup;
}

/**
 * Narrows a recursive asset search result to its .pptx files.
 *
 * @param output - The raw `Search*Assets` output.
 * @param source - The folder that was searched.
 * @return The .pptx files, sorted by path.
 */
export function toPptxTemplateFiles(
	output: unknown,
	source: PptxTemplateSource,
): PptxTemplateFile[] {
	if (!Array.isArray(output)) return [];
	const files: PptxTemplateFile[] = [];
	for (const entry of output) {
		if (typeof entry !== "object" || entry === null) continue;
		const { name, path, type } = entry as Record<string, unknown>;
		if (
			type === "directory" ||
			typeof name !== "string" ||
			typeof path !== "string" ||
			!name.toLowerCase().endsWith(".pptx")
		) {
			continue;
		}
		// Search paths are rooted ("/decks/a.pptx"); the reactor wants them relative.
		files.push({
			name,
			path: path.replace(/\\/g, "/").replace(/^\/+/, ""),
			source,
		});
	}
	return files.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Locates the file a TemplatePPTX step's `templateFile` names, looking where
 * the reactor does: the insight folder first, then the project assets.
 *
 * @param appId - The automation's project.
 * @param insightId - The insight whose folder is searched.
 * @param templateFile - The step's template path, relative to either folder.
 * @return The matching template, or null when none is found or a search fails.
 */
export async function findPptxTemplateFile(
	appId: string,
	insightId: string | undefined,
	templateFile: string,
): Promise<PptxTemplateFile | null> {
	const wanted = templateFile.replace(/\\/g, "/").replace(/^\/+/, "");
	if (!wanted.toLowerCase().endsWith(".pptx")) return null;

	const searches: Array<[PptxTemplateSource, string]> = [
		["insight", 'SearchInsightAssets(filePath=["/"], search=[".pptx"]);'],
	];
	if (appId) {
		searches.push([
			"project",
			`SearchAppAssets(filePath=["/"], project=${JSON.stringify([appId])}, search=[".pptx"]);`,
		]);
	}

	for (const [source, pixel] of searches) {
		const response = await runPixel<[unknown]>(pixel, insightId);
		if (response.errors.length > 0) continue;
		const match = toPptxTemplateFiles(
			response.pixelReturn?.[0]?.output,
			source,
		).find((file) => file.path === wanted);
		if (match) return match;
	}
	return null;
}

/**
 * Finds the .pptx templates the TemplatePPTX reactor can read: those in the
 * automation's project assets and in the current insight's folder.
 *
 * @param appId - The automation's project. Without it only the insight is searched.
 * @param enabled - Searches run only while true, so a closed picker costs nothing.
 * @return The templates and request state of each folder.
 */
export function usePptxTemplateFiles(
	appId: string,
	enabled: boolean,
): PptxTemplateFiles {
	const projectPixel =
		enabled && appId
			? `SearchAppAssets(filePath=["/"], project=${JSON.stringify([appId])}, search=[".pptx"]);`
			: "";
	const insightPixel = enabled
		? 'SearchInsightAssets(filePath=["/"], search=[".pptx"]);'
		: "";

	const project = usePixel<unknown>(projectPixel);
	const insight = usePixel<unknown>(insightPixel);

	return {
		project: {
			files: toPptxTemplateFiles(project.data, "project"),
			isLoading: project.status === "LOADING",
			error: project.error,
		},
		insight: {
			files: toPptxTemplateFiles(insight.data, "insight"),
			isLoading: insight.status === "LOADING",
			error: insight.error,
		},
	};
}
