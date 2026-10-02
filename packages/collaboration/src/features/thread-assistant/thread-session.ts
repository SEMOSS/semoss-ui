import { Insight } from "@semoss/sdk";
import { toError } from "@semoss/utility";
import type { WorkspaceAgent } from "@/features/agents/api/agent-schemas";
import { getAgent } from "@/features/agents/api/get-agent";
import {
	type AgentEmailAttachment,
	readAgentEmailAttachment,
} from "@/features/connectors/api/agent-email-attachments";
import {
	type IsolatedAttachment,
	stageAttachmentIsolated,
	stageMailAttachmentIsolated,
} from "@/features/connectors/api/mail-attachment-download";
import {
	downloadStagedAttachment,
	stageMailAttachment,
} from "@/features/connectors/api/microsoft";
import type {
	SourceAttachment,
	StagedSourceAttachment,
} from "@/features/connectors/types";
import { getRoomMessages } from "@/features/messages/api/get-room-messages";
import type { ConversationMessage } from "@/features/messages/types/message";
import {
	mergeToolStates,
	threadFromMessages,
} from "@/features/messages/utils/thread-items";
import type {
	AgentTurnController,
	AgentTurnSnapshot,
} from "@/features/rooms/api/agent-turn-controller";
import {
	evictIdleAgentTurnControllers,
	getAgentTurnController,
} from "@/features/rooms/api/agent-turn-registry";
import {
	readLastModel,
	rememberLastModel,
} from "@/features/rooms/api/last-model";
import type {
	ComposerSubmission,
	PendingToolApproval,
} from "@/features/rooms/types/room";
import type { InsightActions } from "@/lib/pixel";
import {
	MAX_ATTACHMENT_BYTES,
	MAX_MESSAGE_FILE_BYTES,
	sendsAsText,
	stageThreadAttachment,
} from "./api/thread-attachments";
import {
	compactThreadMessages,
	type ThreadCompactionStrategy,
} from "./api/thread-compaction";
import { resolveThreadModel } from "./api/thread-model";
import {
	bindThreadRoom,
	canContinueThreadRoom,
	findThreadRoom,
	prepareThreadRoom,
	type ThreadRoomAssociation,
	type ThreadRoomMetadata,
} from "./api/thread-room";
import {
	getThreadAgent,
	type SubmittedThreadContext,
	THREAD_ASSISTANT_INSTRUCTIONS,
	threadCommand,
} from "./thread-context";
import {
	settingsFromRoom,
	type ThreadChatSettings,
	threadSettingsSchema,
} from "./thread-settings";
import { type ThreadUsage, threadUsage } from "./thread-usage";

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

/** Can the owner leave this room for a fresh one right now. */
export function canStartNewConversation(s: ThreadSessionSnapshot): boolean {
	return (
		s.isReady &&
		Boolean(s.association) &&
		!s.isPreparing &&
		!s.isSavingSettings &&
		!s.isCompacting &&
		!s.turn.isSubmitting &&
		!s.turn.isRunning &&
		!s.turn.isRestoring
	);
}

interface ThreadSessionSnapshot {
	usage: ThreadUsage;
	isCompacting: boolean;
	compactionError: string | null;
	compactionNotice: string | null;
	settings: ThreadChatSettings;
	agent: WorkspaceAgent | null;
	isSavingSettings: boolean;
	settingsError: string | null;
	isLoadingModel: boolean;
	modelError: string | null;
	isReady: boolean;
	isLoading: boolean;
	isPreparing: boolean;
	error: Error | null;
	association: ThreadRoomAssociation | null;
	modelId: string;
	modelName: string;
	turn: AgentTurnSnapshot;
	/** An uncertain submit is checked before the user can choose to retry. */
	hasUnconfirmedSubmission: boolean;
	submissionNotice: string | null;
	isCreationUncertain: boolean;
	composerResetKey: number;
}

/** Own one isolated insight so thread navigation cannot redirect file uploads. */
export class ThreadSession {
	readonly insight = new Insight();
	private snapshot: ThreadSessionSnapshot = {
		usage: { contextTokens: null, totalTokens: null },
		isCompacting: false,
		compactionError: null,
		compactionNotice: null,
		settings: {
			modelId: "",
			agentId: getThreadAgent()?.id ?? "",
			instructions: "",
			temperature: null,
			mcp: [],
		},
		agent: null,
		isSavingSettings: false,
		settingsError: null,
		isLoadingModel: true,
		modelError: null,
		isReady: false,
		isLoading: true,
		isPreparing: false,
		error: null,
		association: null,
		// a thread without a conversation yet starts on the last model picked in this browser, else the agent's
		modelId: readLastModel()?.modelId ?? getThreadAgent()?.modelId ?? "",
		modelName:
			readLastModel()?.modelName ?? getThreadAgent()?.modelId ?? "",
		turn: EMPTY_TURN,
		hasUnconfirmedSubmission: false,
		submissionNotice: null,
		isCreationUncertain: false,
		composerResetKey: 0,
	};
	private listeners = new Set<() => void>();
	private initializing: Promise<void> | null = null;
	private controller: AgentTurnController | null = null;
	private history: ConversationMessage[] = [];
	private unsubscribeTurn: (() => void) | null = null;
	private pending: { metadata: ThreadRoomMetadata; roomId?: string } | null =
		null;
	private uncertainCommand: string | null = null;
	private references = 0;
	private isDisposed = false;
	private configurationRevision = 0;

	constructor(
		readonly threadId: string,
		private readonly controllerScopeId?: string,
		private readonly downloadOwner?: {
			insightId: string;
			actions: InsightActions;
		},
	) {}

	readEmailAttachment = async (file: AgentEmailAttachment): Promise<File> => {
		const release = this.retain();
		try {
			return await readAgentEmailAttachment(this.insight.actions, file);
		} finally {
			release();
		}
	};

	getSnapshot = (): ThreadSessionSnapshot => this.snapshot;
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};
	retain(): () => void {
		this.references += 1;
		return () => {
			this.references -= 1;
		};
	}
	canEvict(): boolean {
		return (
			!this.references &&
			!this.initializing &&
			!this.snapshot.isPreparing &&
			!this.snapshot.isCompacting &&
			!this.snapshot.isSavingSettings &&
			!this.snapshot.turn.isRunning &&
			!this.snapshot.turn.isRestoring &&
			!this.snapshot.turn.isSubmitting &&
			!this.snapshot.hasUnconfirmedSubmission &&
			!this.snapshot.isCreationUncertain &&
			!this.pending
		);
	}
	dispose(): void {
		this.isDisposed = true;
		this.unsubscribeTurn?.();
		if (this.controller) evictIdleAgentTurnControllers(this.controller);
		this.listeners.clear();
		void this.insight.destroy().catch(() => undefined);
	}
	private update(patch: Partial<ThreadSessionSnapshot>): void {
		if (this.isDisposed) return;
		this.snapshot = { ...this.snapshot, ...patch };
		for (const listener of this.listeners) listener();
	}

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
				throw new Error(
					"Could not connect the assistant. Please retry.",
				);
			const association = await findThreadRoom(
				this.insight.actions,
				this.threadId,
			);
			if (this.isDisposed) return;
			if (association) {
				await bindThreadRoom(this.insight.actions, association.roomId);
				this.update({
					association,
					modelId: association.metadata.modelId,
					modelName: association.metadata.modelId,
					settings: settingsFromRoom(
						association.options,
						association.metadata.agentId,
					),
				});
				this.attach(association);
				await this.readHistory();
				await this.controller?.reconnect();
			}
			this.update({ isReady: true });
			await this.resolveDefaults();
		} catch (cause) {
			this.update({ error: toError(cause) });
		} finally {
			this.update({ isLoading: false });
		}
	}
	private attach(association: ThreadRoomAssociation): void {
		this.unsubscribeTurn?.();
		const controller = getAgentTurnController({
			insightId: this.insight.insightId,
			controllerScopeId: this.controllerScopeId,
			roomId: association.roomId,
			agentId: association.metadata.agentId ?? "",
			engine: association.metadata.modelId,
			maxTurns: 40,
		});
		this.controller = controller;
		this.history = [];
		this.unsubscribeTurn = controller.subscribe(() => {
			const snapshot = controller.getSnapshot();
			const settled =
				snapshot.settlementVersion >
				this.snapshot.turn.settlementVersion;
			this.publishTurn(snapshot);
			if (settled)
				void this.readHistory().catch((cause: unknown) =>
					this.update({ error: toError(cause) }),
				);
		});
		this.update({ turn: controller.getSnapshot() });
	}
	private publishTurn(turn: AgentTurnSnapshot): void {
		const byId = new Map<string, ConversationMessage>();
		for (const message of [...this.history, ...turn.messages])
			byId.set(message.id, message);
		this.update({
			turn: {
				...turn,
				messages: mergeToolStates([...byId.values()], turn.toolStates),
			},
		});
	}
	private async readHistory(): Promise<void> {
		const association = this.snapshot.association;
		const controller = this.controller;
		if (!association || !controller) return;
		const messages = await getRoomMessages(
			this.insight.actions,
			association.roomId,
		);
		if (this.controller !== controller || this.isDisposed) return;
		this.update({ usage: threadUsage(messages) });
		this.history = threadFromMessages(messages);
		controller.reconcileHistory(messages);
		this.publishTurn(controller.getSnapshot());
	}

	selectModel(modelId: string, modelName: string): void {
		if (
			this.snapshot.isCompacting ||
			this.snapshot.isPreparing ||
			this.snapshot.turn.isRunning ||
			this.snapshot.hasUnconfirmedSubmission
		)
			return;
		rememberLastModel(modelId, modelName);
		this.configurationRevision++;
		this.update({
			modelId,
			modelName,
			settings: { ...this.snapshot.settings, modelId },
			modelError: null,
		});
	}

	/** Catalog reads cannot overwrite a newer explicit selection or save. */
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
					model?.engine_display_name || model?.engine_name || "",
				settings: { ...this.snapshot.settings, modelId },
				modelError: model
					? null
					: "No text-generation model is available. Choose a model in Settings or ask your administrator for access.",
			});
		} catch (cause) {
			if (revision === this.configurationRevision)
				this.update({ modelError: toError(cause).message });
		} finally {
			if (revision === this.configurationRevision)
				this.update({ isLoadingModel: false });
		}
	};

	/** Persist configuration without replacing the room or discarding its history. */
	saveSettings = async (
		title: string,
		values: ThreadChatSettings,
	): Promise<void> => {
		const settings = threadSettingsSchema.parse(values);
		if (
			!this.snapshot.isReady ||
			this.snapshot.isCompacting ||
			this.snapshot.isSavingSettings ||
			this.snapshot.isPreparing ||
			this.snapshot.turn.isRunning ||
			this.snapshot.turn.isRestoring ||
			this.snapshot.turn.isSubmitting ||
			this.snapshot.hasUnconfirmedSubmission ||
			this.snapshot.isCreationUncertain
		)
			throw new Error(
				"Wait for the current connection or response to finish before saving settings.",
			);
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
			const metadata: ThreadRoomMetadata = {
				version: 1,
				threadId: this.threadId,
				contextRevision:
					this.snapshot.association?.metadata.contextRevision ?? "",
				modelId: settings.modelId,
				...(settings.agentId && { agentId: settings.agentId }),
			};
			const attempt = {
				metadata,
				roomId:
					this.snapshot.association?.roomId ?? this.pending?.roomId,
			};
			this.pending = attempt;
			const association = await prepareThreadRoom(
				this.insight.actions,
				this.insight.insightId,
				title,
				metadata,
				{
					roomId: attempt.roomId,
					onCreated: (roomId) => {
						attempt.roomId = roomId;
					},
				},
				settings,
			);
			this.pending = null;
			this.update({
				settings,
				agent,
				association,
				modelId: settings.modelId,
				modelName: model.engine_display_name || model.engine_name,
				modelError: null,
			});
			rememberLastModel(
				settings.modelId,
				model.engine_display_name || model.engine_name,
			);
			this.attach(association);
			await this.readHistory();
		} catch (cause) {
			this.update({
				settingsError: toError(cause).message,
				...(this.pending && !this.pending.roomId
					? { isCreationUncertain: true }
					: {}),
			});
			throw cause;
		} finally {
			this.update({ isSavingSettings: false });
		}
	};

	/** Download-only files never enter a folder the assistant can read. */
	downloadAttachment = async (
		sourceUid: string | undefined,
		attachment: SourceAttachment,
	): Promise<void> => {
		const { file, actions } = await this.stageIsolated(
			sourceUid,
			attachment,
		);
		await downloadStagedAttachment(actions, file);
	};

	/**
	 * Stage a file for the dock's viewers in the download area, so opening it
	 * never gives the assistant a copy. Office and mail files open as their text.
	 *
	 * @returns Where the viewer reads the file, and the tab name to show.
	 */
	previewAttachment = async (
		sourceUid: string | undefined,
		attachment: SourceAttachment,
	): Promise<{ insightId: string; path: string; name: string }> => {
		const { file } = await this.stageIsolated(sourceUid, attachment);
		return file.textPath
			? {
					insightId: file.insightId,
					path: file.textPath,
					name: `${attachment.name} (text)`,
				}
			: {
					insightId: file.insightId,
					path: file.filePath,
					name: attachment.name,
				};
	};

	private async stageIsolated(
		sourceUid: string | undefined,
		attachment: SourceAttachment,
	): Promise<IsolatedAttachment> {
		const owner = this.downloadOwner ?? {
			insightId: this.insight.insightId,
			actions: this.insight.actions,
		};
		if (!attachment.isFile)
			throw new Error(
				"Open this linked or embedded attachment in Outlook.",
			);
		if ((attachment.size ?? 0) > MAX_ATTACHMENT_BYTES)
			throw new Error(
				`${attachment.name} is larger than the 10 MB attachment limit.`,
			);
		if (attachment.messageId)
			return stageAttachmentIsolated(
				owner,
				JSON.stringify([
					this.threadId,
					attachment.messageId,
					attachment.id,
				]),
				(actions, insightId) =>
					stageThreadAttachment(
						actions,
						insightId,
						this.threadId,
						attachment,
						true,
					),
			);
		if (!sourceUid)
			throw new Error("The source for this attachment is unavailable.");
		return stageMailAttachmentIsolated(owner, sourceUid, attachment);
	}

	/** Stage one selected attachment into the room-bound insight for the next request. */
	private async stageForAssistant(
		sourceUid: string | undefined,
		attachment: SourceAttachment,
	): Promise<StagedSourceAttachment> {
		if (attachment.messageId) {
			const file = await stageThreadAttachment(
				this.insight.actions,
				this.insight.insightId,
				this.threadId,
				attachment,
				true,
			);
			// Most providers reject Office and mail files, so never send one raw.
			if (sendsAsText(file.name) && !file.textPath)
				throw new Error(
					file.textError ??
						`The text of ${file.name} could not be read. Remove it and try again.`,
				);
			return file;
		}
		if (!sourceUid)
			throw new Error("The source for this attachment is unavailable.");
		const file = await stageMailAttachment(
			this.insight.actions,
			this.insight.insightId,
			sourceUid,
			attachment.id,
			attachment.name,
		);
		if (file.size > MAX_ATTACHMENT_BYTES)
			throw new Error(`${file.name} exceeds the 10 MB attachment limit.`);
		return file;
	}

	send = async (
		title: string,
		context: SubmittedThreadContext,
		submission: ComposerSubmission,
		sourceUid?: string,
		attachments: SourceAttachment[] = [],
	): Promise<void> => {
		if (
			this.snapshot.isCompacting ||
			this.snapshot.isSavingSettings ||
			this.snapshot.settingsError ||
			this.snapshot.isLoadingModel ||
			this.snapshot.modelError
		)
			throw new Error(
				this.snapshot.settingsError ||
					this.snapshot.modelError ||
					"Chat settings are still loading or saving.",
			);
		if (this.snapshot.isPreparing)
			throw new Error("This message is already being prepared.");
		if (!this.snapshot.isReady || this.snapshot.error)
			throw new Error("Reconnect to the assistant before sending.");
		if (this.snapshot.turn.isRunning || this.snapshot.turn.isRestoring)
			throw new Error("Wait for the current response to finish.");
		if (this.snapshot.hasUnconfirmedSubmission)
			throw new Error("Check the last message before trying again.");
		if (this.snapshot.isCreationUncertain)
			throw new Error(
				"The new conversation could not be confirmed. Check the connection before creating another.",
			);
		if (!this.snapshot.modelId)
			throw new Error("Choose a model before sending.");
		if (context.threadId !== this.threadId)
			throw new Error("This context belongs to a different thread.");
		if (
			attachments.some((attachment) => !attachment.messageId) &&
			!sourceUid
		)
			throw new Error("The source for this attachment is unavailable.");
		if (
			attachments.length +
				submission.files.length +
				(submission.existingMedia?.length ?? 0) >
			5
		)
			throw new Error("Attach up to 5 files per message.");
		// Checked before anything downloads; the backend enforces the same cap.
		const oversized = attachments.find(
			(attachment) => (attachment.size ?? 0) > MAX_ATTACHMENT_BYTES,
		);
		if (oversized)
			throw new Error(
				`${oversized.name} is larger than the 10 MB attachment limit.`,
			);
		// Every later turn re-sends these bytes, and a request over 32 MB fails on Claude.
		const fileBytes =
			attachments
				.filter(
					(attachment) =>
						!(attachment.messageId && sendsAsText(attachment.name)),
				)
				.reduce(
					(total, attachment) => total + (attachment.size ?? 0),
					0,
				) +
			submission.files.reduce((total, file) => total + file.size, 0);
		if (fileBytes > MAX_MESSAGE_FILE_BYTES)
			throw new Error(
				"Files sent with one message can total 20 MB. Send some of them in a later message.",
			);
		this.update({ isPreparing: true, error: null, submissionNotice: null });
		try {
			const agentId = this.snapshot.settings.agentId;
			const metadata: ThreadRoomMetadata = {
				version: 1,
				threadId: this.threadId,
				contextRevision: context.contextRevision,
				modelId: this.snapshot.modelId,
				...(agentId && { agentId }),
			};
			const current = this.snapshot.association;
			if (
				!current ||
				!canContinueThreadRoom(current) ||
				!current.options.instructions.startsWith(
					THREAD_ASSISTANT_INSTRUCTIONS,
				) ||
				current.metadata.contextRevision !== metadata.contextRevision ||
				current.metadata.modelId !== metadata.modelId ||
				current.metadata.agentId !== metadata.agentId
			) {
				if (
					!this.pending ||
					JSON.stringify(this.pending.metadata) !==
						JSON.stringify(metadata)
				)
					this.pending = {
						metadata,
						...(current ? { roomId: current.roomId } : {}),
					};
				const attempt = this.pending;
				let association: ThreadRoomAssociation;
				try {
					association = await prepareThreadRoom(
						this.insight.actions,
						this.insight.insightId,
						title,
						metadata,
						{
							roomId: attempt.roomId,
							onCreated: (roomId) => {
								attempt.roomId = roomId;
							},
						},
						this.snapshot.settings,
					);
				} catch (cause) {
					if (!attempt.roomId)
						this.update({ isCreationUncertain: true });
					throw cause;
				}
				this.pending = null;
				this.update({ association });
				if (
					current?.roomId !== association.roomId ||
					current.metadata.agentId !== association.metadata.agentId
				) {
					this.attach(association);
					await this.readHistory();
				}
			}
			if (!this.controller)
				throw new Error("The conversation is not ready.");
			if (this.controller.getSnapshot().isRestoring)
				await this.controller.reconnect();
			if (this.snapshot.turn.transportError)
				throw this.snapshot.turn.transportError;
			if (this.snapshot.turn.isRunning)
				throw new Error("Wait for the current response to finish.");
			const existingMedia = [...(submission.existingMedia ?? [])];
			const sent: NonNullable<SubmittedThreadContext["attachments"]> = [];
			for (const attachment of attachments) {
				const file = await this.stageForAssistant(
					sourceUid,
					attachment,
				);
				const location = file.textPath ?? file.filePath;
				existingMedia.push({
					insightId: file.insightId,
					fileLocation: location,
					fileName: file.textPath ? `${file.name} (text)` : file.name,
				});
				sent.push({
					messageId: attachment.messageId ?? file.sourceUid,
					attachmentId: attachment.id,
					name: file.name,
					file: location,
					sentAs: file.textPath ? "text" : "file",
				});
			}
			const command = threadCommand(
				sent.length ? { ...context, attachments: sent } : context,
				submission.text.trim() || "Please review the attached files.",
			);
			try {
				await this.controller.send(
					{
						...submission,
						text: command,
						existingMedia,
					},
					{
						insightId: this.insight.insightId,
						controllerScopeId: this.controllerScopeId,
						roomId: this.snapshot.association?.roomId ?? "",
						agentId: metadata.agentId ?? "",
						engine: metadata.modelId,
						maxTurns: 40,
					},
				);
			} catch (cause) {
				this.uncertainCommand = command;
				this.update({ hasUnconfirmedSubmission: true });
				throw cause;
			}
		} finally {
			this.update({ isPreparing: false });
		}
	};

	/** Compact only a settled conversation; refresh durable history even after partial failure. */
	compact = async (
		strategy: ThreadCompactionStrategy = "AUTO",
	): Promise<void> => {
		const snapshot = this.snapshot;
		if (
			!snapshot.isReady ||
			!snapshot.association ||
			snapshot.error ||
			snapshot.isLoading ||
			snapshot.isCompacting ||
			snapshot.isPreparing ||
			snapshot.isSavingSettings ||
			snapshot.turn.isSubmitting ||
			snapshot.turn.isRunning ||
			snapshot.turn.isRestoring ||
			snapshot.turn.pendingApprovals.length ||
			snapshot.turn.transportError ||
			snapshot.hasUnconfirmedSubmission ||
			snapshot.isCreationUncertain
		)
			throw new Error(
				"Wait for the conversation to finish or reconnect before compacting.",
			);
		this.update({
			isCompacting: true,
			compactionError: null,
			compactionNotice: null,
		});
		try {
			await this.controller?.reconnect();
			const turn = this.snapshot.turn;
			if (
				turn.isRunning ||
				turn.isRestoring ||
				turn.isSubmitting ||
				turn.pendingApprovals.length ||
				turn.transportError
			)
				throw new Error(
					"Reconnect and resolve the current run before compacting.",
				);
			await this.readHistory();
			// Only persisted message IDs can identify a compaction leaf; live final output can be synthetic.
			const leaf = this.history.at(-1);
			if (
				!leaf ||
				leaf.role !== "assistant" ||
				leaf.parts.some((part) => part.type === "tool")
			)
				throw new Error(
					"Compact after Assistant has completed a response without pending tools.",
				);
			const result = await compactThreadMessages(
				this.insight.actions,
				snapshot.association.roomId,
				leaf.id,
				strategy,
			);
			this.update({
				compactionNotice:
					result === "skipped"
						? "No compaction was needed."
						: "Conversation context compacted.",
			});
		} catch (cause) {
			this.update({ compactionError: toError(cause).message });
			throw cause;
		} finally {
			try {
				await this.readHistory();
			} catch (cause) {
				this.update({
					compactionError: toError(cause).message,
					error: toError(cause),
				});
			}
			this.update({ isCompacting: false });
		}
	};

	reconnect = async (): Promise<void> => {
		this.update({ error: null, submissionNotice: null });
		try {
			if (!this.snapshot.isReady) {
				await this.initialize();
				return;
			}
			await this.controller?.reconnect();
			await this.readHistory();
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
				this.update({
					hasUnconfirmedSubmission: false,
					composerResetKey:
						this.snapshot.composerResetKey + (found ? 1 : 0),
					submissionNotice: found
						? "Your last message was received. The composer has been cleared so it is not sent twice."
						: "Your last message was not found. You can try sending it again.",
				});
				this.uncertainCommand = null;
			}
		} catch (cause) {
			this.update({ error: toError(cause) });
		}
	};

	/**
	 * Leave the current room; the next message creates a new one for this thread.
	 * The old room and its messages are kept, and the newest room opens next time.
	 */
	startNewConversation = (): void => {
		if (!canStartNewConversation(this.snapshot))
			throw new Error(
				"Wait for the current response to finish, or stop it, before starting a new conversation.",
			);
		this.unsubscribeTurn?.();
		this.unsubscribeTurn = null;
		if (this.controller) evictIdleAgentTurnControllers(this.controller);
		this.controller = null;
		this.history = [];
		this.pending = null;
		this.uncertainCommand = null;
		this.update({
			association: null,
			turn: EMPTY_TURN,
			usage: { contextTokens: null, totalTokens: null },
			compactionError: null,
			compactionNotice: null,
			hasUnconfirmedSubmission: false,
			submissionNotice: null,
			isCreationUncertain: false,
			error: null,
		});
	};

	/** Explicit recovery after a creation response was lost; may leave an empty room. */
	allowNewRoom(): void {
		this.pending = null;
		this.update({ isCreationUncertain: false, error: null });
	}
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

const sessions = new Map<string, ThreadSession>();
const MAX_IDLE_SESSIONS = 12;

/** Keep active runs alive across navigation and bound the idle insight cache. */
export function getThreadSession(
	scope: string,
	threadId: string,
	ownerActions: InsightActions,
): ThreadSession {
	const key = JSON.stringify([scope, threadId]);
	let session = sessions.get(key);
	if (!session) {
		session = new ThreadSession(threadId, scope, {
			insightId: scope,
			actions: ownerActions,
		});
		sessions.set(key, session);
	}
	const idle = [...sessions].filter(
		([, value]) => value !== session && value.canEvict(),
	);
	for (const [oldKey, oldSession] of idle.slice(
		0,
		Math.max(0, idle.length - MAX_IDLE_SESSIONS),
	)) {
		oldSession.dispose();
		sessions.delete(oldKey);
	}
	return session;
}
