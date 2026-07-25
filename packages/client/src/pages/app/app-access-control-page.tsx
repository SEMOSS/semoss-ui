import { useProject } from "@/hooks";
import { AccessControl } from "./app-detail-tabs/access-control";

export const AppAccessControlPage = () => {
	const { project, permission, refresh } = useProject();
	return (
		<AccessControl
			project={project}
			appId={project.project_id}
			fetchUserSpecificData={refresh}
			permission={permission}
		/>
	);
};
