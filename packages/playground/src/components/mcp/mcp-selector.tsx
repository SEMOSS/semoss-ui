import {
	PlusIcon,
	SearchIcon,
	SquareArrowOutUpRightIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Checkbox,
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	FieldTitle,
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
import {
	engineProjectToMCP,
	mcpToPlatformUrl,
	NewKnowledgeOverlay,
} from "@/components";
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
}

/**
 * Renders the MCPSelector component for selecting mcps within an agent
 */
export const MCPSelector = observer(
	({ type, values, disabled, onChange }: MCPSelectorProps) => {
		const { t } = useTranslation("mcp");
		const { root } = useRoot();
		const [search, setSearch] = useState<string>("");
		const [isKnowledgeOverlayOpen, setIsKnowledgeOverlayOpen] =
			useState(false);

		const debouncedSearch = useDebouncedValue(search);
		const useMCPFilter =
			type === "TOOLBOX" || root.theme.enableKnowledgeMCP !== false;

		// track the selected one
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
				`MyEngineProject (metaKeys = ["tag", "description"], ${useMCPFilter ? `metaFilters=[{"tag":["MCP"]}], ` : ""}type=${type === "TOOLBOX" ? `["PROJECT", "STORAGE", "DATABASE", "FUNCTION"]` : `["VECTOR"]`}, ${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}limit=[${limit}], offset=[${offset}])`,
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
			[debouncedSearch, useMCPFilter],
		);

		/**
		 * Setup infinite scroll for the command list
		 */
		const { setScroll } = useInfiniteScroll({
			disabled: getMCP.isLoading || !getMCP.hasMore || !open,
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
			<div className="w-full overflow-hidden rounded-xl border-border bg-card shadow-sm">
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

				<ScrollArea
					className="h-64 w-full flex-1"
					viewportRef={(e) => setScroll(e)}
				>
					{getMCP.isLoading && (
						<div className="flex h-64 w-full items-center justify-center">
							<Spinner />
						</div>
					)}
					{!getMCP.isLoading && getMCP.data.length === 0 && (
						<div className="flex h-64 w-full items-center justify-center">
							<Muted>
								{type === "TOOLBOX"
									? t("selector.noToolboxesFound")
									: t("selector.noKnowledgeFound")}
							</Muted>
						</div>
					)}
					{!getMCP.isLoading && getMCP.data.length !== 0 && (
						<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
							{getMCP.data.map((mcp) => (
								<FieldLabel key={mcp.id} className="col-span-1">
									<Field
										orientation="horizontal"
										className="pb-2!"
									>
										<FieldContent>
											<FieldTitle
												className="line-clamp-1"
												title={mcp.name}
											>
												{mcp.name}
											</FieldTitle>
											{mcp.description && (
												<FieldDescription
													className="line-clamp-2"
													title={mcp.description}
												>
													{mcp.description}
												</FieldDescription>
											)}
										</FieldContent>

										<Checkbox
											className="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
											disabled={
												disabled ||
												values.some(
													(a) =>
														a.id === mcp.id &&
														a.fromWorkspace,
												)
											}
											checked={Object.hasOwn(
												selected,
												mcp.id,
											)}
											onCheckedChange={() => {
												onSelect(mcp);
											}}
										/>
									</Field>
									{root.theme.showPlatformLinks !== false && (
										<div className="flex w-full flex-row justify-end px-4 pb-4">
											<Tooltip>
												<TooltipTrigger asChild>
													<a
														target="_blank"
														href={mcpToPlatformUrl(
															mcp,
														)}
													>
														<SquareArrowOutUpRightIcon className="size-4" />
													</a>
												</TooltipTrigger>
												<TooltipContent>
													{t("selector.viewDetails")}
												</TooltipContent>
											</Tooltip>
										</div>
									)}
								</FieldLabel>
							))}
						</div>
					)}
				</ScrollArea>
				{values.length > 0 && (
					<ScrollArea className="w-full whitespace-nowrap">
						<ScrollBar orientation="horizontal"></ScrollBar>
						<div className="flex space-x-2 p-4">
							{values.map((t) => (
								<Badge
									key={t.id}
									variant="secondary"
									className="text-sm"
									title={t.name}
								>
									<div className="w-32 truncate">
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
			</div>
		);
	},
);
