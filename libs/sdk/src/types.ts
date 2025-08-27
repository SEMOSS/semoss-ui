/**
 * Script object
 */
export type Script = {
	/** Content of the script */
	script: string;

	/** Alias to load the script as */
	alias: string;
};

export type Role =
	| "OWNER"
	| "EDIT"
	| "VIEWER"
	| "READ_ONLY"
	| "DISCOVERABLE"
	| "EDITOR";

export interface LLMResponse {
	messageId: string;
	messageType: string;
	numberOfTokensInPrompt: number;
	response: string;
	numberOfTokensInResponse: number;
	roomId: string;
}
