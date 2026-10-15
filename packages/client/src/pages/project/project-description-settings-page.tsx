import { CatalogDescriptionSettings } from "@/components/catalog";
import { useProject, useSession } from "@/hooks";

/** Settings section for a project's catalog description. */
export const ProjectDescriptionSettingsPage = () => {
	const { project, permission, refresh, catalog } = useProject();
	const runPixel = useSession((state) => state.runPixel);
	const noun = catalog.name.toLowerCase();

	return (
		<CatalogDescriptionSettings
			metadata={project as unknown as Record<string, unknown>}
			permission={permission}
			onSave={async (meta) => {
				const response = await runPixel(
					`SetProjectMetadata(project=["${project.project_id}"], meta=[${JSON.stringify(
						meta,
					)}])`,
				);
				if (response.errors.length > 0) {
					throw new Error(response.errors.join(""));
				}
			}}
			onUpdated={refresh}
			description={`The summary that describes this ${noun}.`}
			descriptionHelp={`A short summary shown in the ${noun} catalog and on the Overview tab.`}
			testIdPrefix="project-description-settings"
		/>
	);
};
