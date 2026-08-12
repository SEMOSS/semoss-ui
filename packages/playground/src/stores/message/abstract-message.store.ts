import { action, computed, makeObservable, observable } from "mobx";
import type { RoomStore } from "@/stores";
import type { AbstractPixelMessage, PixelMessage } from "@/types";
import { normalizeTimestamp } from "@/utility";

/**
 * Abstract Message Store
 */
export abstract class AbstractMessageStore {
	/**
	 * Id of the message
	 */
	id: string = "";

	/**
	 * Unique react key for the message. Only should be used to render.
	 */
	readonly key: string;

	/**
	 * Is the message visible to the user
	 */
	visible: boolean = false;

	/**
	 * Store the room
	 */
	room: RoomStore = null;

	/**
	 * Track if it is an root, input, or response message
	 */
	abstract type: "ROOT" | "PLAN" | "INPUT" | "OUTPUT";

	/**
	 * Parent of the message
	 */
	parent: AbstractMessageStore = null;

	/**
	 * Current position of message
	 */
	position: number = -1;

	/**
	 * Children messages
	 */
	children: AbstractMessageStore[] = [];

	/**
	 * Active Child Position
	 */
	activeChildPosition: number = -1;

	/**
	 * Track if it is an root, input, or response message
	 */
	abstract parts: AbstractPixelMessage["parts"];

	/**
	 * Tokens used in the message, used for cost calculation
	 */
	tokens: number = 0;

	/**
	 * Model Id used for the message
	 */
	modelId: string;

	/**
	 * Model Type used for the message
	 */
	modelType: string;

	/**
	 * Ornaments for the message, used for extra properties that are not essential
	 */
	ornaments: {
		modelName?: string;
	};

	/**
	 * Date the message was created
	 */
	dateCreated: Date;

	/**
	 *
	 * @param room
	 * @param message
	 */
	constructor(room: RoomStore, message: AbstractPixelMessage) {
		this.room = room;

		// set the key
		this.key = `room-${room.roomId}-${Date.now()}-${Math.floor(Math.random() * 100000000)}`;

		this.id = message.messageId;
		this.visible = message.visible;
		this.tokens = message.tokens;
		this.modelId = message.modelId;
		this.modelType = message.modelType;
		this.ornaments = {
			modelName: message.ornaments?.modelName,
		};

		makeObservable(this, {
			room: observable,
			id: observable,
			parent: observable,
			position: observable,
			children: observable,
			activeChildPosition: observable,
			tokens: observable,
			modelId: observable,
			modelType: observable,
			ornaments: observable,
			siblings: computed,
			previousSibling: computed,
			nextSibling: computed,
			activeChild: computed,
			connectParent: action,
			addChild: action,
			removeChild: action,
			activateMessage: action,
			sync: action,
		});
	}

	/**
	 * Getters
	 */

	/**
	 * Check if there are siblings
	 */
	get siblings() {
		return this.parent.children;
	}

	/**
	 * Get the previous sibling
	 */
	get previousSibling() {
		const next = this.position - 1;
		if (next < 0 || this.parent.children.length <= next) {
			return null;
		}

		return this.parent.children[next];
	}

	/**
	 * Get the next sibling
	 */
	get nextSibling() {
		const next = this.position + 1;
		if (next < 0 || this.parent.children.length <= next) {
			return null;
		}

		return this.parent.children[next];
	}

	/**
	 * Get the active child
	 */
	get activeChild() {
		return this.children[this.activeChildPosition] || null;
	}

	/**
	 * Walk up the parent chain and return the nearest ancestor matching
	 * `predicate`, or null if none does.
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

	/** Actions */
	/**
	 * Sync store properties from the pixel message
	 */
	sync(message: PixelMessage) {
		this.dateCreated = normalizeTimestamp(message.dateCreated).toDate();
	}

	/**
	 * Connect the parent and store the position
	 */
	connectParent = (parentMessage: AbstractMessageStore, position: number) => {
		// store the parent and position
		this.parent = parentMessage;
		this.position = position;
	};

	/**
	 * Add a child message
	 */
	addChild = (message: AbstractMessageStore) => {
		// store it
		this.children.push(message);

		// last idx is the position
		const position = this.children.length - 1;

		// connect the child to the parent
		message.connectParent(this, position);

		// set as the active message
		message.activateMessage();
	};

	/**
	 * Remove a child message
	 */
	removeChild = (message: AbstractMessageStore) => {
		if (!message) {
			return;
		}

		const index = this.children.findIndex(
			(child) => child.id === message.id,
		);
		if (index === -1) {
			return;
		}

		// remove the child
		const [removed] = this.children.splice(index, 1);

		// reset parent linkage on removed child
		if (removed) {
			removed.connectParent(null, -1);
		}

		// reindex remaining children
		this.children.forEach((child, position) => {
			child.position = position;
		});

		// update active child position
		if (this.activeChildPosition === index) {
			this.activeChildPosition = this.children.length
				? Math.min(index, this.children.length - 1)
				: -1;
		} else if (this.activeChildPosition > index) {
			this.activeChildPosition -= 1;
		}
	};

	/**
	 * Set the current message as active
	 */
	activateMessage = () => {
		this.parent.activeChildPosition = this.position;
	};
}
