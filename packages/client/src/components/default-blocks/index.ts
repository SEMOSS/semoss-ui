import { Registry } from '@/stores';

import { config as PageBlockConfig, PageBlockDef } from './page-block';
import { config as TextBlockConfig, TextBlockDef } from './text-block';

export type DefaultBlockDefinitions = PageBlockDef | TextBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [PageBlockConfig.widget]: PageBlockConfig,
    [TextBlockConfig.widget]: TextBlockConfig,
};
