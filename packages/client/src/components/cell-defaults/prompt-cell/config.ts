import { CellConfig } from '@/stores';
import { PromptCell, PromptCellDef } from './PromptCell';

export const PromptCellConfig: CellConfig<PromptCellDef> = {
    name: 'Prompt',
    widget: 'prompt',
    parameters: {
        id: '',
        prompt: '',
        boundState: false,
    },
    view: PromptCell,
    toPixel: ({ id, prompt }) => {
        return prompt;
    },
};
