import { Registry } from '@/stores';

import { config as ButtonBlockConfig, ButtonBlockDef } from './button-block';
import {
    config as ContainerBlockConfig,
    ContainerBlockDef,
} from './container-block';
import { config as DividerBlockConfig, DividerBlockDef } from './divider-block';
import { config as FormBlockConfig, FormBlockDef } from './form-block';
import { config as IframeBlockConfig, IframeBlockDef } from './iframe-block';
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
import { config as SectionBlockConfig, SectionBlockDef } from './section-block';
import {
    config as FileBlockConfig,
    FileUploadBlockDef,
} from './file-upload-block';
import { config as EnginesBlockConfig, EnginesBlockDef } from './engines-block';
import { config as ModelsBlockConfig, ModelsBlockDef } from './models-block';
import { config as VectorsBlockConfig, VectorsBlockDef } from './vectors-block';

export type DefaultBlockDefinitions =
    | ButtonBlockDef
    | ContainerBlockDef
    | DividerBlockDef
    | FormBlockDef
    | IframeBlockDef
    | InputBlockDef
    | MarkdownBlockDef
    | PageBlockDef
    | SelectBlockDef
    | TextAreaBlockDef
    | TextBlockDef
    | TextFieldBlockDef
    | SectionBlockDef
    | FileUploadBlockDef
    | EnginesBlockDef
    | ModelsBlockDef
    | VectorsBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [ButtonBlockConfig.widget]: ButtonBlockConfig,
    [ContainerBlockConfig.widget]: ContainerBlockConfig,
    [DividerBlockConfig.widget]: DividerBlockConfig,
    [FormBlockConfig.widget]: FormBlockConfig,
    [IframeBlockConfig.widget]: IframeBlockConfig,
    [InputBlockConfig.widget]: InputBlockConfig,
    [MarkdownBlockConfig.widget]: MarkdownBlockConfig,
    [PageBlockConfig.widget]: PageBlockConfig,
    [SelectBlockConfig.widget]: SelectBlockConfig,
    [TextAreaBlockConfig.widget]: TextAreaBlockConfig,
    [TextBlockConfig.widget]: TextBlockConfig,
    [TextFieldBlockConfig.widget]: TextFieldBlockConfig,
    [SectionBlockConfig.widget]: SectionBlockConfig,
    [FileBlockConfig.widget]: FileBlockConfig,
    [EnginesBlockConfig.widget]: EnginesBlockConfig,
    [ModelsBlockConfig.widget]: ModelsBlockConfig,
    [VectorsBlockConfig.widget]: VectorsBlockConfig,
};

export function getIconForBlock(widget: string) {
    return DefaultBlocks[widget]?.icon;
}
