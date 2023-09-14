import { WidgetRegistry } from '@/stores';

import { PageWidget, PageWidgetDef } from './page-widget';
import { TextWidget, TextWidgetDef } from './text-widget';

export type WidgetDefinitions = PageWidgetDef | TextWidgetDef;

export const Widgets: WidgetRegistry<WidgetDefinitions> = {
    [PageWidget.widget]: PageWidget,
    [TextWidget.widget]: TextWidget,
};
