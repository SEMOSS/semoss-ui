import { createStore } from "zustand/vanilla";
import type { RoomStore } from "@/stores";
import type { AbstractPixelMessage, PixelMessage } from "@/types";
import { normalizeTimestamp } from "@/utility";

export interface BaseMessageState {
	id: string;
	position: number;
	parent: AbstractMessageStore | null;
	children: AbstractMessageStore[];
	activeChildPosition: number;
	tokens: number;
	modelId: string;
	modelType: string;
	ornaments: { modelName?: string };
}

/**
 * Abstract Message Store
 */
export abstract class AbstractMessageStore {
	/** Non-reactive properties */
	readonly key: string;
	readonly room: RoomStore;
	visible: boolean;
	dateCreated: Date = new Date();

	abstract readonly type: "ROOT" | "PLAN" | "INPUT" | "OUTPUT";
	abstract parts: AbstractPixelMessage["parts"];

	/** Subclasses create the full Zustand store (includes BaseMessageState) */
	abstract getState(): BaseMessageState;
	abstract subscribe(
		listener: (state: BaseMessageState, prev: BaseMessageState) => void,
	): () => void;
	abstract getInitialState(): BaseMessageState;
	abstract _setState(partial: Partial<BaseMessageState>): void;

	constructor(room: RoomStore, message: AbstractPixelMessage) {
		this.room = room;
		this.key = `room-${room.roomId}-${Date.now()}-${Math.floor(Math.random() * 100000000)}`;
		this.visible = message.visible;
	}

	/** Getters that read from Zustand state */
	get id() {
		return this.getState().id;
	}

	set id(value: string) {
		const oldId = this.getState().id;
		this._setState({ id: value });
		this.room.updateMessageId(oldId, value, this);
	}

	get parent() {
		return this.getState().parent;
	}

	get position() {
		return this.getState().position;
	}

	set position(value: number) {
		this._setState({ position: value });
	}

	get children() {
		return this.getState().children;
	}

	get activeChildPosition() {
		return this.getState().activeChildPosition;
	}

	get tokens() {
		return this.getState().tokens;
	}

	get modelId() {
		return this.getState().modelId;
	}

	get modelType() {
		return this.getState().modelType;
	}

	get ornaments() {
		return this.getState().ornaments;
	}

	/** Computed getters */
	get siblings() {
		return this.getState().parent?.children ?? [];
	}

	get previousSibling() {
		const idx = this.getState().position - 1;
		const siblings = this.siblings;
		if (idx < 0 || idx >= siblings.length) return null;
		return siblings[idx];
	}

	get nextSibling() {
		const idx = this.getState().position + 1;
		const siblings = this.siblings;
		if (idx < 0 || idx >= siblings.length) return null;
		return siblings[idx];
	}

	get activeChild() {
		const { children, activeChildPosition } = this.getState();
		return children[activeChildPosition] || null;
	}

	/** Actions */
	sync(message: PixelMessage) {
		this.dateCreated = normalizeTimestamp(message.dateCreated).toDate();
	}

	connectParent = (
		parentMessage: AbstractMessageStore | null,
		position: number,
	) => {
		this._setState({ parent: parentMessage, position });
	};

	addChild = (message: AbstractMessageStore) => {
		const currentChildren = this.getState().children;
		const newChildren = [...currentChildren, message];
		this._setState({ children: newChildren });
		const position = newChildren.length - 1;
		message.connectParent(this, position);
		message.activateMessage();
		this.room.notifyHistoryChange();
		this.room.registerMessage(message);
	};

	removeChild = (message: AbstractMessageStore) => {
		if (!message) return;
		const children = this.getState().children;
		const index = children.findIndex((child) => child.id === message.id);
		if (index === -1) return;

		const newChildren = children.filter((_, i) => i !== index);
		const removed = children[index];
		if (removed) {
			removed.connectParent(null, -1);
		}

		// reindex remaining
		newChildren.forEach((child, pos) => {
			child.position = pos;
		});

		const activePos = this.getState().activeChildPosition;
		let newActivePos: number;
		if (activePos === index) {
			newActivePos = newChildren.length
				? Math.min(index, newChildren.length - 1)
				: -1;
		} else if (activePos > index) {
			newActivePos = activePos - 1;
		} else {
			newActivePos = activePos;
		}

		this._setState({
			children: newChildren,
			activeChildPosition: newActivePos,
		});
		this.room.notifyHistoryChange();
	};

	activateMessage = () => {
		const { parent, position } = this.getState();
		if (parent) {
			parent._setState({ activeChildPosition: position });
		}
		this.room.notifyHistoryChange();
	};
}

/**
 * Helper to create the initial BaseMessageState from a pixel message
 */
export function makeBaseMessageState(
	message: AbstractPixelMessage,
): BaseMessageState {
	return {
		id: message.messageId,
		position: -1,
		parent: null,
		children: [],
		activeChildPosition: -1,
		tokens: message.tokens,
		modelId: message.modelId,
		modelType: message.modelType,
		ornaments: { modelName: message.ornaments?.modelName },
	};
}

/**
 * Convenience helper for creating a Zustand vanilla store with base state + extra state
 */
export function createMessageStore<T extends BaseMessageState>(initial: T) {
	return createStore<T>()(() => initial);
}
