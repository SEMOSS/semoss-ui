import { useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Tabs, TabsContent } from "@semoss/ui/next";
import { ConnectorFileExplorer } from "../../components/connector-file-explorer";
import { ConnectorTabsList } from "../../components/connector-tabs-list";
import { ConnectorTabsTrigger } from "../../components/connector-tabs-trigger";
import type { ConnectorViewerProps } from "../../core/connector.types";
import { useConnectorSaver } from "../../core/use-connector-saver";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { MicrosoftDriveItem } from "../microsoft.types";
import {
	createOneDriveAdapter,
	createOneDriveSharedAdapter,
	getDriveItem,
	getDriveSaveRequest,
} from "../microsoft-drive.adapters";

type OneDriveView = "mine" | "shared";

const isOneDriveView = (value: string): value is OneDriveView =>
	value === "mine" || value === "shared";

/**
 * A OneDrive file's download pixel, for the name it is saved under.
 *
 * @param item - The file.
 * @return The pixel builder.
 */
const getDownload = (item: MicrosoftDriveItem) => (fileName: string) =>
	MICROSOFT_PIXELS.oneDriveDownload({
		driveId: item.driveId,
		itemId: item.id,
		fileName: fileName,
	});

/** Props for {@link OneDriveViewer}. */
export type OneDriveViewerProps = ConnectorViewerProps;

/**
 * Browse the user's OneDrive and what others shared with them in the file
 * explorer SEMOSS browses every file tree with, and bring files into the
 * insight: add one to the conversation, save a copy into the insight's files,
 * or open it in OneDrive.
 */
export const OneDriveViewer = (props: OneDriveViewerProps) => {
	const { onSignIn } = props;
	const { t, i18n } = useTranslation("connectors");
	const saver = useConnectorSaver("onedrive", props);
	const [view, setView] = useState<OneDriveView>("mine");
	// each view keeps its adapter, which remembers the shared folders it showed
	const adapters = useMemo(
		() => ({
			mine: createOneDriveAdapter(),
			shared: createOneDriveSharedAdapter(),
		}),
		[],
	);

	return (
		<Tabs
			dir={i18n.dir()}
			value={view}
			onValueChange={(value) => {
				if (isOneDriveView(value)) setView(value);
			}}
			className="h-full min-h-0 gap-0"
		>
			<div className="shrink-0 border-border border-b bg-muted/20 px-2">
				<ConnectorTabsList aria-label={t("onedrive.viewLabel")}>
					<ConnectorTabsTrigger value="mine">
						{t("onedrive.mine")}
					</ConnectorTabsTrigger>
					<ConnectorTabsTrigger value="shared">
						{t("onedrive.shared")}
					</ConnectorTabsTrigger>
				</ConnectorTabsList>
			</div>
			{(["mine", "shared"] as const).map((tab) => (
				<TabsContent key={tab} value={tab} className="min-h-0">
					<ConnectorFileExplorer
						adapter={adapters[tab]}
						serviceName={t("services.onedrive")}
						saver={saver}
						getSaveRequest={(row) =>
							getDriveSaveRequest(row, getDownload)
						}
						getWebUrl={(row) => getDriveItem(row)?.webUrl}
						onSignIn={onSignIn}
					/>
				</TabsContent>
			))}
		</Tabs>
	);
};
