import {
	BrainIcon,
	CheckIcon,
	DatabaseIcon,
	HardDriveIcon,
	LayersIcon,
	SearchIcon,
	ShieldIcon,
	SquareFunctionIcon,
	XIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Engine, ProjectDependency } from "@semoss/shared";
import { EngineSubtypeIcon } from "@semoss/shared";
import {
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
	ScrollArea,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { useProject, useRootStore } from "@/hooks";
import { isProjectType } from "@/utility/catalog";

/** Display metadata for one engine category card. */
interface CategoryMeta {
	/** Card title. */
	label: string;
	/** One-line description under the title. */
	blurb: string;
	/** Empty-state line when nothing of this category is selected. */
	empty: string;
	/** Icon rendered in the card's tile. */
	icon: ComponentType<{ className?: string }>;
}

/** Card copy and icons per engine category. */
const CATEGORY_META: Record<string, CategoryMeta> = {
	MODEL: {
		label: "Models",
		blurb: "Language and embedding models",
		empty: "No models selected",
		icon: BrainIcon,
	},
	DATABASE: {
		label: "Databases",
		blurb: "Relational and document databases",
		empty: "No databases selected",
		icon: DatabaseIcon,
	},
	STORAGE: {
		label: "Storage",
		blurb: "File and object storage",
		empty: "No storage engines selected",
		icon: HardDriveIcon,
	},
	VECTOR: {
		label: "Vector Databases",
		blurb: "Embedding and similarity search",
		empty: "No vector databases selected",
		icon: LayersIcon,
	},
	FUNCTION: {
		label: "Functions",
		blurb: "Reusable functions the agent can call",
		empty: "No functions selected",
		icon: SquareFunctionIcon,
	},
	GUARDRAIL: {
		label: "Guardrails",
		blurb: "Safety and policy checks",
		empty: "No guardrails selected",
		icon: ShieldIcon,
	},
};

/** Engine categories always shown, in display order. */
const PRIMARY_CATEGORIES = ["MODEL", "DATABASE", "STORAGE", "VECTOR"];

/** Engine categories shown only when the project depends on one. */
const EXTRA_CATEGORIES = ["FUNCTION", "GUARDRAIL"];

/** Rows fetched per search in the manage dialog. */
const MANAGE_FETCH_LIMIT = 50;

/**
 * The SetProjectDependencies payload entry for a dependency — project-kind
 * dependencies are always typed "PROJECT" on the wire.
 *
 * @name toDependencyPayload
 * @param dependency - The dependency to serialize.
 * @return The {id, type} wire entry.
 */
const toDependencyPayload = (
	dependency: Pick<ProjectDependency, "engine_id" | "engine_type">,
): { id: string; type: string } => ({
	id: dependency.engine_id,
	type: isProjectType(dependency.engine_type)
		? "PROJECT"
		: dependency.engine_type,
});

interface ManageEnginesDialogProps {
	/** Engine category being managed */
	category: string;
	/** Project whose dependencies are edited */
	appId: string;
	/** The project's current dependencies (all kinds) */
	dependencies: ProjectDependency[];
	/** Called on close; true when a save succeeded */
	onClose: (saved: boolean) => void;
}

/**
 * Category-scoped engine picker: searches the user's engines of one category,
 * toggles selections, and saves the project's dependency list with every
 * other category (and project-kind dependency) preserved. The backend
 * refreshes the agent's engine context from the saved list.
 *
 * @name ManageEnginesDialog
 * @param category - Engine category being managed.
 * @param appId - Project whose dependencies are edited.
 * @param dependencies - The project's current dependencies.
 * @param onClose - Called on close; true when a save succeeded.
 * @return The manage dialog.
 */
const ManageEnginesDialog = ({
	category,
	appId,
	dependencies,
	onClose,
}: ManageEnginesDialogProps) => {
	const { configStore } = useRootStore();
	const meta = CATEGORY_META[category];

	const [search, setSearch] = useState("");
	const [options, setOptions] = useState<ProjectDependency[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(
		() =>
			new Set(
				dependencies
					.filter(
						(dependency) =>
							(dependency.engine_type ?? "").toUpperCase() ===
							category,
					)
					.map((dependency) => dependency.engine_id),
			),
	);

	// Debounced category-scoped engine search.
	useEffect(() => {
		let cancelled = false;
		setIsLoading(true);
		const timer = window.setTimeout(async () => {
			try {
				const trimmed = search.trim();
				const filterClause = trimmed
					? `filterWord=${JSON.stringify(trimmed)}, `
					: "";
				const response = await configStore.runPixel<[Engine[]]>(
					`MyEngines(${filterClause}engineTypes=${JSON.stringify([category])}, limit=[${MANAGE_FETCH_LIMIT}], offset=[0]);`,
				);
				if (response.errors.length > 0) {
					throw new Error(response.errors.join(""));
				}
				if (cancelled) return;
				setOptions(
					response.pixelReturn[0].output.map((engine) => ({
						engine_id: engine.engine_id,
						engine_name:
							engine.engine_display_name || engine.engine_name,
						engine_type: engine.engine_type,
						engine_subtype: engine.engine_subtype,
					})),
				);
			} catch (error) {
				if (!cancelled) {
					toast.error(
						error instanceof Error
							? error.message
							: "Failed to load engines",
					);
				}
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}, 250);
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [category, configStore, search]);

	const toggleEngine = (engineId: string) => {
		setSelectedIds((current) => {
			const next = new Set(current);
			if (next.has(engineId)) {
				next.delete(engineId);
			} else {
				next.add(engineId);
			}
			return next;
		});
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			// Everything that is not this category is preserved verbatim.
			const others = dependencies.filter(
				(dependency) =>
					(dependency.engine_type ?? "").toUpperCase() !== category,
			);
			const payload = [
				...others.map(toDependencyPayload),
				...[...selectedIds].map((id) => ({ id, type: category })),
			];
			const response = await configStore.runPixel<string[]>(
				`SetProjectDependencies(project="${appId}", dependencies=${JSON.stringify(payload)})`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}
			toast.success(`${meta.label} updated`);
			onClose(true);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update engines",
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose(false)}>
			<DialogContent className="flex max-h-[70vh] flex-col sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Manage {meta.label.toLowerCase()}</DialogTitle>
					<DialogDescription>{meta.blurb}.</DialogDescription>
				</DialogHeader>

				<InputGroup>
					<InputGroupAddon>
						<SearchIcon className="size-4" />
					</InputGroupAddon>
					<InputGroupInput
						placeholder={`Search ${meta.label.toLowerCase()}…`}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</InputGroup>

				<div className="min-h-40 flex-1 overflow-y-auto rounded-md border border-border">
					{isLoading ? (
						<div className="flex h-40 items-center justify-center">
							<Spinner className="size-5" />
						</div>
					) : options.length === 0 ? (
						<p className="p-4 text-center text-muted-foreground text-sm">
							No {meta.label.toLowerCase()} found.
						</p>
					) : (
						<ul className="flex flex-col p-1">
							{options.map((option) => {
								const selected = selectedIds.has(
									option.engine_id,
								);
								return (
									<li key={option.engine_id}>
										<button
											type="button"
											className={cn(
												"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
												selected && "bg-accent/50",
											)}
											onClick={() =>
												toggleEngine(option.engine_id)
											}
										>
											<span className="flex size-5 shrink-0 items-center justify-center">
												<EngineSubtypeIcon
													engineType={
														option.engine_type
													}
													engineSubtype={
														option.engine_subtype
													}
													alt={option.engine_name}
													className="size-full object-contain"
												/>
											</span>
											<span className="min-w-0 flex-1 truncate">
												{option.engine_name}
											</span>
											{selected ? (
												<CheckIcon className="size-4 shrink-0 text-primary" />
											) : null}
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>

				<DialogFooter className="items-center">
					<span className="me-auto text-muted-foreground text-xs">
						{selectedIds.size} selected
					</span>
					<Button
						type="button"
						variant="outline"
						onClick={() => onClose(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={isSaving}
						onClick={() => void handleSave()}
					>
						{isSaving ? <Spinner className="size-4" /> : null}
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

interface EngineCategoryCardProps {
	/** Engine category the card shows */
	category: string;
	/** Selected engines of this category */
	engines: ProjectDependency[];
	/** Whether the user can manage/remove engines */
	canEdit: boolean;
	/** Opens the manage dialog for this category */
	onManage: () => void;
	/** Removes one engine from the project's dependencies */
	onRemove: (engine: ProjectDependency) => void;
	/** Disables the remove buttons while a removal is saving */
	isRemoving: boolean;
}

/**
 * One engine category card: icon tile, title and description, a Manage
 * action, and the selected engines as removable chips (or an italic
 * empty-state line).
 *
 * @name EngineCategoryCard
 * @param category - Engine category the card shows.
 * @param engines - Selected engines of this category.
 * @param canEdit - Whether the user can manage/remove engines.
 * @param onManage - Opens the manage dialog for this category.
 * @param onRemove - Removes one engine from the project's dependencies.
 * @param isRemoving - Disables the remove buttons while a removal is saving.
 * @return The category card.
 */
const EngineCategoryCard = ({
	category,
	engines,
	canEdit,
	onManage,
	onRemove,
	isRemoving,
}: EngineCategoryCardProps) => {
	const meta = CATEGORY_META[category];
	const Icon = meta.icon;

	return (
		<section className="rounded-xl border border-border bg-card p-3 shadow-xs">
			<div className="flex items-center gap-3">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
					<Icon className="size-5" />
				</span>
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-sm">{meta.label}</p>
					<p className="text-muted-foreground text-xs">
						{meta.blurb}
					</p>
				</div>
				{canEdit ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onManage}
					>
						Manage
					</Button>
				) : null}
			</div>

			<div className="mt-3">
				{engines.length === 0 ? (
					<p className="text-muted-foreground text-sm italic">
						{meta.empty}
					</p>
				) : (
					<ul className="flex flex-wrap gap-1.5">
						{engines.map((engine) => (
							<li
								key={engine.engine_id}
								className="flex items-center gap-1.5 rounded-full border border-border bg-background py-1 ps-1.5 pe-2 text-xs"
								title={engine.engine_name}
							>
								<span className="flex size-4 shrink-0 items-center justify-center">
									<EngineSubtypeIcon
										engineType={engine.engine_type}
										engineSubtype={engine.engine_subtype}
										alt={engine.engine_name}
										className="size-full object-contain"
									/>
								</span>
								<span className="max-w-40 truncate">
									{engine.engine_name}
								</span>
								{canEdit ? (
									<button
										type="button"
										disabled={isRemoving}
										aria-label={`Remove ${engine.engine_name}`}
										className="shrink-0 text-muted-foreground hover:text-foreground"
										onClick={() => onRemove(engine)}
									>
										<XIcon className="size-3" />
									</button>
								) : null}
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
};

/**
 * The "Available engines" workbench panel: one card per engine category with
 * the selected engines as removable chips and a category-scoped Manage
 * dialog — the engines the agent can use when building and running the app.
 * Saves go through SetProjectDependencies (preserving project-kind and
 * other-category dependencies), which also refreshes the agent's engine
 * context on the backend.
 *
 * @name ProjectEnginesPanel
 * @return The available-engines panel.
 */
export const ProjectEnginesPanel = () => {
	const { project, dependencies, permission, refresh } = useProject();
	const { configStore } = useRootStore();
	const [manageCategory, setManageCategory] = useState<string | null>(null);
	const [isRemoving, setIsRemoving] = useState(false);
	const canEdit = permission === "OWNER" || permission === "EDIT";

	const buckets = useMemo(() => {
		const next = new Map<string, ProjectDependency[]>();
		for (const category of [...PRIMARY_CATEGORIES, ...EXTRA_CATEGORIES]) {
			next.set(category, []);
		}
		for (const dependency of dependencies) {
			const type = (dependency.engine_type ?? "").toUpperCase();
			next.get(type)?.push(dependency);
		}
		return next;
	}, [dependencies]);

	const categories = [
		...PRIMARY_CATEGORIES,
		...EXTRA_CATEGORIES.filter(
			(category) => (buckets.get(category) ?? []).length > 0,
		),
	];

	const removeEngine = async (engine: ProjectDependency) => {
		setIsRemoving(true);
		try {
			const payload = dependencies
				.filter(
					(dependency) => dependency.engine_id !== engine.engine_id,
				)
				.map(toDependencyPayload);
			const response = await configStore.runPixel<string[]>(
				`SetProjectDependencies(project="${project.project_id}", dependencies=${JSON.stringify(payload)})`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}
			toast.success(`Removed ${engine.engine_name}`);
			refresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to remove engine",
			);
		} finally {
			setIsRemoving(false);
		}
	};

	return (
		<div className="flex h-full min-h-0 w-full flex-col bg-background">
			<ScrollArea className="min-h-0 flex-1">
				<div className="flex flex-col gap-3 p-4">
					<div>
						<p className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
							Engines
						</p>
						<h2 className="mt-1 font-semibold text-lg">
							Available engines
						</h2>
						<p className="mt-1 text-muted-foreground text-sm">
							Pre-select the engines you want the agent to
							incorporate. Mention them in your prompt so the
							agent uses them.
						</p>
					</div>

					{categories.map((category) => (
						<EngineCategoryCard
							key={category}
							category={category}
							engines={buckets.get(category) ?? []}
							canEdit={canEdit}
							isRemoving={isRemoving}
							onManage={() => setManageCategory(category)}
							onRemove={(engine) => void removeEngine(engine)}
						/>
					))}
				</div>
			</ScrollArea>

			{manageCategory ? (
				<ManageEnginesDialog
					category={manageCategory}
					appId={project.project_id}
					dependencies={dependencies}
					onClose={(saved) => {
						if (saved) refresh();
						setManageCategory(null);
					}}
				/>
			) : null}
		</div>
	);
};
