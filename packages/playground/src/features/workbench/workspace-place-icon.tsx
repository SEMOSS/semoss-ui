import { ConnectorBrandIcon } from "@semoss/shared";
import type { WorkspacePlace } from "./use-workspace-places";

export interface WorkspacePlaceIconProps {
	/** The place to draw. */
	place: WorkspacePlace;
	/** Size classes. */
	className?: string;
}

/** A place's icon, or its app's logo for a connector viewer. */
export function WorkspacePlaceIcon({
	place,
	className,
}: WorkspacePlaceIconProps) {
	if (place.kind === "connector") {
		return <ConnectorBrandIcon brand={place.brand} className={className} />;
	}
	const Icon = place.icon;
	return <Icon aria-hidden="true" className={className} />;
}
