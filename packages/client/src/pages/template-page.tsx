import {
	ArrowRight,
	Filter,
	Grid,
	LayoutGrid,
	List,
	RotateCcw,
	Search,
	Sparkles,
	Tag as TagIcon,
	X,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useIteratorPixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Badge,
	Button,
	Card,
	CardContent,
	H1,
	H3,
	Input,
	Muted,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { CatalogFilterBox } from "@/components/catalog";
import { CloneProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { TemplateCard } from "@/components/templates";
import { useRootStore } from "@/hooks";

/**
 * Template Catalog Landing Page
 * Custom Template Hub layout with hero header, featured template spotlight, search & filters
 */
export const TemplatePage: React.FC = observer((): JSX.Element => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();

	// Dynamic metakeys from config
	const metaKeys = useMemo(() => {
		return configStore.store.config.databaseMetaKeys
			.filter((k) => {
				return (
					k.display_options === "single-checklist" ||
					k.display_options === "multi-checklist" ||
					k.display_options === "single-select" ||
					k.display_options === "multi-select" ||
					k.display_options === "single-typeahead" ||
					k.display_options === "multi-typeahead" ||
					k.display_options === "select-box"
				);
			})
			.map((k) => k.metakey);
	}, [configStore.store.config.databaseMetaKeys]);

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const [sortValue, setSortValue] = useState("PROJECTNAME");
	const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
	const [gridStyle, setGridStyle] = useState<"CARD" | "LIST">("CARD");
	const [selectedTag, setSelectedTag] = useState<string | null>(null);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [cloneTemplate, setCloneTemplate] = useState<Project | null>(null);

	const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>({});

	const metaKeysDescription = useMemo(
		() => [...metaKeys, "description", "tag"],
		[metaKeys],
	);

	// Combine quick tag selection into metaFilters
	const activeMetaFilters = useMemo(() => {
		const combined = { ...metaFilters };
		if (selectedTag) {
			combined.tag = [selectedTag];
		}
		return combined;
	}, [metaFilters, selectedTag]);

	/**
	 * Fetch all templates via MyProjects iterator
	 */
	const getTemplates = useIteratorPixel<Project[], Project>(
		(limit, offset) =>
			`MyProjects(metaKeys = ${JSON.stringify(
				metaKeysDescription,
			)}, ${debouncedSearch ? `filterWord=["${debouncedSearch}"], ` : ""} ${Object.keys(activeMetaFilters).length > 0 ? `metaFilters=[${JSON.stringify(activeMetaFilters)}],` : ""} sort=[{"${sortValue}" : "${sortOrder}"}], onlyTemplates=[true], limit=[${limit}], offset=[${offset}]);`,
		(response) => {
			if (response.length < 15) {
				return -1;
			}
			return Infinity;
		},
		(response) => response,
		{
			limit: 15,
		},
		[
			debouncedSearch,
			sortValue,
			sortOrder,
			JSON.stringify(activeMetaFilters),
		],
	);

	/**
	 * Infinite scroll trigger
	 */
	const { setScroll, resetScroll } = useInfiniteScroll({
		disabled: getTemplates.isLoading || !getTemplates.hasMore,
		onNext: () => {
			getTemplates.next();
		},
	});

	useEffect(() => {
		const scrollEle = document.querySelector(
			'[data-home-content="true"]',
		) as HTMLDivElement;

		if (scrollEle) {
			setScroll(scrollEle);
		}

		return () => {
			setScroll(null);
		};
	}, [setScroll]);

	const featuredTemplate = getTemplates.data?.[0];
	const templateList = getTemplates.data;

	const activeFilterCount =
		Object.keys(metaFilters).length + (selectedTag ? 1 : 0);

	const handleResetFilters = () => {
		setMetaFilters({});
		setSelectedTag(null);
		setSearch("");
		resetScroll();
		getTemplates.reset();
	};

	if (getTemplates.isError) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<P className="text-destructive">
					Failed to load templates. Please try again.
				</P>
				<Button
					variant="outline"
					className="mt-4"
					onClick={() => getTemplates.reset()}
				>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>

			<div className="min-h-screen bg-background">
				{/* Modern Template Hub Hero Section */}
				<div className="relative overflow-hidden border-b bg-linear-to-b from-primary/5 via-background to-background px-4 py-10 md:px-8">
					<div className="mx-auto max-w-7xl">
						<div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
							<div className="max-w-2xl space-y-2">
								<div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs shadow-xs backdrop-blur-sm">
									<Sparkles className="size-3.5 text-primary" />
									<span className="font-semibold">
										Template Hub
									</span>
									<span className="text-muted-foreground">
										• Accelerate Your Projects
									</span>
								</div>

								<H1 className="font-extrabold text-3xl tracking-tight sm:text-4xl">
									Explore Ready-to-Use Templates
								</H1>

								<P className="text-base text-muted-foreground">
									Discover pre-configured application
									templates, agent configurations, and
									workflow structures to jumpstart your
									development.
								</P>
							</div>

							<div className="flex items-center gap-3">
								<Badge
									variant="secondary"
									className="px-3 py-1.5 text-xs"
								>
									{getTemplates.data.length} Available
								</Badge>
							</div>
						</div>

						{/* Hero Search & Control Bar */}
						<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
							{/* Search Bar Input */}
							<div className="relative flex-1">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3.5 size-4 text-muted-foreground" />
								<Input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search templates by name, tags, or description..."
									className="h-11 pr-10 pl-10 shadow-xs"
								/>
								{search && (
									<button
										type="button"
										onClick={() => setSearch("")}
										className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
									>
										<X className="size-4" />
									</button>
								)}
							</div>

							{/* Filter Drawer Trigger */}
							<Sheet
								open={isFilterOpen}
								onOpenChange={setIsFilterOpen}
							>
								<SheetTrigger asChild>
									<Button
										variant="outline"
										className="h-11 gap-2"
									>
										<Filter className="size-4" />
										Filters
										{activeFilterCount > 0 && (
											<Badge
												variant="default"
												className="ml-1 size-5 rounded-full p-0 font-bold text-[10px]"
											>
												{activeFilterCount}
											</Badge>
										)}
									</Button>
								</SheetTrigger>
								<SheetContent
									side="right"
									className="w-80 sm:w-96"
								>
									<SheetHeader>
										<SheetTitle className="flex items-center justify-between">
											<span>Filter Templates</span>
											{activeFilterCount > 0 && (
												<Button
													size="sm"
													variant="ghost"
													className="h-8 gap-1 text-xs"
													onClick={handleResetFilters}
												>
													<RotateCcw className="size-3" />
													Reset
												</Button>
											)}
										</SheetTitle>
									</SheetHeader>
									<div className="mt-4">
										<CatalogFilterBox
											type="CODE"
											filters={
												metaFilters as Record<
													string,
													string[]
												>
											}
											onChange={(f) => {
												setMetaFilters(f);
												resetScroll();
												getTemplates.reset();
											}}
										/>
									</div>
								</SheetContent>
							</Sheet>

							{/* Sort Selector */}
							<Select
								value={`${sortValue}:${sortOrder}`}
								onValueChange={(val) => {
									const [v, o] = val.split(":");
									setSortValue(v);
									setSortOrder(o as "ASC" | "DESC");
									resetScroll();
									getTemplates.reset();
								}}
							>
								<SelectTrigger className="h-11 w-44">
									<SelectValue placeholder="Sort By" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="PROJECTNAME:ASC">
										Name (A–Z)
									</SelectItem>
									<SelectItem value="PROJECTNAME:DESC">
										Name (Z–A)
									</SelectItem>
									<SelectItem value="DATECREATED:DESC">
										Newest First
									</SelectItem>
									<SelectItem value="DATECREATED:ASC">
										Oldest First
									</SelectItem>
								</SelectContent>
							</Select>

							{/* Layout Switcher */}
							<div className="flex items-center rounded-lg border bg-muted p-1">
								<Button
									size="icon"
									variant={
										gridStyle === "CARD"
											? "default"
											: "ghost"
									}
									className="size-9 rounded-md"
									onClick={() => setGridStyle("CARD")}
									title="Grid View"
								>
									<LayoutGrid className="size-4" />
								</Button>
								<Button
									size="icon"
									variant={
										gridStyle === "LIST"
											? "default"
											: "ghost"
									}
									className="size-9 rounded-md"
									onClick={() => setGridStyle("LIST")}
									title="List View"
								>
									<List className="size-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content Area */}
				<div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
					{/* Active Filter Pills */}
					{activeFilterCount > 0 && (
						<div className="mb-6 flex flex-wrap items-center gap-2">
							<span className="text-muted-foreground text-xs">
								Active Filters:
							</span>
							{selectedTag && (
								<Badge
									variant="secondary"
									className="gap-1.5 px-2.5 py-1 text-xs"
								>
									<TagIcon className="size-3" />
									Tag: {selectedTag}
									<X
										className="size-3 cursor-pointer hover:text-foreground"
										onClick={() => setSelectedTag(null)}
									/>
								</Badge>
							)}
							<Button
								variant="ghost"
								size="sm"
								className="h-7 text-muted-foreground text-xs hover:text-foreground"
								onClick={handleResetFilters}
							>
								Clear all
							</Button>
						</div>
					)}

					{/* Featured Template Banner (Show on top if present and no search active) */}
					{!debouncedSearch &&
						activeFilterCount === 0 &&
						featuredTemplate && (
							<div className="mb-10">
								<div className="mb-3 flex items-center gap-2">
									<Sparkles className="size-4 text-primary" />
									<H3 className="font-semibold text-lg">
										Featured Spotlight
									</H3>
								</div>

								<Card className="overflow-hidden border-primary/20 bg-linear-to-r from-primary/5 via-background to-secondary/10 shadow-sm transition-all hover:border-primary/40">
									<CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
										<div className="max-w-2xl space-y-3">
											<div className="flex items-center gap-2">
												<Badge
													variant="default"
													className="text-xs"
												>
													Featured Template
												</Badge>
												{featuredTemplate.tag && (
													<Badge
														variant="outline"
														className="text-xs"
													>
														{Array.isArray(
															featuredTemplate.tag,
														)
															? featuredTemplate
																	.tag[0]
															: featuredTemplate.tag}
													</Badge>
												)}
											</div>

											<H3 className="font-bold text-2xl tracking-tight">
												{featuredTemplate.project_name}
											</H3>

											<P className="text-muted-foreground text-sm leading-relaxed">
												{featuredTemplate.description ||
													"Accelerate your workflow with this feature-packed project template."}
											</P>
										</div>

										<div className="flex shrink-0 items-center gap-3">
											<Button
												variant="outline"
												asChild
												className="gap-1.5"
											>
												<Link
													to={`/templates/${featuredTemplate.project_id}`}
												>
													View Details
													<ArrowRight className="size-4" />
												</Link>
											</Button>
											<Button
												variant="default"
												className="gap-2 font-semibold shadow-sm"
												onClick={() =>
													setCloneTemplate(
														featuredTemplate,
													)
												}
											>
												<Sparkles className="size-4" />
												Use Template
											</Button>
										</div>
									</CardContent>
								</Card>
							</div>
						)}

					{/* Loading State */}
					{getTemplates.isLoading && templateList.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16">
							<Spinner className="size-8 text-primary" />
							<P className="mt-3 text-muted-foreground text-sm">
								Loading template catalog...
							</P>
						</div>
					) : null}

					{/* Template Items Grid / List */}
					{templateList.length > 0 && (
						<div
							className={
								gridStyle === "CARD"
									? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
									: "flex flex-col gap-4"
							}
						>
							{templateList.map((template) => (
								<TemplateCard
									key={template.project_id}
									id={template.project_id}
									path={`/templates/${template.project_id}`}
									name={
										template.project_display_name ||
										template.project_name
									}
									description={template.description || ""}
									image=""
									dateLastEdited={
										template.project_date_created || ""
									}
									tags={
										Array.isArray(template.tag)
											? template.tag
											: template.tag
												? [template.tag]
												: []
									}
									onUseTemplate={() =>
										setCloneTemplate(template)
									}
								/>
							))}
						</div>
					)}

					{/* Lazy Loading Spinner */}
					{getTemplates.isLoading && templateList.length > 0 ? (
						<div className="flex items-center justify-center py-8">
							<Spinner className="size-5 text-primary" />
						</div>
					) : null}

					{/* Empty State */}
					{!getTemplates.isLoading && templateList.length === 0 && (
						<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 px-4 py-16 text-center">
							<div className="flex size-12 items-center justify-center rounded-full bg-muted">
								<Grid className="size-6 text-muted-foreground" />
							</div>
							<H3 className="mt-4 font-semibold text-lg">
								No templates found
							</H3>
							<Muted className="mt-1 max-w-sm text-sm">
								We couldn't find any templates matching your
								search or filter criteria.
							</Muted>
							{activeFilterCount > 0 && (
								<Button
									variant="outline"
									size="sm"
									className="mt-4 gap-1.5"
									onClick={handleResetFilters}
								>
									<RotateCcw className="size-3.5" />
									Clear Filters
								</Button>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Clone Project Dialog */}
			{cloneTemplate && (
				<CloneProjectDialog
					open={Boolean(cloneTemplate)}
					project={cloneTemplate}
					onClose={(newAppId) => {
						setCloneTemplate(null);
						if (newAppId) {
							navigate(`/s/${newAppId}`);
						}
					}}
				/>
			)}
		</>
	);
});
