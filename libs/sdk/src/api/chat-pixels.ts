/**
 * The pixel strings of a room, built on the playground reactors —
 * `CreatePlaygroundRoom`, `AskPlayground`, `AddPlaygroundToolExecution`,
 * `GetPlaygroundMessages` and `GetPlaygroundRooms` — which every surface
 * (playground, desktop, an embedded chat, a terminal agent) uses. The other
 * room reactors have no playground variant and are used as they are.
 *
 * Builders only return pixels, so a caller can batch several in one request
 * or watch one as a streaming job; the wrappers in `chat.ts` run them.
 */

/** A chat turn, as `AskPlayground` takes it. */
export interface PlaygroundTurnParams {
	/** The model engine id. */
	engine: string;
	roomId: string;
	/** The user's message. */
	command: string;
	/** Extra context for the turn, when there is any. */
	context?: string;
	/** Insight file locations sent to the model with the message. */
	media?: string[];
	/** The response the turn follows; omitted for the first turn. */
	parentMessageId?: string;
	/**
	 * Sent as the turn's one `paramValues` map: client tools go in `tools`,
	 * and a model setting such as `temperature` beside them.
	 */
	paramValues?: Record<string, unknown>;
}

/**
 * Persist a stopped turn instead of asking the model: the parts the user saw
 * and a hidden note telling the model next turn that it was cut short.
 */
export interface PlaygroundCommit {
	/** The response parts to persist, as the room shows them. */
	responseParts: unknown[];
	/** The hidden note appended for the model. */
	hiddenMessage: string;
}

/** A tool call's result, as `AddPlaygroundToolExecution` takes it. */
export interface PlaygroundToolExecutionParams {
	/** The model engine id. */
	engine: string;
	roomId: string;
	/** The response holding the tool call. */
	parentMessageId?: string;
	toolId: string;
	toolName: string;
	/** The tool's output, or the failure the model is told about. */
	toolExecutionResponse: string;
	/** As on a turn: client tools go again in `tools`. */
	paramValues?: Record<string, unknown>;
	mcpToolStatus: "success" | "error" | "cancelled" | "paused";
	/** The arguments the tool actually ran with. */
	toolParameterValues?: Record<string, unknown>;
}

/** What `GetPlaygroundRooms` lists. */
export interface PlaygroundRoomsQuery {
	/** Matches room names, case-insensitive. */
	search?: string;
	/**
	 * Matches the room's options JSON — how a surface lists only the rooms it
	 * stamped with its scope token. The backend matches with a LIKE, so scope
	 * tokens must not prefix one another.
	 */
	roomOptionsSearch?: string;
	/** Only pinned (true) or unpinned (false) rooms; omit for both. */
	pinned?: boolean;
	limit?: number;
	offset?: number;
	/** By creation date; defaults to newest first. */
	sort?: "ASC" | "DESC";
	/** The rooms of a mode, such as `collaboration`; omit for normal rooms. */
	mode?: string;
}

/** A room as `GetPlaygroundRooms` lists it. */
export interface PlaygroundRoomRow {
	ROOM_ID: string;
	ROOM_NAME: string;
	DATE_CREATED: string;
	WORKSPACE_ID?: string;
	PINNED?: boolean;
}

/** A markdown export, as `ToDocx` / `ToPdf` take it. */
export interface ExportMarkdownParams {
	markdown: string;
	fileName: string;
	format: "word" | "pdf";
}

/** The extra arguments that turn an ask or a tool save into a commit. */
const commitArgs = (commit: PlaygroundCommit): string =>
	`, responseParts=${JSON.stringify(commit.responseParts)}, hiddenMessage=["<encode>${commit.hiddenMessage}</encode>"]`;

/**
 * The turn's arguments. A stopped turn's commit replays exactly these, so
 * both the live call and the commit are built from this one string.
 */
const turnArgs = ({
	engine,
	roomId,
	command,
	context,
	media = [],
	parentMessageId,
	paramValues = {},
}: PlaygroundTurnParams): string => `engine=["${engine}"],
roomId=["${roomId}"],
command=["<encode>${command}</encode>"],
${context ? `context=["<encode>${context}</encode>"],` : `context=[],`}
${media.length ? `media=${JSON.stringify(media)},` : "media=[],"}
${parentMessageId ? `parentMessageId=["${parentMessageId}"],` : ""}
paramValues=[${JSON.stringify(paramValues)}]`;

/** A tool save's arguments, replayed by its commit the same way. */
const toolExecutionArgs = ({
	engine,
	roomId,
	parentMessageId,
	toolId,
	toolName,
	toolExecutionResponse,
	paramValues = {},
	mcpToolStatus,
	toolParameterValues,
}: PlaygroundToolExecutionParams): string => `engine=["${engine}"],
roomId=["${roomId}"],
${parentMessageId ? `parentMessageId=["${parentMessageId}"],` : ""}
toolId=["${toolId}"],
toolName=["${toolName}"],
toolExecutionResponse=["<encode>${toolExecutionResponse}</encode>"],
paramValues=[${JSON.stringify(paramValues)}],
mcpToolStatus=${JSON.stringify(mcpToolStatus)},
toolParameterValues=[${JSON.stringify(toolParameterValues ?? {})}]`;

/**
 * Build a room's pixels. Each returns one statement, ready to run alone or
 * batched with others.
 */
export const chatPixels = {
	/** `CreatePlaygroundRoom`, from an agent and in a mode when given. */
	createRoom: ({
		workspaceId,
		mode,
	}: {
		workspaceId?: string;
		mode?: string;
	} = {}): string => {
		const args: string[] = [];
		if (workspaceId) {
			args.push(`workspaceId=${JSON.stringify(workspaceId)}`);
		}
		if (mode) {
			args.push(`mode=${JSON.stringify(mode)}`);
		}
		return `CreatePlaygroundRoom(${args.join(", ")})`;
	},

	/** `AskPlayground`, or its commit of a stopped turn. */
	ask: (params: PlaygroundTurnParams, commit?: PlaygroundCommit): string =>
		`AskPlayground(${turnArgs(params)}${commit ? commitArgs(commit) : ""});`,

	/** `AddPlaygroundToolExecution`, or its commit of a stopped turn. */
	addToolExecution: (
		params: PlaygroundToolExecutionParams,
		commit?: PlaygroundCommit,
	): string =>
		`AddPlaygroundToolExecution(${toolExecutionArgs(params)}${commit ? commitArgs(commit) : ""});`,

	/** `GetPlaygroundMessages` for one room. */
	getMessages: (roomId: string): string =>
		`GetPlaygroundMessages(roomId=["${roomId}"]);`,

	/** `GetPlaygroundRooms`, as a META pixel so it stays out of the recipe. */
	getRooms: ({
		search,
		roomOptionsSearch,
		pinned,
		limit,
		offset,
		sort = "DESC",
		mode,
	}: PlaygroundRoomsQuery = {}): string => {
		const args: string[] = [];
		if (search) {
			args.push(`search="<encode>${search}</encode>"`);
		}
		if (roomOptionsSearch) {
			args.push(`roomOptionsSearch=${JSON.stringify(roomOptionsSearch)}`);
		}
		if (pinned !== undefined) {
			args.push(`pinned=[${pinned}]`);
		}
		if (limit !== undefined) {
			args.push(`limit=${limit}`);
		}
		if (offset !== undefined) {
			args.push(`offset=${offset}`);
		}
		args.push(`sort=["${sort}"]`);
		if (mode) {
			args.push(`mode=${JSON.stringify(mode)}`);
		}
		return `META | GetPlaygroundRooms(${args.join(", ")});`;
	},

	/** `GetRoomOptions`. */
	getRoomOptions: (roomId: string): string =>
		`GetRoomOptions(roomId=${JSON.stringify(roomId)});`,

	/** `SetRoomForInsight`: binds the insight the pixel runs in to the room. */
	setRoomForInsight: (roomId: string): string =>
		`SetRoomForInsight(roomId=${JSON.stringify(roomId)});`,

	/** `UpdateRoomOptions` with one options map, as the backend stores it. */
	updateRoomOptions: (roomId: string, options: unknown): string =>
		`UpdateRoomOptions(roomId=${JSON.stringify(roomId)}, roomOptions=[${JSON.stringify(options)}]);`,

	/** `RemoveUserRoom`. */
	removeRoom: (roomId: string): string =>
		`RemoveUserRoom(roomId=["${roomId}"]);`,

	/** `RenameRoom`, as a META pixel. */
	renameRoom: (roomId: string, name: string): string =>
		`META | RenameRoom(roomId=["${roomId}"], name=["<encode>${name}</encode>"]);`,

	/** `PinRoom`. */
	pinRoom: (roomId: string, pinned: boolean): string =>
		`PinRoom(roomId=["${roomId}"], pinned=[${pinned}]);`,

	/** `GenerateRoomName`, from the room's messages unless given a prompt. */
	generateRoomName: ({
		roomId,
		prompt,
		engine,
	}: {
		roomId: string;
		prompt?: string;
		engine?: string;
	}): string => {
		const args = [`roomId=${JSON.stringify(roomId)}`];
		if (prompt) {
			args.push(`prompt=["<encode>${prompt}</encode>"]`);
		}
		if (engine) {
			args.push(`engine=${JSON.stringify(engine)}`);
		}
		return `GenerateRoomName(${args.join(", ")});`;
	},

	/** `StopPixelExecution` for a job. */
	stopJob: (jobId: string): string => `StopPixelExecution(id=["${jobId}"]);`,

	/** `SubmitLlmFeedback` on a response. */
	submitFeedback: ({
		roomId,
		messageId,
		rating,
		feedbackText = "",
	}: {
		roomId: string;
		messageId: string;
		/** Thumbs up (true) or down (false); null clears the rating. */
		rating: boolean | null;
		feedbackText?: string;
	}): string =>
		`SubmitLlmFeedback(messageId=${JSON.stringify(messageId)}, feedbackText=${JSON.stringify(feedbackText)}, rating=${JSON.stringify(rating)}, roomId=${JSON.stringify(roomId)});`,

	/** `ToDocx` or `ToPdf` over markdown. */
	exportMarkdown: ({ markdown, fileName, format }: ExportMarkdownParams) =>
		format === "word"
			? `ToDocx(markdown=["<encode>${markdown}</encode>"], fileName="${fileName}");`
			: `ToPdf(markdown=["<encode>${markdown}</encode>"], fileName="${fileName}");`,

	/** `CompactRoomMessages` into a response, by one strategy or the backend's choice. */
	compactMessages: ({
		roomId,
		parentMessageId,
		strategy,
	}: {
		roomId: string;
		parentMessageId: string;
		strategy?: "TOOL_PRUNE" | "SUMMARY" | "AUTO";
	}): string => {
		const strategyArg =
			strategy && strategy !== "AUTO"
				? `, compactionTypes=${JSON.stringify([strategy])}`
				: "";
		return `CompactRoomMessages(roomId=${JSON.stringify(roomId)}, parentMessageId=${JSON.stringify(parentMessageId)}${strategyArg});`;
	},

	/** `DropInsight`: drops the insight the pixel runs in. */
	dropInsight: (): string => "DropInsight()",
} as const;
