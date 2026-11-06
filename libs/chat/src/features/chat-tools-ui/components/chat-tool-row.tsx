import { ChevronRightIcon } from "lucide-react";
import { type ReactNode, useId } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
} from "@semoss/ui/next";
import type { ChatToolInfo } from "../tools/chat-tool-info";
import { ChatToolDetails } from "./chat-tool-details";

/**
 * A row of a bordered tool list that opens. The ring is inset, since the list
 * clips its rows to its rounded border.
 */
export const ROW_TRIGGER_CLASS_NAME =
	"group flex w-full min-w-0 items-center gap-3 px-3 py-2 text-start hover:bg-accent focus-visible:outline-none focus-visible:inset-ring-[3px] focus-visible:inset-ring-ring/50";

/** The chevron that turns when its row opens. */
export const ROW_CHEVRON = (
	<ChevronRightIcon
		aria-hidden
		className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90"
	/>
);

/**
 * The column at the end of every tool row that says how the tool runs, the
 * same width whether it can be changed or not, so it lines up down Tools.
 */
export const MODE_COLUMN_CLASS_NAME = "w-28 shrink-0";

/** Props for {@link ChatToolRow}. */
export interface ChatToolRowProps {
	/** The tool. */
	tool: ChatToolInfo;
	/**
	 * A control that sets how the tool runs, placed in the mode column
	 * outside the row's toggle. Given the id of the row's title, to name the
	 * control with. Without it the column shows how the tool runs.
	 */
	renderMode?: (titleId: string) => ReactNode;
}

/**
 * One tool the assistant has, the same row in every section of Tools: its
 * title, and in the mode column whether it runs on its own or asks first, in
 * the Auto and Ask terms Settings uses, or a control to change that. Opening
 * it shows the name the model calls, what the model is told the tool does,
 * and the arguments it takes.
 */
export const ChatToolRow = ({ tool, renderMode }: ChatToolRowProps) => {
	const { t } = useTranslation("chatTools");
	const titleId = useId();

	return (
		// relative, so a select's hidden native control is placed inside the
		// row: placed against a scroll area's root instead, it stretches the
		// panel below the form
		<li className="relative">
			<Collapsible>
				<div className="flex min-w-0 items-center">
					<CollapsibleTrigger asChild>
						<button
							type="button"
							className={cn(ROW_TRIGGER_CLASS_NAME, "flex-1")}
						>
							{ROW_CHEVRON}
							{/* wraps rather than truncates: a truncated title is as
							    wide as its text, which widens the whole panel */}
							<span
								id={titleId}
								className="min-w-0 flex-1 break-words text-sm"
							>
								{tool.title}
							</span>
						</button>
					</CollapsibleTrigger>
					<div className="flex shrink-0 items-center pe-3">
						{renderMode ? (
							renderMode(titleId)
						) : (
							<span
								className={cn(
									MODE_COLUMN_CLASS_NAME,
									"inline-flex h-8 items-center rounded-md border border-input px-3 text-muted-foreground text-sm",
								)}
							>
								{t(`defaultTools.modes.${tool.execution}`)}
							</span>
						)}
					</div>
				</div>
				<CollapsibleContent>
					<ChatToolDetails
						name={tool.name}
						description={tool.description}
						parameters={tool.parameters}
					/>
				</CollapsibleContent>
			</Collapsible>
		</li>
	);
};
