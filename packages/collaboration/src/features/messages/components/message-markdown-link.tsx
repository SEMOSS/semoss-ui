import { type ComponentProps, useContext, useId } from "react";
import { Button, cn } from "@semoss/ui/next";
import { ToolWorkbenchContext } from "@/features/tools/tool-workbench.context";
import { TopicSourceCitationsContext } from "@/features/topic-sources/topic-source-citations.context";
import { parseRoomFileLink } from "../utils/room-file-link";

const LINK_CLASS_NAME =
	"inline h-auto max-w-full whitespace-normal p-0 text-left text-[length:inherit] leading-[inherit] underline";

/** Open room files in the current room's dock; retain ordinary Markdown anchors. */
export function MessageMarkdownLink({
	children,
	href,
	className,
	node: _node,
	...props
}: ComponentProps<"a"> & { node?: unknown }) {
	const workbench = useContext(ToolWorkbenchContext);
	const evidence = useContext(TopicSourceCitationsContext);
	const id = useId();
	const file = href ? parseRoomFileLink(href) : null;
	if (href?.startsWith("#topic-source-")) {
		const citation = evidence?.citations.find(
			(item) =>
				href === `#topic-source-${encodeURIComponent(item.citationId)}`,
		);
		return citation ? (
			<Button
				type="button"
				variant="link"
				className={LINK_CLASS_NAME}
				aria-label={`Source ${(evidence?.citations.indexOf(citation) ?? 0) + 1}: ${citation.title}, version ${citation.version}`}
				onClick={() => evidence?.onOpen(citation)}
			>
				{children}
				<span className="sr-only">
					: {citation.title}, version {citation.version}
				</span>
			</Button>
		) : (
			<span>{children}</span>
		);
	}

	if (file) {
		if (!workbench) return <span>{children}</span>;
		return (
			<Button
				id={id}
				type="button"
				variant="link"
				className={LINK_CLASS_NAME}
				title={props.title ?? `Open room file: ${file.name}`}
				onClick={() => workbench.openFile(file.path, file.name)}
			>
				{children}
				<span className="sr-only"> (open room file)</span>
			</Button>
		);
	}
	if (!href) return <span>{children}</span>;
	return (
		<Button
			asChild
			variant="link"
			className={cn(LINK_CLASS_NAME, className)}
		>
			<a {...props} href={href} target="_blank" rel="noopener noreferrer">
				{children}
			</a>
		</Button>
	);
}
