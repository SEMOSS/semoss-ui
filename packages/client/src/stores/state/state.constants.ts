import { ActionMessages } from './state.actions';

export const INPUT_BLOCK_TYPES = [
    'input',
    'select',
    'upload',
    'checkbox',
    'toggle-button',
];

export const VARIABLE_TYPES = [
    'block',
    'cell',
    'query',
    'database',
    'model',
    'vector',
    'storage',
    'function',
    'string',
    'number',
    'date',
    'array',
    'JSON',
    'LLM Comparison',
];

export const ACTIONS_DISPLAY = {
    [ActionMessages.RUN_QUERY]: 'Run Query',
    [ActionMessages.DISPATCH_EVENT]: 'Dispatch Event',
};
