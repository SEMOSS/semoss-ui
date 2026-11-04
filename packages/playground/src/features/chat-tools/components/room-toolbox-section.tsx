import {
	LogInIcon,
	RefreshCwIcon,
	Settings2Icon,
	ShieldAlertIcon,
	WrenchIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ConnectorServiceIcon } from "@/features/connectors/components/connector-service-icon";
import {
	CONNECTOR_PROVIDERS,
	CONNECTOR_SERVICES,
	type ConnectorProviderId,
	type ConnectorService,
	findConnectorTool,
	getConnectorToolTitle,
} from "@/features/connectors/connector.catalog";
import { signInToProvider } from "@/features/connectors/connector-sign-in";
import { useConnectProvider } from "@/features/connectors/use-connect-provider";
import { useConnectorLogins } from "@/features/connectors/use-connector-logins";
import { useSettingsDialog } from "@/features/settings/settings-dialog.context";
import type { RoomStore } from "@/stores/room/room.store";
import { useRoomToolbox } from "../use-room-toolbox";
import { ChatToolGroupRow } from "./chat-tool-group-row";
import { CHAT_TOOL_LIST_CLASS_NAME } from "./chat-tool-list";
import { ChatToolListStatus } from "./chat-tool-list-status";
import { ChatToolsSection } from "./chat-tools-section";

/**
 * Why a connector's tools cannot run: the session is not signed in to its
 * account, the server offers no sign in for that account, or the server's sign
 * in does not allow the app. Only the first is fixed by signing in.
 */
type AccessIssue = "signIn" | "notOffered" | "notCovered";

/** The order the panel explains access issues in. */
const ACCESS_ISSUES: readonly AccessIssue[] = [
	"signIn",
	"notOffered",
	"notCovered",
];

/** Props for {@link RoomToolboxSection}. */
export interface RoomToolboxSectionProps {
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
export const RoomToolboxSection = observer(
	({ room }: RoomToolboxSectionProps) => {
		const { connectors } = room;
		const { t, i18n } = useTranslation([
			"chatTools",
			"chatConnectors",
			"common",
		]);
		const handleSignIn = useConnectProvider(signInToProvider);
		const { openSettings } = useSettingsDialog();
		// sign ins made or lost in another tab show up when the window is focused
		useConnectorLogins(connectors);
		// read again once a connector change has been written to the toolbox
		const toolbox = useRoomToolbox(
			room,
			`${connectors.services.join(",")}:${connectors.isSavingConnectors}`,
		);

		// The toolbox's connector tools under their service, by service name, then
		// anything else the room's toolbox holds. A tool belongs to a service when
		// the reactor it runs is one the catalog lists for it, whatever the tool is
		// called, so a tool the user wrote that runs some other reactor lands under
		// Other Tools.
		const list = new Intl.ListFormat(i18n.language, {
			type: "conjunction",
		});

		/**
		 * Why a service's tools cannot run right now, if anything stops them.
		 * Nothing is said about the sign in until the logins have been read.
		 */
		const getAccessIssue = (
			service: ConnectorService,
		): AccessIssue | null => {
			if (!connectors.isProviderOffered(service.provider)) {
				return "notOffered";
			}
			if (!connectors.isServiceCovered(service.id)) {
				return "notCovered";
			}
			const connected = connectors.connectedProviders;
			return connected !== null && !connected.includes(service.provider)
				? "signIn"
				: null;
		};

		/** The sentence the chat input's notice uses for the same problem. */
		const describeAccessIssue = (
			issue: AccessIssue,
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

		const serviceGroups = CONNECTOR_SERVICES.map((service) => {
			const label = t(`chatConnectors:services.${service.id}.name`);
			const issue = getAccessIssue(service);
			return {
				key: service.id,
				label: label,
				provider: service.provider,
				issue: issue,
				warning: issue
					? describeAccessIssue(issue, service.provider, [label])
					: undefined,
				icon: (
					<ConnectorServiceIcon
						serviceId={service.id}
						className="size-4 shrink-0"
					/>
				),
				tools: toolbox.tools
					.filter(
						(tool) =>
							findConnectorTool(tool.reactor)?.service.id ===
							service.id,
					)
					.map((tool) => ({
						...tool,
						title: getConnectorToolTitle(tool.reactor, tool.title),
					})),
			};
		}).sort((first, second) => first.label.localeCompare(second.label));

		// one notice per account and problem, naming every app in the toolbox it
		// stops, with a sign in where that fixes it
		const accessNotices = CONNECTOR_PROVIDERS.flatMap((provider) =>
			ACCESS_ISSUES.flatMap((issue) => {
				const names = serviceGroups
					.filter(
						(group) =>
							group.tools.length > 0 &&
							group.provider === provider.id &&
							group.issue === issue,
					)
					.map((group) => group.label);
				return names.length > 0
					? [
							{
								key: `${issue}-${provider.id}`,
								providerId: provider.id,
								issue: issue,
								text: describeAccessIssue(
									issue,
									provider.id,
									names,
								),
							},
						]
					: [];
			}),
		);
		const toolboxGroups = [
			...serviceGroups,
			{
				key: "other",
				label: t("panel.otherTools"),
				icon: (
					<WrenchIcon
						aria-hidden
						className="size-4 shrink-0 text-muted-foreground"
					/>
				),
				warning: undefined,
				tools: toolbox.tools.filter(
					(tool) => !findConnectorTool(tool.reactor),
				),
			},
		].filter((group) => group.tools.length > 0);

		return (
			<ChatToolsSection
				level={5}
				title={t("panel.connectorsTitle")}
				count={toolboxGroups.length}
				tooltip={t("panel.toolboxDescription")}
				actions={
					<>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={t("common:buttons.refresh")}
									onClick={toolbox.reload}
								>
									<RefreshCwIcon aria-hidden />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{t("common:buttons.refresh")}
							</TooltipContent>
						</Tooltip>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => openSettings("connectors")}
						>
							<Settings2Icon aria-hidden />
							{t("panel.manageConnectors")}
						</Button>
					</>
				}
			>
				{toolbox.status === "loading" && toolbox.tools.length === 0 ? (
					<ul className={CHAT_TOOL_LIST_CLASS_NAME}>
						<ChatToolListStatus status="loading" />
					</ul>
				) : toolbox.status === "error" ? (
					<ul className={CHAT_TOOL_LIST_CLASS_NAME}>
						<ChatToolListStatus
							status="error"
							message={t("panel.toolboxError")}
							onRetry={toolbox.reload}
						/>
					</ul>
				) : toolboxGroups.length === 0 ? (
					<ul className={CHAT_TOOL_LIST_CLASS_NAME}>
						<ChatToolListStatus
							status="empty"
							message={t("panel.toolboxEmpty")}
						/>
					</ul>
				) : (
					<>
						{accessNotices.length > 0 && (
							// styled as the chat input's sign in notice
							<ul className="flex flex-col divide-y divide-warning/30 overflow-hidden rounded-md border border-warning/30 bg-warning/10">
								{accessNotices.map((notice) => (
									<li
										key={notice.key}
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
											{notice.text}
										</span>
										{notice.issue === "signIn" && (
											<Button
												size="sm"
												className="shrink-0"
												onClick={() =>
													handleSignIn(
														notice.providerId,
													)
												}
											>
												{t(
													"chatConnectors:signIn.action",
												)}
											</Button>
										)}
									</li>
								))}
							</ul>
						)}
						<ul className={CHAT_TOOL_LIST_CLASS_NAME}>
							{toolboxGroups.map((group) => (
								<ChatToolGroupRow
									key={group.key}
									label={group.label}
									icon={group.icon}
									tools={group.tools}
									warning={group.warning}
									defaultOpen={toolboxGroups.length === 1}
								/>
							))}
						</ul>
					</>
				)}
			</ChatToolsSection>
		);
	},
);
