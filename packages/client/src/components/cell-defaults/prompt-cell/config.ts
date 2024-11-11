import { CellConfig } from '@/stores';
import { PromptCell, PromptCellDef } from './PromptCell';

export const PromptCellConfig: CellConfig<PromptCellDef> = {
    name: 'Prompt',
    widget: 'prompt',
    parameters: {
        id: '',
        prompt: '',
    },
    view: PromptCell,
    toPixel: ({ id, prompt }) => {
        if (id) {
            //getPrompt(id) return prompt
        }

        //For now return prompt
        return prompt;
    },
};
