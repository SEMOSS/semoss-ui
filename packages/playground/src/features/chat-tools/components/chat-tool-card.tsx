import {
	CheckIcon,
	CircleAlertIcon,
	FolderIcon,
	HourglassIcon,
	LoaderCircleIcon,
	LogInIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { type ReactNode, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Badge, Button, Small, toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { formatJson } from "@semoss/utility/json";
import { ConnectorServiceIcon } from "@/features/connectors/components/connector-service-icon";
import {
	isSignInFailure,
	signInToProvider,
} from "@/features/connectors/connector-sign-in";
import { useConnectProvider } from "@/features/connectors/use-connect-provider";
import { ToolInspector } from "@/features/tool-inspector/tool-inspector";
import { decideAgentToolAction } from "@/stores/message/agent-harness";
import type { ToolStore } from "@/stores/tool/tool.store";
import { isAskExecutionMode } from "@/utility/mcp-utils";
import {
	getConnectorToolService,
	isFolderToolCall,
} from "../tools/chat-tool-kind";
import { FOLDER_TOOL_NAMES, isFolderToolName } from "../tools/folder-tools";
import { readToolResponseDetail } from "../tools/tool-response-detail";
import { ToolTextBlock } from "./tool-text-block";
import { ToolValueRow } from "./tool-value-row";

/** Props for {@link ChatToolCard}. */
export interface ChatToolCardProps {
	/** The work folder or connector call to show. */
	tool: ToolStore;
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
export const ChatToolCard = observer(({ tool, variant }: ChatToolCardProps) => {
	const { t } = useTranslation(["chatTools", "chatConnectors"]);
	const [decision, setDecision] = useState<"allow" | "deny" | null>(null);

	const room = tool.room;
	const handleSignIn = useConnectProvider(signInToProvider);
	const json = tool.json;
	const args = tool.parameters ?? {};
	const isFolder = isFolderToolCall(json);
	const service = isFolder ? undefined : getConnectorToolService(json);
	const isAgentRoom = room.mode === "agent";
	const isAsk = isAskExecutionMode(json._meta?.SMSS_MCP_EXECUTION);
	const isWaiting =
		tool.status === "INITIAL" &&
		isAsk &&
		(isAgentRoom ? !!tool.pendingAction : !!tool.message);

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
			if (isFolder) {
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
		: tool.status === "LOADING"
			? {
					label: t("card.status.running"),
					icon: (
						<LoaderCircleIcon
							aria-hidden
							className="animate-spin"
						/>
					),
				}
			: tool.status === "SUCCESS"
				? {
						label: t("card.status.done"),
						icon: <CheckIcon aria-hidden />,
					}
				: tool.status === "ERROR"
					? {
							label: t("card.status.failed"),
							icon: <CircleAlertIcon aria-hidden />,
						}
					: tool.status === "CANCELLED"
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
		!!tool.response &&
		(tool.status === "SUCCESS" ||
			tool.status === "ERROR" ||
			tool.status === "CANCELLED");
	// a connector call that failed for want of a sign in says so, with the
	// way to sign in right there
	const signInProvider =
		service && tool.status === "ERROR" && isSignInFailure(tool.response)
			? service.provider
			: null;

	const header = (
		<div className="flex min-w-0 items-start gap-3">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
				{service ? (
					<ConnectorServiceIcon
						serviceId={service.id}
						className="size-4"
					/>
				) : (
					<FolderIcon aria-hidden className="size-4" />
				)}
			</div>
			<div className="flex min-w-0 flex-1 flex-col">
				<span
					className="truncate font-medium text-sm"
					title={tool.displayName}
				>
					{tool.displayName}
				</span>
				<Small className="truncate text-muted-foreground">
					{service
						? t(`chatConnectors:services.${service.id}.name`)
						: t("card.chatFiles")}
				</Small>
			</div>
			<Badge variant="outline" className="shrink-0">
				{status.icon}
				{status.label}
			</Badge>
		</div>
	);

	const footer =
		isWaiting || signInProvider ? (
			<div className="flex flex-col gap-3">
				{signInProvider ? (
					<div className="flex flex-wrap items-center gap-2 rounded-md border border-warning/40 bg-warning/10 p-2">
						<LogInIcon
							aria-hidden
							className="size-4 shrink-0 text-warning"
						/>
						<Small className="min-w-0 flex-1 text-foreground">
							{t("chatConnectors:signIn.toolFailed", {
								account: t(
									`chatConnectors:providers.${signInProvider}.name`,
								),
							})}
						</Small>
						<Button
							size="sm"
							onClick={() => handleSignIn(signInProvider)}
						>
							{t("chatConnectors:signIn.toolAction", {
								account: t(
									`chatConnectors:providers.${signInProvider}.name`,
								),
							})}
						</Button>
					</div>
				) : null}

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
		const definition = isFolder
			? room.chatTools.chatToolDefinitions.find(
					(item) => item.name === json.name,
				)
			: undefined;
		return (
			<ToolInspector
				tool={tool}
				header={header}
				response={formatResponse(tool.response)}
				description={definition?.description}
				inputSchema={definition?.inputSchema}
				footer={
					isWaiting || signInProvider ? (
						<div className="space-y-3">
							{isWaiting && (
								<Small className="text-muted-foreground">
									{isFolder
										? t("card.folderApproval")
										: t("card.connectorApproval")}
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
						: t("card.connectorApproval")}
				</Small>
			) : null}

			<div className="flex min-w-0 flex-col gap-3">
				{isFolder ? renderFolderDetails() : renderArguments()}
			</div>

			{hasResult ? (
				<ToolTextBlock
					label={
						tool.status === "ERROR"
							? t("card.error")
							: t("card.result")
					}
				>
					{formatResponse(tool.response)}
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
});
