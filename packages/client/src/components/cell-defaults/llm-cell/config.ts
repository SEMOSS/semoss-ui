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
            // TODO: need to figure out the names for the 'length' & 'topP' value in the params for the pixel string.
            return `LLM(engine=["${id}"], command=["${command}"], paramValues=[{"temperature":${temperature}}])`;
        });
        return pixels;
    },
};
