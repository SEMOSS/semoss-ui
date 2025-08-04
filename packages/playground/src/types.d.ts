export interface Engine {
	app_id: string;
	app_name: string;
	app_type: "FUNCTION" | "DATABASE" | "KNOWLEDGE";
	description?: string;
}

export interface App {
	project_id: string;
	project_name: string;
	description?: string;
}

/**
 * Instructions from the backend
 */
export interface Instructions {
	/** ID of the instructions */
	id: string;

	/** Description */
	description: string;

	/** Context info */
	context: string;
}

export interface Knowledge {
	/** Id of the tool */
	id: string;

	/** Name of the tool */
	name: string;
}

export interface Tool {
	/** Type of the tool */
	type: "APP" | "FUNCTION" | "DATABASE";

	/** Id of the tool */
	id: string;

	/** Name of the tool */
	name: string;
}

/**
 * Item from the prompt library
 */
export interface Prompt {
	ID: string;
	CREATED_BY: string;
	DATE_CREATED: string;
	VERSION: number;
	INTENT: string;
	TITLE: string;
	CONTEXT: string;
	tags: string[];
}

export type FileObj =
	| {
			name: string;
			lastModified: number;
			webkitRelativePath: string;
			size: number;
			type: string;
			slice: number;
			stream: number;
			text: number;
			//   arrayBuffer?: string;
	  }
	| Record<string, never>;

/**
 * Messages from the backend
 */
export type PixelMessage =
	| InputTextPixelMessage
	| InputToolExecPixelMessage
	| ResponseTextPixelMessage
	| ResponseToolPixelMessage;

interface AbstractPixelMessage {
	type: string;
	messageId: string;
	parentMessageId?: string;
	visible: boolean;
	dateCreated: string;
	ornaments: {
		chunks: unknown[];
	};
}

interface InputTextPixelMessage extends AbstractPixelMessage {
	type: "INPUT_TEXT";
	visible: true;
	inputUIPrompt: string;
	modelId: string;
	paramMap: {
		max_new_tokens: number;
		temperature: number;
	};
}

interface InputToolExecPixelMessage extends AbstractPixelMessage {
	type: "INPUT_TOOL_EXEC";
	visible: false;
	toolResponse: {
		/** tool execution id */
		id: string;

		/**  TBD? **/
		name: string;

		/** THIS IS A STRING, but ONLY in playground we parse as an app */
		/** THIS IS THE FINAL STATE OF A TOOL (what was actually ran) */
		arguments: {
			/** App ID */
			id: string;

			/** Parameters for app */
			map: Record<string, unknown>;
		};
	}[];
}

interface ResponseTextPixelMessage extends AbstractPixelMessage {
	type: "RESPONSE_TEXT";
	visible: true;
	content: string;
}

interface ResponseToolPixelMessage extends AbstractPixelMessage {
	type: "RESPONSE_TOOL";
	visible: true;
	toolResponse: {
		/** tool execution id */
		id: string;

		/**  TBD? **/
		name: string;

		/** THIS IS A STRING, but ONLY in playground we parse as an app */
		/** THIS IS NOT USED IF THERE IS AN INPUT_TOOL_EXEC WITH THE SAME TOOL ID */
		arguments: {
			/** App ID */
			id: string;

			/** Parameters for app */
			map: Record<string, unknown>;
		};
	};
}
