import { BlocksIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import type { CatalogDependency, Engine } from "@semoss/shared";
import { Muted, ScrollArea, toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useProject } from "@/hooks/use-project";
import { toCatalogDependencyPayload } from "./catalog-dependency";
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
 * the selected engines as removable chips and a category-scoped Manage
 * dialog — the engines the agent can use when building and running the app.
 * Saves go through SetCatalogDependencies (preserving project-kind and
 * other-category dependencies), which also refreshes the agent's engine
 * context on the backend.
 *
 * @name CatalogEnginesPanel
 * @return The available-engines panel.
 */
const CatalogEnginesPanel = () => {
	const { project, dependencies, permission, refresh } = useProject();
	const [manageCategory, setManageCategory] = useState<
		Engine["engine_type"] | null
	>(null);
	const [isRemoving, setIsRemoving] = useState(false);
	const canEdit = permission === "OWNER" || permission === "EDIT";

	const buckets = useMemo(() => {
		const next = new Map<string, CatalogDependency[]>();
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

	const removeEngine = async (engine: CatalogDependency) => {
		setIsRemoving(true);
		try {
			const payload = dependencies
				.filter(
					(dependency) => dependency.catalog_id !== engine.catalog_id,
				)
				.map(toCatalogDependencyPayload);
			const response = await runPixel<[unknown]>(
				`SetCatalogDependencies(catalogId="${project.project_id}", catalogType="${project.project_type}", dependencies=${JSON.stringify(payload)});`,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}
			toast.success(`Removed ${engine.catalog_name}`);
			refresh();
		} catch (error) {
			toast.error(getErrorMessage(error, "Failed to remove engine"));
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
							onRemove={(engine) => void removeEngine(engine)}
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
					onClose={(saved) => {
						if (saved) refresh();
						setManageCategory(null);
					}}
				/>
			) : null}
		</div>
	);
};

/**
 * Blueprint for the "Available engines" panel. keepAlive: search text and
 * dialog state survive tab switches.
 */
export const CATALOG_ENGINES_PANEL: WorkbenchPanelConfig = {
	name: "Engines",
	helpText: "Available engines",
	icon: ({ className }) => <BlocksIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: CatalogEnginesPanel,
};
