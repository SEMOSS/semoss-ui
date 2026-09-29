import { useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { ToggleGroup, ToggleGroupItem } from "@semoss/ui/next";
import { ConnectorFileExplorer } from "../../components/connector-file-explorer";
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
	const { t } = useTranslation("connectors");
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
		<div className="flex h-full min-h-0 flex-col">
			<div className="px-3 pt-2">
				<ToggleGroup
					type="single"
					variant="outline"
					size="sm"
					value={view}
					aria-label={t("onedrive.viewLabel")}
					onValueChange={(value) => {
						if (isOneDriveView(value)) {
							setView(value);
						}
					}}
				>
					<ToggleGroupItem value="mine">
						{t("onedrive.mine")}
					</ToggleGroupItem>
					<ToggleGroupItem value="shared">
						{t("onedrive.shared")}
					</ToggleGroupItem>
				</ToggleGroup>
			</div>
			<div className="min-h-0 flex-1">
				<ConnectorFileExplorer
					key={view}
					adapter={adapters[view]}
					serviceName={t("services.onedrive")}
					saver={saver}
					getSaveRequest={(row) =>
						getDriveSaveRequest(row, getDownload)
					}
					getWebUrl={(row) => getDriveItem(row)?.webUrl}
					onSignIn={onSignIn}
				/>
			</div>
		</div>
	);
};
