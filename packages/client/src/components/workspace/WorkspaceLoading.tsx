import { observer } from "mobx-react-lite";
import { LoadingScreen } from "@semoss/ui/next";
import { useWorkspace } from "@/hooks";

/**
 * WorkspaceLoading show the loading screen
 */
export const WorkspaceLoading = observer((): JSX.Element => {
	const { workspace } = useWorkspace();

	if (workspace.isLoading) {
		return <LoadingScreen.Trigger />;
	}

	return null;
});
