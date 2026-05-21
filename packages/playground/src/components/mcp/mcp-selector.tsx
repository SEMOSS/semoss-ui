import {
	AppWindowIcon,
	BlocksIcon,
	BotIcon,
	DatabaseIcon,
	FunctionSquareIcon,
	HardDriveIcon,
	LayoutGrid,
	List,
	PlusIcon,
	SearchIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
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
	useIsMobile,
} from "@semoss/ui/next";
import { engineProjectToMCP, MCPCard, NewKnowledgeOverlay } from "@/components";
import { useRoot } from "@/hooks";
import type { App, Engine, MCP, MCPConfig } from "@/types";

type CategoryKey =
	| "PROJECT"
	| "DATABASE"
	| "MODEL"
	| "STORAGE"
	| "FUNCTION"
	| "VECTOR";

const MCP_VIEW_STORAGE_KEY = "mcp-selector-view";

const CATEGORIES: ReadonlyArray<{
	key: CategoryKey;
	label: string;
	icon: typeof AppWindowIcon;
}> = [
	{ key: "PROJECT", label: "Apps", icon: AppWindowIcon },
	{ key: "DATABASE", label: "Database", icon: DatabaseIcon },
	{ key: "MODEL", label: "Model", icon: BotIcon },
	{ key: "STORAGE", label: "Storage", icon: HardDriveIcon },
	{ key: "FUNCTION", label: "Function", icon: FunctionSquareIcon },
	{ key: "VECTOR", label: "Vector", icon: BlocksIcon },
];

interface MCPSelectorProps {
	/** Type of mcp */
	type: "TOOLBOX" | "KNOWLEDGE";

	/** Workspace data for editing (optional) */
	values: MCPConfig[];

	/** Track if disabled */
	disabled?: boolean;

	/** Callback that is fired when the form is closed or submitted. If it is successful, it will return an id */
	onChange: (values: MCPConfig[]) => void;

	/**
	 * Called when the user clicks the "+" button to create a new knowledge
	 * source. When provided, the selector skips its inline create overlay
	 * and lets the parent decide what to do (open a modal, swap views, etc).
	 */
	onRequestCreateKnowledge?: () => void;
}

/**
 * Renders the MCPSelector component for selecting mcps within an agent
 */
export const MCPSelector = observer(
	({
		type,
		values,
		disabled,
		onChange,
		onRequestCreateKnowledge,
	}: MCPSelectorProps) => {
		const { t } = useTranslation("mcp");
		const { root } = useRoot();
		const isMobile = useIsMobile();
		const [search, setSearch] = useState<string>("");
		const [view, setView] = useState<"grid" | "list">(() => {
			if (typeof window === "undefined") return "list";
			const stored = window.localStorage.getItem(MCP_VIEW_STORAGE_KEY);
			return stored === "grid" || stored === "list" ? stored : "list";
		});
		const [category, setCategory] = useState<CategoryKey>(
			type === "KNOWLEDGE" ? "VECTOR" : "PROJECT",
		);

		// Persist the view preference whenever it changes
		useEffect(() => {
			if (typeof window === "undefined") return;
			window.localStorage.setItem(MCP_VIEW_STORAGE_KEY, view);
		}, [view]);
		const [isKnowledgeOverlayOpen, setIsKnowledgeOverlayOpen] =
			useState(false);

		const debouncedSearch = useDebouncedValue(search);
		const useMCPFilter =
			type === "TOOLBOX" || root.theme.featureFlags?.enableKnowledgeMCP;

		// track the selected one
		const selected = values.reduce(
			(acc, curr) => {
				acc[curr.id] = curr;
				return acc;
			},
			{} as Record<string, MCPConfig>,
		);

		/**
		 * Get all of the mcps with lazy loading. Apps (PROJECT) go through
		 * MyProjects; all engine types go through MyEngines.
		 */
		const getMCP = useIteratorPixel<(Engine | App)[], MCP>(
			(limit, offset) => {
				const filterClause = useMCPFilter
					? `metaFilters=[{"tag":"MCP"}], `
					: "";
				const searchClause = debouncedSearch
					? `filterWord=${JSON.stringify(debouncedSearch)}, `
					: "";

				if (category === "PROJECT") {
					return `META | MyProjects(metaKeys = ["tag", "description"], ${filterClause}${searchClause}limit=[${limit}], offset=[${offset}])`;
				}

				return `META | MyEngines(metaKeys = ["tag", "description"], ${filterClause}engineTypes=["${category}"], ${searchClause}limit=[${limit}], offset=[${offset}])`;
			},
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
			[debouncedSearch, useMCPFilter, category],
		);

		/**
		 * Setup infinite scroll for the command list
		 */
		const { setScroll } = useInfiniteScroll({
			disabled: getMCP.isLoading || !getMCP.hasMore,
			onNext: () => {
				getMCP.next();
			},
		});

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
			<div className="flex min-h-0 w-full flex-1 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
				{type === "TOOLBOX" && (
					<nav className="flex w-36 shrink-0 flex-col gap-0.5 border-border border-r bg-muted/40 p-1.5">
						{CATEGORIES.filter((c) => c.key !== "VECTOR").map(
							(c) => {
								const Icon = c.icon;
								const isActive = category === c.key;
								return (
									<button
										type="button"
										key={c.key}
										onClick={() => setCategory(c.key)}
										disabled={disabled}
										className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
											isActive
												? "bg-accent text-accent-foreground"
												: "hover:bg-accent/50"
										}`}
									>
										<Icon className="size-3.5 shrink-0" />
										<span className="truncate">
											{c.label}
										</span>
									</button>
								);
							},
						)}
					</nav>
				)}

				<div className="flex min-h-0 min-w-0 flex-1 flex-col">
					<div className="flex w-full flex-row items-center gap-2 border-border border-b bg-muted p-3">
						<div className="flex-1">
							<InputGroup className="bg-background">
								<InputGroupInput
									autoFocus
									placeholder={t("selector.search")}
									value={search}
									disabled={disabled}
									onChange={(e) => setSearch(e.target.value)}
								/>
								<InputGroupAddon>
									<SearchIcon />
								</InputGroupAddon>
							</InputGroup>
						</div>
						<div className="flex shrink-0 items-center gap-1">
							{type === "KNOWLEDGE" && category === "VECTOR" && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											type="button"
											variant="outline"
											size="icon-sm"
											aria-label={t(
												"selector.createKnowledgeSource",
											)}
											onClick={(event) => {
												event.preventDefault();
												event.stopPropagation();
												if (onRequestCreateKnowledge) {
													onRequestCreateKnowledge();
												} else {
													setIsKnowledgeOverlayOpen(
														true,
													);
												}
											}}
											disabled={disabled}
										>
											<PlusIcon className="size-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										{t("selector.createKnowledgeSource")}
									</TooltipContent>
								</Tooltip>
							)}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant={
											view === "list"
												? "secondary"
												: "outline"
										}
										size="icon-sm"
										aria-label="List view"
										onClick={() => setView("list")}
										disabled={disabled}
									>
										<List className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>List view</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant={
											view === "grid"
												? "secondary"
												: "outline"
										}
										size="icon-sm"
										aria-label="Grid view"
										onClick={() => setView("grid")}
										disabled={disabled}
									>
										<LayoutGrid className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Grid view</TooltipContent>
							</Tooltip>
						</div>
					</div>

					<ScrollArea
						className="min-h-0 w-full flex-1"
						viewportRef={(e) => setScroll(e)}
					>
						{getMCP.isLoading && getMCP.data.length === 0 && (
							<div className="flex h-full min-h-52 w-full items-center justify-center">
								<Spinner />
							</div>
						)}
						{!getMCP.isLoading && getMCP.data.length === 0 && (
							<div className="flex h-full min-h-52 w-full items-center justify-center">
								<Muted>
									{type === "TOOLBOX"
										? t("selector.noToolboxesFound")
										: t("selector.noKnowledgeFound")}
								</Muted>
							</div>
						)}
						{getMCP.data.length !== 0 && (
							<>
								<div
									className={
										view === "list"
											? "flex flex-col gap-2 p-3"
											: "grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3"
									}
								>
									{getMCP.data.map((mcp) => (
										<MCPCard
											key={mcp.id}
											m={mcp}
											type={type}
											variant={
												view === "list" ? "row" : "card"
											}
											onClick={() => onSelect(mcp)}
											selected={Object.hasOwn(
												selected,
												mcp.id,
											)}
											effectivePermission={mcp.permission}
										/>
									))}
								</div>
								{(getMCP.hasMore || getMCP.isLoading) && (
									<div className="flex w-full items-center justify-center py-3">
										<Spinner />
									</div>
								)}
							</>
						)}
					</ScrollArea>
					{values.length > 0 && isMobile && (
						<div className="flex max-h-16 flex-wrap gap-1.5 overflow-y-auto p-3">
							{values.map((t) => (
								<Badge
									key={t.id}
									variant="secondary"
									className="text-xs"
									title={t.name}
								>
									<div className="max-w-24 truncate">
										{t.name}
									</div>
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
					)}
					{values.length > 0 && !isMobile && (
						<ScrollArea className="w-full whitespace-nowrap">
							<ScrollBar orientation="horizontal"></ScrollBar>
							<div className="flex space-x-1.5 p-3">
								{values.map((t) => (
									<Badge
										key={t.id}
										variant="secondary"
										className="text-xs"
										title={t.name}
									>
										<div className="w-24 truncate">
											{t.name}
										</div>
										<Button
											className="ml-1"
											type="button"
											variant="ghost"
											size="icon-sm"
											disabled={
												disabled || t.fromWorkspace
											}
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
					{!onRequestCreateKnowledge && (
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
					)}
				</div>
			</div>
		);
	},
);
