import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { ObservableStore } from "../observable-store";
import type { AbstractPixelMessage, PixelMessage } from "../room.types";
import type { RoomEngine } from "../room-engine.store";

/**
 * A message in a room's conversation tree. Every message knows its parent,
 * its children (the turns that followed it, one per rewrite) and which child
 * is active; the room's history is the chain of active children from its
 * root.
 *
 * Each message is its own observable store — a streamed chunk tells only that
 * message's readers — and also tells its room, so a reader of the room sees
 * the tree change.
 */
export abstract class AbstractMessageStore extends ObservableStore {
	/** The message's id; a placeholder until the backend names it. */
	id = "";

	/** A key for rendering only; unique for this instance. */
	readonly key: string;

	/** Whether the user sees the message. */
	visible = false;

	/** The room the message belongs to. */
	room: RoomEngine;

	/** Whether it is the root, a user turn or a response. */
	abstract readonly type: "ROOT" | "PLAN" | "INPUT" | "OUTPUT";

	/** The message this one follows. */
	parent: AbstractMessageStore | null = null;

	/** Its place among its parent's children. */
	position = -1;

	/** The turns that followed it, one per rewrite. */
	children: AbstractMessageStore[] = [];

	/** Which child is the active one. */
	activeChildPosition = -1;

	/** The message's parts, replaced on every change. */
	abstract parts: AbstractPixelMessage["parts"];

	/** Tokens the message used. */
	tokens = 0;

	/** The model the message ran on. */
	modelId: string;

	/** The model's type. */
	modelType: string;

	/** The agent run the message belongs to. */
	agentRun?: AbstractPixelMessage["agentRun"];

	/** Extra properties, such as the model's name and routing. */
	ornaments: AbstractPixelMessage["ornaments"];

	/** When the message was created. */
	dateCreated = new Date();

	/**
	 * @param room - The room it belongs to.
	 * @param message - The message as the backend stores it.
	 */
	constructor(room: RoomEngine, message: AbstractPixelMessage) {
		super();
		this.room = room;

		this.key = `room-${room.roomId}-${Date.now()}-${Math.floor(Math.random() * 100000000)}`;

		this.id = message.messageId;
		this.visible = message.visible;
		this.tokens = message.tokens;
		this.modelId = message.modelId;
		this.modelType = message.modelType;
		this.agentRun = readAgentRun(message);
		this.ornaments = {
			modelName: message.ornaments?.modelName,
			routing: message.ornaments?.routing,
		};

		// a change to the message is a change to its room
		this.propagateTo(() => this.room);
	}

	/**
	 * Watch the fields every message shares. Subclasses call it at the end of
	 * their constructor with their own fields.
	 *
	 * @param extra - The subclass's own data fields.
	 */
	protected observeMessageFields<T extends AbstractMessageStore>(
		this: T,
		extra: readonly (keyof T & string)[],
	): void {
		ObservableStore.observeFields<T>(this, [
			"id",
			"visible",
			"parent",
			"position",
			"children",
			"activeChildPosition",
			"tokens",
			"modelId",
			"modelType",
			"agentRun",
			"ornaments",
			"dateCreated",
			...extra,
		] as (keyof T & string)[]);
	}

	/** The messages beside this one, its parent's children. */
	get siblings(): AbstractMessageStore[] {
		return this.parent?.children ?? [];
	}

	/** The sibling before this one. */
	get previousSibling(): AbstractMessageStore | null {
		const previous = this.position - 1;
		if (!this.parent || previous < 0) {
			return null;
		}
		return this.parent.children[previous] ?? null;
	}

	/** The sibling after this one. */
	get nextSibling(): AbstractMessageStore | null {
		const next = this.position + 1;
		if (!this.parent || next < 0) {
			return null;
		}
		return this.parent.children[next] ?? null;
	}

	/** The active child. */
	get activeChild(): AbstractMessageStore | null {
		return this.children[this.activeChildPosition] ?? null;
	}

	/**
	 * Walk up the parent chain and return the nearest ancestor matching
	 * `predicate`, or null if none does.
	 *
	 * @param predicate - Picks the ancestor.
	 * @returns The ancestor, or null.
	 */
	findAncestor(
		predicate: (message: AbstractMessageStore) => boolean,
	): AbstractMessageStore | null {
		let ancestor = this.parent;
		while (ancestor) {
			if (predicate(ancestor)) {
				return ancestor;
			}
			ancestor = ancestor.parent;
		}
		return null;
	}

	/**
	 * Take the properties every message shares from the stored message.
	 *
	 * @param message - The message as the backend stores it.
	 */
	sync(message: PixelMessage): void {
		this.dateCreated = parseTimestampWithUtcDefault(
			message.dateCreated,
		).toDate();
		this.agentRun = readAgentRun(message);
		this.ornaments = {
			modelName: message.ornaments?.modelName,
			routing: message.ornaments?.routing,
		};
	}

	/**
	 * Record the parent and the place among its children.
	 *
	 * @param parentMessage - The parent, or null when detached.
	 * @param position - The place, or -1 when detached.
	 */
	connectParent = (
		parentMessage: AbstractMessageStore | null,
		position: number,
	): void => {
		this.parent = parentMessage;
		this.position = position;
	};

	/**
	 * Add a turn after this message and make it the active one.
	 *
	 * @param message - The new child.
	 */
	addChild = (message: AbstractMessageStore): void => {
		this.children = [...this.children, message];
		message.connectParent(this, this.children.length - 1);
		message.activateMessage();
	};

	/**
	 * Remove a child, keeping the active child where it was when possible.
	 *
	 * @param message - The child to remove.
	 */
	removeChild = (message: AbstractMessageStore | null | undefined): void => {
		if (!message) {
			return;
		}

		const index = this.children.findIndex(
			(child) => child.id === message.id,
		);
		if (index === -1) {
			return;
		}

		const removed = this.children[index];
		this.children = this.children.filter(
			(_, position) => position !== index,
		);
		removed?.connectParent(null, -1);

		this.children.forEach((child, position) => {
			child.position = position;
		});

		if (this.activeChildPosition === index) {
			this.activeChildPosition = this.children.length
				? Math.min(index, this.children.length - 1)
				: -1;
		} else if (this.activeChildPosition > index) {
			this.activeChildPosition -= 1;
		}
	};

	/** Make this message its parent's active child. */
	activateMessage = (): void => {
		if (this.parent) {
			this.parent.activeChildPosition = this.position;
		}
	};
}

/**
 * The agent run a message belongs to, from its own field or, for rooms saved
 * before it existed, its ornaments.
 *
 * @param message - The message as the backend stores it.
 * @returns The run, or undefined outside a run.
 */
const readAgentRun = (
	message: AbstractPixelMessage,
): AbstractPixelMessage["agentRun"] =>
	message.agentRun ??
	(message.ornaments?.agentRunId
		? {
				runId: message.ornaments.agentRunId,
				role: message.ornaments.agentRunRole,
			}
		: undefined);
