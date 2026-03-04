import {
	Block,
	Create,
	DisplaySettings,
	Input,
	Preview,
} from "@mui/icons-material";

// use contants for steps so it's easy to reorder/add new ones
export const PROMPT_BUILDER_CONTEXT_STEP = 1;
export const PROMPT_BUILDER_INPUTS_STEP = 2;
export const PROMPT_BUILDER_INPUT_TYPES_STEP = 3;
export const PROMPT_BUILDER_CONSTRAINTS_STEP = 4;
export const PROMPT_BUILDER_PREVIEW_STEP = 5;

export const LIBRARY_PROMPT_TAG_TRAVEL = "travel";
export const LIBRARY_PROMPT_TAG_COMMUNICATIONS = "communications";
export const LIBRARY_PROMPT_TAG_BUSINESS = "business";

export const TOKEN_TYPE_TEXT = "text";
export const TOKEN_TYPE_INPUT = "input";

export const INPUT_TYPE_TEXT = 'text';
export const INPUT_TYPE_SELECT = 'select';
export const INPUT_TYPE_VECTOR = 'vector';
export const INPUT_TYPE_CUSTOM_QUERY = 'custom';
export const INPUT_TYPE_DATABASE = 'database';

export const SELECT_TYPE_USER_INPUT = 'User Input';
export const SELECT_TYPE_MODELS = 'Models';
export const SELECT_TYPE_VECTORS = 'Vectors';
export const SELECT_TYPE_STORAGES = 'Storages';
export const SELECT_TYPE_DATABASES = 'Databases';
export const SELECT_TYPE_OPTIONS = [
    SELECT_TYPE_USER_INPUT,
    SELECT_TYPE_VECTORS,
    SELECT_TYPE_DATABASES,
    SELECT_TYPE_STORAGES,
];

export const INPUT_TYPES = [
	INPUT_TYPE_TEXT,
	INPUT_TYPE_SELECT,
	INPUT_TYPE_VECTOR,
	INPUT_TYPE_DATABASE,
	INPUT_TYPE_CUSTOM_QUERY,
];
export const INPUT_TYPE_DISPLAY = {
	[INPUT_TYPE_TEXT]: "User Text",
	[INPUT_TYPE_SELECT]: "User Drop-Down List",
	[INPUT_TYPE_VECTOR]: "Perform RAG Search",
	[INPUT_TYPE_CUSTOM_QUERY]: "Use a Parameter in API",
	[INPUT_TYPE_DATABASE]: "Execute as Query",
};
export const INPUT_TYPE_HELP_TEXT = {
    [INPUT_TYPE_VECTOR]:
        'This input will be used as a search term for the selected knowledge repository. The search results can be modified to fit your needs and will be used to support your prompt.',
    [INPUT_TYPE_DATABASE]:
        'This input will be used to query the selected database. The query results generated can be modified to fit your needs and will be used to support your prompt.',
    [INPUT_TYPE_SELECT]:
        'Select from predefined options: User Input for manual entry, Models for model selection, or Vectors for knowledge base integration.',
};

export const SUMMARY_STEPS = [
	{
		title: "Create Prompt",
		icon: Create,
	},
	{
		title: "Set Inputs",
		icon: Input,
	},
	{
		title: "Define Input Types",
		icon: DisplaySettings,
	},
	{
		title: "Set Constraints",
		icon: Block,
	},
	{
		title: "Preview Prompt",
		icon: Preview,
	},
];
