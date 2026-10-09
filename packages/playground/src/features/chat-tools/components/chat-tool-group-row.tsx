import { TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	Badge,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@semoss/ui/next";
import type { ChatToolInfo } from "../tools/chat-tool-info";
import {
	ChatToolRow,
	ROW_CHEVRON,
	ROW_TRIGGER_CLASS_NAME,
} from "./chat-tool-row";

/** Props for {@link ChatToolGroupRow}. */
export interface ChatToolGroupRowProps {
	/** What the tools are, such as the app they use. */
	label: string;
	/** Shown before the label, such as the app's provider logo. */
	icon: ReactNode;
	/** The tools, in the order they are shown. */
	tools: ChatToolInfo[];
	/** Whether the group starts open. */
	defaultOpen?: boolean;
	/**
	 * Why its tools cannot run right now, such as a missing sign in. Marks the
	 * row; the panel explains it and offers the fix above the list.
	 */
	warning?: string;
}

/**
 * Tools that belong together, such as one app's, as a single row of a
 * bordered tool list: its label and how many tools it holds, opening to list
 * them. The label reads stronger than the tools under it.
 */
export const ChatToolGroupRow = ({
	label,
	icon,
	tools,
	defaultOpen = false,
	warning,
}: ChatToolGroupRowProps) => (
	<li>
		<Collapsible defaultOpen={defaultOpen}>
			<CollapsibleTrigger asChild>
				<button type="button" className={ROW_TRIGGER_CLASS_NAME}>
					{ROW_CHEVRON}
					{icon}
					<span className="min-w-0 flex-1 truncate font-medium text-sm">
						{label}
					</span>
					{warning ? (
						<>
							<TriangleAlertIcon
								aria-hidden
								className="size-4 shrink-0 text-warning"
							/>
							<span className="sr-only">{warning}</span>
						</>
					) : null}
					{/* two digits wide at least, so the counts line up down the list */}
					<Badge
						variant="secondary"
						className="min-w-8 shrink-0 tabular-nums"
					>
						{tools.length}
					</Badge>
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				{/* indented so the tools' chevrons sit under the group's icon */}
				<ul className="flex flex-col divide-y divide-border border-border border-t ps-7">
					{tools.map((tool) => (
						<ChatToolRow key={tool.name} tool={tool} />
					))}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	</li>
);
