import { CheckIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useSessionInsight } from "@semoss/sdk/react";
import type {
	CatalogDependency,
	CatalogDependencyRow,
	CatalogType,
	Engine,
} from "@semoss/shared";
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
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	CATEGORY_META,
	getDependencyKey,
	getDependencyRoleLabel,
	toCatalogDependencyPayload,
} from "./catalog-dependency";

/** Rows fetched per search in the manage dialog. */
const MANAGE_FETCH_LIMIT = 50;

/** An engine the picker offers. */
type EngineOption = Pick<
	CatalogDependency,
	"catalog_id" | "catalog_name" | "catalog_type" | "catalog_subtype"
>;

interface ManageEnginesDialogProps {
	/** Engine category being managed */
	category: Engine["engine_type"];
	/** The owner whose dependencies are edited */
	catalogId: string;
	/** The owner's specific type */
	catalogType: CatalogType;
	/** The owner's current direct dependencies (all kinds, automatic too) */
	dependencies: CatalogDependencyRow[];
	/** Called on close; true when a save succeeded */
	onClose: (saved: boolean) => void;
}

/**
 * Category-scoped engine picker: searches the user's engines of one category,
 * toggles manual selections, and saves the owner's manual dependency list
 * with every other category (and project-kind dependency) preserved, each
 * with its name and description. Automatic engines of the category are
 * listed read-only and never sent; the backend keeps them. The backend
 * refreshes the agent's engine context from the saved list.
 *
 * @name ManageEnginesDialog
 * @param category - Engine category being managed.
 * @param catalogId - The owner whose dependencies are edited.
 * @param catalogType - The owner's specific type.
 * @param dependencies - The owner's current dependencies.
 * @param onClose - Called on close; true when a save succeeded.
 * @return The manage dialog.
 */
export const ManageEnginesDialog = ({
	category,
	catalogId,
	catalogType,
	dependencies,
	onClose,
}: ManageEnginesDialogProps) => {
	const { run: runPixel } = useSessionInsight();
	const meta = CATEGORY_META[category];

	const [search, setSearch] = useState("");
	const [options, setOptions] = useState<EngineOption[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const manualDependencies = dependencies.filter(
		(dependency) => !dependency.is_automatic,
	);
	const automaticEngines = dependencies.filter(
		(dependency) =>
			dependency.is_automatic && dependency.catalog_type === category,
	);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(
		() =>
			new Set(
				dependencies
					.filter(
						(dependency) =>
							!dependency.is_automatic &&
							dependency.catalog_type === category,
					)
					.map((dependency) => dependency.catalog_id),
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
				const response = await runPixel<[Engine[]]>(
					`MyEngines(${filterClause}engineTypes=${JSON.stringify([category])}, limit=[${MANAGE_FETCH_LIMIT}], offset=[0]);`,
				);
				if (response.errors.length > 0) {
					throw new Error(response.errors.join(""));
				}
				if (cancelled) return;
				setOptions(
					response.pixelReturn[0].output.map((engine) => ({
						catalog_id: engine.engine_id,
						catalog_name:
							engine.engine_display_name || engine.engine_name,
						catalog_type: engine.engine_type,
						catalog_subtype: engine.engine_subtype,
					})),
				);
			} catch (error) {
				if (!cancelled) {
					toast.error(
						getErrorMessage(error, "Failed to load engines"),
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
	}, [category, runPixel, search]);

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
			// Only manual rows are sent. Every one that is not this category
			// is preserved verbatim, and a kept one keeps its name and
			// description.
			const others = manualDependencies.filter(
				(dependency) => dependency.catalog_type !== category,
			);
			const payload = [
				...others.map(toCatalogDependencyPayload),
				...[...selectedIds].map((id) =>
					toCatalogDependencyPayload(
						manualDependencies.find(
							(dependency) => dependency.catalog_id === id,
						) ?? { catalog_id: id, catalog_type: category },
					),
				),
			];
			const response = await runPixel<[unknown]>(
				`SetCatalogDependencies(catalogId="${catalogId}", catalogType="${catalogType}", dependencies=${JSON.stringify(payload)});`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}
			toast.success(`${meta.label} updated`);
			onClose(true);
		} catch (error) {
			toast.error(getErrorMessage(error, "Failed to update engines"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => !open && !isSaving && onClose(false)}
		>
			<DialogContent className="flex max-h-[70vh] flex-col sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Manage {meta.label.toLowerCase()}
					</DialogTitle>
					<DialogDescription>{meta.blurb}.</DialogDescription>
				</DialogHeader>

				<InputGroup>
					<InputGroupAddon>
						<SearchIcon className="size-4" />
					</InputGroupAddon>
					<InputGroupInput
						placeholder={`Search ${meta.label.toLowerCase()}…`}
						aria-label={`Search ${meta.label.toLowerCase()}`}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</InputGroup>

				{automaticEngines.length > 0 ? (
					<div className="flex flex-col gap-1.5">
						<p className="text-muted-foreground text-xs">
							Set by the configuration, and kept as they are:
						</p>
						<ul className="flex flex-wrap gap-1.5">
							{automaticEngines.map((engine) => (
								<li
									key={getDependencyKey(engine)}
									className="flex items-center gap-1.5 rounded-full border border-border bg-muted py-1 ps-1.5 pe-2 text-xs"
								>
									<span className="max-w-40 truncate">
										{engine.catalog_name}
									</span>
									<span className="text-muted-foreground">
										{getDependencyRoleLabel(engine.role)}
									</span>
								</li>
							))}
						</ul>
					</div>
				) : null}

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
									option.catalog_id,
								);
								return (
									<li key={option.catalog_id}>
										<button
											type="button"
											className={cn(
												"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
												selected && "bg-accent/50",
											)}
											aria-pressed={selected}
											onClick={() =>
												toggleEngine(option.catalog_id)
											}
										>
											<span className="flex size-5 shrink-0 items-center justify-center">
												<EngineSubtypeIcon
													engineType={
														option.catalog_type
													}
													engineSubtype={
														option.catalog_subtype
													}
													alt={option.catalog_name}
													className="size-full object-contain"
												/>
											</span>
											<span className="min-w-0 flex-1 truncate">
												{option.catalog_name}
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
						disabled={isSaving}
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
