import { Alert, AlertDescription, Button, Skeleton } from "@semoss/ui/next";
import { CatalogDependenciesView } from "@/features/catalog/dependencies/catalog-dependencies-view";
import { useCatalogDependencies } from "@/features/catalog/dependencies/use-catalog-dependencies";
import { useEngine } from "@/hooks/useEngine";

/**
 * An engine's Ontology tab: what it uses and what uses it. Owners and editors
 * can edit its manual dependencies.
 */
export const EngineDependenciesPage = () => {
	const { engine, permission } = useEngine();
	const { dependencies, allDependencies, links, isLoading, error, refresh } =
		useCatalogDependencies({
			catalogId: engine.engine_id,
			catalogType: engine.engine_type,
		});

	const canEdit = permission === "OWNER" || permission === "EDIT";

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
					{`Failed to load dependencies: ${error.message}`}
					<Button variant="outline" size="sm" onClick={refresh}>
						Retry
					</Button>
				</AlertDescription>
			</Alert>
		);
	}

	if (isLoading) {
		return (
			<output
				aria-label="Loading dependencies"
				className="flex w-full flex-col gap-4"
			>
				<Skeleton className="h-12 w-full max-w-prose" />
				<Skeleton className="h-120 w-full md:h-160" />
			</output>
		);
	}

	return (
		<CatalogDependenciesView
			// a new view per owner, so nothing from one carries to the next
			key={engine.engine_id}
			catalogId={engine.engine_id}
			catalogType={engine.engine_type}
			catalogName={engine.engine_display_name || engine.engine_name}
			catalogSubtype={engine.engine_subtype}
			catalogDescription={engine.description}
			canEdit={canEdit}
			dependencies={dependencies}
			graph={{ nodes: allDependencies, links }}
			onRefresh={refresh}
		/>
	);
};
