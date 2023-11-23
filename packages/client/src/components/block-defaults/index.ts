import { Registry } from '@/stores';

import { config as ButtonBlockConfig, ButtonBlockDef } from './button-block';
import {
    config as ContainerBlockConfig,
    ContainerBlockDef,
} from './container-block';
import { config as InputBlockConfig, InputBlockDef } from './input-block';
import { config as PageBlockConfig, PageBlockDef } from './page-block';
import { config as TextBlockConfig, TextBlockDef } from './text-block';
import {
    config as TextFieldBlockConfig,
    TextFieldBlockDef,
} from './text-field-block';
import {
    config as MarkdownBlockConfig,
    MarkdownBlockDef,
} from './markdown-block';
import { config as SelectBlockConfig, SelectBlockDef } from './select-block';
import {
    config as FileUploadBlockConfig,
    FileUploadBlockDef,
} from './file-upload-block';

export type DefaultBlockDefinitions =
    | ButtonBlockDef
    | ContainerBlockDef
    | InputBlockDef
    | PageBlockDef
    | TextBlockDef
    | TextFieldBlockDef
    | MarkdownBlockDef
    | SelectBlockDef
    | FileUploadBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [PageBlockConfig.widget]: PageBlockConfig,
    [ContainerBlockConfig.widget]: ContainerBlockConfig,
    [TextBlockConfig.widget]: TextBlockConfig,
    [TextFieldBlockConfig.widget]: TextFieldBlockConfig,
    [MarkdownBlockConfig.widget]: MarkdownBlockConfig,
    [SelectBlockConfig.widget]: SelectBlockConfig,
    [InputBlockConfig.widget]: InputBlockConfig,
    [ButtonBlockConfig.widget]: ButtonBlockConfig,
    [FileUploadBlockConfig.widget]: FileUploadBlockConfig,
};
