import { LoginTypeIcon } from "@semoss/shared";
import { Badge, cn } from "@semoss/ui/next";
import { useTeamTypeName } from "./use-team-type-name";

export interface LoginTypeBadgeProps {
	/** The login a person signs in with, such as NATIVE or MICROSOFT */
	type: string;
	/** Classes for the badge */
	className?: string;
}

/**
 * The login a person signs in with, with its logo or icon and the server's name
 * for it. Two people can
 * have the same id on different logins, so lists of people show it beside
 * each one.
 */
export const LoginTypeBadge = ({ type, className }: LoginTypeBadgeProps) => {
	const name = useTeamTypeName(type);
	return (
		<Badge
			variant="outline"
			className={cn(
				"shrink-0 gap-1 bg-background px-1.5 font-normal",
				className,
			)}
		>
			<LoginTypeIcon type={type} className="size-3" />
			{name}
		</Badge>
	);
};
