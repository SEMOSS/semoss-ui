import { TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	Badge,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
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
	tools?: ChatToolInfo[];
	/**
	 * What the group shows when open, in place of `tools`, such as tools
	 * still loading. Rendered inside the group's list.
	 */
	children?: ReactNode;
	/**
	 * How many tools the group holds. Defaults to the number of `tools`;
	 * left out until known.
	 */
	count?: number;
	/** Whether the group starts open. */
	defaultOpen?: boolean;
	/** Told when the group opens or closes. */
	onOpenChange?: (isOpen: boolean) => void;
	/**
	 * Why its tools cannot run right now, such as a missing sign in. Marks the
	 * row; the panel explains it and offers the fix above the list.
	 */
	warning?: string;
	/**
	 * A control at the end of the row, such as a remove button, in a slot
	 * every group row keeps. Placed outside the row's toggle, so it never
	 * nests inside it.
	 */
	trailing?: ReactNode;
}

/**
 * Tools that belong together, such as one app's or one toolbox's, as a
 * single row of a bordered tool list: its label and how many tools it holds,
 * opening to list them. The label reads stronger than the tools under it.
 */
export const ChatToolGroupRow = ({
	label,
	icon,
	tools,
	children,
	count = tools?.length,
	defaultOpen = false,
	onOpenChange,
	warning,
	trailing,
}: ChatToolGroupRowProps) => (
	<li>
		<Collapsible defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
			<div className="flex min-w-0 items-center">
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className={cn(ROW_TRIGGER_CLASS_NAME, "flex-1")}
					>
						{ROW_CHEVRON}
						{icon}
						<span className="min-w-0 flex-1 break-words font-medium text-sm">
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
						{count !== undefined ? (
							<Badge
								variant="secondary"
								className="min-w-8 shrink-0 tabular-nums"
							>
								{count}
							</Badge>
						) : null}
					</button>
				</CollapsibleTrigger>
				{/* always there, so the counts line up whether a row has actions */}
				<div className="me-2 flex size-8 shrink-0 items-center justify-center">
					{trailing}
				</div>
			</div>
			<CollapsibleContent>
				{/* indented so the tools' chevrons sit under the group's icon */}
				<ul className="flex flex-col divide-y divide-border border-border border-t ps-7">
					{children ??
						tools?.map((tool) => (
							<ChatToolRow key={tool.name} tool={tool} />
						))}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	</li>
);
