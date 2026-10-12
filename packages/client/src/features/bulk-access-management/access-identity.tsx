import type { ReactNode } from "react";
import { useIsCurrentLogin } from "@semoss/shared";
import { cn } from "@semoss/ui/next";
import { IdentityIcon } from "@/features/team-type/identity-icon";

/** A detail line under the name */
const DETAIL_CLASS = "truncate text-muted-foreground text-xs";

export interface AccessIdentityProps {
	/** A person or a team */
	kind: "USER" | "TEAM";
	/** The person's login type, or the team's type */
	type: string;
	/** The name to show */
	name: string;
	/** The person's id */
	id?: string;
	/** The person's email, when they have one */
	email?: string | null;
	/** Shows one detail line, the email or else the id, for narrow lists */
	compact?: boolean;
	/** Classes for the name, such as a strike-through */
	nameClassName?: string;
	/** More lines under the details, such as a note or a reason */
	children?: ReactNode;
}

/**
 * Who a row is for: the logo of a person's login or a team's type, centered
 * beside the name and, under it, the person's id and email, or "Team" for a
 * team. The logo of the login the session is signed in with is starred.
 */
export const AccessIdentity = ({
	kind,
	type,
	name,
	id,
	email,
	compact = false,
	nameClassName,
	children,
}: AccessIdentityProps) => {
	const isCurrentLogin = useIsCurrentLogin();
	return (
		<div className="flex min-w-0 items-center gap-2.5">
			<IdentityIcon
				kind={kind}
				type={type}
				isCurrentLogin={
					kind === "USER" && !!id && isCurrentLogin(type, id)
				}
			/>
			<div className="flex min-w-0 flex-col">
				<span
					className={cn(
						"truncate font-medium text-sm",
						nameClassName,
					)}
				>
					{name}
				</span>
				{kind === "TEAM" ? (
					<span className={DETAIL_CLASS}>Team</span>
				) : compact ? (
					<span className={DETAIL_CLASS}>
						{email || (id ? `id: ${id}` : "")}
					</span>
				) : (
					<>
						{id ? (
							<span className={DETAIL_CLASS}>id: {id}</span>
						) : null}
						{email ? (
							<span className={DETAIL_CLASS}>email: {email}</span>
						) : null}
					</>
				)}
				{children}
			</div>
		</div>
	);
};
