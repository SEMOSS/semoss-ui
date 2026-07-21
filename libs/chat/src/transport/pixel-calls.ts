import {
	download,
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixelAsync,
	type useInsight,
} from "@semoss/sdk/react";
import { normalizeTimestamp } from "../lib/date";
import type {
	MCPConfig,
	RawPixelMessage,
	RawPlaygroundRoom,
	ResponseMessage,
	RoomSummary,
	StreamChunk,
} from "../types";

/**
 * Generalized from provider-portal-hpp's ChatBotPixelCall.ts (the
 * hand-rolled pixel calls this package replaces) — same pixel strings and
 * response-unwrapping quirks, but parameterized instead of hardcoded to
 * one app's project/engine ids. Streaming (askPlayground,
 * addPlaygroundToolExecution) mirrors playground's real
 * RoomStore.runRoomPixelStreaming exactly — see
 * docs/chat-components/PLAN.md.
 */
export type InsightActions = ReturnType<typeof useInsight>["actions"];

interface PixelActionResult<T> {
	pixelReturn: { output: T }[];
}

function unwrapOutput<T>(result: PixelActionResult<T>): T {
	return result.pixelReturn[0].output;
}

/**
 * AskPlayground/AddPlaygroundToolExecution responses come back with the
 * response message nested either directly or one level deeper under a
 * legacy `pixelReturn[0].output.responseMessage` shape — this fallback
 * chain mirrors HomeChatBot.tsx's defensive unwrapping exactly. Also
 * covers the async-result shape (`{ responseMessage }` directly, no
 * pixelReturn wrapper), since streaming's final result comes from
 * getPixelAsyncResult rather than actions.run.
 */
function extractResponseMessage(data: unknown): ResponseMessage | undefined {
	const asRecord = data as
		| {
				pixelReturn?: {
					output?: { responseMessage?: ResponseMessage };
				}[];
				responseMessage?: ResponseMessage;
		  }
		| undefined;
	return (
		asRecord?.pixelReturn?.[0]?.output?.responseMessage ??
		asRecord?.responseMessage
	);
}

/**
 * Terminal statuses getPixelJobStreaming can report. Only "Complete" and
 * "ProgressComplete" mean success (matching RoomStore.runRoomPixelStreaming
 * exactly). "Canceled" and "UnknownJob" are treated as errors here rather
 * than left to poll forever — RoomStore's real loop doesn't handle those
 * two at all, which would spin indefinitely; that's a real gap in the
 * pattern being copied, not something worth reproducing.
 */
const SUCCESS_STATUSES = new Set(["Complete", "ProgressComplete"]);
const ERROR_STATUSES = new Set(["Error", "Canceled", "UnknownJob"]);
const POLL_INTERVAL_MS = 300;

/**
 * Drives one streaming pixel call end to end: kick off the async job,
 * poll until a terminal status, then fetch the authoritative final
 * result. `onChunk` fires for every streamed chunk as it arrives — for
 * live UI updates only. The tool-call id/name/arguments actually used to
 * execute a tool always come from the final result this function
 * returns, never reconstructed from streamed deltas.
 */
export async function streamPixel(
	insightId: string,
	pixel: string,
	onChunk: (chunk: StreamChunk) => void,
	pollIntervalMs: number = POLL_INTERVAL_MS,
): Promise<unknown> {
	const { jobId } = await runPixelAsync(pixel, insightId);
	if (!jobId) {
		throw new Error("No job ID returned from pixel execution");
	}

	let polling = true;
	while (polling) {
		const response = await getPixelJobStreaming(jobId);
		for (const chunk of response.message) {
			onChunk(chunk as StreamChunk);
		}

		if (SUCCESS_STATUSES.has(response.status)) {
			polling = false;
		} else if (ERROR_STATUSES.has(response.status)) {
			throw new Error(
				`Streaming job ended with status: ${response.status}`,
			);
		} else if (polling) {
			await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
		}
	}

	const result = await getPixelAsyncResult(jobId);
	if (result.errors.length > 0) {
		throw new Error(result.errors.join(""));
	}
	return result.results[0]?.output;
}

export async function createPlaygroundRoom(
	actions: InsightActions,
	workspaceId?: string,
): Promise<{ roomId: string }> {
	const workspaceParam = workspaceId
		? `workspaceId=${JSON.stringify(workspaceId)}`
		: "";
	const result = await actions.run<Record<string, unknown>[]>(
		`CreatePlaygroundRoom(${workspaceParam})`,
	);
	const data = unwrapOutput(result) as { roomId?: string };
	if (!data.roomId) {
		throw new Error("CreatePlaygroundRoom did not return a roomId");
	}
	return { roomId: data.roomId };
}

export async function updateRoomOptions(
	actions: InsightActions,
	params: {
		roomId: string;
		workspaceId?: string;
		instructions?: string;
		temperature?: number;
		/**
		 * Defaults to `[]` only when the caller genuinely has nothing to
		 * report (a brand-new room's first sync) — never omit this once a
		 * room has real attachments, or this call silently wipes them.
		 * Matches `RoomStore.updateRoomOptions`'s real shape
		 * (`room.store.ts:726-747`); `fromWorkspace` entries are stripped
		 * before persisting there too, since those are re-derived from
		 * `GetWorkspace` on every load, never saved on the room itself —
		 * not replicated here since `@semoss/chat` has no agent/workspace
		 * concept yet (see docs/chat-components/PLAN.md's Batch 9 notes).
		 */
		mcp?: MCPConfig[];
	},
): Promise<void> {
	const roomOptions = {
		instructions: params.instructions ?? "",
		mcp: params.mcp ?? [],
		temperature: params.temperature ?? 0.7,
		workspace: { workspace_id: params.workspaceId ?? null },
	};
	const pixel = `UpdateRoomOptions(roomId="${params.roomId}", roomOptions=[${JSON.stringify(roomOptions)}])`;
	await actions.run<Record<string, unknown>[]>(pixel);
}

export async function askPlayground(
	insightId: string,
	params: {
		engineId: string;
		roomId: string;
		command: string;
		temperature?: number;
		parentMessageId?: string;
	},
	onChunk: (chunk: StreamChunk) => void,
): Promise<ResponseMessage> {
	// NOTE: carried over from ChatBotPixelCall.ts as-is — the pixel string
	// is built by direct interpolation, so a `command` containing `"` or
	// `</encode>` could break the pixel grammar. Not fixed here since it's
	// a pre-existing risk in the reactor's own encoding contract, not
	// something this wrapper can safely second-guess without reactor
	// source. Flagged in docs/chat-components/PLAN.md.
	const parentMessageIdParam = params.parentMessageId
		? `, parentMessageId=["${params.parentMessageId}"]`
		: "";
	const pixel = `AskPlayground(engine=["${params.engineId}"], roomId=["${params.roomId}"], command=["<encode>${params.command}</encode>"], context=[], image=[], paramValues=[{"temperature":${params.temperature ?? 0.7}}]${parentMessageIdParam})`;
	const data = await streamPixel(insightId, pixel, onChunk);
	const responseMessage = extractResponseMessage(data);
	if (!responseMessage) {
		const error = (data as { error?: string } | undefined)?.error;
		throw new Error(error ?? "AskPlayground returned no response");
	}
	return responseMessage;
}

export async function runMcpTool(
	actions: InsightActions,
	params: { projectId: string; functionName: string; paramValues: unknown },
): Promise<unknown> {
	const pixel = `RunMCPTool(project=["${params.projectId}"], function=["${params.functionName}"], paramValues=[${JSON.stringify(params.paramValues)}])`;
	const result = await actions.run<Record<string, unknown>[]>(pixel);
	return unwrapOutput(result);
}

export async function addPlaygroundToolExecution(
	insightId: string,
	params: {
		engineId: string;
		roomId: string;
		parentMessageId: string;
		toolId: string;
		functionName: string;
		toolExecutionResponse: string;
	},
	onChunk: (chunk: StreamChunk) => void,
): Promise<ResponseMessage> {
	const encoded = params.toolExecutionResponse
		? `<encode>${params.toolExecutionResponse}</encode>`
		: "<encode></encode>";
	const pixel = `AddPlaygroundToolExecution(engine=["${params.engineId}"], roomId=["${params.roomId}"], parentMessageId=["${params.parentMessageId}"], toolId=["${params.toolId}"], toolName=["${params.functionName}"], toolExecutionResponse=["${encoded}"])`;
	const data = await streamPixel(insightId, pixel, onChunk);
	const responseMessage = extractResponseMessage(data);
	if (!responseMessage) {
		throw new Error("AddPlaygroundToolExecution returned no response");
	}
	return responseMessage;
}

function toRoomSummary(raw: RawPlaygroundRoom): RoomSummary {
	return {
		roomId: raw.ROOM_ID,
		name: raw.ROOM_NAME,
		dateCreated: normalizeTimestamp(raw.DATE_CREATED).toDate(),
		pinned: raw.PINNED ?? false,
		workspaceId: raw.WORKSPACE_ID,
	};
}

/**
 * Pixel string copied verbatim from playground's real
 * `GlobalNav` (`global-nav.tsx`) — fetch-once, no pagination, since a user
 * only ever has a handful of favorites.
 */
export async function listPinnedPlaygroundRooms(
	actions: InsightActions,
): Promise<RoomSummary[]> {
	const result = await actions.run<RawPlaygroundRoom[][]>(
		'META | GetPlaygroundRooms(pinned=[true], sort=["DESC"]);',
	);
	return unwrapOutput(result).map(toRoomSummary);
}

/**
 * Pixel string copied verbatim from playground's real `GlobalNav` —
 * paged/searchable room list, sorted newest first.
 */
export async function listPlaygroundRooms(
	actions: InsightActions,
	params: { search?: string; limit: number; offset: number },
): Promise<RoomSummary[]> {
	const searchParam = params.search
		? `search="<encode>${params.search}</encode>", `
		: "";
	const pixel = `META | GetPlaygroundRooms(${searchParam}limit=${params.limit}, offset=${params.offset}, sort=["DESC"]);`;
	const result = await actions.run<RawPlaygroundRoom[][]>(pixel);
	return unwrapOutput(result).map(toRoomSummary);
}

/**
 * Pixel string matches `ChatStore.renameRoom` (the encoded, more defensive
 * of the two real call sites — `GlobalNav`'s own inline caller skips
 * encoding) — see docs/chat-components/PLAN.md.
 */
export async function renamePlaygroundRoom(
	actions: InsightActions,
	params: { roomId: string; name: string },
): Promise<void> {
	const pixel = `META | RenameRoom(roomId=["${params.roomId}"], name=["<encode>${params.name}</encode>"]);`;
	await actions.run<Record<string, unknown>[]>(pixel);
}

/** Pixel string copied verbatim from `ChatStore.pinRoom`. */
export async function pinPlaygroundRoom(
	actions: InsightActions,
	params: { roomId: string; pinned: boolean },
): Promise<void> {
	const pixel = `PinRoom(roomId=["${params.roomId}"], pinned=[${params.pinned}]);`;
	await actions.run<Record<string, unknown>[]>(pixel);
}

/** Pixel string copied verbatim from `ChatStore.closeRoom`. */
export async function deletePlaygroundRoom(
	actions: InsightActions,
	roomId: string,
): Promise<void> {
	const pixel = `RemoveUserRoom(roomId=["${roomId}"]);`;
	await actions.run<Record<string, unknown>[]>(pixel);
}

/**
 * Loads an existing room's raw message history, one-shot (not streaming) —
 * pixel string copied verbatim from `RoomStore.initialize()`. `SetRoomForInsight`'s
 * own output (pixelReturn[2]) is intentionally discarded. `GetRoomOptions`'s
 * output (pixelReturn[1]) used to be discarded too — this transport layer
 * derives continuation point/last-used engine from the messages themselves,
 * not from room options, see `history.ts`'s NormalizedRoomHistory doc
 * comment for why — but `mcp` genuinely only lives in room options (it's
 * not a per-message field), so that one piece is now parsed out and
 * returned alongside the messages, matching the real shape
 * `RoomStore.initialize()`/`fetchRoomOptions()` read
 * (`packages/playground/src/stores/room/room.store.ts:486-489,686-688`:
 * `pixelReturn[1].output.OPTIONS.mcp`).
 */
export async function getPlaygroundRoomHistory(
	actions: InsightActions,
	roomId: string,
): Promise<{ messages: RawPixelMessage[]; mcp: MCPConfig[] }> {
	const pixel = `GetPlaygroundMessages(roomId=["${roomId}"]); GetRoomOptions(roomId=${JSON.stringify(roomId)}); SetRoomForInsight(roomId=${JSON.stringify(roomId)});`;
	// actions.run<O>()'s real type (see the SDK's runPixel) types every
	// pixelReturn entry's `output` as the same O[number] union, not
	// correlated per-index — cast each index explicitly, matching how
	// playground's own RoomStore.initialize()/fetchRoomOptions() read
	// this exact multi-statement pixel's results.
	const result = await actions.run<Record<string, unknown>[]>(pixel);
	const messages = result.pixelReturn[0]
		.output as unknown as RawPixelMessage[];
	const optionsOutput = result.pixelReturn[1]?.output as unknown as
		| { OPTIONS?: { mcp?: MCPConfig[] } }
		| undefined;
	return {
		messages,
		mcp: optionsOutput?.OPTIONS?.mcp ?? [],
	};
}

/** Pixel string copied verbatim from `ResponseMessageStore.recordFeedback` — `rating: null` clears a previously-recorded rating (matches playground's own toggle-off-to-remove behavior). */
export async function submitFeedback(
	actions: InsightActions,
	params: {
		roomId: string;
		messageId: string;
		rating: boolean | null;
		feedbackText?: string;
	},
): Promise<void> {
	const pixel = `SubmitLlmFeedback(messageId=${JSON.stringify(params.messageId)}, feedbackText=${JSON.stringify(params.feedbackText ?? "")}, rating=${JSON.stringify(params.rating)}, roomId=${JSON.stringify(params.roomId)});`;
	await actions.run<Record<string, unknown>[]>(pixel);
}

/**
 * Renders `markdown` server-side to a Word/PDF file and triggers a browser
 * download — pixel strings (`ToDocx`/`ToPdf`) and the `FILE_DOWNLOAD`
 * operationType check copied verbatim from
 * `ResponseMessageStore.downloadResponse`.
 */
export async function downloadMessageAsFile(
	actions: InsightActions,
	insightId: string,
	params: { format: "word" | "pdf"; markdown: string; fileName: string },
): Promise<void> {
	const encoded = `<encode>${params.markdown}</encode>`;
	const pixel =
		params.format === "word"
			? `ToDocx(markdown=["${encoded}"], fileName="${params.fileName}");`
			: `ToPdf(markdown=["${encoded}"], fileName="${params.fileName}");`;
	const result = await actions.run<[string]>(pixel);
	const { operationType, output } = result.pixelReturn[0];
	if (!operationType?.includes("FILE_DOWNLOAD")) {
		throw new Error(
			`Failed to generate ${params.format.toUpperCase()} file`,
		);
	}
	await download(insightId, output);
}
