import { BlocksIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { CatalogDependencyRow, Engine } from "@semoss/shared";
import { Muted, ScrollArea, toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { setCatalogDependencies } from "@/api/catalog-dependencies";
import { useProject } from "@/hooks/use-project";
import {
	getDependencyDisplayName,
	toCatalogDependencyPayload,
} from "./catalog-dependency";
import { EngineCategoryCard } from "./engine-category-card";
import { ManageEnginesDialog } from "./manage-engines-dialog";

/** Engine categories always shown, in display order. */
const PRIMARY_CATEGORIES: readonly Engine["engine_type"][] = [
	"MODEL",
	"DATABASE",
	"STORAGE",
	"VECTOR",
];

/** Engine categories shown only when the project depends on one. */
const EXTRA_CATEGORIES: readonly Engine["engine_type"][] = [
	"FUNCTION",
	"GUARDRAIL",
];

/**
 * The "Available engines" workbench panel: one card per engine category with
 * the selected engines as chips and a category-scoped Manage dialog — the
 * engines the agent can use when building and running the app. Manual
 * engines can be removed; automatic ones come from the project's
 * configuration and show their role instead. Saves go through
 * SetCatalogDependencies with the manual rows only (preserving project-kind
 * and other-category ones), which also refreshes the agent's engine context
 * on the backend.
 */
const CatalogEnginesPanel = () => {
	const { project, dependencies, permission, refreshDependencies } =
		useProject();
	const [manageCategory, setManageCategory] = useState<
		Engine["engine_type"] | null
	>(null);
	const [isRemoving, setIsRemoving] = useState(false);
	const canEdit = permission === "OWNER" || permission === "EDIT";

	const buckets = useMemo(() => {
		const next = new Map<string, CatalogDependencyRow[]>();
		for (const category of [...PRIMARY_CATEGORIES, ...EXTRA_CATEGORIES]) {
			next.set(category, []);
		}
		for (const dependency of dependencies) {
			next.get(dependency.catalog_type)?.push(dependency);
		}
		return next;
	}, [dependencies]);

	const categories = [
		...PRIMARY_CATEGORIES,
		...EXTRA_CATEGORIES.filter(
			(category) => (buckets.get(category) ?? []).length > 0,
		),
	];

	const handleRemoveEngine = async (engine: CatalogDependencyRow) => {
		setIsRemoving(true);
		try {
			// only manual rows are sent; the backend keeps the automatic ones
			await setCatalogDependencies(
				project.project_id,
				project.project_type,
				dependencies
					.filter(
						(dependency) =>
							!dependency.is_automatic &&
							dependency.catalog_id !== engine.catalog_id,
					)
					.map(toCatalogDependencyPayload),
			);
			toast.success(`Removed ${getDependencyDisplayName(engine)}`);
			refreshDependencies();
		} catch (error) {
			toast.error(getErrorMessage(error, "Couldn't remove the engine"));
		} finally {
			setIsRemoving(false);
		}
	};

	return (
		<div className="flex h-full min-h-0 w-full flex-col bg-background">
			<ScrollArea className="min-h-0 flex-1">
				<div className="flex flex-col gap-3 p-4">
					<div>
						<Muted className="text-sm">
							Select engines you want the agent to utilize
						</Muted>
					</div>

					{categories.map((category) => (
						<EngineCategoryCard
							key={category}
							category={category}
							engines={buckets.get(category) ?? []}
							canEdit={canEdit}
							isRemoving={isRemoving}
							onManage={() => setManageCategory(category)}
							onRemove={(engine) =>
								void handleRemoveEngine(engine)
							}
						/>
					))}
				</div>
			</ScrollArea>

			{manageCategory ? (
				<ManageEnginesDialog
					category={manageCategory}
					catalogId={project.project_id}
					catalogType={project.project_type}
					dependencies={dependencies}
					onClose={(didSave) => {
						if (didSave) refreshDependencies();
						setManageCategory(null);
					}}
				/>
			) : null}
		</div>
	);
};

/**
 * Blueprint for the Available Engines panel. keepAlive, so an open Manage
 * dialog and its search survive tab switches.
 */
export const CATALOG_ENGINES_PANEL: WorkbenchPanelConfig = {
	name: "Engines",
	helpText: "Available Engines",
	icon: ({ className }) => <BlocksIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: CatalogEnginesPanel,
};
