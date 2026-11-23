import {
	Filter,
	type LucideIcon,
	Network,
	RefreshCcwDot,
	RefreshCw,
	Route,
	UserCheck,
} from "lucide-react";
import { useId } from "react";
import {
	Badge,
	Button,
	ButtonGroup,
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
import { ACTIVE_TOGGLE_CLASS } from "./active-toggle";
import {
	DEPENDENCY_FAMILIES,
	type DependencyFamily,
	FAMILY_ORDER,
	type LinkFilter,
} from "./dependency-graph";
import { FAMILY_SWATCH_CLASS } from "./dependency-legend-lists";
import { DependencyMapSearch } from "./dependency-map-search";
import { ExpandCanvasButton } from "./expand-canvas-button";
import { MapTooltip } from "./map-tooltip";
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
	icon: LucideIcon;
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
	/** How many items of each family the network holds */
	familyCounts: ReadonlyMap<DependencyFamily, number>;
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

/**
 * The map's one toolbar: search, the view, the filters, the counts, and the
 * map's actions. Controls are icons with their names in tooltips, so the
 * toolbar stays one row and the canvas keeps the page.
 */
export const DependencyMapToolbar = ({
	familyCounts: counts,
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
	const typesId = useId();
	const linksId = useId();
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
								className={cn("px-2.5", ACTIVE_TOGGLE_CLASS)}
							>
								<Icon aria-hidden="true" />
								{label}
							</ToggleGroupItem>
						</TooltipTrigger>
						<TooltipContent>
							<span className="font-medium">{label}</span>: {hint}
						</TooltipContent>
					</Tooltip>
				))}
			</ToggleGroup>
			<Popover>
				<MapTooltip label="Filters">
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
						>
							<Filter aria-hidden="true" />
							{filterCount > 0 ? (
								<Badge variant="secondary" className="px-1.5">
									{filterCount}
								</Badge>
							) : null}
						</Button>
					</PopoverTrigger>
				</MapTooltip>
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
							const checkboxId = `${typesId}-${family}`;
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
											FAMILY_SWATCH_CLASS,
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
			<ButtonGroup aria-label="Map actions" className="ml-auto">
				<MapTooltip label={isRefreshing ? "Refreshing..." : "Refresh"}>
					<Button
						type="button"
						size="icon-sm"
						variant="outline"
						aria-label="Refresh"
						disabled={isRefreshing}
						onClick={onRefresh}
					>
						{isRefreshing ? (
							<Spinner className="size-4" />
						) : (
							<RefreshCw aria-hidden="true" />
						)}
					</Button>
				</MapTooltip>
				<ExpandCanvasButton
					isExpanded={isExpanded}
					onToggle={onToggleExpand}
				/>
			</ButtonGroup>
			<MapTooltip label="Work out the automatic dependencies again">
				<Button type="button" size="sm" onClick={onSync}>
					<RefreshCcwDot aria-hidden="true" />
					Sync
				</Button>
			</MapTooltip>
		</div>
	);
};
