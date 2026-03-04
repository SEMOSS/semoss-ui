export interface ConstraintSettings {
	restrictInput: boolean;
	filterHateSpeech: boolean;
	limitResponseWords: boolean;
	limitResponseCharacters: boolean;
	setTone: boolean;
	bulletpoints: boolean;
}
export interface Token {
	index: number; // easy access to the order of the token
	key: string; // token without punctuation
	display: string; // preserves context punctuation for display
	type: string; // can be text or input
	isHiddenPhraseInputToken: boolean; // additional words in phrase input, keep record but don't display
	linkedInputToken: undefined | number;
    options?: string[]; // options for select type inputs
}

export interface InputTypeValue {
    type: string;
    meta: string | null;
    options?: string[] | null;
}
export interface BuilderStepItem {
	step: number;
	value:
		| string
		| string[]
		| Token[]
		| ConstraintSettings
		| object
        | boolean
        | LLMSelectionType
		| undefined;
	required: boolean;
	display: string;
}

export interface Builder {
	title: BuilderStepItem;
	model: BuilderStepItem;
	context: BuilderStepItem;
	inputs: BuilderStepItem;
	inputTypes: BuilderStepItem;
	constraints: BuilderStepItem;
    llmSelection: BuilderStepItem; // new field for LLM checkbox
    temperature: BuilderStepItem; // new field for LLM temperature
}

export interface Prompt {
	id: string;
	title: string;
	tags: string[];
	context: string;
	intent: string;
	created_by: string;
	date_created: string;
    llmSelection?: LLMSelectionType; // optional field for LLM settings
    temperature?: string; // optional field for temperature
}

export enum LLMSelectionType {
    DEFAULT = 'default',
    USER_INPUT = 'user_input',
}
