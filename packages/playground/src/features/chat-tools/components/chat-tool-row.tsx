import { ChevronRightIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Muted,
	Small,
} from "@semoss/ui/next";
import type { ChatToolInfo } from "../tools/chat-tool-info";

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
 * asks first, in the Auto and Ask terms Room Settings uses. Opening it shows
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
					{/* indented to line up with the title, past the chevron */}
					<div className="flex flex-col gap-3 ps-10 pe-3 pb-3">
						<code className="truncate text-muted-foreground text-xs">
							{tool.name}
						</code>
						{tool.description ? (
							<Muted className="font-normal">
								{tool.description}
							</Muted>
						) : null}
						<div className="flex flex-col gap-1.5">
							<Small>{t("panel.parameters")}</Small>
							{tool.parameters.length === 0 ? (
								<Muted className="font-normal">
									{t("panel.noParameters")}
								</Muted>
							) : (
								<ul className="flex flex-col gap-1.5">
									{tool.parameters.map((parameter) => (
										<li
											key={parameter.name}
											className="flex min-w-0 flex-col gap-0.5"
										>
											<span className="flex min-w-0 items-center gap-2">
												<code className="truncate text-xs">
													{parameter.name}
												</code>
												{parameter.isRequired ? (
													<Badge
														variant="outline"
														className="shrink-0"
													>
														{t("panel.required")}
													</Badge>
												) : null}
											</span>
											{parameter.description ? (
												<Muted className="font-normal">
													{parameter.description}
												</Muted>
											) : null}
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</li>
	);
};
