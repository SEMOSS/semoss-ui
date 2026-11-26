import { type ComponentProps, useContext, useId } from "react";
import { Button, cn } from "@semoss/ui/next";
import { ToolWorkbenchContext } from "@/features/tools/tool-workbench.context";
import { parseAgentFileLink, parseRoomFileLink } from "../utils/room-file-link";

const LINK_CLASS_NAME =
	"inline h-auto max-w-full whitespace-normal p-0 text-left text-[length:inherit] leading-[inherit] underline";

/**
 * Open room files, and the agent's own files, in the current room's dock;
 * retain ordinary Markdown anchors.
 */
export function MessageMarkdownLink({
	children,
	href,
	className,
	node: _node,
	...props
}: ComponentProps<"a"> & { node?: unknown }) {
	const workbench = useContext(ToolWorkbenchContext);
	const id = useId();
	const file = href ? parseRoomFileLink(href) : null;
	const agentFile = href ? parseAgentFileLink(href) : null;

	if (agentFile) {
		// such as a source a Digital Twin names: without the agent's files to open it from, its name is only text
		const openAgentFile = workbench?.openAgentFile;
		if (!openAgentFile) return <span>{children}</span>;
		return (
			<Button
				id={id}
				type="button"
				data-testid="message-markdown-link-agent-file"
				variant="link"
				className={LINK_CLASS_NAME}
				title={
					props.title ?? `Open the agent's file: ${agentFile.name}`
				}
				onClick={() => openAgentFile(agentFile.path, agentFile.name)}
			>
				{children}
				<span className="sr-only"> (open the agent's file)</span>
			</Button>
		);
	}
	if (file) {
		if (!workbench) return <span>{children}</span>;
		return (
			<Button
				id={id}
				type="button"
				data-testid="message-markdown-link-room-file"
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
