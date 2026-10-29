import { CopyPlus, DownloadIcon } from "lucide-react";
import { useState } from "react";
import type { Role } from "@semoss/sdk";
import type { Project } from "@semoss/shared";
import { CloneProjectDialog } from "@/components/project/clone-project-dialog";
import {
	ActionsMenu,
	type ActionsMenuItem,
} from "@/components/shared/actions-menu";
import { useAppExport } from "@/features/app-export/use-app-export";
import { useProject } from "@/hooks/use-project";
import { useNavigate } from "@/hooks/useNavigate";
import { APP_SETTINGS_TYPES } from "@/pages/project/project-settings-sections";

/** The project types the header can export: apps, agents and skills */
const EXPORT_TYPES: Project["project_type"][] = [
	...APP_SETTINGS_TYPES,
	"WORKSPACE",
	"SKILL",
];

/** A project action, with who the backend lets run it */
interface ProjectAction extends ActionsMenuItem {
	/** The permissions that can run the action */
	roles: Role[];
	/** Whether the action applies to this project, beyond the viewer's role */
	applies: boolean;
}

/**
 * The project header's Actions menu: clone and export an app, agent, skill,
 * notebook or automation, each for the roles that can run it. It is not shown
 * to a viewer who has none.
 *
 * - Clone: the project's owners, and anyone who can see it when it is a
 *   template.
 * - Export: the owners of an app, agent or skill.
 */
export const ProjectActionsMenu = () => {
	const { catalog, project, permission } = useProject();
	const navigate = useNavigate();
	const { isExporting, exportApp } = useAppExport(project.project_id);
	const [isCloneOpen, setIsCloneOpen] = useState(false);

	const actions: ProjectAction[] = [
		{
			id: "clone",
			label: "Clone",
			icon: CopyPlus,
			roles: ["OWNER", "EDIT", "READ_ONLY"],
			// owners can clone any of their projects, everyone else only a template
			applies:
				permission === "OWNER" || project.project_is_template === true,
			onSelect: () => setIsCloneOpen(true),
		},
		{
			id: "export",
			label: "Export",
			icon: DownloadIcon,
			roles: ["OWNER"],
			applies: EXPORT_TYPES.includes(project.project_type),
			isBusy: isExporting,
			busyLabel: "Exporting...",
			onSelect: () => void exportApp(),
		},
	];

	return (
		<>
			<ActionsMenu
				items={actions.filter(
					(action) =>
						action.applies && action.roles.includes(permission),
				)}
				testIdPrefix="projectHeader-actions"
			/>
			{isCloneOpen ? (
				<CloneProjectDialog
					open={isCloneOpen}
					project={project}
					onClose={(clonedId) => {
						setIsCloneOpen(false);
						if (clonedId) {
							navigate(`${catalog.path}/${clonedId}`);
						}
					}}
				/>
			) : null}
		</>
	);
};
