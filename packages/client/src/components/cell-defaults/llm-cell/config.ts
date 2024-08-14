import { CellConfig } from '@/stores';
import { LLMCellDef, LLMCell } from './LLMCell';

// export the config for the block
export const LLMCellConfig: CellConfig<LLMCellDef> = {
    name: 'LLM',
    widget: 'llm',
    view: LLMCell,
    parameters: {
        model: '',

        command: '',

        paramValues: {},
    },
    toPixel: ({ model, paramValues, command }) => {
        return `LLM(engine=["${model}"], command=["${command}"], paramValues=[${JSON.stringify(
            paramValues,
        )}])`;
    },
};
