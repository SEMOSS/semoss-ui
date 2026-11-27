import { type ReactNode, useEffect } from "react";
import { useTranslation } from "@semoss/i18n";
import { InsightProvider, useSessionPixel } from "@semoss/sdk/react";
import { Alert, AlertDescription, Button } from "@semoss/ui/next";
import { useChatConfig } from "../chat/config/chat-config.context";
import { useChatSession } from "../chat/provider/chat-session.context";
import { FileDropProvider } from "../conversation/attachments/file-drop.context";
import { NextMessageRoomProvider } from "../conversation/attachments/next-message-room.context";
import { RoomInput } from "../conversation/composer/room-input";
import { DropHighlight } from "../conversation/drop-highlight";
import { RoomGreeting } from "../conversation/messages/room-greeting";
import { RoomHeader } from "../room/header/room-header";
import { SplitLayout } from "../room/layout/split-layout";
import { useRoomSelector } from "../room/store/use-room-selector";
import { DraftSettingsContext } from "../room-settings/draft-settings.context";
import { RoomWorkbench } from "../workbench/room-workbench";
import { NewChatWelcome } from "./new-chat-welcome";
import { useCreateRoomFromDraft } from "./use-create-room-from-draft";
import { useDraftAgent } from "./use-draft-agent";
import { useDraftPanels } from "./use-draft-panels";
import { useDraftRoom } from "./use-draft-room";

/** Props for {@link NewChat}. */
interface NewChatProps {
	/** Text the composer starts with. */
	initialPrompt?: string;
	/** An agent the chat starts with, as an agent link names one. */
	workspaceId?: string | null;
	/** A knowledge base the chat starts with. */
	knowledgeId?: string | null;
	/** The host's controls at the start of the header, such as a navigation button. */
	headerLeading?: ReactNode;
	/** What runs across the top, such as a `NewChatBanner`. Default: nothing. */
	banner?: ReactNode;
	/** What fills the space behind the landing, such as a `NewChatBackdrop`. Default: nothing. */
	backdrop?: ReactNode;
	/** The welcome above the composer. Default: `NewChatWelcome`. */
	welcome?: ReactNode;
}

/**
 * A new chat before its first message: the landing, the composer, and a draft
 * Workspace. Its first message creates the room, which the host then opens.
 */
export const NewChat = ({
	initialPrompt = "",
	workspaceId = null,
	knowledgeId = null,
	headerLeading,
	banner = null,
	backdrop = null,
	welcome = <NewChatWelcome />,
}: NewChatProps) => {
	const { t } = useTranslation("room");
	const { options } = useChatConfig();
	// the store's blueprints, so a draft opens the same panels as a room
	const { workbenchPanels } = useChatSession().chat;

	// The new room holds the new chat's options until its first message,
	// starting from the host's defaults
	const newRoom = useDraftRoom(options, workbenchPanels);

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
	const { workbenchRoom, draftPanels, retryPreparation } = useDraftPanels(
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
		<RoomWorkbench room={workbenchRoom} draftPanels={draftPanels} />
	);
	const predefinedPrompts = session.options.predefinedPrompts;

	return (
		<div className="flex h-full w-full flex-col overflow-hidden">
			{banner}
			<div className="min-h-0 flex-1">
				<SplitLayout
					isWorkbenchOpen={isWorkbenchOpen}
					onWorkbenchClose={() => workbenchRoom.closeWorkbench()}
					header={
						<RoomHeader
							room={workbenchRoom}
							draftPanels={draftPanels}
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
						{backdrop}
						{/* files dropped anywhere on the landing attach to the draft */}
						<DropHighlight className="flex h-full flex-col items-center overflow-auto px-4 py-8 sm:px-6">
							<div className="relative z-10 mx-auto my-auto flex w-full max-w-3xl flex-col gap-6 py-6">
								{welcome}
								{greeting && (
									<RoomGreeting
										room={workbenchRoom}
										greeting={greeting}
									/>
								)}
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
									// The new-room flow has no cancellable turn, so
									// it's only ever busy (spinner) or idle (send).
									sendState={isBusy ? "loading" : "send"}
									variant={{
										kind: "draft",
										onSwitchToAgentHarness: () =>
											draft.chooseMode("agent"),
										onExitAgentHarness: () =>
											draft.chooseMode("chat"),
										draftWorkbench: {
											room: workbenchRoom,
											draftPanels,
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
							</div>
						</DropHighlight>
					</FileDropProvider>
				</SplitLayout>
			</div>
		</div>
	);
};
