import { CSSProperties } from 'react';

import { useBlock } from '@/hooks';
import { Widget, WidgetDef } from '@/stores';
import { Slot } from '@/components/canvas';

export interface PageWidgetDef extends WidgetDef<'page'> {
    widget: 'page';
    data: {
        style: CSSProperties;
    };
    slots: 'content';
}

export const PageWidget: Widget<PageWidgetDef> = ({ id }) => {
    const { attrs, data, slots } = useBlock<PageWidgetDef>(id);

    return (
        <div style={data.style} {...attrs}>
            <Slot slot={slots.content}></Slot>
        </div>
    );
};

PageWidget.widget = 'page';

PageWidget.config = {
    data: {
        style: {},
    },
    listeners: {},
    slots: {
        content: [],
    },
};
