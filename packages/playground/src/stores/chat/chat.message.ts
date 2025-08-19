import { makeAutoObservable } from "mobx";

interface ChatMessageInterface {
	/**
	 * Id of the message
	 */
	id: string;

	/**
	 * Parent of the message
	 */
	parent: ChatMessage;

	/**
	 * Current position of message
	 */
	position: number;

	/**
	 * Children messages
	 */
	children: ChatMessage[];

	/**
	 * Active Child Position
	 *
	 * o
	 */
	activeChildPosition: number;

	/**
	 * Track if it is an input or an output
	 */
	type: "AGENT" | "USER";

	/**
	 * Content that was shown
	 */
	content:
		| {
				type: "TEXT";

				/** Text associated with the message */
				text: string;
		  }
		| {
				type: "APP";

				/** Name of the tool */
				name: string;

				/** App ID */
				id: string;

				/** Parameters for app */
				map: Record<string, unknown>;
		  };

	/**
	 * Sources in the response
	 */
	sources: string[];

	/**
	 * Feedback provided by the user; only applicable to messages provided via the LLM
	 */
	rating: {
		/** Sentiment */
		positive: boolean;

		/** Associated comment */
		comment: string;
	} | null;
}

/**
 * Internal state management of the builder object
 */
export class ChatMessage {
	private _store: ChatMessageInterface = {
		id: "",
		parent: null,
		position: -1,
		children: [],
		activeChildPosition: -1,
		type: "AGENT",
		content: {
			type: "TEXT",
			text: "",
		},
		sources: [],
		rating: null,
	};

	constructor(id: string) {
		// set the id
		this._store.id = id;

		// make it observable
		makeAutoObservable(this);
	}

	/**
	 * Getters
	 */
	/**
	 * Get the id of the message
	 */
	get id() {
		return this._store.id;
	}

	/**
	 * Get the position
	 */
	get position() {
		return this._store.position;
	}

	/**
	 * Check if there are siblings
	 */
	get siblings() {
		return this._store.parent.children;
	}

	/**
	 * Get the previous sibling
	 */
	get previousSibling() {
		return this._store.parent.children[this._store.position - 1];
	}

	/**
	 * Get the next sibling
	 */
	get nextSibling() {
		return this._store.parent.children[this._store.position + 1];
	}

	/**
	 * Get the children
	 */
	get children() {
		return this._store.children;
	}

	/**
	 * Get the active child
	 */
	get activeChild() {
		return this._store.children[this._store.activeChildPosition];
	}

	/**
	 * Get the type
	 */
	get type() {
		return this._store.type;
	}

	/**
	 * Get the content of the message
	 */
	get content() {
		return this._store.content;
	}

	/**
	 * Get the sources for the message
	 */
	get sources() {
		return this._store.sources;
	}

	/**
	 * Get the rating/user feedback of the message
	 */
	get rating() {
		return this._store.rating;
	}

	/** Actions */
	/**
	 * Upadate the id of the message
	 *
	 * @param id - id to update
	 */
	updateId = (id: string) => {
		this._store.id = id;
	};

	/**
	 * Update the type of the message
	 */
	updateType = (type: ChatMessageInterface["type"]) => {
		this._store.type = type;
	};

	/**
	 * Save the associated rating
	 */
	updateContent = (content: ChatMessageInterface["content"]) => {
		this._store.content = {
			...content,
		};
	};

	/**
	 * Save the associated rating
	 */
	updateSources = (sources: ChatMessageInterface["sources"]) => {
		this._store.sources = sources;
	};

	/**
	 * Save the associated rating
	 */
	saveRating(rating: ChatMessageInterface["rating"]) {
		this._store.rating = rating;
	}

	/**
	 * Connect the parent and store the position
	 */
	connectParent = (parentMessage: ChatMessage, position: number) => {
		// store the parent and position
		this._store.parent = parentMessage;
		this._store.position = position;
	};

	/**
	 * Add a child message
	 */
	addChild = (message: ChatMessage) => {
		// store it
		this._store.children.push(message);

		// last idx is the position
		const position = this._store.children.length - 1;

		// connect the child to the parent
		message.connectParent(this, position);

		// set as the active message
		message.activateMessage();
	};

	/**
	 * Add a child message
	 */
	setActiveChild = (position: number) => {
		this._store.activeChildPosition = position;
	};

	/**
	 * Set the current message as active
	 */
	activateMessage = () => {
		this._store.parent.setActiveChild(this._store.position);
	};
}
