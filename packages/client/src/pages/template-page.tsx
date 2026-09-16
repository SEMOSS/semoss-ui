import { useState } from "react";
import { useNavigate } from "react-router";
import type { Project } from "@semoss/shared";
import { CatalogLayout } from "@/components/catalog";
import { CloneProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { TemplateGrid } from "@/components/templates";
import { TYPE_TO_ROUTE } from "@/constants";

/**
 * Template Catalog Landing Page
 * Lists every template; picking one opens the clone dialog.
 */
export const TemplatePage: React.FC = (): React.JSX.Element => {
	const navigate = useNavigate();
	const [cloneTemplate, setCloneTemplate] = useState<Project | null>(null);

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<CatalogLayout
				title="Template Catalog"
				description="Explore reusable templates for apps of every kind. Choose a starting point, create your own app, and customize it to fit your use case."
				searchBar={null}
			>
				<TemplateGrid
					onSelect={(template) => {
						if (template) {
							setCloneTemplate(template);
						}
					}}
				/>
			</CatalogLayout>

			{/* Use / Clone Template Dialog */}
			{cloneTemplate && (
				<CloneProjectDialog
					open={Boolean(cloneTemplate)}
					project={cloneTemplate}
					onClose={(newAppId) => {
						setCloneTemplate(null);
						if (newAppId) {
							navigate(
								`${TYPE_TO_ROUTE[cloneTemplate.project_type]}/${newAppId}/edit`,
							);
						}
					}}
				/>
			)}
		</>
	);
};
