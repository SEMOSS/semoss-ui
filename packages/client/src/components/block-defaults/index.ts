import { Registry } from '@/stores';
import { config as BodyBlockConfig, BodyBlockDef } from './body-block';
import { config as ButtonBlockConfig, ButtonBlockDef } from './button-block';
import {
    config as ContainerBlockConfig,
    ContainerBlockDef,
} from './container-block';
import { config as DividerBlockConfig, DividerBlockDef } from './divider-block';
import { config as FooterBlockConfig, FooterBlockDef } from './footer-block';
import { config as FormBlockConfig, FormBlockDef } from './form-block';
import { config as HeaderBlockConfig, HeaderBlockDef } from './header-block';
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
    config as FileDropZoneBlockConfig,
    FileDropZoneBlockDef,
} from './file-dropzone-block';

export type DefaultBlockDefinitions =
    | BodyBlockDef
    | ButtonBlockDef
    | ContainerBlockDef
    | DividerBlockDef
    | FooterBlockDef
    | FormBlockDef
    | HeaderBlockDef
    | IframeBlockDef
    | InputBlockDef
    | MarkdownBlockDef
    | PageBlockDef
    | SelectBlockDef
    | TextAreaBlockDef
    | TextBlockDef
    | TextFieldBlockDef
    | SectionBlockDef
    | FileDropZoneBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [BodyBlockConfig.widget]: BodyBlockConfig,
    [ButtonBlockConfig.widget]: ButtonBlockConfig,
    [ContainerBlockConfig.widget]: ContainerBlockConfig,
    [DividerBlockConfig.widget]: DividerBlockConfig,
    [FooterBlockConfig.widget]: FooterBlockConfig,
    [FormBlockConfig.widget]: FormBlockConfig,
    [HeaderBlockConfig.widget]: HeaderBlockConfig,
    [IframeBlockConfig.widget]: IframeBlockConfig,
    [InputBlockConfig.widget]: InputBlockConfig,
    [MarkdownBlockConfig.widget]: MarkdownBlockConfig,
    [PageBlockConfig.widget]: PageBlockConfig,
    [SelectBlockConfig.widget]: SelectBlockConfig,
    [TextAreaBlockConfig.widget]: TextAreaBlockConfig,
    [TextBlockConfig.widget]: TextBlockConfig,
    [TextFieldBlockConfig.widget]: TextFieldBlockConfig,
    [SectionBlockConfig.widget]: SectionBlockConfig,
    [FileDropZoneBlockConfig.widget]: FileDropZoneBlockConfig,
};

export function getIconForBlock(widget: string) {
    return DefaultBlocks[widget]?.icon;
}
