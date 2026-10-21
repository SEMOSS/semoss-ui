import { CurrentLoginStar, LoginTypeIcon } from "@semoss/shared";
import { cn } from "@semoss/ui/next";
import { TeamTypeIcon } from "./team-type-icon";
import { useTeamTypeName } from "./use-team-type-name";

export interface IdentityIconProps {
	/** A person or a team */
	category: "USER" | "TEAM";
	/** The person's login type, or the team's type */
	type: string;
	/** Whether it is the login the session is signed in with, starred at its corner */
	isCurrentLogin?: boolean;
	/** Classes for the icon; it is size-5 unless they say otherwise */
	className?: string;
}

/**
 * The logo beside a person or team in a list: the login a person uses, with a
 * star when it is the login the session is signed in with, or where a team's
 * members come from. Its name is in the title and read out by screen readers,
 * so lists do not repeat it in words.
 */
export const IdentityIcon = ({
	category,
	type,
	isCurrentLogin = false,
	className,
}: IdentityIconProps) => {
	const typeName = useTeamTypeName(type);
	const isStarred = category === "USER" && isCurrentLogin;
	const label =
		category === "TEAM"
			? `${typeName} team`
			: isStarred
				? `You are signed in with this ${typeName} login`
				: `${typeName} login`;
	const iconClass = cn("size-5", className);

	return (
		<span className="relative inline-flex shrink-0" title={label}>
			{category === "TEAM" ? (
				<TeamTypeIcon
					type={type}
					name={typeName}
					className={iconClass}
				/>
			) : (
				<LoginTypeIcon type={type} className={iconClass} />
			)}
			{isStarred ? <CurrentLoginStar /> : null}
			<span className="sr-only">{label}</span>
		</span>
	);
};
