import type { CatalogType, Engine } from "../types";

/** The catalog types that are projects, the backend's INSIGHTS spelling included. */
const PROJECT_CATALOG_TYPES: ReadonlySet<string> = new Set<
	Exclude<CatalogType, Engine["engine_type"]>
>([
	"CODE",
	"BLOCKS",
	"INSIGHT",
	"INSIGHTS",
	"SKILL",
	"NOTEBOOK",
	"AUTOMATION",
	"WORKSPACE",
]);

/**
 * Whether a catalog type is a project type rather than an engine type.
 *
 * @param type - The specific catalog type.
 * @returns true for any project type, false for engine types and anything else.
 */
export const isProjectCatalogType = (
	type: string | undefined,
): type is Exclude<CatalogType, Engine["engine_type"]> =>
	type !== undefined && PROJECT_CATALOG_TYPES.has(type);
