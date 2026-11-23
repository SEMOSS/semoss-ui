import { CheckIcon, Lock, SearchIcon } from "lucide-react";
import { type UIEvent, useState } from "react";
import type { CatalogDependencyRow, CatalogType, Engine } from "@semoss/shared";
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
import { setCatalogDependencies } from "@/api/catalog-dependencies";
import {
	CATEGORY_META,
	getDependencyDisplayName,
	getDependencyKey,
	getDependencyRoleLabel,
	toCatalogDependencyPayload,
} from "./catalog-dependency";
import {
	type DependencyOption,
	getUniqueDependencyName,
} from "./catalog-dependency-draft";
import { useDependencyOptions } from "./use-dependency-options";

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
 * a page at a time as the list scrolls, toggles manual selections, and saves
 * the owner's manual dependency list with every other category (and
 * project-kind dependency) preserved, each with its name and description.
 * A name is required, so an engine picked here is named after itself, made
 * unique among the owner's other links; the Ontology tab renames it.
 * Automatic engines of the category are listed read-only and never sent; the
 * backend keeps them. The backend refreshes the agent's engine context from
 * the saved list.
 */
export const ManageEnginesDialog = ({
	category,
	catalogId,
	catalogType,
	dependencies,
	onClose,
}: ManageEnginesDialogProps) => {
	const meta = CATEGORY_META[category];
	const categoryLabel = meta.label.toLowerCase();

	const [search, setSearch] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const { options, isLoading, hasMore, error, next } = useDependencyOptions({
		catalogId,
		search,
		source: "ENGINE",
		typeFilter: category,
	});
	const manualDependencies = dependencies.filter(
		(dependency) => !dependency.is_automatic,
	);
	const automaticEngines = dependencies.filter(
		(dependency) =>
			dependency.is_automatic && dependency.catalog_type === category,
	);
	// the picked engines by id, each with the name a new one is named after
	const [selectedIds, setSelectedIds] = useState<ReadonlyMap<string, string>>(
		() =>
			new Map(
				manualDependencies
					.filter(
						(dependency) => dependency.catalog_type === category,
					)
					.map((dependency) => [
						dependency.catalog_id,
						getDependencyDisplayName(dependency),
					]),
			),
	);

	const toggleEngine = (engine: DependencyOption) => {
		setSelectedIds((current) => {
			const next = new Map(current);
			if (next.has(engine.catalog_id)) {
				next.delete(engine.catalog_id);
			} else {
				next.set(
					engine.catalog_id,
					engine.catalog_name || engine.catalog_id,
				);
			}
			return next;
		});
	};

	const handleScroll = (event: UIEvent<HTMLDivElement>): void => {
		const list = event.currentTarget;
		const isNearBottom =
			list.scrollHeight - list.scrollTop - list.clientHeight < 80;
		if (isNearBottom && !isLoading && hasMore) {
			next();
		}
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
			const kept = manualDependencies.filter(
				(dependency) =>
					dependency.catalog_type === category &&
					selectedIds.has(dependency.catalog_id),
			);
			// a new pick is named after itself, unique among the names kept
			const taken = [...others, ...kept].flatMap((dependency) => {
				const name = dependency.dependency_name?.trim().toLowerCase();
				return name ? [name] : [];
			});
			const added = [...selectedIds]
				.filter(([id]) => !kept.some((row) => row.catalog_id === id))
				.map(([id, baseName]) => {
					const name = getUniqueDependencyName(baseName, taken);
					taken.push(name.toLowerCase());
					return toCatalogDependencyPayload({
						catalog_id: id,
						catalog_type: category,
						dependency_name: name,
					});
				});
			await setCatalogDependencies(catalogId, catalogType, [
				...others.map(toCatalogDependencyPayload),
				...kept.map(toCatalogDependencyPayload),
				...added,
			]);
			toast.success(`${meta.label} updated`);
			onClose(true);
		} catch (saveError) {
			toast.error(getErrorMessage(saveError, "Failed to update engines"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog
			open
			onOpenChange={(open) => !open && !isSaving && onClose(false)}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Manage {categoryLabel}
					</DialogTitle>
					<DialogDescription>{meta.blurb}.</DialogDescription>
				</DialogHeader>

				<InputGroup>
					<InputGroupAddon>
						<SearchIcon className="size-4" aria-hidden="true" />
					</InputGroupAddon>
					<InputGroupInput
						placeholder={`Search ${categoryLabel}…`}
						aria-label={`Search ${categoryLabel}`}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</InputGroup>

				{automaticEngines.length > 0 ? (
					<div className="flex flex-col gap-1.5">
						<p className="flex items-center gap-1 text-muted-foreground text-xs">
							<Lock className="size-3" aria-hidden="true" />
							Automatic: set by the configuration, and kept as
							they are:
						</p>
						<ul className="flex flex-wrap gap-1.5">
							{automaticEngines.map((engine) => (
								<li
									key={getDependencyKey(engine)}
									className="flex items-center gap-1.5 rounded-full border border-border bg-muted py-1 ps-1.5 pe-2 text-xs"
								>
									<span className="max-w-40 truncate">
										{getDependencyDisplayName(engine)}
									</span>
									<span className="text-muted-foreground">
										{getDependencyRoleLabel(engine.role)}
									</span>
								</li>
							))}
						</ul>
					</div>
				) : null}

				<div
					className="max-h-96 min-h-40 overflow-y-auto rounded-md border border-border"
					onScroll={handleScroll}
				>
					{error ? (
						<p className="p-4 text-center text-destructive text-sm">
							{`Couldn't load ${categoryLabel}: ${error.message}`}
						</p>
					) : isLoading && options.length === 0 ? (
						<div className="flex h-40 items-center justify-center">
							<Spinner className="size-5" />
						</div>
					) : options.length === 0 ? (
						<p className="p-4 text-center text-muted-foreground text-sm">
							No {categoryLabel} found.
						</p>
					) : (
						<ul className="flex flex-col p-1">
							{options.map((option) => {
								const isSelected = selectedIds.has(
									option.catalog_id,
								);
								return (
									<li key={option.catalog_id}>
										<button
											type="button"
											className={cn(
												"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
												isSelected && "bg-accent/50",
											)}
											aria-pressed={isSelected}
											onClick={() => toggleEngine(option)}
										>
											<span className="flex size-5 shrink-0 items-center justify-center">
												<EngineSubtypeIcon
													engineType={
														option.catalog_type
													}
													engineSubtype={
														option.catalog_subtype
													}
													className="size-full object-contain"
												/>
											</span>
											<span className="min-w-0 flex-1 truncate">
												{option.catalog_name}
											</span>
											{isSelected ? (
												<CheckIcon
													className="size-4 shrink-0 text-primary"
													aria-hidden="true"
												/>
											) : null}
										</button>
									</li>
								);
							})}
						</ul>
					)}
					{isLoading && options.length > 0 ? (
						<div className="flex justify-center py-2">
							<Spinner className="size-4" />
						</div>
					) : null}
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
