import {
	CheckIcon,
	CircleAlertIcon,
	FolderIcon,
	HourglassIcon,
	LoaderCircleIcon,
	XIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	decideAgentToolAction,
	FOLDER_TOOL_NAMES,
	isAskExecutionMode,
	isFolderToolCall,
	isFolderToolName,
	readToolResponseDetail,
	type ToolCallStore,
} from "@semoss/sdk";
import { useRoomSelector, useToolSelector } from "@semoss/sdk/react";
import { Badge, Button, Small, toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { formatJson } from "@semoss/utility/json";
import { ToolInspector } from "../../tool-inspector/tool-inspector";
import { toRoomUiStore } from "../../workbench/room-ui.store";
import { ToolTextBlock } from "./tool-text-block";
import { ToolValueRow } from "./tool-value-row";

/** Props for {@link ChatToolCard}. */
export interface ChatToolCardProps {
	/** The work folder or connector call to show. */
	tool: ToolCallStore;
	/** `inline` sits in the conversation; `panel` fills a sidebar tab. */
	variant: "inline" | "panel";
}

/** Longest argument shown as a plain value before it becomes a text block. */
const INLINE_VALUE_MAX = 80;

/**
 * An argument value as text.
 *
 * @param value - The raw value.
 * @return Text for display.
 */
const toDisplayText = (value: unknown): string =>
	typeof value === "string" ? value : JSON.stringify(value, null, 2);

/**
 * Whether a boolean argument is set. Models sometimes quote booleans.
 *
 * @param value - The raw value.
 * @return True for `true` or `"true"`.
 */
const isSet = (value: unknown): boolean => value === true || value === "true";

/**
 * A saved tool response for display: the details without the model guidance
 * around them, pretty printed when they are JSON.
 *
 * @param response - The saved response.
 * @return Text for display.
 */
const formatResponse = (response: string): string =>
	formatJson(readToolResponseDetail(response));

/**
 * The card for a work folder or connector call: what it does, whether it is
 * waiting, and what it returned.
 *
 * A call that waits for the user shows Allow and Deny. What happens next
 * depends on where the call came from. In chat, folder calls run here in the
 * browser and connector calls run through the room's toolbox. In an agent run,
 * folder calls run here and resume the run with their result, while connector
 * calls are approved or rejected for the harness to carry out.
 */
export const ChatToolCard = ({ tool, variant }: ChatToolCardProps) => {
	const { t } = useTranslation("chatTools");
	const [decision, setDecision] = useState<"allow" | "deny" | null>(null);

	const room = tool.room;
	const call = useToolSelector(
		tool,
		(store) => ({
			status: store.status,
			pendingAction: store.pendingAction,
			json: store.json,
			parameters: store.parameters,
			message: store.message,
			response: store.response,
			displayName: store.displayName,
		}),
		{
			status: tool.status,
			pendingAction: tool.pendingAction,
			json: tool.json,
			parameters: tool.parameters,
			message: tool.message,
			response: tool.response,
			displayName: tool.displayName,
		},
	);
	const { isAgentRoom } = useRoomSelector(room, (r) => ({
		isAgentRoom: r.mode === "agent",
		// what the folder tools' definitions are built from
		defaultTools: r.options.defaultTools,
	}));
	const json = call.json;
	const args = call.parameters ?? {};
	const isFolder = isFolderToolCall(json);
	// a call a client tool runs here, such as a folder or desktop tool
	const isClientCall = isFolder || room.chatTools.canRun(tool);
	// an integration's call, such as a connector's, shows as it says
	const presentation = isFolder
		? undefined
		: toRoomUiStore(room)
				.integrations.map((integration) =>
					integration.describeToolCall?.(json, {
						status: call.status,
						response: call.response,
					}),
				)
				.find((described) => described !== undefined);
	const Notice = presentation?.Notice;
	const isAsk = isAskExecutionMode(json._meta?.SMSS_MCP_EXECUTION);
	const isWaiting =
		call.status === "INITIAL" &&
		isAsk &&
		(isAgentRoom ? !!call.pendingAction : !!call.message);

	/**
	 * Run a decision, reporting a failure without leaving the buttons stuck.
	 *
	 * @param kind - Which button was pressed.
	 * @param decide - Carries the decision out.
	 */
	const runDecision = async (
		kind: "allow" | "deny",
		decide: () => Promise<unknown>,
	): Promise<void> => {
		setDecision(kind);
		try {
			await decide();
			if (variant === "inline") {
				tool.closeTool();
			}
		} catch (error) {
			toast.error(
				t("card.decisionError", {
					message: getErrorMessage(error, ""),
				}),
			);
		} finally {
			setDecision(null);
		}
	};

	// folder calls only come from chat turns: an agent run brings its own
	// file tools
	const handleAllow = () =>
		runDecision("allow", () => {
			if (isClientCall) {
				return room.chatTools.approveChatTool(tool);
			}
			return isAgentRoom
				? decideAgentToolAction(tool, "submit")
				: room.chatTools.approveConnectorChatTool(tool);
		});

	const handleDeny = () =>
		runDecision("deny", () =>
			isAgentRoom
				? decideAgentToolAction(tool, "reject")
				: room.chatTools.declineChatTool(tool),
		);

	const status = isWaiting
		? {
				label: t("card.status.waiting"),
				icon: <HourglassIcon aria-hidden />,
			}
		: call.status === "LOADING"
			? {
					label: t("card.status.running"),
					icon: (
						<LoaderCircleIcon
							aria-hidden
							className="animate-spin"
						/>
					),
				}
			: call.status === "SUCCESS"
				? {
						label: t("card.status.done"),
						icon: <CheckIcon aria-hidden />,
					}
				: call.status === "ERROR"
					? {
							label: t("card.status.failed"),
							icon: <CircleAlertIcon aria-hidden />,
						}
					: call.status === "CANCELLED"
						? {
								label: t("card.status.notRun"),
								icon: <XIcon aria-hidden />,
							}
						: {
								label: t("card.status.queued"),
								icon: <HourglassIcon aria-hidden />,
							};

	const renderFolderDetails = (): ReactNode => {
		const name = json.name;
		if (!isFolderToolName(name)) {
			return null;
		}
		switch (name) {
			case FOLDER_TOOL_NAMES.WRITE:
				return (
					<>
						<ToolValueRow
							label={t("card.file")}
							value={toDisplayText(args.path)}
						/>
						<ToolTextBlock label={t("card.newContents")}>
							{toDisplayText(args.content ?? "")}
						</ToolTextBlock>
					</>
				);
			case FOLDER_TOOL_NAMES.EDIT:
				return (
					<>
						<ToolValueRow
							label={t("card.file")}
							value={toDisplayText(args.path)}
						/>
						<ToolTextBlock label={t("card.replace")}>
							{toDisplayText(args.old_text ?? "")}
						</ToolTextBlock>
						<ToolTextBlock label={t("card.with")}>
							{toDisplayText(args.new_text ?? "")}
						</ToolTextBlock>
						{isSet(args.replace_all) ? (
							<Small className="text-muted-foreground">
								{t("card.replaceAll")}
							</Small>
						) : null}
					</>
				);
			case FOLDER_TOOL_NAMES.MOVE:
				return (
					<>
						<ToolValueRow
							label={t("card.from")}
							value={toDisplayText(args.from)}
						/>
						<ToolValueRow
							label={t("card.to")}
							value={toDisplayText(args.to)}
						/>
					</>
				);
			case FOLDER_TOOL_NAMES.DELETE:
				return (
					<>
						<ToolValueRow
							label={t("card.path")}
							value={toDisplayText(args.path)}
						/>
						{isSet(args.recursive) ? (
							<Small className="text-warning">
								{t("card.deleteRecursive")}
							</Small>
						) : null}
					</>
				);
			case FOLDER_TOOL_NAMES.SEARCH:
				return (
					<ToolValueRow
						label={t("card.query")}
						value={toDisplayText(args.query)}
					/>
				);
			default:
				return (
					<ToolValueRow
						label={t("card.path")}
						value={json.description || t("card.rootFolder")}
					/>
				);
		}
	};

	const renderArguments = (): ReactNode => {
		const entries = Object.entries(args);
		if (entries.length === 0) {
			return (
				<Small className="text-muted-foreground">
					{t("card.noArguments")}
				</Small>
			);
		}
		return entries.map(([key, value]) => {
			const text = toDisplayText(value);
			return text.length > INLINE_VALUE_MAX || text.includes("\n") ? (
				<ToolTextBlock key={key} label={key}>
					{text}
				</ToolTextBlock>
			) : (
				<ToolValueRow key={key} label={key} value={text} />
			);
		});
	};

	const hasResult =
		!!call.response &&
		(call.status === "SUCCESS" ||
			call.status === "ERROR" ||
			call.status === "CANCELLED");
	const header = (
		<div className="flex min-w-0 items-start gap-3">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
				{presentation?.icon ?? (
					<FolderIcon aria-hidden className="size-4" />
				)}
			</div>
			<div className="flex min-w-0 flex-1 flex-col">
				<span
					className="truncate font-medium text-sm"
					title={call.displayName}
				>
					{call.displayName}
				</span>
				<Small className="truncate text-muted-foreground">
					{presentation?.source ?? t("card.roomFiles")}
				</Small>
			</div>
			<Badge variant="outline" className="shrink-0">
				{status.icon}
				{status.label}
			</Badge>
		</div>
	);

	const footer =
		isWaiting || Notice ? (
			<div className="flex flex-col gap-3">
				{Notice ? <Notice room={room} tool={tool} /> : null}

				{isWaiting ? (
					<div className="flex flex-wrap justify-end gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={decision !== null}
							onClick={handleDeny}
						>
							{decision === "deny"
								? t("card.denying")
								: t("card.deny")}
						</Button>
						<Button
							size="sm"
							disabled={decision !== null}
							onClick={handleAllow}
						>
							{decision === "allow"
								? t("card.allowing")
								: t("card.allow")}
						</Button>
					</div>
				) : null}
			</div>
		) : null;

	if (variant === "panel") {
		const definition = isClientCall
			? room.chatTools.chatToolDefinitions.find(
					(item) => item.name === json.name,
				)
			: undefined;
		return (
			<ToolInspector
				tool={tool}
				header={header}
				response={formatResponse(call.response)}
				description={definition?.description}
				inputSchema={definition?.inputSchema}
				footer={
					isWaiting || Notice ? (
						<div className="space-y-3">
							{isWaiting && (
								<Small className="text-muted-foreground">
									{isFolder
										? t("card.folderApproval")
										: (presentation?.approvalNote ??
											t("card.connectorApproval"))}
								</Small>
							)}
							{isWaiting &&
								json.name === FOLDER_TOOL_NAMES.DELETE &&
								isSet(args.recursive) && (
									<Small className="text-warning">
										{t("card.deleteRecursive")}
									</Small>
								)}
							{footer}
						</div>
					) : undefined
				}
			/>
		);
	}

	const body = (
		<div className="flex min-w-0 flex-col gap-3">
			{header}

			{isWaiting ? (
				<Small className="text-muted-foreground">
					{isFolder
						? t("card.folderApproval")
						: (presentation?.approvalNote ??
							t("card.connectorApproval"))}
				</Small>
			) : null}

			<div className="flex min-w-0 flex-col gap-3">
				{isFolder ? renderFolderDetails() : renderArguments()}
			</div>

			{hasResult ? (
				<ToolTextBlock
					label={
						call.status === "ERROR"
							? t("card.error")
							: t("card.result")
					}
				>
					{formatResponse(call.response)}
				</ToolTextBlock>
			) : null}

			{footer}
		</div>
	);

	return (
		<div className="rounded-md border border-border bg-background p-3">
			{body}
		</div>
	);
};
