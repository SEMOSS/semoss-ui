import { Check, Copy, Search, X } from "lucide-react";
import { type UIEvent, useEffect, useState } from "react";
import {
	runPixel,
	useDebouncedValue,
	useIteratorPixel,
} from "@semoss/sdk/react";
import {
	AppCatalogAvatar,
	type CatalogDependency,
	type CatalogType,
	type Engine,
	EngineSubtypeIcon,
	type Project,
} from "@semoss/shared";
import {
	Badge,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Tabs,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { ALL_ENGINE_TYPES } from "@/utility/catalog";
import {
	getDependencyTypeConfig,
	toCatalogDependencyPayload,
} from "./catalog-dependency";

interface EditCatalogDependenciesDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Called on close; true when a save succeeded */
	onClose: (saved: boolean) => void;
	/** The owner's id */
	catalogId: string;
	/** The owner's specific type */
	catalogType: CatalogType;
	/** The owner's current dependencies, the initial selection */
	dependencies: CatalogDependency[];
}

/** Which reactor populates the list. */
type DependencySource = "ENGINE" | "PROJECT";

/** Every project type the picker offers, in the backend's spelling. */
const PROJECT_TYPES: readonly CatalogType[] = [
	"CODE",
	"BLOCKS",
	"INSIGHTS",
	"SKILL",
	"NOTEBOOK",
	"AUTOMATION",
	"WORKSPACE",
];

/** The type filter's value when every type of the source is listed. */
const ALL_TYPES = "ALL";

/** Page size for the paginated reactors. */
const PAGE_LIMIT = 25;

/** The icon of a dependency: a project's avatar or an engine's subtype icon. */
const renderDependencyIcon = (
	dep: CatalogDependency,
	sizeClass: string,
	textClass: string,
) =>
	getDependencyTypeConfig(dep.catalog_type).kind === "project" ? (
		<AppCatalogAvatar
			projectId={dep.catalog_id}
			name={dep.catalog_name}
			className={cn("shrink-0 rounded", sizeClass, textClass)}
		/>
	) : (
		<EngineSubtypeIcon
			engineType={dep.catalog_type}
			engineSubtype={dep.catalog_subtype}
			alt={dep.catalog_name}
			className={cn("shrink-0 object-contain", sizeClass)}
		/>
	);

/**
 * Edits an engine's or a project's dependencies: pick any of the user's
 * engines (every type) and projects (every type), filtered by type and
 * search, and save the whole set. The owner itself is never offered.
 */
export const EditCatalogDependenciesDialog = ({
	open,
	onClose,
	catalogId,
	catalogType,
	dependencies,
}: EditCatalogDependenciesDialogProps) => {
	const [selectedDeps, setSelectedDeps] = useState<CatalogDependency[]>([]);
	const [search, setSearch] = useState<string>("");
	const [source, setSource] = useState<DependencySource>("ENGINE");
	const [typeFilter, setTypeFilter] = useState<string>(ALL_TYPES);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const handleCopyId = (id: string) => {
		navigator.clipboard
			.writeText(id)
			.then(() => {
				setCopiedId(id);
				setTimeout(() => {
					setCopiedId((current) => (current === id ? null : current));
				}, 1500);
			})
			.catch(() => {
				toast.error("Failed to copy ID");
			});
	};

	// Coalesce to "" so the initial undefined -> "" debounce transition doesn't
	// reset the iterator (which clears its data but can't refetch an unchanged
	// query), which would blank the list until the source is toggled.
	const debouncedSearch = useDebouncedValue(search) ?? "";
	const filterClause = debouncedSearch
		? `filterWord=${JSON.stringify(debouncedSearch)}, `
		: "";
	const sourceTypes: readonly CatalogType[] =
		source === "ENGINE" ? ALL_ENGINE_TYPES : PROJECT_TYPES;
	const queriedTypes =
		typeFilter === ALL_TYPES
			? sourceTypes
			: sourceTypes.filter((type) => type === typeFilter);

	const getEngines = useIteratorPixel<Engine[], CatalogDependency>(
		(limit, offset) =>
			open && source === "ENGINE"
				? `MyEngines(${filterClause}engineTypes=${JSON.stringify(queriedTypes)}, limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length < PAGE_LIMIT ? -1 : Infinity),
		(response) =>
			response.map((eng) => ({
				catalog_id: eng.engine_id,
				catalog_name: eng.engine_display_name || eng.engine_name,
				catalog_type: eng.engine_type,
				catalog_subtype: eng.engine_subtype,
			})),
		{ limit: PAGE_LIMIT },
		[debouncedSearch, source, typeFilter, open],
	);

	const getProjects = useIteratorPixel<Project[], CatalogDependency>(
		(limit, offset) =>
			open && source === "PROJECT"
				? `MyProjects(${filterClause}projectType=${JSON.stringify(queriedTypes)}, limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length < PAGE_LIMIT ? -1 : Infinity),
		(response) =>
			response.map((proj) => ({
				catalog_id: proj.project_id,
				catalog_name: proj.project_display_name || proj.project_name,
				catalog_type: proj.project_type,
			})),
		{ limit: PAGE_LIMIT },
		[debouncedSearch, source, typeFilter, open],
	);

	const activeSource = source === "ENGINE" ? getEngines : getProjects;
	// an engine or a project can't depend on itself
	const options = activeSource.data.filter(
		(option) => option.catalog_id !== catalogId,
	);
	const isLoading = activeSource.isLoading;
	const sourceLabel = source === "ENGINE" ? "engines" : "projects";

	/**
	 * Advance the active source when the list is scrolled near the bottom.
	 * A native overflow container is used (instead of a Radix ScrollArea) so
	 * mouse-wheel scrolling works reliably inside the dialog.
	 */
	const handleScroll = (event: UIEvent<HTMLDivElement>) => {
		const el = event.currentTarget;
		const nearBottom =
			el.scrollHeight - el.scrollTop - el.clientHeight < 80;
		if (nearBottom && !isLoading && activeSource.hasMore) {
			activeSource.next();
		}
	};

	const handleUpdateDependencies = async () => {
		try {
			setIsSaving(true);
			const response = await runPixel<[unknown]>(
				`SetCatalogDependencies(catalogId="${catalogId}", catalogType="${catalogType}", dependencies=${JSON.stringify(selectedDeps.map(toCatalogDependencyPayload))});`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}
			toast.success("Successfully updated dependencies");
			onClose(true);
		} catch (e) {
			toast.error(getErrorMessage(e, "Failed to update dependencies"));
		} finally {
			setIsSaving(false);
		}
	};

	const handleRemoveDependency = (id: string) => {
		setSelectedDeps((prev) => prev.filter((dep) => dep.catalog_id !== id));
	};

	const toggleDependency = (dep: CatalogDependency) => {
		setSelectedDeps((prev) =>
			prev.some((selected) => selected.catalog_id === dep.catalog_id)
				? prev.filter(
						(selected) => selected.catalog_id !== dep.catalog_id,
					)
				: [...prev, dep],
		);
	};

	useEffect(() => {
		// Reset state when the dialog opens
		if (open) {
			setSelectedDeps(dependencies);
			setSearch("");
			setSource("ENGINE");
			setTypeFilter(ALL_TYPES);
		}
	}, [open, dependencies]);

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen && !isSaving) {
					onClose(false);
				}
			}}
		>
			<DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Edit Dependencies
					</DialogTitle>
					<DialogDescription>
						Add or remove the engines and projects this{" "}
						{getDependencyTypeConfig(
							catalogType,
						).label.toLowerCase()}{" "}
						requires.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 overflow-y-auto pr-1">
					<p className="font-medium text-sm">Linked Dependencies</p>

					<div className="flex flex-col gap-2 rounded-md border p-2">
						<Tabs
							value={source}
							onValueChange={(value) => {
								setSource(
									value === "PROJECT" ? "PROJECT" : "ENGINE",
								);
								setTypeFilter(ALL_TYPES);
							}}
						>
							<TabsList className="w-full">
								<TabsTrigger value="ENGINE" className="flex-1">
									Engines
								</TabsTrigger>
								<TabsTrigger value="PROJECT" className="flex-1">
									Projects
								</TabsTrigger>
							</TabsList>
						</Tabs>

						<div className="flex flex-col gap-2 sm:flex-row">
							<Select
								value={typeFilter}
								onValueChange={setTypeFilter}
							>
								<SelectTrigger
									className="w-full sm:w-44"
									aria-label="Filter by type"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL_TYPES}>
										All types
									</SelectItem>
									{sourceTypes.map((type) => (
										<SelectItem key={type} value={type}>
											{
												getDependencyTypeConfig(type)
													.label
											}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<InputGroup className="flex-1">
								<InputGroupAddon>
									<Search
										className="size-4"
										aria-hidden="true"
									/>
								</InputGroupAddon>
								<InputGroupInput
									placeholder={`Search ${sourceLabel}...`}
									aria-label={`Search ${sourceLabel}`}
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
							</InputGroup>
						</div>

						<div
							className="h-[300px] overflow-y-auto"
							onScroll={handleScroll}
						>
							{isLoading && options.length === 0 ? (
								<div className="flex h-[300px] items-center justify-center">
									<Spinner />
								</div>
							) : options.length === 0 ? (
								<div className="flex h-[300px] items-center justify-center">
									<p className="text-muted-foreground text-sm">
										No {sourceLabel} found.
									</p>
								</div>
							) : (
								<div className="flex flex-col gap-0.5">
									{options.map((option) => {
										const isSelected = selectedDeps.some(
											(selected) =>
												selected.catalog_id ===
												option.catalog_id,
										);
										return (
											<button
												type="button"
												key={option.catalog_id}
												onClick={() =>
													toggleDependency(option)
												}
												aria-pressed={isSelected}
												className="flex w-full items-center justify-between gap-3 rounded-md p-2 text-left hover:bg-muted/50"
											>
												<div className="flex min-w-0 items-center gap-3">
													{renderDependencyIcon(
														option,
														"size-8",
														"text-xs",
													)}
													<div className="flex min-w-0 flex-col">
														<span className="truncate font-medium text-sm">
															{
																option.catalog_name
															}
														</span>
														<span className="truncate text-muted-foreground text-xs">
															{
																getDependencyTypeConfig(
																	option.catalog_type,
																).label
															}{" "}
															· ID:{" "}
															{option.catalog_id}
														</span>
													</div>
												</div>
												{isSelected ? (
													<Check
														className="size-4 shrink-0 text-primary"
														aria-hidden="true"
													/>
												) : null}
											</button>
										);
									})}
									{isLoading ? (
										<div className="flex items-center justify-center py-2">
											<Spinner />
										</div>
									) : null}
								</div>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<p className="font-medium text-sm">Selected</p>
							<Badge variant="outline">
								{selectedDeps.length}
							</Badge>
						</div>
						{selectedDeps.length === 0 ? (
							<div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground text-sm">
								No dependencies selected yet.
							</div>
						) : (
							<div className="space-y-3">
								{selectedDeps.map((dep) => (
									<div
										key={dep.catalog_id}
										className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border p-3"
									>
										{renderDependencyIcon(
											dep,
											"size-12 rounded-lg",
											"text-sm",
										)}
										<div className="min-w-0">
											<p className="truncate font-medium text-sm">
												{dep.catalog_name}
											</p>
											<div className="flex items-center gap-1">
												<p className="truncate text-muted-foreground text-xs">
													ID: {dep.catalog_id}
												</p>
												<Tooltip
													disableHoverableContent={
														false
													}
												>
													<TooltipTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="size-6 shrink-0"
															onClick={() =>
																handleCopyId(
																	dep.catalog_id,
																)
															}
															aria-label="Copy ID"
														>
															{copiedId ===
															dep.catalog_id ? (
																<Check className="size-3 text-success" />
															) : (
																<Copy className="size-3" />
															)}
														</Button>
													</TooltipTrigger>
													<TooltipContent
														sideOffset={4}
														className="max-w-xs break-words"
													>
														Copy ID
													</TooltipContent>
												</Tooltip>
											</div>
										</div>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() =>
												handleRemoveDependency(
													dep.catalog_id,
												)
											}
											disabled={isSaving}
											aria-label={`Remove ${dep.catalog_name}`}
										>
											<X className="size-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				<DialogFooter className="flex items-center justify-end gap-2">
					<Button
						variant="outline"
						onClick={() => onClose(false)}
						disabled={isSaving}
					>
						Cancel
					</Button>
					<Button
						onClick={handleUpdateDependencies}
						disabled={isSaving}
					>
						{isSaving ? (
							<span className="flex items-center gap-2">
								<Spinner className="size-4" />
								Saving...
							</span>
						) : (
							"Save"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
