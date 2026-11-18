import {
	CheckIcon,
	CircleAlertIcon,
	FolderIcon,
	HourglassIcon,
	LoaderCircleIcon,
	LogInIcon,
	XIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Badge, Button, cn, Small, toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { formatJson } from "@semoss/utility/json";
import {
	isSignInFailure,
	signInToProvider,
} from "../../connectors/accounts/connector-sign-in";
import { useConnectProvider } from "../../connectors/accounts/use-connect-provider";
import { ConnectorServiceIcon } from "../../connectors/viewers/connector-service-icon";
import type { ToolStore } from "../../room/store/tool.store";
import { isToolSettled, type ToolStatus } from "../../room/store/tool-status";
import { useRoomSelector } from "../../room/store/use-room-selector";
import { decideAgentToolAction } from "../../room/turns/agent-turn-runner";
import {
	getConnectorToolService,
	isBrowserToolCall,
} from "../chat-tools/chat-tool-kind";
import {
	FOLDER_TOOL_NAMES,
	type FolderToolName,
	isFolderToolName,
	readBoolean,
} from "../chat-tools/folder-tools";
import { readToolResponseDetail } from "../chat-tools/tool-response-detail";
import { ToolInspector } from "../inspector/tool-inspector";
import { isAskExecutionMode } from "../mcp/mcp-utils";

/** Props for {@link ChatToolCard}. */
interface ChatToolCardProps {
	/** The work folder or connector call to show. */
	tool: ToolStore;
	/** `inline` sits in the conversation; `panel` fills a Workbench tab. */
	variant: "inline" | "panel";
}

/** Longest argument shown as a plain value before it becomes a text block. */
const INLINE_VALUE_MAX = 80;

/**
 * An argument value as text.
 *
 * @param value - The raw value.
 * @returns Text for display.
 */
const toDisplayText = (value: unknown): string =>
	typeof value === "string" ? value : JSON.stringify(value, null, 2);

/** The header badge for each state a call can be in; waiting beats the call's own status. */
const STATUS_BADGES: Record<
	"waiting" | ToolStatus,
	{ labelKey: string; icon: ReactNode }
> = {
	waiting: {
		labelKey: "card.status.waiting",
		icon: <HourglassIcon aria-hidden />,
	},
	LOADING: {
		labelKey: "card.status.running",
		icon: <LoaderCircleIcon aria-hidden className="animate-spin" />,
	},
	SUCCESS: { labelKey: "card.status.done", icon: <CheckIcon aria-hidden /> },
	ERROR: {
		labelKey: "card.status.failed",
		icon: <CircleAlertIcon aria-hidden />,
	},
	CANCELLED: { labelKey: "card.status.notRun", icon: <XIcon aria-hidden /> },
	INITIAL: {
		labelKey: "card.status.queued",
		icon: <HourglassIcon aria-hidden />,
	},
};

/** One labelled value the card shows, such as a path or a file's new text. */
interface CardField {
	/** What the value is, such as "File"; an i18n key in {@link FOLDER_FIELDS}. */
	label: string;
	/** The raw value. */
	value: unknown;
	/** Whether it is a block of preformatted text rather than a single value. */
	isBlock?: boolean;
}

/**
 * What a folder call acts on, by tool: the file and the new text for a write
 * or an edit, both paths for a move, and so on. List, read, and create
 * directory are left out: the decorated call's description is already the
 * path they act on.
 */
const FOLDER_FIELDS: Partial<
	Record<FolderToolName, (args: Record<string, unknown>) => CardField[]>
> = {
	[FOLDER_TOOL_NAMES.WRITE]: (args) => [
		{ label: "card.file", value: args.path },
		{ label: "card.newContents", value: args.content ?? "", isBlock: true },
	],
	[FOLDER_TOOL_NAMES.EDIT]: (args) => [
		{ label: "card.file", value: args.path },
		{ label: "card.replace", value: args.old_text ?? "", isBlock: true },
		{ label: "card.with", value: args.new_text ?? "", isBlock: true },
	],
	[FOLDER_TOOL_NAMES.MOVE]: (args) => [
		{ label: "card.from", value: args.from },
		{ label: "card.to", value: args.to },
	],
	[FOLDER_TOOL_NAMES.DELETE]: (args) => [
		{ label: "card.path", value: args.path },
	],
	[FOLDER_TOOL_NAMES.SEARCH]: (args) => [
		{ label: "card.query", value: args.query },
	],
};

/**
 * Draws one labelled value: a single value wraps anywhere rather than
 * widening the card, and a block of text scrolls inside itself.
 *
 * @param field - The value, with its label already translated.
 * @returns The field.
 */
const renderField = ({ label, value, isBlock }: CardField): ReactNode => (
	<div
		key={label}
		className={cn("flex min-w-0 flex-col", isBlock ? "gap-1" : "gap-0.5")}
	>
		<Small className="text-muted-foreground">{label}</Small>
		{isBlock ? (
			<pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/50 p-2 font-mono text-xs">
				{toDisplayText(value)}
			</pre>
		) : (
			<span className="break-all font-mono text-sm">
				{toDisplayText(value)}
			</span>
		)}
	</div>
);

/**
 * A saved tool response for display: the details without the model guidance
 * around them, pretty printed when they are JSON.
 *
 * @param response - The saved response.
 * @returns Text for display.
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
	const { t } = useTranslation(["chatTools", "chatConnectors"]);
	const [decision, setDecision] = useState<"allow" | "deny" | null>(null);

	const room = tool.room;
	const handleSignIn = useConnectProvider(signInToProvider);
	// the call's json reads the room's options and the run mode too; a
	// decorated call's json is a new object on every read, so select its values
	const {
		name,
		jsonDescription,
		isFolder,
		service,
		isAgentRoom,
		isWaiting,
		args,
		toolStatus,
		response,
		displayName,
	} = useRoomSelector(room, (current) => {
		const json = tool.json;
		const isFolderCall = isBrowserToolCall(json);
		const isAgent = current.mode === "agent";
		return {
			name: json.name,
			jsonDescription: json.description,
			isFolder: isFolderCall,
			service: isFolderCall ? undefined : getConnectorToolService(json),
			isAgentRoom: isAgent,
			isWaiting:
				tool.status === "INITIAL" &&
				isAskExecutionMode(json._meta?.SMSS_MCP_EXECUTION) &&
				(isAgent ? !!tool.pendingAction : !!tool.message),
			args: tool.parameters ?? {},
			toolStatus: tool.status,
			response: tool.response,
			displayName: tool.displayName,
		};
	});
	// the panel's folder tool definition follows the room's settings
	const definition = useRoomSelector(room, (current) =>
		variant === "panel" && isFolder
			? current.chatTools.chatToolDefinitions.find(
					(item) => item.name === name,
				)
			: undefined,
	);

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

	/**
	 * Allow the waiting call. Folder calls only come from chat turns: an agent
	 * run brings its own file tools.
	 */
	const handleAllow = () =>
		runDecision("allow", () => {
			if (isFolder) {
				return room.chatTools.approveChatTool(tool);
			}
			return isAgentRoom
				? decideAgentToolAction(tool, "submit")
				: room.chatTools.approveConnectorChatTool(tool);
		});

	/** Deny the waiting call, in chat or for the agent run. */
	const handleDeny = () =>
		runDecision("deny", () =>
			isAgentRoom
				? decideAgentToolAction(tool, "reject")
				: room.chatTools.declineChatTool(tool),
		);

	const status = STATUS_BADGES[isWaiting ? "waiting" : toolStatus];

	// what a folder call acts on, laid out for its tool (nothing for a name
	// that is not a folder tool), or a connector call's arguments, each a
	// value, or a block when it is long or runs over several lines
	const folderFields =
		isFolder && isFolderToolName(name)
			? (FOLDER_FIELDS[name]?.(args) ?? [
					{
						label: "card.path",
						value: jsonDescription || t("card.rootFolder"),
					},
				])
			: [];
	const fields: CardField[] = isFolder
		? folderFields.map((field) => ({ ...field, label: t(field.label) }))
		: Object.entries(args).map(([key, value]) => {
				const text = toDisplayText(value);
				return {
					label: key,
					value: text,
					isBlock:
						text.length > INLINE_VALUE_MAX || text.includes("\n"),
				};
			});

	// what the user is asked, and the warning a recursive delete carries
	const approvalNotice = isWaiting ? (
		<Small className="text-muted-foreground">
			{isFolder ? t("card.folderApproval") : t("card.connectorApproval")}
		</Small>
	) : null;
	const deleteWarning =
		name === FOLDER_TOOL_NAMES.DELETE && readBoolean(args.recursive) ? (
			<Small className="text-warning">{t("card.deleteRecursive")}</Small>
		) : null;

	// a call that has not finished has nothing to show yet
	const hasResult = !!response && isToolSettled(toolStatus);
	// a connector call that failed for want of a sign in says so, with the
	// way to sign in right there
	const signInProvider =
		service && toolStatus === "ERROR" && isSignInFailure(response)
			? service.provider
			: null;

	// the service or Room Files icon, the call's name and source, and its status
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
					title={displayName}
				>
					{displayName}
				</span>
				<Small className="truncate text-muted-foreground">
					{service
						? t(`chatConnectors:services.${service.id}.name`)
						: t("card.roomFiles")}
				</Small>
			</div>
			<Badge variant="outline" className="shrink-0">
				{status.icon}
				{t(status.labelKey)}
			</Badge>
		</div>
	);

	// a sign in for a failed connector call, and Allow and Deny while waiting
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
		return (
			<ToolInspector
				tool={tool}
				header={header}
				response={formatResponse(response)}
				description={definition?.description}
				inputSchema={definition?.inputSchema}
				footer={
					footer ? (
						<div className="space-y-3">
							{approvalNotice}
							{isWaiting ? deleteWarning : null}
							{footer}
						</div>
					) : undefined
				}
			/>
		);
	}

	return (
		<div className="rounded-md border border-border bg-background p-3">
			<div className="flex min-w-0 flex-col gap-3">
				{header}

				{approvalNotice}

				<div className="flex min-w-0 flex-col gap-3">
					{fields.map(renderField)}
					{!isFolder && fields.length === 0 ? (
						<Small className="text-muted-foreground">
							{t("card.noArguments")}
						</Small>
					) : null}
					{isFolder &&
					name === FOLDER_TOOL_NAMES.EDIT &&
					readBoolean(args.replace_all) ? (
						<Small className="text-muted-foreground">
							{t("card.replaceAll")}
						</Small>
					) : null}
					{deleteWarning}
				</div>

				{hasResult
					? renderField({
							label:
								toolStatus === "ERROR"
									? t("card.error")
									: t("card.result"),
							value: formatResponse(response),
							isBlock: true,
						})
					: null}

				{footer}
			</div>
		</div>
	);
};
