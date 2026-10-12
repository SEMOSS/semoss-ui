import type { PermissionChange } from "@semoss/sdk";
import { Badge, cn } from "@semoss/ui/next";
import { AccessIdentity } from "./access-identity";

/** What each action is called, and the token that colors it */
const ACTION_STYLES: Record<
	PermissionChange["action"],
	{ label: string; className: string }
> = {
	ADD: { label: "Added", className: "text-success" },
	CHANGE: { label: "Changed", className: "text-warning" },
	REMOVE: { label: "Removed", className: "text-destructive" },
};

export interface ReviewChangeRowProps {
	/** Gives, changes or takes away access */
	action: PermissionChange["action"];
	/** The person's or team's name */
	name: string;
	/** A person or a team */
	kind: "USER" | "TEAM";
	/** The person's login type, or the team's type */
	type: string;
	/** The person's id */
	id?: string;
	/** The person's email, when they have one */
	email?: string | null;
	/** What the change does to their access, such as "Read-Only to Editor", or empty */
	detail: string;
	/** Where it happens, shown when the review covers more than one target */
	where?: string;
	/** Why the change cannot be made, or null when it can */
	reason: string | null;
}

/**
 * One change in the review: who it is for, with the logo of their login or
 * team type, their id and email, what the change does, and why it is blocked
 * when it is.
 */
export const ReviewChangeRow = ({
	action,
	name,
	kind,
	type,
	id,
	email,
	detail,
	where,
	reason,
}: ReviewChangeRowProps) => {
	const style = ACTION_STYLES[action];

	return (
		<li
			className={cn(
				"flex items-center gap-3 px-3 py-2",
				reason && "bg-destructive/5",
			)}
		>
			<div className="min-w-0 flex-1">
				<AccessIdentity
					kind={kind}
					type={type}
					name={name}
					id={id}
					email={email}
				>
					{where ? (
						<span className="truncate text-muted-foreground text-xs">
							{where}
						</span>
					) : null}
					{reason ? (
						<span className="text-destructive text-xs">
							{reason}
						</span>
					) : null}
				</AccessIdentity>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				{detail ? (
					<span className="text-muted-foreground text-xs">
						{detail}
					</span>
				) : null}
				{reason ? (
					<Badge variant="outline" className="text-destructive">
						Blocked
					</Badge>
				) : null}
				<Badge variant="outline" className={style.className}>
					{style.label}
				</Badge>
			</div>
		</li>
	);
};
