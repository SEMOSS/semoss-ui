import { Insight } from "@semoss/sdk";
import { toError } from "@semoss/utility";
import { downloadMailAttachmentIsolated } from "@/features/connectors/api/mail-attachment-download";
import { stageMailAttachment } from "@/features/connectors/api/microsoft";
import type { SourceAttachment } from "@/features/connectors/types";
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
import type {
	ComposerSubmission,
	PendingToolApproval,
} from "@/features/rooms/types/room";
import type { InsightActions } from "@/lib/pixel";
import {
	bindThreadRoom,
	canContinueThreadRoom,
	findThreadRoom,
	prepareThreadRoom,
	type ThreadRoomAssociation,
	type ThreadRoomMetadata,
} from "./api/thread-room";
import { type SubmittedThreadContext, threadCommand } from "./thread-context";

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

interface ThreadSessionSnapshot {
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
		isReady: false,
		isLoading: true,
		isPreparing: false,
		error: null,
		association: null,
		modelId: "",
		modelName: "",
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

	constructor(
		readonly threadId: string,
		private readonly controllerScopeId?: string,
		private readonly downloadOwner?: {
			insightId: string;
			actions: InsightActions;
		},
	) {}

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
				});
				this.attach(association);
				await this.readHistory();
				await this.controller?.reconnect();
			}
			this.update({ isReady: true });
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
			agentId: "",
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
		this.history = threadFromMessages(messages);
		controller.reconcileHistory(messages);
		this.publishTurn(controller.getSnapshot());
	}

	selectModel(modelId: string, modelName: string): void {
		if (
			this.snapshot.isPreparing ||
			this.snapshot.turn.isRunning ||
			this.snapshot.hasUnconfirmedSubmission
		)
			return;
		this.update({ modelId, modelName });
	}

	/** Download-only files never enter a folder the assistant can read. */
	downloadAttachment = async (
		sourceUid: string,
		attachment: SourceAttachment,
	): Promise<void> => {
		await downloadMailAttachmentIsolated(
			this.downloadOwner ?? {
				insightId: this.insight.insightId,
				actions: this.insight.actions,
			},
			sourceUid,
			attachment,
		);
	};

	send = async (
		title: string,
		context: SubmittedThreadContext,
		submission: ComposerSubmission,
		sourceUid?: string,
		attachments: SourceAttachment[] = [],
	): Promise<void> => {
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
		if (attachments.length && !sourceUid)
			throw new Error("The source for this attachment is unavailable.");
		if (
			attachments.length +
				submission.files.length +
				(submission.existingMedia?.length ?? 0) >
			5
		)
			throw new Error("Attach up to 5 files per message.");
		this.update({ isPreparing: true, error: null, submissionNotice: null });
		try {
			const metadata: ThreadRoomMetadata = {
				version: 1,
				threadId: this.threadId,
				contextRevision: context.contextRevision,
				modelId: this.snapshot.modelId,
			};
			const current = this.snapshot.association;
			if (
				!current ||
				!canContinueThreadRoom(current) ||
				current.metadata.contextRevision !== metadata.contextRevision ||
				current.metadata.modelId !== metadata.modelId
			) {
				if (
					!this.pending ||
					JSON.stringify(this.pending.metadata) !==
						JSON.stringify(metadata)
				)
					this.pending = { metadata };
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
					);
				} catch (cause) {
					if (!attempt.roomId)
						this.update({ isCreationUncertain: true });
					throw cause;
				}
				this.pending = null;
				this.update({ association });
				this.attach(association);
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
			if (sourceUid) {
				for (const attachment of attachments) {
					const file = await stageMailAttachment(
						this.insight.actions,
						this.insight.insightId,
						sourceUid,
						attachment.id,
						attachment.name,
					);
					if (file.size > 10 * 1024 * 1024)
						throw new Error(
							`${file.name} exceeds the 10 MB attachment limit.`,
						);
					existingMedia.push({
						insightId: file.insightId,
						fileLocation: file.filePath,
						fileName: file.name,
					});
				}
			}
			const command = threadCommand(
				context,
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
						agentId: "",
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
