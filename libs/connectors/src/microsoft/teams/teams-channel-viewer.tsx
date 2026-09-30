import {
	MessageSquareIcon,
	MessagesSquareIcon,
	PaperclipIcon,
	RefreshCwIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { cn, Muted } from "@semoss/ui/next";
import { ConnectorIconButton } from "../../components/connector-icon-button";
import { ConnectorItemRow } from "../../components/connector-item-row";
import { ConnectorList } from "../../components/connector-list";
import { ConnectorViewerHeader } from "../../components/connector-viewer-header";
import { ConnectorViewerStatus } from "../../components/connector-viewer-status";
import { formatListDate } from "../../core/connector.format";
import type { ConnectorViewerProps } from "../../core/connector.types";
import { useConnectorQuery } from "../../core/use-connector-query";
import {
	type ConnectorSaveRequest,
	useConnectorSaver,
} from "../../core/use-connector-saver";
import { useReturnFocus } from "../../core/use-return-focus";
import {
	teamsMessageTitle,
	teamsThreadFileName,
	teamsThreadToMarkdown,
} from "../microsoft.markdown";
import { parseChannelMessages } from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { TeamsMessage } from "../microsoft.types";
import { TeamsChannelPicker } from "./teams-channel-picker";
import { TeamsThreadDetail } from "./teams-thread-detail";
import { useTeamsChannelChoice } from "./use-teams-channel-choice";

/** How many threads a channel reads at first, and how many more each time. */
const PAGE_SIZE = 20;

/** The most threads read at once. */
const MAX_THREADS = 100;

/** Props for {@link TeamsChannelViewer}. */
export type TeamsChannelViewerProps = ConnectorViewerProps;

/**
 * Read a Teams channel: pick a team and channel, see its newest threads, open
 * one with its replies, and bring it or its files into the insight.
 */
export const TeamsChannelViewer = (props: TeamsChannelViewerProps) => {
	const { onSignIn } = props;
	const { t, i18n } = useTranslation("connectors");
	const saver = useConnectorSaver("teams-channels", props);
	const choice = useTeamsChannelChoice();
	const { team, channel } = choice;
	const [limit, setLimit] = useState(PAGE_SIZE);
	const [openThreadId, setOpenThreadId] = useState<string | null>(null);
	const serviceName = t("services.teamsChannels");

	const query = useConnectorQuery(
		team && channel
			? MICROSOFT_PIXELS.teamsListChannelMessages({
					teamId: team.id,
					channelId: channel.id,
					limit: limit,
				})
			: null,
		parseChannelMessages,
		{ listKey: `${team?.id}|${channel?.id}` },
	);
	const openThread =
		query.data?.messages.find((thread) => thread.id === openThreadId) ??
		null;
	const { listRef, rememberItem } = useReturnFocus(openThread !== null);

	const threadRequest = (thread: TeamsMessage): ConnectorSaveRequest => ({
		key: thread.id,
		name: teamsMessageTitle(thread, 80) || t("teams.thread"),
		source: {
			kind: "text",
			fileName: teamsThreadFileName(thread, channel ?? undefined),
			getContent: () =>
				teamsThreadToMarkdown(
					thread,
					team ?? undefined,
					channel ?? undefined,
				),
		},
	});

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
		return (
			<ConnectorList
				query={{ ...query, data: query.data?.messages ?? null }}
				serviceName={serviceName}
				emptyIcon={MessagesSquareIcon}
				onSignIn={onSignIn}
				listRef={listRef}
				isFull={(query.data?.readCount ?? 0) >= limit}
				emptyText={t("teams.emptyChannel")}
				onShowMore={
					limit < MAX_THREADS
						? () =>
								setLimit((previous) =>
									Math.min(previous + PAGE_SIZE, MAX_THREADS),
								)
						: undefined
				}
			>
				{(threads) =>
					threads.map((thread) => {
						const request = threadRequest(thread);
						const isBusy = saver.isBusy(request.key);
						const title = thread.isDeleted
							? t("teams.deleted")
							: teamsMessageTitle(thread) || t("teams.noText");
						const author = thread.fromName ?? t("teams.someone");
						const hasFiles = thread.attachments.some(
							(attachment) => attachment.isFile,
						);
						return (
							<ConnectorItemRow
								key={thread.id}
								itemKey={thread.id}
								icon={
									hasFiles ? (
										<PaperclipIcon
											aria-hidden
											className="size-4"
										/>
									) : (
										<MessageSquareIcon
											aria-hidden
											className="size-4"
										/>
									)
								}
								title={title}
								description={
									thread.replies.length > 0
										? t("teams.authorWithReplies", {
												author: author,
												count: thread.replies.length,
											})
										: author
								}
								meta={formatListDate(
									thread.createdDateTime,
									i18n.language,
								)}
								openLabel={t("teams.openThread", {
									author: author,
									title: title,
								})}
								isBusy={isBusy}
								onOpen={() => {
									rememberItem(thread.id);
									setOpenThreadId(thread.id);
								}}
								actions={{
									itemName: title,
									serviceName: t("services.teams"),
									webUrl: thread.webUrl,
									saveLabel: saver.saveLabel,
									isBusy: isBusy,
									onAddToContext: saver.addToContext
										? () => saver.addToContext?.(request)
										: undefined,
									onSave: () => saver.save(request),
								}}
							/>
						);
					})
				}
			</ConnectorList>
		);
	};

	return (
		<div className="@container flex h-full min-h-0 flex-col">
			<div
				className={cn(
					"flex h-full min-h-0 flex-col",
					openThread !== null && "hidden",
				)}
			>
				<ConnectorViewerHeader
					brand="teams"
					icon={MessagesSquareIcon}
					title={serviceName}
					description={
						team && channel
							? t("teams.teamAndChannel", {
									team: team.displayName,
									channel: channel.displayName,
								})
							: undefined
					}
				>
					<ConnectorIconButton
						icon={RefreshCwIcon}
						label={t("common.refresh")}
						isSpinning={query.isRefreshing}
						onClick={query.reload}
						disabled={!channel}
					/>
				</ConnectorViewerHeader>
				{choice.teamsQuery.status === "ready" && team ? (
					<div className="border-border border-b bg-muted/10 px-3 py-2">
						<TeamsChannelPicker
							choice={{
								...choice,
								chooseTeam: (teamId) => {
									choice.chooseTeam(teamId);
									setLimit(PAGE_SIZE);
								},
								chooseChannel: (channelId) => {
									choice.chooseChannel(channelId);
									setLimit(PAGE_SIZE);
								},
							}}
						/>
					</div>
				) : null}
				{renderBody()}
			</div>

			{openThread && team && channel ? (
				<TeamsThreadDetail
					key={openThread.id}
					thread={openThread}
					team={team}
					channel={channel}
					saver={saver}
					onBack={() => setOpenThreadId(null)}
				/>
			) : null}
		</div>
	);
};
