import {
    Block,
    Create,
    DisplaySettings,
    Input,
    Preview,
} from '@mui/icons-material';

// use contants for steps so it's easy to reorder/add new ones
export const PROMPT_BUILDER_CONTEXT_STEP = 1;
export const PROMPT_BUILDER_INPUTS_STEP = 2;
export const PROMPT_BUILDER_INPUT_TYPES_STEP = 3;
export const PROMPT_BUILDER_CONSTRAINTS_STEP = 4;
export const PROMPT_BUILDER_PREVIEW_STEP = 5;

export const LIBRARY_PROMPT_TAG_TRAVEL = 'travel';
export const LIBRARY_PROMPT_TAG_COMMUNICATIONS = 'communications';
export const LIBRARY_PROMPT_TAG_BUSINESS = 'business';

export const TOKEN_TYPE_TEXT = 'text';
export const TOKEN_TYPE_INPUT = 'input';

export const INPUT_TYPE_TEXT = 'text';
export const INPUT_TYPE_SELECT = 'select';
export const INPUT_TYPE_VECTOR = 'vector';
export const INPUT_TYPE_CUSTOM_QUERY = 'custom';
export const INPUT_TYPES = [
    INPUT_TYPE_TEXT,
    INPUT_TYPE_SELECT,
    INPUT_TYPE_VECTOR,
    INPUT_TYPE_CUSTOM_QUERY,
];
export const INPUT_TYPE_DISPLAY = {
    [INPUT_TYPE_TEXT]: 'Text Field',
    [INPUT_TYPE_SELECT]: 'Select',
    [INPUT_TYPE_VECTOR]: 'Vector Database Search',
    [INPUT_TYPE_CUSTOM_QUERY]: 'Custom Query',
};

export const VECTOR_SEARCH_FULL_CONTEXT = 'full';
export const VECTOR_SEARCH_INPUT = 'input';
export const VECTOR_SEARCH_CUSTOM = 'custom';

export const SUMMARY_STEPS = [
    {
        title: 'Create Prompt',
        icon: Create,
    },
    {
        title: 'Set Inputs',
        icon: Input,
    },
    {
        title: 'Define Input Types',
        icon: DisplaySettings,
    },
    {
        title: 'Set Constraints',
        icon: Block,
    },
    {
        title: 'Preview Prompt',
        icon: Preview,
    },
];
