export type FieldType =
	| "text"
	| "password"
	| "number"
	| "select"
	| "radio"
	| "file-upload"
	| "zip-upload"
	| "checkbox"
	| "tags";

export interface ShowWhenRule {
	field: string;
	oneOf?: string[];
	notOneOf?: string[];
	eq?: string | boolean;
}

export interface OptionsWhenRule {
	field: string;
	eq: string;
	restrictTo: string[];
}

export interface FormField {
	key: string;
	label: string;
	value: string | boolean | null | string[];
	type: FieldType;
	category?: string;
	section?: string;
	disabled: boolean;
	required?: boolean;
	hidden?: boolean;
	options?: {
		options?: Array<{ display: string; value: string }>;
		extensions?: string[];
		pixel?: string;
	};
	rules?: {
		required?: { value: boolean; message: string };
		pattern?: { value: RegExp; message: string };
		min?: number;
		custom?: { value: string; message: string };
		conditionalOptions?: Array<{
			whenField: string;
			whenValue: string;
			allowedValues: string[];
			restrictOtherValues: boolean;
		}>;
	};
	helperText?: string;
	pixel?: string;
	showWhen?: ShowWhenRule | ShowWhenRule[];
	optionsWhen?: OptionsWhenRule[];
	displayRules?: {
		hideOtherFields?: Array<{ key: string; value: string[] }>;
	};
}

export interface FormDefinition {
	name: string;
	disable: boolean;
	icon: string;
	fields: FormField[];
	advanced?: FormField[];
}
