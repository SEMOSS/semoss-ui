import { Registry } from '@/stores';
import { config as AudioBlockConfig, AudioBlockDef } from './audio-block';
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
import { config as GridBlockConfig, GridBlockDef } from './grid-block';
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
import {
    config as CompareLLMBlockConfig,
    LLMComparisonBlockDef,
} from './llm-comparison-block';
import { config as ModalBlockConfig, ModalBlockDef } from './modal-block';
import { config as StepperBlockConfig, StepperBlockDef } from './stepper-block';
import { config as RadioBlockConfig, RadioBlockDef } from './radio-block';
import {
    config as AudioInputBlockConfig,
    AudioInputBlockDef,
} from './audio-input-block';

import {
    config as PDFViewerBlockConfig,
    PDFViewerBlockDef,
} from './pdfViewer-block';

export type DefaultBlockDefinitions =
    | AudioBlockDef
    | AudioInputBlockDef
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
    | GridBlockDef
    | TextBlockDef
    | ToggleButtonBlockDef
    | InputBlockDef
    | SectionBlockDef
    | StepperBlockDef
    | UploadBlockDef
    | VegaVisualizationBlockDef
    | MermaidBlockDef
    | LLMComparisonBlockDef
    | ModalBlockDef
    | RadioBlockDef
    | PDFViewerBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [AudioBlockConfig.widget]: AudioBlockConfig,
    [ButtonBlockConfig.widget]: ButtonBlockConfig,
    [CheckboxBlockConfig.widget]: CheckboxBlockConfig,
    [CompareLLMBlockConfig.widget]: CompareLLMBlockConfig,
    [ContainerBlockConfig.widget]: ContainerBlockConfig,
    [IframeBlockConfig.widget]: IframeBlockConfig,
    [ImageBlockConfig.widget]: ImageBlockConfig,
    [InputBlockConfig.widget]: InputBlockConfig,
    [LinkBlockConfig.widget]: LinkBlockConfig,
    [MarkdownBlockConfig.widget]: MarkdownBlockConfig,
    [ModalBlockConfig.widget]: ModalBlockConfig,
    [HTMLBlockConfig.widget]: HTMLBlockConfig,
    [PageBlockConfig.widget]: PageBlockConfig,
    [ProgressBlockConfig.widget]: ProgressBlockConfig,
    [QueryBlockConfig.widget]: QueryBlockConfig,
    [LogsBlockConfig.widget]: LogsBlockConfig,
    [SelectBlockConfig.widget]: SelectBlockConfig,
    [StepperBlockConfig.widget]: StepperBlockConfig,
    [GridBlockConfig.widget]: GridBlockConfig,
    [TextBlockConfig.widget]: TextBlockConfig,
    [ToggleButtonBlockConfig.widget]: ToggleButtonBlockConfig,
    [UploadBlockConfig.widget]: UploadBlockConfig,
    [VegaVisualizationBlockConfig.widget]: VegaVisualizationBlockConfig,
    [MermaidBlockConfig.widget]: MermaidBlockConfig,
    [RadioBlockConfig.widget]: RadioBlockConfig,
    [AudioInputBlockConfig.widget]: AudioInputBlockConfig,
    [PDFViewerBlockConfig.widget]: PDFViewerBlockConfig,
};

export {
    AudioBlockConfig,
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
    GridBlockConfig,
    TextBlockConfig,
    UploadBlockConfig,
    VegaVisualizationBlockConfig,
    MermaidBlockConfig,
    CompareLLMBlockConfig,
    ModalBlockConfig,
    RadioBlockConfig,
    PDFViewerBlockConfig,
};
