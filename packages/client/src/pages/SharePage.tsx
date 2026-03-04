import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Renderer } from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import { getUserProjectPermission as getUserProjectLevelPermission } from "@semoss/shared";
import { LoadingScreen, styled, useNotification } from "@semoss/ui";
import type { AppMetadata, AppType } from "@/components/app";
import { CodeRenderer } from "@/components/code-workspace";
import { PlatformMessages } from "@/components/shared";
import { useRootStore } from "@/hooks";

const StyledViewport = styled("div")(() => ({
	display: "flex",
	height: "100vh",
	width: "100vw",
	overflow: "hidden",
}));

export const SharePage = observer(() => {
	// App ID Needed for pixel calls
	const { appId } = useParams();
	const { monolithStore } = useRootStore();

	const notification = useNotification();
	const navigate = useNavigate();

	const [type, setType] = useState<AppType | null>(null);
	const [insightId, setInsightId] = useState("");

	/**
	 * Load an app
	 *
	 * @param appId - id of app to load into the workspace
	 */
	const loadApp = async (appId: string) => {
		try {
			// clear the type
			setType(null);

			// get the role and throw an error if it is missing
			const role = await getUserProjectLevelPermission(appId);
			if (!role) {
				throw new Error("Unauthorized");
			}

			const { insightId: iId } = await runPixel(
				`SetContext("${appId}")`,
				"new",
			);
			setInsightId(iId);

			// get the metadata
			const getAppInfo = await monolithStore.runQuery<[AppMetadata]>(
				`ProjectInfo(project=["${appId}"]);`,
				iId,
			);

			// throw the errors if there are any
			if (getAppInfo.errors.length > 0) {
				throw new Error(getAppInfo.errors.join(""));
			}

			const metadata = {
				...getAppInfo.pixelReturn[0].output,
			};

			let type: AppType = "CODE";
			// set it as blocks
			if (metadata.project_type === "BLOCKS") {
				type = "BLOCKS";
			}

			setType(type);
		} catch (e) {
			notification.add({
				color: "error",
				message: e.message,
			});

			navigate("/");
		}
	};

	// load the app
	useEffect(() => {
		loadApp(appId);
	}, [appId]);

	// hide the screen while it loads
	if (!type) {
		return <LoadingScreen.Trigger />;
	}

	return (
		<StyledViewport>
			{type === "CODE" ? <CodeRenderer appId={appId} /> : null}
			{type === "BLOCKS" ? (
				<Renderer appId={appId} insightId={insightId} />
			) : null}
			<PlatformMessages />
		</StyledViewport>
	);
});
