import { type ReactNode, useEffect, useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { InsightProvider, useSessionPixel } from "@semoss/sdk/react";
import { Alert, AlertDescription, Button } from "@semoss/ui/next";
import { useChatConfig } from "../chat/config/use-chat-config";
import { useChatSession } from "../chat/provider/use-chat-session";
import { FileDropProvider } from "../conversation/attachments/file-drop.context";
import { NextMessageRoomProvider } from "../conversation/attachments/next-message-room.context";
import { canChooseAgentMode } from "../conversation/composer/agent-mode-choice";
import { RoomInput } from "../conversation/composer/room-input";
import { RoomHeader } from "../room/header/room-header";
import { RoomLayout } from "../room/layout/room-layout";
import { RoomStore } from "../room/store/room.store";
import { useRoomSelector } from "../room/store/use-room-selector";
import { DraftSettingsContext } from "../room-settings/draft-settings.context";
import { RoomWorkbench } from "../workbench/room-workbench";
import { NewChatBanner } from "./new-chat-banner";
import { NewChatLanding } from "./new-chat-landing";
import { useCreateRoomFromDraft } from "./use-create-room-from-draft";
import { useDraftAgent } from "./use-draft-agent";
import { useNewRoomPanels } from "./use-new-room-panels";

/** Props for {@link NewChat}. */
interface NewChatProps {
	/** Text the composer starts with. */
	initialPrompt?: string;
	/** An agent the chat starts with, as an agent link names one. */
	workspaceId?: string | null;
	/** A knowledge base the chat starts with. */
	knowledgeId?: string | null;
	/** Show the theme's alternate landing rather than its landing. */
	showAltLanding?: boolean;
	/** The host's controls at the start of the header, such as a navigation button. */
	headerLeading?: ReactNode;
}

/**
 * A new chat before its first message: the landing, the composer, and a draft
 * Workspace. Its first message creates the room, which the host then opens.
 */
export const NewChat = ({
	initialPrompt = "",
	workspaceId = null,
	knowledgeId = null,
	showAltLanding = false,
	headerLeading,
}: NewChatProps) => {
	const { t } = useTranslation("room");
	const { theme } = useChatConfig();
	// the store's blueprints, so a draft opens the same panels as a room
	const { panelComponents } = useChatSession().chat;

	// The new room holds the new chat's options until its first message,
	// starting from the theme's defaults
	const newRoom = useMemo(() => {
		const room = new RoomStore({
			theme: theme,
			roomId: "temp",
			panelComponents,
			// no insight for Files to read until the draft prepares its room
			includeFiles: false,
		});
		room.setOptions({
			instructions: "",
			mcp: [...(theme.defaultTools || [])],
			workspace: undefined,
			predefinedPrompts: [],
			temperature: theme.featureFlags?.enableTemperature
				? (theme.defaultRoomSettings?.temperature ?? 0)
				: undefined,
		});
		return room;
	}, [theme, panelComponents]);

	const draft = useDraftAgent(newRoom, workspaceId);
	const { session, agent } = draft;
	// an agent link's agent can greet the user, in a room of its own
	const linkAgent = draft.isAgentFromLink ? agent.workspace : null;
	const greeting = linkAgent?.config_json?.greeting_enabled
		? (linkAgent.config_json.greeting ?? "")
		: "";
	const created = useCreateRoomFromDraft(newRoom, {
		mode: draft.mode,
		isAgentOptionsPending: draft.isAgentOptionsPending,
		greetingAgent:
			linkAgent && greeting
				? {
						id: draft.agentId,
						name: linkAgent.display_name || linkAgent.name,
					}
				: null,
	});
	const { isPreparing, hasError: hasPreparationError } = created.preparation;
	const isBusy = created.isLoading || isPreparing;
	const { workbenchRoom, newRoomPanels, retryPreparation } = useNewRoomPanels(
		newRoom,
		created.preparation,
		created.isLoading,
	);
	const isWorkbenchOpen = useRoomSelector(
		workbenchRoom,
		(current) => current.workbenchPane.isOpen,
	);
	const preparedRoomIds = useRoomSelector(
		created.preparation.room,
		(current) => ({ roomId: current.roomId, insightId: current.insightId }),
	);

	// the draft starts with the user's connectors switched on
	useEffect(() => {
		void newRoom.connectors.loadUserConnectors();
	}, [newRoom]);

	// a knowledge base the link names joins the draft's own, once read
	const getKnowledge = useSessionPixel<
		| {
				engine_id: string;
				engine_name: string;
				engine_display_name?: string;
		  }[]
		| null
	>(
		knowledgeId
			? `MyEngines( engine=["${knowledgeId}"], engineTypes=['VECTOR'],  metaFilters=[{}], userT = [true], limit=[15], offset=[0]);`
			: "",
		{ data: null },
	);
	useEffect(() => {
		const engine = getKnowledge.data?.[0];
		if (!knowledgeId || getKnowledge.status !== "SUCCESS" || !engine) {
			return;
		}
		const { mcp } = newRoom.options;
		if (
			mcp.some(
				(item) => item.id === knowledgeId && item.type === "VECTOR",
			)
		) {
			return;
		}
		newRoom.setOptions({
			mcp: [
				...mcp,
				{
					id: knowledgeId,
					type: "VECTOR",
					name:
						engine.engine_display_name ||
						engine.engine_name ||
						knowledgeId,
				},
			],
		});
	}, [knowledgeId, getKnowledge.status, getKnowledge.data, newRoom]);

	const workbench = (
		<RoomWorkbench room={workbenchRoom} newRoomPanels={newRoomPanels} />
	);
	const predefinedPrompts = session.options.predefinedPrompts;

	return (
		<div className="flex h-full w-full flex-col overflow-hidden">
			<NewChatBanner />
			<div className="min-h-0 flex-1">
				<RoomLayout
					isWorkbenchOpen={isWorkbenchOpen}
					onWorkbenchCollapse={() => workbenchRoom.closeWorkbench()}
					header={
						<RoomHeader
							room={workbenchRoom}
							newRoomPanels={newRoomPanels}
							leading={headerLeading}
						/>
					}
					workbench={
						<DraftSettingsContext.Provider
							value={{
								session,
								disabled: isBusy || draft.isAgentOptionsPending,
							}}
						>
							<div className="flex h-full min-h-0 flex-col">
								{hasPreparationError && (
									<Alert
										variant="destructive"
										className="m-4 w-auto"
									>
										<AlertDescription>
											{t("room:studio.prepareError")}
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={retryPreparation}
											>
												{t("room:studio.retry")}
											</Button>
										</AlertDescription>
									</Alert>
								)}
								<div className="min-h-0 flex-1">
									{preparedRoomIds ? (
										<InsightProvider
											key={preparedRoomIds.roomId}
											options={{
												insightId:
													preparedRoomIds.insightId,
											}}
											destroyOnUnmount={false}
										>
											<NextMessageRoomProvider
												room={newRoom}
											>
												{workbench}
											</NextMessageRoomProvider>
										</InsightProvider>
									) : (
										workbench
									)}
								</div>
							</div>
						</DraftSettingsContext.Provider>
					}
				>
					<FileDropProvider>
						<NewChatLanding
							showAltLanding={showAltLanding}
							greeting={greeting}
							room={workbenchRoom}
						>
							{draft.hasAgentLoadFailed && (
								<Alert variant="destructive">
									<AlertDescription>
										{t("room:settings.agentLoadError")}
									</AlertDescription>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={agent.refresh}
									>
										{t("room:studio.retry")}
									</Button>
								</Alert>
							)}
							<RoomInput
								// a different prompt handed in starts the editor again
								key={initialPrompt}
								className="max-h-72"
								isLoading={isBusy}
								session={session}
								room={newRoom}
								onPrompt={created.createRoom}
								excludeCommandIds={
									canChooseAgentMode(theme.featureFlags)
										? []
										: ["agent-harness", "chat-mode"]
								}
								// The new-room flow has no cancellable turn, so
								// it's only ever busy (spinner) or idle (send).
								sendState={isBusy ? "loading" : "send"}
								variant={{
									kind: "draft",
									onSwitchToAgentHarness: () =>
										draft.chooseMode("agent"),
									onExitAgentHarness: () =>
										draft.chooseMode("chat"),
									workbenchPanels: {
										room: workbenchRoom,
										newRoomPanels: newRoomPanels,
									},
									initialValue: initialPrompt,
									isSubmitDisabled:
										draft.isAgentOptionsPending,
								}}
							/>
							{predefinedPrompts.length > 0 ? (
								<div className="mx-auto flex w-full flex-col items-center gap-3">
									<div className="flex w-full flex-wrap justify-center gap-2">
										{predefinedPrompts
											.slice(0, 5)
											.map((prompt) => (
												<Button
													key={prompt.id}
													variant="outline"
													className="h-auto min-h-10 max-w-full gap-2 whitespace-normal rounded-xl px-4 py-2 text-start"
													disabled={isBusy}
													onClick={() =>
														created.createRoom(
															prompt.context,
															[],
														)
													}
												>
													{prompt.title}
												</Button>
											))}
									</div>
								</div>
							) : null}
						</NewChatLanding>
					</FileDropProvider>
				</RoomLayout>
			</div>
		</div>
	);
};
