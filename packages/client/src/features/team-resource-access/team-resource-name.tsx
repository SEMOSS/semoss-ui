import { ExternalLink } from "lucide-react";
import { Link } from "react-router";
import type { GroupAccessResource, TeamResource } from "@/api/teams";
import { getTeamResourcePath } from "./team-resource-path";

interface TeamResourceNameProps {
	/** Projects or engines. */
	kind: GroupAccessResource;
	/** The project or engine. */
	resource: TeamResource;
}

/**
 * A project's or engine's name, linking to its page in a new tab so the team's
 * list stays open; a name without a page is plain text.
 */
export const TeamResourceName = ({ kind, resource }: TeamResourceNameProps) => {
	const path = getTeamResourcePath(kind, resource);
	if (!path) {
		return <p className="truncate font-medium">{resource.name}</p>;
	}
	return (
		<Link
			to={path}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={`${resource.name} (opens in a new tab)`}
			className="flex max-w-full items-center gap-1 rounded-sm font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
		>
			<span className="truncate">{resource.name}</span>
			<ExternalLink
				className="size-3.5 shrink-0 text-muted-foreground"
				aria-hidden="true"
			/>
		</Link>
	);
};
