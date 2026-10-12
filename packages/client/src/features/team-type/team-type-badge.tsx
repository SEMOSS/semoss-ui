import { Badge, cn } from "@semoss/ui/next";
import { CUSTOM_TEAM_TYPE } from "./team-type";
import { TeamTypeIcon } from "./team-type-icon";
import { useTeamTypeName } from "./use-team-type-name";

export interface TeamTypeBadgeProps {
	/** CUSTOM, or the login provider the team's members come from */
	type: string;
	/** Classes for the badge */
	className?: string;
}

/**
 * Says where a team's members come from, with its icon: chosen in this app
 * (custom), or a login provider's group.
 */
export const TeamTypeBadge = ({ type, className }: TeamTypeBadgeProps) => {
	const name = useTeamTypeName(type);
	return (
		<Badge
			variant="outline"
			className={cn(
				"gap-1.5 bg-background font-normal",
				type === CUSTOM_TEAM_TYPE &&
					"border-primary/30 bg-primary/10 text-primary",
				className,
			)}
		>
			<TeamTypeIcon type={type} name={name} className="size-3.5" />
			{name}
		</Badge>
	);
};
