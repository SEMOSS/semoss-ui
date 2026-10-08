import { Insight } from "@semoss/sdk";
import { toError } from "@semoss/utility/error";
import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import { getAgent } from "@/features/agents/api/get-agent";
import {
	type AgentEmailAttachment,
	readAgentEmailAttachment,
} from "@/features/connectors/api/agent-email-attachments";
import { getRoomMessages } from "@/features/messages/api/get-room-messages";
import type { ConversationMessage } from "@/features/messages/types/message";
import {
	mergeToolStates,
	mergeTranscript,
	threadFromMessages,
} from "@/features/messages/utils/thread-items";
import {
	canEvictRoomEmailStore,
	disposeRoomEmailStore,
} from "@/features/room-email/room-email-store";
import { resolveThreadModel } from "@/features/thread-assistant/api/thread-model";
import {
	getThreadAgent,
	type SubmittedThreadContext,
	threadCommand,
} from "@/features/thread-assistant/thread-context";
import {
	type ThreadChatSettings,
	threadSettingsSchema,
} from "@/features/thread-assistant/thread-settings";
import { callPixel, pixel } from "@/lib/pixel";
import type {
	AgentTurnConfig,
	AgentTurnController,
	AgentTurnSnapshot,
} from "./api/agent-turn-controller";
import {
	evictIdleAgentTurnControllers,
	getAgentTurnController,
} from "./api/agent-turn-registry";
import { createRoom } from "./api/create-room";
import { readLastModel, rememberLastModel } from "./api/last-model";
import { ROOM_HISTORY_CHANGED } from "./api/list-rooms";
import {
	type PlaygroundRoomOptions,
	roomOptionsEnvelopeSchema,
	roomWriteSchema,
} from "./api/room-schemas";
import type { UploadedRoomFile } from "./api/upload-room-files";
import type { ComposerDraft } from "./components/room-composer.types";
import { type RoomSource, roomSourceSchema } from "./source-import/room-source";
import type { ComposerSubmission, PendingToolApproval } from "./types/room";

const emptyDraft = (): ComposerDraft => ({
	document: null,
	text: "",
	files: [],
});
const EMPTY_TURN: AgentTurnSnapshot = {
	messages: [],
	toolStates: {},
	pendingApprovals: [],
	phase: null,
	isSubmitting: false,
	isRestoring: false,
	isCancelling: false,
	isRunning: false,
	turnError: null,
	transportError: null,
	settlementVersion: 0,
};

/** The same state backs a new draft, an imported source, and a saved room. */
export interface RoomSessionSnapshot {
	roomId: string;
	title: string;
	options: PlaygroundRoomOptions | null;
	source: RoomSource | null;
	contextFiles: UploadedRoomFile[];
	settings: ThreadChatSettings;
	agent: WorkspaceAgent | null;
	modelId: string;
	modelName: string;
	isReady: boolean;
	isLoading: boolean;
	isPreparing: boolean;
	isSavingSettings: boolean;
	settingsError: string | null;
	isLoadingModel: boolean;
	modelError: string | null;
	error: Error | null;
	turn: AgentTurnSnapshot;
	composerDraft: ComposerDraft;
	composerResetKey: number;
	submissionError: string;
	hasUnconfirmedSubmission: boolean;
	submissionNotice: string | null;
	isCreationUncertain: boolean;
}

/** One room owns its insight, retained draft, and existing agent-run observer. */
export class RoomSession {
	readonly insight = new Insight();
	private snapshot: RoomSessionSnapshot;
	private listeners = new Set<() => void>();
	private initializing: Promise<void> | null = null;
	private creating: Promise<string> | null = null;
	private controller: AgentTurnController | null = null;
	private unsubscribeTurn: (() => void) | null = null;
	private history: ConversationMessage[] = [];
	private references = 0;
	private isDisposed = false;
	private isConfigured = false;
	private readonly isNewRoom: boolean;
	private configurationRevision = 0;
	private uncertainCommand: string | null = null;
	private uncertainDraft: ComposerDraft | null = null;
	private optionQueue: Promise<void> = Promise.resolve();

	constructor(
		readonly scope: string,
		roomId = "",
	) {
		this.isNewRoom = !roomId;
		const last = readLastModel();
		const modelId = roomId
			? ""
			: (last?.modelId ?? getThreadAgent()?.modelId ?? "");
		this.snapshot = {
			roomId,
			title: "New chat",
			options: null,
			source: null,
			contextFiles: [],
			settings: {
				modelId,
				agentId: roomId ? "" : (getThreadAgent()?.id ?? ""),
				instructions: "",
				temperature: null,
				mcp: [],
			},
			agent: null,
			modelId,
			modelName: roomId ? "" : (last?.modelName ?? modelId),
			isReady: false,
			isLoading: true,
			isPreparing: false,
			isSavingSettings: false,
			settingsError: null,
			isLoadingModel: false,
			modelError: null,
			error: null,
			turn: EMPTY_TURN,
			composerDraft: emptyDraft(),
			composerResetKey: 0,
			submissionError: "",
			hasUnconfirmedSubmission: false,
			submissionNotice: null,
			isCreationUncertain: false,
		};
	}

	getSnapshot = (): RoomSessionSnapshot => this.snapshot;
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};
	/** Hold the insight across asynchronous sends, uploads, and editor saves. */
	retain = (): (() => void) => {
		this.references++;
		return () => {
			this.references--;
		};
	};
	canEvict({
		discardDraft = false,
	}: {
		discardDraft?: boolean;
	} = {}): boolean {
		const s = this.snapshot;
		return (
			!this.references &&
			!this.listeners.size &&
			!this.initializing &&
			!this.creating &&
			!s.isPreparing &&
			!s.isSavingSettings &&
			!s.turn.isRunning &&
			!s.turn.isRestoring &&
			!s.turn.isSubmitting &&
			!s.hasUnconfirmedSubmission &&
			!s.isCreationUncertain &&
			(discardDraft ||
				(!s.composerDraft.text && !s.composerDraft.files.length)) &&
			canEvictRoomEmailStore(this)
		);
	}
	dispose(): void {
		if (this.isDisposed) return;
		this.isDisposed = true;
		this.unsubscribeTurn?.();
		disposeRoomEmailStore(this);
		if (this.controller) evictIdleAgentTurnControllers(this.controller);
		this.listeners.clear();
		if (this.insight.isInitialized)
			void this.insight.destroy().catch(() => undefined);
	}
	private update(patch: Partial<RoomSessionSnapshot>): void {
		if (this.isDisposed) return;
		this.snapshot = { ...this.snapshot, ...patch };
		for (const listener of this.listeners) listener();
	}
	setComposerDraft = (composerDraft: ComposerDraft): void => {
		this.update({ composerDraft });
	};
	removeContextFile = (path: string): void => {
		this.update({
			contextFiles: this.snapshot.contextFiles.filter(
				(file) => file.fileLocation !== path,
			),
		});
	};

	initialize = (): Promise<void> => {
		if (this.initializing) return this.initializing;
		if (this.snapshot.isReady && !this.snapshot.error)
			return Promise.resolve();
		this.initializing = this.load().finally(() => {
			this.initializing = null;
		});
		return this.initializing;
	};
	private async load(): Promise<void> {
		this.update({ isLoading: true, error: null });
		try {
			if (!this.insight.isReady)
				await this.insight.initialize({ disableRoom: true });
			if (!this.insight.isReady)
				throw new Error("Could not connect to the room. Please retry.");
			if (
				this.snapshot.roomId &&
				(!this.isNewRoom || this.isConfigured)
			) {
				await this.loadRoom();
				this.isConfigured = true;
			}
			this.update({ isReady: true });
			await this.resolveDefaults();
		} catch (cause) {
			this.update({ error: toError(cause), isReady: false });
		} finally {
			this.update({ isLoading: false });
		}
	}
	private async loadRoom(): Promise<void> {
		const roomId = this.snapshot.roomId;
		const envelope = await callPixel(
			this.insight.actions,
			pixel("GetRoomOptions", { roomId }),
			roomOptionsEnvelopeSchema,
		);
		const bound = await callPixel(
			this.insight.actions,
			pixel("SetRoomForInsight", { roomId }),
			roomWriteSchema,
		);
		if (!bound) throw new Error("Could not bind this room to its insight.");
		const options = envelope.OPTIONS;
		const parsedSource = roomSourceSchema.safeParse(options.source);
		if (options.source !== undefined && !parsedSource.success)
			throw new Error(
				"This room's source information could not be read.",
			);
		const source = parsedSource.success ? parsedSource.data : null;
		this.update({
			options,
			source,
			title: envelope.ROOM_NAME || this.snapshot.title,
			modelId: options.modelId,
			// A just-created room reloads its own model; keep the name resolved for it.
			modelName:
				options.modelId === this.snapshot.modelId
					? this.snapshot.modelName
					: options.modelId,
			settings: {
				modelId: options.modelId,
				agentId: options.workspace?.workspace_id ?? "",
				instructions: options.instructions,
				temperature: options.temperature ?? null,
				mcp: options.mcp.filter(
					(item) => !item.fromRoom && !item.fromWorkspace,
				),
			},
		});
		this.attach();
		await this.refreshHistory();
		await this.controller?.reconnect();
		if (source && !this.hasUserMessage())
			this.update({ contextFiles: [source.file] });
	}
	private config(): AgentTurnConfig {
		return {
			insightId: this.insight.insightId,
			controllerScopeId: this.scope,
			roomId: this.snapshot.roomId,
			agentId: this.snapshot.settings.agentId,
			engine: this.snapshot.modelId,
			maxTurns:
				this.snapshot.agent?.config_json?.budgets?.max_turns ?? 40,
			maxReflections:
				this.snapshot.agent?.config_json?.budgets?.max_reflections,
		};
	}
	private attach(): void {
		if (!this.snapshot.roomId) return;
		if (this.controller) {
			this.controller.configure(this.config());
			return;
		}
		this.controller = getAgentTurnController(this.config());
		this.unsubscribeTurn = this.controller.subscribe(() => {
			const turn = this.controller?.getSnapshot();
			if (!turn) return;
			const settled =
				turn.settlementVersion > this.snapshot.turn.settlementVersion;
			this.publishTurn(turn);
			if (settled) {
				void this.refreshHistory().catch((cause: unknown) =>
					this.update({ error: toError(cause) }),
				);
				this.notifyHistory();
			}
		});
		this.publishTurn(this.controller.getSnapshot());
	}
	private publishTurn(turn: AgentTurnSnapshot): void {
		this.update({
			turn: {
				...turn,
				messages: mergeToolStates(
					mergeTranscript(this.history, turn.messages),
					turn.toolStates,
				),
			},
		});
	}
	private hasUserMessage(): boolean {
		return this.snapshot.turn.messages.some(
			(message) => message.role === "user",
		);
	}
	refreshHistory = async (): Promise<void> => {
		if (!this.snapshot.roomId || !this.controller) return;
		const messages = await getRoomMessages(
			this.insight.actions,
			this.snapshot.roomId,
		);
		this.history = threadFromMessages(messages);
		this.controller.reconcileHistory(messages);
		this.publishTurn(this.controller.getSnapshot());
	};
	private notifyHistory(): void {
		window.dispatchEvent(
			new CustomEvent(ROOM_HISTORY_CHANGED, {
				detail: {
					roomId: this.snapshot.roomId,
					roomName: this.snapshot.title,
					modelId: this.snapshot.modelId,
					dateCreated: new Date().toISOString(),
				},
			}),
		);
	}

	/** Allocate once; a failed configuration or upload can retry the same room. */
	create = (title: string): Promise<string> => {
		if (this.creating) return this.creating;
		if (this.isConfigured && this.snapshot.roomId)
			return Promise.resolve(this.snapshot.roomId);
		this.creating = this.prepare(title).finally(() => {
			this.creating = null;
		});
		return this.creating;
	};
	private async prepare(title: string): Promise<string> {
		await this.initialize();
		if (!this.snapshot.isReady)
			throw this.snapshot.error ?? new Error("The room is not ready.");
		if (this.snapshot.isCreationUncertain)
			throw new Error(
				"Room creation could not be confirmed. Check your history before starting another room.",
			);
		this.update({ isPreparing: true, error: null, title });
		try {
			const settings = this.snapshot.settings;
			await createRoom(
				this.insight.actions,
				this.insight.insightId,
				{
					name: title,
					workspaceId: settings.agentId || null,
					workspaceName: this.snapshot.agent?.name,
					modelId: settings.modelId,
					instructions: settings.instructions,
					mcp: settings.mcp,
					temperature: settings.temperature,
				},
				{
					roomId: this.snapshot.roomId || undefined,
					onCreated: (roomId) => {
						this.update({ roomId });
						registerRoomSession(this);
					},
				},
			);
			await this.loadRoom();
			this.isConfigured = true;
			this.notifyHistory();
			return this.snapshot.roomId;
		} catch (cause) {
			this.update({
				error: toError(cause),
				isCreationUncertain: !this.snapshot.roomId,
			});
			throw cause;
		} finally {
			this.update({ isPreparing: false });
		}
	}
	/** Serialize option writes so independent features preserve each other's fields. */
	updateOptions = (
		changes: Partial<PlaygroundRoomOptions>,
	): Promise<void> => {
		const save = this.optionQueue.then(async () => {
			if (!this.snapshot.roomId || !this.snapshot.options)
				throw new Error("The room is not ready.");
			const options = { ...this.snapshot.options, ...changes };
			const saved = await callPixel(
				this.insight.actions,
				pixel("UpdateRoomOptions", {
					roomId: this.snapshot.roomId,
					roomOptions: [
						{
							...options,
							mcp: options.mcp.filter(
								(item) => !item.fromRoom && !item.fromWorkspace,
							),
						},
					],
				}),
				roomWriteSchema,
			);
			if (!saved) throw new Error("Could not save the room settings.");
			this.update({ options });
		});
		this.optionQueue = save.catch(() => undefined);
		return save;
	};
	setSource = async (value: RoomSource): Promise<void> => {
		const source = roomSourceSchema.parse(value);
		await this.updateOptions({ source });
		this.update({
			source,
			contextFiles: this.hasUserMessage() ? [] : [source.file],
		});
	};
	resolveDefaults = async (): Promise<void> => {
		const revision = ++this.configurationRevision;
		this.update({ isLoadingModel: true, modelError: null });
		try {
			const agentId = this.snapshot.settings.agentId;
			const agent = agentId
				? await getAgent(this.insight.actions, agentId)
				: null;
			const model = await resolveThreadModel(this.insight.actions, [
				this.snapshot.modelId,
				readLastModel()?.modelId ?? "",
				agent?.config_json?.model_id ?? getThreadAgent()?.modelId ?? "",
			]);
			if (revision !== this.configurationRevision || this.isDisposed)
				return;
			const modelId = model?.engine_id ?? "";
			this.update({
				agent,
				modelId,
				modelName:
					model?.engine_display_name || model?.engine_name || modelId,
				settings: { ...this.snapshot.settings, modelId },
				modelError: model
					? null
					: "No text-generation model is available. Choose a model in Settings.",
			});
			this.attach();
		} catch (cause) {
			if (revision === this.configurationRevision)
				this.update({ modelError: toError(cause).message });
		} finally {
			if (revision === this.configurationRevision)
				this.update({ isLoadingModel: false });
		}
	};
	private assertIdle(): void {
		const s = this.snapshot;
		if (
			!s.isReady ||
			s.isPreparing ||
			s.isSavingSettings ||
			s.turn.isRunning ||
			s.turn.isSubmitting ||
			s.turn.isRestoring ||
			s.hasUnconfirmedSubmission
		)
			throw new Error(
				"Wait for the current connection or response to finish.",
			);
	}
	saveSettings = async (
		_title: string,
		values: ThreadChatSettings,
	): Promise<void> => {
		this.assertIdle();
		const settings = threadSettingsSchema.parse(values);
		this.configurationRevision++;
		this.update({
			isSavingSettings: true,
			settingsError: null,
			isLoadingModel: false,
		});
		try {
			const agent = settings.agentId
				? await getAgent(this.insight.actions, settings.agentId)
				: null;
			const model = await resolveThreadModel(this.insight.actions, [
				settings.modelId,
			]);
			if (!model || model.engine_id !== settings.modelId)
				throw new Error(
					"This model is no longer available. Choose another model.",
				);
			if (this.isConfigured)
				await this.updateOptions({
					modelId: settings.modelId,
					instructions: settings.instructions,
					temperature: settings.temperature,
					mcp: settings.mcp,
					overrideSystemPrompt: false,
					workspace: settings.agentId
						? {
								workspace_id: settings.agentId,
								name: agent?.name ?? "Assistant",
							}
						: undefined,
				});
			const modelName = model.engine_display_name || model.engine_name;
			this.update({
				settings,
				agent,
				modelId: settings.modelId,
				modelName,
				modelError: null,
			});
			rememberLastModel(settings.modelId, modelName);
			this.attach();
		} catch (cause) {
			this.update({ settingsError: toError(cause).message });
			throw cause;
		} finally {
			this.update({ isSavingSettings: false });
		}
	};
	selectModel = async (modelId: string, _name: string): Promise<void> => {
		await this.saveSettings(this.snapshot.title, {
			...this.snapshot.settings,
			modelId,
		});
	};
	/** Supply source identities and the current editor without repeating source bodies. */
	private command(
		text: string,
		extra: Partial<SubmittedThreadContext>,
	): string {
		const source = this.snapshot.source;
		const threadId = source?.threadId ?? this.snapshot.roomId;
		const revision = source?.file.fileLocation ?? "";
		return threadCommand(
			{
				...extra,
				threadId,
				contextRevision: revision,
				context: {
					threadId,
					revision,
					// Distinguish identical user text when reconciling a lost response.
					requestId: crypto.randomUUID(),
					...(source
						? {
								subject: source.title,
								channel: source.channel,
								sourceFile: source.file.fileLocation,
								messages: source.messages,
							}
						: {}),
				},
			},
			text,
		);
	}
	send = async (
		submission: ComposerSubmission,
		context: Partial<SubmittedThreadContext> = {},
	): Promise<void> => {
		this.assertIdle();
		if (!this.isConfigured || !this.controller)
			throw new Error("Create the room before sending a message.");
		if (this.snapshot.modelError || this.snapshot.settingsError)
			throw new Error(
				this.snapshot.modelError ||
					this.snapshot.settingsError ||
					"Check room settings.",
			);
		const command = this.command(
			submission.text.trim() || "Please review the attached files.",
			context,
		);
		const existingMedia = [...(submission.existingMedia ?? [])];
		for (const file of this.snapshot.contextFiles) {
			if (
				!existingMedia.some(
					(entry) => entry.fileLocation === file.fileLocation,
				)
			)
				existingMedia.push({
					...file,
					insightId: this.insight.insightId,
				});
		}
		this.update({
			isPreparing: true,
			submissionError: "",
			submissionNotice: null,
		});
		const submittedDraft = this.snapshot.composerDraft;
		let requested = false;
		try {
			if (this.snapshot.options?.modelId !== this.snapshot.modelId)
				await this.updateOptions({ modelId: this.snapshot.modelId });
			requested = true;
			const accepted = await this.controller.send(
				{ ...submission, text: command, existingMedia },
				this.config(),
			);
			if (accepted) this.clearSubmittedDraft(submittedDraft);
		} catch (cause) {
			this.uncertainCommand = requested ? command : null;
			this.uncertainDraft = requested ? submittedDraft : null;
			this.update({
				hasUnconfirmedSubmission: requested,
				submissionError: toError(cause).message,
			});
			throw cause;
		} finally {
			this.update({ isPreparing: false });
		}
	};
	private clearSubmittedDraft(submittedDraft: ComposerDraft | null): void {
		const current = this.snapshot.composerDraft;
		const unchanged =
			submittedDraft !== null &&
			current.text === submittedDraft.text &&
			JSON.stringify(current.document) ===
				JSON.stringify(submittedDraft.document) &&
			current.files.length === submittedDraft.files.length &&
			current.files.every(
				(file, index) => file === submittedDraft.files[index],
			);
		this.update({
			composerDraft: unchanged ? emptyDraft() : current,
			contextFiles: [],
			composerResetKey:
				this.snapshot.composerResetKey + (unchanged ? 1 : 0),
			hasUnconfirmedSubmission: false,
			submissionError: "",
		});
	}
	reconnect = async (): Promise<void> => {
		this.update({ error: null, submissionNotice: null });
		try {
			if (!this.snapshot.isReady) {
				await this.initialize();
				return;
			}
			await this.controller?.reconnect();
			await this.refreshHistory();
			if (this.snapshot.turn.transportError)
				throw this.snapshot.turn.transportError;
			if (this.uncertainCommand) {
				const found = this.snapshot.turn.messages.some(
					(message) =>
						message.role === "user" &&
						message.parts.some(
							(part) =>
								part.type === "text" &&
								part.text === this.uncertainCommand,
						),
				);
				if (found) this.clearSubmittedDraft(this.uncertainDraft);
				this.update({
					hasUnconfirmedSubmission: false,
					submissionNotice: found
						? "Your last message was received."
						: "Your last message was not found. You can try sending it again.",
				});
				this.uncertainCommand = null;
				this.uncertainDraft = null;
			}
		} catch (cause) {
			this.update({ error: toError(cause) });
		}
	};
	readEmailAttachment = async (file: AgentEmailAttachment): Promise<File> => {
		const release = this.retain();
		try {
			return await readAgentEmailAttachment(this.insight.actions, file);
		} finally {
			release();
		}
	};
	cancel = async (): Promise<void> => {
		await this.controller?.cancel();
	};
	approve = async (
		approval: PendingToolApproval,
		parameters: Record<string, unknown>,
	): Promise<void> => {
		await this.controller?.approve(approval, parameters);
	};
	reject = async (approval: PendingToolApproval): Promise<void> => {
		await this.controller?.reject(approval);
	};
}

const sessions = new Map<string, RoomSession>();
const MAX_IDLE_ROOMS = 20;
function registerRoomSession(session: RoomSession): void {
	sessions.set(
		JSON.stringify([session.scope, session.getSnapshot().roomId]),
		session,
	);
	const idle = [...sessions].filter(
		([, value]) => value !== session && value.canEvict(),
	);
	for (const [key, value] of idle.slice(
		0,
		Math.max(0, idle.length - MAX_IDLE_ROOMS),
	)) {
		value.dispose();
		sessions.delete(key);
	}
}

/** Create an unallocated draft; it joins the room registry as soon as allocation succeeds. */
export function createRoomSession(scope: string): RoomSession {
	return new RoomSession(scope);
}

/** Resolve only by actual room identity, never by source/thread association. */
export function getRoomSession(scope: string, roomId: string): RoomSession {
	const key = JSON.stringify([scope, roomId]);
	let session = sessions.get(key);
	if (!session) {
		session = new RoomSession(scope, roomId);
		registerRoomSession(session);
	}
	return session;
}
