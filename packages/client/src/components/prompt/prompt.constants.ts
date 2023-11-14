import { Create, DisplaySettings, Input } from '@mui/icons-material';

export const LIBRARY_PROMPT_TAG_TRAVEL = 'travel';
export const LIBRARY_PROMPT_TAG_COMMUNICATIONS = 'communications';
export const LIBRARY_PROMPT_TAG_BUSINESS = 'business';

export const TOKEN_TYPE_TEXT = 'text';
export const TOKEN_TYPE_INPUT = 'input';

export const INPUT_TYPE_TEXT = 'text';
export const INPUT_TYPE_NUMBER = 'number';
export const INPUT_TYPE_VECTOR = 'vector';
export const INPUT_TYPE_DATABASE = 'database';
export const INPUT_TYPE_DATA_PRODUCT = 'data-product';
export const INPUT_TYPE_DATE = 'date';
export const INPUT_TYPE_RANGE = 'range';
export const INPUT_TYPE_SELECT = 'select';
export const INPUT_TYPES = [
    INPUT_TYPE_TEXT,
    INPUT_TYPE_NUMBER,
    INPUT_TYPE_DATE,
    INPUT_TYPE_SELECT,
    // INPUT_TYPE_VECTOR,
    // INPUT_TYPE_DATABASE,
    // INPUT_TYPE_DATA_PRODUCT,
    // INPUT_TYPE_RANGE,
];
export const INPUT_TYPE_DISPLAY = {
    [INPUT_TYPE_TEXT]: 'Text',
    [INPUT_TYPE_NUMBER]: 'Number',
    [INPUT_TYPE_VECTOR]: 'Vector Database',
    [INPUT_TYPE_DATABASE]: 'Database',
    [INPUT_TYPE_DATA_PRODUCT]: 'Data Product',
    [INPUT_TYPE_DATE]: 'Date',
    [INPUT_TYPE_RANGE]: 'Range Slider',
    [INPUT_TYPE_SELECT]: 'Select',
};
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
    // {
    //     title: 'Set Constraints',
    //     icon: Block,
    // },
];
