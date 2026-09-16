import { ArrowUpDown, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Badge,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	Input,
	Muted,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { CatalogFilterBox } from "@/components/catalog";
import { useConfig } from "@/hooks";
import { formatDateToLocal } from "@/utility/date";
import { TemplateCard } from "./template-card";
import { TemplateEmptyCard } from "./template-empty-card";

/**
 * Project types that count as templates for each surface. `CODE` covers both
 * code and blocks apps, mirroring the app catalog.
 */
const TEMPLATE_PROJECT_TYPES = {
	CODE: ["CODE", "BLOCKS"],
	NOTEBOOK: ["NOTEBOOK"],
} as const;

export type TemplateGridType = keyof typeof TEMPLATE_PROJECT_TYPES;

/** Meta key display options that can be filtered on. */
const FILTERABLE_DISPLAY_OPTIONS = [
	"single-checklist",
	"multi-checklist",
	"single-select",
	"multi-select",
	"single-typeahead",
	"multi-typeahead",
	"select-box",
];

const PROJECT_TYPE_LABEL: Partial<Record<Project["project_type"], string>> = {
	CODE: "Code",
	BLOCKS: "Blocks",
	NOTEBOOK: "Notebook",
	SKILL: "Skill",
	WORKSPACE: "Agent",
};

const SORT_OPTIONS = [
	{ value: "PROJECTNAME:ASC", label: "Name (A–Z)" },
	{ value: "PROJECTNAME:DESC", label: "Name (Z–A)" },
	{ value: "DATECREATED:DESC", label: "Newest first" },
	{ value: "DATECREATED:ASC", label: "Oldest first" },
] as const;

const DEFAULT_SORT = "PROJECTNAME:ASC";

const PAGE_SIZE = 6;

interface TemplateGridProps {
	/**
	 * Which templates to list. Omit to list every template type, as the
	 * template catalog does.
	 */
	type?: TemplateGridType;

	/** Fired when a template is chosen, or `null` for the scratch tile. */
	onSelect: (template: Project | null) => void;

	/**
	 * Currently selected template. Pass this to render the selected state —
	 * leave it out for surfaces where selecting is a one-shot action.
	 */
	selected?: Project | null;

	/** Show "Start from scratch" as the first tile. */
	showScratchOption?: boolean;

	/**
	 * Scroll container that drives infinite scroll. Defaults to the app shell's
	 * scroll region, which is what every current caller sits inside.
	 */
	scrollRef?: React.RefObject<HTMLDivElement | null>;

	disabled?: boolean;
}

/**
 * Searchable, sortable and filterable gallery of project templates. Selecting a
 * card calls `onSelect`; what that does is up to the surface — the create pages
 * hold it in state, the catalog opens the clone dialog.
 */
export const TemplateGrid = ({
	type,
	onSelect,
	selected,
	showScratchOption = false,
	scrollRef,
	disabled = false,
}: TemplateGridProps) => {
	const projectMetaKeys = useConfig((state) => state.config.projectMetaKeys);

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const [sort, setSort] = useState<string>(DEFAULT_SORT);
	const [metaFilters, setMetaFilters] = useState<Record<string, string[]>>(
		{},
	);

	const projectTypes = type ? TEMPLATE_PROJECT_TYPES[type] : undefined;
	const activeSortLabel =
		SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "";
	const [sortValue, sortOrder] = sort.split(":");

	// Filterable metadata must come back with each project for filters to work.
	const metaKeys = useMemo(
		() => [
			...projectMetaKeys
				.filter((k) =>
					FILTERABLE_DISPLAY_OPTIONS.includes(k.display_options),
				)
				.map((k) => k.metakey),
			"description",
		],
		[projectMetaKeys],
	);

	const activeFilters = Object.entries(metaFilters).filter(
		([, values]) => values?.length,
	);

	const templates = useIteratorPixel<Project[], Project>(
		(limit, offset) =>
			`MyProjects(metaKeys=${JSON.stringify(metaKeys)}, ${
				debouncedSearch
					? `filterWord=[${JSON.stringify(debouncedSearch)}], `
					: ""
			}${
				activeFilters.length > 0
					? `metaFilters=[${JSON.stringify(metaFilters)}], `
					: ""
			}${
				projectTypes
					? `projectType=${JSON.stringify(projectTypes)}, `
					: ""
			}onlyTemplates=[true], sort=[{"${sortValue}":"${sortOrder}"}], limit=[${limit}], offset=[${offset}]);`,
		(response) =>
			response.length < PAGE_SIZE ? -1 : Number.POSITIVE_INFINITY,
		(response) => response,
		{ limit: PAGE_SIZE },
		[
			debouncedSearch,
			sort,
			JSON.stringify(metaFilters),
			JSON.stringify(projectTypes ?? []),
			JSON.stringify(metaKeys),
		],
	);

	// Guard against a backend that ignores `projectType` alongside
	// `onlyTemplates`, so the grid can only ever show this surface's types.
	const results = projectTypes
		? templates.data.filter((template) =>
				(projectTypes as readonly string[]).includes(
					template.project_type,
				),
			)
		: templates.data;

	const loadMore = useCallback(() => {
		templates.next();
	}, [templates.next]);

	const { setScroll } = useInfiniteScroll({
		disabled: templates.isLoading || !templates.hasMore,
		onNext: loadMore,
	});

	// Use the caller's scroll container when given, otherwise the app shell's.
	// Falls back to a "Load more" button when neither is present.
	const [hasScroller, setHasScroller] = useState(true);
	useEffect(() => {
		const scrollEle =
			scrollRef?.current ??
			(document.querySelector(
				'[data-home-content="true"]',
			) as HTMLDivElement | null);

		setHasScroller(Boolean(scrollEle));
		setScroll(scrollEle);

		return () => setScroll(null);
	}, [setScroll, scrollRef]);

	const rootRef = useRef<HTMLDivElement>(null);
	const queryKey = `${debouncedSearch}|${sort}|${JSON.stringify(metaFilters)}`;
	const lastQueryKeyRef = useRef(queryKey);

	// A query change refetches from offset 0. If the container is still scrolled
	// to the bottom, the scroll handler would immediately page through every
	// result, so bring the top of the grid back into view first.
	useEffect(() => {
		if (lastQueryKeyRef.current === queryKey) {
			return;
		}

		lastQueryKeyRef.current = queryKey;
		rootRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
	}, [queryKey]);

	const hasQuery = Boolean(debouncedSearch) || activeFilters.length > 0;
	const isEmpty = !templates.isLoading && results.length === 0;

	return (
		<div ref={rootRef} className="flex flex-col gap-4">
			{/* Search, with sort tucked into the field */}
			<div className="relative">
				<Search
					aria-hidden="true"
					className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
				/>
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search templates"
					disabled={disabled}
					className="h-10 pr-12 pl-9"
					aria-label="Search templates"
					data-testid="templateGrid-search-txt"
				/>
				<div className="-translate-y-1/2 absolute top-1/2 right-1 flex items-center">
					{search ? (
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							onClick={() => setSearch("")}
							aria-label="Clear search"
						>
							<X aria-hidden="true" />
						</Button>
					) : null}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								disabled={disabled}
								aria-label={`Sort templates: ${activeSortLabel}`}
								data-testid="templateGrid-sort-btn"
							>
								<ArrowUpDown aria-hidden="true" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuLabel>Sort by</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuRadioGroup
								value={sort}
								onValueChange={(next) => {
									setSort(next);
									templates.reset();
								}}
							>
								{SORT_OPTIONS.map((option) => (
									<DropdownMenuRadioItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="flex flex-col gap-6 md:flex-row">
				{/* Filters */}
				<div className="md:sticky md:top-4 md:self-start">
					<CatalogFilterBox
						type={type ?? "CODE"}
						projectTypes={projectTypes}
						filters={metaFilters}
						onChange={(filters) => {
							setMetaFilters(filters);
							templates.reset();
						}}
					/>
				</div>

				{/* Gallery */}
				<div className="flex min-w-0 flex-1 flex-col gap-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{showScratchOption ? (
							<button
								type="button"
								disabled={disabled}
								aria-pressed={selected === null}
								onClick={() => onSelect(null)}
								className="cursor-pointer rounded-xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
								data-testid="templateGrid-empty-btn"
							>
								<TemplateEmptyCard
									isSelected={selected === null}
									className="hover:shadow-md"
								/>
							</button>
						) : null}

						{results.map((template) => {
							const name =
								template.project_display_name ||
								template.project_name;
							const isSelected =
								selected?.project_id === template.project_id;
							const tags = Array.isArray(template.tag)
								? template.tag
								: template.tag
									? [template.tag]
									: [];

							return (
								<HoverCard
									key={template.project_id}
									openDelay={250}
								>
									<HoverCardTrigger asChild>
										<button
											type="button"
											disabled={disabled}
											aria-pressed={
												selected === undefined
													? undefined
													: isSelected
											}
											onClick={() =>
												onSelect(
													isSelected
														? null
														: template,
												)
											}
											className="cursor-pointer rounded-xl text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
										>
											<TemplateCard
												id={template.project_id}
												name={name}
												isSelected={isSelected}
												className="h-full transition-shadow hover:shadow-md"
											/>
										</button>
									</HoverCardTrigger>
									<HoverCardContent
										side="left"
										align="start"
										className="w-80"
									>
										<div className="flex flex-col gap-3">
											<div className="flex items-start justify-between gap-2">
												<p className="font-semibold text-sm">
													{name}
												</p>
												<Badge
													variant="secondary"
													className="shrink-0"
												>
													{PROJECT_TYPE_LABEL[
														template.project_type
													] ?? template.project_type}
												</Badge>
											</div>

											<p className="text-muted-foreground text-sm">
												{template.description ||
													"No description provided for this template."}
											</p>

											{tags.length > 0 ? (
												<div className="flex flex-wrap gap-1">
													{tags.map((tag) => (
														<Badge
															key={tag}
															variant="outline"
														>
															{tag}
														</Badge>
													))}
												</div>
											) : null}

											<dl className="flex flex-col gap-1 border-t pt-2 text-muted-foreground text-xs">
												{template.project_created_by ? (
													<div className="flex justify-between gap-2">
														<dt>Created by</dt>
														<dd className="truncate text-foreground">
															{
																template.project_created_by
															}
														</dd>
													</div>
												) : null}
												{template.project_date_created ? (
													<div className="flex justify-between gap-2">
														<dt>Created</dt>
														<dd className="text-foreground">
															{formatDateToLocal(
																template.project_date_created,
															)}
														</dd>
													</div>
												) : null}
												{template.project_date_last_edited ? (
													<div className="flex justify-between gap-2">
														<dt>Updated</dt>
														<dd className="text-foreground">
															{formatDateToLocal(
																template.project_date_last_edited,
															)}
														</dd>
													</div>
												) : null}
											</dl>
										</div>
									</HoverCardContent>
								</HoverCard>
							);
						})}
					</div>

					{templates.isLoading ? (
						<div className="flex justify-center py-4">
							<Spinner className="size-4" />
						</div>
					) : null}

					{isEmpty ? (
						<Muted>
							{hasQuery
								? "No templates match your search"
								: "No templates available"}
						</Muted>
					) : null}

					{!hasScroller &&
					templates.hasMore &&
					!templates.isLoading ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={disabled}
							onClick={() => templates.next()}
							className="w-fit"
						>
							Load more
						</Button>
					) : null}

					{templates.isError ? (
						<Muted className="text-destructive">
							Templates could not be loaded.
						</Muted>
					) : null}
				</div>
			</div>
		</div>
	);
};
