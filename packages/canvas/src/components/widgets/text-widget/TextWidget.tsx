import { CSSProperties } from 'react';

import { useBlock } from '@/hooks';
import { Widget, WidgetDef } from '@/stores';

export interface TextWidgetDef extends WidgetDef<'text'> {
    widget: 'text';
    data: {
        style: CSSProperties;
        text: string;
    };
    slots: never;
}

export const TextWidget: Widget<TextWidgetDef> = ({ id }) => {
    const { data } = useBlock<TextWidgetDef>(id);

    return <span>{data.text}</span>;
};

TextWidget.widget = 'text';

TextWidget.config = {
    data: {
        style: {},
        text: 'Hello world',
    },
    listeners: {},
    slots: {
        test: [],
    },
};
