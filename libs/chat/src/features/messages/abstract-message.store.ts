import { createAtom } from "mobx";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { StoreState } from "@semoss/utility/store";
import type { AbstractPixelMessage, PixelMessage } from "../../types";
import type { RoomStore } from "../room/room.store";

/**
 * What every message holds. Every field is readonly.
 *
 * The tree links (`parent`, `children`) hold the other messages' stores: each
 * is a store of its own, and a change to the tree replaces the array, so a
 * reader of `children` sees it.
 */
export interface MessageSnapshot {
	readonly id: string;
	/** Whether the message is shown to the user. */
	readonly visible: boolean;
	readonly parent: AbstractMessageStore | null;
	/** Its index among its parent's children; -1 while it has no parent. */
	readonly position: number;
	readonly children: readonly AbstractMessageStore[];
	/** Which child continues the conversation; -1 when it has none. */
	readonly activeChildPosition: number;
	readonly parts: readonly AbstractPixelMessage["parts"][number][];
	/** The tokens the message used, for its cost. */
	readonly tokens: number;
	readonly modelId: string;
	readonly modelType: string;
	/** The agent run the message belongs to, if any. */
	readonly agentRun: AbstractPixelMessage["agentRun"] | undefined;
	/** Extra properties that are not essential. */
	readonly ornaments: AbstractPixelMessage["ornaments"];
	readonly dateCreated: Date | undefined;
}

/** The agent run a pixel message names, in either of its two forms. */
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

/** The ornaments a message keeps from a pixel message. */
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
 * Its state is a `StoreState`; read it in React with `useMessage`. Until the
 * room store leaves MobX, every read also reports to a MobX atom and every
 * change tells it, so its getters and `observer` components keep tracking
 * the message.
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

	protected readonly state: StoreState<S>;

	/** The MobX adapter; goes with the last MobX reader. */
	private readonly atom = createAtom("MessageStore");

	/**
	 * @param room - The room the message is in.
	 * @param initial - Its first snapshot.
	 */
	constructor(room: RoomStore, initial: S) {
		this.room = room;
		this.key = `room-${room.roomId}-${Date.now()}-${Math.floor(Math.random() * 100000000)}`;
		this.state = new StoreState<S>(initial);
		this.state.subscribe(() => this.atom.reportChanged());
	}

	getSnapshot = (): S => {
		this.atom.reportObserved();
		return this.state.getSnapshot();
	};

	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	get id(): string {
		return this.getSnapshot().id;
	}

	get visible(): boolean {
		return this.getSnapshot().visible;
	}

	get parent(): AbstractMessageStore | null {
		return this.getSnapshot().parent;
	}

	get position(): number {
		return this.getSnapshot().position;
	}

	get children(): readonly AbstractMessageStore[] {
		return this.getSnapshot().children;
	}

	get activeChildPosition(): number {
		return this.getSnapshot().activeChildPosition;
	}

	get parts(): S["parts"] {
		return this.getSnapshot().parts;
	}

	get tokens(): number {
		return this.getSnapshot().tokens;
	}

	get modelId(): string {
		return this.getSnapshot().modelId;
	}

	get modelType(): string {
		return this.getSnapshot().modelType;
	}

	get agentRun(): AbstractPixelMessage["agentRun"] | undefined {
		return this.getSnapshot().agentRun;
	}

	get ornaments(): AbstractPixelMessage["ornaments"] {
		return this.getSnapshot().ornaments;
	}

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
	 * The nearest ancestor that matches.
	 *
	 * @param predicate - What to look for.
	 * @returns The ancestor, or null when none matches.
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
		children[index].connectParent(null, -1);
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
