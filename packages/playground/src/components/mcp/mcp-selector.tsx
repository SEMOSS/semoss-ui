import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	cn,
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
	 * Extra classes applied to the selector's root container. Callers that
	 * render the selector inline (not inside a height-constrained parent like
	 * the MCP overlay) should set a concrete height here, e.g. `h-[420px]`.
	 */
	className?: string;
}

/**
 * Renders the MCPSelector component for selecting mcps within an agent
 */
export const MCPSelector = observer(
	({ type, values, disabled, onChange, className }: MCPSelectorProps) => {
		const { t } = useTranslation("mcp");
		const { root } = useRoot();
		const isMobile = useIsMobile();
		const [search, setSearch] = useState<string>("");
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
		 * Engines source. KNOWLEDGE only ever uses this (VECTOR engines).
		 * TOOLBOX combines this with a parallel MyProjects query below.
		 *
		 * We split into two iterators rather than using MyEngineProject —
		 * that combined reactor mixed both shapes in a way that broke
		 * stable pagination.
		 */
		const getEngines = useIteratorPixel<Engine[], MCP>(
			(limit, offset) =>
				`META | MyEngines (metaKeys = ["tag", "description"], ${useMCPFilter ? `metaFilters=[{"tag":["MCP"]}], ` : ""}engineTypes=${type === "TOOLBOX" ? `["STORAGE", "DATABASE", "FUNCTION", "MODEL"]` : `["VECTOR"]`}, ${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}limit=[${limit}], offset=[${offset}])`,
			(response) => (response.length < 25 ? -1 : Infinity),
			(response) => response.map(engineProjectToMCP),
			{ limit: 25 },
			[debouncedSearch, useMCPFilter, type],
		);

		/**
		 * Projects source — TOOLBOX only. The MCP tag filter does double
		 * duty: per platform business logic, projects tagged MCP and
		 * projects of type WORKSPACE are mutually exclusive, so we don't
		 * need a separate workspace filter to keep agents out of here.
		 */
		const getProjects = useIteratorPixel<App[], MCP>(
			(limit, offset) =>
				type === "TOOLBOX"
					? `META | MyProjects (metaKeys = ["tag", "description"], ${useMCPFilter ? `metaFilters=[{"tag":["MCP"]}], ` : ""}${debouncedSearch ? `filterWord=["<encode>${debouncedSearch}</encode>"], ` : ""}limit=[${limit}], offset=[${offset}])`
					: "",
			(response) => (response.length < 25 ? -1 : Infinity),
			(response) => response.map(engineProjectToMCP),
			{ limit: 25 },
			[debouncedSearch, useMCPFilter, type],
		);

		/**
		 * Combined list. Engines and projects are braided pairwise
		 * (engine[i], project[i], engine[i+1], project[i+1], ...); when
		 * one source runs longer, its remaining items just append at the
		 * end. Order within each source is whatever the reactor returns
		 * — neither is sorted today.
		 */
		const combinedData: MCP[] = [];
		for (
			let i = 0;
			i < Math.max(getEngines.data.length, getProjects.data.length);
			i++
		) {
			const e = getEngines.data[i];
			const p = getProjects.data[i];
			if (e) combinedData.push(e);
			if (p) combinedData.push(p);
		}
		const isLoading = getEngines.isLoading || getProjects.isLoading;
		const hasMore = getEngines.hasMore || getProjects.hasMore;

		/**
		 * Setup infinite scroll for the command list. Each scroll-to-bottom
		 * advances whichever sources still have more.
		 */
		const { setScroll } = useInfiniteScroll({
			disabled: isLoading || !hasMore,
			onNext: () => {
				if (getEngines.hasMore) getEngines.next();
				if (getProjects.hasMore) getProjects.next();
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
				// Workspace-inherited MCPs can't be removed from a room here
				// (they live on the agent). The card disables click for these,
				// but guard the path defensively for the chip-X route too.
				if (updated[mcp.id].fromWorkspace) {
					return;
				}
				delete updated[mcp.id];
			} else {
				// add it
				updated[mcp.id] = mcp;
			}

			onChange(Object.values(updated));
		};

		return (
			<div
				className={cn(
					"flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm",
					className,
				)}
			>
				<div className="flex w-full shrink-0 flex-row gap-2 border-border border-b bg-muted p-4">
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
					{type === "KNOWLEDGE" && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
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

				<ScrollArea
					className="min-h-0 w-full flex-1"
					viewportRef={(e) => setScroll(e)}
				>
					{isLoading && combinedData.length === 0 && (
						<div className="flex h-64 w-full items-center justify-center">
							<Spinner />
						</div>
					)}
					{!isLoading && combinedData.length === 0 && (
						<div className="flex h-64 w-full items-center justify-center">
							<Muted>
								{type === "TOOLBOX"
									? t("selector.noToolboxesFound")
									: t("selector.noKnowledgeFound")}
							</Muted>
						</div>
					)}
					{combinedData.length !== 0 && (
						<>
							<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
								{combinedData.map((mcp) => {
									const selectedEntry = selected[mcp.id];
									const fromWorkspace =
										selectedEntry?.fromWorkspace === true;
									return (
										<MCPCard
											key={mcp.id}
											m={mcp}
											type={type}
											onClick={() => onSelect(mcp)}
											selected={!!selectedEntry}
											effectivePermission={mcp.permission}
											fromWorkspace={fromWorkspace}
										/>
									);
								})}
							</div>
							{isLoading && (
								<div className="flex w-full items-center justify-center pb-4">
									<Spinner />
								</div>
							)}
						</>
					)}
				</ScrollArea>
				{values.length > 0 && isMobile && (
					<div className="flex max-h-20 shrink-0 flex-wrap gap-2 overflow-y-auto border-border border-t p-3">
						{values.map((t) => (
							<Badge
								key={t.id}
								variant="secondary"
								className="text-sm"
								title={t.name}
							>
								<div className="max-w-64 truncate">
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
					<ScrollArea className="w-full shrink-0 whitespace-nowrap border-border border-t">
						<ScrollBar orientation="horizontal"></ScrollBar>
						<div className="flex space-x-2 p-3">
							{values.map((t) => (
								<Badge
									key={t.id}
									variant="secondary"
									className="text-sm"
									title={t.name}
								>
									<div className="max-w-64 truncate">
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
					</ScrollArea>
				)}
				<NewKnowledgeOverlay
					key={`${combinedData.length}`}
					open={isKnowledgeOverlayOpen}
					onClose={(knowledge) => {
						// update it
						if (knowledge) {
							onChange([...values, knowledge]);
							// refresh the list to show the newly created knowledge store selected
							getEngines.reset();
							getProjects.reset();
						}

						// close the overlay
						setIsKnowledgeOverlayOpen(false);
					}}
				/>
			</div>
		);
	},
);
