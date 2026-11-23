import { CircleCheck, Clock, EyeOff, Globe, KeyRound } from "lucide-react";
import type { DependencyNodeStatus } from "@/features/dependency-map/dependency-node";
import {
	type DependencyAccess,
	getDependencyAccessLabel,
} from "./catalog-dependency";

const ICONS = {
	granted: CircleCheck,
	public: Globe,
	requested: Clock,
	requestable: KeyRound,
	private: EyeOff,
} as const satisfies Record<
	DependencyAccess["kind"],
	DependencyNodeStatus["icon"]
>;

/**
 * How a dependency's access reads as a badge: its words with an icon, so the
 * access never rests on colour. Access the user holds or can use reads
 * strongest; everything else is an outline. Compact, for a node on the graph,
 * a request reads "Requested" without its level, which the drawer gives.
 *
 * @param access - The dependency's access.
 * @param options - Whether the badge is compact.
 * @returns The badge's status.
 */
export const getDependencyAccessStatus = (
	access: DependencyAccess,
	{ isCompact = false }: { isCompact?: boolean } = {},
): DependencyNodeStatus => ({
	label:
		isCompact && access.kind === "requested"
			? "Requested"
			: getDependencyAccessLabel(access),
	variant: access.kind === "granted" ? "secondary" : "outline",
	icon: ICONS[access.kind],
});
