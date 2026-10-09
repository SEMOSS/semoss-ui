import { ChevronRight, SearchIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	FieldDescription,
	InlineCode,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	Small,
} from "@semoss/ui/next";
import type { AgentDefaultTool } from "./agent.types";

/** Show the tool search once the catalog is long enough to need it. */
const SEARCH_THRESHOLD = 6;

export interface AgentBuiltinToolsViewProps {
	/** Backend-authoritative tool catalog returned by GetWorkspace. */
	tools: AgentDefaultTool[];
	/** Whether built-in tools are on for this agent. */
	enabled: boolean;
	/** Callable names of the tools turned off individually. */
	disabledToolNames: string[];
}

/**
 * Read-only view of an agent's built-in tools: an on/off badge and a
 * collapsible, searchable list with each disabled tool marked.
 */
export const AgentBuiltinToolsView = ({
	tools,
	enabled,
	disabledToolNames,
}: AgentBuiltinToolsViewProps) => {
	const { t } = useTranslation("agent");
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");

	const disabledNames = new Set(disabledToolNames);
	const enabledCount = tools.filter(
		(tool) => !disabledNames.has(tool.name),
	).length;
	const query = search.trim().toLowerCase();
	const visibleTools = query
		? tools.filter((tool) =>
				[tool.title, tool.name, tool.description].some((text) =>
					text?.toLowerCase().includes(query),
				),
			)
		: tools;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<div className="flex items-center gap-2">
					<Small>{t("builtInTools.label")}</Small>
					<Badge variant={enabled ? "default" : "outline"}>
						{enabled ? t("builtInTools.on") : t("builtInTools.off")}
					</Badge>
				</div>
				<FieldDescription>{t("builtInTools.help")}</FieldDescription>
			</div>

			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger className="flex w-fit items-center gap-2 rounded-sm text-left font-medium text-sm outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50">
					<ChevronRight
						aria-hidden="true"
						className={cn(
							"size-4 transition-transform",
							isOpen && "rotate-90",
						)}
					/>
					{t("builtInTools.individual")}
					<Badge variant="secondary">
						{enabled
							? t("builtInTools.enabledCount", {
									enabled: enabledCount,
									total: tools.length,
								})
							: t("builtInTools.allOff")}
					</Badge>
				</CollapsibleTrigger>
				<CollapsibleContent className="flex flex-col gap-3 pt-3">
					{tools.length > SEARCH_THRESHOLD && (
						<InputGroup className="sm:max-w-xs">
							<InputGroupInput
								aria-label={t("builtInTools.searchLabel")}
								placeholder={t(
									"builtInTools.searchPlaceholder",
								)}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							<InputGroupAddon>
								<SearchIcon />
							</InputGroupAddon>
						</InputGroup>
					)}

					{tools.length === 0 ? (
						<Muted className="font-normal">
							{t("builtInTools.noneAvailable")}
						</Muted>
					) : visibleTools.length === 0 ? (
						<Muted className="font-normal">
							{t("builtInTools.noMatch", {
								query: search.trim(),
							})}
						</Muted>
					) : (
						<ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
							{visibleTools.map((tool) => {
								const title = tool.title ?? tool.name;
								const isOff =
									!enabled || disabledNames.has(tool.name);
								return (
									<li key={tool.name} className="min-w-0">
										<div className="flex h-full min-w-0 flex-col gap-1 rounded-md border border-border px-3 py-3">
											<div className="flex min-w-0 items-center gap-2">
												<span
													className="truncate font-medium text-sm leading-snug"
													title={title}
												>
													{title}
												</span>
												{isOff && (
													<Badge variant="outline">
														{t("builtInTools.off")}
													</Badge>
												)}
											</div>
											{title !== tool.name && (
												<InlineCode className="w-fit max-w-full truncate py-0 text-xs">
													{tool.name}
												</InlineCode>
											)}
											{tool.description && (
												<Muted
													className="line-clamp-2 text-xs"
													title={tool.description}
												>
													{tool.description}
												</Muted>
											)}
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
};
