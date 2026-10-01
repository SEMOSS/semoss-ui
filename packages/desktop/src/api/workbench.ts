import { moduleUrlFor } from "@/config/profiles";
import type {
	CatalogItem,
	DesktopInstanceProfile,
	InstanceConfig,
} from "@/types";
import type { CatalogKind } from "./catalog";
import { runPixel } from "./pixel";
import { request } from "./transport";

export interface WorkbenchDependency {
	engine_id: string;
	engine_name: string;
	engine_type: string;
	engine_subtype?: string;
}

export interface CatalogWorkbenchData {
	resource: CatalogItem & Record<string, unknown>;
	permission: string;
	dependencies: WorkbenchDependency[];
	modelMetadata: Record<string, unknown> | null;
}

const configuredMetaKeys = (
	config: InstanceConfig,
	key: "databaseMetaKeys" | "projectMetaKeys",
): string[] => {
	const value = config[key];
	if (!Array.isArray(value)) return [];
	return value
		.map((entry) =>
			entry &&
			typeof entry === "object" &&
			typeof (entry as Record<string, unknown>).metakey === "string"
				? String((entry as Record<string, unknown>).metakey)
				: "",
		)
		.filter(Boolean);
};

const fetchPermission = async (
	profile: DesktopInstanceProfile,
	config: InstanceConfig,
	kind: CatalogKind,
	id: string,
): Promise<string> => {
	const resource = kind === "apps" ? "project" : "engine";
	const parameter = kind === "apps" ? "projectId" : "engineId";
	const response = await request(
		profile,
		`${moduleUrlFor(profile)}/api/auth/${resource}/getUser${kind === "apps" ? "Project" : "Engine"}Permission?${parameter}=${encodeURIComponent(id)}`,
		{
			headers: {
				Accept: "application/json",
				...(config.csrf && config["X-CSRF-Token"]
					? { "X-CSRF-Token": config["X-CSRF-Token"] }
					: {}),
			},
		},
	);
	if (!response.ok) {
		throw new Error(
			response.statusText ||
				`Unable to load ${resource} permission (${response.status}).`,
		);
	}
	const body = (await response.json()) as { permission?: string };
	return body.permission || "READ_ONLY";
};

export const fetchCatalogWorkbench = async (
	profile: DesktopInstanceProfile,
	config: InstanceConfig,
	kind: CatalogKind,
	item: CatalogItem,
): Promise<CatalogWorkbenchData> => {
	const permissionPromise = fetchPermission(profile, config, kind, item.id);

	if (kind === "apps") {
		const projectId = JSON.stringify(item.id);
		const metaKeys = [
			"description",
			"markdown",
			"tag",
			...configuredMetaKeys(config, "projectMetaKeys").filter(
				(key) =>
					!["description", "markdown", "tag", "tags"].includes(key),
			),
		];
		const result = await runPixel<Record<string, unknown>>(
			profile,
			config,
			`GetProjectMetadata(project=[${projectId}], metaKeys=${JSON.stringify(metaKeys)}); GetProjectDependencies(project=[${projectId}]);`,
		);
		const dependenciesOutput = (result.outputs[1] || {}) as {
			engines?: WorkbenchDependency[];
		};
		return {
			resource: {
				...item,
				...(result.output || {}),
			},
			permission: await permissionPromise,
			dependencies: dependenciesOutput.engines || [],
			modelMetadata: null,
		};
	}

	const metaKeys = [
		"markdown",
		"description",
		...configuredMetaKeys(config, "databaseMetaKeys").filter(
			(key) => !["description", "markdown", "tags"].includes(key),
		),
	];
	const includeModelMetadata = kind === "models";
	const engineId = JSON.stringify(item.id);
	const result = await runPixel<Record<string, unknown>>(
		profile,
		config,
		`GetEngineMetadata(engine=[${engineId}], metaKeys=${JSON.stringify([metaKeys])});${includeModelMetadata ? ` GetModelMetadata(engine=[${engineId}]);` : ""}`,
	);
	return {
		resource: {
			...item,
			...(result.output || {}),
		},
		permission: await permissionPromise,
		dependencies: [],
		modelMetadata: includeModelMetadata
			? ((result.outputs[1] || {}) as Record<string, unknown>)
			: null,
	};
};
