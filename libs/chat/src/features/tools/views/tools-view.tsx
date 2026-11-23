import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import { isRequestUserInputAction, parseUserInputRequest } from "@semoss/sdk";
import { Env, type MCPToolRequest } from "@semoss/sdk/react";
import { isToolViewUri, useToolView } from "@semoss/shared";
import {
	type AgentUserInputAnswer,
	AgentUserInputCard,
	Skeleton,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import { useChatConfig } from "../../chat/config/chat-config.context";
import type { RoomStore } from "../../room/store/room.store";
import type { ToolStore } from "../../room/store/tool.store";
import { useRoomSelector } from "../../room/store/use-room-selector";
import { decideAgentToolAction } from "../../room/turns/agent-turn-runner";
import { ToolInspector } from "../inspector/tool-inspector";
import { ChatToolCard } from "./chat-tool-card";
import { ComponentToolView } from "./component-tool-view";
import { DefaultToolView } from "./default-tool-view";
import { resolveSystemAppUrl, resolveToolFrameUrl } from "./tool-frame-url";
import { usePortalPublished } from "./use-portal-published";
import { useToolAppInfo } from "./use-tool-app-info";

/** Stands in for a call the room does not have yet, so the hook runs either way. */
const NO_TOOL = {
	getSnapshot: () => null,
	subscribe: () => () => {},
};

/** What {@link ToolsView} reads from its call. */
interface ToolsViewCall {
	tool: ToolStore["json"] | undefined;
	toolResponse: string | undefined;
	toolParameters: ToolStore["parameters"] | undefined;
	hasPendingAction: boolean;
}

/** Props for {@link ToolsView}. */
interface ToolsViewProps {
	/** The room the call belongs to. */
	room: RoomStore;

	/** Id of the app (project or engine) that owns the tool, or empty for none. */
	app: string;

	/** Id of the message that made the call. */
	message: string;

	/** Id of the tool call in the room. */
	toolId: string;
}

/**
 * Draws one tool call in the Workspace: its component view, its chat tool card,
 * its app's page in a frame, a request for the user's input, or the default form.
 * The call is read from the room by id, so the view follows it as it changes.
 */
export const ToolsView = ({ room, app, message, toolId }: ToolsViewProps) => {
	const { t } = useTranslation("tool");
	const { platformUrl = "", toolFrameOrigin } = useChatConfig().options;
	const liveTool = useRoomSelector(room, (current) =>
		current.getTool(toolId),
	);
	// the call's own changes, as `useTool` reads them, before the room has it
	const { tool, toolResponse, toolParameters, hasPendingAction } =
		useStoreSelector<unknown, ToolsViewCall>(liveTool ?? NO_TOOL, () => ({
			tool: liveTool?.json,
			toolResponse:
				liveTool?.status === "SUCCESS" ? liveTool.response : undefined,
			toolParameters: liveTool?.parameters,
			hasPendingAction: !!liveTool?.pendingAction,
		}));

	const iframeRef = useRef<HTMLIFrameElement>(null);
	const iframeReadyRef = useRef(false);

	const resourceURI = tool?._meta?.SMSS_MCP_UI?.resourceURI;
	// a component:// view is drawn in the page from the call itself
	const toolView = useToolView(resourceURI);

	// A system app or a component:// view is resolved from _meta alone, so
	// neither looks the app up: there may be no project or engine behind it.
	// PROJECT-hosted tools use ProjectInfo, every other engine type (VECTOR,
	// STORAGE, DATABASE, MODEL, FUNCTION, ...) EngineInfo; a missing type is
	// a project.
	const engineType = tool?._meta?.SMSS_ENGINE_TYPE;
	const insightId = useRoomSelector(room, (current) => current.insightId);
	const appInfo = useToolAppInfo(
		app && !resolveSystemAppUrl(resourceURI) && !isToolViewUri(resourceURI)
			? app
			: null,
		!engineType || engineType === "PROJECT",
		insightId,
	);

	const route = resolveToolFrameUrl({
		tool: tool,
		app: app,
		hasComponentView: !!toolView,
		toolResponse: toolResponse,
		appInfo: appInfo,
		platformUrl: platformUrl,
		module: Env.MODULE,
		toolFrameOrigin: toolFrameOrigin,
	});
	// a legacy portal page is framed only once it is known to be published
	const isPublished = usePortalPublished(
		route.kind === "portal" ? app : null,
	);
	const url =
		route.kind === "frame" || (route.kind === "portal" && isPublished)
			? route.url
			: "";
	const isLoading =
		route.kind === "loading" ||
		(route.kind === "portal" && isPublished === undefined);

	/** Posts the call to the framed app, which waits for it before it draws. */
	const sendToolContext = useCallback(() => {
		const targetOrigin = url
			? new URL(url, window.location.origin).origin
			: window.location.origin;

		iframeRef.current?.contentWindow?.postMessage(
			{
				type: "SMSS_INIT_TOOL",
				tool: {
					type: "MCP",
					message: message || "",
					id: tool?.id || "",
					name: tool?.name || "",
					parameters: toolParameters || {},
					roomId: room.roomId,
					original_name: tool?.original_name || "",
					tool_response: toolResponse,
					executedParameters: toolParameters || {},
					_meta: tool?._meta || {},
				} satisfies MCPToolRequest,
			},
			targetOrigin,
		);
	}, [message, room.roomId, tool, toolParameters, toolResponse, url]);

	/** Marks the frame ready and hands it the call. */
	const handleIframeLoad = (): void => {
		iframeReadyRef.current = true;
		sendToolContext();
	};

	// Re-send the call to a loaded frame whenever it changes.
	useEffect(() => {
		if (iframeReadyRef.current) {
			sendToolContext();
		}
	}, [sendToolContext]);

	if (!tool || !liveTool) {
		return null;
	}

	const defaultView = (
		<DefaultToolView
			room={room}
			app={app}
			message={message}
			tool={liveTool}
		/>
	);
	const card = <ChatToolCard tool={liveTool} variant="panel" />;

	if (route.kind === "component" && toolView) {
		return (
			<ComponentToolView
				tool={liveTool}
				view={toolView}
				variant="panel"
				fallback={route.fallback === "card" ? card : defaultView}
			/>
		);
	}
	if (route.kind === "card") {
		return card;
	}
	if (route.kind === "inspector") {
		return <ToolInspector tool={liveTool} />;
	}

	/**
	 * Hands the user's answers to the paused agent run.
	 *
	 * @param answers - The answers, keyed by question id.
	 */
	const handleSubmitAnswers = async (
		answers: Record<string, AgentUserInputAnswer>,
	): Promise<void> => {
		try {
			await decideAgentToolAction(liveTool, "respond", answers);
		} catch (error) {
			toast.error(getErrorMessage(error, t("view.submitAnswersError")));
		}
	};

	// the default form, or the agent run's request for the user's input
	let form = defaultView;
	if (
		isRequestUserInputAction({ toolName: tool.name, toolMeta: tool._meta })
	) {
		const request = parseUserInputRequest({ toolArgs: tool.arguments });
		form = request ? (
			<div className="p-3">
				<AgentUserInputCard
					request={request}
					disabled={!hasPendingAction}
					onSubmit={handleSubmitAnswers}
				/>
			</div>
		) : (
			<div className="p-3 text-destructive text-sm">
				{t("view.invalidInputRequest")}
			</div>
		);
	}

	return (
		<div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
			{isLoading ? (
				<Skeleton className="h-full w-full" />
			) : url ? (
				<iframe
					className="h-full w-full border-none"
					title={t("view.frameTitle")}
					ref={iframeRef}
					src={url}
					data-tool-call-id={tool.id}
					onLoad={handleIframeLoad}
				/>
			) : (
				form
			)}
		</div>
	);
};
