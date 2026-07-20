import { Check, Copy, Search, X } from "lucide-react";
import { type UIEvent, useEffect, useState } from "react";
import { useDebouncedValue, useIteratorPixel } from "@semoss/sdk/react";
import {
	AppCatalogAvatar,
	type Engine,
	EngineSubtypeIcon,
	type Project,
	type ProjectDependency,
} from "@semoss/shared";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import { isProjectType } from "@/utility/catalog";

interface EditProjectDependenciesDialogProps {
	open: boolean;
	onClose: (refresh: boolean) => void;
	appId: string;
	dependencies: ProjectDependency[];
}

/** Which reactor populates the dropdown. */
type DependencySource = "ENGINE" | "APP";

/** Page size for the paginated reactors. */
const PAGE_LIMIT = 25;

/**
 * Renders a dialog to edit dependencies for a project.
 */
export const EditProjectDependenciesDialog = ({
	open,
	onClose,
	appId,
	dependencies,
}: EditProjectDependenciesDialogProps) => {
	const renderDependencyIcon = (
		dep: ProjectDependency,
		sizeClass: string,
		textClass: string,
	) => {
		if (isProjectType(dep.engine_type)) {
			return (
				<AppCatalogAvatar
					name={dep.engine_name}
					className={`shrink-0 rounded ${sizeClass} ${textClass}`}
				/>
			);
		}
		return (
			<EngineSubtypeIcon
				engineType={dep.engine_type}
				engineSubtype={dep.engine_subtype}
				alt={dep.engine_name}
				className={`shrink-0 object-contain ${sizeClass}`}
			/>
		);
	};

	/**
	 * State
	 */
	const [selectedDeps, setSelectedDeps] = useState<ProjectDependency[]>([]);
	const [search, setSearch] = useState<string>("");
	const [source, setSource] = useState<DependencySource>("ENGINE");
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

	/**
	 * Library Hooks
	 *
	 * Engines and projects are fetched from their own paginated reactors
	 * (MyEngines / MyProjects), each with its own iterator so they paginate
	 * independently and stably. Only the active source runs — the inactive one
	 * is passed an empty pixel.
	 */
	const { configStore } = useRootStore();
	// Coalesce to "" so the initial undefined -> "" debounce transition doesn't
	// reset the iterator (which clears its data but can't refetch an unchanged
	// query), which would blank the list until the source is toggled.
	const debouncedSearch = useDebouncedValue(search) ?? "";
	const filterClause = debouncedSearch
		? `filterWord=${JSON.stringify(debouncedSearch)}, `
		: "";

	const getEngines = useIteratorPixel<Engine[], ProjectDependency>(
		(limit, offset) =>
			source === "ENGINE"
				? `MyEngines(${filterClause}limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length < PAGE_LIMIT ? -1 : Infinity),
		(response) =>
			response.map((eng) => ({
				engine_id: eng.engine_id,
				engine_name: eng.engine_display_name || eng.engine_name,
				engine_type: eng.engine_type,
				engine_subtype: eng.engine_subtype,
			})),
		{ limit: PAGE_LIMIT },
		[debouncedSearch, source],
	);

	const getProjects = useIteratorPixel<Project[], ProjectDependency>(
		(limit, offset) =>
			source === "APP"
				? `MyProjects(${filterClause}projectType=["CODE", "BLOCKS"], limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length < PAGE_LIMIT ? -1 : Infinity),
		(response) =>
			response.map((proj) => ({
				engine_id: proj.project_id,
				engine_name: proj.project_display_name || proj.project_name,
				engine_type: proj.project_type,
			})),
		{ limit: PAGE_LIMIT },
		[debouncedSearch, source],
	);

	const activeSource = source === "ENGINE" ? getEngines : getProjects;
	const options = activeSource.data;
	const isLoading = activeSource.isLoading;

	/**
	 * Advance the active source when the list is scrolled near the bottom.
	 * A native overflow container is used (instead of a Radix ScrollArea) so
	 * mouse-wheel scrolling works reliably inside the popover.
	 */
	const handleScroll = (event: UIEvent<HTMLDivElement>) => {
		const el = event.currentTarget;
		const nearBottom =
			el.scrollHeight - el.scrollTop - el.clientHeight < 80;
		if (nearBottom && !isLoading && activeSource.hasMore) {
			activeSource.next();
		}
	};

	/**
	 * Functions
	 */
	const handleUpdateDependencies = async () => {
		try {
			setIsSaving(true);

			const response = await configStore.runPixel<string[]>(
				`SetProjectDependencies(project="${appId}", dependencies=${JSON.stringify(
					selectedDeps.map((dep) => ({
						id: dep.engine_id,
						type: isProjectType(dep.engine_type)
							? "PROJECT"
							: dep.engine_type,
					})),
				)})`,
			);

			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}

			toast.success("Successfully updated dependencies");
			onClose(true);
		} catch (e) {
			toast.error(
				e instanceof Error
					? e.message
					: "Failed to update dependencies",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleRemoveDependency = (id: string) => {
		const newDependencies = selectedDeps.filter(
			(dep) => dep.engine_id !== id,
		);
		setSelectedDeps(newDependencies);
	};

	const toggleDependency = (dep: ProjectDependency) => {
		const isSelected = selectedDeps.some(
			(selected) => selected.engine_id === dep.engine_id,
		);
		if (isSelected) {
			setSelectedDeps((prev) =>
				prev.filter((selected) => selected.engine_id !== dep.engine_id),
			);
			return;
		}
		setSelectedDeps((prev) => [...prev, dep]);
	};

	const renderOption = (option: ProjectDependency) => {
		const isSelected = selectedDeps.some(
			(selected) => selected.engine_id === option.engine_id,
		);
		return (
			<button
				type="button"
				key={option.engine_id}
				onClick={() => toggleDependency(option)}
				className="flex w-full items-center justify-between gap-3 rounded-md p-2 text-left hover:bg-muted/50"
			>
				<div className="flex min-w-0 items-center gap-3">
					{renderDependencyIcon(option, "size-8", "text-xs")}
					<div className="flex min-w-0 flex-col">
						<span className="truncate font-medium text-sm">
							{option.engine_name}
						</span>
						<span className="truncate text-muted-foreground text-xs">
							ID: {option.engine_id}
						</span>
					</div>
				</div>
				{isSelected && (
					<Check className="size-4 shrink-0 text-primary" />
				)}
			</button>
		);
	};

	/**
	 * Effects
	 */
	useEffect(() => {
		// Reset state when modal opens
		if (open) {
			setSelectedDeps(dependencies);
			setSearch("");
			setSource("ENGINE");
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
					<DialogTitle>Edit Project Dependencies</DialogTitle>
					<DialogDescription>
						Add or remove engines and apps required by this project.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 overflow-y-auto pr-1">
					<p className="font-medium text-sm">Linked Dependencies</p>

					<div className="flex flex-col gap-2 rounded-md border p-2">
						<Tabs
							value={source}
							onValueChange={(value) =>
								setSource(value as DependencySource)
							}
						>
							<TabsList className="w-full">
								<TabsTrigger value="ENGINE" className="flex-1">
									Engines
								</TabsTrigger>
								<TabsTrigger value="APP" className="flex-1">
									Apps
								</TabsTrigger>
							</TabsList>
						</Tabs>

						<InputGroup>
							<InputGroupAddon>
								<Search className="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								placeholder={
									source === "ENGINE"
										? "Search engines..."
										: "Search apps..."
								}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</InputGroup>

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
										{source === "ENGINE"
											? "No engines found."
											: "No apps found."}
									</p>
								</div>
							) : (
								<div className="flex flex-col gap-0.5">
									{options.map(renderOption)}
									{isLoading && (
										<div className="flex items-center justify-center py-2">
											<Spinner />
										</div>
									)}
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
								{selectedDeps.map((dep, idx: number) => {
									return (
										<div
											key={`${dep.engine_id}-${idx}`}
											className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border p-3"
										>
											{renderDependencyIcon(
												dep,
												"size-12 rounded-lg",
												"text-sm",
											)}
											<div className="min-w-0">
												<p className="truncate font-medium text-sm">
													{dep.engine_name}
												</p>
												<div className="flex items-center gap-1">
													<p className="truncate text-muted-foreground text-xs">
														ID: {dep.engine_id}
													</p>
													<Button
														variant="ghost"
														size="icon"
														className="size-5 shrink-0"
														onClick={() =>
															handleCopyId(
																dep.engine_id,
															)
														}
														title="Copy ID"
														aria-label="Copy ID"
													>
														{copiedId ===
														dep.engine_id ? (
															<Check className="size-3 text-emerald-500" />
														) : (
															<Copy className="size-3" />
														)}
													</Button>
												</div>
											</div>
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() =>
													handleRemoveDependency(
														dep.engine_id,
													)
												}
												disabled={isSaving}
											>
												<X className="size-4" />
											</Button>
										</div>
									);
								})}
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
