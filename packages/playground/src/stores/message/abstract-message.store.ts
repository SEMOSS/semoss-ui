import { action, computed, makeObservable, observable } from "mobx";
import type { ResponseMessageStore, RoomStore } from "@/stores";
import type { AbstractPixelMessage, PixelMessage } from "@/types";

/**
 * Abstract Message Store
 */
export abstract class AbstractMessageStore {
	/**
	 * Id of the message
	 */
	id: string = "";

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
	abstract type: "ROOT" | "PLAN" | "INPUT" | "RESPONSE";

	/**
	 * Track its pixelMessageType
	 */
	abstract pixelMessageType: PixelMessage["type"];

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
	 * Active Child Position
	 */
	tokens: number = 0;

	/**
	 * Set the message
	 * @param id
	 */
	constructor(room: RoomStore, message: AbstractPixelMessage) {
		this.room = room;

		this.id = message.messageId;
		this.visible = message.visible;
		this.tokens = message.tokens;

		makeObservable(this, {
			room: observable,
			id: observable,
			parent: observable,
			position: observable,
			children: observable,
			activeChildPosition: observable,
			siblings: computed,
			previousSibling: computed,
			nextSibling: computed,
			activeChild: computed,
			connectParent: action,
			addChild: action,
			activateMessage: action,
			tokens: observable,
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

	/** Actions */
	/**
	 * Sync store properties from the pixel message
	 */
	abstract sync: (message: PixelMessage) => void;

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

		// if the child is an INPUT_TOOL_EXEC, find the related tool message and mark its response
		if (message.pixelMessageType === "INPUT_TOOL_EXEC") {
			let currentMessage: AbstractMessageStore | null = this;
			while (currentMessage !== null) {
				if (currentMessage.pixelMessageType === "RESPONSE_TOOL") break;
				currentMessage = currentMessage.parent;
			}
			if (currentMessage !== null) {
				(currentMessage as ResponseMessageStore).markToolAsUsed(
					(message as ResponseMessageStore).inputToolExecData,
				);
			}
		}

		// last idx is the position
		const position = this.children.length - 1;

		// connect the child to the parent
		message.connectParent(this, position);

		// set as the active message
		message.activateMessage();
	};

	/**
	 * Set the current message as active
	 */
	activateMessage = () => {
		this.parent.activeChildPosition = this.position;
		if (this.room.tail) {
			this.room.setHasUnfinishedTools(
				(
					this.room.tail as ResponseMessageStore
				).hasUnfinishedTools?.() ?? false,
			);
		}
	};
}
