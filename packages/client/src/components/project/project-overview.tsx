import { usePixel } from "@semoss/sdk/react";
import type { Project, Role } from "@semoss/shared";
import { CatalogOverview } from "@/components/catalog";
import { useRootStore } from "@/hooks";
import { normalizeTagArray } from "@/utility";

interface ProjectOverviewProps {
	project: Project;
	permission: Role;
	refresh: () => void;
}

export const ProjectOverview = ({
	project,
	permission,
	refresh,
}: ProjectOverviewProps) => {
	const { configStore } = useRootStore();

	const getProjectMetaValues = usePixel<
		{
			METAKEY: string;
			METAVALUE: string;
			count: number;
		}[]
	>(`META | GetProjectMetaValues ( metaKeys = ['tag'] ) ;`);

	/**
	 * Persist edited metadata to the backend and refresh project details.
	 *
	 * @returns Promise that resolves after save flow completes.
	 */
	const onSave = async (id: string, metadata: Record<string, unknown>) => {
		await configStore.runPixel(
			`SetProjectMetadata(project=["${id}"], meta=[${JSON.stringify(
				metadata,
			)}])`,
		);

		refresh();
	};

	if (!project) {
		return <div className="text-muted-foreground">No details found</div>;
	}

	return (
		<CatalogOverview
			id={project.project_id}
			permission={permission}
			metaKeys={configStore.store.config.projectMetaKeys}
			metaValues={
				getProjectMetaValues.status === "SUCCESS"
					? getProjectMetaValues.data
					: []
			}
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
			onSave={onSave}
		/>
	);
};
