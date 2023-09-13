import { CSSProperties } from 'react';

import { useBlock } from '@/hooks';
import { Widget, WidgetDef } from '@/stores';
import { Renderer } from '@/components/canvas';

export interface PageWidgetDef extends WidgetDef<'page'> {
    widget: 'page';
    data: {
        style: CSSProperties;
    };
    slots: 'content';
}

export const PageWidget: Widget<PageWidgetDef> = ({ id }) => {
    const { data, slots } = useBlock<PageWidgetDef>(id);

    return (
        <div style={data.style}>
            {slots.content.children.map((c) => (
                <Renderer key={c} id={c} />
            ))}
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
