import { CatalogSettingsLayout } from "@/components/catalog/catalog-settings-layout";
import { SettingsContext } from "@/contexts/settings-context";
import { useProject } from "@/hooks/use-project";
import { getProjectSettingsSections } from "./project-settings-sections";

/**
 * Layout for every project's Settings tab (apps, agents, skills, notebooks
 * and automations): a small left sidebar that switches between the sections
 * the viewer has on the project, with the active section rendered beside it.
 */
export const ProjectSettingsLayout = () => {
	const { catalog, project, permission } = useProject();

	return (
		<SettingsContext.Provider value={{ adminMode: false }}>
			<CatalogSettingsLayout
				sections={getProjectSettingsSections(
					project.project_type,
					permission,
					catalog.name,
				)}
				ariaLabel="Settings sections"
				testIdPrefix="project-settings-layout"
			/>
		</SettingsContext.Provider>
	);
};
