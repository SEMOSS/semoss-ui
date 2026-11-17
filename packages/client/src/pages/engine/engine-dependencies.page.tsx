import { Muted, Spinner } from "@semoss/ui/next";
import { CatalogDependenciesView } from "@/features/catalog/dependencies/catalog-dependencies-view";
import { useCatalogDependencies } from "@/features/catalog/dependencies/use-catalog-dependencies";
import { useEngine } from "@/hooks/useEngine";

/**
 * An engine's Dependencies tab: the engines and projects it depends on.
 * Owners and editors can edit the list.
 */
export const EngineDependenciesPage = () => {
	const { engine, permission } = useEngine();
	const { dependencies, isLoading, error, refresh } = useCatalogDependencies({
		catalogId: engine.engine_id,
		catalogType: engine.engine_type,
	});

	const canEdit = permission === "OWNER" || permission === "EDIT";

	if (error) {
		return (
			<div role="alert" className="w-full px-2 py-4 text-center">
				<Muted>Failed to load dependencies: {error.message}</Muted>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex w-full items-center justify-center py-8">
				<Spinner />
			</div>
		);
	}

	return (
		<CatalogDependenciesView
			catalogId={engine.engine_id}
			catalogType={engine.engine_type}
			canEdit={canEdit}
			editHint={
				canEdit
					? "Add or remove dependencies using the edit button"
					: undefined
			}
			dependencies={dependencies}
			onRefresh={refresh}
		/>
	);
};
