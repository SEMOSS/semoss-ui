import type { AbstractPixelMessage, PixelMessage } from "../../../types";
import type { RoomStore } from "../../room/store/room.store";
import {
	emptyMessageData,
	type MessageData,
	type MessageKey,
	mergeMessage,
	syncMessageData,
} from "./message-map";

/**
 * One message in a room's conversation tree: the root, a user's input, or a
 * response.
 *
 * A view over the room: its state is the entry under its key in the room's
 * `messages`, and its actions write there through the room. The room keeps
 * one view per key (`room.getMessageByKey`), so a view is the same object for
 * the message's whole life. Read it in React with `useMessage`, or with
 * `useRoomSelector` for what depends on other messages or tool calls.
 */
export abstract class AbstractMessageStore<
	D extends MessageData = MessageData,
> {
	/** The message's client key: its React key, and its entry in the room. */
	readonly key: MessageKey;

	/** The room the message is in. */
	readonly room: RoomStore;

	/** Whether it is the root, a plan, an input, or a response. */
	abstract readonly type: "ROOT" | "PLAN" | "INPUT" | "OUTPUT";

	/**
	 * @param room - The room the message is in, which already holds its data.
	 * @param key - The message's key.
	 */
	constructor(room: RoomStore, key: MessageKey) {
		this.room = room;
		this.key = key;
	}

	/** What the view reads once the room has deleted its entry; made on first need. */
	private _empty: D | undefined;

	/**
	 * The message's current data, from the room, or an empty, detached
	 * message once the room has deleted it, so a view held elsewhere never
	 * throws.
	 *
	 * @returns The data.
	 */
	getSnapshot = (): D => {
		const data = this.room.getSnapshot().messages[this.key] as
			| D
			| undefined;
		if (data) {
			return data;
		}
		this._empty ??= emptyMessageData(
			this.key,
			this.type === "INPUT" ? "INPUT" : "OUTPUT",
		) as D;
		return this._empty;
	};

	/**
	 * Listen for changes to the room, which holds the message.
	 *
	 * @param listener - Called after each change.
	 * @returns Stops listening.
	 */
	subscribe = (listener: () => void): (() => void) =>
		this.room.subscribe(listener);

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
		const { parentKey } = this.getSnapshot();
		return parentKey === null ? null : this.room.getMessageByKey(parentKey);
	}

	/** Its index among its parent's children; -1 while it has no parent. */
	get position(): number {
		const { parentKey } = this.getSnapshot();
		if (parentKey === null) {
			return -1;
		}
		return (
			this.room
				.getSnapshot()
				.messages[parentKey]?.childKeys.indexOf(this.key) ?? -1
		);
	}

	/** The messages that answer it. */
	get children(): readonly AbstractMessageStore[] {
		return this.room.getMessagesByKey(this.getSnapshot().childKeys);
	}

	/** Which child continues the conversation; -1 when it has none. */
	get activeChildPosition(): number {
		return this.getSnapshot().activeChildIndex;
	}

	/** What the message says, in order. */
	get parts(): D["parts"] {
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
		const position = this.position;
		return position < 0 ? null : (this.siblings[position + 1] ?? null);
	}

	/** The child that continues the conversation, or null. */
	get activeChild(): AbstractMessageStore | null {
		const { childKeys, activeChildIndex } = this.getSnapshot();
		const key = childKeys[activeChildIndex];
		return key === undefined ? null : this.room.getMessageByKey(key);
	}

	/**
	 * Take the backend's copy of the message, and the tool calls and results
	 * it holds.
	 *
	 * @param message - The pixel message.
	 */
	sync(message: PixelMessage): void {
		this.change((data) => syncMessageData(data, message));
		this.room.syncMessageTools(this);
	}

	/**
	 * Set the id, once the backend has assigned one.
	 *
	 * @param id - The id.
	 */
	setId = (id: string): void => {
		this.merge({ id } as Partial<D>);
	};

	/**
	 * Set the tokens the message used.
	 *
	 * @param tokens - The count.
	 */
	setTokens = (tokens: number): void => {
		this.merge({ tokens } as Partial<D>);
	};

	/**
	 * Append a part.
	 *
	 * @param part - The part.
	 */
	addPart = (part: D["parts"][number]): void => {
		this.room.updateMessageParts<D["parts"]>(
			this.key,
			(parts) => [...parts, part] as D["parts"],
		);
	};

	/**
	 * Replace the parts that match with what `change` makes of them.
	 *
	 * @param matches - Which parts to change.
	 * @param change - The next value of a matching part.
	 */
	updateParts = <P extends D["parts"][number]>(
		matches: (part: D["parts"][number]) => part is P,
		change: (part: P) => D["parts"][number],
	): void => {
		this.room.updateMessageParts<D["parts"]>(this.key, (current) => {
			let isChanged = false;
			const parts = current.map((part) => {
				if (!matches(part)) {
					return part;
				}
				const next = change(part);
				isChanged ||= next !== part;
				return next;
			});
			return (isChanged ? parts : current) as D["parts"];
		});
	};

	/**
	 * Add a child, and make it the active one.
	 *
	 * @param message - The child.
	 */
	addChild = (message: AbstractMessageStore): void => {
		this.room.insertChildMessage(this.key, message.key);
	};

	/**
	 * Remove a child, keeping the active child where it was.
	 *
	 * @param message - The child; nothing happens when it is not one.
	 */
	removeChild = (message: AbstractMessageStore | null): void => {
		if (message) {
			this.room.removeChildMessage(this.key, message.key);
		}
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
		this.room.setActiveChildMessage(this.key, activeChildPosition);
	};

	/**
	 * Replace the message's data with what `change` makes of it.
	 *
	 * @param change - The next data; the same object changes nothing.
	 */
	protected change = (change: (data: D) => D): void => {
		this.room.updateMessageData(this.key, (data) => change(data as D));
	};

	/**
	 * Change some fields, keeping the message when none would change.
	 *
	 * @param changes - The fields to change.
	 */
	protected merge = (changes: Partial<D>): void => {
		this.change((data) => mergeMessage(data, changes));
	};
}
