import { RefreshCwIcon, TriangleAlertIcon, WrenchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { type ReactNode, useId } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
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
	CONNECTOR_SERVICES,
	findConnectorTool,
} from "../connectors/connector.catalog";
import { type ChatToolInfo, listToolParameters } from "../tools/chat-tool-info";
import { useRoomToolbox } from "../use-room-toolbox";
import { TeamworkChatToolRow } from "./teamwork-chat-tool-row";

/** Placeholder rows while the toolbox loads. */
const SKELETON_ROWS = ["a", "b", "c"];

/** Props for {@link ChatToolsSection}. */
interface ChatToolsSectionProps {
	/** The section's heading. */
	title: string;
	/** How many tools or toolboxes it holds. */
	count: number;
	/** Controls beside the heading. */
	actions?: ReactNode;
	children: ReactNode;
}

/**
 * One group of the panel, headed by what it is and how many it holds.
 */
const ChatToolsSection = ({
	title,
	count,
	actions,
	children,
}: ChatToolsSectionProps) => {
	const headingId = useId();
	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-1">
			<div className="flex min-w-0 items-center gap-2 px-2">
				<h3 id={headingId} className="truncate font-medium text-sm">
					{title}
				</h3>
				<Badge variant="outline" className="shrink-0">
					{count}
				</Badge>
				<span className="flex-1" />
				{actions}
			</div>
			{children}
		</section>
	);
};

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
	const { t } = useTranslation("teamwork");
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

	// the toolbox's connector tools under their service, in catalog order,
	// then anything else the room's toolbox holds
	const toolboxGroups = [
		...CONNECTOR_SERVICES.map((service) => ({
			key: service.id,
			label: t(`services.${service.id}.name`),
			tools: toolbox.tools.filter(
				(tool) =>
					findConnectorTool(tool.reactor)?.service.id === service.id,
			),
		})),
		{
			key: "other",
			label: t("chatTools.otherTools"),
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
			<div className="flex flex-col gap-5 px-2 py-3">
				<Muted className="px-2">{t("chatTools.description")}</Muted>

				{teamwork.isAgentMode ? (
					<section className="flex flex-col gap-1 px-2">
						<h3 className="font-medium text-sm">
							{t("chatTools.agentTitle")}
						</h3>
						<Muted>{t("chatTools.agentDescription")}</Muted>
					</section>
				) : (
					<ChatToolsSection
						title={t("chatTools.defaultTitle")}
						count={defaultTools.length}
						actions={
							<Button
								variant="ghost"
								size="sm"
								onClick={teamwork.openRoomSettings}
							>
								{t("chatTools.openSettings")}
							</Button>
						}
					>
						<Muted className="px-2">
							{defaultTools.length > 0
								? t("chatTools.defaultDescription")
								: t("chatTools.defaultEmpty")}
						</Muted>
						<ul className="flex flex-col">
							{defaultTools.map((tool) => (
								<TeamworkChatToolRow
									key={tool.name}
									tool={tool}
								/>
							))}
						</ul>
					</ChatToolsSection>
				)}

				<ChatToolsSection
					title={t("chatTools.toolboxTitle")}
					count={toolbox.tools.length}
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
					<Muted className="px-2">
						{t("chatTools.toolboxDescription")}
					</Muted>
					{toolbox.status === "loading" &&
					toolbox.tools.length === 0 ? (
						<div className="flex flex-col gap-2 px-2 py-1">
							{SKELETON_ROWS.map((row) => (
								<Skeleton key={row} className="h-8 w-full" />
							))}
						</div>
					) : toolbox.status === "error" ? (
						<Alert variant="destructive" className="mx-2">
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
						<Muted className="px-2">
							{t("chatTools.toolboxEmpty")}
						</Muted>
					) : (
						toolboxGroups.map((group) => (
							<div key={group.key} className="flex flex-col">
								<Muted className="px-2 pt-2 font-medium">
									{group.label}
								</Muted>
								<ul className="flex flex-col">
									{group.tools.map((tool) => (
										<TeamworkChatToolRow
											key={tool.name}
											tool={tool}
										/>
									))}
								</ul>
							</div>
						))
					)}
				</ChatToolsSection>

				<ChatToolsSection
					title={t("chatTools.addedTitle")}
					count={addedToolboxes.length}
				>
					{addedToolboxes.length === 0 ? (
						<Muted className="px-2">
							{t("chatTools.addedEmpty")}
						</Muted>
					) : (
						<>
							<Muted className="px-2">
								{t("chatTools.addedDescription")}
							</Muted>
							<ul className="flex flex-col px-2">
								{addedToolboxes.map((mcp) => (
									<li
										key={mcp.id}
										className="truncate py-1 text-sm"
										title={mcp.name}
									>
										{mcp.name || mcp.id}
									</li>
								))}
							</ul>
						</>
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
