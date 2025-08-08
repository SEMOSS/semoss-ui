// ------------------------------------------------------------------------------------------
// PIXEL LAYER (PROJECTS)
// All pixels that interact with projects should come through here
//
// We do this so we only have one reference to a pixel
// ------------------------------------------------------------------------------------------

import { MonolithStore } from "@/stores";

/**
 * Gets All Dependencies for a project
 * @param monolithStore
 * @param appId
 * @returns
 */
export const fetchProjectDependencies = async (
	monolithStore: MonolithStore,
	appId: string,
) => {
	const res = await monolithStore.runQuery(
		`GetProjectDependencies(project="${appId}", details=[true])`,
	);

	const type = res.pixelReturn[0].operationType;
	const output = res.pixelReturn[0].output;

	if (type.indexOf("ERROR") === -1) {
		return {
			type: "success",
			output,
		};
	} else {
		return {
			type: "error",
			output,
		};
	}
};

/**
 *
 * @param monolithStore
 * @param appId
 * @param dependencies
 * @returns
 */
export const setProjectDependencies = async (
	monolithStore: MonolithStore,
	appId: string,
	dependencies: string[],
) => {
	const res = await monolithStore.runQuery(
		`SetProjectDependencies(project="${appId}", dependencies=${JSON.stringify(
			dependencies.length > 0 ? dependencies : null,
		)})`,
	);

	const type = res.pixelReturn[0].operationType;
	const output = res.pixelReturn[0].output;

	return {
		type: type.indexOf("ERROR") === -1 ? "success" : "error",
		output,
	};
};

/**
 *
 * @param monolithStore
 * @param appId
 * @param data
 * @returns
 */
export const updateProjectDetails = async (
	monolithStore: MonolithStore,
	appId: string,
	data: object,
) => {
	// copy over the defined keys
	const meta = {};
	if (data) {
		for (const key in data) {
			if (data[key] !== undefined) {
				meta[key] = data[key];
			}
		}
	}
	const res = await monolithStore.runQuery(
		`SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
			meta,
		)}], jsonCleanup=[true])`,
	);

	const type = res.pixelReturn[0].operationType;
	const output = res.pixelReturn[0].output;

	return {
		type: type.indexOf("ERROR") === -1 ? "success" : "error",
		output,
	};
};

/**
 *
 * @param monolithStore
 * @param appId
 * @param metaKeys
 * @returns
 */
export const fetchAppInfo = async (
	monolithStore: MonolithStore,
	appId: string,
	metaKeys: string[],
) => {
	const res = await monolithStore.runQuery(
		`GetProjectMetadata(project="${appId}", metaKeys=${JSON.stringify([
			metaKeys,
		])})`,
	);

	const type = res.pixelReturn[0].operationType;
	const output = res.pixelReturn[0].output;

	if (type.indexOf("ERROR") === -1) {
		return {
			type: "success",
			output,
		};
	} else {
		return {
			type: "error",
			output,
		};
	}
};

/**
 *
 * @param monolithStore
 * @param appId
 * @returns
 */
export const fetchMainUses = async (monolithStore: MonolithStore, appId: string) => {
	const res = await monolithStore.runQuery(
		`GetProjectMarkdown(project="${appId}")`,
	);

	const type = res.pixelReturn[0].operationType;
	const output = res.pixelReturn[0].output;

	if (type.indexOf("ERROR") === -1) {
		return {
			type: "success",
			output,
		};
	} else {
		return {
			type: "error",
			output,
		};
	}
};
