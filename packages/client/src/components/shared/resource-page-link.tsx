import { ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { getResourcePagePath } from "@/utility/catalog";

/** Props for {@link ResourcePageLink}. */
export interface ResourcePageLinkProps {
	/** Whether it is a project (an app) or an engine */
	kind: "PROJECT" | "ENGINE";
	/**
	 * Its type, which picks its page: a project's type, such as CODE, or an
	 * engine's, such as MODEL. A project with no type opens in the app pages.
	 */
	type: string | null | undefined;
	/** Its id */
	id: string;
	/** Its name, shown as the link */
	name: string;
}

/**
 * A project's or engine's name, linking to its catalog page in a new tab, so
 * the list it is in stays open. A name whose type has no page is plain text.
 */
export const ResourcePageLink = ({
	kind,
	type,
	id,
	name,
}: ResourcePageLinkProps) => {
	const path = getResourcePagePath(kind, type, id);
	if (!path) {
		return (
			<span className="wrap-break-word whitespace-normal font-medium">
				{name}
			</span>
		);
	}
	return (
		<Link
			to={path}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={`${name} (opens in a new tab)`}
			className="flex max-w-full items-center gap-1 rounded-sm font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
		>
			<span className="wrap-break-word whitespace-normal">{name}</span>
			<ExternalLink
				className="size-3.5 shrink-0 text-muted-foreground"
				aria-hidden="true"
			/>
		</Link>
	);
};
