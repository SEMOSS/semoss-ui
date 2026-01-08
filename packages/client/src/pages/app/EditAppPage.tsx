import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingScreen, styled, useNotification } from "@semoss/ui";
import { BlocksWorkspace } from "@/components/blocks-workspace";
import { CodeWorkspace } from "@/components/code-workspace";
import { usePage, usePixel, useRootStore } from "@/hooks";
import type { WorkspaceStore } from "@/stores";

const StyledContent = styled("div")(({ theme }) => ({
	position: "absolute",
	inset: 0,
}));

export const EditAppPage = observer(() => {
	// App ID Needed for pixel calls
	const { appId } = useParams();
	const { configStore } = useRootStore();

	const notification = useNotification();
	const navigate = useNavigate();

	// setup the page
	usePage({
		showNavbarLogo: false,
	});

	const [workspace, setWorkspace] = useState<WorkspaceStore>(undefined);

	const validateDependencies = usePixel<Record<string, boolean>>(
		appId
			? 'ValidateUserProjectDependencies(project="' + appId + '");'
			: "",
	);

	useEffect(() => {
		let isMounted = true;
		if (appId) {
			// clear out the old app
			setWorkspace(undefined);

			configStore
				.createWorkspace(appId)
				.then((loadedWorkspace) => {
					if (isMounted) {
						setWorkspace(loadedWorkspace);
					}
				})
				.catch((e) => {
					notification.add({
						color: "error",
						message: e.message,
					});

					navigate("/");
				});
		}

		return () => {
			isMounted = false;
		};
	}, [appId]);

	// TODO: Test Comment -> Delete

	useEffect(() => {
		if (validateDependencies.status !== "SUCCESS") {
			return;
		} else if (validateDependencies.data !== null) {
			const needsAccess = [];
			Object.entries(validateDependencies.data).forEach((kv) => {
				const hasAccess = kv[1];

				if (!hasAccess) {
					needsAccess.push(kv[0]);
				}
			});
			if (needsAccess.length) {
				notification.add({
					color: "warning",
					message: `You do not have access to the following dependencies: ${needsAccess.join(", ")}.`,
				});
			}
		}
	}, [validateDependencies.status, validateDependencies.data]);

	// hide the screen while it loads
	if (!workspace) {
		return <LoadingScreen.Trigger description="Initializing app" />;
	}

	if (workspace.type === "CODE") {
		return (
			<StyledContent>
				<CodeWorkspace workspace={workspace} />
			</StyledContent>
		);
	}

	if (workspace.type === "BLOCKS") {
		return (
			<StyledContent>
				<BlocksWorkspace workspace={workspace} />
			</StyledContent>
		);
	}

	return null;
});
