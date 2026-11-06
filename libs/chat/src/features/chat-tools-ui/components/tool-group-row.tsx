import { TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
} from "@semoss/ui/next";
import { ROW_CHEVRON, ROW_TRIGGER_CLASS_NAME } from "./chat-tool-row";
import { ToolCountBadge } from "./tool-count-badge";

/** Props for {@link ToolGroupRow}. */
export interface ToolGroupRowProps {
	/** What the tools are, such as the app they use. */
	label: string;
	/** Shown before the label, such as the app's provider logo. */
	icon: ReactNode;
	/** What the group shows when open, usually a group {@link ToolList}. */
	children: ReactNode;
	/** How many tools the group holds; left out until known. */
	count?: number;
	/** Whether the group starts open. */
	defaultOpen?: boolean;
	/** Told when the group opens or closes. */
	onOpenChange?: (isOpen: boolean) => void;
	/**
	 * Why its tools cannot run right now, such as a missing sign in. Marks the
	 * row; the section explains it and offers the fix above the list.
	 */
	warning?: string;
	/**
	 * A control at the end of the row, such as a remove button, in a slot
	 * every group row keeps so the counts line up. Placed outside the row's
	 * toggle, so it never nests inside it.
	 */
	trailing?: ReactNode;
}

/**
 * Tools that belong together, such as one app's or one toolbox's, as a
 * single row of a bordered tool list: its label and how many tools it holds,
 * opening to list them. The label reads stronger than the tools under it.
 */
export const ToolGroupRow = ({
	label,
	icon,
	children,
	count,
	defaultOpen = false,
	onOpenChange,
	warning,
	trailing,
}: ToolGroupRowProps) => (
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
						{count !== undefined ? (
							<ToolCountBadge count={count} />
						) : null}
					</button>
				</CollapsibleTrigger>
				<div className="me-2 flex size-8 shrink-0 items-center justify-center">
					{trailing}
				</div>
			</div>
			<CollapsibleContent>{children}</CollapsibleContent>
		</Collapsible>
	</li>
);
