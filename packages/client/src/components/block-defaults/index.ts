import { Registry } from '@/stores';

import { config as ButtonBlockConfig, ButtonBlockDef } from './button-block';
import {
    config as ContainerBlockConfig,
    ContainerBlockDef,
} from './container-block';
import { config as DividerBlockConfig, DividerBlockDef } from './divider-block';
import { config as FormBlockConfig, FormBlockDef } from './form-block';
import { config as InputBlockConfig, InputBlockDef } from './input-block';
import {
    config as MarkdownBlockConfig,
    MarkdownBlockDef,
} from './markdown-block';
import { config as PageBlockConfig, PageBlockDef } from './page-block';
import { config as SelectBlockConfig, SelectBlockDef } from './select-block';
import {
    config as TextAreaBlockConfig,
    TextAreaBlockDef,
} from './text-area-block';
import { config as TextBlockConfig, TextBlockDef } from './text-block';
import {
    config as TextFieldBlockConfig,
    TextFieldBlockDef,
} from './text-field-block';

export type DefaultBlockDefinitions =
    | ButtonBlockDef
    | ContainerBlockDef
    | DividerBlockDef
    | FormBlockDef
    | InputBlockDef
    | MarkdownBlockDef
    | PageBlockDef
    | SelectBlockDef
    | TextAreaBlockDef
    | TextBlockDef
    | TextFieldBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [ButtonBlockConfig.widget]: ButtonBlockConfig,
    [ContainerBlockConfig.widget]: ContainerBlockConfig,
    [DividerBlockConfig.widget]: DividerBlockConfig,
    [FormBlockConfig.widget]: FormBlockConfig,
    [InputBlockConfig.widget]: InputBlockConfig,
    [MarkdownBlockConfig.widget]: MarkdownBlockConfig,
    [PageBlockConfig.widget]: PageBlockConfig,
    [SelectBlockConfig.widget]: SelectBlockConfig,
    [TextAreaBlockConfig.widget]: TextAreaBlockConfig,
    [TextBlockConfig.widget]: TextBlockConfig,
    [TextFieldBlockConfig.widget]: TextFieldBlockConfig,
};

export function getIconForBlock(widget: string) {
    return DefaultBlocks[widget]?.icon;
}
