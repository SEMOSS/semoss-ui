import { useTranslation } from "@semoss/i18n";
import { ConnectorActionBar } from "../../components/connector-action-bar";
import { ConnectorDetailView } from "../../components/connector-detail-view";
import { formatFullDate } from "../../core/connector.format";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../../core/use-connector-saver";
import {
	teamsMessageTitle,
	teamsThreadFileName,
	teamsThreadToMarkdown,
} from "../microsoft.markdown";
import { readMicrosoftSavedPath } from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type {
	TeamsAttachment,
	TeamsChannel,
	TeamsMessage,
	TeamsTeam,
} from "../microsoft.types";
import { TeamsMessageItem } from "./teams-message-item";

/** Props for {@link TeamsThreadDetail}. */
export interface TeamsThreadDetailProps {
	/** The thread's first message, with its replies. */
	thread: TeamsMessage;
	/** The team the channel is in. */
	team: TeamsTeam;
	/** The channel the thread is in. */
	channel: TeamsChannel;
	/** Saves the thread and its files into the insight. */
	saver: ConnectorSaver;
	/** Goes back to the channel. */
	onBack: () => void;
}

/**
 * A channel thread: its first message and every reply, with their files. The
 * whole thread can be added to the conversation or saved as one file.
 */
export const TeamsThreadDetail = ({
	thread,
	team,
	channel,
	saver,
	onBack,
}: TeamsThreadDetailProps) => {
	const { t, i18n } = useTranslation("connectors");
	const serviceName = t("services.teams");
	const title = teamsMessageTitle(thread, 80) || t("teams.thread");

	const threadRequest: ConnectorSaveRequest = {
		key: thread.id,
		name: title,
		source: {
			kind: "text",
			fileName: teamsThreadFileName(thread, channel),
			getContent: () => teamsThreadToMarkdown(thread, team, channel),
		},
	};

	/**
	 * How to save a file attached to the first message or to a reply.
	 *
	 * @param message - The message holding the file.
	 * @return A factory for the file's save request.
	 */
	const attachmentRequests =
		(message: TeamsMessage) =>
		(attachment: TeamsAttachment): ConnectorSaveRequest | null => {
			const attachmentId = attachment.id ?? attachment.name;
			if (!attachmentId) {
				return null;
			}
			const name = attachment.name ?? attachmentId;
			return {
				key: `${message.id}:${attachmentId}`,
				name: name,
				source: {
					kind: "download",
					readSavedPath: readMicrosoftSavedPath,
					fileName: name,
					buildPixel: (fileName) =>
						MICROSOFT_PIXELS.teamsDownloadAttachment({
							teamId: team.id,
							channelId: channel.id,
							messageId: thread.id,
							replyId:
								message.id === thread.id
									? undefined
									: message.id,
							attachmentId: attachmentId,
							fileName: fileName,
						}),
				},
			};
		};

	return (
		<ConnectorDetailView
			title={title}
			backLabel={t("teams.backTo", { channel: channel.displayName })}
			onBack={onBack}
			fields={[
				{ label: t("teams.team"), value: team.displayName },
				{ label: t("teams.channel"), value: channel.displayName },
				{
					label: t("teams.startedBy"),
					value: thread.fromName ?? t("teams.someone"),
				},
				{
					label: t("teams.started"),
					value: formatFullDate(
						thread.createdDateTime,
						i18n.language,
					),
				},
			]}
			actions={
				<ConnectorActionBar
					serviceName={serviceName}
					saveLabel={saver.saveLabel}
					webUrl={thread.webUrl}
					isBusy={saver.isBusy(threadRequest.key)}
					onAddToContext={
						saver.addToContext
							? () => saver.addToContext?.(threadRequest)
							: undefined
					}
					onSave={() => saver.save(threadRequest)}
				/>
			}
		>
			<div className="flex flex-col gap-2">
				{[thread, ...thread.replies].map((message) => (
					<TeamsMessageItem
						key={message.id}
						message={message}
						saver={saver}
						serviceName={serviceName}
						getAttachmentRequest={attachmentRequests(message)}
					/>
				))}
			</div>
		</ConnectorDetailView>
	);
};
