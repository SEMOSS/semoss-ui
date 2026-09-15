import type { FormField } from "../shared/import-form.types";

const NAME_PATTERN_RULE = {
	value: /^[\w\-\s]+$/,
	message:
		"Catalog names can only contain alphanumeric characters and dashes.",
};

const CHECK_ENGINE_NAME_PIXEL = 'META | CheckEngineName ( "[VALUE]") ;';

const CHECK_ENGINE_NAME_MESSAGE =
	"This Catalog name has already been used, please try another.";

export function dbDriverField(value: string): FormField {
	return {
		key: "dbDriver",
		label: "Driver Name",
		value,
		type: "text",
		disabled: true,
		required: true,
		hidden: true,
		category: "General",
	};
}

// ---------------------------------------------------------------------------
// General-section fields for file-upload forms (CSV / TSV / TXT / Excel)
// ---------------------------------------------------------------------------

export const COMMON_FILE_GENERAL_FIELDS: FormField[] = [
	{
		key: "DATABASE_NAME",
		label: "Enter Database Name",
		value: "",
		section: "general",
		category: "General",
		type: "text",
		disabled: false,
		required: true,
		rules: {
			pattern: NAME_PATTERN_RULE,
			custom: {
				value: CHECK_ENGINE_NAME_PIXEL,
				message: CHECK_ENGINE_NAME_MESSAGE,
			},
		},
	},
	{
		key: "DATABASE_DESCRIPTION",
		label: "Enter Database Description",
		value: "",
		section: "general",
		category: "General",
		type: "text",
		disabled: false,
		required: false,
	},
	{
		key: "DATABASE_TAG",
		label: "Enter Database Tag",
		value: "",
		section: "general",
		category: "General",
		type: "tags",
		disabled: false,
		required: false,
	},
];

// ---------------------------------------------------------------------------
// General-section fields for JDBC connection forms
// ---------------------------------------------------------------------------

export const COMMON_JDBC_GENERAL_FIELDS: FormField[] = [
	{
		key: "NAME",
		label: "Catalog Name",
		value: "",
		type: "text",
		disabled: false,
		required: true,
		category: "General",
		rules: {
			pattern: NAME_PATTERN_RULE,
			custom: {
				value: CHECK_ENGINE_NAME_PIXEL,
				message: CHECK_ENGINE_NAME_MESSAGE,
			},
		},
	},
	{
		key: "DATABASE_DESCRIPTION",
		label: "Database Description",
		value: "",
		type: "text",
		disabled: false,
		required: false,
		category: "General",
	},
	{
		key: "DATABASE_TAG",
		label: "Tags",
		value: "",
		type: "tags",
		disabled: false,
		required: false,
		category: "General",
	},
];

// ---------------------------------------------------------------------------
// Connection + credential fields for standard JDBC forms
// Returns fields in the canonical order: hostname → port → schema →
//   USERNAME → PASSWORD → additional → CONNECTION_URL
// ---------------------------------------------------------------------------

interface JdbcConnectionOpts {
	portDefault?: string;
	portRequired?: boolean;
	schemaRequired?: boolean;
	noSchema?: boolean;
	connectionUrlRequired?: boolean;
}

export function jdbcConnectionFields(
	opts: JdbcConnectionOpts = {},
): FormField[] {
	const fields: FormField[] = [
		{
			key: "hostname",
			label: "Host Name",
			value: "",
			type: "text",
			disabled: false,
			required: true,
			category: "Settings",
		},
		{
			key: "port",
			label: "Port",
			value: opts.portDefault ?? "",
			type: "number",
			disabled: false,
			required: opts.portRequired ?? false,
			rules: { min: 0 },
			category: "Settings",
		},
	];

	if (!opts.noSchema) {
		fields.push({
			key: "schema",
			label: "Schema",
			value: "",
			type: "text",
			disabled: false,
			required: opts.schemaRequired ?? false,
			category: "Settings",
		});
	}

	fields.push(
		{
			key: "USERNAME",
			label: "Username",
			value: "",
			type: "text",
			disabled: false,
			required: false,
			category: "Credentials",
		},
		{
			key: "PASSWORD",
			label: "Password",
			value: "",
			type: "password",
			disabled: false,
			required: false,
			category: "Credentials",
		},
		{
			key: "additional",
			label: "Additional Parameters",
			value: "",
			type: "text",
			disabled: false,
			required: false,
			category: "Settings",
		},
		{
			key: "CONNECTION_URL",
			label: "JDBC Url",
			value: "",
			type: "text",
			disabled: false,
			required: opts.connectionUrlRequired ?? false,
			category: "Settings",
		},
	);

	return fields;
}

// ---------------------------------------------------------------------------
// Advanced section — identical across all standard JDBC forms
// ---------------------------------------------------------------------------

export const COMMON_JDBC_ADVANCED: FormField[] = [
	{
		key: "FETCH_SIZE",
		label: "Fetch Size",
		value: "",
		rules: { min: 0 },
		type: "number",
		disabled: false,
		required: false,
	},
	{
		key: "CONNECTION_TIMEOUT",
		label: "Connection Timeout",
		value: "",
		rules: { min: 0 },
		type: "number",
		disabled: false,
		required: false,
	},
	{
		key: "USE_CONNECTION_POOLING",
		label: "Use Connection Pooling",
		value: false,
		required: false,
		type: "checkbox",
		disabled: false,
	},
	{
		key: "POOL_MIN_SIZE",
		label: "Pool Min Size",
		value: "",
		rules: { min: 0 },
		type: "number",
		disabled: false,
		required: false,
	},
	{
		key: "POOL_MAX_SIZE",
		label: "Pool Max Size",
		value: "",
		rules: { min: 0 },
		type: "number",
		disabled: false,
		required: false,
	},
];
