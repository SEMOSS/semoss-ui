import {
	Filter,
	Maximize2,
	Minimize2,
	Network,
	RefreshCcwDot,
	RefreshCw,
	Route,
	UserCheck,
} from "lucide-react";
import { type ReactNode, useId } from "react";
import {
	Badge,
	Button,
	Checkbox,
	cn,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
	Spinner,
	ToggleGroup,
	ToggleGroupItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { DEPENDENCY_ROLE_LABELS } from "@/features/catalog/dependencies/catalog-dependency";
import {
	DEPENDENCY_FAMILIES,
	type DependencyFamily,
	type DependencyGraphIndex,
	FAMILY_ORDER,
	type LinkFilter,
} from "./dependency-graph";
import { DependencyMapSearch } from "./dependency-map-search";
import type {
	DependencyMapViewChange,
	DependencyMapViewState,
	LensKind,
} from "./use-dependency-map-view";

/** The views, in the toggle's order, each an icon with its name in a tooltip. */
const VIEWS: readonly {
	value: LensKind;
	label: string;
	hint: string;
	icon: typeof Network;
}[] = [
	{
		value: "none",
		label: "All",
		hint: "The whole network",
		icon: Network,
	},
	{
		value: "trace",
		label: "Trace",
		hint: "What an item uses and what uses it",
		icon: Route,
	},
	{
		value: "access",
		label: "User Access",
		hint: "What one person can use",
		icon: UserCheck,
	},
];

interface DependencyMapToolbarProps {
	/** The network */
	index: DependencyGraphIndex;
	/** The view */
	view: DependencyMapViewState;
	/** Changes the view */
	onViewChange: (change: DependencyMapViewChange) => void;
	/** Clears the search and filters */
	onClearFilters: () => void;
	/** The search's matches, best first */
	matches: readonly string[];
	/** Centers the canvas on an item and selects it */
	onJump: (id: string) => void;
	/** Whether the network is being read again */
	isRefreshing: boolean;
	/** Reads the network again */
	onRefresh: () => void;
	/** Opens Sync Automatic Dependencies */
	onSync: () => void;
	/** Whether the map fills the window */
	isExpanded: boolean;
	/** Expands or collapses the map */
	onToggleExpand: () => void;
}

/** An icon control with its name in a tooltip. */
const withTooltip = (label: string, control: ReactNode): ReactNode => (
	<Tooltip>
		<TooltipTrigger asChild>{control}</TooltipTrigger>
		<TooltipContent>{label}</TooltipContent>
	</Tooltip>
);

/**
 * The map's one toolbar: search, the view, the filters, the counts, and the
 * map's actions. Controls are icons with their names in tooltips, so the
 * toolbar stays one row and the canvas keeps the page.
 */
export const DependencyMapToolbar = ({
	index,
	view,
	onViewChange,
	onClearFilters,
	matches,
	onJump,
	isRefreshing,
	onRefresh,
	onSync,
	isExpanded,
	onToggleExpand,
}: DependencyMapToolbarProps) => {
	const linksId = useId();
	const counts = new Map<DependencyFamily, number>();
	for (const family of index.families.values()) {
		counts.set(family, (counts.get(family) ?? 0) + 1);
	}
	const shownFamilies = FAMILY_ORDER.filter((family) => counts.has(family));
	const isFamilyShown = (family: DependencyFamily): boolean =>
		view.families === null || view.families.has(family);
	const filterCount =
		(view.families === null ? 0 : 1) + (view.links === "ALL" ? 0 : 1);

	const handleFamilyChange = (family: DependencyFamily, isShown: boolean) => {
		const next = new Set(shownFamilies.filter(isFamilyShown));
		if (isShown) {
			next.add(family);
		} else {
			next.delete(family);
		}
		// every family shown is the same as no filter
		onViewChange({
			families: next.size === shownFamilies.length ? null : next,
		});
	};

	return (
		<div className="flex flex-wrap items-center gap-2">
			<DependencyMapSearch
				index={index}
				query={view.query}
				onQueryChange={(query) => onViewChange({ query })}
				matches={matches}
				onJump={onJump}
			/>
			<ToggleGroup
				type="single"
				size="sm"
				variant="outline"
				aria-label="View"
				value={view.lens}
				onValueChange={(lens: LensKind | "") => {
					if (lens) {
						onViewChange({ lens });
					}
				}}
			>
				{VIEWS.map(({ value, label, hint, icon: Icon }) => (
					<Tooltip key={value}>
						<TooltipTrigger asChild>
							<ToggleGroupItem
								value={value}
								aria-label={label}
								className="px-2.5"
							>
								<Icon aria-hidden="true" />
							</ToggleGroupItem>
						</TooltipTrigger>
						<TooltipContent>
							<span className="font-medium">{label}</span>: {hint}
						</TooltipContent>
					</Tooltip>
				))}
			</ToggleGroup>
			<Popover>
				{withTooltip(
					"Filters",
					<PopoverTrigger asChild>
						<Button
							type="button"
							size="sm"
							variant="outline"
							aria-label={
								filterCount > 0
									? `Filters, ${filterCount} on`
									: "Filters"
							}
							className="px-2.5"
						>
							<Filter aria-hidden="true" />
							{filterCount > 0 ? (
								<Badge variant="secondary" className="px-1.5">
									{filterCount}
								</Badge>
							) : null}
						</Button>
					</PopoverTrigger>,
				)}
				<PopoverContent
					align="start"
					className="flex w-72 flex-col gap-4"
				>
					<fieldset className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<legend className="font-medium text-sm">
								Types
							</legend>
							<Button
								type="button"
								size="sm"
								variant="link"
								className="h-auto p-0"
								disabled={view.families === null}
								onClick={() => onViewChange({ families: null })}
							>
								Show All
							</Button>
						</div>
						{shownFamilies.map((family) => {
							const config = DEPENDENCY_FAMILIES[family];
							const checkboxId = `${linksId}-${family}`;
							return (
								<div
									key={family}
									className="flex items-center gap-2"
								>
									<Checkbox
										id={checkboxId}
										checked={isFamilyShown(family)}
										onCheckedChange={(checked) =>
											handleFamilyChange(
												family,
												checked === true,
											)
										}
									/>
									<span
										aria-hidden="true"
										className={cn(
											"size-2.5 rounded-full",
											config.swatchClass,
										)}
									/>
									<Label
										htmlFor={checkboxId}
										className="flex-1 font-normal"
									>
										{config.label}
									</Label>
									<span className="text-muted-foreground text-xs">
										{(
											counts.get(family) ?? 0
										).toLocaleString()}
									</span>
								</div>
							);
						})}
					</fieldset>
					<div className="flex flex-col gap-2">
						<Label htmlFor={linksId}>Links</Label>
						<Select
							value={view.links}
							onValueChange={(links: LinkFilter) =>
								onViewChange({ links })
							}
						>
							<SelectTrigger
								id={linksId}
								size="sm"
								className="w-full"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">All links</SelectItem>
								<SelectItem value="AUTOMATIC">
									Automatic links
								</SelectItem>
								<SelectItem value="MANUAL">
									Manual links
								</SelectItem>
								<SelectSeparator />
								<SelectGroup>
									<SelectLabel>One role</SelectLabel>
									{Object.entries(DEPENDENCY_ROLE_LABELS)
										.filter(([role]) => role !== "MANUAL")
										.map(([role, label]) => (
											<SelectItem key={role} value={role}>
												{label}
											</SelectItem>
										))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={view.query === "" && filterCount === 0}
						onClick={onClearFilters}
					>
						Clear Search and Filters
					</Button>
				</PopoverContent>
			</Popover>
			<span className="ml-auto hidden text-muted-foreground text-xs sm:inline">
				{index.nodes.size.toLocaleString()} items ·{" "}
				{index.edges.size.toLocaleString()} links
			</span>
			{withTooltip(
				isRefreshing ? "Refreshing..." : "Refresh",
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					aria-label="Refresh"
					disabled={isRefreshing}
					onClick={onRefresh}
				>
					{isRefreshing ? (
						<Spinner className="size-4" />
					) : (
						<RefreshCw aria-hidden="true" />
					)}
				</Button>,
			)}
			{withTooltip(
				isExpanded ? "Collapse" : "Expand",
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					aria-label={
						isExpanded ? "Collapse the map" : "Expand the map"
					}
					onClick={onToggleExpand}
				>
					{isExpanded ? (
						<Minimize2 aria-hidden="true" />
					) : (
						<Maximize2 aria-hidden="true" />
					)}
				</Button>,
			)}
			{withTooltip(
				"Work out every item's automatic dependencies again",
				<Button type="button" size="sm" onClick={onSync}>
					<RefreshCcwDot aria-hidden="true" />
					Sync
				</Button>,
			)}
		</div>
	);
};
