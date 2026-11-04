import type { Project } from "@semoss/shared";
import { CatalogOverview } from "@/components/catalog";
import { useConfig } from "@/hooks";
import { normalizeTagArray } from "@/utility";

interface ProjectOverviewProps {
	/** The project to show */
	project: Project;
}

/**
 * The read-only overview of a project. Its metadata is edited on the project's
 * Settings tab.
 */
export const ProjectOverview = ({ project }: ProjectOverviewProps) => {
	const projectMetaKeys = useConfig((state) => state.config.projectMetaKeys);

	if (!project) {
		return <div className="text-muted-foreground">No details found</div>;
	}

	return (
		<CatalogOverview
			id={project.project_id}
			metaKeys={projectMetaKeys}
			description={project.description || ""}
			markdown={project.markdown || ""}
			tags={normalizeTagArray(project.tag) || []}
			dataClassification={
				normalizeTagArray(project["data classification"]) || []
			}
			dataRestrictions={
				normalizeTagArray(project["data restrictions"]) || []
			}
			metadata={project as unknown as Record<string, unknown>}
			dateCreated={project.project_date_created || ""}
			dateLastEdited={project.project_date_last_edited || ""}
		/>
	);
};
