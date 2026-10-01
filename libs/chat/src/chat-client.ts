import type {
	PixelStreamMessage,
	RoomMessage,
	RoomMessagePart,
	RoomRecord,
} from "@semoss/sdk";
import {
	askRoom,
	getPixelAsyncResult,
	getPixelJobStreaming,
	getRoomMessages,
	getUserRooms,
	runPixel,
	setRoomForInsight,
} from "@semoss/sdk/react";

export interface ChatModel {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
	engine_subtype?: string;
	capabilities?: string[];
}

export interface ChatRoom {
	ROOM_ID: string;
	ROOM_NAME: string;
	DATE_CREATED?: string;
	PINNED?: boolean;
	WORKSPACE_ID?: string;
}

interface ChatTextPart extends RoomMessagePart {
	type: "TEXT";
	text?: string;
	uiText?: string;
}

export type ChatPixelMessage = RoomMessage;

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	text: string;
}

export interface ChatSession {
	roomId: string;
	insightId: string;
	parentMessageId: string;
}

export interface ChatStreamHandlers {
	onContent?: (content: string) => void;
	onThinking?: (thinking: string) => void;
	onTool?: (
		data: Extract<PixelStreamMessage, { stream_type: "tool" }>["data"],
	) => void;
	onUsage?: (
		data: Extract<PixelStreamMessage, { stream_type: "usage" }>["data"],
	) => void;
}

interface AskChatOutput {
	inputMessage: ChatPixelMessage;
	responseMessage: ChatPixelMessage;
	extraMessages?: ChatPixelMessage[];
}

const POLL_INTERVAL_MS = 500;

const messageText = (message: ChatPixelMessage): string =>
	(message.parts ?? [])
		.filter((part): part is ChatTextPart => part.type === "TEXT")
		.map((part) => part.uiText || part.text || "")
		.join("");

export const normalizeChatMessages = (
	messages: ChatPixelMessage[],
): ChatMessage[] =>
	messages
		.map((message, index) => ({
			id: message.messageId || `message-${index}`,
			role:
				message.io === "INPUT"
					? ("user" as const)
					: ("assistant" as const),
			text: messageText(message),
		}))
		.filter((message) => message.text.trim());

export const fetchChatModels = async (): Promise<ChatModel[]> => {
	const response = await runPixel<[ChatModel[]]>(
		'META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);',
	);
	if (response.errors.length) {
		throw new Error(response.errors.join("\n"));
	}
	return response.pixelReturn[0]?.output ?? [];
};

export const fetchChatRooms = async (): Promise<ChatRoom[]> => {
	const rooms = await getUserRooms("new", { sort: "DESC" });
	return rooms.slice(0, 25).map((room: RoomRecord) => ({
		ROOM_ID: room.roomId,
		ROOM_NAME: room.name,
		DATE_CREATED:
			typeof room.DATE_CREATED === "string"
				? room.DATE_CREATED
				: undefined,
		PINNED: typeof room.PINNED === "boolean" ? room.PINNED : undefined,
		WORKSPACE_ID:
			typeof room.WORKSPACE_ID === "string"
				? room.WORKSPACE_ID
				: undefined,
	}));
};

export const createChatSession = async (): Promise<ChatSession> => {
	const created = await runPixel<[{ roomId: string }]>(
		"CreateRoom();",
		"new",
	);
	if (created.errors.length) {
		throw new Error(created.errors.join("\n"));
	}
	const roomId = created.pixelReturn[0]?.output.roomId;
	if (!roomId) {
		throw new Error("CreateRoom did not return a room ID.");
	}
	await setRoomForInsight(created.insightId, roomId);

	return {
		roomId,
		insightId: created.insightId,
		parentMessageId: "ROOT_PLACEHOLDER_ID",
	};
};

export const loadChatRoom = async (
	roomId: string,
): Promise<{ session: ChatSession; messages: ChatMessage[] }> => {
	const binding = await runPixel<[boolean]>(
		`SetRoomForInsight(roomId=${JSON.stringify(roomId)});`,
		"new",
	);
	if (binding.errors.length) {
		throw new Error(binding.errors.join("\n"));
	}
	const history = await getRoomMessages(binding.insightId, roomId);
	const parentMessageId =
		[...history].reverse().find((message) => message.io === "OUTPUT")
			?.messageId ?? "ROOT_PLACEHOLDER_ID";

	return {
		session: {
			roomId,
			insightId: binding.insightId,
			parentMessageId,
		},
		messages: normalizeChatMessages(history),
	};
};

export const streamChatMessage = async (
	session: ChatSession,
	modelId: string,
	command: string,
	handlers: ChatStreamHandlers = {},
): Promise<ChatMessage> => {
	const { jobId } = await askRoom(session.insightId, {
		engine: modelId,
		roomId: session.roomId,
		command,
		context: "",
		image: [],
		parentMessageId: session.parentMessageId,
		paramValues: [{}],
	});
	if (!jobId) {
		throw new Error("AskRoom did not return a streaming job ID.");
	}

	while (true) {
		const stream = await getPixelJobStreaming(jobId);
		for (const chunk of stream.message) {
			if (chunk.stream_type === "content" && chunk.data.content) {
				handlers.onContent?.(chunk.data.content);
			} else if (
				chunk.stream_type === "thinking" &&
				chunk.data.thinking
			) {
				handlers.onThinking?.(chunk.data.thinking);
			} else if (chunk.stream_type === "tool") {
				handlers.onTool?.(chunk.data);
			} else if (chunk.stream_type === "usage") {
				handlers.onUsage?.(chunk.data);
			}
		}

		if (
			stream.status === "ProgressComplete" ||
			stream.status === "Complete"
		) {
			break;
		}
		if (
			stream.status === "Error" ||
			stream.status === "UnknownJob" ||
			stream.status === "Canceled"
		) {
			throw new Error(`AskRoom streaming ended with ${stream.status}.`);
		}

		await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
	}

	const settled = await getPixelAsyncResult<[AskChatOutput]>(jobId);
	if (settled.errors.length) {
		throw new Error(settled.errors.join("\n"));
	}
	const responseMessage = settled.results[0]?.output.responseMessage;
	if (!responseMessage) {
		throw new Error("AskRoom returned no response message.");
	}
	session.parentMessageId =
		responseMessage.messageId || session.parentMessageId;

	return {
		id: responseMessage.messageId || `response-${Date.now()}`,
		role: "assistant",
		text: messageText(responseMessage),
	};
};
