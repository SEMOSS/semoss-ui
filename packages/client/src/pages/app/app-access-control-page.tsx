import { useProject } from "@/hooks";
import { AccessControl } from "./app-detail-tabs/access-control";

export const AppAccessControlPage = () => {
	const { appId, project, permission, refresh } = useProject();
	return (
		<AccessControl
			project={project}
			appId={appId}
			fetchUserSpecificData={refresh}
			permission={permission}
		/>
	);
};
