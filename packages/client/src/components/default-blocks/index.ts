import { Registry } from '@/stores';

import { PageBlock, PageBlockDef } from './page-block';
import { TextBlock, TextBlockDef } from './text-block';

export type DefaultBlockDefinitions = PageBlockDef | TextBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [PageBlock.widget]: PageBlock,
    [TextBlock.widget]: TextBlock,
};
