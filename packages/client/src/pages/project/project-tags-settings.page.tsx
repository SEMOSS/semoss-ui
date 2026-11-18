import { useConfig, useSessionInsight } from "@semoss/sdk/react";
import { CatalogTagsSettings } from "@/components/catalog/catalog-tags-settings";
import { useProject } from "@/hooks/use-project";

/** Settings section for a project's tags, classification, and domain. */
export const ProjectTagsSettingsPage = () => {
	const { project, permission, refresh, catalog } = useProject();
	const projectMetaKeys = useConfig(
		(state) => state.config?.projectMetaKeys ?? [],
	);
	const { run: runPixel } = useSessionInsight();

	return (
		<CatalogTagsSettings
			metadata={project as unknown as Record<string, unknown>}
			permission={permission}
			buildMetaValuesPixel={(metaKeys) =>
				`META | GetProjectMetaValues ( metaKeys = [${metaKeys
					.map((key) => `'${key}'`)
					.join(",")}] ) ;`
			}
			metaKeysConfig={projectMetaKeys}
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
			description={`Organize and classify this ${catalog.name.toLowerCase()} across the catalog.`}
			testIdPrefix="project-tags-settings"
		/>
	);
};
