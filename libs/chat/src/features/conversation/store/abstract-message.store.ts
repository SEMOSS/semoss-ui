import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { StoreState } from "@semoss/utility/store";
import type { AbstractPixelMessage, PixelMessage } from "../../../types";
import type { RoomStore } from "../../room/store/room.store";

/**
 * What every message holds. Every field is readonly.
 *
 * The tree links (`parent`, `children`) hold the other messages' stores: each
 * is a store of its own, and a change to the tree replaces the array, so a
 * reader of `children` sees it.
 */
export interface MessageSnapshot {
	/** The message's id. */
	readonly id: string;
	/** Whether the message is shown to the user. */
	readonly visible: boolean;
	/** The message above it in the tree, or null for the root. */
	readonly parent: AbstractMessageStore | null;
	/** Its index among its parent's children; -1 while it has no parent. */
	readonly position: number;
	/** The messages that answer it: each a branch of the conversation. */
	readonly children: readonly AbstractMessageStore[];
	/** Which child continues the conversation; -1 when it has none. */
	readonly activeChildPosition: number;
	/** What the message says, in order. */
	readonly parts: readonly AbstractPixelMessage["parts"][number][];
	/** The tokens the message used, for its cost. */
	readonly tokens: number;
	/** The model that answered, or the one the message was sent to. */
	readonly modelId: string;
	/** That model's type. */
	readonly modelType: string;
	/** The agent run the message belongs to, if any. */
	readonly agentRun: AbstractPixelMessage["agentRun"] | undefined;
	/** Extra properties that are not essential. */
	readonly ornaments: AbstractPixelMessage["ornaments"];
	/** When the message was created, once the backend has said. */
	readonly dateCreated: Date | undefined;
}

/**
 * The agent run a pixel message names, in either of its two forms.
 *
 * @param message - The pixel message.
 * @returns Its run, from `agentRun` or its ornaments, or undefined.
 */
const readAgentRun = (
	message: AbstractPixelMessage,
): AbstractPixelMessage["agentRun"] | undefined =>
	message.agentRun ??
	(message.ornaments?.agentRunId
		? {
				runId: message.ornaments.agentRunId,
				role: message.ornaments.agentRunRole,
			}
		: undefined);

/**
 * The ornaments a message keeps from a pixel message.
 *
 * @param message - The pixel message.
 * @returns Its model name and routing.
 */
const readOrnaments = (
	message: AbstractPixelMessage,
): AbstractPixelMessage["ornaments"] => ({
	modelName: message.ornaments?.modelName,
	routing: message.ornaments?.routing,
});

/**
 * The fields every message starts with, from its pixel message.
 *
 * @param message - The pixel message.
 * @returns The common part of its snapshot.
 */
export const initialMessageSnapshot = (
	message: AbstractPixelMessage,
): MessageSnapshot => ({
	id: message.messageId,
	visible: message.visible,
	parent: null,
	position: -1,
	children: [],
	activeChildPosition: -1,
	parts: [],
	tokens: message.tokens,
	modelId: message.modelId,
	modelType: message.modelType,
	agentRun: readAgentRun(message),
	ornaments: readOrnaments(message),
	dateCreated: undefined,
});

/**
 * One message in a room's conversation tree: the root, a user's input, or a
 * response.
 *
 * Its state is a `StoreState`; read it in React with `useMessage`, or with
 * `useRoomSelector` for what depends on other messages or tool calls.
 */
export abstract class AbstractMessageStore<
	S extends MessageSnapshot = MessageSnapshot,
> {
	/** A unique React key for the message, only for rendering. */
	readonly key: string;

	/** The room the message is in. */
	readonly room: RoomStore;

	/** Whether it is the root, a plan, an input, or a response. */
	abstract readonly type: "ROOT" | "PLAN" | "INPUT" | "OUTPUT";

	/** The message's state; only its own actions and subclasses write it. */
	protected readonly state: StoreState<S>;

	/** Who hears about a change to this message or any message below it. */
	private readonly treeListeners = new Set<() => void>();

	/** Stops listening to each child's tree. */
	private readonly childStops = new Map<AbstractMessageStore, () => void>();

	/**
	 * @param room - The room the message is in.
	 * @param initial - Its first snapshot.
	 */
	constructor(room: RoomStore, initial: S) {
		this.room = room;
		this.key = `room-${room.roomId}-${Date.now()}-${Math.floor(Math.random() * 100000000)}`;
		this.state = new StoreState<S>(initial);
		this.state.subscribe(this.notifyTree);
	}

	/** The message's current state. */
	getSnapshot = (): S => this.state.getSnapshot();

	/**
	 * Listen for changes to this message alone.
	 *
	 * @param listener - Called after each change.
	 * @returns Stops listening.
	 */
	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	/**
	 * Hear about a change to this message or to any message below it, as the
	 * room does to follow its whole conversation.
	 *
	 * @param listener - Called after each change.
	 * @returns Stops listening.
	 */
	subscribeTree = (listener: () => void): (() => void) => {
		this.treeListeners.add(listener);
		return () => {
			this.treeListeners.delete(listener);
		};
	};

	/** The message's id. */
	get id(): string {
		return this.getSnapshot().id;
	}

	/** Whether the message is shown to the user. */
	get visible(): boolean {
		return this.getSnapshot().visible;
	}

	/** The message above it in the tree, or null for the root. */
	get parent(): AbstractMessageStore | null {
		return this.getSnapshot().parent;
	}

	/** Its index among its parent's children; -1 while it has no parent. */
	get position(): number {
		return this.getSnapshot().position;
	}

	/** The messages that answer it. */
	get children(): readonly AbstractMessageStore[] {
		return this.getSnapshot().children;
	}

	/** Which child continues the conversation; -1 when it has none. */
	get activeChildPosition(): number {
		return this.getSnapshot().activeChildPosition;
	}

	/** What the message says, in order. */
	get parts(): S["parts"] {
		return this.getSnapshot().parts;
	}

	/** The tokens the message used. */
	get tokens(): number {
		return this.getSnapshot().tokens;
	}

	/** The model that answered, or the one the message was sent to. */
	get modelId(): string {
		return this.getSnapshot().modelId;
	}

	/** That model's type. */
	get modelType(): string {
		return this.getSnapshot().modelType;
	}

	/** The agent run the message belongs to, if any. */
	get agentRun(): AbstractPixelMessage["agentRun"] | undefined {
		return this.getSnapshot().agentRun;
	}

	/** Extra properties that are not essential. */
	get ornaments(): AbstractPixelMessage["ornaments"] {
		return this.getSnapshot().ornaments;
	}

	/** When the message was created, once the backend has said. */
	get dateCreated(): Date | undefined {
		return this.getSnapshot().dateCreated;
	}

	/** Its parent's children, itself among them. */
	get siblings(): readonly AbstractMessageStore[] {
		return this.parent?.children ?? [];
	}

	/** The sibling before it, or null. */
	get previousSibling(): AbstractMessageStore | null {
		return this.siblings[this.position - 1] ?? null;
	}

	/** The sibling after it, or null. */
	get nextSibling(): AbstractMessageStore | null {
		return this.position < 0
			? null
			: (this.siblings[this.position + 1] ?? null);
	}

	/** The child that continues the conversation, or null. */
	get activeChild(): AbstractMessageStore | null {
		return this.children[this.activeChildPosition] ?? null;
	}

	/**
	 * Take the backend's copy of the message.
	 *
	 * @param message - The pixel message.
	 */
	sync(message: PixelMessage): void {
		this.updateMessage({
			dateCreated: parseTimestampWithUtcDefault(
				message.dateCreated,
			).toDate(),
			agentRun: readAgentRun(message),
			ornaments: readOrnaments(message),
		});
	}

	/**
	 * Set the id, once the backend has assigned one.
	 *
	 * @param id - The id.
	 */
	setId = (id: string): void => {
		this.updateMessage({ id });
	};

	/**
	 * Set the tokens the message used.
	 *
	 * @param tokens - The count.
	 */
	setTokens = (tokens: number): void => {
		this.updateMessage({ tokens });
	};

	/**
	 * Append a part.
	 *
	 * @param part - The part.
	 */
	addPart = (part: S["parts"][number]): void => {
		this.setParts([...this.state.getSnapshot().parts, part]);
	};

	/**
	 * Replace the parts that match with what `change` makes of them.
	 *
	 * @param matches - Which parts to change.
	 * @param change - The next value of a matching part.
	 */
	updateParts = <P extends S["parts"][number]>(
		matches: (part: S["parts"][number]) => part is P,
		change: (part: P) => S["parts"][number],
	): void => {
		const current = this.state.getSnapshot().parts;
		let isChanged = false;
		const parts = current.map((part) => {
			if (!matches(part)) {
				return part;
			}
			const next = change(part);
			isChanged ||= next !== part;
			return next;
		});
		if (isChanged) {
			this.setParts(parts);
		}
	};

	/**
	 * Attach the message under a parent.
	 *
	 * @param parent - The parent, or null to detach it.
	 * @param position - Its index among the parent's children.
	 */
	connectParent = (
		parent: AbstractMessageStore | null,
		position: number,
	): void => {
		this.updateMessage({ parent, position });
	};

	/**
	 * Add a child, and make it the active one.
	 *
	 * @param message - The child.
	 */
	addChild = (message: AbstractMessageStore): void => {
		const children = [...this.state.getSnapshot().children, message];
		this.childStops.get(message)?.();
		this.childStops.set(message, message.subscribeTree(this.notifyTree));
		this.updateMessage({ children });
		message.connectParent(this, children.length - 1);
		message.activateMessage();
	};

	/**
	 * Remove a child, keeping the active child where it was.
	 *
	 * @param message - The child; nothing happens when it is not one.
	 */
	removeChild = (message: AbstractMessageStore | null): void => {
		if (!message) {
			return;
		}
		const { children, activeChildPosition } = this.state.getSnapshot();
		const index = children.findIndex((child) => child.id === message.id);
		if (index === -1) {
			return;
		}

		const remaining = children.filter((_, position) => position !== index);
		const removed = children[index];
		this.childStops.get(removed)?.();
		this.childStops.delete(removed);
		removed.connectParent(null, -1);
		remaining.forEach((child, position) => {
			child.connectParent(this, position);
		});
		this.updateMessage({
			children: remaining,
			activeChildPosition:
				activeChildPosition === index
					? remaining.length
						? Math.min(index, remaining.length - 1)
						: -1
					: activeChildPosition > index
						? activeChildPosition - 1
						: activeChildPosition,
		});
	};

	/** Make this message its parent's active child. */
	activateMessage = (): void => {
		this.parent?.setActiveChildPosition(this.position);
	};

	/**
	 * Choose which child continues the conversation.
	 *
	 * @param activeChildPosition - The child's index.
	 */
	setActiveChildPosition = (activeChildPosition: number): void => {
		this.updateMessage({ activeChildPosition });
	};

	/** Tell the tree's listeners about a change here or below. */
	private notifyTree = (): void => {
		for (const listener of [...this.treeListeners]) {
			listener();
		}
	};

	/**
	 * Change some of the common fields.
	 *
	 * @param changes - The fields to change.
	 */
	protected updateMessage = (changes: Partial<MessageSnapshot>): void => {
		this.merge(changes as Partial<S>);
	};

	/**
	 * Replace the parts.
	 *
	 * @param parts - The parts.
	 */
	private setParts = (parts: S["parts"][number][]): void => {
		// each subclass narrows the part type, which a generic Partial<S>
		// cannot see from here
		this.merge({ parts } as unknown as Partial<S>);
	};

	/**
	 * Change some fields, keeping the snapshot when none would change, as
	 * `StoreState.update` does (which the generic snapshot cannot type).
	 *
	 * @param changes - The fields to change.
	 */
	protected merge = (changes: Partial<S>): void => {
		const current = this.state.getSnapshot();
		const isChanged = (Object.keys(changes) as (keyof S)[]).some(
			(key) => !Object.is(current[key], changes[key]),
		);
		if (isChanged) {
			this.state.set({ ...current, ...changes });
		}
	};
}
