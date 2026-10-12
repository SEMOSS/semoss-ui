import { cn } from "@semoss/ui/next";
import { getLoginTypeName } from "../constants/login-type-names.constants";
import { LoginTypeIcon } from "./login-type-icon";

export interface LoginTypeLabelProps {
	/** The login's stored label, such as NATIVE, MICROSOFT or API_USER */
	type: string;
	/** The name to show, such as the server's name for a provider; the backend's usual name when left out */
	name?: string;
	/** Classes for the label */
	className?: string;
}

/**
 * The login a person uses, with its logo or icon and its name. Two people can
 * share an id on different logins, so lists of people show it beside each one.
 */
export const LoginTypeLabel = ({
	type,
	name,
	className,
}: LoginTypeLabelProps) => (
	<span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
		<LoginTypeIcon type={type} className="size-3.5" />
		<span className="truncate">{name ?? getLoginTypeName(type)}</span>
	</span>
);
