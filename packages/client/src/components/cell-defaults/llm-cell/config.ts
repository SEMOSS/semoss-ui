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
            let pixel = `LLM(engine=["${id}"], command=["${command}"], paramValues=[{`;
            if (temperature) pixel += `"temperature":${temperature},`;
            if (topP) pixel += `"top_p":${topP},`;
            if (length) pixel += `"max_new_tokens":${length},`;
            pixel = pixel.replace(/,$/, '');
            pixel += '}]);';
            return {
                pixel,
                parameters: {
                    variantId: key,
                    selected: variants[key].selected,
                },
            };
        });
        return pixels;
    },
};
