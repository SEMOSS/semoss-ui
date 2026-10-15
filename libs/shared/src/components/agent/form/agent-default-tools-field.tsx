import { ChevronRight, SearchIcon } from "lucide-react";
import { useId, useState } from "react";
import { type Control, Controller, useWatch } from "react-hook-form";
import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Button,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Field,
	FieldDescription,
	FieldLabel,
	InlineCode,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	Switch,
} from "@semoss/ui/next";
import type { AgentFormValues } from "./types";

/** Show the tool search once the catalog is long enough to need it. */
const SEARCH_THRESHOLD = 6;

interface AgentDefaultToolsFieldProps {
	/** React Hook Form control for the shared agent form. */
	control: Control<AgentFormValues>;
	/** Backend-authoritative tool catalog returned by GetWorkspace. */
	tools: {
		name: string;
		title?: string;
		description?: string;
	}[];
	/** Disables the switch and checkboxes and hides the bulk actions (e.g. mid-save). */
	disabled?: boolean;
}

export const AgentDefaultToolsField = ({
	control,
	tools,
	disabled,
}: AgentDefaultToolsFieldProps) => {
	const { t } = useTranslation("agent");
	const idPrefix = useId();
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const masterEnabled = useWatch({
		control,
		name: "useDefaultAgentTools",
	});
	const isMasterEnabled = masterEnabled !== false;
	const togglesDisabled = disabled || !isMasterEnabled;

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
			<Controller
				name="useDefaultAgentTools"
				control={control}
				render={({ field }) => (
					<Field orientation="horizontal">
						<div>
							<FieldLabel htmlFor={`${idPrefix}-master`}>
								{t("form.builtInTools.enable")}
							</FieldLabel>
							<FieldDescription>
								{t("builtInTools.help")}
							</FieldDescription>
						</div>
						<Switch
							id={`${idPrefix}-master`}
							checked={field.value}
							disabled={disabled}
							onCheckedChange={field.onChange}
						/>
					</Field>
				)}
			/>

			<Controller
				name="disabledDefaultTools"
				control={control}
				render={({ field }) => {
					const disabledNames = new Set(field.value ?? []);
					const enabledCount = tools.filter(
						(tool) => !disabledNames.has(tool.name),
					).length;

					const updateToolEnabled = (
						name: string,
						enabled: boolean,
					) => {
						const next = new Set(disabledNames);
						if (enabled) next.delete(name);
						else next.add(name);
						field.onChange([...next]);
					};

					const disableAll = () => {
						const next = new Set(disabledNames);
						for (const tool of tools) {
							next.add(tool.name);
						}
						field.onChange([...next]);
					};

					return (
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
									{isMasterEnabled
										? t("builtInTools.enabledCount", {
												enabled: enabledCount,
												total: tools.length,
											})
										: t("builtInTools.allOff")}
								</Badge>
							</CollapsibleTrigger>
							<CollapsibleContent className="flex flex-col gap-3 pt-3">
								<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
									{tools.length > SEARCH_THRESHOLD && (
										<InputGroup className="sm:max-w-xs">
											<InputGroupInput
												aria-label={t(
													"builtInTools.searchLabel",
												)}
												placeholder={t(
													"builtInTools.searchPlaceholder",
												)}
												value={search}
												onChange={(e) =>
													setSearch(e.target.value)
												}
											/>
											<InputGroupAddon>
												<SearchIcon />
											</InputGroupAddon>
										</InputGroup>
									)}
									{!disabled && (
										<div className="flex gap-1 sm:ms-auto">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												disabled={!isMasterEnabled}
												onClick={() =>
													field.onChange([])
												}
											>
												{t(
													"form.builtInTools.enableAll",
												)}
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												disabled={!isMasterEnabled}
												onClick={disableAll}
											>
												{t(
													"form.builtInTools.disableAll",
												)}
											</Button>
										</div>
									)}
								</div>

								{!isMasterEnabled && (
									<FieldDescription>
										{t("form.builtInTools.offNote")}
									</FieldDescription>
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
									<ul
										className={cn(
											"grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
											!isMasterEnabled && "opacity-60",
										)}
									>
										{visibleTools.map((tool) => {
											const inputId = `${idPrefix}-tool-${tool.name}`;
											const title =
												tool.title ?? tool.name;
											return (
												<li
													key={tool.name}
													className="min-w-0"
												>
													<label
														htmlFor={inputId}
														className={cn(
															"flex h-full items-start gap-3 rounded-md border border-border px-3 py-3",
															!togglesDisabled &&
																"cursor-pointer hover:bg-muted/50",
														)}
													>
														<Checkbox
															id={inputId}
															className="mt-0.5"
															checked={
																!disabledNames.has(
																	tool.name,
																)
															}
															disabled={
																togglesDisabled
															}
															onCheckedChange={(
																next,
															) =>
																updateToolEnabled(
																	tool.name,
																	next ===
																		true,
																)
															}
														/>
														<div className="flex min-w-0 flex-1 flex-col gap-1">
															<span
																className="truncate font-medium text-sm leading-snug"
																title={title}
															>
																{title}
															</span>
															{title !==
																tool.name && (
																<InlineCode className="w-fit max-w-full truncate py-0 text-xs">
																	{tool.name}
																</InlineCode>
															)}
															{tool.description && (
																<Muted
																	className="line-clamp-2 text-xs"
																	title={
																		tool.description
																	}
																>
																	{
																		tool.description
																	}
																</Muted>
															)}
														</div>
													</label>
												</li>
											);
										})}
									</ul>
								)}
							</CollapsibleContent>
						</Collapsible>
					);
				}}
			/>
		</div>
	);
};
