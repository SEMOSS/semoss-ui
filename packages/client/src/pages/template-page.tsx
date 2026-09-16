import { useState } from "react";
import { useNavigate } from "react-router";
import type { Project } from "@semoss/shared";
import { CatalogLayout } from "@/components/catalog";
import { CloneProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { TemplateGrid, TemplateInput } from "@/components/templates";
import { TYPE_TO_ROUTE } from "@/constants";

/**
 * Template Catalog Landing Page
 * Lists every template; picking one opens the clone dialog. Describing what you
 * want in the prompt box instead skips the browsing: the backend picks the type,
 * template and agent, and the new project opens with the prompt already running
 * in its assistant.
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
			>
				<div className="mx-auto my-4 w-full max-w-5xl md:my-32">
					<TemplateInput />
				</div>
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
