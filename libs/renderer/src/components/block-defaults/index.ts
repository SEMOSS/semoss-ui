import { Registry } from "../../store";

import {
    config as AccordionBlockConfig,
    AccordionBlockDef,
} from "./accordion-block";

import { config as AudioBlockConfig, AudioBlockDef } from "./audio-block";
import {
    config as AudioInputBlockConfig,
    AudioInputBlockDef,
} from "./audio-input-block";

import { config as ButtonBlockConfig, ButtonBlockDef } from "./button-block";

import {
    config as CheckboxBlockConfig,
    CheckboxBlockDef,
} from "./checkbox-block";
import { config as ChipBlockConfig, ChipBlockDef } from "./chip-block";
import {
    config as ContainerBlockConfig,
    ContainerBlockDef,
} from "./container-block";

import { config as DividerBlockConfig, DividerBlockDef } from "./divider-block";

import {
    config as EchartVisualizationBlockConfig,
    EchartVisualizationBlockDef,
} from "./echart-visualization-block";

import { config as GridBlockConfig, GridBlockDef } from "./grid-block";

import { config as HTMLBlockConfig, HTMLBlockDef } from "./html-block";

import { config as IconBlockConfig, IconBlockDef } from "./Icon_block";
import { config as IframeBlockConfig, IframeBlockDef } from "./iframe-block";
import { config as ImageBlockConfig, ImageBlockDef } from "./image-block";
import { config as InputBlockConfig, InputBlockDef } from "./input-block";

import { config as LinkBlockConfig, LinkBlockDef } from "./link-block";
import { config as LogsBlockConfig, LogsBlockDef } from "./logs-block";
import {
    config as LLMComparisonBlockConfig,
    LLMComparisonBlockDef,
} from "./llm-comparison-block";

import {
    config as MarkdownBlockConfig,
    MarkdownBlockDef,
} from "./markdown-block";
import { config as MermaidBlockConfig, MermaidBlockDef } from "./mermaid-block";
import { config as ModalBlockConfig, ModalBlockDef } from "./modal-block";

import { config as PageBlockConfig, PageBlockDef } from "./page-block";
import {
    config as PDFViewerBlockConfig,
    PDFViewerBlockDef,
} from "./pdfViewer-block";
import { config as PopoverBlockConfig, PopoverBlockDef } from "./popover-block";
import {
    config as ProgressBlockConfig,
    ProgressBlockDef,
} from "./progress-block";

import { config as RadioBlockConfig, RadioBlockDef } from "./radio-block";
import { config as RatingsBlockConfig, RatingsBlockDef } from "./ratings-block";

import { config as SelectBlockConfig, SelectBlockDef } from "./select-block";
import { config as SidebarBlockConfig, SidebarBlockDef } from "./sidebar-block";
import { config as SliderBlockConfig, SliderBlockDef } from "./slider-block";
import { config as SwitchBlockConfig, SwitchBlockDef } from "./switch-block";

import { config as TextBlockConfig, TextBlockDef } from "./text-block";
import {
    config as TimePickerBlockConfig,
    TimePickerBlockDef,
} from "./time-picker-block";
import { config as ThemeBlockConfig, ThemeBlockDef } from "./theme-block";
import {
    config as ToggleButtonBlockConfig,
    ToggleButtonBlockDef,
} from "./toggle-button-block";

import { config as UploadBlockConfig, UploadBlockDef } from "./upload-block";
import {
    config as VegaVisualizationBlockConfig,
    VegaVisualizationBlockDef,
} from "./vega-visualization-block";

// import { config as SectionBlockConfig, SectionBlockDef } from "./section-block";
// import { config as BodyBlockConfig, BodyBlockDef } from "./body-block";
// import { config as QueryBlockConfig, QueryBlockDef } from "./query-block";
// import { config as FooterBlockConfig, FooterBlockDef } from "./footer-block";
// import { config as FormBlockConfig, FormBlockDef } from "./form-block";
// import { config as HeaderBlockConfig, HeaderBlockDef } from "./header-block";
// import { config as StepperBlockConfig, StepperBlockDef } from "./stepper-block";

export type DefaultBlockDefinitions =
    | AccordionBlockDef
    | PopoverBlockDef
    | AudioBlockDef
    | AudioInputBlockDef
    | ButtonBlockDef
    | CheckboxBlockDef
    | ChipBlockDef
    | ContainerBlockDef
    | DividerBlockDef
    | EchartVisualizationBlockDef
    | GridBlockDef
    | HTMLBlockDef
    | IconBlockDef
    | IframeBlockDef
    | ImageBlockDef
    | InputBlockDef
    | LinkBlockDef
    | LLMComparisonBlockDef
    | LogsBlockDef
    | MarkdownBlockDef
    | MermaidBlockDef
    | ModalBlockDef
    | PageBlockDef
    | PDFViewerBlockDef
    | ProgressBlockDef
    | RadioBlockDef
    | RatingsBlockDef
    | SelectBlockDef
    | SidebarBlockDef
    | SliderBlockDef
    | SwitchBlockDef
    | TextBlockDef
    | ThemeBlockDef
    | ToggleButtonBlockDef
    | UploadBlockDef
    | VegaVisualizationBlockDef
    | RadioBlockDef
    | TimePickerBlockDef
    | ThemeBlockDef;
// | BodyBlockDef
// | DividerBlockDef
// | FooterBlockDef
// | FormBlockDef
// | HeaderBlockDef
// | QueryBlockDef
// | SectionBlockDef
// | StepperBlockDef

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [AccordionBlockConfig.widget]: AccordionBlockConfig,
    [PopoverBlockConfig.widget]: PopoverBlockConfig,
    [AudioBlockConfig.widget]: AudioBlockConfig,
    [AudioInputBlockConfig.widget]: AudioInputBlockConfig,
    [ButtonBlockConfig.widget]: ButtonBlockConfig,
    [CheckboxBlockConfig.widget]: CheckboxBlockConfig,
    [ChipBlockConfig.widget]: ChipBlockConfig,
    [ContainerBlockConfig.widget]: ContainerBlockConfig,
    [DividerBlockConfig.widget]: DividerBlockConfig,
    [EchartVisualizationBlockConfig.widget]: EchartVisualizationBlockConfig,
    [GridBlockConfig.widget]: GridBlockConfig,
    [IconBlockConfig.widget]: IconBlockConfig,
    [IframeBlockConfig.widget]: IframeBlockConfig,
    [ImageBlockConfig.widget]: ImageBlockConfig,
    [InputBlockConfig.widget]: InputBlockConfig,
    [LinkBlockConfig.widget]: LinkBlockConfig,
    [LLMComparisonBlockConfig.widget]: LLMComparisonBlockConfig,
    [LogsBlockConfig.widget]: LogsBlockConfig,
    [MarkdownBlockConfig.widget]: MarkdownBlockConfig,
    [MermaidBlockConfig.widget]: MermaidBlockConfig,
    [ModalBlockConfig.widget]: ModalBlockConfig,
    [HTMLBlockConfig.widget]: HTMLBlockConfig,
    [PageBlockConfig.widget]: PageBlockConfig,
    [PDFViewerBlockConfig.widget]: PDFViewerBlockConfig,
    [ProgressBlockConfig.widget]: ProgressBlockConfig,
    [RadioBlockConfig.widget]: RadioBlockConfig,
    [RatingsBlockConfig.widget]: RatingsBlockConfig,
    [SelectBlockConfig.widget]: SelectBlockConfig,
    [SidebarBlockConfig.widget]: SidebarBlockConfig,
    [SliderBlockConfig.widget]: SliderBlockConfig,
    [SwitchBlockConfig.widget]: SwitchBlockConfig,
    [TextBlockConfig.widget]: TextBlockConfig,
    [TimePickerBlockConfig.widget]: TimePickerBlockConfig,
    [ThemeBlockConfig.widget]: ThemeBlockConfig,
    [ToggleButtonBlockConfig.widget]: ToggleButtonBlockConfig,
    [UploadBlockConfig.widget]: UploadBlockConfig,
    [VegaVisualizationBlockConfig.widget]: VegaVisualizationBlockConfig,
    // [StepperBlockConfig.widget]: StepperBlockConfig,
    // [QueryBlockConfig.widget]: QueryBlockConfig,
};

export {
    AccordionBlockConfig,
    PopoverBlockConfig,
    AudioBlockConfig,
    AudioInputBlockConfig,
    ButtonBlockConfig,
    CheckboxBlockConfig,
    ChipBlockConfig,
    ContainerBlockConfig,
    DividerBlockConfig,
    GridBlockConfig,
    IconBlockConfig,
    IframeBlockConfig,
    ImageBlockConfig,
    InputBlockConfig,
    MarkdownBlockConfig,
    HTMLBlockConfig,
    PageBlockConfig,
    LLMComparisonBlockConfig,
    LogsBlockConfig,
    ProgressBlockConfig,
    RatingsBlockConfig,
    SelectBlockConfig,
    SidebarBlockConfig,
    SliderBlockConfig,
    SwitchBlockConfig,
    TextBlockConfig,
    ThemeBlockConfig,
    UploadBlockConfig,
    VegaVisualizationBlockConfig,
    EchartVisualizationBlockConfig,
    MermaidBlockConfig,
    ModalBlockConfig,
    RadioBlockConfig,
    PDFViewerBlockConfig,
    TimePickerBlockConfig,
};
