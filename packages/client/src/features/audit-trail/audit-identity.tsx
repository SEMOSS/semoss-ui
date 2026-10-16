import { Bot, Cog } from "lucide-react";
import type { ReactElement } from "react";
import { PersonIdentity } from "@semoss/shared";
import { Badge } from "@semoss/ui/next";

/** The actor types that are not a login: SEMOSS itself and an agent acting for a user */
const SYSTEM_ACTOR = "SYSTEM";
const AGENT_ACTOR = "AGENT";

/** A detail line under the name */
const DETAIL_CLASS = "truncate text-muted-foreground text-xs";

export interface AuditIdentityProps {
	/** The person's user id, the agent's id, or SYSTEM */
	id: string;
	/** The person's login type, such as NATIVE, or SYSTEM or AGENT */
	type: string;
	/** The name recorded with the event */
	name: string;
	/** Whether the person acted as an admin, shown beside their name */
	isAdmin?: boolean;
	/** Shown when the event recorded no one */
	emptyLabel?: string;
}

/**
 * Who did something, or whom it was for, in the audit trail. A person is shown
 * as everywhere people are listed (`PersonIdentity`: their avatar with their
 * login's logo, their name and their id); SEMOSS itself and an agent are shown
 * with a cog or a robot in a circle of the same size, so every row lines up.
 */
export function AuditIdentity({
	id,
	type,
	name,
	isAdmin = false,
	emptyLabel = "Not recorded",
}: AuditIdentityProps): ReactElement {
	if (!id && !name) {
		return (
			<span className="text-muted-foreground text-sm">{emptyLabel}</span>
		);
	}
	if (type === SYSTEM_ACTOR || type === AGENT_ACTOR) {
		const isSystem = type === SYSTEM_ACTOR;
		return (
			<span className="flex min-w-0 items-center gap-2.5">
				<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
					{isSystem ? (
						<Cog className="size-4" aria-hidden />
					) : (
						<Bot className="size-4" aria-hidden />
					)}
				</span>
				<span className="flex min-w-0 flex-col">
					<span className="truncate font-medium text-sm">
						{isSystem ? "SEMOSS" : name || id}
					</span>
					<span className={DETAIL_CLASS}>
						{isSystem ? "System" : `Agent, id: ${id}`}
					</span>
				</span>
			</span>
		);
	}
	return (
		<PersonIdentity
			name={name || id}
			type={type}
			id={id}
			isCompact
			nameAddon={
				isAdmin ? <Badge variant="secondary">Admin</Badge> : null
			}
		/>
	);
}
