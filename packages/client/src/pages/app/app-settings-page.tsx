import { SettingsContext } from "@/contexts/settings-context";
import { CatalogImageSettings } from "@/features/catalog-images/catalog-image-settings";
import { useProject } from "@/hooks/use-project";
import { SettingsTab } from "./app-detail-tabs/settings-tab";

export const AppSettingsPage = () => {
	const { project, permission } = useProject();
	const hasAppSettings = ["CODE", "BLOCKS", "AUTOMATION", "INSIGHT"].includes(
		project.project_type,
	);
	return (
		<SettingsContext.Provider value={{ adminMode: false }}>
			<div className="space-y-6">
				<CatalogImageSettings
					key={project.project_id}
					resource="PROJECT"
					id={project.project_id}
					name={project.project_display_name || project.project_name}
					canEdit={permission === "OWNER" || permission === "EDIT"}
				/>
				{permission === "OWNER" && hasAppSettings && (
					<SettingsTab project={project} />
				)}
			</div>
		</SettingsContext.Provider>
	);
};
