import { CellConfig } from '@/stores';
import { LLMCellDef, LLMCell } from './LLMCell';

// export the config for the block
export const LLMCellConfig: CellConfig<LLMCellDef> = {
    name: 'LLM',
    widget: 'llm',
    view: LLMCell,
    parameters: {
        command: '',
        variants: {},
    },
    toPixel: ({ command, variants }) => {
        const pixels = Object.keys(variants).map((key) => {
            const { id, length, temperature, topP } = variants[key].model;
            return `LLM(engine=["${id}"], command=["${command}"], paramValues=[{"temperature":${temperature}, "top_p": ${topP}, "max_new_tokens": ${length}}])`;
        });
        return pixels;
    },
};
