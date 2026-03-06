import {
	CheckIcon,
	ChevronDownIcon,
	PlusIcon,
	SearchIcon,
	WrenchIcon,
	XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight, useIteratorPixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	ScrollArea,
	ScrollBar,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { engineProjectToMCP, NewKnowledgeOverlay } from "@/components";
import type { App, Engine, MCP, MCPConfig, MCPTool } from "@/types";

interface MCPSelectorProps {
	/** Type of mcp */
	type: "TOOLBOX" | "KNOWLEDGE";

	/** Workspace data for editing (optional) */
	values: MCPConfig[];

	/** Track if disabled */
	disabled?: boolean;

	/** Callback that is fired when the form is closed or submitted. If it is successful, it will return an id */
	onChange: (values: MCPConfig[]) => void;
}

/**
 * Renders the MCPSelector component for selecting mcps within an agent
 */
export const MCPSelector: React.FC<MCPSelectorProps> = ({
	type,
	values,
	disabled,
	onChange,
}) => {
	const { t } = useTranslation("mcp");
	const { actions } = useInsight();
	const [search, setSearch] = useState<string>("");
	const [isKnowledgeOverlayOpen, setIsKnowledgeOverlayOpen] = useState(false);
	const [modalMCP, setModalMCP] = useState<MCP | null>(null);
	const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

	// Tool fetch state (TOOLBOX only — auto-fetched as items load)
	const [toolsCache, setToolsCache] = useState<Record<string, MCPTool[]>>({});
	const [toolsLoading, setToolsLoading] = useState<Set<string>>(new Set());

	// Stable refs so fetchTools useCallback has no deps
	const actionsRef = useRef(actions);
	actionsRef.current = actions;
	const fetchedRef = useRef(new Set<string>());

	const debouncedSearch = useDebouncedValue(search);

	// track the selected ones
	const selected = values.reduce(
		(acc, curr) => {
			acc[curr.id] = curr;
			return acc;
		},
		{} as Record<string, MCPConfig>,
	);

	/**
	 * Get all of the mcps with lazy loading
	 */
	const getMCP = useIteratorPixel<(Engine | App)[], MCP>(
		(limit, offset) =>
			`MyEngineProject (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=${type === "TOOLBOX" ? `["PROJECT", "STORAGE", "DATABASE", "FUNCTION"]` : `["VECTOR"]`}, ${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}limit=[${limit}], offset=[${offset}])`,
		(response) => {
			// if its less than the limit, we know its the end
			if (response.length < 25) {
				return -1;
			}

			return Infinity;
		},
		(response) => {
			return response.map(engineProjectToMCP);
		},
		{
			limit: 25,
		},
		[debouncedSearch],
	);

	/**
	 * Setup infinite scroll for the list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getMCP.isLoading || !getMCP.hasMore || !open,
		onNext: () => {
			getMCP.next();
		},
	});

	/**
	 * Fetch tools for a single MCP — stable, uses ref for actions
	 */
	const fetchTools = useCallback(async (id: string) => {
		if (fetchedRef.current.has(id)) return;
		fetchedRef.current.add(id);

		setToolsLoading((prev) => {
			const s = new Set(prev);
			s.add(id);
			return s;
		});
		try {
			const result = await actionsRef.current.run(
				`GetMCPTools(project=["${id}"]);`,
			);
			const tools: MCPTool[] =
				result?.pixelReturn?.[0]?.output?.tools ?? [];
			setToolsCache((prev) => ({ ...prev, [id]: tools }));
		} catch {
			setToolsCache((prev) => ({ ...prev, [id]: [] }));
		} finally {
			setToolsLoading((prev) => {
				const s = new Set(prev);
				s.delete(id);
				return s;
			});
		}
	}, []);

	/**
	 * As new items appear (infinite scroll), fetch their tools
	 */
	useEffect(() => {
		if (type !== "TOOLBOX") return;
		for (const mcp of getMCP.data) {
			void fetchTools(mcp.id);
		}
	}, [getMCP.data, fetchTools, type]);

	/**
	 * Reset expanded tools when the modal MCP changes
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: modalMCP?.id is an intentional trigger, not a value used in the effect body
	useEffect(() => {
		setExpandedTools(new Set());
	}, [modalMCP?.id]);

	/**
	 * Select a mcp
	 */
	const onSelect = (mcp: MCPConfig) => {
		// copy for react
		const updated = {
			...selected,
		};

		if (Object.hasOwn(updated, mcp.id)) {
			// remove it
			delete updated[mcp.id];
		} else {
			// add it
			updated[mcp.id] = mcp;
		}

		onChange(Object.values(updated));
	};

	return (
		<div className="w-full overflow-hidden rounded-xl border-border bg-card shadow-sm">
			{/* Search bar */}
			<div className="flex w-full flex-row gap-2 border-border bg-primary-foreground p-4">
				<InputGroup className="bg-background">
					<InputGroupInput
						placeholder={t("selector.search")}
						value={search}
						disabled={disabled || getMCP.isLoading}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
				</InputGroup>
				{type === "KNOWLEDGE" && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={(event) => {
									event.preventDefault();
									event.stopPropagation();
									setIsKnowledgeOverlayOpen(true);
								}}
								disabled={disabled}
							>
								<PlusIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{t("selector.createKnowledgeSource")}
						</TooltipContent>
					</Tooltip>
				)}
			</div>

			{/* Scrollable list */}
			<div ref={(e) => setScroll(e)} className="h-96 overflow-y-auto">
				{getMCP.isLoading && (
					<div className="flex h-96 w-full items-center justify-center">
						<Spinner />
					</div>
				)}
				{!getMCP.isLoading && getMCP.data.length === 0 && (
					<div className="flex h-96 w-full items-center justify-center">
						<Muted>
							{type === "TOOLBOX"
								? t("selector.noToolboxesFound")
								: t("selector.noKnowledgeFound")}
						</Muted>
					</div>
				)}
				{!getMCP.isLoading && getMCP.data.length > 0 && (
					<div className="divide-y divide-border">
						{getMCP.data.map((mcp) => {
							const isSelected = Object.hasOwn(selected, mcp.id);
							const isFromWorkspace = values.some(
								(v) => v.id === mcp.id && v.fromWorkspace,
							);
							const isLoadingTools = toolsLoading.has(mcp.id);
							const tools = toolsCache[mcp.id];

							return (
								<button
									key={mcp.id}
									type="button"
									onClick={() => {
										if (type === "TOOLBOX") {
											setModalMCP(mcp);
										} else {
											onSelect({
												id: mcp.id,
												name: mcp.name,
												type: mcp.type,
											});
										}
									}}
									className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/40 ${disabled || isFromWorkspace ? "pointer-events-none opacity-60" : ""}`}
									disabled={disabled || isFromWorkspace}
								>
									{/* Plain div checkbox — avoids Radix usePresence ref loop */}
									<div
										aria-hidden="true"
										onClick={(e) => {
											e.stopPropagation();
											if (!disabled && !isFromWorkspace) {
												onSelect({
													id: mcp.id,
													name: mcp.name,
													type: mcp.type,
												});
											}
										}}
										className={`mt-0.5 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border shadow-xs ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-transparent dark:bg-input/30"}`}
									>
										{isSelected && (
											<CheckIcon className="h-3 w-3" />
										)}
									</div>

									{/* Name, description, tool pills */}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="truncate font-medium text-sm">
												{mcp.name}
											</span>
										</div>
										{mcp.description && (
											<p className="truncate text-muted-foreground text-xs">
												{mcp.description}
											</p>
										)}

										{/* Tool list — dot-separated */}
										{type === "TOOLBOX" && (
											<div className="mt-1">
												{isLoadingTools && (
													<div className="flex items-center gap-1.5">
														<Spinner className="size-3" />
														<span className="text-muted-foreground text-xs">
															Loading tools…
														</span>
													</div>
												)}
												{!isLoadingTools &&
													tools !== undefined &&
													tools.length > 0 && (
														<div className="mt-0.5 flex items-center gap-2 overflow-hidden">
															<span className="inline-flex shrink-0 items-center rounded-full border border-border bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
																{tools.length}{" "}
																{tools.length ===
																1
																	? "tool"
																	: "tools"}
															</span>
															<p className="min-w-0 truncate text-muted-foreground text-xs">
																{tools
																	.map(
																		(
																			tool,
																		) =>
																			tool.title ||
																			tool.name,
																	)
																	.join(
																		" · ",
																	)}
															</p>
														</div>
													)}
											</div>
										)}
									</div>
								</button>
							);
						})}
					</div>
				)}
			</div>

			{/* Selected badges strip */}
			{values.length > 0 && (
				<ScrollArea className="w-full whitespace-nowrap">
					<ScrollBar orientation="horizontal" />
					<div className="flex space-x-2 p-4">
						{values.map((t) => (
							<Badge
								key={t.id}
								variant="secondary"
								className="text-sm"
								title={t.name}
							>
								<div className="w-32 truncate">{t.name}</div>
								<Button
									className="ml-1"
									type="button"
									variant="ghost"
									size="icon-sm"
									disabled={disabled || t.fromWorkspace}
									onClick={() => {
										onSelect(t);
									}}
								>
									<XIcon />
								</Button>
							</Badge>
						))}
					</div>
				</ScrollArea>
			)}

			<NewKnowledgeOverlay
				key={`${getMCP?.data?.length}`}
				open={isKnowledgeOverlayOpen}
				onClose={(knowledge) => {
					// update it
					if (knowledge) {
						onChange([...values, knowledge]);
						// refresh the list to show the newly created knowledge store selected
						getMCP.reset();
					}

					// close the overlay
					setIsKnowledgeOverlayOpen(false);
				}}
			/>

			{/* Tool details modal - TOOLBOX only */}
			<Dialog
				open={modalMCP !== null}
				onOpenChange={(open) => {
					if (!open) setModalMCP(null);
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{modalMCP?.name}</DialogTitle>
					</DialogHeader>

					{modalMCP?.description && (
						<p className="text-muted-foreground text-sm">
							{modalMCP.description}
						</p>
					)}

					{/* Loading */}
					{modalMCP && toolsLoading.has(modalMCP.id) && (
						<div className="flex items-center gap-2 py-4">
							<Spinner className="size-4" />
							<span className="text-muted-foreground text-sm">
								Loading tools…
							</span>
						</div>
					)}

					{/* Tool list */}
					{modalMCP &&
						!toolsLoading.has(modalMCP.id) &&
						toolsCache[modalMCP.id] && (
							<div className="max-h-72 overflow-y-auto">
								{toolsCache[modalMCP.id].length === 0 ? (
									<p className="py-4 text-center text-muted-foreground text-sm">
										No tools available
									</p>
								) : (
									<div className="divide-y divide-border">
										{toolsCache[modalMCP.id].map((tool) => {
											const isExpanded =
												expandedTools.has(tool.name);
											const hasDesc = Boolean(
												tool.description,
											);
											return (
												<button
													key={tool.name}
													type="button"
													onClick={() => {
														if (!hasDesc) return;
														setExpandedTools(
															(prev) => {
																const next =
																	new Set(
																		prev,
																	);
																if (
																	next.has(
																		tool.name,
																	)
																)
																	next.delete(
																		tool.name,
																	);
																else
																	next.add(
																		tool.name,
																	);
																return next;
															},
														);
													}}
													className="flex w-full items-start gap-3 py-3 text-left"
												>
													<WrenchIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
													<div className="min-w-0 flex-1">
														<div className="flex items-center justify-between gap-2">
															<p className="font-semibold text-sm">
																{tool.title ||
																	tool.name}
															</p>
															{hasDesc && (
																<ChevronDownIcon
																	className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
																/>
															)}
														</div>
														{isExpanded &&
															hasDesc && (
																<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
																	{
																		tool.description
																	}
																</p>
															)}
													</div>
												</button>
											);
										})}
									</div>
								)}
							</div>
						)}

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setModalMCP(null)}
						>
							Close
						</Button>
						{modalMCP && (
							<Button
								type="button"
								disabled={
									disabled ||
									values.some(
										(v) =>
											v.id === modalMCP.id &&
											v.fromWorkspace,
									)
								}
								onClick={() => {
									onSelect({
										id: modalMCP.id,
										name: modalMCP.name,
										type: modalMCP.type,
									});
									setModalMCP(null);
								}}
							>
								{Object.hasOwn(selected, modalMCP.id)
									? "Deselect"
									: "Select"}
							</Button>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};
