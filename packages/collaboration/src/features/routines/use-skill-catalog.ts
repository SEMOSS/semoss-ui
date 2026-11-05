import { usePixel } from "@semoss/sdk/react";
import { SKILL_CATALOG_PIXEL } from "./custom-routine-api";
import {
	type CatalogSkill,
	catalogSkillListSchema,
} from "./custom-routine-schema";

interface SkillCatalog {
	/** Every skill the owner can use, once read; null while loading or after a failed read. */
	skills: CatalogSkill[] | null;
	isLoading: boolean;
	/** Why the catalog could not be read; null while loading or once read. */
	error: string | null;
	refresh: () => void;
}

/** The owner's SEMOSS skill catalog, for a routine's skill picker. */
export function useSkillCatalog(): SkillCatalog {
	const catalog = usePixel<unknown>(SKILL_CATALOG_PIXEL);
	const isLoading =
		catalog.status === "INITIAL" || catalog.status === "LOADING";
	const parsed = catalogSkillListSchema.safeParse(catalog.data);
	return {
		skills: !isLoading && parsed.success ? parsed.data : null,
		isLoading,
		error:
			isLoading || parsed.success
				? null
				: catalog.error?.message ||
					"Your skill catalog could not be read.",
		refresh: catalog.refresh,
	};
}
