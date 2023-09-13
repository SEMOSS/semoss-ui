import { WidgetRegistry } from '@/stores';

import { PageWidget, PageWidgetDef } from './page-widget';
import { TextWidget, TextWidgetDef } from './text-widget';

export const Widgets: WidgetRegistry<PageWidgetDef | TextWidgetDef> = {
    [PageWidget.widget]: PageWidget,
    [TextWidget.widget]: TextWidget,
};
