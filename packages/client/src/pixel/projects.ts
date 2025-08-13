// ------------------------------------------------------------------------------------------
// PIXEL LAYER (PROJECTS)
// All pixels that interact with projects should come through here
//
// We do this so we only have one reference to a pixel
// ------------------------------------------------------------------------------------------

import { runPixel, usePixel } from "@semoss/sdk/react";
import type { engine } from "@/components/app/app-details.utility";
import type { MonolithStore } from "@/stores";
import type { ProjectDependencyEngine } from "@/types";

// Helper types
type PixelResponse = {
	type: "success" | "error";
	output: unknown;
};

type PixelResult = {
	pixelReturn: Array<{
		operationType: string | string[];
		output: unknown;
	}>;
};

// Helper functions for common patterns
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

const runPixelQuery = async (query: string): Promise<PixelResponse> => {
	const res = await runPixel(query);
	return processPixelResponse(res);
};

const runMonolithQuery = async (
	monolithStore: MonolithStore,
	query: string,
): Promise<PixelResponse> => {
	const res = await monolithStore.runQuery(query);
	return processPixelResponse(res);
};
/**
 * Gets All Dependencies for a project
 * @param monolithStore
 * @param appId
 * @returns
 */
export const fetchProjectDependencies = async (
	monolithStore: MonolithStore,
	appId: string,
): Promise<PixelResponse> => {
	return runMonolithQuery(
		monolithStore,
		`GetProjectDependencies(project="${appId}", details=[true])`,
	);
};

/**
 * Sets project dependencies
 * @param monolithStore
 * @param appId
 * @param dependencies
 * @returns
 */
export const setProjectDependencies = async (
	monolithStore: MonolithStore,
	appId: string,
	dependencies: string[],
): Promise<PixelResponse> => {
	return runMonolithQuery(
		monolithStore,
		`SetProjectDependencies(project="${appId}", dependencies=${JSON.stringify(
			dependencies.length > 0 ? dependencies : null,
		)})`,
	);
};

/**
 * Updates project details/metadata
 * @param monolithStore
 * @param appId
 * @param data
 * @returns
 */
export const updateProjectDetails = async (
	monolithStore: MonolithStore,
	appId: string,
	data: Record<string, unknown>,
): Promise<PixelResponse> => {
	// copy over the defined keys
	const meta: Record<string, unknown> = {};
	if (data) {
		for (const key in data) {
			if (data[key] !== undefined) {
				meta[key] = data[key];
			}
		}
	}
	return runMonolithQuery(
		monolithStore,
		`SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
			meta,
		)}], jsonCleanup=[true])`,
	);
};

/**
 * Fetches app metadata information
 * @param monolithStore
 * @param appId
 * @param metaKeys
 * @returns
 */
export const fetchAppInfo = async (
	monolithStore: MonolithStore,
	appId: string,
	metaKeys: string[],
): Promise<PixelResponse> => {
	return runMonolithQuery(
		monolithStore,
		`GetProjectMetadata(project="${appId}", metaKeys=${JSON.stringify([
			metaKeys,
		])})`,
	);
};

/**
 * Fetches project markdown/main uses
 * @param monolithStore
 * @param appId
 * @returns
 */
export const fetchMainUses = async (
	monolithStore: MonolithStore,
	appId: string,
): Promise<PixelResponse> => {
	return runMonolithQuery(
		monolithStore,
		`GetProjectMarkdown(project="${appId}")`,
	);
};

export const useGetProjectDependencies = (
	projectId: string,
): ReturnType<typeof usePixel<ProjectDependencyEngine[]>> => {
	return usePixel<ProjectDependencyEngine[]>(
		`GetProjectDependencies(project="${projectId}", details=[true]);`,
	);
};

/**
 * Hook to get available engines that user has access to
 * @returns usePixel hook result for MyEngines query
 */
export const useMyEngines = (): ReturnType<typeof usePixel<engine[]>> => {
	return usePixel<engine[]>("MyEngines();");
};

/**
 * Replace inaccessible engines with accessible ones
 * @param monolithStore
 * @param appId
 * @param replacements - Map of failed engine IDs to replacement engine IDs
 * @returns Raw pixel result for detailed response processing
 */
export const replaceInaccessibleEngines = async (
	monolithStore: MonolithStore,
	appId: string,
	replacements: Record<string, string>,
): Promise<PixelResult> => {
	const mapStr = JSON.stringify([replacements]);
	return await monolithStore.runQuery(
		`ReplaceInaccessibleEngines(project=["${appId}"], map=${mapStr});`,
	);
};

/**
 * Upload a project app (supports both runPixel and monolithStore)
 * @param filePathOrStore - Either file path (string) or monolithStore object
 * @param fileLocationOrGlobal - Either file location (when using monolithStore) or isGlobal boolean
 * @param isGlobal - isGlobal boolean (when using monolithStore)
 * @returns
 */
export const uploadProjectApp = async (
	filePathOrStore: string | MonolithStore,
	fileLocationOrGlobal: string | boolean,
	isGlobal?: boolean,
): Promise<PixelResponse> => {
	// If first parameter is string, use runPixel
	if (typeof filePathOrStore === "string") {
		return runPixelQuery(
			`UploadProjectApp(filePath=["${filePathOrStore}"], global=[${fileLocationOrGlobal}]);`,
		);
	}

	// Otherwise use monolithStore
	return runMonolithQuery(
		filePathOrStore,
		`UploadProjectApp(filePath=["${fileLocationOrGlobal}"], global=[${isGlobal}]);`,
	);
};

/**
 * Create a new project (supports both runPixel and monolithStore)
 * @param nameOrStore - Either project name (string) or monolithStore object
 * @param nameOrGlobal - Either project name (when using monolithStore) or isGlobal boolean
 * @param projectTypeOrGlobal - Either project type (when using monolithStore) or isGlobal boolean
 * @param projectType - Project type (when using monolithStore)
 * @param hasPortal - Whether to create portal (default: true)
 * @returns
 */
export const createProject = async (
	nameOrStore: string | MonolithStore,
	nameOrGlobal: string | boolean,
	projectTypeOrGlobal?: string | boolean,
	projectType?: string,
	hasPortal: boolean = true,
): Promise<PixelResponse> => {
	// If first parameter is string, use runPixel
	if (typeof nameOrStore === "string") {
		return runPixelQuery(
			`CreateProject(project=["${nameOrStore}"], global=["${nameOrGlobal}"], projectType=["${projectTypeOrGlobal}"], portal=["${hasPortal}"]);`,
		);
	}

	// Otherwise use monolithStore
	return runMonolithQuery(
		nameOrStore,
		`CreateProject(project=["${nameOrGlobal}"], global=["${projectTypeOrGlobal}"], projectType=["${projectType}"], portal=["true"])`,
	);
};

/**
 * Set project metadata with tags and description
 * @param monolithStore
 * @param projectId
 * @param tags
 * @param description
 * @returns
 */
export const setProjectMetadataWithTags = async (
	monolithStore: MonolithStore,
	projectId: string,
	tags: string[],
	description: string,
): Promise<PixelResponse> => {
	return runMonolithQuery(
		monolithStore,
		`SetProjectMetadata(project=["${projectId}"], meta=[${JSON.stringify({
			tag: tags,
			description: description,
		})}])`,
	);
};

/**
 * Delete asset from project
 * @param monolithStore
 * @param projectId
 * @param filePath
 * @returns
 */
export const deleteProjectAsset = async (
	monolithStore: MonolithStore,
	projectId: string,
	filePath: string = "version/assets/",
): Promise<PixelResponse> => {
	return runMonolithQuery(
		monolithStore,
		`DeleteAsset(filePath=["${filePath}"], space=["${projectId}"]);`,
	);
};

/**
 * Unzip file in project space
 * @param monolithStore
 * @param fileLocation
 * @param projectId
 * @returns
 */
export const unzipProjectFile = async (
	monolithStore: MonolithStore,
	fileLocation: string,
	projectId: string,
): Promise<PixelResponse> => {
	return runMonolithQuery(
		monolithStore,
		`UnzipFile(filePath=["${fileLocation}"], space=["${projectId}"]);`,
	);
};
