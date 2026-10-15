import { Users } from "lucide-react";
import { cn } from "@semoss/ui/next";
import { buildInitials } from "@semoss/utility/text";
import { CUSTOM_TEAM_TYPE } from "./team-type";
import { useLoginProviderLogo } from "./use-login-provider-logo";

export interface TeamTypeIconProps {
	/** CUSTOM, or the login provider's label or key */
	type: string;
	/** The provider's display name, for its initials when it has no logo */
	name: string;
	/** Classes for the icon; it is size-4 unless they say otherwise */
	className?: string;
}

/**
 * The icon for where a team's members come from: a people icon for custom
 * teams, the login provider's logo, or the provider's initials when it has no
 * logo. It is decorative; show the name next to it.
 */
export const TeamTypeIcon = ({ type, name, className }: TeamTypeIconProps) => {
	const isCustom = type === CUSTOM_TEAM_TYPE;
	const logo = useLoginProviderLogo(isCustom ? null : type);

	if (isCustom) {
		return (
			<Users
				className={cn("size-4 shrink-0 text-primary", className)}
				aria-hidden
			/>
		);
	}
	if (logo) {
		return (
			<img
				src={logo}
				alt=""
				aria-hidden
				className={cn("size-4 shrink-0 object-contain", className)}
			/>
		);
	}
	return (
		<span
			aria-hidden
			className={cn(
				"flex h-4 min-w-4 shrink-0 items-center justify-center rounded-sm bg-muted px-0.5 font-semibold text-muted-foreground text-xs leading-none",
				className,
			)}
		>
			{buildInitials(name, 2)}
		</span>
	);
};
