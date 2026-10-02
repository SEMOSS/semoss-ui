import { ChevronRightIcon, TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
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
const ROW_TRIGGER_CLASS_NAME =
	"group flex w-full min-w-0 items-center gap-3 px-3 py-2 text-start hover:bg-accent focus-visible:outline-none focus-visible:inset-ring-[3px] focus-visible:inset-ring-ring/50";

/** The chevron that turns when its row opens. */
const RowChevron = () => (
	<ChevronRightIcon
		aria-hidden
		className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90"
	/>
);

/** Props for {@link TeamworkChatToolRow}. */
export interface TeamworkChatToolRowProps {
	/** The tool. */
	tool: ChatToolInfo;
}

/**
 * One tool the assistant has: its title and whether it runs on its own or
 * asks first, in the Auto and Ask terms Room Settings uses. Opening it shows
 * the name the model calls, what the model is told the tool does, and the
 * arguments it takes.
 */
export const TeamworkChatToolRow = ({ tool }: TeamworkChatToolRowProps) => {
	const { t } = useTranslation("teamwork");

	return (
		<li>
			<Collapsible>
				<CollapsibleTrigger asChild>
					<button type="button" className={ROW_TRIGGER_CLASS_NAME}>
						<RowChevron />
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
							<Small>{t("chatTools.parameters")}</Small>
							{tool.parameters.length === 0 ? (
								<Muted className="font-normal">
									{t("chatTools.noParameters")}
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
														{t(
															"chatTools.required",
														)}
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

/** Props for {@link TeamworkChatToolGroupRow}. */
export interface TeamworkChatToolGroupRowProps {
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
export const TeamworkChatToolGroupRow = ({
	label,
	icon,
	tools,
	defaultOpen = false,
	warning,
}: TeamworkChatToolGroupRowProps) => (
	<li>
		<Collapsible defaultOpen={defaultOpen}>
			<CollapsibleTrigger asChild>
				<button type="button" className={ROW_TRIGGER_CLASS_NAME}>
					<RowChevron />
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
						<TeamworkChatToolRow key={tool.name} tool={tool} />
					))}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	</li>
);
