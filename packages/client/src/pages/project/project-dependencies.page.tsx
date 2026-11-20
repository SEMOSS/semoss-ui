import { CatalogDependenciesView } from "@/features/catalog/dependencies/catalog-dependencies-view";
import { useProject } from "@/hooks/use-project";

/**
 * Why a project's dependencies can't be edited here, for the types whose
 * dependencies their own settings manage.
 */
const READ_ONLY_HINTS: Partial<Record<string, string>> = {
	BLOCKS: "Add or remove dependencies using the Variables tab",
	WORKSPACE:
		"An agent's dependencies come from its MCP and Skills settings; change them there",
};

/**
 * A project's Dependencies tab. Owners and editors can edit the list, except
 * for BLOCKS apps and agents, whose dependencies are rebuilt from their own
 * settings and so stay read-only here.
 */
export const ProjectCatalogDependenciesPage = () => {
	const { project, dependencies, permission, refresh } = useProject();

	const isEditor = permission === "OWNER" || permission === "EDIT";
	const readOnlyHint = READ_ONLY_HINTS[project.project_type];
	const canEdit = isEditor && !readOnlyHint;

	return (
		<CatalogDependenciesView
			catalogId={project.project_id}
			catalogType={project.project_type}
			canEdit={canEdit}
			editHint={
				isEditor
					? (readOnlyHint ??
						"Add or remove dependencies using the edit button")
					: undefined
			}
			dependencies={dependencies}
			onRefresh={refresh}
		/>
	);
};
