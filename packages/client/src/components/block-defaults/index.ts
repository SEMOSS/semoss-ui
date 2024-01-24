import { Registry } from '@/stores';
import { config as BodyBlockConfig, BodyBlockDef } from './body-block';
import { config as ButtonBlockConfig, ButtonBlockDef } from './button-block';
import { config as CellBlockConfig, QueryBlockDef } from './query-block';
import {
    config as CheckboxBlockConfig,
    CheckboxBlockDef,
} from './checkbox-block';
import {
    config as ContainerBlockConfig,
    ContainerBlockDef,
} from './container-block';
import { config as DividerBlockConfig, DividerBlockDef } from './divider-block';
import { config as FooterBlockConfig, FooterBlockDef } from './footer-block';
import { config as FormBlockConfig, FormBlockDef } from './form-block';
import { config as HeaderBlockConfig, HeaderBlockDef } from './header-block';
import { config as IframeBlockConfig, IframeBlockDef } from './iframe-block';
import {
    config as MarkdownBlockConfig,
    MarkdownBlockDef,
} from './markdown-block';
import { config as PageBlockConfig, PageBlockDef } from './page-block';
import { config as SelectBlockConfig, SelectBlockDef } from './select-block';
import { config as TableBlockConfig, TableBlockDef } from './table-block';
import { config as TextBlockConfig, TextBlockDef } from './text-block';
import {
    config as TextFieldBlockConfig,
    TextFieldBlockDef,
} from './text-field-block';
import { config as SectionBlockConfig, SectionBlockDef } from './section-block';
import { config as UploadBlockConfig, UploadBlockDef } from './upload-block';

export type DefaultBlockDefinitions =
    | BodyBlockDef
    | ButtonBlockDef
    | QueryBlockDef
    | CheckboxBlockDef
    | ContainerBlockDef
    | DividerBlockDef
    | FooterBlockDef
    | FormBlockDef
    | HeaderBlockDef
    | IframeBlockDef
    | MarkdownBlockDef
    | PageBlockDef
    | SelectBlockDef
    | TableBlockDef
    | TextBlockDef
    | TextFieldBlockDef
    | SectionBlockDef
    | UploadBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [ButtonBlockConfig.widget]: ButtonBlockConfig,
    [CheckboxBlockConfig.widget]: CheckboxBlockConfig,
    [ContainerBlockConfig.widget]: ContainerBlockConfig,
    [CellBlockConfig.widget]: CellBlockConfig,
    [MarkdownBlockConfig.widget]: MarkdownBlockConfig,
    [PageBlockConfig.widget]: PageBlockConfig,
    [SelectBlockConfig.widget]: SelectBlockConfig,
    [TableBlockConfig.widget]: TableBlockConfig,
    [TextBlockConfig.widget]: TextBlockConfig,
    [TextFieldBlockConfig.widget]: TextFieldBlockConfig,
    [SectionBlockConfig.widget]: SectionBlockConfig,
    [UploadBlockConfig.widget]: UploadBlockConfig,
};

export function getIconForBlock(widget: string) {
    return DefaultBlocks[widget]?.icon;
}
