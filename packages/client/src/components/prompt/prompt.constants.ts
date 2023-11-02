import { Block, Create, DisplaySettings, Input } from '@mui/icons-material';

export const TOKEN_TYPE_TEXT = 'text';
export const TOKEN_TYPE_INPUT = 'input';
export const INPUT_TYPE_TEXT = 'text';
export const INPUT_TYPE_VECTOR = 'vector';
export const INPUT_TYPE_DISPLAY = {
    [INPUT_TYPE_TEXT]: 'Text',
    [INPUT_TYPE_VECTOR]: 'Vector Database',
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
    {
        title: 'Set Constraints',
        icon: Block,
    },
];
