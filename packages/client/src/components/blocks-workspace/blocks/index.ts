import { config as AccordionSettingsConfig } from "./block-settings/accordion-block";
import { config as AudioSettingsConfig } from "./block-settings/audio-block";
import { config as AudioInputSettingsConfig } from "./block-settings/audio-input-block";
import { config as ButtonSettingsConfig } from "./block-settings/button-block";
import { config as CalendarViewSettingsConfig } from "./block-settings/calendarview-block";
import { config as CheckboxSettingsConfig } from "./block-settings/checkbox-block";
import { config as ChipSettingsConfig } from "./block-settings/chip-block";
import { config as ContainerSettingsConfig } from "./block-settings/container-block";
import { config as DividerSettingsConfig } from "./block-settings/divider-block";
import { config as EchartVisualizationSettingsConfig } from "./block-settings/echart-visualization-block";
import { config as FlipCardSettingsConfig } from "./block-settings/flip-card-block";
import { config as FormSettingsConfig } from "./block-settings/form-block";
import { config as GridSettingsConfig } from "./block-settings/grid-block";
import { config as GridDynamicFrameSettingsConfig } from "./block-settings/grid-dynamic-frame-block";
import { config as HTMLSettingsConfig } from "./block-settings/html-block";
import { config as IconSettingsConfig } from "./block-settings/icon-block";
import { config as IframeSettingsConfig } from "./block-settings/iframe-block";
import { config as ImageSettingsConfig } from "./block-settings/image-block";
import { config as InputSettingsConfig } from "./block-settings/input-block";
import { config as IterationSettingsConfig } from "./block-settings/iteration-block";
import { config as LinkSettingsConfig } from "./block-settings/link-block";
import { config as LogsSettingsConfig } from "./block-settings/logs-block";
import { config as MarkdownSettingsConfig } from "./block-settings/markdown-block";
import { config as MermaidSettingsConfig } from "./block-settings/mermaid-block";
import { config as ModalSettingsConfig } from "./block-settings/modal-block";
import { config as PageSettingsConfig } from "./block-settings/page-block";
import { config as PDFViewerSettingsConfig } from "./block-settings/pdfViewer-block";
import { config as PopoverSettingsConfig } from "./block-settings/popover-block";
import { config as ProgressSettingsConfig } from "./block-settings/progress-block";
import { config as RadioSettingsConfig } from "./block-settings/radio-block";
import { config as RatingsSettingsConfig } from "./block-settings/ratings-block";
import { config as SelectSettingsConfig } from "./block-settings/select-block";
import { config as SidebarSettingsConfig } from "./block-settings/sidebar-block";
import { config as SliderSettingsConfig } from "./block-settings/slider-block";
import { config as SwitchSettingsConfig } from "./block-settings/switch-block";
import { config as TabSettingsConfig } from "./block-settings/tab-block";
import { config as TextSettingsConfig } from "./block-settings/text-block";
import { config as ThemeSettingsConfig } from "./block-settings/theme-block";
import { config as TimePickerSettingsConfig } from "./block-settings/time-picker-block";
import { config as ToggleButtonSettingsConfig } from "./block-settings/toggle-button-block";
import { config as UploadSettingsConfig } from "./block-settings/upload-block";
import { config as VegaVisualizationSettingsConfig } from "./block-settings/vega-visualization-block";
import { config as VisualizationFilterSettingsConfig } from "./block-settings/visualization-filter-block";

export const BlockSettingsRegistry = {
	accordion: AccordionSettingsConfig,
	popover: PopoverSettingsConfig,
	"audio-player": AudioSettingsConfig,
	"audio-input": AudioInputSettingsConfig,
	button: ButtonSettingsConfig,
	checkbox: CheckboxSettingsConfig,
	chip: ChipSettingsConfig,
	container: ContainerSettingsConfig,
	calendarviewtext: CalendarViewSettingsConfig,
	form: FormSettingsConfig,
	divider: DividerSettingsConfig,
	"e-chart": EchartVisualizationSettingsConfig,
	"flip-card": FlipCardSettingsConfig,
	grid: GridSettingsConfig,
	icon: IconSettingsConfig,
	iframe: IframeSettingsConfig,
	image: ImageSettingsConfig,
	input: InputSettingsConfig,
	iteration: IterationSettingsConfig,
	link: LinkSettingsConfig,
	logs: LogsSettingsConfig,
	markdown: MarkdownSettingsConfig,
	mermaid: MermaidSettingsConfig,
	modal: ModalSettingsConfig,
	html: HTMLSettingsConfig,
	page: PageSettingsConfig,
	pdfViewer: PDFViewerSettingsConfig,
	progress: ProgressSettingsConfig,
	radio: RadioSettingsConfig,
	ratings: RatingsSettingsConfig,
	select: SelectSettingsConfig,
	sidebar: SidebarSettingsConfig,
	slider: SliderSettingsConfig,
	switch: SwitchSettingsConfig,
	tab: TabSettingsConfig,
	text: TextSettingsConfig,
	timepicker: TimePickerSettingsConfig,
	theme: ThemeSettingsConfig,
	"toggle-button": ToggleButtonSettingsConfig,
	upload: UploadSettingsConfig,
	vega: VegaVisualizationSettingsConfig,
	"visualization-filter": VisualizationFilterSettingsConfig,
	"grid-dynamic-frame": GridDynamicFrameSettingsConfig,
};
