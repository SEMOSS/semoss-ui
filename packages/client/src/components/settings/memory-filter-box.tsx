import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@semoss/ui/next";
import { getTagColorPalette, toTitleCase } from "@/utility";

interface MemoryMetaValueRow {
	metakey: string;
	metavalue: string;
	count: number;
}

export interface FixedFilterSection {
	/** Section label, e.g. "Type" or "Status" */
	label: string;
	/** All possible values for this section (fixed enum, not counted) */
	values: string[];
}

export interface MemoryFilterBoxProps {
	/** A fixed, always-present section (e.g. event type or action item status) */
	fixedSection: FixedFilterSection;
	/** Currently selected values for the fixed section */
	fixedSelected: Set<string>;
	/** Callback when a fixed-section value is toggled */
	onToggleFixed: (value: string) => void;
	/** Optional workspace/agent scope to fetch metadata-key counts within */
	workspaceId?: string;
	/** Currently selected custom metaFilters (metakey -> values) */
	metaFilters: Record<string, string[]>;
	/** Callback when metaFilters change */
	onMetaFiltersChange: (filters: Record<string, string[]>) => void;
}

const COLLAPSED_ITEM_LIMIT = 8;

/**
 * A memory-specific filter sidebar, visually modeled after the Engine/Project
 * catalog's `CatalogFilterBox` (collapsible sections, pill-style multi-select
 * options with counts, "Filters" header with a total-active badge and
 * "Clear all") - reimplemented here rather than reusing `CatalogFilterBox`
 * directly because that component is hard-wired to Engine/Project metaKeys
 * (`useConfig`'s `databaseMetaKeys`/`projectMetaKeys` + `GetEngineMetaValues`/
 * `GetProjectMetaValues`), not Memory's own `MEMORY_META` dimensions.
 */
export const MemoryFilterBox = ({
	fixedSection,
	fixedSelected,
	onToggleFixed,
	workspaceId,
	metaFilters,
	onMetaFiltersChange,
}: MemoryFilterBoxProps) => {
	const [expandedSections, setExpandedSections] = useState<
		Record<string, boolean>
	>({});
	const [showCollapsible, setShowCollapsible] = useState<
		Record<string, boolean>
	>({ [fixedSection.label]: true });

	const getMetaValues = usePixel<MemoryMetaValueRow[]>(
		`GetMemoryMetaValues(${workspaceId ? `workspaceId=${JSON.stringify(workspaceId)}` : ""});`,
		{ data: [] },
	);

	const metaOptions = useMemo(() => {
		const grouped: Record<string, { value: string; count: number }[]> = {};
		for (const row of getMetaValues.data ?? []) {
			if (!grouped[row.metakey]) {
				grouped[row.metakey] = [];
			}
			grouped[row.metakey].push({
				value: row.metavalue,
				count: row.count,
			});
		}
		return grouped;
	}, [getMetaValues.data]);

	useEffect(() => {
		setShowCollapsible((prev) => {
			const next = { ...prev };
			for (const key of Object.keys(metaOptions)) {
				if (next[key] === undefined) {
					next[key] = true;
				}
			}
			return next;
		});
	}, [metaOptions]);

	const toggleMetaValue = (metakey: string, value: string) => {
		const current = metaFilters[metakey] ?? [];
		const next = current.includes(value)
			? current.filter((v) => v !== value)
			: [...current, value];

		const updated = { ...metaFilters };
		if (next.length) {
			updated[metakey] = next;
		} else {
			delete updated[metakey];
		}
		onMetaFiltersChange(updated);
	};

	const totalActiveFilters =
		fixedSelected.size +
		Object.values(metaFilters).reduce((sum, v) => sum + v.length, 0);

	const clearAll = () => {
		for (const value of fixedSelected) {
			onToggleFixed(value);
		}
		onMetaFiltersChange({});
	};

	const renderSection = (
		key: string,
		label: string,
		options: { value: string; count?: number }[],
		selected: Set<string>,
		onToggle: (value: string) => void,
	) => {
		const isExpanded = expandedSections[key] || false;
		const selectedOptions = options.filter((opt) =>
			selected.has(opt.value),
		);
		const unselectedOptions = options.filter(
			(opt) => !selected.has(opt.value),
		);
		const visibleUnselected = isExpanded
			? unselectedOptions
			: unselectedOptions.slice(
					0,
					Math.max(0, COLLAPSED_ITEM_LIMIT - selectedOptions.length),
				);
		const hasMore = unselectedOptions.length > visibleUnselected.length;

		return (
			<div key={key} className="px-3 pt-1">
				<Collapsible
					open={showCollapsible[key]}
					onOpenChange={(open) =>
						setShowCollapsible((prev) => ({ ...prev, [key]: open }))
					}
				>
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							className="flex h-8 w-full items-center justify-between rounded-md px-2 py-1 hover:bg-accent/50 has-[>svg]:px-2"
						>
							<span className="flex items-center gap-2">
								<span className="font-medium text-[13px] text-foreground">
									{label}
								</span>
								{selectedOptions.length > 0 && (
									<Badge
										variant="secondary"
										className="h-5 min-w-5 rounded-full px-1.5 font-medium text-[10px] leading-none"
									>
										{selectedOptions.length}
									</Badge>
								)}
							</span>
							{showCollapsible[key] ? (
								<ChevronUp className="size-3.5 text-muted-foreground" />
							) : (
								<ChevronDown className="size-3.5 text-muted-foreground" />
							)}
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="flex flex-wrap gap-1.5 px-1 pt-2 pb-1">
							{selectedOptions.map((opt) => (
								<button
									type="button"
									key={opt.value}
									onClick={() => onToggle(opt.value)}
									aria-pressed={true}
									aria-label={`Remove ${opt.value} filter`}
									className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-medium text-primary text-xs transition-all duration-200 hover:bg-primary/20 active:scale-95"
									style={getTagColorPalette(opt.value)}
								>
									<span>{toTitleCase(opt.value)}</span>
									{opt.count != null && (
										<span className="text-[10px] text-primary/60">
											{opt.count}
										</span>
									)}
								</button>
							))}
							{visibleUnselected.map((opt) => (
								<button
									type="button"
									key={opt.value}
									onClick={() => onToggle(opt.value)}
									aria-pressed={false}
									aria-label={`Filter by ${opt.value}`}
									className="inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-2.5 py-1 text-foreground text-xs transition-all duration-200 hover:border-foreground/30 hover:bg-accent active:scale-95"
								>
									<span>{toTitleCase(opt.value)}</span>
									{opt.count != null && (
										<span className="text-[10px] opacity-70">
											{opt.count}
										</span>
									)}
								</button>
							))}
						</div>
						{(hasMore || isExpanded) && (
							<Button
								type="button"
								variant="ghost"
								className="mt-0.5 h-auto px-2 py-1 font-normal text-primary text-xs hover:bg-transparent hover:text-primary/80"
								onClick={() =>
									setExpandedSections((prev) => ({
										...prev,
										[key]: !prev[key],
									}))
								}
							>
								{isExpanded
									? "Show less"
									: `+${unselectedOptions.length - visibleUnselected.length} more`}
							</Button>
						)}
					</CollapsibleContent>
				</Collapsible>
				<div className="mx-1 mt-2 h-px bg-border/50" />
			</div>
		);
	};

	return (
		<div className="flex w-full flex-col overflow-y-auto overflow-x-hidden rounded-xl border bg-card shadow-sm md:max-h-[calc(100vh-220px)] md:w-[280px]">
			<div className="flex items-center justify-start gap-2 px-4 pt-4 pb-2">
				<SlidersHorizontal className="size-4 text-muted-foreground" />
				<h6 className="font-semibold text-foreground text-sm">
					Filters
				</h6>
				{totalActiveFilters > 0 && (
					<Badge
						variant="default"
						className="h-5 min-w-5 rounded-full px-1.5 text-[10px] leading-none"
					>
						{totalActiveFilters}
					</Badge>
				)}
				{totalActiveFilters > 0 && (
					<Button
						type="button"
						variant="ghost"
						className="h-auto px-2 py-1 font-medium text-primary text-xs hover:text-primary/80"
						onClick={clearAll}
					>
						Clear all
					</Button>
				)}
			</div>
			<div className="flex flex-col gap-1 pb-3">
				{renderSection(
					fixedSection.label,
					fixedSection.label,
					fixedSection.values.map((value) => ({ value })),
					fixedSelected,
					onToggleFixed,
				)}
				{Object.entries(metaOptions).map(([metakey, options]) =>
					renderSection(
						metakey,
						toTitleCase(metakey),
						options,
						new Set(metaFilters[metakey] ?? []),
						(value) => toggleMetaValue(metakey, value),
					),
				)}
			</div>
		</div>
	);
};
