import type { InputPixelMessage } from "@/types";
import {
	AbstractMessageStore,
	type BaseMessageState,
	createMessageStore,
	makeBaseMessageState,
} from "./abstract-message.store";

interface InputMessageState extends BaseMessageState {
	parts: InputPixelMessage["parts"];
}

/**
 * Input Message Store
 */
export class InputMessageStore extends AbstractMessageStore {
	readonly type = "INPUT" as const;

	private _zustand = createMessageStore<InputMessageState>({
		...makeBaseMessageState({
			messageId: "",
			visible: false,
			tokens: 0,
			modelId: "",
			modelType: "",
			ornaments: {},
		} as InputPixelMessage),
		parts: [],
	});

	readonly getState = (): InputMessageState => this._zustand.getState();
	readonly subscribe = (
		listener: (state: InputMessageState, prev: InputMessageState) => void,
	): (() => void) => this._zustand.subscribe(listener);
	readonly getInitialState = (): InputMessageState =>
		this._zustand.getInitialState();

	_setState = (partial: Partial<InputMessageState>) => {
		this._zustand.setState(partial as Partial<InputMessageState>);
	};

	get parts() {
		return this.getState().parts;
	}

	set parts(value: InputPixelMessage["parts"]) {
		this._zustand.setState({ parts: value });
	}

	constructor(
		room: AbstractMessageStore["room"],
		message: InputPixelMessage,
	) {
		super(room, message);

		// Initialise with real values
		this._zustand.setState({
			...makeBaseMessageState(message),
			parts: message.parts,
		});

		// sync tools etc.
		this.sync(message);
	}

	sync(message: InputPixelMessage) {
		super.sync(message);
		this._zustand.setState({
			id: message.messageId,
			parts: message.parts,
			tokens: message.tokens,
		});

		for (const part of message.parts) {
			if (part.type === "TOOL_RESULT") {
				this.room.syncTool(part.toolResult.toolCallId, this, part);
			}
		}
	}
}
