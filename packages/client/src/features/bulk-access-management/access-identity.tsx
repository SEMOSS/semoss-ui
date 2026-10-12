import type { ReactNode } from "react";
import { PersonIdentity } from "@semoss/shared";
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
 * Who a row is for. A person is shown as everywhere people are listed
 * (`PersonIdentity`: their avatar with their login's logo, their name, and
 * their id and email); a team is shown with where its members come from in a
 * circle of the same size, so people and teams line up in one list, and "Team"
 * under its name. Each line truncates in a narrow list, with the whole of it in
 * its title.
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
	if (kind === "USER") {
		return (
			<PersonIdentity
				name={name}
				type={type}
				id={id}
				email={email}
				isCompact={compact}
				nameClassName={nameClassName}
			>
				{children}
			</PersonIdentity>
		);
	}
	return (
		<div className="flex min-w-0 items-center gap-2.5">
			<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
				<IdentityIcon kind="TEAM" type={type} className="size-4" />
			</span>
			<div className="flex min-w-0 flex-col">
				<span
					className={cn(
						"truncate font-medium text-sm",
						nameClassName,
					)}
					title={name}
				>
					{name}
				</span>
				<span className={DETAIL_CLASS}>Team</span>
				{children}
			</div>
		</div>
	);
};
