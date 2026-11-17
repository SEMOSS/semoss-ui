import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useSession } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { ChatMode } from "../../types";
import { writeSessionNewChat } from "../chat/config/new-chat-preferences";
import { useChatConfig } from "../chat/config/use-chat-config";
import { useChatSession } from "../chat/provider/use-chat-session";
import type { RoomStore } from "../room/store/room.store";
import { type NewRoomPreparation, useNewRoom } from "./use-new-room";

/** What {@link useCreateRoomFromDraft} needs from the draft's agent. */
interface DraftRoomInput {
	/** The mode the room is created in. */
	readonly mode: ChatMode;
	/** Whether the agent's options have not reached the draft yet, which holds sending. */
	readonly isAgentOptionsPending: boolean;
	/**
	 * An agent link's agent with a scripted greeting, which starts a room of
	 * its own at once; null otherwise.
	 */
	readonly greetingAgent: {
		readonly id: string;
		readonly name: string;
	} | null;
}

/** What {@link useCreateRoomFromDraft} returns. */
interface DraftRoomCreation {
	/** Whether the room is being created. */
	readonly isLoading: boolean;
	/** The file-capable room prepared lazily before the first message. */
	readonly preparation: NewRoomPreparation;
	/**
	 * Create the room with its first message and open it.
	 *
	 * @returns True once the room is created; false when busy or it failed.
	 */
	readonly createRoom: (prompt: string, files: File[]) => Promise<boolean>;
}

/**
 * The room a new chat becomes: prepared lazily when a panel needs it, then
 * created by the first message, which carries the draft's options, queued
 * context and connectors over and opens the room. An agent link's agent
 * with a greeting starts a room without a message instead. The chat started
 * is remembered, so the next new chat starts as it did.
 *
 * @param newRoom - The draft that holds the new chat's options.
 * @param input - The draft's mode, agent and greeting.
 * @returns Whether it is creating, the preparation, and how to create.
 */
export const useCreateRoomFromDraft = (
	newRoom: RoomStore,
	{ mode, isAgentOptionsPending, greetingAgent }: DraftRoomInput,
): DraftRoomCreation => {
	const { t } = useTranslation(["room", "chat", "chatConnectors"]);
	const { navigation } = useChatConfig();
	const { chat } = useChatSession();
	const lastLogin = useSession((state) => state.user?.lastLogin);
	const [isLoading, setIsLoading] = useState(false);
	// read by the preparation's cleanup, which keeps a room that was sent to
	const hasSubmittedRef = useRef(false);
	// the agent whose greeting room was started, so it starts once
	const greetingRoomStartedForRef = useRef("");
	const preparation = useNewRoom(newRoom, mode, hasSubmittedRef);
	const { room: preparedRoom, isPreparing } = preparation;

	/**
	 * Options shared by every room-creation path: the draft's, with the agent
	 * harness persisted so agent mode survives a reload.
	 */
	const buildRoomOptions = (): RoomStore["options"] => ({
		...newRoom.options,
		harnessType: mode === "agent" ? "semoss" : undefined,
	});

	/** Transfer queued context and copy connectors before the first message. */
	const prepareRoom = async (room: RoomStore): Promise<void> => {
		room.contextItems.adopt(newRoom.contextItems);
		try {
			await room.connectors.adopt(newRoom.connectors);
		} catch (error) {
			toast.error(
				t("chatConnectors:connectors.adoptError", {
					message: getErrorMessage(error, ""),
				}),
			);
		}
	};

	/** Keep the room, remember the chat started, and open it. */
	const openCreatedRoom = (
		roomId: string,
		options: RoomStore["options"],
	): void => {
		hasSubmittedRef.current = true;
		writeSessionNewChat(lastLogin, {
			mode: mode,
			agentId: options.workspace?.workspace_id ?? "",
		});
		navigation.openRoom(roomId);
	};

	/** Shared error handling for every room-creation path below. */
	const handleCreateRoomError = (error: unknown) => {
		const sdkError = error as { message: string; code?: number };
		if (sdkError.code === 403 || sdkError.code === 302) {
			// User is unauthorized, likely due to expired session. Prompt them to log in again.
			toast.error(t("chat:gracefulErrors.inactivity"));
			return;
		}
		toast.error(t("room:errors.createRoom", { message: sdkError.message }));
	};

	const createRoom = async (
		prompt: string,
		files: File[],
	): Promise<boolean> => {
		if (isLoading || isPreparing || isAgentOptionsPending) {
			return false;
		}
		try {
			setIsLoading(true);
			const options = buildRoomOptions();
			if (preparedRoom) {
				// Room was pre-created so files could be uploaded to its insight.
				// Sync final mode/options, fire askMessage, then navigate.
				// Files from the file explorer are already in the insight —
				// only RoomInput drag/drop/paste attachments are passed here.
				preparedRoom.setModel(chat.models.selected);
				preparedRoom.setMode(mode);
				preparedRoom.setMetadata({ name: prompt.substring(0, 15) });
				// the agent the draft already read, so the room does not read it again
				preparedRoom.setAgentTools(
					options.workspace?.workspace_id ?? null,
					newRoom.agentTools,
				);
				await preparedRoom.updateRoomOptions(options);
				await prepareRoom(preparedRoom);
				// folders attached before the first message, for an agent run,
				// which reads them from the room's toolbox
				await preparedRoom.syncClientTools().catch((error: unknown) => {
					console.error("Could not add the client tools", error);
				});
				// Optimistically surface the room in the nav — GetPlaygroundRooms
				// won't return it until its first message has data.
				chat.addOptimisticRoom({
					ROOM_ID: preparedRoom.roomId,
					ROOM_NAME: prompt.substring(0, 100),
					DATE_CREATED: new Date().toISOString(),
					WORKSPACE_ID: options.workspace?.workspace_id,
				});
				// Fire-and-forget so we navigate without waiting on the response.
				(async () => {
					try {
						await preparedRoom.askMessage(prompt, files);
						chat.refreshRoomLists();
					} catch (e) {
						if ((e as Error)?.name === "UploadError") {
							toast.error(t("room:errors.fileInUse"));
						}
						chat.removeOptimisticRoom(preparedRoom.roomId);
					}
				})();
				openCreatedRoom(preparedRoom.roomId, options);
			} else {
				// Standard flow — create room and send first message together.
				const { room, firstMessage } = await chat.createRoom(
					mode,
					prompt,
					files,
					options,
					options.workspace?.workspace_id,
					undefined,
					prepareRoom,
				);
				void firstMessage.then((error) => {
					if (error?.name === "UploadError") {
						toast.error(t("room:errors.fileInUse"));
					}
				});
				openCreatedRoom(room.roomId, options);
			}
			return true;
		} catch (error: unknown) {
			handleCreateRoomError(error);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Start a message-less room for an agent's scripted greeting. No pixel
	 * ever writes a message, so the greeting never reaches the model as
	 * context.
	 */
	const startGreetingRoom = async (workspaceId: string, name: string) => {
		if (isLoading || isPreparing) {
			return;
		}
		// Claimed here, not in the effect, so bailing above stays retryable.
		greetingRoomStartedForRef.current = workspaceId;
		try {
			setIsLoading(true);
			const options = buildRoomOptions();
			const room = await chat.createEmptyRoom(
				mode,
				name,
				options,
				workspaceId,
				prepareRoom,
			);
			openCreatedRoom(room.roomId, options);
		} catch (error: unknown) {
			handleCreateRoomError(error);
		} finally {
			setIsLoading(false);
		}
	};

	// An agent link's agent with a greeting drops straight into a room with
	// it already rendered, instead of the landing page.
	const greetingId = greetingAgent?.id ?? "";
	const greetingName = greetingAgent?.name ?? "";
	// biome-ignore lint/correctness/useExhaustiveDependencies: greetingRoomStartedForRef guards re-fires; re-listing startGreetingRoom would re-run this every render
	useEffect(() => {
		if (!greetingId || greetingRoomStartedForRef.current === greetingId) {
			return;
		}
		void startGreetingRoom(greetingId, greetingName);
	}, [greetingId, greetingName]);

	return { isLoading, preparation, createRoom };
};
