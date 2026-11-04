import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
import { cn } from "@semoss/ui/next";
import type { GovernanceType } from "./governance-types";
import type { GovernanceResource } from "./use-governance-resources";

export interface GovernanceResourceIconProps {
	/** The resource's type */
	entry: GovernanceType;
	/** The resource */
	resource: GovernanceResource;
	/** Size classes */
	className?: string;
}

/** A project's image, or an engine's logo, as the catalogs show them. */
export const GovernanceResourceIcon = ({
	entry,
	resource,
	className,
}: GovernanceResourceIconProps) =>
	entry.kind === "PROJECT" ? (
		<AppCatalogAvatar
			projectId={resource.id}
			name={resource.name}
			className={cn("shrink-0 rounded-md text-xs", className)}
		/>
	) : (
		<EngineSubtypeIcon
			engineType={entry.type}
			engineSubtype={resource.subtype}
			className={cn("shrink-0 rounded object-contain", className)}
		/>
	);
