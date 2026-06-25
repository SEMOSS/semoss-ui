import { Check, Copy, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebouncedValue, useIteratorPixel } from "@semoss/sdk/react";
import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
import {
	Button,
	Dialog,
	DialogContent,
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
import {
	type modelledDependency,
	SetProjectDependencies,
} from "./app-details.utility";

interface EditDependenciesModalProps {
	isOpen: boolean;
	onClose: (refresh: boolean) => void;
	appId: string;
	currentDependencies: modelledDependency[];
}

interface MyEngineRow {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
	engine_type: string;
	engine_subtype?: string;
}

interface MyProjectRow {
	project_id: string;
	project_name: string;
	project_display_name?: string;
}

interface Dependency {
	id: string;
	name: string;
	type: string;
	subtype?: string;
}

/** Which reactor populates the dropdown. */
type DependencySource = "ENGINE" | "APP";

/** Page size for the paginated reactors. */
const PAGE_LIMIT = 25;

/**
 * Renders a dependency's icon: the app's generated avatar for projects,
 * otherwise the shared engine subtype icon (matches the app/engine catalogs
 * and team selectors).
 */
const DependencyIcon = ({
	type,
	subtype,
	name,
	sizeClass,
	textClass,
}: {
	type: string;
	subtype?: string;
	name: string;
	sizeClass: string;
	textClass: string;
}) => {
	if (type === "PROJECT") {
		return (
			<AppCatalogAvatar
				name={name}
				className={`shrink-0 rounded ${sizeClass} ${textClass}`}
			/>
		);
	}
	return (
		<EngineSubtypeIcon
			engineType={type}
			engineSubtype={subtype}
			alt={name}
			className={`shrink-0 object-contain ${sizeClass}`}
		/>
	);
};

/**
 * Renders a modal to edit dependencies for an application.
 *
 * @component
 */
export const EditDependenciesModal = ({
	isOpen,
	onClose,
	appId,
	currentDependencies,
}: EditDependenciesModalProps) => {
	/**
	 * State
	 */
	const [selectedDeps, setSelectedDeps] =
		useState<Dependency[]>(currentDependencies);
	const [search, setSearch] = useState<string>("");
	const [source, setSource] = useState<DependencySource>("ENGINE");
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const handleCopyId = (id: string) => {
		navigator.clipboard.writeText(id).then(() => {
			setCopiedId(id);
			setTimeout(() => {
				setCopiedId((current) => (current === id ? null : current));
			}, 1500);
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

	const getEngines = useIteratorPixel<MyEngineRow[], Dependency>(
		(limit, offset) =>
			source === "ENGINE"
				? `MyEngines(${filterClause}limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length < PAGE_LIMIT ? -1 : Infinity),
		(response) =>
			response.map((eng) => ({
				id: eng.engine_id,
				name: eng.engine_display_name || eng.engine_name,
				type: eng.engine_type,
				subtype: eng.engine_subtype,
			})),
		{ limit: PAGE_LIMIT },
		[debouncedSearch, source],
	);

	const getProjects = useIteratorPixel<MyProjectRow[], Dependency>(
		(limit, offset) =>
			source === "APP"
				? `MyProjects(${filterClause}limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length < PAGE_LIMIT ? -1 : Infinity),
		(response) =>
			response.map((proj) => ({
				id: proj.project_id,
				name: proj.project_display_name || proj.project_name,
				type: "PROJECT",
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
	const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
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
		const res = await SetProjectDependencies(
			configStore,
			appId,
			selectedDeps.map((dep: modelledDependency) => ({
				id: dep.id,
				type: dep.type,
			})),
		);

		if (res.type === "success") {
			toast.success("Successfully updated dependencies");
			onClose(true);
		} else {
			toast.error(res.output);
		}
	};

	const handleRemoveDependency = (id: string) => {
		const newDependencies = selectedDeps.filter(
			(dep: modelledDependency) => dep.id !== id,
		);
		setSelectedDeps(newDependencies);
	};

	const toggleDependency = (dep: Dependency) => {
		const isSelected = selectedDeps.some(
			(selected) => selected.id === dep.id,
		);
		if (isSelected) {
			setSelectedDeps((prev) =>
				prev.filter((selected) => selected.id !== dep.id),
			);
			return;
		}
		setSelectedDeps((prev) => [...prev, dep]);
	};

	const renderOption = (option: Dependency) => {
		const isSelected = selectedDeps.some(
			(selected) => selected.id === option.id,
		);
		return (
			<button
				type="button"
				key={option.id}
				onClick={() => toggleDependency(option)}
				className="flex w-full items-center justify-between gap-3 rounded-md p-2 text-left hover:bg-muted/50"
			>
				<div className="flex min-w-0 items-center gap-3">
					<DependencyIcon
						type={option.type}
						subtype={option.subtype}
						name={option.name}
						sizeClass="size-8"
						textClass="text-xs"
					/>
					<div className="flex min-w-0 flex-col">
						<span className="truncate font-medium text-sm">
							{option.name}
						</span>
						<span className="truncate text-muted-foreground text-xs">
							ID: {option.id}
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
		if (isOpen) {
			setSelectedDeps(currentDependencies);
			setSearch("");
			setSource("ENGINE");
		}
	}, [isOpen, currentDependencies]);

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onClose(false);
				}
			}}
		>
			<DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Add and Edit Dependencies</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
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

					<div className="space-y-3">
						{selectedDeps.map((dep, idx: number) => {
							return (
								<div
									key={`${dep.id}-${idx}`}
									className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border p-3"
								>
									<DependencyIcon
										type={dep.type}
										subtype={dep.subtype}
										name={dep.name}
										sizeClass="size-12 rounded-lg"
										textClass="text-sm"
									/>
									<div className="min-w-0">
										<p className="truncate font-medium text-sm">
											{dep.name}
										</p>
										<div className="flex items-center gap-1">
											<p className="truncate text-muted-foreground text-xs">
												ID: {dep.id}
											</p>
											<Button
												variant="ghost"
												size="icon"
												className="size-5 shrink-0"
												onClick={() =>
													handleCopyId(dep.id)
												}
												title="Copy ID"
												aria-label="Copy ID"
											>
												{copiedId === dep.id ? (
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
											handleRemoveDependency(dep.id)
										}
									>
										<X className="size-4" />
									</Button>
								</div>
							);
						})}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onClose(false)}>
						Cancel
					</Button>
					<Button onClick={handleUpdateDependencies}>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
