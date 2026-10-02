import {
	LogInIcon,
	RefreshCwIcon,
	Settings2Icon,
	ShieldAlertIcon,
	TriangleAlertIcon,
	WrenchIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { type ReactNode, useId } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	H3,
	H4,
	Muted,
	ScrollArea,
	Skeleton,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useRoom } from "@/contexts/room.context";
import { splitMcpByType } from "@/utility/mcp-utils";
import {
	CONNECTOR_PROVIDERS,
	CONNECTOR_SERVICES,
	type ConnectorProviderId,
	type ConnectorService,
	findConnectorTool,
	getConnectorToolTitle,
} from "../connectors/connector.catalog";
import { signInToProvider } from "../connectors/connector-sign-in";
import { useConnectProvider } from "../connectors/use-connect-provider";
import { type ChatToolInfo, listToolParameters } from "../tools/chat-tool-info";
import { useRoomToolbox } from "../use-room-toolbox";
import { useTeamworkLogins } from "../use-teamwork-logins";
import { ConnectorServiceIcon } from "./connector-service-icon";
import {
	TeamworkChatToolGroupRow,
	TeamworkChatToolRow,
} from "./teamwork-chat-tool-row";

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

/** Placeholder rows while the toolbox loads. */
const SKELETON_ROWS = ["a", "b", "c"];

/** The bordered list every group of rows sits in, as in Room Settings. */
const LIST_CLASS_NAME =
	"flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border";

/** Props for {@link ChatToolsSection}. */
interface ChatToolsSectionProps {
	/** The section's heading. */
	title: string;
	/** How many tools or toolboxes it holds, when it lists any. */
	count?: number;
	/** What the section holds. */
	description?: string;
	/** Controls beside the heading. */
	actions?: ReactNode;
	children?: ReactNode;
}

/**
 * One group of the panel, headed the way Room Settings heads its Knowledge
 * and Tools: the title and its count, with any actions at the end.
 */
const ChatToolsSection = ({
	title,
	count,
	description,
	actions,
	children,
}: ChatToolsSectionProps) => {
	const headingId = useId();
	return (
		<section
			aria-labelledby={headingId}
			className="flex min-w-0 flex-col gap-3"
		>
			<div className="flex min-w-0 flex-col gap-1">
				<div className="flex min-w-0 items-center justify-between gap-2">
					<H4
						id={headingId}
						className="flex min-w-0 items-center gap-2 text-base"
					>
						<span className="truncate">{title}</span>
						{count !== undefined && (
							<Badge variant="secondary">{count}</Badge>
						)}
					</H4>
					{actions}
				</div>
				{description && (
					<Muted className="font-normal">{description}</Muted>
				)}
			</div>
			{children}
		</section>
	);
};

/** Props for {@link ChatToolList}. */
interface ChatToolListProps {
	/** The tools, in the order they are shown. */
	tools: ChatToolInfo[];
}

/** Tools as one bordered list of rows that open to their details. */
const ChatToolList = ({ tools }: ChatToolListProps) => (
	<ul className={LIST_CLASS_NAME}>
		{tools.map((tool) => (
			<TeamworkChatToolRow key={tool.name} tool={tool} />
		))}
	</ul>
);

/**
 * Every tool the assistant has for the next message, by where it comes from:
 * in a chat, the default tools this browser adds to each message and runs
 * itself, or in an agent room, a note that its runs bring their own; then the
 * tools in the chat's own toolbox, and the toolboxes the user added. Each tool
 * says whether it runs on its own or asks first, and opens to show what the
 * model is told about it.
 */
const TeamworkToolsPanel = observer(() => {
	const room = useRoom();
	const { teamwork } = room;
	const { t, i18n } = useTranslation("teamwork");
	const handleSignIn = useConnectProvider(signInToProvider);
	// sign ins made or lost in another tab show up when the window is focused
	useTeamworkLogins(teamwork);
	// read again once a connector change has been written to the toolbox
	const toolbox = useRoomToolbox(
		room,
		`${teamwork.connectors.join(",")}:${teamwork.isSavingConnectors}`,
	);

	const defaultTools: ChatToolInfo[] = teamwork.chatToolDefinitions.map(
		(definition) => ({
			name: definition.name,
			title: t(`tools.titles.${definition.name}`),
			description: definition.description,
			execution:
				teamwork.getDefaultToolMode(definition.name) === "auto"
					? "auto"
					: "ask",
			parameters: listToolParameters(definition.inputSchema),
		}),
	);

	// The toolbox's connector tools under their service, by service name, then
	// anything else the room's toolbox holds. A tool belongs to a service when
	// the reactor it runs is one the catalog lists for it, whatever the tool is
	// called, so a tool the user wrote that runs some other reactor lands under
	// Other Tools.
	const list = new Intl.ListFormat(i18n.language, { type: "conjunction" });

	/**
	 * Why a service's tools cannot run right now, if anything stops them.
	 * Nothing is said about the sign in until the logins have been read.
	 */
	const getAccessIssue = (service: ConnectorService): AccessIssue | null => {
		if (!teamwork.isProviderOffered(service.provider)) {
			return "notOffered";
		}
		if (!teamwork.isServiceCovered(service.id)) {
			return "notCovered";
		}
		const connected = teamwork.connectedProviders;
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
			account: t(`providers.${providerId}.name`),
			services: list.format(serviceNames),
		};
		return issue === "signIn"
			? t("signIn.notice", values)
			: issue === "notOffered"
				? t("signIn.notOffered", values)
				: t("scopes.notice", values);
	};

	const serviceGroups = CONNECTOR_SERVICES.map((service) => {
		const label = t(`services.${service.id}.name`);
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
			label: t("chatTools.otherTools"),
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

	const addedToolboxes = splitMcpByType(room.options.mcp).toolbox.filter(
		(mcp) => !mcp.fromRoom,
	);

	return (
		<ScrollArea className="h-full">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
				<div className="flex flex-col gap-2">
					<H3>{t("chatTools.panelTitle")}</H3>
					<Muted className="font-normal">
						{t("chatTools.description")}
					</Muted>
				</div>

				{teamwork.isAgentMode ? (
					<ChatToolsSection
						title={t("chatTools.agentTitle")}
						description={t("chatTools.agentDescription")}
					/>
				) : (
					<ChatToolsSection
						title={t("chatTools.defaultTitle")}
						count={defaultTools.length}
						description={t("chatTools.defaultDescription")}
						actions={
							<Button
								variant="outline"
								size="sm"
								onClick={teamwork.openRoomSettings}
							>
								<Settings2Icon aria-hidden />
								{t("chatTools.openSettings")}
							</Button>
						}
					>
						{defaultTools.length > 0 ? (
							<ChatToolList tools={defaultTools} />
						) : (
							<Muted className="font-normal">
								{t("chatTools.defaultEmpty")}
							</Muted>
						)}
					</ChatToolsSection>
				)}

				<ChatToolsSection
					title={t("chatTools.toolboxTitle")}
					count={toolbox.tools.length}
					description={t("chatTools.toolboxDescription")}
					actions={
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={t("common.refresh")}
									onClick={toolbox.reload}
								>
									<RefreshCwIcon aria-hidden />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{t("common.refresh")}
							</TooltipContent>
						</Tooltip>
					}
				>
					{toolbox.status === "loading" &&
					toolbox.tools.length === 0 ? (
						<div className="flex flex-col gap-2">
							{SKELETON_ROWS.map((row) => (
								<Skeleton key={row} className="h-12 w-full" />
							))}
						</div>
					) : toolbox.status === "error" ? (
						<Alert variant="destructive">
							<TriangleAlertIcon aria-hidden />
							<AlertTitle>
								{t("chatTools.toolboxError")}
							</AlertTitle>
							<AlertDescription>
								<Button
									variant="outline"
									size="sm"
									className="mt-2"
									onClick={toolbox.reload}
								>
									{t("common.retry")}
								</Button>
							</AlertDescription>
						</Alert>
					) : toolboxGroups.length === 0 ? (
						<Muted className="font-normal">
							{t("chatTools.toolboxEmpty")}
						</Muted>
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
													{t("signIn.action")}
												</Button>
											)}
										</li>
									))}
								</ul>
							)}
							<ul className={LIST_CLASS_NAME}>
								{toolboxGroups.map((group) => (
									<TeamworkChatToolGroupRow
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

				<ChatToolsSection
					title={t("chatTools.addedTitle")}
					count={addedToolboxes.length}
					description={
						addedToolboxes.length > 0
							? t("chatTools.addedDescription")
							: undefined
					}
				>
					{addedToolboxes.length === 0 ? (
						<Muted className="font-normal">
							{t("chatTools.addedEmpty")}
						</Muted>
					) : (
						<ul className={LIST_CLASS_NAME}>
							{addedToolboxes.map((mcp) => (
								<li
									key={mcp.id}
									className="truncate px-3 py-2 font-medium text-sm"
									title={mcp.name}
								>
									{mcp.name || mcp.id}
								</li>
							))}
						</ul>
					)}
				</ChatToolsSection>
			</div>
		</ScrollArea>
	);
});

/** The tools the assistant has for the next message. One per sidebar. */
export const TEAMWORK_TOOLS_PANEL: WorkbenchPanelConfig = {
	name: "Chat Tools",
	icon: ({ className }) => <WrenchIcon className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: TeamworkToolsPanel,
};
