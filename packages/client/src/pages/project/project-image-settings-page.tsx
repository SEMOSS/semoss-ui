import { CatalogImageSettings } from "@/features/catalog-images/catalog-image-settings";
import { useProject } from "@/hooks/use-project";

/** Settings section for a project's catalog image. */
export const ProjectImageSettingsPage = () => {
	const { project, permission } = useProject();

	return (
		<CatalogImageSettings
			key={project.project_id}
			resource="PROJECT"
			id={project.project_id}
			name={project.project_display_name || project.project_name}
			canEdit={permission === "OWNER" || permission === "EDIT"}
		/>
	);
};
