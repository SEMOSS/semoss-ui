import { DeleteResourceCard } from "@/features/resource-delete/delete-resource-card";
import { useProject } from "@/hooks/use-project";
import { useNavigate } from "@/hooks/useNavigate";

/**
 * The Dangerous section of a project's Settings: deleting the app, agent,
 * skill, notebook or automation, which goes back to its catalog after.
 */
export const ProjectDangerousSettingsPage = () => {
	const { catalog, project } = useProject();
	const navigate = useNavigate();

	return (
		<DeleteResourceCard
			type="PROJECT"
			id={project.project_id}
			name={
				project.project_display_name ||
				project.project_name ||
				project.project_id
			}
			label={catalog.name}
			projectType={project.project_type}
			onDeleted={() => navigate(catalog.path)}
		/>
	);
};
