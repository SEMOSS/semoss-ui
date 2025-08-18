// ------------------------------------------------------------------------------------------
// PIXEL LAYER (PROJECTS)
// All pixels that interact with projects should come through here
// We do this so we only have one reference to a pixel
// ------------------------------------------------------------------------------------------

import { runPixel, usePixel } from "@semoss/sdk/react";
import type { engine } from "@/components/app/app-details.utility";
import type {
	CreateProjectOutput,
	ProjectDependencyEngine,
	UploadProjectAppOutput,
} from "@/types";

// Helper types ----------------------------------------------------------------
/**
 * Standardized shape returned by lightweight pixel helper wrappers.
 * type === "error" indicates the underlying pixel operationType contained "ERROR".
 * output remains unknown for caller-side narrowing / casting.
 */
type PixelResponse = {
	type: "success" | "error";
	output: unknown;
};

/** Raw pixel execution envelope (subset of SDK return) exposing all operations. */
type PixelResult = {
	pixelReturn: Array<{
		operationType: string | string[];
		output: unknown;
	}>;
};

// ---------------------------------------------------------------------------
// New strongly-typed helpers (insight-aware) --------------------------------
// These mirror the generic helpers above but return typed outputs and accept
// an optional insightId when provided by consumer contexts.
// ---------------------------------------------------------------------------

// Minimal internal assertion helper to surface pixel errors consistently
/**
 * Assert the first pixel operation succeeded.
 * @param result PixelResult subset containing pixelReturn
 * @returns The first operation object when successful
 * @throws {Error} When the first operationType contains "ERROR"
 */
function assertNoError(result: { pixelReturn: PixelResult["pixelReturn"] }) {
	const first = result.pixelReturn[0];
	const opType = Array.isArray(first.operationType)
		? first.operationType.join(" ")
		: first.operationType;
	if (opType.includes("ERROR")) {
		throw new Error(String(first.output));
	}
	return first;
}

// Typed output shapes now sourced from shared types (see @/types) ---------

/**
 * Upload a project app archive (already present in temp storage) and return
 * project id plus any discovered engine ids.
 * @param fileLocation Temporary file path returned by uploadFile
 * @param isGlobal Whether the project should be global
 * @param insightId Insight context id for scoping
 * @returns Parsed UploadProjectAppOutput
 */
export async function uploadProjectAppPixel(
	fileLocation: string,
	isGlobal: boolean,
	insightId: string,
): Promise<UploadProjectAppOutput> {
	const { pixelReturn } = await runPixel<[UploadProjectAppOutput]>(
		`UploadProjectApp(filePath=["${fileLocation}"], global=[${isGlobal}]);`,
		insightId,
	);
	const first = assertNoError({ pixelReturn });
	return first.output as UploadProjectAppOutput;
}

/**
 * Create a new project.
 * @param name Project name
 * @param isGlobal Whether project is global
 * @param projectType Project type identifier (e.g. CODE)
 * @param insightId Insight context id
 * @param portal Whether to create portal (default true)
 * @returns Parsed CreateProjectOutput
 */
export async function createProjectPixel(
	name: string,
	isGlobal: boolean,
	projectType: string,
	insightId: string,
	portal = true,
): Promise<CreateProjectOutput> {
	const { pixelReturn } = await runPixel<[CreateProjectOutput]>(
		`CreateProject(project=["${name}"], global=["${isGlobal}"], projectType=["${projectType}"], portal=["${portal}"])`,
		insightId,
	);
	const first = assertNoError({ pixelReturn });
	return first.output as CreateProjectOutput;
}

/**
 * Set tags & description for a project. Keys omitted remain unchanged.
 * @param projectId Project identifier
 * @param tags Tag list
 * @param description Human-readable description
 * @param insightId Insight context id
 */
export async function setProjectMetadataPixel(
	projectId: string,
	tags: string[],
	description: string,
	insightId: string,
): Promise<void> {
	const meta = { tag: tags, description };
	const { pixelReturn } = await runPixel<[{ success?: boolean }]>(
		`SetProjectMetadata(project=["${projectId}"], meta=[${JSON.stringify(meta)}])`,
		insightId,
	);
	assertNoError({ pixelReturn });
}

/**
 * Delete existing version assets directory for a project.
 * @param projectId Project identifier
 * @param insightId Insight context id
 */
export async function deleteVersionAssetsPixel(
	projectId: string,
	insightId: string,
): Promise<void> {
	const { pixelReturn } = await runPixel<[{ success?: boolean }]>(
		`DeleteAsset(filePath=["version/assets/"], space=["${projectId}"]);`,
		insightId,
	);
	assertNoError({ pixelReturn });
}

/**
 * Unzip a previously uploaded archive into the project space.
 * Typically used after creating a project and uploading a version zip.
 * @param fileLocation File path in temporary storage
 * @param projectId Target project id
 * @param insightId Insight context id
 */
export async function unzipFilePixel(
	fileLocation: string,
	projectId: string,
	insightId: string,
): Promise<void> {
	const { pixelReturn } = await runPixel<[{ success?: boolean }]>(
		`UnzipFile(filePath=["${fileLocation}"], space=["${projectId}"]);`,
		insightId,
	);
	assertNoError({ pixelReturn });
}

// Helper functions for common patterns ---------------------------------------
/**
 * Interpret a raw PixelResult into a simpler PixelResponse at a given index.
 * @param result Raw pixel result
 * @param operationIndex Index of operation to inspect (default 0)
 * @returns Simplified PixelResponse
 */
const processPixelResponse = (
	result: PixelResult,
	operationIndex: number = 0,
): PixelResponse => {
	const operation = result.pixelReturn[operationIndex];
	const type = Array.isArray(operation.operationType)
		? operation.operationType[0]
		: operation.operationType;

	return {
		type: type.indexOf("ERROR") === -1 ? "success" : "error",
		output: operation.output,
	};
};

/**
 * Execute a pixel string and condense the first operation to PixelResponse.
 * @param query Pixel script string
 * @returns PixelResponse summarizing success/error & output
 */
const runPixelQuery = async (query: string): Promise<PixelResponse> => {
	const res = await runPixel(query);
	return processPixelResponse(res);
};

// NOTE: All functions below use SDK runPixel directly (monolithStore removed)
/** Get all dependency engines (detailed) for a project. */
export const fetchProjectDependenciesPixel = async (
	appId: string,
): Promise<PixelResponse> => {
	return runPixelQuery(
		`GetProjectDependencies(project="${appId}", details=[true])`,
	);
};

/** Set project dependency engines (empty array clears dependencies). */
export const setProjectDependenciesPixel = async (
	appId: string,
	dependencies: string[],
): Promise<PixelResponse> => {
	return runPixelQuery(
		`SetProjectDependencies(project="${appId}", dependencies=${JSON.stringify(
			dependencies.length > 0 ? dependencies : null,
		)})`,
	);
};

/** Partially update project metadata (only defined keys sent). */
export const updateProjectDetailsPixel = async (
	appId: string,
	data: Record<string, unknown>,
): Promise<PixelResponse> => {
	const meta: Record<string, unknown> = {};
	if (data) {
		for (const key in data) {
			if (data[key] !== undefined) {
				meta[key] = data[key];
			}
		}
	}
	return runPixelQuery(
		`SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
			meta,
		)}], jsonCleanup=[true])`,
	);
};

/** Fetch selected metadata keys for a project. */
export const fetchAppInfoPixel = async (
	appId: string,
	metaKeys: string[],
): Promise<PixelResponse> => {
	return runPixelQuery(
		`GetProjectMetadata(project="${appId}", metaKeys=${JSON.stringify([
			metaKeys,
		])})`,
	);
};

/** Fetch project markdown / README (main uses). */
export const fetchMainUsesPixel = async (
	appId: string,
): Promise<PixelResponse> => {
	return runPixelQuery(`GetProjectMarkdown(project="${appId}")`);
};

/** React hook streaming project dependencies. */
export const useGetProjectDependenciesPixel = (
	projectId: string,
): ReturnType<typeof usePixel<ProjectDependencyEngine[]>> => {
	return usePixel<ProjectDependencyEngine[]>(
		`GetProjectDependencies(project="${projectId}", details=[true]);`,
	);
};
/** Extract and persist dependency engines discovered in project assets. */
export const extractAndSetDependenciesPixel = async (
	projectId: string,
): Promise<PixelResponse> => {
	return runPixelQuery(
		`ExtractAndSetDependencies( project=["${projectId}"]);`,
	);
};
/** Hook returning engines the current user can access. */
export const useMyEnginesPixel = (): ReturnType<typeof usePixel<engine[]>> => {
	return usePixel<engine[]>("MyEngines();");
};

/**
 * Replace inaccessible engine references with provided accessible engines.
 * Returns raw pixel result so caller can inspect success / failed maps.
 * @param appId Project identifier
 * @param replacements Map of failedEngineId -> replacementEngineId
 * @returns Raw PixelResult for further inspection
 */
export const replaceInaccessibleEnginesPixel = async (
	appId: string,
	replacements: Record<string, string>,
): Promise<PixelResult> => {
	const mapStr = JSON.stringify([replacements]);
	return (await runPixel(
		`ReplaceInaccessibleEngines(project=["${appId}"], map=${mapStr});`,
	)) as PixelResult; // keeping original return shape
};
