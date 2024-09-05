import { CellConfig, Variant } from '@/stores';
import { LLMCellDef, LLMCell } from './LLMCell';
import { useBlocks } from '@/hooks';
import { toJS } from 'mobx';

// export the config for the block
export const LLMCellConfig: CellConfig<LLMCellDef> = {
    name: 'LLM',
    widget: 'llm',
    view: LLMCell,
    parameters: {
        command: '',
        variants: {},
    },
    toPixels: ({ command }) => {
        const { state } = useBlocks();
        // console.log(toJS(state.blocks[blockId]));
        return [];
        // const pixels = Object.values(variants).map((variant: Variant) => {
        //     return `LLM(engine=["${variant.models[0].id}"], command=["${command}"], paramValues=[])`;
        // });
        // return pixels;
    },
};
