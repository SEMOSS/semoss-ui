import {
	BrainIcon,
	DatabaseIcon,
	HardDriveIcon,
	LayersIcon,
	ShieldIcon,
	SquareFunctionIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import type { ProjectDependency } from "@semoss/shared";
import { isProjectType } from "@/utility/catalog";

/** Display metadata for one engine category card. */
export interface CategoryMeta {
	/** Card title. */
	label: string;
	/** One-line description under the title. */
	blurb: string;
	/** Empty-state line when nothing of this category is selected. */
	empty: string;
	/** Icon rendered in the card's tile. */
	icon: ComponentType<{ className?: string }>;
}

/** Card copy and icons per engine category. */
export const CATEGORY_META: Record<string, CategoryMeta> = {
	MODEL: {
		label: "Models",
		blurb: "Language and embedding models",
		empty: "No models selected",
		icon: BrainIcon,
	},
	DATABASE: {
		label: "Databases",
		blurb: "Relational and document databases",
		empty: "No databases selected",
		icon: DatabaseIcon,
	},
	STORAGE: {
		label: "Storage",
		blurb: "File and object storage",
		empty: "No storage engines selected",
		icon: HardDriveIcon,
	},
	VECTOR: {
		label: "Vector Databases",
		blurb: "Embedding and similarity search",
		empty: "No vector databases selected",
		icon: LayersIcon,
	},
	FUNCTION: {
		label: "Functions",
		blurb: "Reusable functions the agent can call",
		empty: "No functions selected",
		icon: SquareFunctionIcon,
	},
	GUARDRAIL: {
		label: "Guardrails",
		blurb: "Safety and policy checks",
		empty: "No guardrails selected",
		icon: ShieldIcon,
	},
};

/**
 * The SetProjectDependencies payload entry for a dependency — project-kind
 * dependencies are always typed "PROJECT" on the wire.
 *
 * @name toDependencyPayload
 * @param dependency - The dependency to serialize.
 * @return The {id, type} wire entry.
 */
export const toDependencyPayload = (
	dependency: Pick<ProjectDependency, "engine_id" | "engine_type">,
): { id: string; type: string } => ({
	id: dependency.engine_id,
	type: isProjectType(dependency.engine_type)
		? "PROJECT"
		: dependency.engine_type,
});
