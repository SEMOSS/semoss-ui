import { Lock, SearchIcon } from "lucide-react";
import { useState } from "react";
import type { CatalogDependencyRow, CatalogType, Engine } from "@semoss/shared";
import {
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
	collectTakenNames,
	type DependencyOption,
	getUniqueDependencyName,
} from "./catalog-dependency-draft";
import { DependencyOptionList } from "./dependency-option-list";
import { AUTOMATIC_CHIP_CLASS } from "./engine-category-card";
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
	/** Called on close, with whether a save succeeded */
	onClose: (didSave: boolean) => void;
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
	const read = useDependencyOptions({
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
	const [selectedNames, setSelectedNames] = useState<
		ReadonlyMap<string, string>
	>(
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

	const handleToggleEngine = (engine: DependencyOption) => {
		setSelectedNames((current) => {
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
					selectedNames.has(dependency.catalog_id),
			);
			// a new pick is named after itself, unique among the names kept
			const taken = collectTakenNames([...others, ...kept]);
			const added = [...selectedNames]
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
			toast.error(
				getErrorMessage(saveError, "Couldn't update the engines"),
			);
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
					<DialogTitle>Manage {meta.label}</DialogTitle>
					<DialogDescription>{meta.blurb}.</DialogDescription>
				</DialogHeader>

				<InputGroup>
					<InputGroupAddon>
						<SearchIcon className="size-4" aria-hidden="true" />
					</InputGroupAddon>
					<InputGroupInput
						placeholder={`Search ${categoryLabel}...`}
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
									className={AUTOMATIC_CHIP_CLASS}
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

				<DependencyOptionList
					read={read}
					sourceLabel={categoryLabel}
					isSelected={(option) =>
						selectedNames.has(option.catalog_id)
					}
					getStatus={(option) =>
						selectedNames.has(option.catalog_id) ? "Selected" : null
					}
					onPick={handleToggleEngine}
					className="max-h-96 min-h-40"
				/>

				<DialogFooter className="items-center">
					<span className="me-auto text-muted-foreground text-xs">
						{selectedNames.size} selected
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
						{isSaving ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
