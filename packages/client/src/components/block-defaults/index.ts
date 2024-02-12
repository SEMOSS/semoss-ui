import { Registry } from '@/stores';
import { config as BodyBlockConfig, BodyBlockDef } from './body-block';
import { config as ButtonBlockConfig, ButtonBlockDef } from './button-block';
import { config as QueryBlockConfig, QueryBlockDef } from './query-block';
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
    config as BarChartBlockConfig,
    BarChartBlockDef,
} from './bar-chart-block';
import {
    config as GroupedBarChartBlockConfig,
    GroupedBarChartBlockDef,
} from './grouped-bar-chart-block';

export type DefaultBlockDefinitions =
    | BarChartBlockDef
    | BodyBlockDef
    | ButtonBlockDef
    | CheckboxBlockDef
    | ContainerBlockDef
    | DividerBlockDef
    | FooterBlockDef
    | FormBlockDef
    | GroupedBarChartBlockDef
    | HeaderBlockDef
    | IframeBlockDef
    | ImageBlockDef
    | LinkBlockDef
    | MarkdownBlockDef
    | PageBlockDef
    | QueryBlockDef
    | SelectBlockDef
    | TableBlockDef
    | TextBlockDef
    | InputBlockDef
    | SectionBlockDef
    | UploadBlockDef
    | VegaVisualizationBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [BarChartBlockConfig.widget]: BarChartBlockConfig,
    [ButtonBlockConfig.widget]: ButtonBlockConfig,
    [CheckboxBlockConfig.widget]: CheckboxBlockConfig,
    [ContainerBlockConfig.widget]: ContainerBlockConfig,
    [GroupedBarChartBlockConfig.widget]: GroupedBarChartBlockConfig,
    [ImageBlockConfig.widget]: ImageBlockConfig,
    [InputBlockConfig.widget]: InputBlockConfig,
    [LinkBlockConfig.widget]: LinkBlockConfig,
    [MarkdownBlockConfig.widget]: MarkdownBlockConfig,
    [PageBlockConfig.widget]: PageBlockConfig,
    [QueryBlockConfig.widget]: QueryBlockConfig,
    [SelectBlockConfig.widget]: SelectBlockConfig,
    [TextBlockConfig.widget]: TextBlockConfig,
    [UploadBlockConfig.widget]: UploadBlockConfig,
    [VegaVisualizationBlockConfig.widget]: VegaVisualizationBlockConfig,
};

export function getIconForBlock(widget: string) {
    return DefaultBlocks[widget]?.icon;
}

export {
    BarChartBlockConfig,
    ButtonBlockConfig,
    ContainerBlockConfig,
    CheckboxBlockConfig,
    GroupedBarChartBlockConfig,
    ImageBlockConfig,
    InputBlockConfig,
    MarkdownBlockConfig,
    PageBlockConfig,
    SelectBlockConfig,
    TextBlockConfig,
    UploadBlockConfig,
    VegaVisualizationBlockConfig,
};
