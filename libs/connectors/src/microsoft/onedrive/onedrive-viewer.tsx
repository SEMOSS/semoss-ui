import { useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import type { FileItem } from "@semoss/shared";
import { Tabs, TabsContent } from "@semoss/ui/next";
import { ConnectorFileExplorer } from "../../components/connector-file-explorer";
import { ConnectorTabsList } from "../../components/connector-tabs-list";
import { ConnectorTabsTrigger } from "../../components/connector-tabs-trigger";
import { useConnectorSaver } from "../../core/use-connector-saver";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { MicrosoftDriveItem } from "../microsoft.types";
import {
	createOneDriveAdapter,
	createOneDriveSharedAdapter,
	DRIVE_LIST_LIMIT,
	type DriveViewerProps,
	getDriveItem,
	getDriveItemAction,
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
export type OneDriveViewerProps = DriveViewerProps;

/**
 * Browse the user's OneDrive and what others shared with them in the file
 * explorer SEMOSS browses every file tree with, and bring files into the
 * insight: add one to the conversation, save a copy into the insight's files,
 * or open it in OneDrive.
 *
 * A listing that stopped at the drive's limit says so under it, so a file
 * past the limit is not taken for missing. What is shared with the user is
 * found through Microsoft's search, which lists a new share late, and the
 * note under that view's top listing says so.
 */
export const OneDriveViewer = (props: OneDriveViewerProps) => {
	const { onSignIn, isVisible, refreshRequestId, getFileAction } = props;
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

	/**
	 * What to say under one listing of a view.
	 *
	 * @param tab - The view the listing is in.
	 * @param items - The listing's items.
	 * @param path - The folder that was listed.
	 * @return The note, or undefined when the listing is whole.
	 */
	const getListingNote = (
		tab: OneDriveView,
		items: FileItem[],
		path: string,
	): string | undefined => {
		const notes: string[] = [];
		if (items.length >= DRIVE_LIST_LIMIT) {
			notes.push(t("common.limitReached", { count: items.length }));
		}
		if (tab === "shared" && path === "/") {
			notes.push(t("onedrive.sharedNote"));
		}
		return notes.join(" ") || undefined;
	};

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
						getItemAction={getDriveItemAction(getFileAction)}
						onSignIn={onSignIn}
						isVisible={isVisible}
						refreshRequestId={refreshRequestId}
						listingNote={(items, path) =>
							getListingNote(tab, items, path)
						}
					/>
				</TabsContent>
			))}
		</Tabs>
	);
};
