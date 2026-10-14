import { Star } from "lucide-react";
import { Avatar, AvatarFallback, cn } from "@semoss/ui/next";
import { getLoginTypeName } from "../../constants/login-type-names.constants";
import { LoginTypeIcon } from "../login-type-icon";

/** Props for {@link MemberAvatar}. */
export interface MemberAvatarProps {
	/** The name the initial comes from */
	name: string;
	/** The login the person uses, such as NATIVE or MICROSOFT, or empty when unknown */
	type: string;
	/** Whether this is the login the session is signed in with, shown with a star instead of the initial */
	isCurrentLogin?: boolean;
	/** Classes for the avatar, such as its size; it is h-8 w-8 unless they say otherwise */
	className?: string;
}

/**
 * A person's initial in a circle, or a star for the login the session is
 * signed in with, as the members table shows it, with the logo of the login
 * they use on a small badge at its corner, since two people can share an id on
 * different logins. The login's name is in the title and read out by screen
 * readers; the initial is not, so show the person's name beside it.
 */
export const MemberAvatar = ({
	name,
	type,
	isCurrentLogin = false,
	className,
}: MemberAvatarProps) => {
	const loginName = type ? getLoginTypeName(type) : null;
	const loginLabel = loginName ? `${loginName} login` : null;
	const label =
		isCurrentLogin && loginLabel
			? `You are signed in with this ${loginLabel}`
			: loginLabel;
	return (
		<span
			className="relative inline-flex shrink-0"
			title={label ?? undefined}
		>
			{/* the initial repeats the name shown beside it */}
			<Avatar aria-hidden className={cn("h-8 w-8", className)}>
				<AvatarFallback
					className={cn(
						"text-sm",
						isCurrentLogin
							? "bg-primary/10 text-primary"
							: "text-muted-foreground",
					)}
				>
					{isCurrentLogin ? (
						<Star className="size-4 fill-primary" aria-hidden />
					) : (
						name.charAt(0).toUpperCase()
					)}
				</AvatarFallback>
			</Avatar>
			{type ? (
				// the logo sits inside a round badge, small enough that a square
				// logo's corners stay within the circle
				<span
					aria-hidden
					className="-end-0.5 -bottom-0.5 absolute flex size-4 items-center justify-center overflow-hidden rounded-full bg-background ring-1 ring-border"
				>
					<LoginTypeIcon type={type} className="size-2.5" />
				</span>
			) : null}
			{label ? <span className="sr-only">{label}</span> : null}
		</span>
	);
};
