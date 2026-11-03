import type { Engine } from "@semoss/shared";

type FieldType =
	| "text"
	| "password"
	| "number"
	| "select"
	| "engine"
	| "radio"
	| "file-upload"
	| "zip-upload"
	| "checkbox"
	| "tags";

interface ShowWhenRule {
	field: string;
	oneOf?: string[];
	notOneOf?: string[];
	eq?: string | boolean;
}

interface OptionsWhenRule {
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
	/**
	 * For an engine field, the engines it offers, read page by page with the
	 * shared EngineSelect, which shows each one's logo, name and id.
	 */
	engineRule?: {
		/** The engine types offered, such as MODEL. */
		engineTypes: Engine["engine_type"][];
		/** Metadata the offered engines must have, such as [{ tag: "embeddings" }]. */
		metaFilters?: unknown[];
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
