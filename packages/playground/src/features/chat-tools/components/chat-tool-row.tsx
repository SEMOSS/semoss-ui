import { ChevronRightIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
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

/** Props for {@link ChatToolRow}. */
export interface ChatToolRowProps {
	/** The tool. */
	tool: ChatToolInfo;
}

/**
 * One tool the assistant has: its title and whether it runs on its own or
 * asks first, in the Auto and Ask terms Settings uses. Opening it shows
 * the name the model calls, what the model is told the tool does, and the
 * arguments it takes.
 */
export const ChatToolRow = ({ tool }: ChatToolRowProps) => {
	const { t } = useTranslation("chatTools");

	return (
		<li>
			<Collapsible>
				<CollapsibleTrigger asChild>
					<button type="button" className={ROW_TRIGGER_CLASS_NAME}>
						{ROW_CHEVRON}
						<span className="min-w-0 flex-1 truncate text-sm">
							{tool.title}
						</span>
						<Badge
							variant={
								tool.execution === "ask"
									? "secondary"
									: "outline"
							}
							className="shrink-0"
						>
							{t(`defaultTools.modes.${tool.execution}`)}
						</Badge>
					</button>
				</CollapsibleTrigger>
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
