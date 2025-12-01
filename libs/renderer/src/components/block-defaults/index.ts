import type { Registry } from "../../store";
import {
	config as AccordionBlockConfig,
	type AccordionBlockDef,
} from "./accordion-block";
import { config as AudioBlockConfig, type AudioBlockDef } from "./audio-block";
import {
	config as AudioInputBlockConfig,
	type AudioInputBlockDef,
} from "./audio-input-block";
import {
	config as ButtonBlockConfig,
	type ButtonBlockDef,
} from "./button-block";
import {
	config as CheckboxBlockConfig,
	type CheckboxBlockDef,
} from "./checkbox-block";
import { config as ChipBlockConfig, type ChipBlockDef } from "./chip-block";
import {
	config as ContainerBlockConfig,
	type ContainerBlockDef,
} from "./container-block";
import {
	config as DividerBlockConfig,
	type DividerBlockDef,
} from "./divider-block";
import {
	config as EchartVisualizationBlockConfig,
	type EchartVisualizationBlockDef,
} from "./echart-visualization-block";
import {
	config as FlipCardBlockConfig,
	type FlipCardBlockDef,
} from "./flip-card-block";
import { config as FormBlockConfig, type FormBlockDef } from "./form-block";
import { config as GridBlockConfig, type GridBlockDef } from "./grid-block";
import {
	config as GridDynamicFrameBlockConfig,
	type GridDynamicFrameBlockDef,
} from "./grid-dynamic-frame-block";
import { config as HTMLBlockConfig, type HTMLBlockDef } from "./html-block";
import { config as IconBlockConfig, type IconBlockDef } from "./icon-block";
import {
	config as IframeBlockConfig,
	type IframeBlockDef,
} from "./iframe-block";
import { config as ImageBlockConfig, type ImageBlockDef } from "./image-block";
import { config as InputBlockConfig, type InputBlockDef } from "./input-block";
import {
	config as IterationBlockConfig,
	type IterationBlockDef,
} from "./iteration-block";
import { config as LinkBlockConfig, type LinkBlockDef } from "./link-block";
import { config as LogsBlockConfig, type LogsBlockDef } from "./logs-block";
import {
	config as MarkdownBlockConfig,
	type MarkdownBlockDef,
} from "./markdown-block";
import {
	config as MermaidBlockConfig,
	type MermaidBlockDef,
} from "./mermaid-block";
import { config as ModalBlockConfig, type ModalBlockDef } from "./modal-block";
import { config as PageBlockConfig, type PageBlockDef } from "./page-block";
import {
	config as PDFViewerBlockConfig,
	type PDFViewerBlockDef,
} from "./pdfViewer-block";
import {
	config as PopoverBlockConfig,
	type PopoverBlockDef,
} from "./popover-block";
import {
	config as ProgressBlockConfig,
	type ProgressBlockDef,
} from "./progress-block";
import { config as RadioBlockConfig, type RadioBlockDef } from "./radio-block";
import {
	config as RatingsBlockConfig,
	type RatingsBlockDef,
} from "./ratings-block";
import {
	config as SelectBlockConfig,
	type SelectBlockDef,
} from "./select-block";
import {
	config as SidebarBlockConfig,
	type SidebarBlockDef,
} from "./sidebar-block";
import {
	config as SliderBlockConfig,
	type SliderBlockDef,
} from "./slider-block";
import {
	config as SwitchBlockConfig,
	type SwitchBlockDef,
} from "./switch-block";
import { config as TabBlockConfig, type TabBlockDef } from "./tab-block";
import { config as TextBlockConfig, type TextBlockDef } from "./text-block";
import { config as ThemeBlockConfig, type ThemeBlockDef } from "./theme-block";
import {
	config as TimePickerBlockConfig,
	type TimePickerBlockDef,
} from "./time-picker-block";
import {
	config as ToggleButtonBlockConfig,
	type ToggleButtonBlockDef,
} from "./toggle-button-block";
import {
	config as UploadBlockConfig,
	type UploadBlockDef,
} from "./upload-block";
import {
	config as VegaVisualizationBlockConfig,
	type VegaVisualizationBlockDef,
} from "./vega-visualization-block";
import {
	config as VisualizationFilterBlockConfig,
	type VisualizationFilterBlockDef,
} from "./visualization-filter-block";

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
	| FlipCardBlockDef
	| GridBlockDef
	| HTMLBlockDef
	| IconBlockDef
	| IframeBlockDef
	| ImageBlockDef
	| InputBlockDef
	| IterationBlockDef
	| LinkBlockDef
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
	| VisualizationFilterBlockDef
	| GridDynamicFrameBlockDef
	| TabBlockDef
	| FormBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
	[AccordionBlockConfig.widget]: AccordionBlockConfig,
	[PopoverBlockConfig.widget]: PopoverBlockConfig,
	[AudioBlockConfig.widget]: AudioBlockConfig,
	[AudioInputBlockConfig.widget]: AudioInputBlockConfig,
	[ButtonBlockConfig.widget]: ButtonBlockConfig,
	[CheckboxBlockConfig.widget]: CheckboxBlockConfig,
	[ChipBlockConfig.widget]: ChipBlockConfig,
	[ContainerBlockConfig.widget]: ContainerBlockConfig,
	[FormBlockConfig.widget]: FormBlockConfig,
	[DividerBlockConfig.widget]: DividerBlockConfig,
	[EchartVisualizationBlockConfig.widget]: EchartVisualizationBlockConfig,
	[FlipCardBlockConfig.widget]: FlipCardBlockConfig,
	[GridBlockConfig.widget]: GridBlockConfig,
	[IconBlockConfig.widget]: IconBlockConfig,
	[IframeBlockConfig.widget]: IframeBlockConfig,
	[ImageBlockConfig.widget]: ImageBlockConfig,
	[InputBlockConfig.widget]: InputBlockConfig,
	[IterationBlockConfig.widget]: IterationBlockConfig,
	[LinkBlockConfig.widget]: LinkBlockConfig,
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
	[VisualizationFilterBlockConfig.widget]: VisualizationFilterBlockConfig,
	[GridDynamicFrameBlockConfig.widget]: GridDynamicFrameBlockConfig,
	[TabBlockConfig.widget]: TabBlockConfig,
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
	IterationBlockConfig,
	MarkdownBlockConfig,
	HTMLBlockConfig,
	PageBlockConfig,
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
	FlipCardBlockConfig,
	VisualizationFilterBlockConfig,
	GridDynamicFrameBlockConfig,
	TabBlockConfig,
	FormBlockConfig,
};
