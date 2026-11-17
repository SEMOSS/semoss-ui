import {
	LogInIcon,
	RefreshCwIcon,
	Settings2Icon,
	ShieldAlertIcon,
	WrenchIcon,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { Button } from "@semoss/ui/next";
import { useChatConfig } from "../../chat/config/use-chat-config";
import { signInToProvider } from "../../connectors/accounts/connector-sign-in";
import { useConnectProvider } from "../../connectors/accounts/use-connect-provider";
import { useConnectorLogins } from "../../connectors/accounts/use-connector-logins";
import type { ConnectorProviderId } from "../../connectors/store/connector-catalog";
import { useConnectors } from "../../connectors/store/use-connectors";
import { ConnectorServiceIcon } from "../../connectors/viewers/connector-service-icon";
import type { RoomStore } from "../../room/store/room.store";
import {
	type ConnectorAccessIssue,
	groupConnectorTools,
} from "../../tools/chat-tools/group-connector-tools";
import { ChatToolRow } from "./chat-tool-row";
import { RoomToolsSection } from "./room-tools-section";
import { ToolGroupRow } from "./tool-group-row";
import { ToolList } from "./tool-list";
import { TooltipIconButton } from "./tooltip-icon-button";
import { useRoomToolbox } from "./use-room-toolbox";

/** The sentence for each reason a connector's tools cannot run, as the chat input's notice says it. */
const ACCESS_ISSUE_KEYS: Record<ConnectorAccessIssue, string> = {
	signIn: "chatConnectors:signIn.notice",
	notOffered: "chatConnectors:signIn.notOffered",
	notCovered: "chatConnectors:scopes.notice",
};

/** Props for {@link RoomToolsConnectorsSection}. */
interface RoomToolsConnectorsSectionProps {
	/** The room whose own toolbox is listed. */
	room: RoomStore;
}

/**
 * Settings' Connectors section, the tools in the chat's own toolbox: its
 * connector tools under their service, then anything else it holds. Each tool
 * says whether it runs on its own or asks first, and opens to show what the
 * model is told about it. A connector whose tools cannot run says why, with a
 * sign in where that fixes it. Connectors are switched on for the user in the
 * settings dialog, which the section links to.
 */
export const RoomToolsConnectorsSection = ({
	room,
}: RoomToolsConnectorsSectionProps) => {
	const { connectors } = room;
	const { t, i18n } = useTranslation([
		"chatTools",
		"chatConnectors",
		"common",
	]);
	const handleSignIn = useConnectProvider(signInToProvider);
	const { openSettings } = useChatConfig().navigation;
	// sign ins made or lost in another tab show up when the window is focused
	useConnectorLogins(connectors);
	useConnectors(connectors);
	// read again once a connector change has been written to the toolbox
	const toolbox = useRoomToolbox(
		room,
		`${connectors.services.join(",")}:${connectors.isSavingConnectors}`,
	);
	const { groups, otherTools, notices } = groupConnectorTools(
		toolbox.tools,
		connectors,
		(service) => t(`chatConnectors:services.${service.id}.name`),
	);
	const list = new Intl.ListFormat(i18n.language, {
		type: "conjunction",
	});
	// one row per connector service, then one for the rest of the toolbox
	const groupRows = [
		...groups.map((group) => ({
			key: group.service.id,
			label: group.label,
			icon: (
				<ConnectorServiceIcon
					serviceId={group.service.id}
					className="size-4 shrink-0"
				/>
			),
			tools: group.tools,
			issue: group.issue
				? { issue: group.issue, providerId: group.service.provider }
				: null,
		})),
		...(otherTools.length > 0
			? [
					{
						key: "",
						label: t("sections.connectors.otherTools"),
						icon: (
							<WrenchIcon
								aria-hidden
								className="size-4 shrink-0 text-muted-foreground"
							/>
						),
						tools: otherTools,
						issue: null,
					},
				]
			: []),
	];
	const groupCount = groupRows.length;

	/**
	 * The sentence the chat input's notice uses for the same problem.
	 *
	 * @param issue - Why the tools cannot run.
	 * @param providerId - The account they need.
	 * @param serviceNames - The connectors it affects.
	 * @returns The sentence.
	 */
	const describeAccessIssue = (
		issue: ConnectorAccessIssue,
		providerId: ConnectorProviderId,
		serviceNames: string[],
	): string =>
		t(ACCESS_ISSUE_KEYS[issue], {
			account: t(`chatConnectors:providers.${providerId}.name`),
			services: list.format(serviceNames),
		});

	return (
		<RoomToolsSection
			title={t("sections.connectors.title")}
			count={groupCount}
			tooltip={t("sections.connectors.tooltip")}
			actions={
				<>
					<TooltipIconButton
						label={t("common:buttons.refresh")}
						icon={<RefreshCwIcon aria-hidden />}
						onClick={toolbox.load}
					/>
					{openSettings ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => openSettings("connectors")}
						>
							<Settings2Icon aria-hidden />
							{t("sections.connectors.manage")}
						</Button>
					) : null}
				</>
			}
		>
			{notices.length > 0 && toolbox.status !== "error" ? (
				// styled as the chat input's sign in notice
				<ul className="flex flex-col divide-y divide-warning/30 overflow-hidden rounded-md border border-warning/30 bg-warning/10">
					{notices.map((notice) => (
						<li
							key={`${notice.issue}-${notice.providerId}`}
							className="flex min-w-0 items-center gap-2 px-3 py-2"
						>
							{notice.issue === "signIn" ? (
								<LogInIcon
									aria-hidden
									className="size-4 shrink-0 text-warning"
								/>
							) : (
								<ShieldAlertIcon
									aria-hidden
									className="size-4 shrink-0 text-warning"
								/>
							)}
							<span className="min-w-0 flex-1 text-sm">
								{describeAccessIssue(
									notice.issue,
									notice.providerId,
									notice.serviceNames,
								)}
							</span>
							{notice.issue === "signIn" ? (
								<Button
									type="button"
									size="sm"
									className="shrink-0"
									onClick={() =>
										handleSignIn(notice.providerId)
									}
								>
									{t("chatConnectors:signIn.action")}
								</Button>
							) : null}
						</li>
					))}
				</ul>
			) : null}
			<ToolList
				status={toolbox.status}
				isEmpty={groupCount === 0}
				errorMessage={t("sections.connectors.error")}
				emptyMessage={t("sections.connectors.empty")}
				onRetry={toolbox.load}
			>
				{groupRows.map((row) => (
					<ToolGroupRow
						key={row.key}
						label={row.label}
						icon={row.icon}
						count={row.tools.length}
						warning={
							row.issue
								? describeAccessIssue(
										row.issue.issue,
										row.issue.providerId,
										[row.label],
									)
								: undefined
						}
						defaultOpen={groupCount === 1}
					>
						<ToolList variant="group">
							{row.tools.map((tool) => (
								<ChatToolRow key={tool.name} tool={tool} />
							))}
						</ToolList>
					</ToolGroupRow>
				))}
			</ToolList>
		</RoomToolsSection>
	);
};
