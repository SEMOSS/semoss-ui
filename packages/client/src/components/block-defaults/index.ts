import { Registry } from '@/stores';

import {
    config as ContainerBlockConfig,
    ContainerBlockDef,
} from './container-block';
import { config as InputBlockConfig, InputBlockDef } from './input-block';
import { config as PageBlockConfig, PageBlockDef } from './page-block';
import { config as TextBlockConfig, TextBlockDef } from './text-block';

export type DefaultBlockDefinitions =
    | ContainerBlockDef
    | InputBlockDef
    | PageBlockDef
    | TextBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [ContainerBlockConfig.widget]: ContainerBlockConfig,
    [InputBlockConfig.widget]: InputBlockConfig,
    [PageBlockConfig.widget]: PageBlockConfig,
    [TextBlockConfig.widget]: TextBlockConfig,
};
