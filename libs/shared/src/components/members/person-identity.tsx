import type { ReactNode } from "react";
import { cn } from "@semoss/ui/next";
import { useIsCurrentLogin } from "../../hooks/use-is-current-login";
import { MemberAvatar } from "./member-avatar";

/** A detail line under the name */
const DETAIL_CLASS = "truncate text-muted-foreground text-xs";

/** Props for {@link PersonIdentity}. */
export interface PersonIdentityProps {
	/** The name to show; the avatar's initial comes from it */
	name: string;
	/** The login the person uses, such as NATIVE or MICROSOFT, or empty when unknown */
	type: string;
	/** Their user id, shown under the name */
	id?: string | null;
	/** Their email, shown under the id when they have one */
	email?: string | null;
	/**
	 * Whether this is the login the session is signed in with, which stars the
	 * avatar; worked out from the type and id when left out
	 */
	isCurrentLogin?: boolean;
	/** Shows one detail line, the email or else the id, for narrow lists */
	isCompact?: boolean;
	/** Shown beside the name, such as an admin badge */
	nameAddon?: ReactNode;
	/** Classes for the name, such as a strike-through */
	nameClassName?: string;
	/** More lines under the details, such as a note or a reason */
	children?: ReactNode;
	/** Classes for the whole */
	className?: string;
}

/**
 * How a person is shown wherever people are listed, in lists, tables and
 * dropdowns alike: their avatar (their initial, or a star for the login the
 * session is signed in with, with their login's logo on a round badge at its
 * corner), their name, and under it their id and email. Each line truncates,
 * with the whole of it in its title. It is made of spans, so it can sit inside
 * a button. Use it rather than building another row for a person.
 */
export const PersonIdentity = ({
	name,
	type,
	id,
	email,
	isCurrentLogin,
	isCompact = false,
	nameAddon,
	nameClassName,
	children,
	className,
}: PersonIdentityProps) => {
	const isLoginOfSession = useIsCurrentLogin();
	const isStarred =
		isCurrentLogin ?? (!!type && !!id && isLoginOfSession(type, id));
	const compactDetail = email || (id ? `id: ${id}` : "");

	return (
		<span className={cn("flex min-w-0 items-center gap-2.5", className)}>
			<MemberAvatar name={name} type={type} isCurrentLogin={isStarred} />
			<span className="flex min-w-0 flex-col">
				<span className="flex min-w-0 items-center gap-1.5">
					<span
						className={cn(
							"truncate font-medium text-sm",
							nameClassName,
						)}
						title={name}
					>
						{name}
					</span>
					{nameAddon}
				</span>
				{isCompact ? (
					compactDetail ? (
						<span className={DETAIL_CLASS} title={compactDetail}>
							{compactDetail}
						</span>
					) : null
				) : (
					<>
						{id ? (
							<span className={DETAIL_CLASS} title={`id: ${id}`}>
								id: {id}
							</span>
						) : null}
						{email ? (
							<span
								className={DETAIL_CLASS}
								title={`email: ${email}`}
							>
								email: {email}
							</span>
						) : null}
					</>
				)}
				{children}
			</span>
		</span>
	);
};
