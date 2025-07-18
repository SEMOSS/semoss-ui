import { makeAutoObservable } from "mobx";

interface ChatMessageInterface {
	/**
	 * Id of the message
	 */
	messageId: string;

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
		messageId: "",
		type: "AGENT",
		content: {
			type: "TEXT",
			text: "",
		},
		sources: [],
		rating: null,
	};

	constructor() {
		// make it observable
		makeAutoObservable(this);
	}

	/**
	 * Getters
	 */
	/**
	 * Get the id of the message
	 */
	get messageId() {
		return this._store.messageId;
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
	 * Save the id of the message
	 *
	 * @param id - id to update
	 */
	saveId(id: string) {
		this._store.messageId = id;
	}

	/**
	 * Update the type of the message
	 */
	updateType(type: ChatMessageInterface["type"]) {
		this._store.type = type;
	}

	/**
	 * Save the associated rating
	 */
	updateContent(content: ChatMessageInterface["content"]) {
		this._store.content = {
			...content,
		};
	}

	/**
	 * Save the associated rating
	 */
	updateSources(sources: ChatMessageInterface["sources"]) {
		this._store.sources = sources;
	}

	/**
	 * Save the associated rating
	 */
	saveRating(rating: ChatMessageInterface["rating"]) {
		this._store.rating = rating;
	}
}
