import { Registry } from '@/stores';
import { config as BodyBlockConfig, BodyBlockDef } from './body-block';
import { config as ButtonBlockConfig, ButtonBlockDef } from './button-block';
import { config as QueryBlockConfig, QueryBlockDef } from './query-block';
import { config as LogsBlockConfig, LogsBlockDef } from './logs-block';
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
import { config as HTMLBlockConfig, HTMLBlockDef } from './html-block';
import { config as PageBlockConfig, PageBlockDef } from './page-block';
import { config as SelectBlockConfig, SelectBlockDef } from './select-block';
import { config as TableBlockConfig, TableBlockDef } from './table-block';
import { config as TextBlockConfig, TextBlockDef } from './text-block';
import { config as InputBlockConfig, InputBlockDef } from './input-block';
import { config as SectionBlockConfig, SectionBlockDef } from './section-block';
import { config as UploadBlockConfig, UploadBlockDef } from './upload-block';
import { config as ImageBlockConfig, ImageBlockDef } from './image-block';
import { config as LinkBlockConfig, LinkBlockDef } from './link-block';
import {
    config as VegaVisualizationBlockConfig,
    VegaVisualizationBlockDef,
} from './vega-visualization-block';
import {
    config as ProgressBlockConfig,
    ProgressBlockDef,
} from './progress-block';
import {
    config as ToggleButtonBlockConfig,
    ToggleButtonBlockDef,
} from './toggle-button-block';
import { config as MermaidBlockConfig, MermaidBlockDef } from './mermaid-block';
import { config as ModalBlockConfig, ModalBlockDef } from './modal-block';
import { config as ChatBlockConfig, ChatBlockDef } from './chat-block';

export type DefaultBlockDefinitions =
    | BodyBlockDef
    | ButtonBlockDef
    | CheckboxBlockDef
    | ContainerBlockDef
    | DividerBlockDef
    | FooterBlockDef
    | FormBlockDef
    | HeaderBlockDef
    | IframeBlockDef
    | ImageBlockDef
    | LinkBlockDef
    | MarkdownBlockDef
    | HTMLBlockDef
    | PageBlockDef
    | ProgressBlockDef
    | QueryBlockDef
    | LogsBlockDef
    | SelectBlockDef
    | TableBlockDef
    | TextBlockDef
    | ToggleButtonBlockDef
    | InputBlockDef
    | SectionBlockDef
    | UploadBlockDef
    | VegaVisualizationBlockDef
    | MermaidBlockDef
    | ModalBlockDef
    | ChatBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [ButtonBlockConfig.widget]: ButtonBlockConfig,
    [CheckboxBlockConfig.widget]: CheckboxBlockConfig,
    [ContainerBlockConfig.widget]: ContainerBlockConfig,
    [IframeBlockConfig.widget]: IframeBlockConfig,
    [ImageBlockConfig.widget]: ImageBlockConfig,
    [InputBlockConfig.widget]: InputBlockConfig,
    [LinkBlockConfig.widget]: LinkBlockConfig,
    [MarkdownBlockConfig.widget]: MarkdownBlockConfig,
    [HTMLBlockConfig.widget]: HTMLBlockConfig,
    [PageBlockConfig.widget]: PageBlockConfig,
    [ProgressBlockConfig.widget]: ProgressBlockConfig,
    [QueryBlockConfig.widget]: QueryBlockConfig,
    [LogsBlockConfig.widget]: LogsBlockConfig,
    [SelectBlockConfig.widget]: SelectBlockConfig,
    [TextBlockConfig.widget]: TextBlockConfig,
    [ToggleButtonBlockConfig.widget]: ToggleButtonBlockConfig,
    [UploadBlockConfig.widget]: UploadBlockConfig,
    [VegaVisualizationBlockConfig.widget]: VegaVisualizationBlockConfig,
    [MermaidBlockConfig.widget]: MermaidBlockConfig,
    [ModalBlockConfig.widget]: ModalBlockConfig,
    [ChatBlockConfig.widget]: ChatBlockConfig,
};

export function getIconForBlock(widget: string) {
    return DefaultBlocks[widget]?.icon;
}

export function getTypeForBlock(widget: string) {
    return DefaultBlocks[widget]?.type;
}

export {
    ButtonBlockConfig,
    ContainerBlockConfig,
    CheckboxBlockConfig,
    IframeBlockConfig,
    ImageBlockConfig,
    InputBlockConfig,
    MarkdownBlockConfig,
    HTMLBlockConfig,
    PageBlockConfig,
    QueryBlockConfig,
    LogsBlockConfig,
    ProgressBlockConfig,
    SelectBlockConfig,
    TextBlockConfig,
    UploadBlockConfig,
    VegaVisualizationBlockConfig,
    MermaidBlockConfig,
    ModalBlockConfig,
    ChatBlockConfig,
};
