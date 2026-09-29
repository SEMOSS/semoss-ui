import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { Muted } from "@semoss/ui/next";
import { ConnectorFileExplorer } from "../../components/connector-file-explorer";
import { ConnectorViewerStatus } from "../../components/connector-viewer-status";
import type { ConnectorViewerProps } from "../../core/connector.types";
import { useConnectorSaver } from "../../core/use-connector-saver";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { MicrosoftDriveItem } from "../microsoft.types";
import {
	createTeamsFilesAdapter,
	getDriveItem,
	getDriveSaveRequest,
} from "../microsoft-drive.adapters";
import { TeamsChannelPicker } from "./teams-channel-picker";
import { useTeamsChannelChoice } from "./use-teams-channel-choice";

/**
 * A channel file's download pixel, for the name it is saved under. A file
 * without its drive cannot be downloaded.
 *
 * @param item - The file.
 * @return The pixel builder, or null.
 */
const getDownload = (item: MicrosoftDriveItem) => {
	const { driveId } = item;
	return driveId
		? (fileName: string) =>
				MICROSOFT_PIXELS.teamsDownloadFile({
					itemId: item.id,
					driveId: driveId,
					fileName: fileName,
				})
		: null;
};

/** Props for {@link TeamsFilesViewer}. */
export type TeamsFilesViewerProps = ConnectorViewerProps;

/**
 * Browse the files shared in a Teams channel: pick a team and channel, then
 * move through its folders in the file explorer SEMOSS browses every file
 * tree with, and bring files into the insight.
 */
export const TeamsFilesViewer = (props: TeamsFilesViewerProps) => {
	const { onSignIn } = props;
	const { t } = useTranslation("connectors");
	const saver = useConnectorSaver("teams-files", props);
	const choice = useTeamsChannelChoice();
	const { team, channel } = choice;
	const serviceName = t("services.teamsFiles");

	// one adapter per channel, so another channel starts at its top
	const adapter = useMemo(
		() =>
			team && channel
				? createTeamsFilesAdapter(team.id, channel.id)
				: null,
		[team, channel],
	);

	const renderBody = () => {
		if (choice.teamsQuery.status !== "ready") {
			return (
				<ConnectorViewerStatus
					query={choice.teamsQuery}
					serviceName={serviceName}
					onSignIn={onSignIn}
				/>
			);
		}
		if (!team) {
			return (
				<div className="px-4 py-8 text-center">
					<Muted>{t("teams.noTeams")}</Muted>
				</div>
			);
		}
		if (
			choice.channelsQuery.status === "error" ||
			choice.channelsQuery.status === "signedOut"
		) {
			return (
				<ConnectorViewerStatus
					query={choice.channelsQuery}
					serviceName={serviceName}
					onSignIn={onSignIn}
				/>
			);
		}
		if (choice.channelsQuery.status === "ready" && !channel) {
			return (
				<div className="px-4 py-8 text-center">
					<Muted>{t("teams.noChannels")}</Muted>
				</div>
			);
		}
		if (!adapter || !channel) {
			return null;
		}
		return (
			<div className="min-h-0 flex-1">
				<ConnectorFileExplorer
					key={`${team.id}|${channel.id}`}
					adapter={adapter}
					serviceName={t("services.teams")}
					saver={saver}
					getSaveRequest={(row) =>
						getDriveSaveRequest(row, getDownload)
					}
					getWebUrl={(row) => getDriveItem(row)?.webUrl}
					onSignIn={onSignIn}
				/>
			</div>
		);
	};

	return (
		<div className="@container flex h-full min-h-0 flex-col">
			{choice.teamsQuery.status === "ready" && team ? (
				<div className="px-3 pt-2">
					<TeamsChannelPicker choice={choice} />
				</div>
			) : null}
			{renderBody()}
		</div>
	);
};
