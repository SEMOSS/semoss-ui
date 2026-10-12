import { KeyRound, type LucideIcon, UserRound } from "lucide-react";
import { cn } from "@semoss/ui/next";
import { LoginProviderIcon } from "./login-provider-icon";

/** Logins with no provider, and so no logo, by their label */
const LOGIN_ICONS: Readonly<Record<string, LucideIcon>> = {
	API_USER: KeyRound,
	NATIVE: UserRound,
};

/** Props for {@link LoginTypeIcon}. */
export interface LoginTypeIconProps {
	/** The login's stored label, such as NATIVE, MICROSOFT or API_USER */
	type: string;
	/** Classes for the icon; it is size-4 unless they say otherwise */
	className?: string;
}

/**
 * The icon for the login a person uses: a person for native logins, a key for
 * API logins, or the login provider's logo. It is decorative; show the login's
 * name next to it.
 */
export const LoginTypeIcon = ({ type, className }: LoginTypeIconProps) => {
	const Icon = LOGIN_ICONS[type.toUpperCase()];
	if (Icon) {
		return (
			<Icon
				className={cn(
					"size-4 shrink-0 text-muted-foreground",
					className,
				)}
				aria-hidden
			/>
		);
	}
	return (
		<LoginProviderIcon
			provider={type}
			className={cn("size-4 shrink-0 object-contain", className)}
		/>
	);
};
