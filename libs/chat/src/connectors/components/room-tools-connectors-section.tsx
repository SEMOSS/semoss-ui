import {
	LogInIcon,
	RefreshCwIcon,
	Settings2Icon,
	ShieldAlertIcon,
	WrenchIcon,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { useObservableStore } from "@semoss/sdk/react";
import { Button } from "@semoss/ui/next";
import { ChatToolRow } from "../../features/chat-tools-ui/components/chat-tool-row";
import { RoomToolsSection } from "../../features/chat-tools-ui/components/room-tools-section";
import { ToolGroupRow } from "../../features/chat-tools-ui/components/tool-group-row";
import { ToolList } from "../../features/chat-tools-ui/components/tool-list";
import { TooltipIconButton } from "../../features/chat-tools-ui/components/tooltip-icon-button";
import { useRoomToolbox } from "../../features/chat-tools-ui/use-room-toolbox";
import { useOpenSettings } from "../../features/settings/use-open-settings";
import { toRoomUiStore } from "../../features/workbench/room-ui.store";
import type { RoomIntegrationSlotProps } from "../../host/room-integration";
import type { ConnectorProviderId } from "../connector.catalog";
import { signInToProvider } from "../connector-sign-in";
import {
	type ConnectorAccessIssue,
	groupConnectorTools,
} from "../group-connector-tools";
import {
	CONNECTORS_SETTINGS_PAGE_ID,
	requireRoomConnectors,
} from "../room-connectors";
import { useConnectProvider } from "../use-connect-provider";
import { useConnectorLogins } from "../use-connector-logins";
import { ConnectorServiceIcon } from "./connector-service-icon";

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
}: RoomIntegrationSlotProps) => {
	const connectors = requireRoomConnectors(room);
	// what the groups and notices below read of the connectors
	const { services, isSavingConnectors } = useObservableStore(
		connectors,
		(store) => ({
			services: store.services,
			isSavingConnectors: store.isSavingConnectors,
			connectedProviders: store.connectedProviders,
			offeredProviders: store.offeredProviders,
			connectorAccess: store.connectorAccess,
			dismissedSignIns: store.dismissedSignIns,
		}),
		{
			services: [],
			isSavingConnectors: false,
			connectedProviders: null,
			offeredProviders: null,
			connectorAccess: null,
			dismissedSignIns: [],
		},
	);
	const { t, i18n } = useTranslation([
		"chatTools",
		"chatConnectors",
		"common",
	]);
	const handleSignIn = useConnectProvider(signInToProvider);
	const openSettings = useOpenSettings();
	// sign ins made or lost in another tab show up when the window is focused
	useConnectorLogins(connectors);
	// read again once a connector change has been written to the toolbox
	const toolbox = useRoomToolbox(
		toRoomUiStore(room),
		`${services.join(",")}:${isSavingConnectors}`,
	);
	const { groups, otherTools, notices } = groupConnectorTools(
		toolbox.tools,
		connectors,
		(service) => t(`chatConnectors:services.${service.id}.name`),
	);
	const list = new Intl.ListFormat(i18n.language, {
		type: "conjunction",
	});
	const groupCount = groups.length + (otherTools.length > 0 ? 1 : 0);

	/** The sentence the chat input's notice uses for the same problem. */
	const describeAccessIssue = (
		issue: ConnectorAccessIssue,
		providerId: ConnectorProviderId,
		serviceNames: string[],
	): string => {
		const values = {
			account: t(`chatConnectors:providers.${providerId}.name`),
			services: list.format(serviceNames),
		};
		return issue === "signIn"
			? t("chatConnectors:signIn.notice", values)
			: issue === "notOffered"
				? t("chatConnectors:signIn.notOffered", values)
				: t("chatConnectors:scopes.notice", values);
	};

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
					{/* a host with no settings to open offers no link */}
					{openSettings && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() =>
								openSettings(CONNECTORS_SETTINGS_PAGE_ID)
							}
						>
							<Settings2Icon aria-hidden />
							{t("sections.connectors.manage")}
						</Button>
					)}
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
				{groups.map((group) => (
					<ToolGroupRow
						key={group.service.id}
						label={group.label}
						icon={
							<ConnectorServiceIcon
								serviceId={group.service.id}
								className="size-4 shrink-0"
							/>
						}
						count={group.tools.length}
						warning={
							group.issue
								? describeAccessIssue(
										group.issue,
										group.service.provider,
										[group.label],
									)
								: undefined
						}
						defaultOpen={groupCount === 1}
					>
						<ToolList variant="group">
							{group.tools.map((tool) => (
								<ChatToolRow key={tool.name} tool={tool} />
							))}
						</ToolList>
					</ToolGroupRow>
				))}
				{otherTools.length > 0 ? (
					<ToolGroupRow
						label={t("sections.connectors.otherTools")}
						icon={
							<WrenchIcon
								aria-hidden
								className="size-4 shrink-0 text-muted-foreground"
							/>
						}
						count={otherTools.length}
						defaultOpen={groupCount === 1}
					>
						<ToolList variant="group">
							{otherTools.map((tool) => (
								<ChatToolRow key={tool.name} tool={tool} />
							))}
						</ToolList>
					</ToolGroupRow>
				) : null}
			</ToolList>
		</RoomToolsSection>
	);
};
