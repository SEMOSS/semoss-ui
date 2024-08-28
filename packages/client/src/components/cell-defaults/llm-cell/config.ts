import { CellConfig } from '@/stores';
import { LLMCellDef, LLMCell } from './LLMCell';

// export the config for the block
export const LLMCellConfig: CellConfig<LLMCellDef> = {
    name: 'LLM',
    widget: 'llm',
    view: LLMCell,
    parameters: {
        modelId: '',

        paramValues: {},

        command: '',
    },
    toPixel: ({ modelId, paramValues, command }) => {
        return `LLM(engine=["${modelId}"], command=["${command}"], paramValues=[])`;
    },
};
