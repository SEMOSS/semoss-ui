import { CatalogSettingsPanel } from "@/components/catalog/catalog-settings-panel";
import { SettingsContext } from "@/contexts/settings-context";
import { useProject } from "@/hooks/use-project";
import { getProjectSettingsSections } from "@/pages/project/project-settings-sections";

/**
 * A project's Settings in a workbench panel: the same sections and left menu
 * as the project's Settings tab, switched in place since the panel has no
 * routes.
 */
export const ProjectSettingsPanel = () => {
	const { catalog, project, permission } = useProject();

	return (
		<SettingsContext.Provider value={{ adminMode: false }}>
			<CatalogSettingsPanel
				sections={getProjectSettingsSections(
					project.project_type,
					permission,
					catalog.name,
				)}
				ariaLabel="Settings sections"
				testIdPrefix="project-settings-panel"
			/>
		</SettingsContext.Provider>
	);
};
